#!/usr/bin/env python3
"""Relief réel des petits mondes : cartes de normales (est, nord, haut) calculées depuis l'altimétrie publiée par l'USGS.

Même format que lune-relief et mars-relief : équirectangulaire 2:1, longitude 0 au centre, nord en haut ;
R = 0,5 + 0,5 × normale vers l'est, V = vers le nord, B = vers le haut ; pentes réelles, sans exagération.
Sorties : textures/<id>-relief-4k.jpg et -2k.jpg, plus un rapport data/relief-report.md.

Sources (USGS Astrogeology, « Please cite authors ») :
  Mercure  MESSENGER, DEM global 665 m v2 (Becker et al. 2016)
  Pluton   New Horizons LORRI-MVIC, DEM global 300 m (Schenk et al. 2018) — un seul hémisphère couvert
  Charon   New Horizons LORRI-MVIC, DEM global 300 m (Schenk et al. 2018)
  Cérès    Dawn FC HAMO, DTM DLR 60 px/° (Preusker et al. 2016)
Exécuté par la tâche GitHub « Relief des petits mondes » (le bac à sable de développement ne joint pas l'USGS).
"""
import math, os, sys, time, urllib.request
import numpy as np
from PIL import Image

BASE = 'https://planetarymaps.usgs.gov/mosaic/'
SOURCES = [
    ('mercure', 'Mercury_Messenger_USGS_DEM_Global_665m_v2.tif', 2439400.0),
    ('pluton', 'Pluto_NewHorizons_Global_DEM_300m_Jul2017_16bit.tif', 1188300.0),
    ('charon', 'Charon_NewHorizons_Global_DEM_300m_Jul2017_16bit.tif', 606000.0),
]
# Pluton et Charon : les données commencent à 0° au bord gauche bien que l'en-tête annonce −180° (vérifié le 8/11/2026 :
# sans ce décalage, Spoutnik Planitia tombait au centre de la carte au lieu du bord, à l'opposé de la carte couleur)
FORCE_ROLL = {'pluton', 'charon'}
SOURCES += [
    ('ceres', 'Ceres_Dawn_FC_HAMO_DTM_DLR_Global_60ppd_Oct2016.tif', 470000.0),
]
W4, H4 = 4096, 2048
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
CACHE = os.environ.get('RELIEF_CACHE', '/tmp/relief')
report = ['# Relief des petits mondes', '', 'Généré le ' + time.strftime('%Y-%m-%d %H:%M UTC', time.gmtime()), '']


def fetch(name):
    os.makedirs(CACHE, exist_ok=True)
    path = os.path.join(CACHE, name)
    if not os.path.exists(path):
        print('téléchargement', name, flush=True)
        req = urllib.request.Request(BASE + name, headers={'User-Agent': 'observatoire-relief/1.0'})
        with urllib.request.urlopen(req, timeout=600) as r, open(path + '.part', 'wb') as f:
            while True:
                b = r.read(1 << 22)
                if not b: break
                f.write(b)
        os.rename(path + '.part', path)
    return path


def read_small(path):
    """Lit l'altimétrie réduite à 4096 × 2048 (moyenne), avec masque des pixels sans donnée."""
    import rasterio
    from rasterio.enums import Resampling
    with rasterio.open(path) as src:
        nod = src.nodata
        a = src.read(1, out_shape=(H4, W4), resampling=Resampling.average, masked=True).astype('float64')
        b = src.bounds
        info = dict(w=src.width, h=src.height, nodata=nod, left=b.left, right=b.right, crs=str(src.crs)[:120])
    mask = np.ma.getmaskarray(a)
    data = np.ma.filled(a, np.nan)
    if nod is None:                               # certains fichiers marquent l'absence de donnée par −32768 sans le déclarer
        data[data <= -32000] = np.nan
    return data, info


def normals(h, R):
    """Normale (est, nord, haut) sur une sphère de rayon R, depuis une grille d'altitudes en mètres (nord en haut)."""
    H, W = h.shape
    lat = (90 - (np.arange(H) + .5) * 180 / H) * math.pi / 180
    dx = (2 * math.pi * R / W) * np.cos(lat)[:, None]        # mètres par pixel vers l'est
    dy = math.pi * R / H                                     # mètres par pixel vers le nord
    hf = np.where(np.isnan(h), np.nanmean(h), h)
    e = (np.roll(hf, -1, axis=1) - np.roll(hf, 1, axis=1)) / (2 * np.maximum(dx, 1.0))
    n = np.zeros_like(hf); n[1:-1] = (hf[:-2] - hf[2:]) / (2 * dy)        # rang du dessus = plus au nord
    nx, ny, nz = -e, -n, np.ones_like(hf)
    L = np.sqrt(nx * nx + ny * ny + nz * nz); nx /= L; ny /= L; nz /= L
    hole = np.isnan(h)
    for k in (np.roll(hole, 1, 0), np.roll(hole, -1, 0), np.roll(hole, 1, 1), np.roll(hole, -1, 1)): hole |= k
    nx[hole] = 0; ny[hole] = 0; nz[hole] = 1                  # sans donnée : sphère lisse
    return nx, ny, nz, hole


def save(nx, ny, nz, base):
    rgb = np.stack([(nx * .5 + .5), (ny * .5 + .5), (nz * .5 + .5)], axis=-1)
    img = Image.fromarray(np.clip(np.round(rgb * 255), 0, 255).astype('uint8'), 'RGB')
    img.save(os.path.join(ROOT, 'textures', base + '-relief-4k.jpg'), quality=90, optimize=True, progressive=True)
    img.resize((2048, 1024), Image.LANCZOS).save(os.path.join(ROOT, 'textures', base + '-relief-2k.jpg'), quality=88, optimize=True, progressive=True)


ok = 0
for bid, name, R in SOURCES:
    try:
        path = fetch(name)
        h, info = read_small(path)
        # longitude 0 au centre : les fichiers USGS commencent souvent à 0° au bord gauche
        span = info['right'] - info['left']
        left_deg = info['left'] / span * 360 if span else 0
        if abs(left_deg) < 5 or bid in FORCE_ROLL:
            h = np.roll(h, W4 // 2, axis=1); shift = 'décalé de 180° (0° au bord gauche à l\'origine)'
        else:
            shift = 'déjà centré (bord gauche à %.0f°)' % left_deg
        # forme générale retirée : Cérès est aplatie aux pôles (± 15 km), ce qui inclinait toutes les pentes vers les pôles ;
        # on enlève la moyenne de chaque latitude (lissée), il ne reste que le relief local
        zon = np.nanmean(h, axis=1)
        if np.isfinite(zon).sum() > 10:
            idx = np.arange(len(zon)); ok_ = np.isfinite(zon)
            zon = np.interp(idx, idx[ok_], zon[ok_]); k_ = np.ones(41) / 41
            zon = np.convolve(np.pad(zon, 20, mode='edge'), k_, mode='valid')
            h = h - zon[:, None]
        nx, ny, nz, hole = normals(h, R)
        save(nx, ny, nz, bid)
        cov = 100 * (1 - hole.mean())
        slope = np.degrees(np.arccos(np.clip(nz[~hole], -1, 1))) if (~hole).any() else np.array([0])
        report += ['## ' + bid, '- source : `' + name + '` (%d × %d px)' % (info['w'], info['h']),
                   '- altitudes : %.0f à %.0f m' % (np.nanmin(h), np.nanmax(h)), '- couverture : %.0f %%' % cov,
                   '- longitude : ' + shift, '- pente médiane à cette résolution : %.2f°, 99e centile %.1f°' % (np.median(slope), np.percentile(slope, 99)), '']
        print(bid, 'ok', flush=True); ok += 1
    except Exception as ex:
        report += ['## ' + bid, '- ÉCHEC : ' + repr(ex)[:300], '']
        print(bid, 'échec', ex, file=sys.stderr, flush=True)

open(os.path.join(ROOT, 'data', 'relief-report.md'), 'w').write('\n'.join(report) + '\n')
print(ok, '/', len(SOURCES), 'cartes')

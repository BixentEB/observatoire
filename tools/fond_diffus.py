#!/usr/bin/env python3
"""Carte du rayonnement fossile (fond diffus cosmologique) pour la sphère du bord de l'Univers observable.

Source : Wikimedia Commons, « Cosmic Microwave Background (CMB).jpeg », ESA et la collaboration Planck
(via NSF NOIRLab), licence CC BY 4.0 : carte des anisotropies de température mesurées par Planck, en projection de
Mollweide, coordonnées galactiques (l = 0 au centre, l croissant vers la gauche).
Le script lit la licence et l'auteur sur Commons, télécharge une version de 2048 px, repère l'ellipse de la carte
(tout ce qui diffère de la couleur des coins), puis la reprojette en équirectangulaire (2048 × 1024 : longitude
galactique de +180° à gauche à −180° à droite, latitude +90° en haut), prête à être posée sur une sphère.
Sortie : assets/img/fond-diffus.webp et data/fond-diffus.json (crédits). Rapport : data/fond-diffus-report.md.
Exécuté par la tâche GitHub « Catalogues de galaxies » (numpy et Pillow).
"""
import io, json, math, os, time, urllib.parse, urllib.request
import numpy as np
from PIL import Image

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
UA = 'ObservatoireCodexMental/1.0 (https://obs.codexmental.com ; https://github.com/BixentEB/observatoire)'
FILE = 'Cosmic Microwave Background (CMB).jpeg'
log = []

def get(url, params=None, raw=False):
    if params: url += '?' + urllib.parse.urlencode(params)
    with urllib.request.urlopen(urllib.request.Request(url, headers={'User-Agent': UA}), timeout=120) as r:
        b = r.read()
    return b if raw else json.loads(b.decode('utf-8'))

j = get('https://commons.wikimedia.org/w/api.php', {'action': 'query', 'titles': 'File:' + FILE, 'prop': 'imageinfo', 'iiprop': 'url|extmetadata|size', 'iiurlwidth': 2048, 'format': 'json'})
page = next(iter(j['query']['pages'].values()))
ii = page['imageinfo'][0]; md = ii.get('extmetadata', {})
def mv(k): return (md.get(k) or {}).get('value', '')
lic, art = mv('LicenseShortName'), mv('Artist')
log.append('Commons : %s × %s px, licence %s, auteur %s' % (ii.get('width'), ii.get('height'), lic, art))
src = Image.open(io.BytesIO(get(ii.get('thumburl') or ii['url'], raw=True))).convert('RGB')
A = np.asarray(src).astype(np.float32); H, W = A.shape[:2]
corner = np.median(np.concatenate([A[:8, :8].reshape(-1, 3), A[:8, -8:].reshape(-1, 3), A[-8:, :8].reshape(-1, 3), A[-8:, -8:].reshape(-1, 3)]), axis=0)
mask = np.abs(A - corner).sum(axis=2) > 60
ys, xs = np.nonzero(mask)
x0, x1, y0, y1 = xs.min(), xs.max(), ys.min(), ys.max()
cx, cy, rx, ry = (x0 + x1) / 2, (y0 + y1) / 2, (x1 - x0) / 2, (y1 - y0) / 2
rx, ry = rx * .985, ry * .975          # léger retrait : le bord de l'ellipse est assombri sur l'image, on ne l'échantillonne pas
log.append('image %d × %d, fond %s, ellipse x %d–%d, y %d–%d (rapport %.3f, attendu 2)' % (W, H, corner.round().tolist(), x0, x1, y0, y1, rx / ry))

OW, OH = 2048, 1024
lon = (0.5 - (np.arange(OW) + .5) / OW) * 2 * math.pi        # +π à gauche … −π à droite
lat = (0.5 - (np.arange(OH) + .5) / OH) * math.pi            # +π/2 en haut
LON, LAT = np.meshgrid(lon, lat)
th = LAT.copy()                                               # Mollweide : 2θ + sin 2θ = π sin φ (Newton)
for _ in range(30):
    f = 2 * th + np.sin(2 * th) - math.pi * np.sin(LAT)
    th -= f / (2 + 2 * np.cos(2 * th) + 1e-9)
X = (2 * math.sqrt(2) / math.pi) * LON * np.cos(th) / (2 * math.sqrt(2))   # dans [−1, 1]
Y = math.sqrt(2) * np.sin(th) / math.sqrt(2)                                # dans [−1, 1]
# l croissant vers la gauche sur la carte : x image = centre − X × rx
px = np.clip(np.round(cx - X * rx), 0, W - 1).astype(int)
py = np.clip(np.round(cy - Y * ry), 0, H - 1).astype(int)
out = A[py, px].astype(np.uint8)
os.makedirs(os.path.join(ROOT, 'assets', 'img'), exist_ok=True)
Image.fromarray(out).save(os.path.join(ROOT, 'assets', 'img', 'fond-diffus.webp'), 'WEBP', quality=86)
json.dump({'fichier': FILE, 'page': ii.get('descriptionurl'), 'licence': lic, 'auteur': 'ESA et la collaboration Planck', 'auteur_commons': art,
           'projection': 'équirectangulaire, coordonnées galactiques, l = +180° à gauche, b = +90° en haut', 'genere': time.strftime('%Y-%m-%d', time.gmtime())},
          open(os.path.join(ROOT, 'data', 'fond-diffus.json'), 'w'), ensure_ascii=False, indent=1)
open(os.path.join(ROOT, 'data', 'fond-diffus-report.md'), 'w').write('# Fond diffus (Planck)\n\n' + '\n'.join('- ' + l for l in log) + '\n')
print('\n'.join(log))

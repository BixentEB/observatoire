#!/usr/bin/env python3
"""Laniakea : contour du bassin et lignes d'écoulement.

Sources (projet CosmicFlows, https://projets.ip2i.in2p3.fr/cosmicflows/) :
- Dupuy & Courtois 2023, A&A, « Dynamic cosmography of the local Universe: Laniakea and five more watershed
  superclusters » : grille 128³ de 1000 Mpc/h de côté, chaque voxel porte le numéro de son bassin d'attraction
  (1 = Laniakea) → CF4_new_128-z008_watersheds-fits.zip.
- Courtois et al. 2023, champ de vitesses CosmicFlows-4 : grille 64³ (axes SGZ, SGY, SGX), vitesses × 52 km/s
  → CF4_new_64-z008_velocity.fits.

Unités : les grilles sont en Mpc/h. Une distance en Mpc/h vaut cz / 100 km/s ; l'Observatoire place les galaxies du
relevé 2MRS à cz / 70 (H0 = 70). Pour que tout coïncide, on multiplie les positions des grilles par 100 / 70.

Contrôles écrits dans le rapport : orientation de la grille choisie pour placer correctement 7 amas connus (dedans / dehors) ; notre position (centre de la grille) doit être dans le bassin 1 ; le volume de
Laniakea doit valoir ≈ 2 × 10⁶ (Mpc/h)³ ; l'ordre des composantes de vitesse est choisi comme celui pour lequel les lignes
d'écoulement partant de Laniakea y restent (un bassin d'attraction est, par définition, ce qui s'écoule vers son attracteur).

Sortie : data/laniakea-bassin.json = {meta, bord: [[x, y, z]…], coupe: {dessus: [[x, y]…], cote: [[x, z]…]}, flux: [[[x, y, z]…]…]}
  positions supergalactiques en dixièmes de Mpc (H0 = 70), entiers.
Rapport : data/laniakea-bassin-report.md. Exécuté par la tâche GitHub « Catalogues de galaxies » (numpy et astropy).
"""
import io, itertools, json, os, time, urllib.request, zipfile
import numpy as np
from astropy.io import fits

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
BASE = 'https://projets.ip2i.in2p3.fr/cosmicflows/'
UA = {'User-Agent': 'observatoire-catalogues/1.0'}
K = 100.0 / 70.0          # Mpc/h → Mpc de l'Observatoire (H0 = 70)
log = []

def get(name):
    for b in (BASE, BASE.replace('cosmicflows/', '/cosmicflows/')):
        try:
            with urllib.request.urlopen(urllib.request.Request(b + name, headers=UA), timeout=300) as r:
                raw = r.read()
            log.append('%s : %d octets' % (name, len(raw))); print(log[-1], flush=True); return raw
        except Exception as ex:
            log.append('échec %s%s : %r' % (b, name, ex)); print(log[-1], flush=True)
    return None

def hdr(h):
    keys = [k for k in ('NAXIS', 'NAXIS1', 'NAXIS2', 'NAXIS3', 'NAXIS4', 'CRPIX1', 'CRVAL1', 'CDELT1', 'CTYPE1', 'CTYPE2', 'CTYPE3', 'CTYPE4', 'BUNIT', 'OBJECT') if k in h]
    return ', '.join('%s=%s' % (k, h[k]) for k in keys)

# ---------- bassins ----------
raw = get('CF4_new_128-z008_watersheds-fits.zip')
lab = None
if raw:
    z = zipfile.ZipFile(io.BytesIO(raw))
    names = z.namelist(); log.append('archive : ' + ', '.join(names))
    cands = [n for n in names if n.lower().endswith(('.fits', '.fit', '.fits.gz'))]
    # bassins d'attraction (pas de répulsion), champ des galaxies (pas des groupes) si les deux existent
    def score(n):
        l = n.lower(); return (('attract' in l) * 4 + ('repul' not in l) * 2 + ('gp' not in l), -len(n))
    cands.sort(key=score, reverse=True)
    for n in cands:
        with z.open(n) as f:
            hd = fits.open(io.BytesIO(f.read()))
            for i, u in enumerate(hd):
                if u.data is not None: log.append('%s [%d] forme %s, type %s ; %s' % (n, i, u.data.shape, u.data.dtype, hdr(u.header)))
    for n in cands:
        with z.open(n) as f:
            hd = fits.open(io.BytesIO(f.read()))
        d = next((u.data for u in hd if u.data is not None and u.data.ndim == 3), None)
        if d is None: continue
        lab = np.rint(d).astype(int); log.append('**Grille retenue : %s**' % n); break

# ---------- orientation de la grille : contrôle par des amas connus ----------
# dans Laniakea (Tully et al. 2014, Dupuy & Courtois 2023) : Vierge, Centaure, Hydre, Règle ; hors de Laniakea : Persée, Coma, Shapley.
# positions supergalactiques (Mpc/h ≈ cz / 100) tirées des vitesses publiées, comme dans tools/laniakea.py
TEST = [('Vierge', (-2.4, 10.7, -0.4), 1), ('Centaure', (-30.7, 13.4, -6.8), 1), ('Hydre', (-22.8, 19.5, -23.0), 1), ('Règle', (-47.9, -6.9, 6.0), 1),
        ('Persée', (50.8, -10.9, -13.2), 0), ('Coma', (0.5, 68.5, 10.0), 0), ('Shapley', (-124.1, 74.9, -3.4), 0)]
ORIENT = None
if lab is not None:
    N = lab.shape[0]; cell = 1000.0 / N; c = N / 2.0
    def idx(q): return int(min(N - 1, max(0, np.floor(q / cell + c))))
    best = None
    for perm in itertools.permutations(range(3)):          # quel axe de la grille porte SGX, SGY, SGZ
        for flip in itertools.product((1, -1), repeat=3):
            sc = 0
            for nm, p, inside in TEST:
                ii = [None] * 3
                for k in range(3): ii[perm[k]] = idx(flip[k] * p[k])
                sc += int((lab[ii[0], ii[1], ii[2]] == 1) == bool(inside))
            if sc == len(TEST): log.append('orientation possible : axes %s, signes %s' % (perm, flip))
            if best is None or sc > best[0]: best = (sc, perm, flip)
    ORIENT = best
    log.append('**Orientation : SGX, SGY, SGZ sur les axes %s de la grille, signes %s : %d / %d amas bien placés**' % (best[1], best[2], best[0], len(TEST)))

out = {}
if lab is not None and ORIENT:
    perm, flip = ORIENT[1], ORIENT[2]
    # on remet la grille dans l'ordre (SGZ, SGY, SGX) : axe de la grille portant SGZ d'abord, puis SGY, puis SGX
    lab = np.transpose(lab, (perm[2], perm[1], perm[0]))
    for k, ax in ((2, 0), (1, 1), (0, 2)):
        if flip[k] < 0: lab = np.flip(lab, axis=ax)
if lab is not None:
    N = lab.shape[0]; cell = 1000.0 / N; c = N / 2.0          # observateur au centre de la grille
    me = lab[N // 2, N // 2, N // 2]
    vox = (lab == 1)
    for nm, p, inside in TEST:
        ii = [int(min(N - 1, max(0, np.floor(q / cell + c)))) for q in p]
        log.append('%s : bassin %d (attendu %s)' % (nm, lab[ii[2], ii[1], ii[0]], 'Laniakea' if inside else 'autre'))
    log.append('Notre voxel est dans le bassin %d (attendu : 1) ; Laniakea = %d voxels, %.2e (Mpc/h)³ (attendu ≈ 2e6)' % (me, vox.sum(), vox.sum() * cell ** 3))
    def pos(iz, iy, ix):   # indices (SGZ, SGY, SGX) → position en Mpc de l'Observatoire
        return ((ix + .5 - c) * cell * K, (iy + .5 - c) * cell * K, (iz + .5 - c) * cell * K)
    zz, yy, xx = np.nonzero(vox)
    cen = pos(zz.mean(), yy.mean(), xx.mean()); log.append('Centre de Laniakea (SGX, SGY, SGZ) : %.0f, %.0f, %.0f Mpc' % cen)
    # bord : voxels de Laniakea dont un voisin n'en est pas
    pad = np.pad(vox, 1)
    inner = pad[1:-1, 1:-1, 1:-1] & pad[:-2, 1:-1, 1:-1] & pad[2:, 1:-1, 1:-1] & pad[1:-1, :-2, 1:-1] & pad[1:-1, 2:, 1:-1] & pad[1:-1, 1:-1, :-2] & pad[1:-1, 1:-1, 2:]
    bz, by, bx = np.nonzero(vox & ~inner)
    out['bord'] = [[round(v * 10) for v in pos(a, b_, d_)] for a, b_, d_ in zip(bz, by, bx)]
    m = N // 2
    out['coupe'] = {'dessus': [[round(pos(m, a, b_)[0] * 10), round(pos(m, a, b_)[1] * 10)] for a, b_ in zip(*np.nonzero(vox[m]))],
                    'cote': [[round(pos(a, m, b_)[0] * 10), round(pos(a, m, b_)[2] * 10)] for a, b_ in zip(*np.nonzero(vox[:, m, :]))],
                    'cellule': round(cell * K * 10)}
    log.append('Bord : %d voxels ; coupes : %d (dessus), %d (côté)' % (len(out['bord']), len(out['coupe']['dessus']), len(out['coupe']['cote'])))

    # ---------- vitesses et lignes d'écoulement ----------
    rawv = get('CF4_new_64-z008_velocity.fits')
    if rawv:
        hv = fits.open(io.BytesIO(rawv))
        V = None
        for i, u in enumerate(hv):
            if u.data is not None:
                log.append('vitesses [%d] forme %s ; %s' % (i, u.data.shape, hdr(u.header)))
                if V is None and u.data.ndim == 4: V = np.asarray(u.data, dtype=float) * 52.0
        if V is not None:
            if V.shape[0] != 3: V = np.moveaxis(V, -1, 0)
            if ORIENT:   # même orientation que la grille des bassins (même équipe, même convention)
                perm, flip = ORIENT[1], ORIENT[2]
                V = np.transpose(V, (0, perm[2] + 1, perm[1] + 1, perm[0] + 1))
                for k, ax in ((2, 1), (1, 2), (0, 3)):
                    if flip[k] < 0: V = np.flip(V, axis=ax)
            M = V.shape[1]; vcell = 1000.0 / M; vc = M / 2.0
            def vel(p, perm, sgn):      # p = (sgx, sgy, sgz) en Mpc/h ; interpolation au plus proche voisin
                ix, iy, iz = [int(min(M - 1, max(0, np.floor(q / vcell + vc)))) for q in p]
                w = V[:, iz, iy, ix]; return np.array([sgn[k] * w[perm[k]] for k in range(3)])
            def inbasin(p):
                ix, iy, iz = [int(min(N - 1, max(0, np.floor(q / cell + c)))) for q in p]
                return vox[iz, iy, ix]
            rng = np.random.default_rng(1)
            seeds_i = rng.choice(len(xx), size=min(160, len(xx)), replace=False)            # départs répartis dans tout Laniakea
            seeds = [np.array([(xx[s] + .5 - c) * cell, (yy[s] + .5 - c) * cell, (zz[s] + .5 - c) * cell]) for s in seeds_i]
            def stream(p, perm, sgn, steps=120, h=3.0):
                line = [p.copy()]
                for _ in range(steps):
                    v = vel(p, perm, sgn); s = np.linalg.norm(v)
                    if s < 1e-6: break
                    mid = p + v / s * h / 2; v2 = vel(mid, perm, sgn); s2 = np.linalg.norm(v2)
                    if s2 < 1e-6: break
                    p = p + v2 / s2 * h; line.append(p.copy())
                    if np.max(np.abs(p)) > 480: break
                return line
            best = None
            for perm in itertools.permutations(range(3)):
                for sgn in set([(1, 1, 1), tuple(ORIENT[2]) if ORIENT else (1, 1, 1)]):
                    ok = 0
                    for p in seeds[:60]:
                        L = stream(p, perm, sgn, steps=60)
                        if inbasin(L[-1]): ok += 1
                    log.append('composantes %s, signes %s : %d / 60 lignes restent dans Laniakea' % (perm, sgn, ok))
                    if best is None or ok > best[0]: best = (ok, perm, sgn)
            log.append('**Ordre retenu : %s (%d / 60)**' % (best[1], best[0]))
            flux = []
            for p in seeds:
                L = stream(p, best[1], best[2])
                L = [q for q in L if inbasin(q)] if inbasin(L[-1]) else []
                if len(L) >= 6: flux.append([[round(q[k] * K * 10) for k in range(3)] for q in L[::2]])
            out['flux'] = flux; out['flux_ok'] = best[0]
            log.append('%d lignes d\'écoulement gardées' % len(flux))

meta = {'source': 'Dupuy & Courtois 2023 (A&A), bassins d\'attraction du champ de vitesses CosmicFlows-4 ; Courtois et al. 2023, champ de vitesses CF4 (projet CosmicFlows)',
        'genere': time.strftime('%Y-%m-%d', time.gmtime()), 'unites': 'dixièmes de Mpc, repère supergalactique, distances à l\'échelle H0 = 70 (grilles en Mpc/h × 100/70)'}
if out.get('bord'):
    json.dump(dict(meta=meta, **out), open(os.path.join(ROOT, 'data', 'laniakea-bassin.json'), 'w'), ensure_ascii=False, separators=(',', ':'))
open(os.path.join(ROOT, 'data', 'laniakea-bassin-report.md'), 'w').write('# Laniakea : contour et écoulements\n\n' + '\n'.join('- ' + l for l in log) + '\n')
print('\n'.join(log))

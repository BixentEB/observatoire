#!/usr/bin/env python3
"""Niveau 7 de la règle des échelles : Laniakea.

Source : le relevé 2MASS Redshift Survey (2MRS), Huchra et al. 2012, ApJS 199, 26 (CDS J/ApJS/199/26) :
≈ 44 600 galaxies brillantes dans l'infrarouge (Ks ≤ 11,75), sur presque tout le ciel.
Pour chaque galaxie : direction (coordonnées galactiques), vitesse d'éloignement cz, magnitude Ks.
Distance tirée de la vitesse (loi de Hubble, H0 = 70 km/s/Mpc) : c'est une approximation, signalée dans l'Observatoire
(les mouvements propres des galaxies, jusqu'à quelques centaines de km/s, déforment surtout les régions proches et les amas).
On garde les galaxies jusqu'à cz = 20 000 km/s (≈ 290 Mpc, ≈ 930 millions d'années-lumière).
Effet de sélection : plus on va loin, plus seules les galaxies les plus brillantes sont recensées.
Zone d'évitement : le relevé évite le plan de la Voie lactée (|b| < 5° à 8°) : une lacune de données, pas un vide.

Sortie compacte : data/laniakea.json = {meta, g: [[x, y, z, k], …], amas: [...]}
  x, y, z = position supergalactique en dixièmes de Mpc (entiers), k = magnitude Ks × 10 (entier).
Rapport : data/laniakea-report.md. Exécuté par la tâche GitHub « Catalogues de galaxies ».
"""
import json, math, os, time, urllib.parse, urllib.request

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
UA = {'User-Agent': 'observatoire-catalogues/1.0'}
H0, CZMAX = 70.0, 20000.0
MIRRORS = ['https://vizier.cds.unistra.fr', 'https://vizier.cfa.harvard.edu', 'https://vizier.nao.ac.jp', 'https://vizier.iucaa.in']
log = []

def unit(l, b):
    l, b = math.radians(l), math.radians(b); return [math.cos(b) * math.cos(l), math.cos(b) * math.sin(l), math.sin(b)]
# axes supergalactiques exprimés en coordonnées galactiques (de Vaucouleurs) : pôle SGZ (l = 47,37°, b = 6,32°), SGX vers (137,37°, 0°)
SZ, SX = unit(47.37, 6.32), unit(137.37, 0)
SY = [SZ[1] * SX[2] - SZ[2] * SX[1], SZ[2] * SX[0] - SZ[0] * SX[2], SZ[0] * SX[1] - SZ[1] * SX[0]]
def sg(l, b, d):
    g = unit(l, b); return [d * sum(g[k] * V[k] for k in range(3)) for V in (SX, SY, SZ)]

def num(v):
    try: return float(v)
    except Exception: return None

def vizier(table):
    q = urllib.parse.urlencode({'-source': 'J/ApJS/199/26/' + table, '-out.max': 'unlimited', '-out.all': '', '-out.add': '_Glon,_Glat', '-oc.form': 'd'})
    for m in MIRRORS:
        try:
            with urllib.request.urlopen(urllib.request.Request(m + '/viz-bin/asu-tsv?' + q, headers=UA), timeout=240) as r:
                txt = r.read().decode('utf-8', 'replace')
            lines = [l for l in txt.splitlines() if l and not l.startswith('#')]
            if len(lines) < 4: log.append('%s %s : réponse vide' % (m, table)); continue
            head = [h.strip() for h in lines[0].split('\t')]
            rows = [dict(zip(head, [x.strip() for x in l.split('\t')])) for l in lines[3:] if '\t' in l]
            log.append('%s %s : %d lignes ; colonnes %s' % (m, table, len(rows), ', '.join(head))); print(log[-1], flush=True)
            return head, rows
        except Exception as ex:
            log.append('échec %s %s : %r' % (m, table, ex)); print(log[-1], flush=True)
    return None

def pick(head, *names):
    low = {h.lower(): h for h in head}
    for n in names:
        if n.lower() in low: return low[n.lower()]
    return None

out, used = [], None
for t in ['table3', 'table2', 'table1']:
    r = vizier(t)
    if not r: continue
    head, rows = r
    c_l, c_b = pick(head, '_Glon', 'GLON'), pick(head, '_Glat', 'GLAT')
    c_v = pick(head, 'cz', 'v', 'HV', 'Vh', 'czhel', 'Vel')
    c_k = pick(head, 'Kcmag', 'Ksmag', 'Kmag', 'K_c', 'Ktmag', 'Ks')
    log.append('%s : l %s, b %s, vitesse %s, magnitude %s' % (t, c_l, c_b, c_v, c_k))
    if not (c_l and c_b and c_v) or len(rows) < 20000: continue
    used = t
    for row in rows:
        l, b, v = num(row.get(c_l)), num(row.get(c_b)), num(row.get(c_v))
        if l is None or b is None or v is None or v <= 0 or v > CZMAX: continue
        x, y, z = sg(l, b, v / H0)
        k = num(row.get(c_k)) if c_k else None
        out.append([round(x * 10), round(y * 10), round(z * 10), round((k if k is not None else 11.75) * 10)])
    break

# amas et superamas nommés : directions galactiques et vitesses publiées (NED), distance par la même loi de Hubble
AMAS = [
    ('vierge', 'Amas de la Vierge', 283.78, 74.49, 1100, 'Le cœur de notre Superamas local, à 54 millions d\'al'),
    ('centaure', 'Amas du Centaure', 302.40, 21.56, 3418, 'Une des concentrations qui tirent le Groupe local vers le Grand Attracteur'),
    ('hydre', 'Amas de l\'Hydre', 269.60, 26.51, 3777, 'Abell 1060'),
    ('norma', 'Amas de la Règle (Grand Attracteur)', 325.33, -7.26, 4871, 'Abell 3627, au cœur du Grand Attracteur, à demi caché par la Voie lactée'),
    ('persee', 'Amas de Persée', 150.57, -13.26, 5366, 'Abell 426, nœud du superamas de Persée-Poissons'),
    ('coma', 'Amas de Coma', 58.08, 87.96, 6925, 'Abell 1656, plus d\'un millier de galaxies'),
    ('shapley', 'Concentration de Shapley', 311.99, 30.73, 14500, 'La plus grande concentration de galaxies du voisinage, au-delà de Laniakea'),
]
amas = []
for i, nm, l, b, v, s in AMAS:
    x, y, z = sg(l, b, v / H0)
    amas.append({'id': i, 'n': nm, 'x': round(x, 1), 'y': round(y, 1), 'z': round(z, 1), 'v': v, 's': s})

meta = {'source': 'Huchra et al. 2012, « The 2MASS Redshift Survey », ApJS 199, 26 (CDS J/ApJS/199/26, table %s)' % used, 'genere': time.strftime('%Y-%m-%d', time.gmtime()),
        'n': len(out), 'H0': H0, 'czmax': CZMAX,
        'unites': 'g = [x, y, z, k] : position supergalactique en dixièmes de Mpc, magnitude Ks × 10 ; distances tirées de la vitesse (cz / H0)'}
if len(out) > 20000:
    json.dump({'meta': meta, 'g': out, 'amas': amas}, open(os.path.join(ROOT, 'data', 'laniakea.json'), 'w'), ensure_ascii=False, separators=(',', ':'))
open(os.path.join(ROOT, 'data', 'laniakea-report.md'), 'w').write('# Laniakea (2MRS)\n\n' + '\n'.join('- ' + l for l in log) + '\n\n%d galaxies retenues (cz ≤ %d km/s).\n\nAmas nommés : %s\n' % (len(out), CZMAX, '; '.join('%s (%.1f, %.1f, %.1f Mpc)' % (a['n'], a['x'], a['y'], a['z']) for a in amas)))
print('\n'.join(log)); print(len(out), 'galaxies')

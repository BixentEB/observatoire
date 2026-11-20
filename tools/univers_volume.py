#!/usr/bin/env python3
"""Niveau 8, option « Volume » : tout ce que le relevé SDSS a mesuré en 3D, et pas seulement la tranche équatoriale.

Source : Sloan Digital Sky Survey, DR17 (SkyServer, table SpecObj), galaxies à décalage spectral fiable (zWarning = 0),
z de 0,003 à 0,25, sur toute la zone couverte par le relevé (environ un tiers du ciel).
Échantillon : une galaxie sur six (fibres dont le numéro est multiple de 6, réparties au hasard sur chaque plaque),
pour garder la scène fluide ; la structure (filaments, vides) reste intacte.
Interrogé par bandes de 30° d'ascension droite pour rester sous la limite de lignes du service.
Distance comobile : univers plat, H0 = 70 km/s/Mpc, Ωm = 0,3 (comme la tranche).
Sortie : data/univers-volume.json = {meta, g: [ra × 10, dec × 10, distance (Mpc), …]} (entiers, liste à plat).
Rapport : data/univers-volume-report.md. Si le service ne répond pas, le fichier précédent est gardé.
"""
import csv, io, json, math, os, time, urllib.parse, urllib.request

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
UA = {'User-Agent': 'observatoire-catalogues/1.0'}
H0, OM, C, ZMAX, STEP = 70.0, 0.3, 299792.458, 0.25, 6
log = []

def dcom(z, n=200):
    if z <= 0: return 0.0
    f = lambda x: 1.0 / math.sqrt(OM * (1 + x) ** 3 + (1 - OM))
    h = z / n; s = f(0) + f(z) + sum((4 if i % 2 else 2) * f(i * h) for i in range(1, n))
    return C / H0 * s * h / 3
ZT = [i * ZMAX / 500 for i in range(501)]; DT = [dcom(z) for z in ZT]
def dist(z):
    i = min(499, int(z / ZMAX * 500)); t = (z - ZT[i]) / (ZT[i + 1] - ZT[i]); return DT[i] + (DT[i + 1] - DT[i]) * t

def fetch(url, timeout=400):
    with urllib.request.urlopen(urllib.request.Request(url, headers=UA), timeout=timeout) as r: return r.read().decode('utf-8', 'replace')

rows = []
for rel in ('dr17', 'dr16'):
    rows = []; ok = True
    for ra0 in range(0, 360, 30):
        sql = ("SELECT ra, dec, z FROM SpecObj WHERE class = 'GALAXY' AND zWarning = 0 AND z BETWEEN 0.003 AND %g "
               "AND ra >= %d AND ra < %d AND fiberID %% %d = 0" % (ZMAX, ra0, ra0 + 30, STEP))
        try:
            txt = fetch('https://skyserver.sdss.org/%s/SkyServerWS/SearchTools/SqlSearch?' % rel + urllib.parse.urlencode({'cmd': sql, 'format': 'csv'}))
            lines = [l for l in txt.splitlines() if l and not l.startswith('#')]
            got = []
            for r in csv.reader(lines[1:]):
                try: got.append((float(r[0]), float(r[1]), float(r[2])))
                except Exception: pass
            log.append('SkyServer %s, ascension droite %d–%d° : %d galaxies' % (rel, ra0, ra0 + 30, len(got)))
            rows += got; time.sleep(2)
        except Exception as ex:
            log.append('échec SkyServer %s, bande %d° : %r' % (rel, ra0, ex)); ok = False; break
    if ok and len(rows) > 20000: break

out = []
for ra, dec, z in rows: out += [round(ra * 10), round(dec * 10), round(dist(z))]
meta = {'source': 'Sloan Digital Sky Survey (SkyServer), toutes les galaxies à spectre du relevé, z ≤ 0,25, une sur %d' % STEP,
        'genere': time.strftime('%Y-%m-%d', time.gmtime()), 'n': len(out) // 3, 'echantillon': STEP, 'H0': H0, 'Om': OM, 'zmax': ZMAX, 'dmax': round(dcom(ZMAX), 1),
        'unites': 'g = liste à plat de [ascension droite × 10, déclinaison × 10 (degrés), distance comobile (Mpc)]'}
if len(out) // 3 > 20000:
    json.dump({'meta': meta, 'g': out}, open(os.path.join(ROOT, 'data', 'univers-volume.json'), 'w'), ensure_ascii=False, separators=(',', ':'))
open(os.path.join(ROOT, 'data', 'univers-volume-report.md'), 'w').write('# Univers observable, volume SDSS\n\n' + '\n'.join('- ' + l for l in log) + '\n\n%d galaxies retenues (une sur %d).\n' % (len(out) // 3, STEP))
print('\n'.join(log)); print(len(out) // 3, 'galaxies')

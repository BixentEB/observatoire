#!/usr/bin/env python3
"""Niveau 8 de la règle des échelles : l'Univers observable — tranche du relevé SDSS.

Source : Sloan Digital Sky Survey, 16e publication (DR16, Ahumada et al. 2020), galaxies à décalage spectral mesuré.
On garde la bande équatoriale (déclinaison entre −2,5° et +2,5°), la tranche classique où apparaissent la Grande Muraille
de Sloan et les grands vides, jusqu'à z = 0,25.
Interrogation : service TAP du GAVO (table sdssdr16.main, copie de VizieR V/154), puis VizieR en secours.
Distance : distance comobile calculée à partir de z pour un univers plat, H0 = 70 km/s/Mpc, Ωm = 0,3 (modèle standard
arrondi), en Mpc. Sortie : data/univers.json = {meta, g: [[ra × 100, d × 10], …]} (entiers). Rapport : data/univers-report.md.
"""
import csv, io, json, math, os, time, urllib.parse, urllib.request

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
UA = {'User-Agent': 'observatoire-catalogues/1.0'}
H0, OM, C = 70.0, 0.3, 299792.458
ZMAX, DEC = 0.25, 2.5
log = []

def dcom(z, n=200):        # distance comobile (Mpc), univers plat ΛCDM, intégration par la méthode de Simpson
    if z <= 0: return 0.0
    f = lambda x: 1.0 / math.sqrt(OM * (1 + x) ** 3 + (1 - OM))
    h = z / n; s = f(0) + f(z) + sum((4 if i % 2 else 2) * f(i * h) for i in range(1, n))
    return C / H0 * s * h / 3

def fetch(url, data=None, timeout=300):
    req = urllib.request.Request(url, data=data, headers=UA)
    with urllib.request.urlopen(req, timeout=timeout) as r: return r.read().decode('utf-8', 'replace')

rows = None
# 1) TAP du GAVO
try:
    head = fetch('https://dc.g-vo.org/tap/sync?' + urllib.parse.urlencode({'REQUEST': 'doQuery', 'LANG': 'ADQL', 'FORMAT': 'csv', 'QUERY': 'SELECT TOP 1 * FROM sdssdr16.main'}), timeout=120)
    cols = next(csv.reader(io.StringIO(head))); log.append('GAVO, colonnes : ' + ', '.join(cols))
    zc = next((c for c in ('z', 'spec_z', 'zsp', 'redshift') if c in cols), None)
    cc = next((c for c in ('spec_class', 'spcl', 'class') if c in cols), None)
    log.append('décalage : %s, classe : %s' % (zc, cc))
    if zc:
        q = 'SELECT ra, dec, %s AS z FROM sdssdr16.main WHERE dec BETWEEN %g AND %g AND %s BETWEEN 0.003 AND %g' % (zc, -DEC, DEC, zc, ZMAX)
        if cc == 'spec_class': q += " AND spec_class = 'GALAXY'"
        body = urllib.parse.urlencode({'REQUEST': 'doQuery', 'LANG': 'ADQL', 'FORMAT': 'csv', 'MAXREC': '400000', 'QUERY': q}).encode()
        txt = fetch('https://dc.g-vo.org/tap/sync', data=body, timeout=900)
        rd = list(csv.DictReader(io.StringIO(txt)))
        rows = [(float(r['ra']), float(r['z'])) for r in rd if r.get('ra') and r.get('z')]
        log.append('GAVO : %d galaxies' % len(rows))
except Exception as ex:
    log.append('échec GAVO : %r' % ex)

# 2) secours : VizieR
if not rows:
    for m in ['https://vizier.cds.unistra.fr', 'https://vizier.cfa.harvard.edu']:
        try:
            q = urllib.parse.urlencode({'-source': 'V/154/sdss16', '-out.max': '400000', '-out': 'RA_ICRS,DE_ICRS,zsp,spCl', 'DE_ICRS': '%g..%g' % (-DEC, DEC), 'zsp': '0.003..%g' % ZMAX, 'spCl': 'GALAXY', '-oc.form': 'd'})
            txt = fetch(m + '/viz-bin/asu-tsv?' + q, timeout=900)
            lines = [l for l in txt.splitlines() if l and not l.startswith('#')]
            head = [h.strip() for h in lines[0].split('\t')]; log.append('VizieR %s, colonnes : %s' % (m, ', '.join(head)))
            ir, iz = head.index('RA_ICRS'), head.index('zsp')
            rows = []
            for l in lines[3:]:
                p = l.split('\t')
                try: rows.append((float(p[ir]), float(p[iz])))
                except Exception: pass
            log.append('VizieR : %d galaxies' % len(rows)); break
        except Exception as ex:
            log.append('échec VizieR %s : %r' % (m, ex))

# table de distances comobiles (interpolation)
ZT = [i * ZMAX / 500 for i in range(501)]; DT = [dcom(z) for z in ZT]
def dist(z):
    i = min(499, int(z / ZMAX * 500)); t = (z - ZT[i]) / (ZT[i + 1] - ZT[i]); return DT[i] + (DT[i + 1] - DT[i]) * t

out = [[round(ra * 100), round(dist(z) * 10)] for ra, z in (rows or []) if 0.003 <= z <= ZMAX]
meta = {'source': 'Sloan Digital Sky Survey DR16 (Ahumada et al. 2020), galaxies à spectre, déclinaison −2,5° à +2,5°, z ≤ 0,25',
        'genere': time.strftime('%Y-%m-%d', time.gmtime()), 'n': len(out), 'H0': H0, 'Om': OM, 'zmax': ZMAX, 'dmax': round(dcom(ZMAX), 1),
        'unites': 'g = [ascension droite × 100 (degrés), distance comobile × 10 (Mpc)], univers plat H0 = 70, Ωm = 0,3'}
if len(out) > 5000:
    json.dump({'meta': meta, 'g': out}, open(os.path.join(ROOT, 'data', 'univers.json'), 'w'), ensure_ascii=False, separators=(',', ':'))
open(os.path.join(ROOT, 'data', 'univers-report.md'), 'w').write('# Univers observable (SDSS)\n\n' + '\n'.join('- ' + l for l in log) + '\n\n%d galaxies retenues ; distance comobile à z = %.2f : %.0f Mpc.\n' % (len(out), ZMAX, dcom(ZMAX)))
print('\n'.join(log)); print(len(out), 'galaxies')

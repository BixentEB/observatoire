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
T0 = time.time()

# 0) le service SQL officiel du SDSS (SkyServer, DR17), table SpecObj : la source la plus directe
for rel in ('dr17', 'dr16'):
    try:
        sql = ("SELECT ra, z FROM SpecObj WHERE class = 'GALAXY' AND zWarning = 0 AND dec BETWEEN %g AND %g AND z BETWEEN 0.003 AND %g" % (-DEC, DEC, ZMAX))
        txt = fetch('https://skyserver.sdss.org/%s/SkyServerWS/SearchTools/SqlSearch?' % rel + urllib.parse.urlencode({'cmd': sql, 'format': 'csv'}), timeout=400)
        lines = [l for l in txt.splitlines() if l and not l.startswith('#')]
        log.append('SkyServer %s : en-tête %r, %d lignes' % (rel, lines[0][:60] if lines else txt[:200], len(lines)))
        got = []
        for l in lines[1:]:
            p_ = l.split(',')
            try: got.append((float(p_[0]), float(p_[1])))
            except Exception: pass
        if len(got) > 5000: rows = got; log.append('SkyServer %s : %d galaxies' % (rel, len(got))); break
    except Exception as ex:
        log.append('échec SkyServer %s : %r' % (rel, ex))

# 1) VizieR (SDSS DR12, V/147 : colonnes RA_ICRS, DE_ICRS, zsp, spCl) : une seule requête sur la bande équatoriale
for m in ([] if rows else ['https://vizier.cfa.harvard.edu', 'https://vizier.cds.unistra.fr']):
    try:
        q = urllib.parse.urlencode({'-source': 'V/147/sdss12', '-out.max': '400000', '-out': 'RA_ICRS,DE_ICRS,zsp,spCl', 'DE_ICRS': '%g..%g' % (-DEC, DEC), 'zsp': '0.003..%g' % ZMAX, 'spCl': 'GALAXY', '-oc.form': 'd'})
        txt = fetch(m + '/viz-bin/asu-tsv?' + q, timeout=300)
        lines = [l for l in txt.splitlines() if l and not l.startswith('#')]
        if not lines: log.append('VizieR %s : réponse vide ; messages : %r' % (m, [l for l in txt.splitlines() if 'INFO' in l or 'Error' in l or 'ERROR' in l][:5])); continue
        head = [h.strip() for h in lines[0].split('\t')]; log.append('VizieR %s, colonnes : %s' % (m, ', '.join(head)))
        ir, iz = head.index('RA_ICRS'), head.index('zsp')
        got = []
        for l in lines[3:]:
            p_ = l.split('\t')
            try: got.append((float(p_[ir]), float(p_[iz])))
            except Exception: pass
        log.append('VizieR : %d galaxies' % len(got))
        if got: rows = got; break
    except Exception as ex:
        log.append('échec VizieR %s : %r' % (m, ex))

# 2) secours : TAP du GAVO (DR16), par boîtes de 5° pour ménager le serveur, temps limité
def gavo():
    out = []
    head = fetch('https://dc.g-vo.org/tap/sync?' + urllib.parse.urlencode({'REQUEST': 'doQuery', 'LANG': 'ADQL', 'FORMAT': 'csv', 'QUERY': 'SELECT TOP 1 * FROM sdssdr16.main'}), timeout=120)
    cols = next(csv.reader(io.StringIO(head)))
    zc = next((c for c in ('spec_z', 'zsp', 'redshift') if c in cols), None)   # pas « z » : c'est la magnitude dans le filtre z
    log.append('GAVO : décalage %s' % zc)
    if not zc: return out
    for ra0 in range(0, 360, 5):
        if time.time() - T0 > 540: log.append('GAVO trop lent : arrêt à ra = %d' % ra0); break
        q = "SELECT ra, %s AS zs FROM sdssdr16.main WHERE 1 = CONTAINS(POINT('ICRS', ra, dec), BOX('ICRS', %g, 0, 5, %g)) AND %s BETWEEN 0.003 AND %g AND spec_class = 'GALAXY'" % (zc, ra0 + 2.5, 2 * DEC, zc, ZMAX)
        body = urllib.parse.urlencode({'REQUEST': 'doQuery', 'LANG': 'ADQL', 'FORMAT': 'csv', 'MAXREC': '100000', 'QUERY': q}).encode()
        try:
            rd = list(csv.DictReader(io.StringIO(fetch('https://dc.g-vo.org/tap/sync', data=body, timeout=90))))
            out += [(float(r['ra']), float(r['zs'])) for r in rd if r.get('ra') and r.get('zs')]
        except Exception as ex:
            log.append('échec GAVO ra %d : %r' % (ra0, ex))
    log.append('GAVO : %d galaxies' % len(out))
    return out
if not rows or len(rows) < 20000:
    try:
        g_ = gavo()
        if len(g_) > len(rows or []): rows = g_
    except Exception as ex:
        log.append('échec GAVO : %r' % ex)

# table de distances comobiles (interpolation)
ZT = [i * ZMAX / 500 for i in range(501)]; DT = [dcom(z) for z in ZT]
def dist(z):
    i = min(499, int(z / ZMAX * 500)); t = (z - ZT[i]) / (ZT[i + 1] - ZT[i]); return DT[i] + (DT[i + 1] - DT[i]) * t

out = [[round(ra * 100), round(dist(z) * 10)] for ra, z in (rows or []) if 0.003 <= z <= ZMAX]
meta = {'source': 'Sloan Digital Sky Survey (SkyServer DR17, ou DR16 / DR12 en secours), galaxies à spectre, déclinaison −2,5° à +2,5°, z ≤ 0,25',
        'genere': time.strftime('%Y-%m-%d', time.gmtime()), 'n': len(out), 'H0': H0, 'Om': OM, 'zmax': ZMAX, 'dmax': round(dcom(ZMAX), 1),
        'unites': 'g = [ascension droite × 100 (degrés), distance comobile × 10 (Mpc)], univers plat H0 = 70, Ωm = 0,3'}
if len(out) > 5000:
    json.dump({'meta': meta, 'g': out}, open(os.path.join(ROOT, 'data', 'univers.json'), 'w'), ensure_ascii=False, separators=(',', ':'))
open(os.path.join(ROOT, 'data', 'univers-report.md'), 'w').write('# Univers observable (SDSS)\n\n' + '\n'.join('- ' + l for l in log) + '\n\n%d galaxies retenues ; distance comobile à z = %.2f : %.0f Mpc.\n' % (len(out), ZMAX, dcom(ZMAX)))
print('\n'.join(log)); print(len(out), 'galaxies')

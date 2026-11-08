#!/usr/bin/env python3
"""Niveau 5 de la règle des échelles : le Volume local.

Source : Updated Nearby Galaxy Catalog (Karachentsev, Makarov & Kaisina 2013, AJ 145, 101), 869 galaxies à moins
de 11 Mpc, diffusé par la NASA (HEASARC, table « neargalcat ») et le CDS (VizieR J/AJ/145/101).
Sortie : data/volume-local.json — pour chaque galaxie : nom, distance (Mpc), type morphologique, luminosité K (log),
diamètre (kpc), indice de marée et « perturbateur principal » (la voisine dont la gravité domine, qui sert à
regrouper), et la position en coordonnées supergalactiques (Mpc ; le plan supergalactique contient la Feuille locale).
Exécuté par la tâche GitHub « Catalogues de galaxies » (le bac à sable de développement ne joint pas ces serveurs).
"""
import csv, io, json, math, os, sys, time, urllib.request, urllib.parse

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
UA = {'User-Agent': 'observatoire-catalogues/1.0'}
SOURCES = [
    ('HEASARC TAP', 'https://heasarc.gsfc.nasa.gov/xamin/vo/tap/sync?' + urllib.parse.urlencode({'REQUEST': 'doQuery', 'LANG': 'ADQL', 'FORMAT': 'csv', 'QUERY': 'SELECT * FROM neargalcat'})),
    ('HEASARC W3Browse', 'https://heasarc.gsfc.nasa.gov/db-perl/W3Browse/w3query.pl?' + urllib.parse.urlencode({'tablehead': 'name=neargalcat', 'Action': 'Query', 'Fields': 'All', 'ResultMax': '0', 'displaymode': 'BatchDisplay', 'Coordinates': 'Equatorial: R.A. Dec'})),
    ('VizieR', 'https://vizier.cds.unistra.fr/viz-bin/asu-tsv?' + urllib.parse.urlencode({'-source': 'J/AJ/145/101', '-out.max': 'unlimited', '-out.all': '', '-out.add': '_RAJ,_DEJ', '-oc.form': 'd'})),
]
log = []

def get(url):
    with urllib.request.urlopen(urllib.request.Request(url, headers=UA), timeout=180) as r:
        return r.read().decode('utf-8', 'replace')

def rows_csv(txt):
    return list(csv.DictReader(io.StringIO(txt)))

def rows_pipe(txt):
    lines = [l for l in txt.splitlines() if '|' in l]
    if not lines: return []
    head = [h.strip() for h in lines[0].strip('|').split('|')]
    out = []
    for l in lines[1:]:
        v = [x.strip() for x in l.strip('|').split('|')]
        if len(v) == len(head): out.append(dict(zip(head, v)))
    return out

def rows_tsv(txt):
    lines = [l for l in txt.splitlines() if l and not l.startswith('#')]
    if len(lines) < 4: return []
    head = [h.strip() for h in lines[0].split('\t')]
    return [dict(zip(head, [x.strip() for x in l.split('\t')])) for l in lines[3:] if '\t' in l]

def num(v):
    try: return float(str(v).replace('<', '').replace('>', '').strip())
    except Exception: return None

def sexa(v, hours):
    v = str(v).strip()
    if not v: return None
    try: return float(v)
    except ValueError: pass
    p = v.replace(':', ' ').split()
    if len(p) < 2: return None
    s = -1 if p[0].startswith('-') else 1
    d = abs(float(p[0])) + float(p[1]) / 60 + (float(p[2]) / 3600 if len(p) > 2 else 0)
    return s * d * (15 if hours else 1)

def pick(r, *names):
    low = {k.lower(): k for k in r}
    for n in names:
        if n.lower() in low and str(r[low[n.lower()]]).strip() not in ('', 'nan', 'None'): return r[low[n.lower()]]
    return None

# équatorial J2000 → galactique, puis galactique → supergalactique (de Vaucouleurs ; pôle à l = 47,37°, b = +6,32° ; origine l = 137,37°, b = 0)
EQ2GAL = [[-0.0548755604, -0.8734370902, -0.4838350155], [0.4941094279, -0.4448296300, 0.7469822445], [-0.8676661490, -0.1980763734, 0.4559837762]]
def unit(l, b):
    l, b = math.radians(l), math.radians(b); return [math.cos(b) * math.cos(l), math.cos(b) * math.sin(l), math.sin(b)]
SZ, SX = unit(47.37, 6.32), unit(137.37, 0)
SY = [SZ[1] * SX[2] - SZ[2] * SX[1], SZ[2] * SX[0] - SZ[0] * SX[2], SZ[0] * SX[1] - SZ[1] * SX[0]]
def sg(ra, dec, d):
    a, b = math.radians(ra), math.radians(dec); e = [math.cos(b) * math.cos(a), math.cos(b) * math.sin(a), math.sin(b)]
    g = [sum(EQ2GAL[i][j] * e[j] for j in range(3)) for i in range(3)]
    return [round(d * sum(g[k] * V[k] for k in range(3)), 3) for V in (SX, SY, SZ)]

rows = []
for name, url in SOURCES:
    try:
        txt = get(url)
        rows = rows_csv(txt) if name == 'HEASARC TAP' else rows_pipe(txt) if name == 'HEASARC W3Browse' else rows_tsv(txt)
        rows = [r for r in rows if pick(r, 'name', 'Name')]
        log.append('%s : %d lignes, colonnes %s' % (name, len(rows), ', '.join(list(rows[0].keys())[:40]) if rows else '—'))
        if len(rows) > 500: break
    except Exception as ex:
        log.append('%s : échec %r' % (name, ex)[:300])
        rows = []

out = []
for r in rows:
    ra = sexa(pick(r, 'ra', 'RAJ2000', '_RAJ'), hours=not str(pick(r, 'ra', 'RAJ2000', '_RAJ') or '').replace('.', '', 1).replace('-', '', 1).isdigit())
    dec = sexa(pick(r, 'dec', 'DEJ2000', '_DEJ'), hours=False)
    d = num(pick(r, 'distance', 'Dist', 'D'))
    if ra is None or dec is None or not d: continue
    x, y, z = sg(ra, dec, d)
    g = {'n': str(pick(r, 'name', 'Name')).strip(), 'd': round(d, 2), 'x': x, 'y': y, 'z': z}
    t = num(pick(r, 'morph_type', 'TType', 'T')); lk = num(pick(r, 'log_ks_luminosity', 'logKLum', 'logLK'))
    th = num(pick(r, 'tidal_index_1', 'Theta1', 'Th1')); a = num(pick(r, 'linear_diameter', 'A26', 'Diam'))
    md = pick(r, 'neighbor_galaxy_name', 'MD', 'MD1'); dw = pick(r, 'dwarf_morph_type', 'Dtype', 'Morph')
    if t is not None: g['t'] = t
    if lk is not None: g['lk'] = round(lk, 2)
    if th is not None: g['th'] = round(th, 1)
    if a is not None: g['a'] = round(a, 1)
    if md: g['md'] = str(md).strip()
    if dw: g['dw'] = str(dw).strip()
    out.append(g)
out.sort(key=lambda g: g['d'])
meta = {'source': 'Updated Nearby Galaxy Catalog, Karachentsev, Makarov & Kaisina 2013 (AJ 145, 101), via HEASARC / VizieR',
        'genere': time.strftime('%Y-%m-%d', time.gmtime()), 'n': len(out), 'unites': 'distances et positions supergalactiques en Mpc (1 Mpc = 3,26 millions d\'années-lumière)'}
if len(out) > 500:
    json.dump({'meta': meta, 'galaxies': out}, open(os.path.join(ROOT, 'data', 'volume-local.json'), 'w'), ensure_ascii=False, separators=(',', ':'))
open(os.path.join(ROOT, 'data', 'volume-local-report.md'), 'w').write('# Volume local\n\n' + '\n'.join('- ' + l for l in log) + '\n\n%d galaxies retenues.\n' % len(out))
print('\n'.join(log)); print(len(out), 'galaxies')

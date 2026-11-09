#!/usr/bin/env python3
"""Niveau 6 de la règle des échelles : le Superamas local.

Source : Kourkchi & Tully 2017, « Galaxy groups within 3500 km/s » (ApJ 843, 16), catalogue CDS J/ApJ/843/16 :
galaxies (≈ 15 000) et groupes jusqu'à environ 47 Mpc (≈ 150 millions d'années-lumière).
Le script lit la description standard (ReadMe) du CDS pour trouver les colonnes, puis garde pour chaque groupe :
nom (galaxie principale), nombre de membres, masse, position (coordonnées supergalactiques) et distance.
Distance : mesurée quand le catalogue en donne une, sinon tirée de la vitesse (loi de Hubble, H0 = 75 km/s/Mpc,
la valeur des auteurs) — signalé dans les données par d = « v ».
Sortie : data/superamas.json et data/superamas-report.md. Exécuté par la tâche GitHub « Catalogues de galaxies ».
"""
import gzip, io, json, math, os, re, sys, time, urllib.request

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
BASES = ['https://cdsarc.cds.unistra.fr/ftp/cats/J/ApJ/843/16/', 'https://cdsarc.u-strasbg.fr/ftp/cats/J/ApJ/843/16/']
UA = {'User-Agent': 'observatoire-catalogues/1.0'}
H0 = 75.0
log = []

def get(name):
    for b in BASES:
        try:
            with urllib.request.urlopen(urllib.request.Request(b + name, headers=UA), timeout=180) as r:
                raw = r.read()
            return gzip.decompress(raw) if name.endswith('.gz') else raw
        except Exception as ex:
            log.append('échec %s%s : %r' % (b, name, ex)); print(log[-1], flush=True)
    return None

def parse_readme(txt):
    """Renvoie {fichier: [(debut, fin, label, unité, explication)]} à partir des blocs « Byte-by-byte Description of file: »."""
    out, cur = {}, None
    for line in txt.splitlines():
        m = re.match(r'\s*Byte-by-byte Description of file:\s*(.+)', line)
        if m:
            cur = [f.strip() for f in m.group(1).split(',')]; [out.setdefault(f, []) for f in cur]; continue
        if cur is None: continue
        m = re.match(r'\s*(\d+)\s*(?:-\s*(\d+))?\s+[AIFE][\d.]+\s+(\S+)\s+(\S+)\s*(.*)', line)
        if m:
            a = int(m.group(1)); b = int(m.group(2) or a)
            for f in cur: out[f].append((a, b, m.group(4), m.group(3), m.group(5).strip()))
        elif line.startswith('----') and out.get(cur[0]) and len(out[cur[0]]) > 2 and line.strip('-') == '':
            pass
    return out

def read_table(raw, cols):
    rows = []
    for line in raw.decode('latin-1').splitlines():
        if not line.strip(): continue
        r = {}
        for a, b, lab, unit, ex in cols: r[lab] = line[a - 1:b].strip()
        rows.append(r)
    return rows

def num(v):
    try: return float(v)
    except Exception: return None

def find(cols, *pats):
    labs = [c[2] for c in cols]
    for p in pats:
        for l in labs:
            if re.fullmatch(p, l, re.I): return l
    return None

def sg_from_sgl(sgl, sgb, d):
    l, b = math.radians(sgl), math.radians(sgb)
    return [round(d * math.cos(b) * math.cos(l), 3), round(d * math.cos(b) * math.sin(l), 3), round(d * math.sin(b), 3)]

EQ2GAL = [[-0.0548755604, -0.8734370902, -0.4838350155], [0.4941094279, -0.4448296300, 0.7469822445], [-0.8676661490, -0.1980763734, 0.4559837762]]
def unit(l, b):
    l, b = math.radians(l), math.radians(b); return [math.cos(b) * math.cos(l), math.cos(b) * math.sin(l), math.sin(b)]
SZ, SX = unit(47.37, 6.32), unit(137.37, 0)
SY = [SZ[1] * SX[2] - SZ[2] * SX[1], SZ[2] * SX[0] - SZ[0] * SX[2], SZ[0] * SX[1] - SZ[1] * SX[0]]
def sg_from_eq(ra, dec, d):
    a, b = math.radians(ra), math.radians(dec); e = [math.cos(b) * math.cos(a), math.cos(b) * math.sin(a), math.sin(b)]
    g = [sum(EQ2GAL[i][j] * e[j] for j in range(3)) for i in range(3)]
    return [round(d * sum(g[k] * V[k] for k in range(3)), 3) for V in (SX, SY, SZ)]

readme = get('ReadMe')
if not readme:
    log.append('ReadMe introuvable'); open(os.path.join(ROOT, 'data', 'superamas-report.md'), 'w').write('\n'.join(log) + '\n'); print('\n'.join(log)); sys.exit(0)
desc = parse_readme(readme.decode('latin-1'))
print('ReadMe :', len(readme), 'octets ; fichiers décrits :', list(desc.keys()), flush=True)
tables = {}
for f, cols in desc.items():
    raw = get(f) or get(f + '.gz')
    if raw is None: continue
    rows = read_table(raw, cols)
    tables[f] = (cols, rows)
    log.append('**%s** : %d lignes ; colonnes : %s' % (f, len(rows), ', '.join('%s (%s : %s)' % (c[2], c[3], c[4][:50]) for c in cols)))

# table des groupes : celle qui a une colonne de nombre de membres et le moins de lignes
cand = []
for f, (cols, rows) in tables.items():
    nm = find(cols, r'N(mb|m|mem|gal)?s?', r'Mem', r'Ngal')
    if nm and rows: cand.append((len(rows), f, nm))
cand.sort()
out = []
if cand:
    n, f, ncol = cand[0] if cand[0][0] > 200 else (cand[-1] if cand else cand[0])
    cols, rows = tables[f]
    c_sgl, c_sgb = find(cols, r'SGL(deg)?', r'SGLon'), find(cols, r'SGB(deg)?', r'SGLat')
    c_ra, c_de = find(cols, r'RA(deg|J2000)?', r'_RA'), find(cols, r'DE(deg|J2000)?', r'_DE')
    c_d = find(cols, r'Dist', r'D', r'Dg', r'Dgr', r'Dmean', r'Dav')
    c_dm = find(cols, r'DM', r'DMg', r'mu')
    c_v = find(cols, r'Vls', r'VLS', r'Vmod', r'Vgsr', r'VLG', r'Vh', r'HRV', r'cz', r'V')
    c_m = find(cols, r'logM(v|K|vir|L|d)?', r'log\(?M.*', r'Mv', r'MK')
    c_name = find(cols, r'Name', r'PGC1', r'PGC', r'Nest', r'Group', r'ID')
    log.append('Table des groupes retenue : %s (membres %s, SGL %s, SGB %s, RA %s, DE %s, distance %s, module %s, vitesse %s, masse %s, nom %s)' % (f, ncol, c_sgl, c_sgb, c_ra, c_de, c_d, c_dm, c_v, c_m, c_name))
    for r in rows:
        nmem = num(r.get(ncol));
        if not nmem: continue
        d = num(r.get(c_d)) if c_d else None; src = 'm'
        if not d and c_dm and num(r.get(c_dm)): d = 10 ** ((num(r.get(c_dm)) - 25) / 5)
        if not d and c_v and num(r.get(c_v)): d = num(r.get(c_v)) / H0; src = 'v'
        if not d or d <= 0 or d > 60: continue
        if c_sgl and c_sgb and num(r.get(c_sgl)) is not None: xyz = sg_from_sgl(num(r[c_sgl]), num(r[c_sgb]), d)
        elif c_ra and c_de and num(r.get(c_ra)) is not None: xyz = sg_from_eq(num(r[c_ra]), num(r[c_de]), d)
        else: continue
        g = {'n': str(r.get(c_name, '')).strip(), 'k': int(nmem), 'd': round(d, 2), 'x': xyz[0], 'y': xyz[1], 'z': xyz[2]}
        if src == 'v': g['dv'] = 1
        m = num(r.get(c_m)) if c_m else None
        if m: g['m'] = round(m, 2)
        out.append(g)
out.sort(key=lambda g: -g['k'])
meta = {'source': 'Kourkchi & Tully 2017, « Galaxy groups within 3500 km/s », ApJ 843, 16 (CDS J/ApJ/843/16)', 'genere': time.strftime('%Y-%m-%d', time.gmtime()), 'n': len(out), 'H0': H0,
        'unites': 'distances et positions supergalactiques en Mpc ; m = log10 de la masse en masses solaires ; k = nombre de galaxies du groupe ; dv = distance tirée de la vitesse'}
if len(out) > 100:
    json.dump({'meta': meta, 'groupes': out}, open(os.path.join(ROOT, 'data', 'superamas.json'), 'w'), ensure_ascii=False, separators=(',', ':'))
open(os.path.join(ROOT, 'data', 'superamas-report.md'), 'w').write('# Superamas local\n\n' + '\n'.join('- ' + l for l in log) + '\n\n%d groupes retenus.\n\nPlus gros : %s\n' % (len(out), '; '.join('%s (%d galaxies, %.1f Mpc)' % (g['n'], g['k'], g['d']) for g in out[:15])))
print('\n'.join(log)); print(len(out), 'groupes')

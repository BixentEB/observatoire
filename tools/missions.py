#!/usr/bin/env python3
"""
OBSERVATOIRE — trajectoires des engins spatiaux, d'après JPL Horizons (NASA/JPL-Caltech).

Horizons n'autorise pas les appels directs depuis un navigateur : ce script précalcule les
positions et les écrit dans data/missions.json. Une tâche GitHub le relance chaque jour
(.github/workflows/missions.yml), si bien que les fenêtres « autour d'aujourd'hui » glissent
avec le calendrier et que les prévisions de trajectoire sont mises à jour par le JPL.

Deux types de données :
  v — vecteurs position (écliptique J2000) à pas régulier, interpolés dans le navigateur ;
      en UA autour du Soleil, en km autour d'une planète ou de la Lune.
  e — éléments orbitaux osculateurs à pas régulier, pour les engins en orbite rapide autour
      d'un astre (ISS, orbiteurs) : le navigateur propage l'orbite de Kepler depuis l'époque la plus proche.

Aucune dépendance : python3 tools/missions.py [--today AAAA-MM-JJ]
"""
import json, re, sys, time, datetime, urllib.request, urllib.parse, os

API = 'https://ssd.jpl.nasa.gov/api/horizons.api'
DT = 69.2 / 86400   # TDB − UT en 2020-2030, en jours
CENTERS = {'soleil': '500@10', 'mercure': '500@199', 'terre': '500@399', 'lune': '500@301', 'mars': '500@499', 'jupiter': '500@599'}

# id, code Horizons, liste de segments : (type, centre, début, fin, pas)
# début/fin : 'cov' = début/fin de la couverture Horizons ; date ISO ; ou décalage 'J-60' / 'J+365' autour d'aujourd'hui.
SPEC = [
  ('voyager1', '-31',  [('v', 'soleil', 'cov', '2050-01-01', '15d')]),
  ('voyager2', '-32',  [('v', 'soleil', 'cov', '2050-01-01', '15d')]),
  ('pioneer10', '-23', [('v', 'soleil', 'cov', 'cov', '15d')]),
  ('pioneer11', '-24', [('v', 'soleil', 'cov', 'cov', '15d')]),
  ('newhorizons', '-98', [('v', 'soleil', 'cov', 'cov', '10d')]),
  ('parker', '-96',    [('v', 'soleil', 'cov', 'cov', '1d')]),
  ('solarorbiter', '-144', [('v', 'soleil', 'cov', 'cov', '2d')]),
  ('bepicolombo', '-121', [('v', 'soleil', 'cov', 'cov', '2d'), ('v', 'mercure', 'J-20', 'cov', '2h')]),
  ('juice', '-28',     [('v', 'soleil', 'cov', 'cov', '2d')]),
  ('clipper', '-159',  [('v', 'soleil', 'cov', 'cov', '2d')]),
  ('psyche', '-255',   [('v', 'soleil', 'cov', 'cov', '2d')]),
  ('lucy', '-49',      [('v', 'soleil', 'cov', 'cov', '2d')]),
  ('hera', '-91',      [('v', 'soleil', 'cov', 'cov', '1d')]),
  ('hayabusa2', '-37', [('v', 'soleil', 'cov', 'cov', '3d')]),
  ('osirisapex', '-64', [('v', 'soleil', 'cov', 'cov', '3d')]),
  ('juno', '-61',      [('v', 'soleil', 'cov', '2016-07-01', '2d'), ('e', 'jupiter', '2016-07-06', 'cov', '3d')]),
  ('jwst', '-170',     [('v', 'terre', 'cov', 'cov', '2d')]),
  ('iss', '-125544',   [('e', 'terre', 'J-5', 'cov', '6h')]),
  ('tiangong', '-148274', [('e', 'terre', 'J-5', 'cov', '6h')]),
  ('lro', '-85',       [('e', 'lune', 'J-30', 'J+120', '1d')]),
  ('danuri', '-155',   [('e', 'lune', 'J-30', 'J+120', '1d')]),
  ('mro', '-74',       [('e', 'mars', 'J-30', 'J+120', '1d')]),
  ('marsexpress', '-41', [('e', 'mars', 'J-30', 'J+120', '1d')]),
  ('hope', '-62',      [('e', 'mars', 'J-30', 'J+120', '1d')]),
  ('artemis1', '-1023', [('v', 'terre', 'cov', 'cov', '20m'), ('v', 'lune', 'cov', 'cov', '20m')]),
  ('artemis2', '-1024', [('v', 'terre', 'cov', 'cov', '10m'), ('v', 'lune', 'cov', 'cov', '10m')]),
]

def call(params, tries=4):
    base = {'format': 'text', 'OBJ_DATA': 'NO', 'MAKE_EPHEM': 'YES', 'REF_PLANE': "'ECLIPTIC'", 'REF_SYSTEM': "'ICRF'",
            'CSV_FORMAT': 'YES', 'TIME_TYPE': "'UT'"}
    base.update(params)
    url = API + '?' + urllib.parse.urlencode(base)
    for i in range(tries):
        try:
            return urllib.request.urlopen(url, timeout=120).read().decode('utf-8', 'replace')
        except Exception as e:
            if i == tries - 1: raise
            time.sleep(3 * (i + 1))

def jd_of(d):
    return (d - datetime.datetime(2000, 1, 1, 12)).total_seconds() / 86400 + 2451545.0
def iso(d): return d.strftime('%Y-%m-%d %H:%M')
MONTHS = {m: i + 1 for i, m in enumerate(['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'])}
def parse_hz_date(s):
    m = re.search(r'(\d{4})-([A-Z]{3})-(\d{2}) (\d{2}):(\d{2})', s.upper())
    return datetime.datetime(int(m.group(1)), MONTHS[m.group(2)], int(m.group(3)), int(m.group(4)), int(m.group(5)))

def coverage(cmd, center):
    """début et fin de la couverture (Horizons répond « No ephemeris … prior to / after … »)."""
    t = call({'COMMAND': "'%s'" % cmd, 'EPHEM_TYPE': 'VECTORS', 'CENTER': "'%s'" % CENTERS[center],
              'START_TIME': "'1960-01-01'", 'STOP_TIME': "'2100-01-01'", 'STEP_SIZE': "'1'"})
    m = re.search(r'prior to A\.D\. ([^\n]+)', t)
    start = parse_hz_date(m.group(1)) + datetime.timedelta(minutes=10) if m else datetime.datetime(1960, 1, 1)
    t = call({'COMMAND': "'%s'" % cmd, 'EPHEM_TYPE': 'VECTORS', 'CENTER': "'%s'" % CENTERS[center],
              'START_TIME': "'%s'" % iso(start), 'STOP_TIME': "'2100-01-01'", 'STEP_SIZE': "'1'"})
    m = re.search(r'after A\.D\. ([^\n]+)', t)
    end = parse_hz_date(m.group(1)) - datetime.timedelta(minutes=10) if m else datetime.datetime(2100, 1, 1)
    return start, end

def resolve(v, cov, today):
    if v == 'cov': return cov
    if v.startswith('J'): return today + datetime.timedelta(days=int(v[1:]))
    return datetime.datetime.fromisoformat(v)

def step_days(s):
    n = float(s[:-1]); return n * {'d': 1, 'h': 1 / 24, 'm': 1 / 1440}[s[-1]]
def hz_step(s):
    n, u = s[:-1], s[-1]
    return {'d': n + 'd', 'h': n + 'h', 'm': n + 'm'}[u]

def rows(t):
    if '$$SOE' not in t: raise RuntimeError(t[-400:])
    body = t.split('$$SOE')[1].split('$$EOE')[0]
    return [[c.strip() for c in l.split(',')] for l in body.strip().splitlines() if l.strip()]

def fetch_vectors(cmd, center, a, b, step):
    unit = 'AU-D' if center == 'soleil' else 'KM-S'
    out, cur, chunk = [], a, datetime.timedelta(days=step_days(step) * 4000)   # au plus ~4000 lignes par requête
    jd0 = None
    while cur < b:
        stop = min(b, cur + chunk)
        t = call({'COMMAND': "'%s'" % cmd, 'EPHEM_TYPE': 'VECTORS', 'CENTER': "'%s'" % CENTERS[center], 'VEC_TABLE': "'1'",
                  'OUT_UNITS': "'%s'" % unit, 'START_TIME': "'%s'" % iso(cur), 'STOP_TIME': "'%s'" % iso(stop), 'STEP_SIZE': "'%s'" % hz_step(step)})
        for r in rows(t):
            jd = float(r[0])
            if out and jd <= out[-1][0] + 1e-9: continue
            out.append((jd, float(r[2]), float(r[3]), float(r[4])))
        cur = stop
    nd = 5 if center == 'soleil' else 0   # 1e-5 UA ≈ 1 500 km
    flat = []
    for p in out: flat += [round(p[1], nd), round(p[2], nd), round(p[3], nd)]
    if nd == 0: flat = [int(x) for x in flat]
    return {'k': 'v', 'c': center, 'u': 'au' if center == 'soleil' else 'km', 'jd0': round(out[0][0], 6), 'dt': round(step_days(step), 8), 'n': len(out), 'p': flat}

def fetch_elements(cmd, center, a, b, step):
    t = call({'TIME_TYPE': "'TDB'", 'COMMAND': "'%s'" % cmd, 'EPHEM_TYPE': 'ELEMENTS', 'CENTER': "'%s'" % CENTERS[center], 'OUT_UNITS': "'KM-D'",
              'START_TIME': "'%s'" % iso(a), 'STOP_TIME': "'%s'" % iso(b), 'STEP_SIZE': "'%s'" % hz_step(step)})
    el = []
    for r in rows(t):
        # JD, date, EC, QR, IN, OM, W, Tp, N(°/j), MA, TA, A, AD, PR
        ec, qr, inc, om, w, tp, n = (float(x) for x in r[2:9])
        # Horizons ne donne les éléments qu'en temps TDB : on revient au temps universel (TDB − UT ≈ 69 s)
        el.append([round(float(r[0]) - DT, 5), round(ec, 7), round(qr, 2), round(inc, 5), round(om, 5), round(w, 5), round(tp - DT, 6), round(n, 7)])
    return {'k': 'e', 'c': center, 'e': el}

def main():
    today = datetime.datetime.now(datetime.timezone.utc).replace(tzinfo=None, hour=0, minute=0, second=0, microsecond=0)
    if '--today' in sys.argv: today = datetime.datetime.fromisoformat(sys.argv[sys.argv.index('--today') + 1])
    only = [a for a in sys.argv[1:] if not a.startswith('--') and not re.match(r'\d{4}-', a)]
    path = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', 'data', 'missions.json')
    try: old = json.load(open(path))
    except Exception: old = {'craft': {}}
    data = {'source': 'NASA/JPL Horizons (ssd.jpl.nasa.gov)', 'gen': today.strftime('%Y-%m-%d'), 'craft': {}}
    for cid, cmd, segs in SPEC:
        if only and cid not in only: data['craft'][cid] = old['craft'].get(cid); continue
        try:
            out, covs = [], {}
            for kind, center, s0, s1, step in segs:
                if center not in covs: covs[center] = coverage(cmd, center)
                c0, c1 = covs[center]
                a = max(resolve(s0, c0, today), c0); b = min(resolve(s1, c1, today), c1)
                if b <= a: continue
                seg = (fetch_vectors if kind == 'v' else fetch_elements)(cmd, center, a, b, step)
                seg['from'], seg['to'] = round(jd_of(a), 4), round(jd_of(b), 4)
                out.append(seg)
            data['craft'][cid] = {'hz': cmd, 'cov': [round(jd_of(covs[k][0]), 3) for k in covs][:1] + [round(jd_of(covs[k][1]), 3) for k in covs][:1], 'segs': out}
            print(cid, ' '.join('%s/%s:%s' % (s['k'], s['c'], s.get('n', len(s.get('e', [])))) for s in out), file=sys.stderr)
        except Exception as e:   # un engin qui échoue garde ses données de la veille
            print('ÉCHEC', cid, e, file=sys.stderr)
            data['craft'][cid] = old['craft'].get(cid)
    data['craft'] = {k: v for k, v in data['craft'].items() if v}
    with open(path, 'w') as f: json.dump(data, f, separators=(',', ':'))
    print('écrit', path, os.path.getsize(path) // 1024, 'Ko', file=sys.stderr)

if __name__ == '__main__':
    main()

#!/usr/bin/env python3
"""
OBSERVATOIRE — petits corps (comètes, astéroïdes, objets interstellaires), d'après le JPL (NASA/JPL-Caltech).

Pour chaque objet de data/smallbodies-sources.json :
  1. éléments orbitaux osculateurs (écliptique J2000, héliocentriques) depuis la base SBDB du JPL ;
  2. rapprochements de la Terre (API CAD du JPL) dans une fenêtre de dates, pour vérifier les dates de l'Atlas ;
  3. test de précision : position calculée par une orbite de Kepler simple (ce que ferait le navigateur)
     comparée aux positions JPL Horizons (calcul complet avec les perturbations des planètes),
     à plusieurs dates autour de l'époque des éléments et aux dates clés ;
  4. écrit data/smallbodies.json (éléments + fenêtres Horizons) et data/smallbodies-report.md.

Le navigateur n'appelle jamais le JPL : tout est précalculé ici, relancé par une tâche GitHub.
Aucune dépendance : python3 tools/smallbodies.py
"""
import json, math, os, sys, time, datetime, urllib.request, urllib.parse, re

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SRC = os.path.join(ROOT, 'data', 'smallbodies-sources.json')
OUT = os.path.join(ROOT, 'data', 'smallbodies.json')
REPORT = os.path.join(ROOT, 'data', 'smallbodies-report.md')
UA = 'ObservatoireCodexMental/1.0 (https://obs.codexmental.com ; https://github.com/BixentEB/observatoire)'
GM = 2.9591220828559115e-4          # GM du Soleil, UA³/j²
AU_KM = 149597870.7
DEG = math.pi / 180


def get(url, params, tries=3):
    url += '?' + urllib.parse.urlencode(params)
    for k in range(tries):
        try:
            req = urllib.request.Request(url, headers={'User-Agent': UA})
            with urllib.request.urlopen(req, timeout=90) as r:
                return json.loads(r.read().decode('utf-8'))
        except Exception:
            if k == tries - 1: raise
            time.sleep(3 + 4 * k)


def jd(date):
    d = datetime.datetime.fromisoformat(date) if isinstance(date, str) else date
    return d.toordinal() + 1721424.5 + (d.hour + d.minute / 60) / 24


def cal(j):
    j += .5; z = int(j); f = j - z
    d = datetime.datetime.fromordinal(z - 1721425) + datetime.timedelta(days=f)
    return d.strftime('%Y-%m-%d')


# ---------- SBDB ----------
def sbdb(sstr):
    j = get('https://ssd-api.jpl.nasa.gov/sbdb.api', {'sstr': sstr, 'full-prec': 'true', 'phys-par': 'true'})
    if 'orbit' not in j:
        raise RuntimeError('SBDB : %s' % (j.get('message') or j.get('list') or j))
    o = j['orbit']; el = {e['name']: e['value'] for e in o['elements']}
    f = lambda k: float(el[k]) if el.get(k) not in (None, '') else None
    return {
        'name': j['object'].get('fullname'), 'spkid': j['object'].get('spkid'), 'kind': j['object'].get('kind'),
        'epoch': float(o['epoch']), 'e': f('e'), 'q': f('q'), 'a': f('a'), 'i': f('i'), 'om': f('om'), 'w': f('w'), 'tp': f('tp'),
        'per': f('per'), 'n': f('n'), 'solution': o.get('orbit_id'), 'first_obs': o.get('first_obs'), 'last_obs': o.get('last_obs'),
        'n_obs': o.get('n_obs_used'), 'condition': o.get('condition_code'),
        'model': [m.get('name') for m in (o.get('model_pars') or [])],
        'phys': {p['name']: p.get('value') for p in (j.get('phys_par') or [])},
    }


# ---------- Kepler (deux corps) ----------
def kepler(el, t):
    e, q = el['e'], el['q']; i, om, w = el['i'] * DEG, el['om'] * DEG, el['w'] * DEG
    dt = t - el['tp']
    if e < 1:
        a = q / (1 - e); n = math.sqrt(GM / a ** 3); M = n * dt
        M = math.fmod(M, 2 * math.pi); E = M if e < .8 else math.pi
        for _ in range(60):
            dE = (E - e * math.sin(E) - M) / (1 - e * math.cos(E)); E -= dE
            if abs(dE) < 1e-13: break
        x, y = a * (math.cos(E) - e), a * math.sqrt(1 - e * e) * math.sin(E)
    else:
        a = q / (e - 1); n = math.sqrt(GM / a ** 3); M = n * dt
        H = math.asinh(M / e) if abs(M) > 1e-9 else M
        for _ in range(80):
            dH = (e * math.sinh(H) - H - M) / (e * math.cosh(H) - 1); H -= dH
            if abs(dH) < 1e-13: break
        x, y = a * (e - math.cosh(H)), a * math.sqrt(e * e - 1) * math.sinh(H)
    co, so, ci, si, cw, sw = math.cos(om), math.sin(om), math.cos(i), math.sin(i), math.cos(w), math.sin(w)
    X = (co * cw - so * sw * ci) * x + (-co * sw - so * cw * ci) * y
    Y = (so * cw + co * sw * ci) * x + (-so * sw + co * cw * ci) * y
    Z = (sw * si) * x + (cw * si) * y
    return X, Y, Z


# ---------- Horizons ----------
def horizons(cmd, times):
    """Positions héliocentriques (UA, écliptique J2000) aux dates JD (TDB) demandées."""
    out = {}
    for k in range(0, len(times), 40):
        chunk = times[k:k + 40]
        j = get('https://ssd.jpl.nasa.gov/api/horizons.api', {
            'format': 'json', 'COMMAND': "'%s'" % cmd, 'EPHEM_TYPE': 'VECTORS', 'CENTER': "'500@10'", 'REF_PLANE': 'ECLIPTIC', 'REF_SYSTEM': 'J2000',
            'OUT_UNITS': 'AU-D', 'VEC_TABLE': '1', 'CSV_FORMAT': 'YES', 'TLIST': ' '.join('%.5f' % t for t in chunk), 'TLIST_TYPE': 'JD', 'TIME_TYPE': 'TDB'})
        txt = j.get('result', '')
        m = re.search(r'\$\$SOE(.*?)\$\$EOE', txt, re.S)
        if not m: raise RuntimeError('Horizons : ' + txt[-400:].replace('\n', ' '))
        for line in m.group(1).strip().splitlines():
            p = [s.strip() for s in line.split(',')]
            out[round(float(p[0]), 3)] = (float(p[2]), float(p[3]), float(p[4]))
        time.sleep(1)
    return out


def cad(des, d0, d1):
    try:
        j = get('https://ssd-api.jpl.nasa.gov/cad.api', {'des': des, 'date-min': d0, 'date-max': d1, 'dist-max': '0.5', 'body': 'Earth'})
    except Exception as e:
        return [('erreur', str(e))]
    f = j.get('fields', [])
    return [dict(zip(f, r)) for r in j.get('data', [])]


def main():
    sources = json.load(open(SRC, encoding='utf-8'))['objets']
    out = {'_aide': 'Généré par tools/smallbodies.py (JPL SBDB + Horizons). Éléments : écliptique J2000, héliocentriques, angles en degrés, q en UA, tp et epoch en JD TDB.', 'genere': datetime.date.today().isoformat(), 'objets': {}}
    rep = ['# Petits corps — rapport du %s UTC' % datetime.datetime.utcnow().strftime('%Y-%m-%d %H:%M'), '',
           'Écart = distance entre la position d\'une orbite de Kepler simple (calculable dans le navigateur) et la position JPL Horizons (calcul complet). Angle = cet écart vu depuis le Soleil.', '']
    for s in sources:
        rep.append('## %s (`%s`)' % (s['label'], s['id']))
        try:
            el = sbdb(s['sbdb'])
            rep += ['- JPL : %s — solution %s, %s observations du %s au %s%s' % (el['name'], el['solution'], el['n_obs'], el['first_obs'], el['last_obs'],
                                                                                  ', paramètres non gravitationnels : ' + ', '.join(el['model']) if el['model'] else ''),
                    '- Orbite : e = %.5f, q = %.4f UA, i = %.2f°, passage au périhélie %s, époque des éléments %s%s' % (el['e'], el['q'], el['i'], cal(el['tp']), cal(el['epoch']),
                                                                                                             ', période %.1f ans' % (el['per'] / 365.25) if el.get('per') else (' (hyperbolique)' if el['e'] >= 1 else ''))]
            # dates de test : autour de l'époque, et dates clés de l'Atlas
            ep = el['epoch']
            tests = [('époque', ep), ('époque − 1 an', ep - 365.25), ('époque + 1 an', ep + 365.25), ('époque − 10 ans', ep - 3652.5), ('époque + 10 ans', ep + 3652.5), ('périhélie', el['tp'])]
            tests += [(k, jd(v)) for k, v in s.get('dates', {}).items()]
            if s.get('window'):
                w0, w1 = jd(s['window'][0]), jd(s['window'][1])
                tests = [t for t in tests if w0 <= t[1] <= w1] + [('début de fenêtre', w0), ('fin de fenêtre', w1)]
            times = sorted(set(round(t, 3) for _, t in tests))
            hz = {}
            try:
                hz = horizons(s['horizons'], times)
            except Exception as e:
                rep.append('- ⚠ Horizons : %s' % e)
            if hz:
                rep += ['', '| Date | Distance au Soleil | Écart Kepler / Horizons | Angle |', '|---|---|---|---|']
                for name, t in sorted(tests, key=lambda x: x[1]):
                    h = hz.get(round(t, 3))
                    if not h: continue
                    k = kepler(el, t); dx = math.dist(k, h); r = math.hypot(*h)
                    rep.append('| %s (%s) | %.2f UA | %s | %s |' % (cal(t), name, r, ('%.0f km' % (dx * AU_KM)) if dx * AU_KM < 1e6 else '%.4f UA (%.1f M km)' % (dx, dx * AU_KM / 1e6), '%.3f°' % (math.degrees(dx / r))))
                rep.append('')
            if s.get('cad'):
                ca = cad(s['cad'][0], s['cad'][1], s['cad'][2])
                rep.append('- Rapprochements de la Terre (CAD, < 0,5 UA, %s → %s) :' % (s['cad'][1], s['cad'][2]))
                for c in ca[:8]:
                    if isinstance(c, tuple): rep.append('  - %s' % c[1]); continue
                    rep.append('  - %s — %.0f km (%.4f UA), vitesse relative %.1f km/s' % (c['cd'], float(c['dist']) * AU_KM, float(c['dist']), float(c['v_rel'])))
                if not ca: rep.append('  - aucun')
            exp = s.get('expect')
            if exp:
                rep.append('- Vérification de l\'Atlas : %s' % exp)
            out['objets'][s['id']] = {'label': s['label'], 'jpl': el['name'], 'spkid': el['spkid'], 'elements': {k: el[k] for k in ('epoch', 'e', 'q', 'i', 'om', 'w', 'tp')},
                                      'nongrav': bool(el['model']), 'solution': el['solution'], 'window': s.get('window'), 'source': 'JPL SBDB, solution %s' % el['solution']}
        except Exception as e:
            rep.append('- ✘ Erreur : %s' % e)
        rep.append('')
    json.dump(out, open(OUT, 'w', encoding='utf-8'), ensure_ascii=False, indent=1)
    open(REPORT, 'w', encoding='utf-8').write('\n'.join(rep) + '\n')
    print('\n'.join(rep))


if __name__ == '__main__':
    main()

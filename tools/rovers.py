#!/usr/bin/env python3
"""
OBSERVATOIRE — position des rovers sur Mars (Perseverance, Curiosity).

Lit les points de parcours publiés par la NASA pour ses cartes de suivi des rovers (MMGIS, JPL) et garde
le dernier : latitude, longitude, sol (jour martien) et date. Relancé chaque jour avec les trajectoires des
engins ; si la source ne répond pas, on garde la position de la veille.

python3 tools/rovers.py   — sans dépendance ; écrit data/rovers.json
"""
import json, os, sys, urllib.request, datetime

UA = 'ObservatoireCodexMental/1.0 (https://obs.codexmental.com)'
SOURCES = {
    'perseverance': ['https://mars.nasa.gov/mmgis-maps/M20/Layers/json/M20_waypoints_current.json',
                     'https://mars.nasa.gov/mmgis-maps/M20/Layers/json/M20_waypoints.json'],
    'curiosity': ['https://mars.nasa.gov/mmgis-maps/MSL/Layers/json/MSL_waypoints_current.json',
                  'https://mars.nasa.gov/mmgis-maps/MSL/Layers/json/MSL_waypoints.json'],
}


def get(url):
    req = urllib.request.Request(url, headers={'User-Agent': UA, 'Accept': 'application/json'})
    with urllib.request.urlopen(req, timeout=60) as r:
        return json.loads(r.read().decode('utf-8'))


def last_point(gj):
    feats = gj.get('features') or []
    best = None
    for f in feats:
        p = f.get('properties') or {}
        g = f.get('geometry') or {}
        c = g.get('coordinates')
        if not c: continue
        if g.get('type') == 'LineString': c = c[-1]
        if isinstance(c[0], list): c = c[-1]
        sol = p.get('sol') or p.get('Sol') or p.get('SOL')
        try: sol = int(float(sol))
        except Exception: sol = None
        key = (sol if sol is not None else -1, feats.index(f))
        if best is None or key >= best[0]:
            best = (key, {'lon': round(float(c[0]), 5), 'lat': round(float(c[1]), 5), 'sol': sol,
                          'site': p.get('site') or p.get('Site'), 'drive': p.get('drive') or p.get('Drive'),
                          'date': p.get('date') or p.get('Date') or p.get('UTC') or None})
    return best[1] if best else None


def main():
    path = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', 'data', 'rovers.json')
    try: old = json.load(open(path))
    except Exception: old = {'rovers': {}}
    data = {'source': 'NASA/JPL, cartes de suivi des rovers (MMGIS)', 'gen': datetime.date.today().isoformat(), 'rovers': {}}
    for rid, urls in SOURCES.items():
        pt = None
        for u in urls:
            try:
                pt = last_point(get(u))
                if pt: pt['src'] = u; break
            except Exception as e:
                print('ÉCHEC', rid, u, e, file=sys.stderr)
        if pt:
            data['rovers'][rid] = pt; print(rid, pt, file=sys.stderr)
        elif old['rovers'].get(rid):
            data['rovers'][rid] = old['rovers'][rid]
    with open(path, 'w') as f: json.dump(data, f, ensure_ascii=False, indent=1)


if __name__ == '__main__':
    main()

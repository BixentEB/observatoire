#!/usr/bin/env python3
"""
OBSERVATOIRE — position réelle des lunes, d'après JPL Horizons (NASA/JPL-Caltech).

Pour chaque lune : éléments orbitaux osculateurs autour de sa planète (écliptique J2000), un jeu tous les
2 jours de J−30 à J+180. Le navigateur prend le jeu le plus proche de la date affichée et propage l'orbite
de Kepler (même code que pour les engins spatiaux) : la position est juste autour d'aujourd'hui ; hors de
la fenêtre, on revient à la position indicative. Relancé chaque jour avec les trajectoires des engins.

python3 tools/moons.py [--today AAAA-MM-JJ]   — sans dépendance ; écrit data/moons.json
"""
import json, os, sys, datetime
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import missions as M

M.CENTERS.update({'saturne': '500@699', 'uranus': '500@799', 'neptune': '500@899', 'pluton': '500@999'})
MOONS = [
    ('phobos', '401', 'mars'), ('deimos', '402', 'mars'),
    ('io', '501', 'jupiter'), ('europe', '502', 'jupiter'), ('ganymede', '503', 'jupiter'), ('callisto', '504', 'jupiter'),
    ('mimas', '601', 'saturne'), ('encelade', '602', 'saturne'), ('tethys', '603', 'saturne'), ('dione', '604', 'saturne'),
    ('rhea', '605', 'saturne'), ('titan', '606', 'saturne'), ('japet', '608', 'saturne'),
    ('miranda', '705', 'uranus'), ('ariel', '701', 'uranus'), ('umbriel', '702', 'uranus'), ('titania', '703', 'uranus'), ('oberon', '704', 'uranus'),
    ('triton', '801', 'neptune'), ('charon', '901', 'pluton'),
]


def main():
    today = datetime.datetime.now(datetime.timezone.utc).replace(tzinfo=None, hour=0, minute=0, second=0, microsecond=0)
    if '--today' in sys.argv: today = datetime.datetime.fromisoformat(sys.argv[sys.argv.index('--today') + 1])
    path = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', 'data', 'moons.json')
    try: old = json.load(open(path))
    except Exception: old = {'moons': {}}
    a, b = today - datetime.timedelta(days=30), today + datetime.timedelta(days=180)
    data = {'source': 'NASA/JPL Horizons (ssd.jpl.nasa.gov)', 'gen': today.strftime('%Y-%m-%d'), 'moons': {}}
    for mid, cmd, center in MOONS:
        try:
            seg = M.fetch_elements(cmd, center, a, b, '2d')
            data['moons'][mid] = {'c': center, 'e': seg['e']}
            print(mid, len(seg['e']), file=sys.stderr)
        except Exception as e:   # une lune qui échoue garde ses données de la veille
            print('ÉCHEC', mid, e, file=sys.stderr)
            if old['moons'].get(mid): data['moons'][mid] = old['moons'][mid]
    with open(path, 'w') as f: json.dump(data, f, separators=(',', ':'))
    print('écrit', path, os.path.getsize(path) // 1024, 'Ko', file=sys.stderr)


if __name__ == '__main__':
    main()

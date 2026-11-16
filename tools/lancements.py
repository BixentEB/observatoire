#!/usr/bin/env python3
"""
OBSERVATOIRE — lancements de fusées et événements spatiaux pour l'Agenda du ciel.

Source : Launch Library 2 (The Space Devs, https://thespacedevs.com), base libre et tenue à jour par une
communauté de bénévoles, sans clé. Accès anonyme limité à 15 requêtes par heure : ce script en fait quatre
(lancements à venir, lancements passés récents, événements à venir, événements passés), toutes les six heures.

Chaque lancement reçoit une importance :
  1 — vol habité, mission d'exploration ou de science d'une agence (NASA, ESA, CNES, JAXA, ISRO, CNSA…),
      lancement depuis Kourou, premier vol d'une fusée ;
  2 — autres lancements nommés ;
  3 — lots de satellites d'une constellation (Starlink, Kuiper, Qianfan…), masqués par défaut dans l'Agenda.
Les lancements passés sont cumulés dans le fichier (archive), les plus anciens au-delà de 3 ans retirés.
Si la source ne répond pas, on garde le fichier précédent.

python3 tools/lancements.py   — sans dépendance ; écrit data/lancements.json
"""
import json, os, re, sys, time, urllib.request, datetime

UA = 'ObservatoireCodexMental/1.0 (https://obs.codexmental.com)'
API = 'https://ll.thespacedevs.com/2.3.0/'
OUT = os.path.join(os.path.dirname(__file__), '..', 'data', 'lancements.json')
AGENCIES = ('NASA', 'National Aeronautics', 'European Space Agency', 'ESA', 'CNES', 'Centre National', 'JAXA', 'Japan Aerospace',
            'Indian Space Research', 'ISRO', 'China National Space', 'CNSA', 'Roscosmos', 'Russian Federal Space', 'Canadian Space', 'DLR', 'ASI', 'UAE Space', 'MBRSC')
SWARM = re.compile(r'starlink|kuiper|qianfan|guowang|oneweb|transporter|bandwagon|yaogan|satnet|internet satellite', re.I)
SCIENCE = ('Planetary Science', 'Astrophysics', 'Heliophysics', 'Human Exploration', 'Space Science', 'Lunar', 'Earth Science', 'Resupply', 'Tourism', 'Test Flight')


def get(path):
    req = urllib.request.Request(API + path, headers={'User-Agent': UA, 'Accept': 'application/json'})
    with urllib.request.urlopen(req, timeout=90) as r:
        return json.loads(r.read().decode('utf-8'))


def g(d, *ks):
    for k in ks:
        if not isinstance(d, dict):
            return None
        d = d.get(k)
    return d


def launch(L):
    mission = L.get('mission') or {}
    agencies = [a.get('name', '') for a in (mission.get('agencies') or [])]
    prov = g(L, 'launch_service_provider', 'name') or ''
    name = L.get('name') or ''
    mtype = mission.get('type') or ''
    loc = g(L, 'pad', 'location', 'name') or ''
    crewed = 'Human' in mtype or bool(re.search(r'crew|soyuz ms|shenzhou|artemis i[iv]|axiom|polaris|gaganyaan', name, re.I))
    agency = any(a.startswith(x) or x in a for a in agencies + [prov] for x in AGENCIES)
    first = bool(re.search(r'maiden|first (test )?flight|demo', (mission.get('description') or '') + ' ' + name, re.I))
    if SWARM.search(name) and not crewed:
        imp = 3
    elif crewed or (agency and any(s in mtype for s in SCIENCE)) or 'Guiana' in loc or 'Kourou' in loc or first:
        imp = 1
    else:
        imp = 2
    prec = g(L, 'net_precision', 'abbrev') or ''
    o = {
        'id': L.get('id'), 'name': name, 'net': L.get('net'), 'prec': prec,
        'status': g(L, 'status', 'abbrev') or '', 'statusName': g(L, 'status', 'name') or '',
        'prov': prov, 'rocket': g(L, 'rocket', 'configuration', 'full_name') or g(L, 'rocket', 'configuration', 'name') or '',
        'mission': mission.get('name') or '', 'type': mtype, 'orbit': g(mission, 'orbit', 'name') or '',
        'desc': (mission.get('description') or '')[:600], 'agencies': agencies[:4],
        'pad': g(L, 'pad', 'name') or '', 'loc': loc, 'imp': imp, 'crew': crewed,
    }
    img = g(L, 'image', 'thumbnail_url') or g(L, 'image', 'image_url')
    if img:
        o['img'] = img
        o['imgCredit'] = g(L, 'image', 'credit') or ''
    return o


def event(E):
    return {'id': E.get('id'), 'name': E.get('name') or '', 'date': E.get('date'), 'prec': g(E, 'date_precision', 'abbrev') or '',
            'type': g(E, 'type', 'name') or '', 'desc': (E.get('description') or '')[:600], 'loc': E.get('location') or '',
            'url': (E.get('info_urls') or [{}])[0].get('url') if E.get('info_urls') else None}


def main():
    old = {}
    if os.path.exists(OUT):
        try:
            old = json.load(open(OUT, encoding='utf-8'))
        except Exception:
            old = {}
    try:
        up = get('launches/upcoming/?limit=100&mode=normal&hide_recent_previous=true&format=json')['results']
        time.sleep(3)
        prev = get('launches/previous/?limit=100&mode=normal&format=json')['results']
        time.sleep(3)
        ev = get('events/upcoming/?limit=60&mode=normal&format=json')['results']
        time.sleep(3)
        evp = get('events/previous/?limit=40&mode=normal&format=json')['results']
    except Exception as e:
        print('Launch Library 2 ne répond pas, on garde le fichier précédent :', e, file=sys.stderr)
        return 0
    now = datetime.datetime.now(datetime.timezone.utc)
    keep = now - datetime.timedelta(days=3 * 365)
    by = {}
    for o in old.get('launches', []):          # archive : on garde les anciens lancements
        try:
            if datetime.datetime.fromisoformat(o['net'].replace('Z', '+00:00')) >= keep:
                by[o['id']] = o
        except Exception:
            pass
    for L in prev + up:
        try:
            o = launch(L)
            if o['id'] and o['net']:
                by[o['id']] = o
        except Exception as e:
            print('lancement ignoré :', e, file=sys.stderr)
    evs = {o['id']: o for o in old.get('events', []) if o.get('date') and o['date'] >= keep.isoformat()}
    for E in evp + ev:
        o = event(E)
        if o['id'] and o['date']:
            evs[o['id']] = o
    data = {'updated': now.strftime('%Y-%m-%dT%H:%MZ'), 'source': 'Launch Library 2 (The Space Devs)',
            'launches': sorted(by.values(), key=lambda o: o['net']), 'events': sorted(evs.values(), key=lambda o: o['date'])}
    os.makedirs(os.path.dirname(OUT), exist_ok=True)
    with open(OUT, 'w', encoding='utf-8') as f:
        json.dump(data, f, ensure_ascii=False, separators=(',', ':'))
    n1 = sum(1 for o in data['launches'] if o['imp'] == 1)
    print(f"{len(data['launches'])} lancements (dont {n1} majeurs), {len(data['events'])} événements")
    return 0


if __name__ == '__main__':
    sys.exit(main())

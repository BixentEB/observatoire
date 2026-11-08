#!/usr/bin/env python3
"""
OBSERVATOIRE — bibliothèque d'images (Wikidata + Wikimedia Commons, candidats NASA en complément).

Pour chaque objet de data/images-sources.json :
  1. identifie l'objet dans Wikidata (QID imposé, sinon recherche par nom, vérifiée par sa nature :
     « galaxie », « comète »… et, pour les petits corps, par la désignation) ;
  2. prend l'image principale de l'objet dans Wikidata (propriété P18) ou un fichier Commons imposé ;
  3. lit sur Commons la licence, l'auteur, le crédit, la description et les catégories ;
     refuse les licences non libres, repère les vues d'artiste (« illustration », jamais « photo ») ;
  4. ne télécharge que si le fichier a changé (empreinte SHA-1 de Commons), convertit en WebP 480 et 1024 px ;
  5. écrit data/images.json (catalogue) et data/images-report.md (à relire) ;
  6. cherche aussi des candidats dans la photothèque de la NASA, proposés seulement (jamais retenus sans validation).

Statuts (dans images-sources.json, champ "status") : absent = automatique ; "validé" = ne plus rien changer
sauf si le fichier Commons est modifié ; "rejeté" = ne pas utiliser l'image trouvée ; "aucune" = pas de photo, visuel de remplacement.

python3 tools/images.py [--only id1,id2] — dépendance : Pillow (pour le WebP).
"""
import json, re, sys, os, io, time, hashlib, datetime, html, urllib.request, urllib.parse

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SRC = os.path.join(ROOT, 'data', 'images-sources.json')
OUT = os.path.join(ROOT, 'data', 'images.json')
REPORT = os.path.join(ROOT, 'data', 'images-report.md')
IMGDIR = os.path.join(ROOT, 'assets', 'img')
UA = 'ObservatoireCodexMental/1.0 (https://obs.codexmental.com ; https://github.com/BixentEB/observatoire)'
SIZES = (480, 1024)
QUALITY = 78
FREE = re.compile(r'^(no restrictions|public domain|pd|cc0|cc[- ]by(?:[- ]sa)?(?:[- ][0-9.]+)?(?:[- ](?:igo|au|de|fr|es|it|nl|us))*)\b', re.I)
NONFREE = re.compile(r'\b(nc|nd|non[- ]commercial|no[- ]derivatives|fair use|all rights reserved)\b', re.I)
ARTIST = re.compile(r"artist'?s? (impression|concept|rendering|illustration)|vue d'artiste|illustration|rendu d'artiste|simulation|animation still|computer[- ]generated", re.I)
RADAR = re.compile(r'\bradar\b|goldstone|arecibo', re.I)


def get(url, params=None, binary=False, tries=3):
    if params: url += ('&' if '?' in url else '?') + urllib.parse.urlencode(params)
    for k in range(tries):
        try:
            req = urllib.request.Request(url, headers={'User-Agent': UA, 'Accept': '*/*'})
            with urllib.request.urlopen(req, timeout=60) as r:
                data = r.read()
            return data if binary else json.loads(data.decode('utf-8'))
        except Exception as e:
            if k == tries - 1: raise
            time.sleep(2 + 3 * k)


def strip(s):
    s = re.sub(r'<[^>]+>', '', s or '')
    return re.sub(r'\s+', ' ', html.unescape(s)).strip()


# ---------- Wikidata ----------
def wd_entities(ids, props='claims|labels|aliases|descriptions'):
    if not ids: return {}
    j = get('https://www.wikidata.org/w/api.php', {'action': 'wbgetentities', 'ids': '|'.join(ids), 'props': props, 'languages': 'fr|en', 'format': 'json'})
    return j.get('entities', {})


def label(ent, lang=('fr', 'en')):
    for l in lang:
        v = ent.get('labels', {}).get(l)
        if v: return v['value']
    return ''


def claim_ids(ent, prop):
    out = []
    for c in ent.get('claims', {}).get(prop, []):
        v = c.get('mainsnak', {}).get('datavalue', {}).get('value')
        if isinstance(v, dict) and 'id' in v: out.append(v['id'])
        elif isinstance(v, str): out.append(v)
    return out


def natures(ent):
    """Libellés anglais des « nature de l'élément » (P31) — pour vérifier qu'on a bien une galaxie, une comète…"""
    ids = claim_ids(ent, 'P31')[:12]
    ents = wd_entities(ids, 'labels')
    return [label(ents.get(i, {}), ('en',)).lower() for i in ids]


def resolve(src, log):
    """Trouve le QID ; renvoie (qid, entité, méthode, confiance)."""
    expect = [e.lower() for e in src.get('expect', [])]
    if src.get('wikidata'):
        q = src['wikidata']; ent = wd_entities([q])[q]
        nat = natures(ent)
        ok = not expect or any(any(e in n for n in nat) for e in expect)
        log.append('QID imposé %s (%s) — nature : %s%s' % (q, label(ent), ', '.join(nat) or '?', '' if ok else ' ⚠ ne correspond pas à « %s »' % '/'.join(expect)))
        return q, ent, 'imposé', 'haute' if ok else 'à vérifier'
    tried = []
    for term in src.get('search', [src.get('label')]):
        for lang in ('en', 'fr'):
            j = get('https://www.wikidata.org/w/api.php', {'action': 'wbsearchentities', 'search': term, 'language': lang, 'type': 'item', 'limit': 6, 'format': 'json'})
            cands = [c['id'] for c in j.get('search', []) if c['id'] not in tried]
            tried += cands
            ents = wd_entities(cands)
            for q in cands:
                ent = ents.get(q, {}); nat = natures(ent)
                okn = not expect or any(any(e in n for n in nat) for e in expect)
                names = ' | '.join([label(ent, ('en',)), label(ent, ('fr',))] + [a['value'] for l in ('en', 'fr') for a in ent.get('aliases', {}).get(l, [])])
                okd = not src.get('designation') or src['designation'].lower().replace(' ', '') in names.lower().replace(' ', '')
                log.append('  candidat %s « %s » — nature : %s — %s' % (q, label(ent), ', '.join(nat[:4]) or '?', 'retenu' if okn and okd else 'écarté (%s)' % ('nature' if not okn else 'désignation')))
                if okn and okd:
                    return q, ent, 'recherche « %s »' % term, 'moyenne' if not src.get('designation') else 'haute'
    return None, None, 'introuvable', 'nulle'


# ---------- Commons ----------
def commons_info(filename):
    j = get('https://commons.wikimedia.org/w/api.php', {'action': 'query', 'titles': 'File:' + filename, 'prop': 'imageinfo|categories', 'cllimit': 50,
                                                         'iiprop': 'url|sha1|size|mime|extmetadata', 'iiurlwidth': max(SIZES), 'format': 'json'})
    page = next(iter(j['query']['pages'].values()))
    if 'imageinfo' not in page: return None
    ii = page['imageinfo'][0]; md = ii.get('extmetadata', {})
    val = lambda k: strip(md.get(k, {}).get('value', ''))
    cats = [c['title'].replace('Category:', '') for c in page.get('categories', [])]
    return {
        'title': filename, 'page': ii.get('descriptionurl'), 'url': ii.get('thumburl') or ii.get('url'), 'sha1': ii.get('sha1'),
        'width': ii.get('width'), 'height': ii.get('height'), 'mime': ii.get('mime'),
        'license': val('LicenseShortName'), 'licenseUrl': val('LicenseUrl'), 'author': val('Artist'), 'credit': val('Credit'),
        'description': val('ImageDescription')[:400], 'date': val('DateTimeOriginal')[:40], 'categories': cats[:30],
        'restrictions': val('Restrictions'),
    }


def classify(info):
    blob = ' '.join([info['title'], info['description'], ' '.join(info['categories'])])
    if ARTIST.search(blob): return 'illustration'
    if RADAR.search(blob): return 'radar'
    return 'photo'


def license_ok(info):
    lic = info['license'] or ''
    if NONFREE.search(lic): return False, 'licence non libre (%s)' % lic
    if FREE.search(lic.strip()): return True, lic
    return False, 'licence non reconnue (%s)' % (lic or 'absente')


# ---------- NASA (candidats seulement) ----------
def nasa_candidates(q, n=3):
    try:
        j = get('https://images-api.nasa.gov/search', {'q': q, 'media_type': 'image', 'page_size': 10})
    except Exception as e:
        return ['(recherche NASA impossible : %s)' % e]
    out = []
    for it in j.get('collection', {}).get('items', [])[:n]:
        d = it.get('data', [{}])[0]
        out.append('%s — « %s » (%s, %s) https://images.nasa.gov/details/%s' % (d.get('nasa_id'), d.get('title', '')[:80], d.get('center', '?'), (d.get('date_created') or '')[:10], d.get('nasa_id')))
    return out


# ---------- images ----------
def make_webp(raw, oid):
    from PIL import Image
    im = Image.open(io.BytesIO(raw)); im.load()
    if im.mode not in ('RGB', 'RGBA'): im = im.convert('RGBA' if 'A' in im.mode else 'RGB')
    files = {}
    os.makedirs(IMGDIR, exist_ok=True)
    for w in SIZES:
        c = im.copy()
        if c.width > w: c = c.resize((w, round(c.height * w / c.width)), Image.LANCZOS)
        p = os.path.join(IMGDIR, '%s-%d.webp' % (oid, w))
        c.save(p, 'WEBP', quality=QUALITY, method=6)
        files[str(w)] = {'src': 'assets/img/%s-%d.webp' % (oid, w), 'w': c.width, 'h': c.height, 'bytes': os.path.getsize(p)}
    return files


def main():
    only = None
    if '--only' in sys.argv: only = set(sys.argv[sys.argv.index('--only') + 1].split(','))
    sources = json.load(open(SRC, encoding='utf-8'))['objets']
    cat = json.load(open(OUT, encoding='utf-8')) if os.path.exists(OUT) else {'_aide': '', 'objets': {}}
    cat['_aide'] = 'Catalogue généré par tools/images.py — ne pas modifier à la main : corriger data/images-sources.json puis relancer.'
    objs = cat.setdefault('objets', {})
    rep = ['# Bibliothèque d\'images — rapport du %s UTC' % datetime.datetime.utcnow().strftime('%Y-%m-%d %H:%M'), '']
    downloads = 0
    for src in sources:
        oid = src['id']
        if only and oid not in only: continue
        log = []; entry = objs.get(oid, {})
        rep.append('## %s (`%s`)' % (src.get('label', oid), oid))
        try:
            if src.get('status') == 'aucune':
                objs[oid] = {'kind': 'aucune', 'fallback': src.get('fallback', 'type'), 'status': 'aucune', 'note': src.get('note', ''), 'uses': src.get('uses', [oid])}
                rep += ['Aucune photographie : visuel de remplacement (%s).' % src.get('fallback', 'type'), '']
                continue
            qid, ent, how, conf = resolve(src, log)
            rep += ['- Identification : **%s** — %s, confiance %s' % (qid or '—', how, conf)] + ['  ' + l for l in log[-8:]]
            fname = src.get('file')
            if not fname and ent:
                imgs = claim_ids(ent, 'P18')
                fname = imgs[0] if imgs else None
                rep.append('- Image principale Wikidata (P18) : %s' % (fname or 'aucune'))
            if not fname:
                rep += ['- ⚠ Pas d\'image trouvée : visuel de remplacement en attendant une validation.']
                objs[oid] = {'kind': 'aucune', 'fallback': src.get('fallback', 'type'), 'status': 'auto', 'qid': qid, 'uses': src.get('uses', [oid])}
            else:
                info = commons_info(fname)
                if not info: raise RuntimeError('fichier Commons introuvable : %s' % fname)
                ok, why = license_ok(info)
                kind = src.get('kind') or classify(info)
                rep += ['- Fichier : [%s](%s) — %s × %s' % (fname, info['page'], info['width'], info['height']),
                        '- Licence : %s %s' % (why, '✔' if ok else '✘'), '- Auteur : %s' % (info['author'] or '?'), '- Crédit : %s' % (info['credit'] or '?'),
                        '- Nature détectée : **%s**%s' % (kind, ' (à afficher comme illustration, jamais comme photographie)' if kind == 'illustration' else ''),
                        '- Description : %s' % (info['description'][:220] or '?')]
                if not ok or src.get('status') == 'rejeté':
                    objs[oid] = {'kind': 'aucune', 'fallback': src.get('fallback', 'type'), 'status': 'rejeté' if src.get('status') == 'rejeté' else 'licence', 'qid': qid, 'uses': src.get('uses', [oid])}
                    rep.append('- → non retenue, visuel de remplacement.')
                else:
                    same = entry.get('sha1') == info['sha1'] and all(os.path.exists(os.path.join(ROOT, f['src'])) for f in entry.get('files', {}).values())
                    if same:
                        files = entry['files']; rep.append('- Fichier inchangé : rien à télécharger.')
                    else:
                        raw = get(info['url'], binary=True); downloads += 1
                        files = make_webp(raw, oid)
                        rep.append('- Téléchargé et converti : %s' % ', '.join('%s px %d Ko' % (k, v['bytes'] // 1024) for k, v in files.items()))
                    objs[oid] = {'kind': kind, 'files': files, 'title': fname, 'page': info['page'], 'author': info['author'], 'credit': info['credit'],
                                 'license': info['license'], 'licenseUrl': info['licenseUrl'], 'source': 'Wikimedia Commons', 'description': info['description'][:300], 'date': info['date'], 'qid': qid, 'sha1': info['sha1'],
                                 'match': {'method': how, 'confidence': conf}, 'status': src.get('status', 'auto'), 'fetched': entry.get('fetched') if same else datetime.date.today().isoformat(),
                                 'uses': src.get('uses', [oid]), 'alt': src.get('alt', src.get('label', oid))}
            if src.get('nasa'):
                rep += ['- Candidats NASA (à valider, non utilisés) :'] + ['  - ' + c for c in nasa_candidates(src['nasa'])]
        except Exception as e:
            rep.append('- ✘ Erreur : %s' % e)
        rep.append('')
        time.sleep(0.5)
    rep += ['---', 'Téléchargements : %d. Poids total des images : %d Ko.' % (downloads, sum(f['bytes'] for o in objs.values() for f in o.get('files', {}).values()) // 1024)]
    json.dump(cat, open(OUT, 'w', encoding='utf-8'), ensure_ascii=False, indent=1)
    open(REPORT, 'w', encoding='utf-8').write('\n'.join(rep) + '\n')
    print('\n'.join(rep))


if __name__ == '__main__':
    main()

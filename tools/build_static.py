#!/usr/bin/env python3
"""Pages lisibles de l'Observatoire pour les moteurs de recherche et les IA.

Usage : python3 tools/build_static.py

Génère, sans toucher à la scène 3D :
- decouvrir/index.html : présentation de l'Observatoire, liste des hypothèses personnelles
  et des objets qu'on y explore (avec un lien vers chacun dans la scène) ;
- decouvrir/hypotheses/<id>/index.html : une page par hypothèse personnelle ;
- sitemap.xml.

Seules les hypothèses personnelles (hypotheses/index.json) sont publiées : pas celles des
chercheurs (hypotheses/chercheurs.json). Exclues : "brouillon": true, "exemple": true,
"index": false.

Bibliothèque standard uniquement. Relancé par .github/workflows/pages-lisibles.yml.
"""
import html, json, os, re, shutil

SITE = 'https://obs.codexmental.com'
AUTHOR = 'Vincent (Bixent)'
AUTHOR_URL = 'https://bixent.codexmental.com'
SITE_NAME = 'Observatoire · Codex Mental'
CONTACT = 'https://codexmental.com/#contact/form'
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT = os.path.join(ROOT, 'decouvrir')
MOIS = ['janvier', 'février', 'mars', 'avril', 'mai', 'juin', 'juillet', 'août', 'septembre', 'octobre', 'novembre', 'décembre']
STATUTS = {'piste': 'Piste', 'reflexion': 'En réflexion', 'developpement': 'En développement', 'abandonnee': 'Abandonnée'}


def esc(s):
    return html.escape(str(s or ''), quote=True)


def fr_date(d):
    try:
        y, m, j = (int(x) for x in d.split('-'))
        return '%d %s %d' % (j, MOIS[m - 1], y)
    except Exception:
        return d


# --- Markdown minimal, même règles que js/ui/md.js ---
def inline(s):
    s = esc(s)
    s = re.sub(r'`([^`]+)`', r'<code>\1</code>', s)
    s = re.sub(r'\*\*([^*]+)\*\*', r'<strong>\1</strong>', s)
    s = re.sub(r'(^|[^*])\*([^*\s][^*]*)\*', r'\1<em>\2</em>', s)

    def link(m):
        t, u = m.group(1), m.group(2)
        if u.startswith('#'):
            return '<a href="%s/%s">%s</a>' % (SITE, u, t)
        if not re.match(r'^(https?:|mailto:)', u):
            return t
        return '<a href="%s">%s</a>' % (u, t)
    return re.sub(r'\[([^\]]+)\]\(([^)\s]+)\)', link, s)


def md(src):
    out, para, lst = [], [], None

    def flush():
        nonlocal para, lst
        if para:
            out.append('<p>%s</p>' % inline(' '.join(para)))
            para = []
        if lst:
            out.append('<%s>%s</%s>' % (lst[0], ''.join('<li>%s</li>' % inline(i) for i in lst[1]), lst[0]))
            lst = None
    for l in src.replace('\r\n', '\n').split('\n'):
        if not l.strip():
            flush(); continue
        m = re.match(r'^(#{1,4})\s+(.*)$', l)
        if m:
            flush(); n = min(4, len(m.group(1)) + 1); out.append('<h%d>%s</h%d>' % (n, inline(m.group(2)), n)); continue
        m = re.match(r'^\s*[-*]\s+(.*)$', l) or re.match(r'^\s*\d+[.)]\s+(.*)$', l)
        if m:
            t = 'ul' if re.match(r'^\s*[-*]\s', l) else 'ol'
            if para or (lst and lst[0] != t):
                flush()
            if not lst:
                lst = (t, [])
            lst[1].append(m.group(1)); continue
        m = re.match(r'^>\s?(.*)$', l)
        if m:
            flush(); out.append('<blockquote>%s</blockquote>' % inline(m.group(1))); continue
        if lst:
            lst[1][-1] += ' ' + l.strip(); continue
        para.append(l.strip())
    flush()
    return '\n'.join(out)


# --- objets de la scène, lus dans js/data/*.js ---
ID = re.compile(r"\{\s*id:\s*'([^']+)'")
NAME = re.compile(r"\bname:\s*'((?:\\'|[^'])*)'")
KIND = re.compile(r"\bkind:\s*'((?:\\'|[^'])*)'")


def objects(fname):
    """Chaque objet commence par « { id: '…' » ; son nom et sa nature sont cherchés jusqu'à l'objet suivant."""
    with open(os.path.join(ROOT, 'js', 'data', fname), encoding='utf8') as f:
        src = f.read()
    starts = [m for m in ID.finditer(src)]
    out = []
    for k, m in enumerate(starts):
        seg = src[m.end(): starts[k + 1].start() if k + 1 < len(starts) else len(src)]
        n = NAME.search(seg)
        if not n:
            continue
        kd = KIND.search(seg)
        out.append((m.group(1), n.group(1).replace("\\'", "'"), kd.group(1).replace("\\'", "'") if kd else ''))
    return out


def group_bodies(items):
    groups = {}
    order = ['Le Soleil', 'Planètes', 'Planètes naines', 'Lunes', 'Comètes et petits corps', 'Ceintures et disques', 'Hypothétique']
    for i, n, k in items:
        if k.startswith('Étoile'):
            g = 'Le Soleil'
        elif k.startswith('Planète naine'):
            g = 'Planètes naines'
        elif k.startswith('Planète hypothétique'):
            g = 'Hypothétique'
        elif k.startswith('Planète'):
            g = 'Planètes'
        elif k.startswith('Satellite'):
            g = 'Lunes'
        elif k.startswith(('Ceinture', 'Disque')):
            g = 'Ceintures et disques'
        else:
            g = 'Comètes et petits corps'
        groups.setdefault(g, []).append((i, n))
    return [(g, groups[g]) for g in order if g in groups]


BAR = ('<header class="bar"><a class="brand" href="/"><img src="/favicon.svg" alt="" width="26" height="26"><span>OBSERVATOIRE · CODEX MENTAL</span></a>'
       '<a class="enter" href="/">Entrer dans l’Observatoire <span aria-hidden="true">→</span></a></header>')
PROMO = ('<a class="promo%s" href="/"><img src="/decouvrir/apercu.webp" alt="Aperçu du site" width="1280" height="720" loading="lazy">'
         '<span class="promo-t"><b>L’Observatoire, en 3D</b><span>Le système solaire, les étoiles voisines, la Voie lactée et le Groupe local à leurs vraies positions, avec des données réelles : cliquez sur un astre et explorez.</span>'
         '<span class="enter">Entrer dans l’Observatoire <span aria-hidden="true">→</span></span></span></a>')
OG_IMAGE = 'https://obs.codexmental.com/decouvrir/apercu.webp'


FOOT = ('<footer class="foot"><p>© %s — Codex Mental. Citation et reprise d\'extraits bienvenues, avec le nom de '
        'l\'auteur et un lien vers la page d\'origine. Pour une reprise plus large, <a href="%s">écrivez-moi</a>.</p>'
        '<p><a href="/decouvrir/">Découvrir l\'Observatoire</a> · <a href="/">Entrer dans l\'Observatoire</a></p></footer>')


def shell(title, desc, canonical, body, ld, og_type='article', top=False):
    return '''<!doctype html>
<html lang="fr">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>{t}</title>
<meta name="description" content="{d}">
<meta name="author" content="{a}">
<link rel="canonical" href="{c}">
<meta property="og:type" content="{o}">
<meta property="og:site_name" content="{s}">
<meta property="og:title" content="{t}">
<meta property="og:description" content="{d}">
<meta property="og:url" content="{c}">
<meta property="og:locale" content="fr_FR">
<meta property="og:image" content="{ogimg}">
<meta name="twitter:card" content="summary_large_image">
<link rel="icon" href="/favicon.svg" type="image/svg+xml">
<link rel="stylesheet" href="/decouvrir/lisible.css">
<script type="application/ld+json">{ld}</script>
</head>
<body>
{bar}
<main class="page">
{top}{b}
{promo}
{f}
</main>
</body>
</html>
'''.format(bar=BAR, promo=PROMO % '', top=(PROMO % ' top') if top else '', ogimg=OG_IMAGE, t=esc(title), d=esc(desc), a=esc(AUTHOR), c=esc(canonical), o=og_type, s=esc(SITE_NAME), b=body,
           f=FOOT % (esc(AUTHOR), esc(CONTACT)), ld=json.dumps(ld, ensure_ascii=False).replace('</', '<\\/'))


def write(rel, content):
    p = os.path.join(ROOT, rel)
    os.makedirs(os.path.dirname(p), exist_ok=True)
    with open(p, 'w', encoding='utf8') as f:
        f.write(content)


def main():
    person = {'@type': 'Person', 'name': AUTHOR, 'url': AUTHOR_URL}
    with open(os.path.join(ROOT, 'hypotheses', 'index.json'), encoding='utf8') as f:
        hyps = json.load(f)['hypotheses']
    keep = [h for h in hyps if not (h.get('brouillon') or h.get('exemple') or h.get('index') is False)]

    hdir = os.path.join(OUT, 'hypotheses')
    if os.path.isdir(hdir):
        shutil.rmtree(hdir)

    hpages = []
    for h in keep:
        with open(os.path.join(ROOT, 'hypotheses', h['fichier']), encoding='utf8') as f:
            body_md = f.read()
        url = '%s/decouvrir/hypotheses/%s/' % (SITE, h['id'])
        title = h['titre']
        desc = h.get('resume', '')
        ld = {'@context': 'https://schema.org', '@type': 'Article', 'headline': title, 'name': title, 'description': desc,
              'url': url, 'mainEntityOfPage': url, 'inLanguage': 'fr', 'author': person, 'copyrightHolder': person,
              'isPartOf': {'@type': 'WebSite', 'name': SITE_NAME, 'url': SITE},
              'genre': 'Hypothèse personnelle, spéculative', 'usageInfo': SITE + '/decouvrir/#reutilisation'}
        if h.get('date'):
            ld['datePublished'] = h['date']
        meta = [esc(AUTHOR), 'Hypothèse personnelle']
        if STATUTS.get(h.get('statut')):
            meta.append(esc(STATUTS[h['statut']]))
        if h.get('date'):
            meta.append('<time datetime="%s">%s</time>' % (esc(h['date']), esc(fr_date(h['date']))))
        warn = '<p class="warn">%s</p>' % esc(h['avertissement']) if h.get('avertissement') else ''
        body = ('<nav class="crumbs"><a href="/decouvrir/">Observatoire</a> › Hypothèses</nav>\n'
                '<header class="head"><h1>%s</h1><p class="meta">%s</p>'
                '<p><a class="go" href="%s">Voir dans l\'Observatoire</a></p></header>\n%s<div class="txt">%s</div>\n'
                '<p class="cite">Source : %s, « %s », Observatoire de Codex Mental%s — <a href="%s">%s</a></p>') % (
            esc(title), ' · '.join(meta), esc(SITE + '/#/hypotheses/' + h['id']), warn, md(body_md), esc(AUTHOR), esc(title),
            (', ' + esc(fr_date(h['date']))) if h.get('date') else '', esc(url), esc(url))
        write('decouvrir/hypotheses/%s/index.html' % h['id'], shell(title + ' — ' + SITE_NAME, desc, url, body, ld))
        hpages.append((url, title, h.get('date'), desc))

    # sommaire
    cats = [('Système solaire', group_bodies(objects('bodies.js')), '#/explorer/'),
            ('Sondes et stations', [('', [(i, n) for i, n, _ in objects('craft.js')])], '#/explorer/'),
            ('Voisinage stellaire (moins de 12 années-lumière)', [('', [(i, n) for i, n, _ in objects('stars.js')])], '#/voisinage/'),
            ('Systèmes à exoplanètes', [('', [(i, n) for i, n, _ in objects('exoplanets.js')])], '#/etoile/'),
            ('Voie lactée : repères', [('', [(i, n) for i, n, _ in objects('galaxy.js') if not n.startswith('Bras')])], '#/galaxie/'),
            ('Groupe local', [('', [(i, n) for i, n, _ in objects('localgroup.js')])], '#/groupe-local/')]
    parts = ['<header class="head"><h1>L\'Observatoire de Codex Mental</h1>'
             '<p class="meta">%s · <a href="/">obs.codexmental.com</a></p>'
             '<p>Une immersion astronomique : le système solaire et le voisinage stellaire à leurs vraies positions, '
             'objets cliquables, données réelles, et un espace d\'hypothèses.</p>'
             '<p>L\'Observatoire est né d\'une envie simple : pouvoir se promener dans l\'espace tel qu\'il est vraiment, '
             'cliquer sur un astre et en apprendre un peu plus, sans jamais se faire raconter d\'histoires. Sa règle d\'or : '
             'le visuel peut être adapté, les données jamais.</p>'
             '<p><a class="go" href="/">Entrer dans l\'Observatoire</a></p></header>' % esc(AUTHOR)]
    parts.append('<h2>Mes hypothèses</h2><p>Des pistes personnelles et spéculatives sur l\'espace, toujours séparées des données.</p><ul class="list">')
    for url, title, d, desc in hpages:
        parts.append('<li><a href="%s">%s</a>%s<br><span>%s</span></li>' % (
            esc(url.replace(SITE, '')), esc(title), (' <time datetime="%s">%s</time>' % (esc(d), esc(fr_date(d)))) if d else '', esc(desc)))
    parts.append('</ul>')
    parts.append('<h2>Ce qu\'on y explore</h2><p>Chaque objet s\'ouvre dans la scène 3D, avec sa console de données.</p>')
    seen = set()
    for title, groups, route in cats:
        parts.append('<h3>%s</h3>' % esc(title))
        for g, items in groups:
            links = []
            for i, n in items:
                if (route, i) in seen:
                    continue
                seen.add((route, i))
                links.append('<a href="%s">%s</a>' % (esc(SITE + '/' + route + i), esc(n)))
            if links:
                parts.append('<p class="objs">%s%s</p>' % (('<b>%s :</b> ' % esc(g)) if g else '', ' · '.join(links)))
    parts.append('<h2 id="reutilisation">Réutilisation</h2><p>Les textes, hypothèses et créations de l\'Observatoire sont '
                 'l\'œuvre de %s, tous droits réservés. Vous pouvez les citer et en reprendre des extraits en indiquant '
                 'le nom de l\'auteur et un lien vers la page d\'origine. Pour une reprise plus large, '
                 '<a href="%s">écrivez-moi</a>. Les données astronomiques proviennent des sources citées dans la page '
                 'Méthode de l\'Observatoire (NASA, JPL, ESA, IAU…).</p>' % (esc(AUTHOR), esc(CONTACT)))
    ld = {'@context': 'https://schema.org', '@type': 'CollectionPage', 'name': 'L\'Observatoire de Codex Mental',
          'url': SITE + '/decouvrir/', 'inLanguage': 'fr', 'author': person,
          'about': 'Astronomie, système solaire, voisinage stellaire, exoplanètes, Voie lactée, Groupe local',
          'hasPart': [{'@type': 'Article', 'name': t, 'url': u} for u, t, _, _ in hpages]}
    write('decouvrir/index.html', shell('Découvrir l\'Observatoire — ' + SITE_NAME,
                                        'L\'Observatoire de Codex Mental : le système solaire et le voisinage stellaire à leurs vraies positions, des données réelles et les hypothèses personnelles de ' + AUTHOR + '.',
                                        SITE + '/decouvrir/', '\n'.join(parts), ld, og_type='website', top=True))

    sm = ['<?xml version="1.0" encoding="UTF-8"?>', '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
          '  <url><loc>%s/</loc></url>' % SITE, '  <url><loc>%s/decouvrir/</loc></url>' % SITE]
    for url, _, d, _ in hpages:
        sm.append('  <url><loc>%s</loc>%s</url>' % (esc(url), ('<lastmod>%s</lastmod>' % d) if d else ''))
    sm.append('</urlset>')
    write('sitemap.xml', '\n'.join(sm) + '\n')
    print('%d hypothèse(s) publiée(s), %d objets listés' % (len(hpages), len(seen)))


if __name__ == '__main__':
    main()

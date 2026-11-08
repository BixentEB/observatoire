#!/usr/bin/env python3
"""
OBSERVATOIRE — numéros de version des fichiers.

Ajoute à chaque feuille de style et script locaux d'index.html un paramètre ?v=<empreinte>,
calculé sur le contenu du fichier : quand un fichier change, son adresse change, et le navigateur
des visiteurs télécharge la nouvelle version au lieu de garder l'ancienne en cache.
Les fichiers inchangés gardent la même adresse et restent en cache.

À lancer avant chaque publication : python3 tools/stamp.py  (sans dépendance)
"""
import hashlib, os, re

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
PAGES = ['index.html']
REF = re.compile(r'((?:src|href)=")((?:js|css|fonts)/[^"?#]+\.(?:js|css))(?:\?v=[0-9a-f]+)?(")')


def stamp(page):
    path = os.path.join(ROOT, page)
    html = open(path, encoding='utf-8').read()
    n = 0

    def rep(m):
        nonlocal n
        f = os.path.join(ROOT, m.group(2))
        if not os.path.exists(f):
            return m.group(0)
        h = hashlib.sha1(open(f, 'rb').read()).hexdigest()[:8]
        n += 1
        return '%s%s?v=%s%s' % (m.group(1), m.group(2), h, m.group(3))

    out = REF.sub(rep, html)
    if out != html:
        open(path, 'w', encoding='utf-8').write(out)
    print('%s : %d fichiers versionnés%s' % (page, n, '' if out != html else ' (rien n\'a changé)'))


if __name__ == '__main__':
    for p in PAGES:
        stamp(p)

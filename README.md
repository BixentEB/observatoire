# Observatoire · Codex Mental

**obs.codexmental.com** — une immersion astronomique : le système solaire et le voisinage stellaire à leurs vraies positions, chaque objet cliquable avec sa console de données, et un espace pour mes hypothèses.

Site statique, sans étape de construction (comme Codex Mental v3).

## Essayer en local
```bash
python3 -m http.server 8000      # puis http://localhost:8000
```
Un serveur est nécessaire pour les fiches d'hypothèses (chargées avec `fetch`) ; la scène, elle, fonctionne aussi en ouvrant `index.html` directement.

`?qualite=high|std|eco` force une qualité d'affichage (le choix fait dans les réglages est retenu).

`?demo` lance le mode démo, utilisé dans la fenêtre Observatoire de Codex Mental : interface masquée, léger accéléré, visite automatique de quelques planètes, bouton « Ouvrir l'Observatoire ».

## Règle d'or
**Le visuel peut être adapté, les données jamais.** Ce qui est adapté (échelle, tailles, vitesse, luminosité) ou simulé (surfaces sans carte, nuages, position des lunes autres que la Lune) est toujours signalé : badges dans la scène, bloc « Ce qui est représenté » dans chaque console, page Méthode.

## Adresses
| Adresse | Contenu |
|---|---|
| `#/` | Système solaire, vue d'ensemble |
| `#/explorer/<objet>` | Un objet (ex. `#/explorer/saturne`, `#/explorer/titan`) |
| `#/voisinage`, `#/voisinage/<étoile>` | Voisinage stellaire (ex. `#/voisinage/proxima`) |
| `#/etoile/<étoile>` | Système d'une étoile voisine : étoile, compagne, planètes confirmées |
| `#/atlas[/systeme\|voisinage[/carte\|liste]]` | Atlas : carte à plat ou liste, selon l'endroit où l'on est |
| `#/hypotheses`, `#/hypotheses/<fiche>` | Hypothèses |
| `#/simulateur` | Simulateur (modeler un corps céleste ; scénarios « et si… » à venir) |
| `#/methode` (`#/credits` y mène) | Méthode, sources, crédits et licences |

## Structure
| Fichier | Rôle |
|---|---|
| `index.html` | Page unique : scène, barre du haut, fil d'Ariane, console, temps, réglages, pages |
| `css/obs.css` | Toute l'interface (palette d'Héliosphère ; violet `--hypo` réservé aux hypothèses) |
| `js/core/perf.js` | Qualité : une seule fabrication au niveau estimé, une seconde seulement si le visiteur change la qualité ; jamais d'écran noir |
| `js/astro/astro.js` | Calculs : positions à la date (JPL), Lune, orientation des astres (IAU), conversions |
| `js/data/bodies.js` | Données réelles du système solaire (planètes, planètes naines, lunes, Halley, régions) |
| `js/data/stars.js` | Étoiles à moins de 12 années-lumière (positions réelles) |
| `js/data/craft.js` | Engins spatiaux : fiches (les positions sont dans `data/missions.json`) |
| `tools/missions.py` | Récupère les trajectoires JPL Horizons → `data/missions.json` (sans dépendance ; lancé chaque jour par `.github/workflows/missions.yml`) |
| `js/engine/shaders.js` | Shaders repris du moteur d'Héliosphère, avec cartes de surface réelles |
| `js/engine/core.js` | Rendu partagé, niveaux, fondus, temps simulé, décalage de la vue quand la console est ouverte |
| `js/engine/system.js` | Niveau « Système solaire » (échelle, objets, orbites, ceintures, étiquettes, caméra) |
| `js/engine/neighborhood.js` | Niveau « Voisinage stellaire » |
| `js/engine/starsystem.js` | Niveau « Système d'une étoile voisine » |
| `js/ui/search.js` | Recherche ( / ou Ctrl+K ) |
| `js/ui/console.js` | Console d'un objet : valeurs en direct, fiche, carte, exploration, ce qui est représenté, hypothèses liées |
| `js/ui/pages.js` | Méthode (avec les crédits) |
| `js/ui/atlas.js` | Atlas : carte à plat du système solaire (tailles lisibles ou réelles), règle des distances du voisinage, listes |
| `js/data/lore.js` | Origine des noms, projets et pistes |
| `js/ui/hypotheses.js` | Hypothèses (liste, fiche) et Simulateur |
| `js/ui/app.js` | Démarrage, navigation par adresse, fil d'Ariane, temps, réglages |
| `hypotheses/` | `index.json` (liste) et un `.md` par fiche |
| `textures/` | Cartes de surface (voir `textures/README.md` pour les sources et licences) |

## Ajouter une hypothèse
1. Écrire le texte dans `hypotheses/<id>.md` (titres `##`, listes, **gras**, liens).
2. Ajouter une entrée dans `hypotheses/index.json` :
   ```json
   { "id": "mon-idee", "titre": "…", "resume": "…", "statut": "piste", "date": "2026-11-02",
     "objets": ["jupiter"], "fichier": "mon-idee.md", "modele": { "base": "jupiter" } }
   ```
   - `statut` : `piste`, `reflexion`, `developpement`, `abandonnee` ;
   - `objets` : identifiants des objets liés (facultatif) — la fiche apparaît alors dans leur console ;
   - `modele` : réglages du viewer (facultatif), à copier depuis le Simulateur avec « Copier les réglages » ;
   - `brouillon: true` masque une fiche.
3. Supprimer l'entrée d'exemple `exemple-fiche` quand les vraies fiches arrivent.

## Ajouter un objet
Ajouter une entrée dans `js/data/bodies.js` (données réelles uniquement). Pour un corps à orbite propre, ajouter ses éléments orbitaux dans `js/astro/astro.js` (`SMALL`, source JPL Small-Body Database).

## État
Voir `docs/ETAT.md`.

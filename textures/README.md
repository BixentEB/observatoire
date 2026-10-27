# Cartes de surface

Chaque fichier est chargé en arrière-plan : tant qu'il n'est pas arrivé (ou s'il manque), l'objet garde un rendu procédural, la scène n'attend jamais.

| Fichier | Objet | Source | Licence |
|---|---|---|---|
| `mercure.jpg` | Mercure | Solar System Scope, d'après MESSENGER (NASA/JHUAPL) | CC BY 4.0 |
| `venus-surface.jpg` | Vénus, surface radar (non utilisée pour l'instant) | Solar System Scope, d'après Magellan | CC BY 4.0 |
| `terre.jpg` | Terre | Solar System Scope, d'après NASA Blue Marble | CC BY 4.0 |
| `terre-nuit.jpg` | Terre, lumières nocturnes | NASA Earth Observatory, Black Marble | Domaine public |
| `lune.jpg` | Lune | NASA SVS, CGI Moon Kit (données LRO) | Domaine public |
| `mars.jpg` | Mars | Solar System Scope, d'après les données NASA | CC BY 4.0 |
| `jupiter.jpg` | Jupiter | Solar System Scope, d'après Cassini et Hubble | CC BY 4.0 |
| `saturne.jpg` | Saturne | Solar System Scope, d'après Cassini | CC BY 4.0 |
| `saturne-anneaux.png` | Anneaux de Saturne (bande intérieur → extérieur, transparence = densité) | Solar System Scope | CC BY 4.0 |
| `uranus.jpg` | Uranus | Solar System Scope, d'après Voyager 2 | CC BY 4.0 |
| `neptune.jpg` | Neptune | Solar System Scope, d'après Voyager 2 | CC BY 4.0 |

Solar System Scope : https://www.solarsystemscope.com/textures/ — CC BY 4.0, attribution requise (faite dans la page Crédits et sous chaque carte dans les consoles).

Les fichiers ont été réencodés (JPEG progressif, 2048 × 1024). Pour plus de détail, on peut les remplacer par les versions 8k de Solar System Scope en gardant les mêmes noms.

## Ajouter une carte
1. Format équirectangulaire (2:1), longitude 0 au centre de l'image.
2. Déposer le fichier ici et ajouter `tex: 'nom.jpg'` à l'objet dans `js/data/bodies.js`.
3. Ajouter la ligne dans ce tableau, et le crédit dans `js/ui/console.js` (`CREDITS`) et `js/ui/pages.js` (page Crédits).

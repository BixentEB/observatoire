# État de l'Observatoire

## Première ébauche (octobre 2026)

### En place
- Moteur repris d'Héliosphère (three.js r128, shaders des planètes, du Soleil, des anneaux, du ciel, post-traitement), réorganisé en niveaux.
- **Système solaire** à la date du jour : 8 planètes, 5 planètes naines, la comète de Halley, 24 lunes principales, ceinture principale et ceinture de Kuiper.
  - Positions calculées (Standish/JPL pour les planètes, SBDB pour les petits corps, formule abrégée pour la Lune).
  - Orientation et rotation réelles (pôles et méridiens IAU) : la Terre montre le bon côté au Soleil à l'heure affichée.
  - Cartes de surface réelles : Mercure, Terre (+ lumières nocturnes), Lune, Mars, Jupiter, Saturne et anneaux, Uranus, Neptune.
  - Échelle adaptée (distances en r^0,55) ou distances réelles ; tailles toujours agrandies ; tout est signalé.
- **Voisinage stellaire** : 21 étoiles et naines brunes à moins de 12 années-lumière, à leurs vraies positions 3D, avec repères de 5 et 10 al.
- Passage d'un niveau à l'autre en zoomant (ou par le fil d'Ariane), avec un fondu court.
- Consoles d'objets : valeurs en direct (distance au Soleil, à la Terre, temps-lumière), fiche de données, carte de surface, exploration, « ce qui est représenté », hypothèses liées.
- Temps : temps réel jusqu'à 1 an par seconde, retour arrière, pause, retour à aujourd'hui.
- Pages : Index des objets, Hypothèses (liste, fiche, atelier de modelage), Méthode, Crédits.
- Mobile : console en panneau du bas (réductible), vue recentrée au-dessus, menu repliable.
- Qualité : niveau estimé une fois à l'arrivée ; changement manuel dans les réglages (rechargement) ; seule adaptation automatique : baisse discrète de la définition si l'appareil peine durablement.

### Retouches après les premières remarques
- Arrivée en direct, en temps réel ; bouton « En direct » dans la barre du temps, l'accéléré reste disponible avec + et −.
- Favicon en orbite, repris du logo.
- Méthode et Crédits regroupés dans un menu d'informations (icône i).
- Page Méthode plus rigoureuse : positions calculées et non ciel apparent, données scientifiques avec leurs approximations.
- Mentions réel / adapté / simulé en tête de chaque console.
- Encart « Origine du nom » et bloc « Projets et pistes » (en cours, prévu, à l'étude, concept spéculatif) : `js/data/lore.js`.

### Pistes suivantes
- Niveau **Voie lactée** (reconstitution fondée sur les représentations officielles, étiquetée comme telle), puis Groupe local.
- Cartes réelles pour les lunes galiléennes, Titan, Pluton et Charon (USGS / NASA), Vénus (nuages et radar).
- Positions réelles des lunes (éphémérides) au lieu des positions indicatives.
- Images de missions dans les consoles (domaine public NASA), sondes (Voyager, New Horizons…).
- Héliosphère et nuage d'Oort comme couche intermédiaire.
- Page de présentation légère sur codexmental.com, comme pour le Laboratoire.

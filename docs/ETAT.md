# État de l'Observatoire

## Première ébauche (octobre 2026)

### En place
- Moteur repris d'Héliosphère (three.js r128, shaders des planètes, du Soleil, des anneaux, du ciel, post-traitement), réorganisé en niveaux.
- **Système solaire** à la date du jour : 8 planètes, 5 planètes naines, la comète de Halley, 24 lunes principales, ceinture principale et ceinture de Kuiper.
  - Positions calculées (Standish/JPL pour les planètes, SBDB pour les petits corps, formule abrégée pour la Lune).
  - Orientation et rotation réelles (pôles et méridiens IAU) : la Terre montre le bon côté au Soleil à l'heure affichée.
  - Cartes de surface réelles : Mercure, Terre (+ lumières nocturnes), Lune, Mars, Jupiter, Saturne et anneaux, Uranus, Neptune.
  - Échelle adaptée (distances en r^0,55) ou distances réelles ; tailles toujours agrandies (rayon en r^0,4) ; tout est signalé.
  - Lunes : taille proportionnelle à leur planète (exposant 0,8), distance réelle en rayons de la planète jusqu'à 2,5 puis logarithmique (Mimas hors des anneaux, la Lune à ~7 rayons terrestres). Orbite de la Lune tracée dans son vrai plan.
  - Clic sur une planète à lunes : d'abord la vue de son système entier, second clic (ou clic sur une lune) pour s'approcher. Échap recule d'un cran.
- **Engins spatiaux** (26) : Voyager 1 et 2, Pioneer 10 et 11, New Horizons, Parker, Solar Orbiter, BepiColombo, JUICE, Europa Clipper, Psyche, Lucy, Hera, Hayabusa2, OSIRIS-APEX, Juno, Webb, ISS, Tiangong, LRO, Danuri, MRO, Mars Express, Hope, Artemis I et II.
  - Positions JPL Horizons précalculées par `tools/missions.py` dans `data/missions.json`, rafraîchies chaque jour par `.github/workflows/missions.yml` (Horizons refuse les appels directs depuis un navigateur).
  - Vecteurs interpolés (Catmull-Rom) autour du Soleil ou d'un astre ; éléments osculateurs propagés (Kepler) pour les orbiteurs rapides (ISS, orbiteurs de Mars et de la Lune, Juno).
  - Près d'un astre : direction réelle, distance compressée comme les lunes. Hors des dates couvertes : rien n'est affiché. Réglage « Engins spatiaux » pour les masquer.
  - Trajectoire de l'engin choisi tracée ; vols terminés (Artemis I et II) rejouables depuis la console.
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

### Deuxième série
- Arrivée sur le système solaire en léger accéléré (1 h/s) ; « Temps réel » passe en direct.
- Sortir du système en dézoomant demande un geste volontaire (pause puis insistance) : l'élan d'un pavé tactile ne suffit plus.
- Menu : Explorer, Atlas, Hypothèses, Méthode ; les crédits sont une section de la page Méthode.
- Atlas contextuel (système solaire ou voisinage), vues Carte et Liste. Carte à plat du système solaire façon planche astronomique, planètes texturées en rotation, lunes en dessous, tailles lisibles ou réelles. Règle des distances réelles pour le voisinage.
- « Atelier de modelage » renommé Simulateur, avec sa propre page.

### Troisième série
- Recherche (bouton loupe, ou touche / et Ctrl+K) : objets, étoiles, exoplanètes, hypothèses et pages, sans tenir compte des accents ; quelques noms anglais reconnus.
- Atlas : onglet Unités (km, seconde-lumière, UA, année-lumière, parsec, masses, kelvin, échelle de la lumière).
- Visite des étoiles voisines (`#/etoile/<id>`, `js/engine/starsystem.js`) : l'étoile teintée selon son type et à sa taille (compressée), sa compagne pour les systèmes doubles, ses planètes confirmées (périodes mesurées, distances par la loi de Kepler, aspect simulé). On y entre depuis l'Atlas, la console du voisinage ou en zoomant sur l'étoile ; on en sort en dézoomant.

### Surfaces détaillées : la Lune en premier
- Cartes réelles chargées à l'approche : couleur LROC 4k (2k sur les petits appareils) et relief LOLA converti en carte de pentes, sans exagération, éclairé par le vrai Soleil.
- On peut descendre jusqu'à ~100 km d'altitude ; le plan de coupure proche s'adapte, la caméra ne passe jamais sous la surface.
- 33 lieux aux coordonnées de l'IAU : mers et bassins, cratères, sites d'alunissage (Luna 9 à Chang'e 6), points le plus haut et le plus bas. Cliquables, dans la recherche, adresse `#/explorer/lune/<lieu>`.
- Fiche d'un lieu : Soleil au-dessus ou sous l'horizon en ce moment, Terre visible ou non (face cachée), altitude lue sur la carte LOLA.
- Console de la Lune : lieux remarquables, géologie, composition et ressources (glace, oxygène, hélium 3…), la Lune et la Terre.
- Limite assumée : 2,7 km par pixel ; de très près l'image devient floue plutôt que d'inventer des détails. Aller plus loin demande des tuiles à plus haute résolution (LROC 100 m/px), à télécharger depuis la NASA.

### Surfaces réelles pour tous les grands astres
- Mars : mosaïque Viking 4k et relief MOLA réel, 25 lieux (volcans de Tharsis, Valles Marineris, Hellas, sites d'atterrissage de Viking à Zhurong), géologie, ressources.
- Mercure : mosaïque MESSENGER 4k, 8 lieux (Caloris, Rembrandt, Hokusai, impact de MESSENGER…).
- Vraies cartes pour Io, Europe, Ganymède, Callisto, Titan (sol vu en infrarouge), Encelade, Mimas, Téthys, Dioné, Rhéa, Japet, Triton, Pluton, Charon, Cérès, Phobos, Déimos (fin des rendus simulés pour ces astres) ; lieux et géologie pour les plus importants.
- Terre : uniquement des points clés (extrêmes, grands impacts, bases de lancement, observatoires).
- Vénus et planètes géantes : blocs « Sous les nuages » ou « Structure ».
- Plus de faux relief tiré des couleurs : sans altimétrie, la surface est lisse (signalé).
- Bouton « Avancer jusqu'au lever du Soleil » sur un lieu plongé dans la nuit ; la caméra tourne avec la surface au-dessus d'un lieu.

### Pistes suivantes
- Relief réel pour Mercure, Pluton, Charon, Cérès, Téthys et Dioné (altimétries USGS), et lunes d'Uranus (Voyager, couverture partielle).
- Carte des lunaisons (la Lune au centre, phases à venir, curseur de dates).
- Ciel vu de la Terre : dôme à 360° avec étoiles et constellations ; lieu par géolocalisation (avec accord) ou choix d'une ville, ville par défaut si refus.
- Comparateur d'astres, parcours guidés, galaxie.
- Niveau **Voie lactée** (reconstitution fondée sur les représentations officielles, étiquetée comme telle), puis Groupe local.
- Cartes réelles pour les lunes galiléennes, Titan, Pluton et Charon (USGS / NASA), Vénus (nuages et radar).
- Positions réelles des lunes (éphémérides) au lieu des positions indicatives.
- Images de missions dans les consoles (domaine public NASA), sondes (Voyager, New Horizons…).
- Héliosphère et nuage d'Oort comme couche intermédiaire.
- Page de présentation légère sur codexmental.com, comme pour le Laboratoire.

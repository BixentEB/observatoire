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
- **Groupe local** : 14 galaxies aux positions mesurées (Andromède et le Triangle orientés selon inclinaison et angle de position), aspect reconstitué en points ; repères à 1, 2, 3 millions d'al. Entrée : dézoom en butée depuis la Voie lactée ; sortie : clic ou zoom sur la Voie lactée. `#/groupe-local[/id]`.
- **Exoplanètes** : 15 systèmes remarquables (TRAPPIST-1, 51 Pegasi, Kepler-90, PSR B1257+12…) placés dans la Voie lactée et visitables (`#/etoile/<id>`) ; masses minimales, mesurées ou estimées, signalées.
- **Voie lactée** (reconstitution signalée) : bras d'après Reid et al. 2019 (masers VLBI, prolongés au-delà des portions mesurées), barre de 5 kpc à 27°, bulbe, disque exponentiel, poussière, Nuages de Magellan ; 12 repères aux positions mesurées (Sagittarius A*, M42, Pléiades, Crabe, Aigle, Êta Carinae, Cygnus X-1, Oméga du Centaure, naine du Sagittaire, Nuages de Magellan). Entrée : dézoomer en butée depuis le voisinage, ou fil d'Ariane ; sortie : zoomer sur le Soleil. Adresse `#/galaxie[/objet]`. Points : 60 000 à 240 000 selon la qualité.
- **Voisinage stellaire** : 21 étoiles et naines brunes à moins de 12 années-lumière, à leurs vraies positions 3D, avec repères de 5 et 10 al.
- Passage d'un niveau à l'autre en zoomant (ou par le fil d'Ariane), avec un fondu court.
- Consoles d'objets : valeurs en direct (distance au Soleil, à la Terre, temps-lumière), fiche de données, carte de surface, exploration, « ce qui est représenté », hypothèses liées.
- Temps : temps réel jusqu'à 1 an par seconde, retour arrière, pause, retour à aujourd'hui.
- Pages : Index des objets, Hypothèses (deux onglets : personnelles en violet, signées Vincent une fois par page ; de chercheurs en bleu, avec auteurs, année et statut), Méthode, Crédits.
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

### Grande mise à jour du cahier (novembre 2026)
- Missions plus discrètes : losanges plus petits, nom au survol, à la sélection ou de près ; ils grossissent au survol.
- Étiquettes sans chevauchement : chaque nom essaie la droite, la gauche, le dessus puis le dessous, et évite aussi les disques des astres et les losanges (fin de la collision « Ceinture principale » / Mars).
- Légende-filtre en bas à droite : Planètes, naines et petits corps, lunes, ceintures, missions, objets hypothétiques ; un clic masque ou réaffiche le calque (mémorisé). Croix de fermeture, message qui renvoie aux Réglages, case « Légende » dans les Réglages. Effacée quand une console est ouverte.
- Vues prédéfinies (Dessus, Profil, Libre) à côté des repères d'échelle.
- Réglages « Plan de l'écliptique » (grille translucide, point vernal en doré) et « Inclinaison des orbites » (masquée, objet choisi, toutes) : traits jusqu'au plan, ombre de l'orbite, ligne des nœuds, valeur de i.
- Planète 9 : planète d'aspect imaginé (petite géante de glace) placée dans la région la plus probable, avec un « ? » en cadre pointillé dessous, et zone de probabilité (Brown et Batygin 2021) en brume bleue (couleur des hypothèses de chercheurs) ; nom qui alterne avec « ? », fiche sourcée ; calque et réglage « Objets hypothétiques ».
- Arrokoth ajouté (éléments SBDB), nom affiché seulement de près ; Ulysses ajoutée à la liste des engins (données au prochain passage du robot JPL), avec un bouton vers son passage le plus haut au-dessus du plan.
- Renvois entre fiches : les noms d'objets dans les textes et données des consoles sont soulignés en pointillé, bulle d'information et bouton « Aller voir ».
- Mode photo (bouton appareil photo de la barre du temps, ou Outils) : choix des éléments affichés, capture PNG avec les noms et une signature, définition ×2 si l'appareil le permet.
- Menu : nouvelle page Outils (Simulateur, Mode photo, outils prévus) ; Méthode devient un menu à onglets (Méthode, Crédits et licences) ; la page Hypothèses ne garde que les fiches.
- Première vraie hypothèse publiée : Caelesterium, avec un encadré d'avertissement et une animation 3D dédiée (`js/ui/hypo-anim.js` : régimes conservatif et actif, distance à l'étoile, vue en coupe, bilan illustratif).
- Correctifs : Atlas › Unités, titre et symbole ne se chevauchent plus (le symbole passe à la ligne si besoin) ; carte de Triton retouchée (`tools/triton-carte.py` : quadrillage effacé, nord jamais photographié en teinte neutre au lieu d'un aplat gris), signalé dans la fiche. Les ceintures sont de nouveau reconnues comme régions par la console.

### Voisinage stellaire
- Le Soleil se sélectionne comme les autres étoiles (fiche « Vous êtes ici ») ; un second clic ou un double-clic sur une étoile entre dans son système (le système solaire pour le Soleil) ; double-clic dans le vide : vue d'ensemble.

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

## Hypothèses de chercheurs (3 novembre 2026)
- Onglets « Hypothèses personnelles » / « Hypothèses de chercheurs » ; cartes en pointillés, violet pour les miennes (sans nom, signature « Vincent » une fois sur la page et en bas de chaque fiche), bleu pour les chercheurs (auteurs et année sur chaque carte).
- Sept fiches (`hypotheses/chercheurs.json`) : Planète 9 (en débat), Théia (admise, débattue dans le détail), Némésis (écartée), Vulcain (historique), ʻOumuamua voile artificielle (en débat), étoile de Tabby (écartée), panspermie (en débat). Statut en pastille de couleur, légende des statuts, sources.
- Les consoles de la Lune, de la Terre, du Soleil, de Mercure, de Mars, de la Planète 9 et de l'étoile de Tabby listent ces hypothèses (en bleu, auteurs et statut).
- Nouveau repère dans la Voie lactée : l'étoile de Tabby (KIC 8462852, ≈ 1 470 al, Cygne).
- Planète 9 passée en bleu (étiquette, « ? », brume, légende, Atlas, Méthode).

## Le saviez-vous ? (3 novembre 2026)
- Petite carte en bas à droite (`js/ui/facts.js`) : un ordre de grandeur ou un fait sur le niveau affiché (système solaire, voisinage, Voie lactée, Groupe local, autres systèmes), 6 s après l'arrivée puis toutes les deux minutes ; « Suivant », croix (fermée pour ce niveau), réglage « Le saviez-vous ? » mémorisé.
- Groupe local : légende corrigée (« les 14 principales galaxies sur plus de 80 connues »), étiquettes des cercles de distance qui ne se chevauchent plus.
- Groupe local : 29 galaxies naines ajoutées (43 en tout), positions de Mateo (1998) et distances de McConnachie (2012) ou des articles de découverte (Lion T, Bouvier I, Chiens de chasse I, Coupe II, Machine pneumatique 2…). Halos de gaz chaud et de matière noire autour de la Voie lactée (≈ 900 000 al de rayon) et d'Andromède (≈ 1,3 million d'al, projet AMIGA) en brume bleutée, avec étiquette.
- Lexique (`#/lexique[/<thème>[/<terme>]]`, carte dans Outils) : 119 définitions en six onglets (L'Univers avec la barre de composition 68/27/5 %, Matière et éléments, Étoiles, Planètes et petits corps, Galaxies et grandes structures, Mesures et mots), recherche sur tous les onglets sans accents, renvois entre termes, liens vers les objets dans la scène ; termes aussi dans la recherche générale. Données : `js/data/lexique.js`.
- Lueurs du Groupe local (galaxies et halos) : dégradé radial calculé par la carte graphique (`OBS.system.glowMesh`) au lieu de textures carrées ; nul au bord du cercle, paliers lissés, léger tramage contre les bandes ; plus de contours rectangulaires.

## Atlas élargi (7 novembre 2026)
- Règle commune (`ruler` dans `js/ui/atlas.js`, axe linéaire ou logarithmique, étiquettes en couloirs) : cartes du Voisinage, de la Voie lactée (repères et exoplanètes, log 10 al → 300 000 al) et du Groupe local (log 30 000 al → 6 M al).
- Onglet **Visiteurs** (`js/data/visitors.js`) : 3 interstellaires, 5 comètes périodiques, 6 grandes comètes, 5 astéroïdes proches de la Terre, 8 pluies d'étoiles filantes ; dates (passées / à venir calculées par rapport à aujourd'hui), frise des passages 1985-2066, composition, liens scène / hypothèses / Wikipédia (photos).
- Onglet **Types d'objets** (`js/data/types.js`) : 7 familles dont les « non-objets », 37 types avec caractéristiques et exemples cliquables ; **Cycles de formation** (vie d'une étoile à deux branches, naissance des planètes, croissance des galaxies), schémas animés signalés « simplifié ».
- Onglet **Échelles** (`js/data/scales.js`) : de l'atome à l'Univers, 29 repères sur 42 puissances de dix, liés aux niveaux et au Lexique.
- Index de l'Atlas réorganisés par catégories (7 novembre 2026) : bandeau pour chaque famille (`js/ui/bands.js` : fond spatial, illustration SVG symbolique par type, nombre d'objets), listes du Système solaire, du Voisinage (par type d'étoile), de la Voie lactée (étoiles, nébuleuses, amas, trous noirs, galaxies satellites, exoplanètes, bras) et du Groupe local (par forme) ; fiches des Visiteurs et des Types aérées (caractéristiques en pavés, plus de colonnes tassées).
- Bandeaux animés en 3D (`js/ui/minis.js`, 7 novembre 2026) : un seul moteur WebGL partagé dessine une mini-scène three.js par bandeau visible (galaxie en nuage de points, étoile à surface bouillonnante, planète éclairée à anneaux, lunes et phases, comète et queue de particules, rochers, ceinture en rotation képlérienne, nébuleuse, amas, trou noir et disque, système d'exoplanètes, bras, étoiles filantes, trajectoire hyperbolique, toile cosmique) ; 30 images/s au plus, seulement à l'écran, image fixe si moins de mouvement, dessin SVG de secours sans WebGL. Barre de filtres collée correctement en haut (fond opaque ; une seule ligne qui défile sur téléphone).
- Atlas en format liste (7 novembre 2026) : plus de cartes ni de pavés. Types et Visiteurs en lignes séparées par des filets (nom à gauche ; texte, caractéristiques en ligne « Masse 8 à 60 % du Soleil », dates, liens texte à droite) ; listes d'objets sans boîtes, en colonnes ; Échelles en échelle verticale (taille, point, nom, description, facteur entre deux paliers).
- Types d'objets (7 novembre 2026) : vignette 3D animée pour chacun des 37 types (`data-mini`, scènes dans `js/ui/minis.js`, 15 i/s), colonnes alignées quand une famille partage ses caractéristiques (étoiles, restes d'étoiles), fonds de couleur légers par nature d'information (masse violet, température orange, durée vert, taille bleu, lieu turquoise, composition rose, nombre or, vitesse rouge), repères comparatifs (barre de température 300 → 40 000 K avec le Soleil ; barre de taille par rapport à la Terre et Jupiter). Visiteurs : vue **Chronologie** (`#/atlas/visiteurs/chronologie`), toutes les dates sur une frise verticale avec repère « Aujourd'hui ».

## Lot 1 du grand patch (8 novembre 2026)
- Aperçu de partage : description, image 1200 × 630 (`assets/apercu.jpg`), carte Twitter/X.
- Numéros de version : `tools/stamp.py` ajoute `?v=<empreinte>` aux scripts et feuilles de style d'index.html ; tâche GitHub `versions.yml` après chaque modification de `js/`, `css/` ou `fonts/`.
- Pastille « Nouveau » (`js/ui/news.js`) : date fixe, 14 jours, s'éteint une fois la nouveauté ouverte ; point vert sur l'entrée de menu qui la contient.
- Méthode > Ressources : sources des données et sites de référence, en lignes.
- Lexique et hypothèses au même style de lignes que l'Atlas ; colonnes alignées des Types choisies par famille (étoiles, restes d'étoiles).

## Lot 2 du grand patch (8 novembre 2026)
- Position réelle des 20 grandes lunes (`tools/moons.py` → `data/moons.json`, éléments JPL Horizons tous les 2 jours de J−30 à J+180, relancé chaque jour) ; mention « Position calculée (JPL) » dans la console, position indicative hors de la fenêtre.
- Rovers sur Mars (`tools/rovers.py` → `data/rovers.json`, points de parcours MMGIS de la NASA) : Perseverance et Curiosity à leur dernière position publiée, avec le sol et le site d'atterrissage.
- Héliosphère (choc terminal ≈ 90 UA, héliopause ≈ 120 UA, forme schématique orientée vers le vent interstellaire) dans le système solaire ; nuage d'Oort (0,03 à 1,6 al, « déduit, jamais observé ») autour du Soleil dans le voisinage.
- Photos dans les consoles et les fiches Visiteurs (`js/ui/images.js`, `data/images.json`) : 37 objets demandés, crédits et licence sous chaque image ; taille maximale 1024 px.
- Retours sur le lot 2 : agrandissement des photos dans une fenêtre (image, description, auteur, date, crédit, licence, liens ; croix, clic à côté, Échap), panneau latéral de définition pour les liens vers le Lexique depuis les autres pages (renvois « Voir aussi », « Ouvrir dans le Lexique »), Ressources en boutons arrondis, pastille « Nouveau » réservée aux onglets et boutons. Images manquantes récupérées (Mercure, Ganymède, Callisto, Titan, Charon, Hale-Bopp, Terre) ; seule Apophis attend une validation.

## Atlas : règle des échelles (8 novembre 2026)
- Les lieux de l'Atlas se choisissent sur une règle de 8 niveaux (`js/ui/scalenav.js`, `OBS.SCALE_LEVELS`) : Système solaire, Voisinage stellaire, Voie lactée, Groupe local, puis Volume local, Superamas local, Laniakea, Univers observable. Validée sur maquette (#/maquette, retirée depuis).
- Ordinateur : panneau à gauche de la carte, ouvert par défaut (vignettes animées, étendue, recherche d'objet), repliable en fine règle numérotée (état mémorisé, `obs.atlas.panneau`) ; + et − changent de niveau.
- Téléphone (≤ 760 px) : barre « − niveau + » (nom, n / 8, étendue sur trois lignes) collée au-dessus de la carte ; un appui déplie la liste complète. Sous la carte : aide au zoom, pastilles compactes, bouton des tailles.
- « à venir » est calculé : un niveau est disponible dès que son id figure dans `OBS.ATLAS_SCOPES` (portées de `js/ui/atlas.js`). Les niveaux 5 à 8 affichent pour l'instant leur bandeau et « en préparation » (`#/atlas/volume-local`, `superamas`, `laniakea`, `univers`).
- Onglets restants : « Lieux » (retour au dernier niveau), Visiteurs, Types d'objets, Échelles ; Carte / Liste / Unités au-dessus de la carte.
- Zoom des cartes (`OBS.armPinch`) : pincement à deux doigts, double toucher pour revenir, Ctrl + molette ou pincement du pavé tactile sur ordinateur ; le zoom minimal fait tenir la carte dans la largeur.
- Système solaire : pastille « Tailles » retirée, bouton « Tailles : Lisibles | Réelles » sur sa propre ligne (choix actif en jaune adapté ou vert réel).

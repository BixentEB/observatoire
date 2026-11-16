/* ======================================================================
   OBSERVATOIRE — données tenues à la main pour l'Agenda du ciel
   - RDV : salons, festivals, nuits d'observation, journées. Dates vérifiées sur le site de l'organisateur
     ou une source qui le cite (champ src) ; « approx » quand la date suit une règle (week-end de l'Ascension…)
     ou n'est pas encore confirmée. Ajouter une ligne par édition, les anciennes restent (archives).
   - JOURS : journées internationales qui reviennent chaque année (ONU), à partir de leur création.
   - HISTOIRE : grandes dates de l'astronomie et de l'espace ; l'Agenda les montre le jour même
     (« ce jour-là ») puis chaque année en anniversaire.
   Les lancements de fusées, eux, arrivent automatiquement (tools/lancements.py → data/lancements.json).
   ====================================================================== */
(function () {
  'use strict';
  var OBS = window.OBS = window.OBS || {};

  /* id, nom, début, fin, lieu, description, lien, importance (1 grand rendez-vous, 2 notable, 3 local), [approx] */
  OBS.AGENDA_RDV = [
    { id: 'equinoxe-2026', name: 'Nuits de l\'équinoxe', start: '2026-03-20', end: '2026-03-22', where: 'Partout en France', imp: 2,
      d: 'Soirées d\'observation du ciel de printemps proposées par plus de cent clubs, à l\'initiative de l\'Association française d\'astronomie (AFA).', url: 'https://www.afastronomie.fr/' },
    { id: 'neaf-2026', name: 'NEAF, Northeast Astronomy Forum & Space Expo', start: '2026-04-11', end: '2026-04-12', where: 'Suffern, New York (États-Unis)', imp: 2,
      d: 'Le plus grand salon d\'astronomie et d\'espace au monde : plus de 4 000 visiteurs, constructeurs de télescopes, conférences d\'astronautes et de chercheurs de la NASA, observation du Soleil.', url: 'https://neafexpo.com/' },
    { id: 'rap-2026', name: 'Rencontres astronomiques de printemps (RAP)', start: '2026-05-14', end: '2026-05-17', where: 'Craponne-sur-Arzon (Haute-Loire)', imp: 2, approx: true,
      d: '28e édition du grand rassemblement d\'astronomes amateurs, toujours le week-end de l\'Ascension : trois nuits d\'observation avec des télescopes géants, conférences, stages d\'initiation.', url: 'https://astrorap.fr/' },
    { id: 'paris-etoiles-2026', name: 'Paris sous les étoiles', start: '2026-06-27', end: '2026-09-05', where: 'Parcs et jardins de Paris', imp: 3,
      d: '22 soirées gratuites d\'observation dans 21 parcs de la capitale, avec les animateurs de l\'AFA.', url: 'https://www.afastronomie.fr/' },
    { id: 'millevaches-2026', name: 'Astrofête du Plateau de Millevaches', start: '2026-07-03', end: '2026-07-04', where: 'Meymac (Corrèze)', imp: 3,
      d: 'Festival gratuit du Club d\'astronomie de Haute-Corrèze, avec le Parc naturel régional et l\'Institut d\'astrophysique de Paris : observation du Soleil au Mont-Bessou, conférences, nuit d\'observation.', url: 'https://www.festivalenfrance.com/festival/l-astrofete-du-plateau-de-millevaches' },
    { id: 'cielpur-2026', name: 'Rencontre en ciel pur', start: '2026-07-05', end: '2026-07-06', where: 'Saint-Véran (Hautes-Alpes)', imp: 3,
      d: '7e édition du festival d\'astronomie des Alpes, gratuit, dans le plus haut village d\'Europe : du très vulgarisé aux échanges poussés.', url: 'https://www.afastronomie.fr/manifestations/festival-rencontre-en-ciel-pur' },
    { id: 'astrauvergne-2026', name: 'Festival Astr\'Auvergne', start: '2026-07-16', end: '2026-07-18', where: 'Chamalières (Puy-de-Dôme)', imp: 3,
      d: 'Festival d\'astronomie avec une école d\'astronomie pour les 4-12 ans chaque matin, encadrée par des astrophysiciens.', url: 'https://www.afastronomie.fr/manifestations/festival-astrauvergne-2026' },
    { id: 'fleurance-2026', name: 'Festival d\'astronomie de Fleurance', start: '2026-07-31', end: '2026-08-07', where: 'Fleurance (Gers)', imp: 1,
      d: '36e édition de l\'un des plus grands festivals de culture scientifique d\'Europe : conférences de chercheurs, ateliers, planétarium, observations chaque nuit.', url: 'https://www.stelvision.com/astro/les-festivals-astro-printemps-ete-2026-en-france/' },
    { id: 'astrociel-2026', name: 'Rencontres AstroCiel', start: '2026-08-05', end: '2026-08-22', where: 'Lanuéjols (Gard)', imp: 2,
      d: 'Organisées par la Société astronomique de France (SAF), l\'un des grands rendez-vous de l\'astronomie amateur : nuits d\'observation sous le ciel noir des Causses.', url: 'https://saf-astronomie.fr/astrociel/' },
    { id: 'nde-2026', name: 'Nuits des étoiles', start: '2026-08-07', end: '2026-08-09', where: 'Partout en France', imp: 1,
      d: '36e édition du plus grand festival d\'astronomie en France : plus de 500 soirées gratuites organisées par près de 350 clubs. Thème 2026 : le Soleil, en route vers l\'éclipse du 12 août. Organisées par l\'AFA et Planète Sciences.', url: 'https://www.afastronomie.fr/les-nuits-des-etoiles' },
    { id: 'raagso-2026', name: 'RAAGSO, rassemblement de l\'astronomie amateur du Grand Sud-Ouest', start: '2026-09-10', end: '2026-09-13', where: 'Ambeyrac (Aveyron)', imp: 3,
      d: 'Star party : quatre nuits d\'observation entre passionnés, matériel partagé.', url: 'https://www.stelvision.com/astro/les-festivals-astro-printemps-ete-2026-en-france/' },
    { id: 'capespace-2026', name: 'Cap sur l\'Espace !', start: '2026-09-12', end: '2026-09-13', where: 'Cité des sciences et de l\'industrie, Paris', imp: 2,
      d: 'Week-end gratuit consacré à l\'exploration spatiale, organisé par le CNES et l\'ESA : rencontres avec des astronautes et des ingénieurs.', url: 'https://cnes.fr/communiques/cap-lespace-un-week-end-explorer-lunivers-gratuitement' },
    { id: 'inomn-2026', name: 'Nuit internationale d\'observation de la Lune', start: '2026-09-19', where: 'Partout dans le monde', imp: 2,
      d: 'International Observe the Moon Night, lancée par la NASA en 2010 : un samedi de septembre ou d\'octobre proche du premier quartier, quand le relief se lit le mieux le long de la limite jour-nuit.', url: 'https://science.nasa.gov/moon/observe-the-moon-night/' },
    { id: 'fds-2026', name: 'Fête de la science', start: '2026-10-02', end: '2026-10-12', where: 'Partout en France', imp: 2,
      d: '35e édition, gratuite, dans plus de 1 100 communes ; ouverte par la Nuit de la science. Beaucoup d\'observatoires et de planétariums ouvrent leurs portes.', url: 'https://www.fetedelascience.fr/' },
    { id: 'jdn-2026', name: 'Jour de la Nuit', start: '2026-10-10', where: 'Partout en France', imp: 2,
      d: 'Une nuit pour éteindre les lumières et redécouvrir le ciel étoilé : sensibilisation à la pollution lumineuse, sorties nocturnes, observations.', url: 'https://www.jourdelanuit.fr/' },
    { id: 'starmus-2026', name: 'Starmus VIII', start: '2026-10-17', end: '2026-10-22', where: 'Tenerife et La Palma (Espagne)', imp: 1,
      d: 'Festival de science, de musique et d\'art fondé par l\'astrophysicien Garik Israelian et Brian May : prix Nobel, astronautes, médaille Stephen Hawking. Thème « La recherche de la vérité ».', url: 'https://starmus.com/' },
    { id: 'rce-2026', name: 'Rencontres du Ciel et de l\'Espace', start: '2026-11-13', end: '2026-11-15', where: 'Cité des sciences et de l\'industrie, Paris', imp: 1,
      d: '15e édition du plus grand rendez-vous d\'astronomie en Europe, tous les deux ans depuis 1998 : plus de 150 conférenciers, ateliers, exposants, stands des observatoires. Organisées par l\'AFA, Ciel & Espace et la Cité des sciences.', url: 'https://www.afastronomie.fr/rencontres-ciel-espace' },
    { id: 'neaf-2027', name: 'NEAF, Northeast Astronomy Forum & Space Expo', start: '2027-04-10', end: '2027-04-11', where: 'Suffern, New York (États-Unis)', imp: 2,
      d: '36e édition du plus grand salon d\'astronomie et d\'espace au monde, précédé de la conférence d\'astrophotographie NEAIC (8 et 9 avril).', url: 'https://neafexpo.com/' },
    { id: 'rap-2027', name: 'Rencontres astronomiques de printemps (RAP)', start: '2027-05-06', end: '2027-05-09', where: 'Lieu à confirmer', imp: 2, approx: true,
      d: 'Le rassemblement d\'astronomes amateurs du week-end de l\'Ascension. Dates déduites de l\'Ascension 2027, à confirmer par les organisateurs.', url: 'https://astrorap.fr/' },
    { id: 'inomn-2027', name: 'Nuit internationale d\'observation de la Lune', start: '2027-10-09', where: 'Partout dans le monde', imp: 2, approx: true,
      d: 'International Observe the Moon Night (NASA). Date annoncée sur le site de la NASA, à confirmer.', url: 'https://science.nasa.gov/moon/observe-the-moon-night/' }
  ];

  /* journées internationales : mois, jour, durée (jours), depuis, nom, description */
  OBS.AGENDA_JOURS = [
    { m: 4, d: 12, from: 2011, name: 'Journée internationale du vol spatial habité', t: 'Proclamée par l\'ONU en 2011, cinquante ans après le vol de Youri Gagarine. On la fête aussi sous le nom de « Yuri\'s Night ».' },
    { m: 6, d: 30, from: 2017, name: 'Journée internationale des astéroïdes', t: 'Proclamée par l\'ONU en 2016, le jour anniversaire de l\'explosion de la Toungouska (1908), pour sensibiliser au risque d\'impact et aux moyens de s\'en protéger.' },
    { m: 7, d: 20, from: 2022, name: 'Journée internationale de la Lune', t: 'Proclamée par l\'ONU en 2021, le jour anniversaire de l\'alunissage d\'Apollo 11 (1969).' },
    { m: 10, d: 4, len: 7, from: 2000, name: 'Semaine mondiale de l\'espace', t: 'Du 4 au 10 octobre, proclamée par l\'ONU en 1999 : du lancement de Spoutnik 1 (4 octobre 1957) à l\'entrée en vigueur du Traité de l\'espace (10 octobre 1967).' }
  ];

  /* grandes dates : AAAA-MM-JJ, titre, explication, lien éventuel dans l'Observatoire */
  OBS.AGENDA_HIST = [
    ['1801-01-01', 'Découverte de Cérès', 'Giuseppe Piazzi, à Palerme, découvre le premier astéroïde, aujourd\'hui classé planète naine.', '#/explorer/ceres'],
    ['1846-09-23', 'Découverte de Neptune', 'Johann Galle la trouve à Berlin, à moins d\'un degré de la position calculée par Urbain Le Verrier : une planète découverte par le calcul.', '#/explorer/neptune'],
    ['1908-06-30', 'Explosion de la Toungouska', 'Un astéroïde ou une comète explose au-dessus de la Sibérie et couche 80 millions d\'arbres sur 2 000 km².'],
    ['1919-05-29', 'L\'éclipse qui confirme Einstein', 'Arthur Eddington mesure la déviation de la lumière des étoiles par le Soleil pendant une éclipse totale, comme le prévoyait la relativité générale.'],
    ['1930-02-18', 'Découverte de Pluton', 'Clyde Tombaugh la repère à l\'observatoire Lowell en comparant des photographies du ciel.', '#/explorer/pluton'],
    ['1957-10-04', 'Spoutnik 1, premier satellite artificiel', 'L\'URSS met en orbite une sphère de 58 cm dont le bip-bip fait le tour du monde : début de l\'ère spatiale.'],
    ['1957-11-03', 'Laïka, premier être vivant en orbite', 'La chienne voyage à bord de Spoutnik 2 ; elle ne survit que quelques heures.'],
    ['1959-09-14', 'Luna 2 atteint la Lune', 'Premier objet humain à toucher un autre astre.', '#/explorer/lune'],
    ['1961-04-12', 'Youri Gagarine, premier humain dans l\'espace', 'Un tour de la Terre en 108 minutes à bord de Vostok 1.'],
    ['1963-06-16', 'Valentina Terechkova, première femme dans l\'espace', 'Trois jours en orbite à bord de Vostok 6.'],
    ['1965-03-18', 'Première sortie dans l\'espace', 'Alexeï Leonov flotte douze minutes hors de Voskhod 2.'],
    ['1965-11-26', 'Astérix, premier satellite français', 'La France devient la troisième puissance spatiale, avec la fusée Diamant lancée depuis Hammaguir (Algérie).'],
    ['1966-02-03', 'Luna 9 se pose sur la Lune', 'Premier atterrissage en douceur sur un autre astre et premières photos prises depuis le sol lunaire.', '#/explorer/lune'],
    ['1967-11-28', 'Premier pulsar', 'Jocelyn Bell remarque un signal radio qui revient toutes les 1,34 seconde : une étoile à neutrons en rotation.'],
    ['1969-07-21', 'Premiers pas sur la Lune', 'Neil Armstrong pose le pied sur la mer de la Tranquillité (le 20 juillet au soir en heure américaine, vers 4 heures du matin le 21 en France), suivi de Buzz Aldrin.', '#/explorer/lune'],
    ['1971-04-19', 'Saliout 1, première station spatiale', 'L\'URSS place en orbite la première station habitable.'],
    ['1976-07-20', 'Viking 1 se pose sur Mars', 'Premières images en couleurs du sol martien et premières recherches de vie sur place.', '#/explorer/mars'],
    ['1977-08-20', 'Lancement de Voyager 2', 'Seule sonde à avoir visité Uranus et Neptune.', '#/explorer/voyager2'],
    ['1977-09-05', 'Lancement de Voyager 1', 'Aujourd\'hui l\'objet humain le plus lointain, dans l\'espace interstellaire depuis 2012.', '#/explorer/voyager1'],
    ['1979-12-24', 'Premier vol d\'Ariane', 'La fusée européenne Ariane 1 décolle de Kourou.'],
    ['1981-04-12', 'Premier vol de la navette spatiale', 'Columbia décolle vingt ans jour pour jour après Gagarine.'],
    ['1982-06-24', 'Jean-Loup Chrétien, premier Français dans l\'espace', 'Il rejoint la station Saliout 7 à bord de Soyouz T-6.'],
    ['1986-01-28', 'Accident de Challenger', 'La navette se désintègre 73 secondes après le décollage ; sept astronautes perdent la vie.'],
    ['1986-02-20', 'Lancement de Mir', 'Premier module de la station qui restera en orbite quinze ans.'],
    ['1986-03-14', 'Giotto au cœur de la comète de Halley', 'La sonde européenne frôle le noyau à 600 km et le photographie pour la première fois.'],
    ['1990-04-24', 'Lancement de Hubble', 'Le télescope spatial de la NASA et de l\'ESA, toujours en service.'],
    ['1994-07-16', 'La comète Shoemaker-Levy 9 frappe Jupiter', 'Une vingtaine de fragments s\'écrasent pendant six jours, laissant des taches plus grandes que la Terre.', '#/explorer/jupiter'],
    ['1995-10-06', 'Première exoplanète autour d\'une étoile comme le Soleil', 'Michel Mayor et Didier Queloz annoncent 51 Pegasi b (prix Nobel 2019).'],
    ['1997-07-04', 'Mars Pathfinder se pose', 'Avec Sojourner, premier rover sur Mars.', '#/explorer/mars'],
    ['1998-11-20', 'Premier module de la Station spatiale internationale', 'Zarya, lancé par une fusée Proton ; la station est habitée sans interruption depuis novembre 2000.'],
    ['2003-02-01', 'Accident de Columbia', 'La navette se désintègre lors de son retour dans l\'atmosphère ; sept astronautes perdent la vie.'],
    ['2005-01-14', 'Huygens se pose sur Titan', 'La sonde européenne réalise l\'atterrissage le plus lointain jamais tenté.', '#/explorer/titan'],
    ['2006-08-24', 'Pluton devient planète naine', 'L\'Union astronomique internationale adopte une définition de la planète qui l\'exclut.', '#/explorer/pluton'],
    ['2012-08-06', 'Curiosity se pose sur Mars', 'Suspendu sous une « grue volante », le rover arrive dans le cratère Gale.', '#/explorer/mars'],
    ['2013-02-15', 'Météore de Tcheliabinsk', 'Un astéroïde de 18 m explose au-dessus de la Russie ; l\'onde de choc blesse environ 1 500 personnes.'],
    ['2014-11-12', 'Philae se pose sur une comète', 'Premier atterrissage sur un noyau de comète, 67P/Tchourioumov-Guérassimenko, avec la mission Rosetta de l\'ESA.'],
    ['2015-07-14', 'New Horizons survole Pluton', 'Premières images détaillées de Pluton et de Charon, dont le grand cœur de glace.', '#/explorer/pluton'],
    ['2015-09-14', 'Premières ondes gravitationnelles', 'Les détecteurs LIGO captent la fusion de deux trous noirs, un siècle après la prédiction d\'Einstein.'],
    ['2019-04-10', 'Première image d\'un trou noir', 'L\'Event Horizon Telescope dévoile l\'ombre du trou noir de la galaxie M87.'],
    ['2021-02-18', 'Perseverance se pose sur Mars', 'Le rover du cratère Jezero, accompagné de l\'hélicoptère Ingenuity.', '#/explorer/mars'],
    ['2021-12-25', 'Lancement du télescope James Webb', 'Par une Ariane 5 depuis Kourou.'],
    ['2022-05-12', 'Image du trou noir de la Voie lactée', 'L\'Event Horizon Telescope montre Sagittarius A*, au centre de notre galaxie.', '#/galaxie/sgra'],
    ['2022-09-26', 'DART dévie un astéroïde', 'La NASA percute Dimorphos et raccourcit son orbite de 32 minutes : première défense planétaire.']
  ];
})();

/* ======================================================================
   OBSERVATOIRE — données du système solaire
   Règle : le visuel peut être adapté, les données jamais. Chaque valeur affichée
   ici est une valeur réelle (sources : NASA Planetary Fact Sheets, JPL, IAU).
   Champs :
     rKm      rayon moyen réel (km) — sert à la taille affichée, compressée
     rot      orientation IAU (pôle ra/dec en degrés, méridien W0 + Wd × jours depuis J2000)
     lock     rotation synchrone : la même face regarde la planète
     orbit    lunes : demi-grand axe réel (km), période (jours), sens
     look     rendu procédural (utilisé tant que la texture n'est pas chargée, ou s'il n'y en a pas)
     tex      carte de surface réelle (dossier textures/, voir crédits)
     facts    tableau [libellé, valeur] affiché dans la console
   ====================================================================== */
(function () {
  'use strict';
  var OBS = window.OBS = window.OBS || {};

  var B = [
  /* ---------------- Soleil ---------------- */
  { id: 'soleil', name: 'Soleil', kind: 'Étoile · naine jaune G2V', rKm: 696340,
    rot: { ra: 286.13, dec: 63.87, W0: 84.176, Wd: 14.1844 },
    text: "L'étoile du système solaire. Elle concentre à elle seule 99,86 % de la masse du système, et la fusion de l'hydrogène en hélium dans son cœur fournit la lumière et la chaleur de toutes les planètes.",
    facts: [['Diamètre', '1 392 700 km (109 Terres)'], ['Masse', '333 000 Terres'], ['Température de surface', '≈ 5 500 °C (5 772 K)'],
      ['Température du cœur', '≈ 15 millions °C'], ['Âge', '≈ 4,6 milliards d\'années'], ['Rotation', '≈ 25 jours à l\'équateur, ≈ 35 aux pôles'],
      ['Distance au centre galactique', '≈ 26 000 années-lumière']],
    missions: 'SOHO (depuis 1995), Parker Solar Probe (depuis 2018, la sonde la plus proche jamais envoyée), Solar Orbiter (depuis 2020).',
    lookNote: 'Surface animée : rendu simulé de la granulation et des taches.' },

  /* ---------------- Planètes ---------------- */
  { id: 'mercure', name: 'Mercure', kind: 'Planète tellurique', parent: 'soleil', rKm: 2439.7, tex: 'mercure.jpg',
    rot: { ra: 281.0103, raT: -0.0328, dec: 61.4155, decT: -0.0049, W0: 329.5988, Wd: 6.1385108 },
    look: { type: 0, scale: 1.3, seed: 9, relief: .04, ice: 0, c: [0x7d7b78, 0xb3aea8, 0x5a5856, 0xd6d2cc] },
    text: "La planète la plus proche du Soleil et la plus petite. Sans véritable atmosphère pour retenir la chaleur, elle passe d'une fournaise le jour à un froid extrême la nuit.",
    facts: [['Diamètre', '4 879 km'], ['Masse', '0,055 Terre'], ['Distance moyenne au Soleil', '57,9 millions km (0,39 UA)'], ['Année', '88 jours'],
      ['Rotation', '58,6 jours (un jour solaire dure 176 jours)'], ['Inclinaison de l\'axe', '0,03°'], ['Température', 'de −180 °C à 430 °C'],
      ['Gravité', '3,7 m/s² (0,38 g)'], ['Atmosphère', 'exosphère extrêmement ténue']],
    missions: 'Mariner 10 (1974-1975), MESSENGER (en orbite 2011-2015), BepiColombo (ESA/JAXA, mise en orbite prévue fin 2026).' },

  { id: 'venus', name: 'Vénus', kind: 'Planète tellurique', parent: 'soleil', rKm: 6051.8,
    rot: { ra: 272.76, dec: 67.16, W0: 160.20, Wd: -1.4813688 },
    look: { type: 3, bands: 3, warp: .09, seed: 2, c: [0xc9b48a, 0xe0cfa6, 0xeee2c4, 0xb89f72, 0xd8c49a], atmoK: .9, atmo: 0xf3dcae, shell: { k: 1.05, s: .6 } },
    text: "Presque jumelle de la Terre par la taille, Vénus est enveloppée de nuages d'acide sulfurique. Son effet de serre emballé en fait la planète la plus chaude du système, plus encore que Mercure.",
    facts: [['Diamètre', '12 104 km'], ['Masse', '0,815 Terre'], ['Distance moyenne au Soleil', '108,2 millions km (0,72 UA)'], ['Année', '225 jours'],
      ['Rotation', '243 jours, en sens rétrograde'], ['Inclinaison de l\'axe', '177,4°'], ['Température', '≈ 465 °C, jour et nuit'],
      ['Gravité', '8,87 m/s² (0,90 g)'], ['Atmosphère', '96,5 % de CO₂, pression 92 fois celle de la Terre']],
    missions: 'Venera (URSS, premiers atterrissages, 1970-1982), Magellan (cartographie radar, 1990-1994), Venus Express (2006-2014), Akatsuki (2015-2024). Prévues : EnVision, VERITAS, DAVINCI.',
    lookNote: 'Nuages : rendu simulé. En lumière visible, Vénus apparaît presque uniforme ; sa surface n\'est visible qu\'au radar.' },

  { id: 'terre', name: 'Terre', kind: 'Planète tellurique', parent: 'soleil', rKm: 6371.0, tex: 'terre.jpg', night: 'terre-nuit.jpg',
    rot: { ra: 0, raT: -0.641, dec: 90, decT: -0.557, W0: 190.147, Wd: 360.9856235 },
    look: { type: 4, seed: 4, c: [0x0b2a5a, 0x1d4f8a, 0x3c6b3a, 0x8a7a5a, 0xb89a62], clouds: .3, gloss: 1, atmoK: 1, atmo: 0x5d9bff, shell: { k: 1.06, s: 1 } },
    text: "Notre planète, la seule connue à abriter la vie. Son eau liquide, son atmosphère riche en azote et en oxygène et son champ magnétique en font un monde à part.",
    facts: [['Diamètre', '12 742 km'], ['Masse', '5,97 × 10²⁴ kg'], ['Distance moyenne au Soleil', '149,6 millions km (1 UA)'], ['Année', '365,26 jours'],
      ['Rotation', '23 h 56 min'], ['Inclinaison de l\'axe', '23,44°'], ['Température moyenne', '≈ 15 °C'],
      ['Gravité', '9,81 m/s²'], ['Atmosphère', '78 % d\'azote, 21 % d\'oxygène']],
    missions: 'Observée en continu par des centaines de satellites.',
    lookNote: 'Continents et lumières des villes : cartes réelles. Nuages : rendu illustratif, sans données météo en direct.' },

  { id: 'mars', name: 'Mars', kind: 'Planète tellurique', parent: 'soleil', rKm: 3389.5, tex: 'mars.jpg',
    rot: { ra: 317.269, raT: -0.10927, dec: 54.432, decT: -0.05827, W0: 176.049863, Wd: 350.891982443 },
    look: { type: 1, scale: 1.8, seed: 7, relief: .045, ice: 1, c: [0xb5562c, 0xd98c4f, 0x4a2a22, 0xffffff], atmoK: .28, atmo: 0xffa56b, shell: { k: 1.04, s: .45 } },
    text: "La planète rouge doit sa couleur à l'oxyde de fer de ses poussières. Elle abrite Olympus Mons, le plus haut volcan connu (environ 22 km), et les canyons de Valles Marineris.",
    facts: [['Diamètre', '6 779 km'], ['Masse', '0,107 Terre'], ['Distance moyenne au Soleil', '227,9 millions km (1,52 UA)'], ['Année', '687 jours'],
      ['Rotation', '24 h 37 min'], ['Inclinaison de l\'axe', '25,2°'], ['Température moyenne', '≈ −63 °C'],
      ['Gravité', '3,71 m/s² (0,38 g)'], ['Atmosphère', '95 % de CO₂, moins de 1 % de la pression terrestre']],
    missions: 'Viking (1976), Curiosity (depuis 2012), Perseverance et l\'hélicoptère Ingenuity (depuis 2021), Tianwen-1 et Zhurong (2021).' },

  { id: 'jupiter', name: 'Jupiter', kind: 'Planète géante gazeuse', parent: 'soleil', rKm: 69911, tex: 'jupiter.jpg',
    rot: { ra: 268.056595, raT: -0.006499, dec: 64.495303, decT: 0.002413, W0: 284.95, Wd: 870.536 },
    look: { type: 3, bands: 9, warp: .055, seed: 6, storm: 1, stormLat: -.38, stormLon: 1, c: [0x7a4a2c, 0xc79a6b, 0xefe0c8, 0xa3522f, 0xb8482a], atmoK: .4, atmo: 0xe0b890, shell: { k: 1.03, s: .5 } },
    text: "La plus grande planète : plus de 1 300 Terres tiendraient dans son volume. Sa Grande Tache rouge est un anticyclone plus large que la Terre, observé depuis au moins 1830.",
    facts: [['Diamètre', '139 820 km'], ['Masse', '317,8 Terres'], ['Distance moyenne au Soleil', '778,5 millions km (5,20 UA)'], ['Année', '11,86 ans'],
      ['Rotation', '9 h 56 min (la plus rapide des planètes)'], ['Inclinaison de l\'axe', '3,1°'], ['Température', '≈ −110 °C au sommet des nuages'],
      ['Gravité', '24,8 m/s² (2,5 g)'], ['Composition', 'hydrogène (≈ 90 %) et hélium']],
    missions: 'Pioneer 10 et 11, Voyager 1 et 2 (1979), Galileo (1995-2003), Juno (depuis 2016). En route : JUICE (arrivée 2031), Europa Clipper (arrivée 2030).' },

  { id: 'saturne', name: 'Saturne', kind: 'Planète géante gazeuse', parent: 'soleil', rKm: 58232, tex: 'saturne.jpg',
    ring: { inner: 74658, outer: 136775, tex: 'saturne-anneaux.png' },
    rot: { ra: 40.589, raT: -0.036, dec: 83.537, decT: -0.004, W0: 38.90, Wd: 810.7939024 },
    look: { type: 3, bands: 7, warp: .035, seed: 8, c: [0xb89a62, 0xdcc794, 0xefe3c0, 0x9a7c4a, 0xc9a86e], atmoK: .35, atmo: 0xf0dca8, shell: { k: 1.03, s: .45 } },
    text: "Célèbre pour ses anneaux de glace et de roche, larges de plus de 270 000 km mais épais de quelques dizaines de mètres à peine. Sa densité moyenne est inférieure à celle de l'eau.",
    facts: [['Diamètre', '116 460 km'], ['Masse', '95,2 Terres'], ['Distance moyenne au Soleil', '1,43 milliard km (9,58 UA)'], ['Année', '29,4 ans'],
      ['Rotation', '10 h 33 min'], ['Inclinaison de l\'axe', '26,7°'], ['Température', '≈ −140 °C au sommet des nuages'],
      ['Gravité', '10,4 m/s²'], ['Anneaux principaux', 'de 74 700 à 136 800 km du centre']],
    missions: 'Pioneer 11 (1979), Voyager 1 et 2 (1980-1981), Cassini-Huygens (2004-2017, atterrissage de Huygens sur Titan en 2005).' },

  { id: 'uranus', name: 'Uranus', kind: 'Planète géante de glace', parent: 'soleil', rKm: 25362, tex: 'uranus.jpg',
    ring: { inner: 41837, outer: 51149, tint: [0.35, 0.38, 0.42], alpha: .35 },
    rot: { ra: 257.311, dec: -15.175, W0: 203.81, Wd: -501.1600928 },
    look: { type: 3, bands: 3, warp: .02, seed: 15, c: [0x9fd6dc, 0xb5e3e6, 0xc9eef0, 0x8cc6cd, 0xd4f3f4], atmoK: .7, atmo: 0x9fe3ea, shell: { k: 1.04, s: .6 } },
    text: "Uranus roule presque couchée sur son orbite : son axe est incliné de près de 98°. Chaque pôle connaît ainsi 42 ans de jour puis 42 ans de nuit. Le méthane de son atmosphère lui donne sa teinte cyan.",
    facts: [['Diamètre', '50 724 km'], ['Masse', '14,5 Terres'], ['Distance moyenne au Soleil', '2,87 milliards km (19,2 UA)'], ['Année', '84 ans'],
      ['Rotation', '17 h 14 min, en sens rétrograde'], ['Inclinaison de l\'axe', '97,8°'], ['Température', '≈ −195 °C'],
      ['Gravité', '8,7 m/s²'], ['Composition', 'hydrogène, hélium, méthane ; manteau de glaces']],
    missions: 'Voyager 2 (survol en 1986), seule sonde à l\'avoir approchée.' },

  { id: 'neptune', name: 'Neptune', kind: 'Planète géante de glace', parent: 'soleil', rKm: 24622, tex: 'neptune.jpg',
    rot: { ra: 299.36, dec: 43.46, W0: 249.978, Wd: 541.1397757 },
    look: { type: 3, bands: 6, warp: .04, seed: 18, c: [0x133f9c, 0x215fca, 0x4389e8, 0x0c2b75, 0xa7c8ff], atmoK: .65, atmo: 0x427bdf, shell: { k: 1.04, s: .6 } },
    text: "La planète la plus lointaine, d'un bleu profond. Ses vents comptent parmi les plus rapides du système solaire, au-delà de 2 000 km/h. Elle a été découverte par le calcul avant d'être observée, en 1846.",
    facts: [['Diamètre', '49 244 km'], ['Masse', '17,1 Terres'], ['Distance moyenne au Soleil', '4,50 milliards km (30,1 UA)'], ['Année', '164,8 ans'],
      ['Rotation', '16 h 06 min'], ['Inclinaison de l\'axe', '28,3°'], ['Température', '≈ −200 °C'],
      ['Gravité', '11,2 m/s²'], ['Composition', 'hydrogène, hélium, méthane ; manteau de glaces']],
    missions: 'Voyager 2 (survol en 1989), seule sonde à l\'avoir approchée.' },

  /* ---------------- Planètes naines ---------------- */
  { id: 'ceres', tex: 'ceres.jpg', name: 'Cérès', kind: 'Planète naine · ceinture principale', parent: 'soleil', rKm: 469.7, dwarf: true,
    rot: { ra: 291.418, dec: 66.764, W0: 170.650, Wd: 952.1532 },
    look: { type: 0, scale: 1.6, seed: 61, relief: .05, ice: .1, c: [0x6a6660, 0x8b867f, 0x48443f, 0xb1aba3] },
    text: "Le plus gros objet de la ceinture d'astéroïdes, qui concentre à lui seul environ un tiers de sa masse. Ses taches brillantes, dans le cratère Occator, sont des dépôts de sels.",
    facts: [['Diamètre', '≈ 940 km'], ['Distance moyenne au Soleil', '2,77 UA'], ['Année', '4,6 ans'], ['Rotation', '9 h 04 min'], ['Température', '≈ −105 °C']],
    missions: 'Dawn (en orbite 2015-2018).', lookNote: 'Mosaïque en noir et blanc de la sonde Dawn (USGS).' },

  { id: 'pluton', tex: 'pluton.jpg', name: 'Pluton', kind: 'Planète naine · ceinture de Kuiper', parent: 'soleil', rKm: 1188.3, dwarf: true,
    rot: { ra: 132.993, dec: -6.163, W0: 302.695, Wd: 56.3625225 },
    look: { type: 0, scale: 1.2, seed: 24, relief: .03, ice: .65, c: [0x9a7f6a, 0xd9c3aa, 0x6b4c3a, 0xf2e6d8] },
    text: "Longtemps considérée comme la neuvième planète, reclassée planète naine en 2006. New Horizons y a révélé une immense plaine de glace d'azote en forme de cœur, Spoutnik Planitia.",
    facts: [['Diamètre', '2 377 km'], ['Masse', '0,0022 Terre'], ['Distance au Soleil', 'de 29,7 à 49,3 UA'], ['Année', '248 ans'],
      ['Rotation', '6,4 jours, en sens rétrograde'], ['Inclinaison de l\'axe', '122,5°'], ['Température', '≈ −230 °C'], ['Gravité', '0,62 m/s²']],
    missions: 'New Horizons (survol en 2015).', lookNote: 'Carte en couleurs de New Horizons. Seul un hémisphère a été vu de près : les zones grises n\'ont pas été photographiées.' },

  { id: 'haumea', name: 'Hauméa', kind: 'Planète naine · ceinture de Kuiper', parent: 'soleil', rKm: 798, dwarf: true, stretch: [1.36, 1.0, 0.6],
    look: { type: 0, scale: 1.4, seed: 62, relief: .02, ice: .9, c: [0xcfd3dc, 0xe9ecf3, 0x8f95a3, 0xffffff] },
    spinH: 3.915,
    text: "Une planète naine étirée en ellipsoïde par sa rotation très rapide, moins de quatre heures. Elle possède deux lunes, Hiʻiaka et Namaka, et un anneau découvert en 2017.",
    facts: [['Dimensions', '≈ 2 300 × 1 700 × 1 000 km'], ['Distance moyenne au Soleil', '43 UA'], ['Année', '≈ 281 ans'], ['Rotation', '3 h 55 min']],
    missions: 'Jamais visitée.', lookNote: 'Forme réelle (ellipsoïde), aspect de surface approché. Orientation de l\'axe non représentée.' },

  { id: 'makemake', name: 'Makémaké', kind: 'Planète naine · ceinture de Kuiper', parent: 'soleil', rKm: 715, dwarf: true,
    look: { type: 0, scale: 1.2, seed: 63, relief: .02, ice: .5, c: [0x8a4f35, 0xb87650, 0x5a3322, 0xe3c7a8] },
    spinH: 22.48,
    text: "Planète naine rougeâtre de la ceinture de Kuiper, découverte en 2005 peu après Pâques (son nom de code était « Easterbunny »). Sa surface est couverte de glace de méthane.",
    facts: [['Diamètre', '≈ 1 430 km'], ['Distance moyenne au Soleil', '45,4 UA'], ['Année', '≈ 306 ans'], ['Rotation', '22,5 h']],
    missions: 'Jamais visitée.', lookNote: 'Aspect approché. Orientation de l\'axe non représentée.' },

  { id: 'eris', name: 'Éris', kind: 'Planète naine · disque diffus', parent: 'soleil', rKm: 1163, dwarf: true,
    look: { type: 0, scale: 1.1, seed: 64, relief: .02, ice: 1, c: [0xd9dce4, 0xf2f4f8, 0x9aa0ad, 0xffffff] },
    spinH: 379,
    text: "À peine plus petite que Pluton mais un peu plus massive. Sa découverte, en 2005, a relancé le débat qui a conduit à redéfinir le mot « planète ». Son orbite, très inclinée, l'emmène jusqu'à près de 100 UA.",
    facts: [['Diamètre', '2 326 km'], ['Masse', '0,0028 Terre'], ['Distance au Soleil', 'de 38 à 98 UA'], ['Année', '≈ 561 ans'], ['Lune', 'Dysnomie']],
    missions: 'Jamais visitée.', lookNote: 'Aspect approché. Orientation de l\'axe non représentée.' },

  /* ---------------- Comète ---------------- */
  { id: 'halley', name: 'Comète de Halley', kind: 'Comète périodique · 1P/Halley', parent: 'soleil', rKm: 5.5, comet: true,
    look: { type: 0, scale: 2.4, seed: 81, relief: .06, ice: 0, c: [0x3a3633, 0x5a554f, 0x262321, 0x77716a] },
    spinH: 52.8,
    text: "La plus célèbre des comètes, visible à l'œil nu tous les 76 ans environ. Edmond Halley a prédit son retour en 1705. Elle est passée au plus loin du Soleil fin 2023 et revient vers nous : prochain passage au plus près en 2061.",
    facts: [['Noyau', '≈ 15 × 8 km'], ['Période', '≈ 76 ans'], ['Distance au Soleil', 'de 0,59 à 35 UA'], ['Dernier passage au périhélie', '9 février 1986'], ['Prochain passage', 'été 2061'], ['Sens de révolution', 'rétrograde']],
    missions: 'Giotto (ESA), Vega 1 et 2 (URSS), Suisei et Sakigake (Japon) : la flottille de 1986.',
    lookNote: 'Position approchée : orbite képlérienne simple, sans les perturbations des planètes. La queue n\'apparaît que près du Soleil.' },

  /* ---------------- Lunes ---------------- */
  { id: 'lune', name: 'Lune', kind: 'Satellite naturel de la Terre', parent: 'terre', rKm: 1737.4, moon: true, tex: 'lune.jpg',
    orbit: { real: 'moon', aKm: 384400, P: 27.3217 },
    rot: { ra: 269.9949, raT: 0.0031, dec: 66.5392, decT: 0.0130, W0: 38.3213, Wd: 13.17635815 },
    look: { type: 0, scale: 2, seed: 5, relief: .05, ice: 0, gain: .95, c: [0x7d7d80, 0xb0b0b4, 0x4a4a50, 0xdddddd] },
    text: "Le seul satellite naturel de la Terre, probablement né d'une collision géante il y a environ 4,5 milliards d'années. Elle nous montre toujours la même face.",
    facts: [['Diamètre', '3 475 km'], ['Masse', '0,0123 Terre'], ['Distance moyenne', '384 400 km'], ['Révolution', '27,3 jours'],
      ['Rotation', 'synchrone (27,3 jours)'], ['Température', 'de −170 °C à 120 °C'], ['Gravité', '1,62 m/s²']],
    missions: 'Programme Luna, Apollo (1969-1972, douze astronautes sur la surface), Chang\'e (dont le premier retour d\'échantillons de la face cachée en 2024), programme Artemis.' },

  { id: 'phobos', tex: 'phobos.jpg', name: 'Phobos', kind: 'Satellite de Mars', parent: 'mars', rKm: 11.1, moon: true, lock: true,
    orbit: { aKm: 9376, P: 0.31891 },
    look: { type: 0, scale: 2.4, seed: 71, relief: .07, ice: 0, c: [0x4e4740, 0x6d655c, 0x332e29, 0x8a8178] },
    text: "La plus grande des deux lunes de Mars, un corps irrégulier qui fait le tour de la planète en moins de huit heures. Elle se rapproche lentement de Mars et finira par se disloquer.",
    facts: [['Dimensions', '27 × 22 × 18 km'], ['Distance à Mars', '9 376 km'], ['Révolution', '7 h 39 min']] },
  { id: 'deimos', tex: 'deimos.jpg', name: 'Déimos', kind: 'Satellite de Mars', parent: 'mars', rKm: 6.2, moon: true, lock: true,
    orbit: { aKm: 23463, P: 1.26244 },
    look: { type: 0, scale: 2.4, seed: 72, relief: .05, ice: 0, c: [0x5a5249, 0x7a7166, 0x3a342e, 0x948a7f] },
    text: "La plus petite et la plus lointaine des lunes de Mars, à la surface lissée par une épaisse couche de poussière.",
    facts: [['Dimensions', '15 × 12 × 11 km'], ['Distance à Mars', '23 463 km'], ['Révolution', '30 h 18 min']] },

  { id: 'io', tex: 'io.jpg', name: 'Io', kind: 'Satellite galiléen de Jupiter', parent: 'jupiter', rKm: 1821.6, moon: true, lock: true,
    orbit: { aKm: 421700, P: 1.769138 },
    look: { type: 1, scale: 1.6, seed: 31, relief: .03, ice: 0, c: [0xc8b04a, 0xe6d58a, 0x8c6b2c, 0xf2eccd] },
    text: "Le monde le plus volcanique connu : plus de 400 volcans actifs, chauffés par les marées de Jupiter. Ses couleurs viennent du soufre.",
    facts: [['Diamètre', '3 643 km'], ['Distance à Jupiter', '421 700 km'], ['Révolution', '1,77 jour']] },
  { id: 'europe', tex: 'europe.jpg', name: 'Europe', kind: 'Satellite galiléen de Jupiter', parent: 'jupiter', rKm: 1560.8, moon: true, lock: true,
    orbit: { aKm: 671034, P: 3.551181 },
    look: { type: 0, scale: 1.4, seed: 32, relief: .01, ice: 0, c: [0xc9b89c, 0xe8ded0, 0x9c7e5e, 0xf4efe7] },
    text: "Sous sa croûte de glace se cache très probablement un océan d'eau salée, plus vaste que tous les océans terrestres réunis. L'un des endroits les plus prometteurs pour chercher la vie.",
    facts: [['Diamètre', '3 122 km'], ['Distance à Jupiter', '671 000 km'], ['Révolution', '3,55 jours']] },
  { id: 'ganymede', tex: 'ganymede.jpg', name: 'Ganymède', kind: 'Satellite galiléen de Jupiter', parent: 'jupiter', rKm: 2634.1, moon: true, lock: true,
    orbit: { aKm: 1070412, P: 7.154553 },
    look: { type: 0, scale: 1.5, seed: 33, relief: .03, ice: .2, c: [0x6e6558, 0xa59a88, 0x4a4339, 0xd8d0c2] },
    text: "La plus grande lune du système solaire, plus grande que Mercure. C'est la seule lune connue à posséder son propre champ magnétique.",
    facts: [['Diamètre', '5 268 km'], ['Distance à Jupiter', '1 070 000 km'], ['Révolution', '7,15 jours']] },
  { id: 'callisto', tex: 'callisto.jpg', name: 'Callisto', kind: 'Satellite galiléen de Jupiter', parent: 'jupiter', rKm: 2410.3, moon: true, lock: true,
    orbit: { aKm: 1882709, P: 16.689018 },
    look: { type: 0, scale: 1.8, seed: 34, relief: .05, ice: .1, c: [0x4f4840, 0x7a7064, 0x34302a, 0xb8ae9e] },
    text: "La surface la plus cratérisée du système solaire, presque inchangée depuis des milliards d'années.",
    facts: [['Diamètre', '4 821 km'], ['Distance à Jupiter', '1 883 000 km'], ['Révolution', '16,7 jours']] },

  { id: 'mimas', tex: 'mimas.jpg', name: 'Mimas', kind: 'Satellite de Saturne', parent: 'saturne', rKm: 198.2, moon: true, lock: true, orbit: { aKm: 185539, P: 0.942422 },
    look: { type: 0, scale: 2, seed: 41, relief: .06, ice: .3, c: [0x9a978f, 0xcfccc4, 0x6f6c66, 0xeeece6] },
    text: "Petite lune glacée marquée par l'énorme cratère Herschel, large d'un tiers de son diamètre.", facts: [['Diamètre', '396 km'], ['Révolution', '0,94 jour']] },
  { id: 'encelade', tex: 'encelade.jpg', name: 'Encelade', kind: 'Satellite de Saturne', parent: 'saturne', rKm: 252.1, moon: true, lock: true, orbit: { aKm: 237948, P: 1.370218 },
    look: { type: 0, scale: 1.6, seed: 42, relief: .02, ice: .6, c: [0xd8dde2, 0xf4f7fa, 0xaeb6bf, 0xffffff] },
    text: "L'objet le plus réfléchissant du système solaire. Des geysers jaillissent de son pôle sud, alimentés par un océan souterrain.", facts: [['Diamètre', '504 km'], ['Révolution', '1,37 jour']] },
  { id: 'tethys', tex: 'tethys.jpg', name: 'Téthys', kind: 'Satellite de Saturne', parent: 'saturne', rKm: 531.1, moon: true, lock: true, orbit: { aKm: 294619, P: 1.887802 },
    look: { type: 0, scale: 1.8, seed: 43, relief: .04, ice: .3, c: [0x9a978f, 0xcfccc4, 0x6f6c66, 0xeeece6] },
    text: "Lune de glace presque pure, balafrée par l'immense canyon Ithaca Chasma.", facts: [['Diamètre', '1 062 km'], ['Révolution', '1,89 jour']] },
  { id: 'dione', tex: 'dione.jpg', name: 'Dioné', kind: 'Satellite de Saturne', parent: 'saturne', rKm: 561.4, moon: true, lock: true, orbit: { aKm: 377396, P: 2.736915 },
    look: { type: 0, scale: 1.8, seed: 44, relief: .04, ice: .3, c: [0x96938b, 0xc9c6be, 0x6a6762, 0xe9e7e1] },
    text: "Lune glacée parcourue de falaises de glace brillantes.", facts: [['Diamètre', '1 123 km'], ['Révolution', '2,74 jours']] },
  { id: 'rhea', tex: 'rhea.jpg', name: 'Rhéa', kind: 'Satellite de Saturne', parent: 'saturne', rKm: 763.8, moon: true, lock: true, orbit: { aKm: 527108, P: 4.518212 },
    look: { type: 0, scale: 1.8, seed: 45, relief: .05, ice: .3, c: [0x949088, 0xc6c2b9, 0x67635e, 0xe6e3dc] },
    text: "La deuxième plus grande lune de Saturne, un monde de glace très cratérisé.", facts: [['Diamètre', '1 527 km'], ['Révolution', '4,52 jours']] },
  { id: 'titan', tex: 'titan.jpg', name: 'Titan', kind: 'Satellite de Saturne', parent: 'saturne', rKm: 2574.7, moon: true, lock: true, orbit: { aKm: 1221870, P: 15.945421 },
    look: { type: 3, bands: 2, warp: .02, seed: 46, c: [0xb57a32, 0xcf9447, 0xdeac62, 0xa86d2a, 0xd99a4e], atmoK: .9, atmo: 0xe0a050, shell: { k: 1.08, s: .8 } },
    text: "La seule lune dotée d'une atmosphère épaisse, et le seul autre monde connu où des liquides coulent en surface : des lacs et des mers de méthane et d'éthane.",
    facts: [['Diamètre', '5 150 km'], ['Distance à Saturne', '1 222 000 km'], ['Révolution', '15,9 jours'], ['Atmosphère', 'azote, pression 1,5 fois celle de la Terre']],
    missions: 'Huygens (atterrissage en 2005). Dragonfly (NASA, lancement prévu en 2028).', lookNote: 'Le sol est montré tel que Cassini l\'a vu en infrarouge, à travers la brume orangée qui le cache en lumière visible. Teinte uniforme ajoutée.' },
  { id: 'japet', tex: 'japet.jpg', name: 'Japet', kind: 'Satellite de Saturne', parent: 'saturne', rKm: 734.5, moon: true, lock: true, orbit: { aKm: 3560820, P: 79.3215 },
    look: { type: 0, scale: 1.6, seed: 47, relief: .04, ice: .6, c: [0x3a322b, 0x8a8478, 0x231e1a, 0xeeece6] },
    text: "Une lune à deux visages : une face sombre comme du charbon, l'autre brillante comme la neige. Une crête équatoriale haute de 13 km en fait le tour.", facts: [['Diamètre', '1 469 km'], ['Révolution', '79,3 jours']] },

  { id: 'miranda', name: 'Miranda', kind: 'Satellite d\'Uranus', parent: 'uranus', rKm: 235.8, moon: true, lock: true, orbit: { aKm: 129390, P: 1.413479 },
    look: { type: 0, scale: 1.8, seed: 51, relief: .05, ice: .3, c: [0x7a7670, 0xa29d95, 0x524e49, 0xc8c3bb] },
    text: "Une petite lune au relief chaotique, avec la plus haute falaise connue du système solaire, Verona Rupes, haute d'environ 20 km.", facts: [['Diamètre', '472 km'], ['Révolution', '1,41 jour']] },
  { id: 'ariel', name: 'Ariel', kind: 'Satellite d\'Uranus', parent: 'uranus', rKm: 578.9, moon: true, lock: true, orbit: { aKm: 191020, P: 2.520379 },
    look: { type: 0, scale: 1.8, seed: 52, relief: .04, ice: .3, c: [0x86827b, 0xb0aba3, 0x5a5650, 0xd2cdc5] },
    text: "La plus brillante des lunes d'Uranus, à la surface relativement jeune.", facts: [['Diamètre', '1 158 km'], ['Révolution', '2,52 jours']] },
  { id: 'umbriel', name: 'Umbriel', kind: 'Satellite d\'Uranus', parent: 'uranus', rKm: 584.7, moon: true, lock: true, orbit: { aKm: 266000, P: 4.144177 },
    look: { type: 0, scale: 1.8, seed: 53, relief: .04, ice: .1, c: [0x56524d, 0x75706a, 0x3a3734, 0x9a958e] },
    text: "La plus sombre des grandes lunes d'Uranus.", facts: [['Diamètre', '1 169 km'], ['Révolution', '4,14 jours']] },
  { id: 'titania', name: 'Titania', kind: 'Satellite d\'Uranus', parent: 'uranus', rKm: 788.9, moon: true, lock: true, orbit: { aKm: 435910, P: 8.705872 },
    look: { type: 0, scale: 1.8, seed: 54, relief: .04, ice: .2, c: [0x7a7670, 0xa29d95, 0x524e49, 0xc8c3bb] },
    text: "La plus grande lune d'Uranus.", facts: [['Diamètre', '1 578 km'], ['Révolution', '8,71 jours']] },
  { id: 'oberon', name: 'Obéron', kind: 'Satellite d\'Uranus', parent: 'uranus', rKm: 761.4, moon: true, lock: true, orbit: { aKm: 583520, P: 13.463239 },
    look: { type: 0, scale: 1.8, seed: 55, relief: .05, ice: .1, c: [0x6e6a64, 0x948f88, 0x4a4743, 0xbab5ad] },
    text: "La plus lointaine des grandes lunes d'Uranus, couverte de vieux cratères.", facts: [['Diamètre', '1 523 km'], ['Révolution', '13,5 jours']] },

  { id: 'triton', tex: 'triton.jpg', name: 'Triton', kind: 'Satellite de Neptune', parent: 'neptune', rKm: 1353.4, moon: true, lock: true, orbit: { aKm: 354759, P: 5.876854, retro: true },
    look: { type: 0, scale: 1.6, seed: 56, relief: .02, ice: .6, c: [0xb9a69a, 0xe0d2c8, 0x8a7468, 0xf3ebe5] },
    text: "La grande lune de Neptune tourne en sens inverse de la rotation de sa planète : sans doute un objet de la ceinture de Kuiper capturé. Voyager 2 y a observé des geysers d'azote.",
    facts: [['Diamètre', '2 707 km'], ['Distance à Neptune', '354 800 km'], ['Révolution', '5,88 jours, en sens rétrograde'], ['Température', '≈ −235 °C']] },

  { id: 'charon', tex: 'charon.jpg', name: 'Charon', kind: 'Satellite de Pluton', parent: 'pluton', rKm: 606, moon: true, lock: true, orbit: { aKm: 19591, P: 6.3872 },
    look: { type: 0, scale: 1.6, seed: 58, relief: .03, ice: .3, c: [0x8a8580, 0xb3aea8, 0x5c5854, 0xd4cfc9] },
    text: "Si grande par rapport à Pluton (la moitié de son diamètre) que les deux tournent autour d'un point situé entre eux. Ils se montrent toujours la même face.",
    facts: [['Diamètre', '1 212 km'], ['Distance à Pluton', '19 591 km'], ['Révolution', '6,39 jours']] }
  ];

  /* Régions (repères cliquables sans corps unique) */
  var REGIONS = [
    { id: 'ceinture', name: 'Ceinture principale', kind: 'Ceinture d\'astéroïdes', au: 2.7, lonDeg: 128,
      text: "Entre Mars et Jupiter, des millions de corps rocheux que l'attraction de Jupiter a empêchés de s'assembler en planète. Malgré leur nombre, leur masse totale ne représente qu'environ 3 % de celle de la Lune.",
      facts: [['Étendue', 'de 2,1 à 3,3 UA environ'], ['Plus gros objet', 'Cérès (≈ 940 km)'], ['Masse totale', '≈ 3 % de la Lune']],
      lookNote: 'Les astéroïdes affichés sont des points répartis selon la vraie structure de la ceinture, pas des objets individuels catalogués.' },
    { id: 'kuiper', name: 'Ceinture de Kuiper', kind: 'Disque de corps glacés', au: 42, lonDeg: 210,
      text: "Un vaste anneau de corps glacés au-delà de Neptune, vestiges de la formation du système solaire. Pluton, Hauméa et Makémaké en font partie.",
      facts: [['Étendue', 'de 30 à 50 UA environ'], ['Membres notables', 'Pluton, Hauméa, Makémaké, Arrokoth']],
      lookNote: 'Les corps affichés sont répartis selon la structure réelle de la ceinture, pas des objets catalogués un à un.' }
  ];

  OBS.BODIES = B;
  OBS.REGIONS = REGIONS;
  OBS.byId = {};
  B.concat(REGIONS).forEach(function (b) { OBS.byId[b.id] = b; });
  OBS.childrenOf = function (id) { return B.filter(function (b) { return b.parent === id && b.moon; }); };
})();

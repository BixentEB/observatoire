/* ======================================================================
   OBSERVATOIRE — Voie lactée : objets repères
   Positions réelles : coordonnées galactiques (l, b) et distance au Soleil.
   La galaxie elle-même est une reconstitution (voir js/engine/galaxy.js).
   ====================================================================== */
(function () {
  'use strict';
  var OBS = window.OBS = window.OBS || {};

  // Distance du Soleil au centre galactique : 8,178 kpc (collaboration GRAVITY, 2019), soit ≈ 26 670 années-lumière.
  OBS.GALAXY = {
    R0: 26670,           // années-lumière
    zSun: 65,            // le Soleil est ≈ 20 pc (65 al) au-dessus du plan galactique
    // bras spiraux : spirales logarithmiques ajustées sur les masers mesurés par VLBI (Reid et al. 2019, table 2) :
    //   ln(R / Rk) = −(β − βk) · tan ψ   (R en kpc ; β : azimut vu du centre, 0 vers le Soleil, croissant dans le sens de rotation)
    // « mesure » : portion de β couverte par les mesures ; le reste (« b ») est prolongé avec le même angle : reconstitution.
    arms: [
      { id: 'scutum', name: 'Bras de l\'Écu-Croix', alias: 'Scutum-Centaurus, bras majeur', major: true, Rk: 4.91, bk: 23, psi: [14.1, 12.1], w: .23, b: [-250, 104], mesure: [0, 104] },
      { id: 'perseus', name: 'Bras de Persée', alias: 'bras majeur', major: true, Rk: 8.87, bk: 40, psi: [10.3, 8.7], w: .35, b: [-150, 262], mesure: [-23, 115] },
      { id: 'sagittaire', name: 'Bras du Sagittaire-Carène', alias: 'bras mineur', Rk: 6.04, bk: 24, psi: [17.1, 1.0], w: .27, b: [-110, 200], mesure: [2, 97] },
      { id: 'exterieur', name: 'Bras extérieur', alias: 'prolongement du bras de la Règle (Norma)', Rk: 12.24, bk: 18, psi: [3.0, 9.4], w: .5, b: [-60, 372], mesure: [-16, 71] },
      { id: 'norma', name: 'Bras de la Règle', alias: 'Norma, bras mineur intérieur', Rk: 4.46, bk: 18, psi: [-1.0, 19.5], w: .2, b: [-6, 54], mesure: [-6, 54] },
      { id: 'orion', name: 'Bras d\'Orion', alias: 'bras local, celui du Soleil', spur: true, Rk: 8.26, bk: 9, psi: [11.4, 11.4], w: .31, b: [-14, 40], mesure: [-8, 34] }
    ],
    bar: { halfKpc: 5.0, angle: 27 }
  };

  // l, b en degrés ; ly : distance au Soleil
  OBS.GALAXY_OBJECTS = [
    { id: 'soleil-g', name: 'Soleil', sun: true, kind: 'Notre étoile · vous êtes ici', l: 0, b: 0, ly: 0,
      text: "Le Soleil tourne autour du centre de la galaxie à environ 230 km/s : un tour complet, une « année galactique », prend quelque 230 millions d'années. Il se trouve dans le bras d'Orion, une branche secondaire entre les bras du Sagittaire et de Persée, à peu près à mi-chemin entre le centre et le bord du disque.",
      facts: [['Distance au centre', '≈ 26 670 années-lumière'], ['Vitesse autour du centre', '≈ 230 km/s'], ['Une année galactique', '≈ 230 millions d\'années'], ['Au-dessus du plan', '≈ 65 années-lumière']] },
    { id: 'sgra', name: 'Sagittarius A*', kind: 'Trou noir supermassif · centre galactique', l: 359.944, b: -0.046, ly: 26670,
      text: "Au centre de la galaxie, un trou noir de quatre millions de masses solaires. On l'a « pesé » en suivant pendant des décennies les étoiles qui tournent autour de lui (prix Nobel 2020), et l'Event Horizon Telescope en a publié la première image de l'ombre en mai 2022. Les nuages de gaz et de poussière qui nous en séparent le rendent invisible à l'œil nu.",
      facts: [['Masse', '≈ 4,3 millions de masses solaires'], ['Distance', '≈ 26 670 années-lumière'], ['Première image', 'Event Horizon Telescope, 12 mai 2022']] },
    { id: 'orion-m42', name: 'Nébuleuse d\'Orion', kind: 'Pouponnière d\'étoiles · M42', l: 209.01, b: -19.38, ly: 1344,
      text: "La région de formation d'étoiles massives la plus proche, visible à l'œil nu sous le Baudrier d'Orion. Des milliers d'étoiles y naissent, certaines entourées de disques où se forment peut-être des planètes.",
      facts: [['Distance', '≈ 1 344 années-lumière'], ['Constellation', 'Orion']] },
    { id: 'pleiades', name: 'Pléiades', kind: 'Amas ouvert · M45', l: 166.57, b: -23.52, ly: 444,
      text: "Un amas d'étoiles jeunes, à peine 100 millions d'années, nées ensemble et encore groupées. Six ou sept sont visibles à l'œil nu.",
      facts: [['Distance', '≈ 444 années-lumière'], ['Âge', '≈ 100 millions d\'années'], ['Constellation', 'Taureau']] },
    { id: 'crabe', name: 'Nébuleuse du Crabe', kind: 'Reste de supernova · M1', l: 184.56, b: -5.78, ly: 6500,
      text: "Les débris de l'explosion d'une étoile, observée par des astronomes chinois en 1054 : elle fut visible en plein jour pendant trois semaines. En son centre tourne un pulsar, 30 fois par seconde.",
      facts: [['Distance', '≈ 6 500 années-lumière'], ['Explosion observée', 'juillet 1054']] },
    { id: 'aigle', name: 'Nébuleuse de l\'Aigle', kind: 'Pouponnière d\'étoiles · M16', l: 16.95, b: 0.79, ly: 5700,
      text: "Elle abrite les « Piliers de la création », colonnes de gaz et de poussière photographiées par Hubble en 1995 puis par Webb en 2022, où se forment de nouvelles étoiles.",
      facts: [['Distance', '≈ 5 700 années-lumière'], ['Constellation', 'Serpent']] },
    { id: 'etacar', name: 'Êta Carinae', kind: 'Étoile double très massive', l: 287.6, b: -0.63, ly: 7500,
      text: "Un système d'au moins deux étoiles parmi les plus massives connues. En 1843, une éruption géante en fit pendant quelques années la deuxième étoile la plus brillante du ciel. Elle finira probablement en supernova.",
      facts: [['Distance', '≈ 7 500 années-lumière'], ['Masse totale', 'plus de 100 masses solaires'], ['Constellation', 'Carène']] },
    { id: 'cygx1', name: 'Cygnus X-1', kind: 'Trou noir stellaire', l: 71.33, b: 3.07, ly: 7200,
      text: "Le premier objet reconnu comme un trou noir, dans les années 1970 : il arrache la matière d'une étoile géante bleue qui l'accompagne, et cette matière brille en rayons X avant d'y tomber.",
      facts: [['Distance', '≈ 7 200 années-lumière'], ['Masse', '≈ 21 masses solaires']] },
    { id: 'tabby', name: 'Étoile de Tabby', kind: 'Étoile variable · KIC 8462852', l: 80.04, b: 6.64, ly: 1470,
      text: "Une étoile un peu plus grande et plus chaude que le Soleil, dans la constellation du Cygne. Entre 2009 et 2013, le télescope Kepler a vu sa lumière baisser parfois de plus de 20 %, sans aucune régularité. On sait aujourd'hui que c'est de la poussière qui passe devant elle.",
      facts: [['Distance', '≈ 1 470 années-lumière'], ['Type', 'étoile de type F'], ['Constellation', 'Cygne'], ['Baisses de lumière', 'jusqu\'à 22 %']] },
    { id: 'omegacen', name: 'Oméga du Centaure', kind: 'Amas globulaire', l: 309.10, b: 14.97, ly: 17090,
      text: "Le plus grand amas globulaire de la galaxie : une dizaine de millions d'étoiles très anciennes, serrées en une boule. Peut-être le cœur d'une petite galaxie avalée par la nôtre ; un trou noir de masse intermédiaire y a été repéré en 2024.",
      facts: [['Distance', '≈ 17 000 années-lumière'], ['Étoiles', '≈ 10 millions'], ['Âge', 'plus de 11 milliards d\'années']] },
    { id: 'sgrdsph', name: 'Galaxie naine du Sagittaire', kind: 'Galaxie satellite, en cours d\'absorption', l: 5.6, b: -14.2, ly: 86000,
      text: "Une petite galaxie que la Voie lactée est en train de déchirer et d'absorber : ses étoiles s'étirent en longs courants qui font le tour de notre galaxie. Elle se trouve de l'autre côté du centre galactique, par rapport à nous.",
      facts: [['Distance', '≈ 86 000 années-lumière'], ['Découverte', '1994']] },
    { id: 'gnm', name: 'Grand Nuage de Magellan', kind: 'Galaxie satellite', l: 280.47, b: -32.89, ly: 163000, gal: 14000,
      text: "La plus grande galaxie satellite de la Voie lactée, visible à l'œil nu dans le ciel austral. En 1987, on y a vu exploser la supernova la plus proche observée depuis l'invention du télescope.",
      facts: [['Distance', '≈ 163 000 années-lumière'], ['Diamètre', '≈ 14 000 années-lumière'], ['Supernova', 'SN 1987A']] },
    { id: 'pnm', name: 'Petit Nuage de Magellan', kind: 'Galaxie satellite', l: 302.80, b: -44.30, ly: 200000, gal: 7000,
      text: "Le compagnon du Grand Nuage ; les deux sont reliés par un pont de gaz. Ils pourraient être en train de tomber vers la Voie lactée pour la première fois.",
      facts: [['Distance', '≈ 200 000 années-lumière'], ['Diamètre', '≈ 7 000 années-lumière']] }
  ];
})();

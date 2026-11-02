/* ======================================================================
   OBSERVATOIRE — le Groupe local
   La Voie lactée, Andromède, le Triangle et leurs galaxies satellites, à leurs positions mesurées
   (ascension droite, déclinaison, distance). L'orientation des disques d'Andromède et du Triangle
   suit leurs angles mesurés (inclinaison, angle de position) ; leur aspect est reconstitué.
   ====================================================================== */
(function () {
  'use strict';
  var OBS = window.OBS = window.OBS || {};
  // ra, dec : degrés · ly : distance au Soleil · d : diamètre (années-lumière) · pa, inc : orientation du disque (degrés)
  // form : spirale, elliptique, irreguliere, spheroidale
  OBS.LOCALGROUP = [
    { id: 'voielactee', name: 'Voie lactée', kind: 'Notre galaxie · spirale barrée', home: true, ly: 0, d: 100000, form: 'spirale',
      text: "Notre galaxie : quelque 100 à 400 milliards d'étoiles, dont le Soleil, sur un disque d'environ 100 000 années-lumière. C'est, avec Andromède, l'une des deux grandes galaxies du Groupe local.",
      facts: [['Diamètre du disque', '≈ 100 000 années-lumière'], ['Étoiles', '100 à 400 milliards'], ['Satellites connus', 'plusieurs dizaines']] },
    { id: 'm31', name: 'Galaxie d\'Andromède', kind: 'Galaxie spirale · M31', ra: 10.6847, dec: 41.2690, ly: 2500000, d: 152000, pa: 38, inc: 77, form: 'spirale', big: true,
      text: "La plus grande galaxie du Groupe local, avec environ mille milliards d'étoiles, visible à l'œil nu comme une tache floue. En 1925, Edwin Hubble y a mesuré des étoiles variables qui ont prouvé qu'elle est une galaxie à part entière, bien au-delà de la nôtre. Elle s'approche de nous à environ 110 km/s ; une étude de 2025 estime à environ une chance sur deux qu'elle fusionne avec la Voie lactée dans les dix milliards d'années à venir.",
      facts: [['Distance', '≈ 2,5 millions d\'années-lumière'], ['Diamètre', '≈ 150 000 années-lumière'], ['Étoiles', '≈ 1 000 milliards'], ['Vitesse d\'approche', '≈ 110 km/s']] },
    { id: 'm33', name: 'Galaxie du Triangle', kind: 'Galaxie spirale · M33', ra: 23.4621, dec: 30.6599, ly: 2730000, d: 61000, pa: 23, inc: 55, form: 'spirale',
      text: "La troisième galaxie du Groupe local par la taille, avec une quarantaine de milliards d'étoiles. Sous un ciel très noir, c'est l'objet le plus lointain visible à l'œil nu. Elle est peut-être un satellite d'Andromède.",
      facts: [['Distance', '≈ 2,7 millions d\'années-lumière'], ['Diamètre', '≈ 60 000 années-lumière'], ['Étoiles', '≈ 40 milliards']] },
    { id: 'm32', name: 'M32', kind: 'Galaxie elliptique naine · satellite d\'Andromède', ra: 10.6743, dec: 40.8652, ly: 2490000, d: 6500, form: 'elliptique',
      text: "Une petite galaxie très dense collée à Andromède : peut-être le cœur d'une galaxie plus grande dont Andromède a arraché les étoiles extérieures.",
      facts: [['Distance', '≈ 2,5 millions d\'années-lumière'], ['Diamètre', '≈ 6 500 années-lumière']] },
    { id: 'm110', name: 'M110', kind: 'Galaxie elliptique naine · satellite d\'Andromède', ra: 10.0920, dec: 41.6853, ly: 2690000, d: 17000, form: 'elliptique',
      text: "L'autre compagne brillante d'Andromède, de l'autre côté de son disque. Elle abrite encore quelques régions de jeunes étoiles, rares pour une galaxie de ce type.",
      facts: [['Distance', '≈ 2,7 millions d\'années-lumière'], ['Diamètre', '≈ 17 000 années-lumière']] },
    { id: 'lg-gnm', name: 'Grand Nuage de Magellan', kind: 'Galaxie irrégulière · satellite de la Voie lactée', gl: 280.47, gb: -32.89, ly: 163000, d: 14000, form: 'irreguliere', galaxie: 'gnm',
      text: "La plus grande galaxie satellite de la Voie lactée, visible à l'œil nu dans le ciel austral.",
      facts: [['Distance', '≈ 163 000 années-lumière'], ['Diamètre', '≈ 14 000 années-lumière']] },
    { id: 'lg-pnm', name: 'Petit Nuage de Magellan', kind: 'Galaxie irrégulière · satellite de la Voie lactée', gl: 302.80, gb: -44.30, ly: 200000, d: 7000, form: 'irreguliere', galaxie: 'pnm',
      text: "Le compagnon du Grand Nuage, auquel il est relié par un pont de gaz.",
      facts: [['Distance', '≈ 200 000 années-lumière'], ['Diamètre', '≈ 7 000 années-lumière']] },
    { id: 'sculptor', name: 'Naine du Sculpteur', kind: 'Galaxie sphéroïdale naine · satellite de la Voie lactée', ra: 15.0392, dec: -33.7092, ly: 290000, d: 3000, form: 'spheroidale',
      text: "Une galaxie minuscule et très pâle, faite d'étoiles anciennes, découverte en 1937 par Harlow Shapley : la première de ce type connue.",
      facts: [['Distance', '≈ 290 000 années-lumière'], ['Découverte', '1937']] },
    { id: 'fornax', name: 'Naine du Fourneau', kind: 'Galaxie sphéroïdale naine · satellite de la Voie lactée', ra: 39.9971, dec: -34.4492, ly: 460000, d: 6700, form: 'spheroidale',
      text: "Une galaxie naine qui possède six amas globulaires, un nombre étonnant pour sa petite taille.",
      facts: [['Distance', '≈ 460 000 années-lumière'], ['Amas globulaires', '6']] },
    { id: 'leo1', name: 'Lion I', kind: 'Galaxie sphéroïdale naine · satellite lointain de la Voie lactée', ra: 152.1171, dec: 12.3065, ly: 820000, d: 2000, form: 'spheroidale',
      text: "L'un des satellites les plus lointains de la Voie lactée, juste à côté de l'étoile brillante Régulus dans le ciel, ce qui la rend difficile à observer.",
      facts: [['Distance', '≈ 820 000 années-lumière']] },
    { id: 'ngc6822', name: 'Galaxie de Barnard', kind: 'Galaxie irrégulière naine · NGC 6822', ra: 296.2358, dec: -14.8031, ly: 1630000, d: 7000, form: 'irreguliere',
      text: "Une petite galaxie irrégulière, riche en régions de formation d'étoiles. En 1925, Hubble y a mesuré des étoiles variables qui l'ont placée bien au-delà de la Voie lactée.",
      facts: [['Distance', '≈ 1,6 million d\'années-lumière'], ['Diamètre', '≈ 7 000 années-lumière']] },
    { id: 'ic10', name: 'IC 10', kind: 'Galaxie irrégulière naine', ra: 5.0721, dec: 59.3039, ly: 2200000, d: 5000, form: 'irreguliere',
      text: "La seule galaxie du Groupe local en pleine flambée de formation d'étoiles. Elle est difficile à observer, cachée derrière la poussière du disque de la Voie lactée.",
      facts: [['Distance', '≈ 2,2 millions d\'années-lumière']] },
    { id: 'ic1613', name: 'IC 1613', kind: 'Galaxie irrégulière naine', ra: 16.1992, dec: 2.1178, ly: 2380000, d: 12000, form: 'irreguliere',
      text: "Une galaxie naine calme et peu perturbée par ses voisines, qui sert d'étalon pour mesurer les distances.",
      facts: [['Distance', '≈ 2,4 millions d\'années-lumière']] },
    { id: 'wlm', name: 'Wolf-Lundmark-Melotte', kind: 'Galaxie irrégulière naine · WLM', ra: 0.4925, dec: -15.4608, ly: 3040000, d: 8000, form: 'irreguliere',
      text: "Isolée au bord du Groupe local, elle a sans doute vécu sans jamais croiser de grande galaxie : un témoin intact de la façon dont les petites galaxies évoluent seules.",
      facts: [['Distance', '≈ 3 millions d\'années-lumière']] }
  ];
})();

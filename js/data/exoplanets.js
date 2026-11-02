/* ======================================================================
   OBSERVATOIRE — systèmes d'exoplanètes remarquables, au-delà du voisinage
   Placés dans la Voie lactée à leurs positions mesurées (ascension droite, déclinaison, distance),
   et visitables comme les étoiles voisines. Valeurs arrondies, d'après le NASA Exoplanet Archive.
   P : période (jours) · me : masse en masses terrestres (minimale si mesurée par vitesses radiales ;
   est : estimée d'après le rayon mesuré par transit) · giant : planète géante.
   ====================================================================== */
(function () {
  'use strict';
  var OBS = window.OBS = window.OBS || {};
  var MJ = 317.8;

  /* équatorial J2000 → galactique (matrice de l'IAU) */
  OBS.raDecToGal = function (ra, dec) {
    var a = ra * Math.PI / 180, d = dec * Math.PI / 180, x = Math.cos(d) * Math.cos(a), y = Math.cos(d) * Math.sin(a), z = Math.sin(d);
    var gx = -0.0548755604 * x - 0.8734370902 * y - 0.4838350155 * z;
    var gy = 0.4941094279 * x - 0.4448296300 * y + 0.7469822445 * z;
    var gz = -0.8676661490 * x - 0.1980763734 * y + 0.4559837762 * z;
    var l = Math.atan2(gy, gx) * 180 / Math.PI; if (l < 0) l += 360;
    return { l: l, b: Math.asin(Math.max(-1, Math.min(1, gz))) * 180 / Math.PI };
  };

  OBS.EXOSYS = [
    { id: 'trappist1', name: 'TRAPPIST-1', spec: 'M8 V', cls: 'M', r: .119, m: .09, ly: 40.7, ra: 346.6224, dec: -5.0414, cons: 'Verseau', annee: '2016-2017',
      text: "Une naine rouge à peine plus grande que Jupiter, entourée de sept planètes de la taille de la Terre, toutes plus proches d'elle que Mercure du Soleil. Trois d'entre elles (e, f, g) sont dans la zone où l'eau pourrait rester liquide. Le télescope Webb étudie leurs éventuelles atmosphères.",
      planets: 'Sept planètes rocheuses, découvertes par transit (télescopes TRAPPIST et Spitzer).',
      sys: [{ n: 'TRAPPIST-1 b', P: 1.511, me: 1.37 }, { n: 'TRAPPIST-1 c', P: 2.422, me: 1.31 }, { n: 'TRAPPIST-1 d', P: 4.050, me: .39 }, { n: 'TRAPPIST-1 e', P: 6.100, me: .69 },
            { n: 'TRAPPIST-1 f', P: 9.207, me: 1.04 }, { n: 'TRAPPIST-1 g', P: 12.35, me: 1.32 }, { n: 'TRAPPIST-1 h', P: 18.77, me: .33 }], ttv: true },
    { id: '51peg', name: '51 Pegasi', spec: 'G5 V', cls: 'G', r: 1.15, m: 1.1, ly: 50.6, ra: 344.3666, dec: 20.7688, cons: 'Pégase', annee: '1995',
      text: "La première planète découverte autour d'une étoile semblable au Soleil, en 1995, par Michel Mayor et Didier Queloz (prix Nobel 2019). Une géante plus massive que la moitié de Jupiter qui fait le tour de son étoile en quatre jours : un « Jupiter chaud », un type de planète que personne n'attendait.",
      sys: [{ n: '51 Pegasi b (Dimidium)', P: 4.231, me: .46 * MJ, giant: true }] },
    { id: '55cnc', name: '55 Cancri', spec: 'G8 V', cls: 'G', r: .94, m: .91, ly: 41, ra: 133.1499, dec: 28.3308, cons: 'Cancer', annee: '1996-2007',
      text: "Cinq planètes connues, dont 55 Cancri e, une « super-Terre » si proche de son étoile qu'un tour lui prend 18 heures : sa surface est sans doute couverte de lave.",
      sys: [{ n: '55 Cancri e', P: .7365, me: 8 }, { n: '55 Cancri b', P: 14.65, me: .83 * MJ, giant: true }, { n: '55 Cancri c', P: 44.4, me: 54 }, { n: '55 Cancri f', P: 260, me: 47 }, { n: '55 Cancri d', P: 4825, me: 3.8 * MJ, giant: true }] },
    { id: 'betapic', name: 'Bêta Pictoris', spec: 'A6 V', cls: 'A', r: 1.53, m: 1.75, ly: 63.4, ra: 86.8212, dec: -51.0665, cons: 'Peintre', annee: '2008-2019',
      text: "Une jeune étoile, à peine 20 millions d'années, entourée d'un grand disque de poussières et de comètes. Deux planètes géantes y ont été photographiées directement : on voit un système planétaire en train de se former.",
      sys: [{ n: 'Bêta Pictoris c', P: 1200, me: 8.3 * MJ, giant: true }, { n: 'Bêta Pictoris b', P: 7800, me: 9.3 * MJ, giant: true }] },
    { id: 'hr8799', name: 'HR 8799', spec: 'A5 V', cls: 'A', r: 1.34, m: 1.47, ly: 133, ra: 346.8696, dec: 21.1342, cons: 'Pégase', annee: '2008-2010',
      text: "Le premier système dont plusieurs planètes ont été photographiées directement, en 2008 : quatre géantes de 5 à 10 fois la masse de Jupiter, très loin de leur étoile, que l'on voit tourner au fil des années.",
      sys: [{ n: 'HR 8799 e', P: 16400, me: 9 * MJ, giant: true }, { n: 'HR 8799 d', P: 36500, me: 9 * MJ, giant: true }, { n: 'HR 8799 c', P: 69400, me: 8 * MJ, giant: true }, { n: 'HR 8799 b', P: 168000, me: 6 * MJ, giant: true }] },
    { id: 'toi700', name: 'TOI-700', spec: 'M2 V', cls: 'M', r: .42, m: .42, ly: 101.4, ra: 97.0961, dec: -65.5786, cons: 'Dorade', annee: '2020-2023',
      text: "Une naine rouge calme, avec deux planètes de la taille de la Terre dans sa zone habitable, TOI-700 d et e, découvertes par le satellite TESS.",
      sys: [{ n: 'TOI-700 b', P: 9.98, me: 1, est: true }, { n: 'TOI-700 c', P: 16.05, me: 7, est: true }, { n: 'TOI-700 e', P: 27.81, me: .8, est: true }, { n: 'TOI-700 d', P: 37.42, me: 1.7, est: true }] },
    { id: 'k218', name: 'K2-18', spec: 'M2.5 V', cls: 'M', r: .44, m: .5, ly: 124, ra: 172.5604, dec: 7.5883, cons: 'Lion', annee: '2015',
      text: "Sa planète K2-18 b, 8 à 9 fois la masse de la Terre, tourne dans la zone habitable. Webb y a détecté du méthane et du dioxyde de carbone (2023) ; l'annonce d'une possible trace de vie (2025) reste très discutée et n'est pas confirmée.",
      sys: [{ n: 'K2-18 b', P: 32.94, me: 8.6 }] },
    { id: 'hd209458', name: 'HD 209458', spec: 'G0 V', cls: 'G', r: 1.16, m: 1.12, ly: 159, ra: 330.7950, dec: 18.8843, cons: 'Pégase', annee: '1999',
      text: "Sa planète, surnommée Osiris, est la première vue passer devant son étoile (1999), et la première dont on a détecté l'atmosphère, en 2001. Chauffée à plus de 1 000 °C, elle perd son gaz comme une comète.",
      sys: [{ n: 'HD 209458 b (Osiris)', P: 3.525, me: .69 * MJ, giant: true }] },
    { id: 'kepler16', name: 'Kepler-16', spec: 'K + M', cls: 'K', r: .65, m: .69, ly: 245, ra: 289.0758, dec: 51.7575, cons: 'Cygne', annee: '2011',
      text: "Une planète qui tourne autour de deux étoiles à la fois, comme Tatooine dans La Guerre des étoiles : elle y voit deux couchers de soleil.",
      sys: [{ n: 'Kepler-16 b', P: 228.8, me: .33 * MJ, giant: true }], comp: { n: 'Kepler-16 B', cls: 'M', r: .23, aAU: .22, Py: .1125 } },
    { id: 'kepler186', name: 'Kepler-186', spec: 'M1 V', cls: 'M', r: .52, m: .54, ly: 579, ra: 298.6542, dec: 43.9547, cons: 'Cygne', annee: '2014',
      text: "Kepler-186 f a été la première planète de la taille de la Terre trouvée dans la zone habitable d'une autre étoile, en 2014.",
      sys: [{ n: 'Kepler-186 b', P: 3.887, me: 1.2, est: true }, { n: 'Kepler-186 c', P: 7.267, me: 2, est: true }, { n: 'Kepler-186 d', P: 13.34, me: 2.5, est: true }, { n: 'Kepler-186 e', P: 22.41, me: 2.2, est: true }, { n: 'Kepler-186 f', P: 129.9, me: 1.7, est: true }] },
    { id: 'kepler22', name: 'Kepler-22', spec: 'G5 V', cls: 'G', r: .98, m: .97, ly: 640, ra: 289.2175, dec: 47.8843, cons: 'Cygne', annee: '2011',
      text: "Kepler-22 b, plus grande que la Terre (2,4 fois son rayon), a été la première planète confirmée dans la zone habitable d'une étoile semblable au Soleil.",
      sys: [{ n: 'Kepler-22 b', P: 289.9, me: 9, est: true }] },
    { id: 'wasp12', name: 'WASP-12', spec: 'G0', cls: 'G', r: 1.6, m: 1.3, ly: 1410, ra: 97.6366, dec: 29.6722, cons: 'Cocher', annee: '2008',
      text: "Sa planète géante, à peine plus d'un jour de révolution, est si proche qu'elle est déformée en ballon de rugby et lentement dévorée par son étoile ; son orbite rétrécit de façon mesurable.",
      sys: [{ n: 'WASP-12 b', P: 1.091, me: 1.47 * MJ, giant: true }] },
    { id: 'kepler452', name: 'Kepler-452', spec: 'G2 V', cls: 'G', r: 1.11, m: 1.04, ly: 1800, ra: 296.0038, dec: 44.2775, cons: 'Cygne', annee: '2015',
      text: "Une étoile très semblable au Soleil, dont la planète Kepler-452 b tourne en 385 jours : on l'a surnommée la « cousine de la Terre », mais sa confirmation a ensuite été remise en question.",
      sys: [{ n: 'Kepler-452 b', P: 384.8, me: 5, est: true }] },
    { id: 'psr1257', name: 'PSR B1257+12', spec: 'pulsar', cls: 'B', r: .00002, m: 1.4, ly: 2300, ra: 195.0149, dec: 12.6825, cons: 'Vierge', annee: '1992',
      text: "Les toutes premières exoplanètes découvertes, en 1992 par Aleksander Wolszczan et Dale Frail : trois planètes autour d'un pulsar, le cadavre ultra-dense d'une étoile qui a explosé, tournant sur lui-même 160 fois par seconde.",
      sys: [{ n: 'PSR B1257+12 A', P: 25.26, me: .02 }, { n: 'PSR B1257+12 B', P: 66.54, me: 4.3 }, { n: 'PSR B1257+12 C', P: 98.21, me: 3.9 }] },
    { id: 'kepler90', name: 'Kepler-90', spec: 'G0 V', cls: 'G', r: 1.2, m: 1.13, ly: 2840, ra: 284.4334, dec: 49.3051, cons: 'Dragon', annee: '2013-2017',
      text: "Huit planètes, autant que le système solaire : le record, à égalité. La huitième a été trouvée en 2017 par un réseau de neurones fouillant les données du télescope Kepler.",
      sys: [{ n: 'Kepler-90 b', P: 7.008, me: 2, est: true }, { n: 'Kepler-90 c', P: 8.719, me: 1.8, est: true }, { n: 'Kepler-90 i', P: 14.45, me: 2, est: true }, { n: 'Kepler-90 d', P: 59.74, me: 8, est: true },
            { n: 'Kepler-90 e', P: 91.94, me: 7, est: true }, { n: 'Kepler-90 f', P: 124.9, me: 8, est: true }, { n: 'Kepler-90 g', P: 210.6, me: 15, giant: true, est: true }, { n: 'Kepler-90 h', P: 331.6, me: .8 * MJ, giant: true, est: true }] }
  ];
  OBS.EXOSYS.forEach(function (s) { var g = OBS.raDecToGal(s.ra, s.dec); s.l = g.l; s.b = g.b; s.exo = true; s.lum = 1; s.kind = 'Système planétaire · ' + s.sys.length + ' planète' + (s.sys.length > 1 ? 's' : ''); });
  OBS.exoById = {}; OBS.EXOSYS.forEach(function (s) { OBS.exoById[s.id] = s; });
})();

/* ======================================================================
   OBSERVATOIRE — voisinage stellaire (étoiles à moins de 12 années-lumière)
   Positions réelles : ascension droite et déclinaison (J2000), distance en années-lumière.
   Sources : catalogues RECONS / SIMBAD, mesures de parallaxe Gaia et Hipparcos.
   Les systèmes multiples très serrés (Alpha du Centaure A et B, Sirius A et B…)
   sont représentés par un seul repère : leur écart est invisible à cette échelle.
   ====================================================================== */
(function () {
  'use strict';
  var OBS = window.OBS = window.OBS || {};
  function ra(h, m, s) { return (h + m / 60 + s / 3600) * 15; }
  function dec(d, m, s) { var sg = d < 0 || Object.is(d, -0) ? -1 : 1; return sg * (Math.abs(d) + m / 60 + s / 3600); }

  /* cls : classe spectrale simplifiée pour la couleur ; lum : luminosité relative au Soleil (ordre de grandeur) */
  OBS.STARS = [
    { id: 'proxima', name: 'Proxima du Centaure', ly: 4.24, ra: ra(14, 29, 42.9), dec: dec(-62, 40, 46), spec: 'M5,5 Ve', cls: 'M', lum: 0.0017, cons: 'Centaure',
      text: "L'étoile la plus proche du Soleil, une naine rouge sujette à de violentes éruptions. Elle fait partie du système d'Alpha du Centaure.",
      planets: 'Proxima b (2016), dans la zone habitable, et Proxima d (2022).' },
    { id: 'alphacen', name: 'Alpha du Centaure A et B', ly: 4.37, ra: ra(14, 39, 36.5), dec: dec(-60, 50, 2), spec: 'G2 V + K1 V', cls: 'G', lum: 1.5, cons: 'Centaure',
      text: "Un couple d'étoiles proches du Soleil par leur type : A est presque son jumeau, B un peu plus petite et orangée. Les deux tournent l'une autour de l'autre en 80 ans.",
      planets: 'Aucune confirmée ; un candidat géant autour de A a été signalé par le télescope James Webb en 2025.' },
    { id: 'barnard', name: 'Étoile de Barnard', ly: 5.96, ra: ra(17, 57, 48.5), dec: dec(4, 41, 36), spec: 'M4 V', cls: 'M', lum: 0.0035, cons: 'Ophiuchus',
      text: "Une vieille naine rouge, l'étoile au plus grand mouvement apparent dans le ciel : elle se déplace de la largeur de la pleine Lune en 180 ans environ.",
      planets: 'Quatre petites planètes rocheuses annoncées en 2024 et 2025.' },
    { id: 'luhman16', name: 'Luhman 16 A et B', ly: 6.5, ra: ra(10, 49, 15.6), dec: dec(-53, 19, 6), spec: 'L7,5 + T0,5', cls: 'BD', lum: 0.00002, cons: 'Voiles',
      text: "Le couple de naines brunes le plus proche, découvert seulement en 2013. Trop peu massives pour entretenir la fusion de l'hydrogène, elles se refroidissent lentement." },
    { id: 'wise0855', name: 'WISE 0855−0714', ly: 7.4, ra: ra(8, 55, 10.8), dec: dec(-7, 14, 42), spec: 'Y4', cls: 'BD', lum: 0.0000001, cons: 'Hydre',
      text: "La naine brune la plus froide connue, autour de −25 °C en surface : à peine plus chaude qu'un congélateur. Découverte en 2014 dans l'infrarouge." },
    { id: 'wolf359', name: 'Wolf 359', ly: 7.86, ra: ra(10, 56, 28.8), dec: dec(7, 0, 53), spec: 'M6 V', cls: 'M', lum: 0.0014, cons: 'Lion',
      text: "Une des étoiles les moins lumineuses connues, une naine rouge éruptive." },
    { id: 'lalande21185', name: 'Lalande 21185', ly: 8.31, ra: ra(11, 3, 20.2), dec: dec(35, 58, 12), spec: 'M2 V', cls: 'M', lum: 0.025, cons: 'Grande Ourse',
      text: "La naine rouge la plus brillante du ciel de l'hémisphère nord, invisible pourtant à l'œil nu.",
      planets: 'Lalande 21185 b (2019) et c.' },
    { id: 'sirius', name: 'Sirius A et B', ly: 8.60, ra: ra(6, 45, 8.9), dec: dec(-16, 42, 58), spec: 'A1 V + naine blanche', cls: 'A', lum: 25, cons: 'Grand Chien',
      text: "L'étoile la plus brillante du ciel nocturne, 25 fois plus lumineuse que le Soleil. Sa compagne, Sirius B, est une naine blanche : le cœur éteint d'une étoile, de la taille de la Terre." },
    { id: 'luyten7268', name: 'Luyten 726-8 (UV Ceti)', ly: 8.73, ra: ra(1, 39, 1.3), dec: dec(-17, 57, 1), spec: 'M5,5 V + M6 V', cls: 'M', lum: 0.0013, cons: 'Baleine',
      text: "Un couple de naines rouges ; UV Ceti a donné son nom à toute une famille d'étoiles éruptives." },
    { id: 'ross154', name: 'Ross 154', ly: 9.69, ra: ra(18, 49, 49.4), dec: dec(-23, 50, 10), spec: 'M3,5 V', cls: 'M', lum: 0.004, cons: 'Sagittaire',
      text: "Une naine rouge éruptive de la constellation du Sagittaire." },
    { id: 'ross248', name: 'Ross 248', ly: 10.30, ra: ra(23, 41, 54.7), dec: dec(44, 10, 30), spec: 'M5,5 V', cls: 'M', lum: 0.0018, cons: 'Andromède',
      text: "Une naine rouge qui se rapproche de nous : dans environ 36 000 ans, elle deviendra pour quelque temps l'étoile la plus proche du Soleil." },
    { id: 'epseri', name: 'Epsilon Eridani', ly: 10.47, ra: ra(3, 32, 55.8), dec: dec(-9, 27, 30), spec: 'K2 V', cls: 'K', lum: 0.34, cons: 'Éridan',
      text: "Une jeune étoile orangée, entourée de ceintures de débris qui rappellent celles du système solaire.",
      planets: 'Epsilon Eridani b, une géante gazeuse.' },
    { id: 'lacaille9352', name: 'Lacaille 9352', ly: 10.72, ra: ra(23, 5, 52.0), dec: dec(-35, 51, 11), spec: 'M0,5 V', cls: 'M', lum: 0.033, cons: 'Poisson austral',
      text: "Une naine rouge au mouvement propre rapide, l'une des premières dont on a mesuré directement le diamètre.",
      planets: 'Deux super-Terres annoncées en 2020.' },
    { id: 'ross128', name: 'Ross 128', ly: 11.01, ra: ra(11, 47, 44.4), dec: dec(0, 48, 16), spec: 'M4 V', cls: 'M', lum: 0.0036, cons: 'Vierge',
      text: "Une naine rouge calme, peu éruptive, ce qui en fait un environnement plus favorable pour ses planètes.",
      planets: 'Ross 128 b (2017), une planète tempérée de la taille de la Terre.' },
    { id: 'ezaqr', name: 'EZ Aquarii', ly: 11.11, ra: ra(22, 38, 33.4), dec: dec(-15, 18, 7), spec: 'M5 V (triple)', cls: 'M', lum: 0.0013, cons: 'Verseau',
      text: "Un système de trois naines rouges très serrées." },
    { id: '61cyg', name: '61 du Cygne A et B', ly: 11.40, ra: ra(21, 6, 53.9), dec: dec(38, 44, 58), spec: 'K5 V + K7 V', cls: 'K', lum: 0.15, cons: 'Cygne',
      text: "La première étoile dont on a mesuré la distance, par Friedrich Bessel en 1838 : une date clé dans la découverte de l'immensité de l'univers." },
    { id: 'procyon', name: 'Procyon A et B', ly: 11.46, ra: ra(7, 39, 18.1), dec: dec(5, 13, 30), spec: 'F5 IV-V + naine blanche', cls: 'F', lum: 7, cons: 'Petit Chien',
      text: "L'une des étoiles les plus brillantes du ciel, accompagnée elle aussi d'une naine blanche." },
    { id: 'struve2398', name: 'Struve 2398 A et B', ly: 11.49, ra: ra(18, 42, 46.7), dec: dec(59, 37, 49), spec: 'M3 V + M3,5 V', cls: 'M', lum: 0.006, cons: 'Dragon',
      text: "Un couple de naines rouges dans la constellation du Dragon." },
    { id: 'groombridge34', name: 'Groombridge 34 A et B', ly: 11.62, ra: ra(0, 18, 22.9), dec: dec(44, 1, 23), spec: 'M1,5 V + M3,5 V', cls: 'M', lum: 0.02, cons: 'Andromède',
      text: "Un couple de naines rouges orbitant l'une autour de l'autre en plus de 2 000 ans." },
    { id: 'epsind', name: 'Epsilon Indi', ly: 11.87, ra: ra(22, 3, 21.7), dec: dec(-56, 47, 10), spec: 'K5 V + deux naines brunes', cls: 'K', lum: 0.22, cons: 'Indien',
      text: "Une étoile orangée accompagnée d'un couple de naines brunes.",
      planets: 'Epsilon Indi A b, une géante froide photographiée par le télescope James Webb en 2024.' },
    { id: 'tauceti', name: 'Tau Ceti', ly: 11.91, ra: ra(1, 44, 4.1), dec: dec(-15, 56, 15), spec: 'G8 V', cls: 'G', lum: 0.52, cons: 'Baleine',
      text: "L'étoile isolée de type solaire la plus proche, visible à l'œil nu. Elle est entourée d'un disque de débris dix fois plus massif que la ceinture de Kuiper.",
      planets: 'Plusieurs planètes candidates, non confirmées.' }
  ];

  /* couleur indicative par classe spectrale */
  OBS.STAR_COLORS = { O: 0x9bb0ff, B: 0xaabfff, A: 0xcad7ff, F: 0xf8f7ff, G: 0xfff4ea, K: 0xffd2a1, M: 0xffb07a, BD: 0xc0603a };
})();

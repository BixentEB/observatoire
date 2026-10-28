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

  /* cls : classe spectrale simplifiée pour la couleur ; lum : luminosité relative au Soleil (ordre de grandeur)
     r : rayon (rayons solaires, ≈) ; m : masse (masses solaires, ≈)
     sys : planètes confirmées — P période (jours, mesurée), me masse minimale (masses terrestres) ; la distance à l'étoile
           est calculée par la troisième loi de Kepler à partir de P et de la masse de l'étoile
     comp : compagne d'un système double — aAU demi-grand axe moyen, Py période (années) */
  OBS.STARS = [
    { id: 'proxima', r: .154, m: .122, sys: [{ n: 'Proxima d', P: 5.122, me: .26 }, { n: 'Proxima b', P: 11.186, me: 1.07 }], name: 'Proxima du Centaure', ly: 4.24, ra: ra(14, 29, 42.9), dec: dec(-62, 40, 46), spec: 'M5,5 Ve', cls: 'M', lum: 0.0017, cons: 'Centaure',
      text: "L'étoile la plus proche du Soleil, une naine rouge sujette à de violentes éruptions. Elle fait partie du système d'Alpha du Centaure.",
      planets: 'Proxima b (2016), dans la zone habitable, et Proxima d (2022).' },
    { id: 'alphacen', r: 1.22, m: 1.08, comp: { n: 'Alpha du Centaure B', r: .86, cls: 'K', aAU: 23.3, Py: 79.9 }, name: 'Alpha du Centaure A et B', ly: 4.37, ra: ra(14, 39, 36.5), dec: dec(-60, 50, 2), spec: 'G2 V + K1 V', cls: 'G', lum: 1.5, cons: 'Centaure',
      text: "Un couple d'étoiles proches du Soleil par leur type : A est presque son jumeau, B un peu plus petite et orangée. Les deux tournent l'une autour de l'autre en 80 ans.",
      planets: 'Aucune confirmée ; un candidat géant autour de A a été signalé par le télescope James Webb en 2025.' },
    { id: 'barnard', r: .19, m: .16, sys: [{ n: 'Barnard d', P: 2.34 }, { n: 'Barnard b', P: 3.154 }, { n: 'Barnard c', P: 4.12 }, { n: 'Barnard e', P: 6.74 }], name: 'Étoile de Barnard', ly: 5.96, ra: ra(17, 57, 48.5), dec: dec(4, 41, 36), spec: 'M4 V', cls: 'M', lum: 0.0035, cons: 'Ophiuchus',
      text: "Une vieille naine rouge, l'étoile au plus grand mouvement apparent dans le ciel : elle se déplace de la largeur de la pleine Lune en 180 ans environ.",
      planets: 'Quatre petites planètes rocheuses annoncées en 2024 et 2025.' },
    { id: 'luhman16', r: .09, m: .034, comp: { n: 'Luhman 16 B', r: .09, cls: 'BD', aAU: 3.5, Py: 27 }, name: 'Luhman 16 A et B', ly: 6.5, ra: ra(10, 49, 15.6), dec: dec(-53, 19, 6), spec: 'L7,5 + T0,5', cls: 'BD', lum: 0.00002, cons: 'Voiles',
      text: "Le couple de naines brunes le plus proche, découvert seulement en 2013. Trop peu massives pour entretenir la fusion de l'hydrogène, elles se refroidissent lentement." },
    { id: 'wise0855', r: .09, m: .006, name: 'WISE 0855−0714', ly: 7.4, ra: ra(8, 55, 10.8), dec: dec(-7, 14, 42), spec: 'Y4', cls: 'BD', lum: 0.0000001, cons: 'Hydre',
      text: "La naine brune la plus froide connue, autour de −25 °C en surface : à peine plus chaude qu'un congélateur. Découverte en 2014 dans l'infrarouge." },
    { id: 'wolf359', r: .14, m: .11, name: 'Wolf 359', ly: 7.86, ra: ra(10, 56, 28.8), dec: dec(7, 0, 53), spec: 'M6 V', cls: 'M', lum: 0.0014, cons: 'Lion',
      text: "Une des étoiles les moins lumineuses connues, une naine rouge éruptive." },
    { id: 'lalande21185', r: .39, m: .39, sys: [{ n: 'Lalande 21185 b', P: 12.95, me: 2.7 }], name: 'Lalande 21185', ly: 8.31, ra: ra(11, 3, 20.2), dec: dec(35, 58, 12), spec: 'M2 V', cls: 'M', lum: 0.025, cons: 'Grande Ourse',
      text: "La naine rouge la plus brillante du ciel de l'hémisphère nord, invisible pourtant à l'œil nu.",
      planets: 'Lalande 21185 b (2019) et c.' },
    { id: 'sirius', r: 1.71, m: 2.06, comp: { n: 'Sirius B (naine blanche)', r: .0084, cls: 'A', aAU: 19.8, Py: 50.1 }, name: 'Sirius A et B', ly: 8.60, ra: ra(6, 45, 8.9), dec: dec(-16, 42, 58), spec: 'A1 V + naine blanche', cls: 'A', lum: 25, cons: 'Grand Chien',
      text: "L'étoile la plus brillante du ciel nocturne, 25 fois plus lumineuse que le Soleil. Sa compagne, Sirius B, est une naine blanche : le cœur éteint d'une étoile, de la taille de la Terre." },
    { id: 'luyten7268', r: .14, m: .10, comp: { n: 'UV Ceti', r: .13, cls: 'M', aAU: 5.4, Py: 26.3 }, name: 'Luyten 726-8 (UV Ceti)', ly: 8.73, ra: ra(1, 39, 1.3), dec: dec(-17, 57, 1), spec: 'M5,5 V + M6 V', cls: 'M', lum: 0.0013, cons: 'Baleine',
      text: "Un couple de naines rouges ; UV Ceti a donné son nom à toute une famille d'étoiles éruptives." },
    { id: 'ross154', r: .24, m: .17, name: 'Ross 154', ly: 9.69, ra: ra(18, 49, 49.4), dec: dec(-23, 50, 10), spec: 'M3,5 V', cls: 'M', lum: 0.004, cons: 'Sagittaire',
      text: "Une naine rouge éruptive de la constellation du Sagittaire." },
    { id: 'ross248', r: .16, m: .14, name: 'Ross 248', ly: 10.30, ra: ra(23, 41, 54.7), dec: dec(44, 10, 30), spec: 'M5,5 V', cls: 'M', lum: 0.0018, cons: 'Andromède',
      text: "Une naine rouge qui se rapproche de nous : dans environ 36 000 ans, elle deviendra pour quelque temps l'étoile la plus proche du Soleil." },
    { id: 'epseri', r: .74, m: .82, sys: [{ n: 'Epsilon Eridani b', P: 2690, me: 210, giant: true }], name: 'Epsilon Eridani', ly: 10.47, ra: ra(3, 32, 55.8), dec: dec(-9, 27, 30), spec: 'K2 V', cls: 'K', lum: 0.34, cons: 'Éridan',
      text: "Une jeune étoile orangée, entourée de ceintures de débris qui rappellent celles du système solaire.",
      planets: 'Epsilon Eridani b, une géante gazeuse.' },
    { id: 'lacaille9352', r: .47, m: .48, sys: [{ n: 'Lacaille 9352 b', P: 9.26, me: 4.2 }, { n: 'Lacaille 9352 c', P: 21.2, me: 7.6 }], name: 'Lacaille 9352', ly: 10.72, ra: ra(23, 5, 52.0), dec: dec(-35, 51, 11), spec: 'M0,5 V', cls: 'M', lum: 0.033, cons: 'Poisson austral',
      text: "Une naine rouge au mouvement propre rapide, l'une des premières dont on a mesuré directement le diamètre.",
      planets: 'Deux super-Terres annoncées en 2020.' },
    { id: 'ross128', r: .20, m: .17, sys: [{ n: 'Ross 128 b', P: 9.866, me: 1.4 }], name: 'Ross 128', ly: 11.01, ra: ra(11, 47, 44.4), dec: dec(0, 48, 16), spec: 'M4 V', cls: 'M', lum: 0.0036, cons: 'Vierge',
      text: "Une naine rouge calme, peu éruptive, ce qui en fait un environnement plus favorable pour ses planètes.",
      planets: 'Ross 128 b (2017), une planète tempérée de la taille de la Terre.' },
    { id: 'ezaqr', r: .13, m: .11, name: 'EZ Aquarii', ly: 11.11, ra: ra(22, 38, 33.4), dec: dec(-15, 18, 7), spec: 'M5 V (triple)', cls: 'M', lum: 0.0013, cons: 'Verseau',
      text: "Un système de trois naines rouges très serrées." },
    { id: '61cyg', r: .67, m: .70, comp: { n: '61 du Cygne B', r: .60, cls: 'K', aAU: 84, Py: 678 }, name: '61 du Cygne A et B', ly: 11.40, ra: ra(21, 6, 53.9), dec: dec(38, 44, 58), spec: 'K5 V + K7 V', cls: 'K', lum: 0.15, cons: 'Cygne',
      text: "La première étoile dont on a mesuré la distance, par Friedrich Bessel en 1838 : une date clé dans la découverte de l'immensité de l'univers." },
    { id: 'procyon', r: 2.05, m: 1.5, comp: { n: 'Procyon B (naine blanche)', r: .012, cls: 'F', aAU: 15, Py: 40.8 }, name: 'Procyon A et B', ly: 11.46, ra: ra(7, 39, 18.1), dec: dec(5, 13, 30), spec: 'F5 IV-V + naine blanche', cls: 'F', lum: 7, cons: 'Petit Chien',
      text: "L'une des étoiles les plus brillantes du ciel, accompagnée elle aussi d'une naine blanche." },
    { id: 'struve2398', r: .35, m: .33, name: 'Struve 2398 A et B', ly: 11.49, ra: ra(18, 42, 46.7), dec: dec(59, 37, 49), spec: 'M3 V + M3,5 V', cls: 'M', lum: 0.006, cons: 'Dragon',
      text: "Un couple de naines rouges dans la constellation du Dragon." },
    { id: 'groombridge34', r: .38, m: .38, name: 'Groombridge 34 A et B', ly: 11.62, ra: ra(0, 18, 22.9), dec: dec(44, 1, 23), spec: 'M1,5 V + M3,5 V', cls: 'M', lum: 0.02, cons: 'Andromède',
      text: "Un couple de naines rouges orbitant l'une autour de l'autre en plus de 2 000 ans." },
    { id: 'epsind', r: .73, m: .76, name: 'Epsilon Indi', ly: 11.87, ra: ra(22, 3, 21.7), dec: dec(-56, 47, 10), spec: 'K5 V + deux naines brunes', cls: 'K', lum: 0.22, cons: 'Indien',
      text: "Une étoile orangée accompagnée d'un couple de naines brunes.",
      planets: 'Epsilon Indi A b, une géante froide photographiée par le télescope James Webb en 2024.' },
    { id: 'tauceti', r: .79, m: .78, name: 'Tau Ceti', ly: 11.91, ra: ra(1, 44, 4.1), dec: dec(-15, 56, 15), spec: 'G8 V', cls: 'G', lum: 0.52, cons: 'Baleine',
      text: "L'étoile isolée de type solaire la plus proche, visible à l'œil nu. Elle est entourée d'un disque de débris dix fois plus massif que la ceinture de Kuiper.",
      planets: 'Plusieurs planètes candidates, non confirmées.' }
  ];

  /* couleur indicative par classe spectrale */
  OBS.STAR_COLORS = { O: 0x9bb0ff, B: 0xaabfff, A: 0xcad7ff, F: 0xf8f7ff, G: 0xfff4ea, K: 0xffd2a1, M: 0xffb07a, BD: 0xc0603a };
})();

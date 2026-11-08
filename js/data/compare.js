/* ======================================================================
   OBSERVATOIRE — valeurs chiffrées pour le comparateur (#/comparateur)
   Source : NASA, Planetary Fact Sheet et Satellite Fact Sheet (valeurs arrondies) ; diamètres tirés de rKm (bodies.js).
   m   : masse en masses terrestres
   g   : gravité de surface (m/s²)
   rot : rotation sidérale en heures (négatif = rotation rétrograde) ; sync : synchrone (même face vers sa planète)
   yr  : période orbitale autour du Soleil, en jours (lunes : autour de leur planète, champ orb)
   au  : distance moyenne au Soleil (UA)
   t   : température moyenne de surface (°C) ; tNote : précision
   moons : nombre de lunes connues (texte, ces nombres changent avec les découvertes)
   ====================================================================== */
(function () {
  'use strict';
  var OBS = window.OBS = window.OBS || {};
  OBS.COMPARE = {
    soleil:   { m: 333000, g: 274, rot: 609.1, au: 0, t: 5500, tNote: 'surface' },
    mercure:  { m: .0553, g: 3.7, rot: 1407.6, yr: 88, au: .387, t: 167, tNote: 'de −180 °C la nuit à 430 °C le jour', moons: '0' },
    venus:    { m: .815, g: 8.9, rot: -5832.5, yr: 224.7, au: .723, t: 464, moons: '0' },
    terre:    { m: 1, g: 9.8, rot: 23.93, yr: 365.26, au: 1, t: 15, moons: '1' },
    lune:     { m: .0123, g: 1.6, rot: 655.7, sync: true, orb: 27.32, of: 'Terre', au: 1, t: -20, tNote: 'de −170 °C la nuit à 120 °C le jour', moons: '0' },
    mars:     { m: .107, g: 3.7, rot: 24.62, yr: 687, au: 1.52, t: -65, moons: '2' },
    ceres:    { m: .00016, g: .28, rot: 9.07, yr: 1682, au: 2.77, t: -105, moons: '0' },
    jupiter:  { m: 317.8, g: 23.1, rot: 9.93, yr: 4331, au: 5.2, t: -110, tNote: 'au niveau des nuages', moons: 'plus de 90' },
    io:       { m: .015, g: 1.8, rot: 42.5, sync: true, orb: 1.77, of: 'Jupiter', au: 5.2, t: -143, moons: '0' },
    europe:   { m: .008, g: 1.3, rot: 85.2, sync: true, orb: 3.55, of: 'Jupiter', au: 5.2, t: -160, moons: '0' },
    ganymede: { m: .025, g: 1.4, rot: 171.7, sync: true, orb: 7.15, of: 'Jupiter', au: 5.2, t: -163, moons: '0' },
    callisto: { m: .018, g: 1.2, rot: 400.5, sync: true, orb: 16.69, of: 'Jupiter', au: 5.2, t: -139, moons: '0' },
    saturne:  { m: 95.2, g: 9, rot: 10.7, yr: 10747, au: 9.58, t: -140, tNote: 'au niveau des nuages', moons: 'plus de 270' },
    titan:    { m: .0225, g: 1.35, rot: 382.7, sync: true, orb: 15.95, of: 'Saturne', au: 9.58, t: -179, moons: '0' },
    encelade: { m: .000018, g: .11, rot: 32.9, sync: true, orb: 1.37, of: 'Saturne', au: 9.58, t: -198, moons: '0' },
    uranus:   { m: 14.5, g: 8.7, rot: -17.2, yr: 30589, au: 19.2, t: -195, tNote: 'au niveau des nuages', moons: '28' },
    neptune:  { m: 17.1, g: 11, rot: 16.1, yr: 59800, au: 30.05, t: -200, tNote: 'au niveau des nuages', moons: '16' },
    triton:   { m: .0036, g: .78, rot: -141, sync: true, orb: 5.88, of: 'Neptune', au: 30.05, t: -235, moons: '0' },
    pluton:   { m: .0022, g: .62, rot: -153.3, yr: 90560, au: 39.5, t: -225, moons: '5' },
    charon:   { m: .00027, g: .29, rot: 153.3, sync: true, orb: 6.39, of: 'Pluton', au: 39.5, t: -220, moons: '0' }
  };
})();

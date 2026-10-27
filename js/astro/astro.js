/* ======================================================================
   OBSERVATOIRE — calculs astronomiques (aucune dépendance)
   Repères : écliptique et équinoxe J2000, distances en unités astronomiques (UA).
   Passage à la scène 3D (Y vers le haut) : (x, y, z)écliptique → (x, z, −y).

   Sources des éléments :
   - planètes : E. M. Standish (JPL), « Approximate Positions of the Planets »,
     table 1 (valide de 1800 à 2050) ;
   - planètes naines : JPL Small-Body Database (éléments osculateurs à l'époque indiquée) ;
   - Lune : formule abrégée (termes principaux de la théorie lunaire) ;
   - orientation des astres : groupe de travail IAU (WGCCRE), pôles et méridiens.
   ====================================================================== */
(function () {
  'use strict';
  var OBS = window.OBS = window.OBS || {};
  var D2R = Math.PI / 180, TAU = Math.PI * 2;
  var J2000 = 2451545.0, OBL = 23.43928 * D2R;   // obliquité de l'écliptique (J2000)

  function jdFromDate(d) { return d.getTime() / 86400000 + 2440587.5; }
  function dateFromJd(jd) { return new Date((jd - 2440587.5) * 86400000); }
  function norm360(a) { a %= 360; return a < 0 ? a + 360 : a; }

  /* Planètes : [a, e, I, L, ϖ (long. du périhélie), Ω] et leurs dérivées par siècle julien */
  var PLANETS = {
    mercure: [[0.38709927, 0.20563593, 7.00497902, 252.25032350, 77.45779628, 48.33076593],
              [0.00000037, 0.00001906, -0.00594749, 149472.67411175, 0.16047689, -0.12534081]],
    venus:   [[0.72333566, 0.00677672, 3.39467605, 181.97909950, 131.60246718, 76.67984255],
              [0.00000390, -0.00004107, -0.00078890, 58517.81538729, 0.00268329, -0.27769418]],
    terre:   [[1.00000261, 0.01671123, -0.00001531, 100.46457166, 102.93768193, 0.0],
              [0.00000562, -0.00004392, -0.01294668, 35999.37244981, 0.32327364, 0.0]],
    mars:    [[1.52371034, 0.09339410, 1.84969142, -4.55343205, -23.94362959, 49.55953891],
              [0.00001847, 0.00007882, -0.00813131, 19140.30268499, 0.44441088, -0.29257343]],
    jupiter: [[5.20288700, 0.04838624, 1.30439695, 34.39644051, 14.72847983, 100.47390909],
              [-0.00011607, -0.00013253, -0.00183714, 3034.74612775, 0.21252668, 0.20469106]],
    saturne: [[9.53667594, 0.05386179, 2.48599187, 49.95424423, 92.59887831, 113.66242448],
              [-0.00125060, -0.00050991, 0.00193609, 1222.49362201, -0.41897216, -0.28867794]],
    uranus:  [[19.18916464, 0.04725744, 0.77263783, 313.23810451, 170.95427630, 74.01692503],
              [-0.00196176, -0.00004397, -0.00242939, 428.48202785, 0.40805281, 0.04240589]],
    neptune: [[30.06992276, 0.00859048, 1.77004347, -55.12002969, 44.96476227, 131.78422574],
              [0.00026291, 0.00005105, 0.00035372, 218.45945325, -0.32241464, -0.00508664]],
    pluton:  [[39.48211675, 0.24882730, 17.14001206, 238.92903833, 224.06891629, 110.30393684],
              [-0.00031596, 0.00005170, 0.00004818, 145.20780515, -0.04062942, -0.01183482]]
  };

  /* Petits corps : éléments osculateurs (JPL SBDB) — époque (JD), a, e, i, Ω, ω, M */
  var SMALL = {
    ceres:    { ep: 2460000.5, a: 2.76718174, e: 0.07881745, i: 10.58634327, node: 80.26014869, peri: 73.47046154, M: 17.21565150 },
    makemake: { ep: 2460600.5, a: 45.38390777, e: 0.16353397, i: 29.03373563, node: 79.26052040, peri: 296.75383162, M: 168.41683818 },
    haumea:   { ep: 2460200.5, a: 42.89, e: 0.1999, i: 28.21, node: 121.97, peri: 240.7, M: 219.87 },
    eris:     { ep: 2460800.5, a: 68.05060149, e: 0.43567548, i: 43.82162477, node: 36.04603608, peri: 150.71436356, M: 211.03207767 },
    /* comète de Halley : passage au périhélie le 9 février 1986 (M = 0 à cette date) */
    halley:   { ep: 2446470.5, a: 17.834, e: 0.96714, i: 162.262, node: 58.420, peri: 111.332, M: 0 }
  };

  /* Éléments képlériens (degrés) d'un corps à la date jd */
  function elements(id, jd) {
    var p = PLANETS[id];
    if (p) {
      var T = (jd - J2000) / 36525, k = [];
      for (var i = 0; i < 6; i++) k.push(p[0][i] + p[1][i] * T);
      var a = k[0], e = k[1], I = k[2], L = k[3], w = k[4], O = k[5];
      return { a: a, e: e, i: I, node: O, peri: w - O, M: norm360(L - w) };
    }
    var s = SMALL[id];
    if (s) {
      var n = 0.9856076686 / Math.pow(s.a, 1.5);   // mouvement moyen (°/jour)
      return { a: s.a, e: s.e, i: s.i, node: s.node, peri: s.peri, M: norm360(s.M + n * (jd - s.ep)) };
    }
    return null;
  }

  function solveKepler(M, e) {   // M en radians
    M = ((M % TAU) + TAU) % TAU;
    var E = e < 0.8 ? M : Math.PI;
    for (var i = 0; i < 12; i++) {
      var dE = (E - e * Math.sin(E) - M) / (1 - e * Math.cos(E));
      E -= dE; if (Math.abs(dE) < 1e-10) break;
    }
    return E;
  }

  /* Position héliocentrique écliptique (UA) à partir d'éléments et d'une anomalie excentrique */
  function fromElements(el, E, out) {
    var a = el.a, e = el.e;
    var xp = a * (Math.cos(E) - e), yp = a * Math.sqrt(1 - e * e) * Math.sin(E);
    var w = el.peri * D2R, O = el.node * D2R, I = el.i * D2R;
    var cw = Math.cos(w), sw = Math.sin(w), cO = Math.cos(O), sO = Math.sin(O), cI = Math.cos(I), sI = Math.sin(I);
    out = out || {};
    out.x = (cw * cO - sw * sO * cI) * xp + (-sw * cO - cw * sO * cI) * yp;
    out.y = (cw * sO + sw * cO * cI) * xp + (-sw * sO + cw * cO * cI) * yp;
    out.z = (sw * sI) * xp + (cw * sI) * yp;
    return out;
  }

  function helio(id, jd, out) {
    var el = elements(id, jd); if (!el) return null;
    return fromElements(el, solveKepler(el.M * D2R, el.e), out);
  }

  /* Trajectoire complète (n points) pour tracer l'orbite */
  function orbitPath(id, jd, n) {
    var el = elements(id, jd), pts = [];
    if (!el) return pts;
    for (var i = 0; i <= n; i++) pts.push(fromElements(el, i / n * TAU, {}));
    return pts;
  }

  /* Lune : position géocentrique écliptique (km), formule abrégée */
  function moonGeo(jd, out) {
    var d = jd - J2000;
    var L = (218.316 + 13.176396 * d) * D2R, M = (134.963 + 13.064993 * d) * D2R, F = (93.272 + 13.229350 * d) * D2R;
    var D = (297.850 + 12.190749 * d) * D2R, Ms = (357.529 + 0.98560028 * d) * D2R;
    var lon = L + (6.289 * Math.sin(M) + 1.274 * Math.sin(2 * D - M) + 0.658 * Math.sin(2 * D) - 0.186 * Math.sin(Ms) + 0.214 * Math.sin(2 * M)) * D2R;
    var lat = (5.128 * Math.sin(F)) * D2R;
    var r = 385001 - 20905 * Math.cos(M) - 3699 * Math.cos(2 * D - M) - 2956 * Math.cos(2 * D);
    out = out || {};
    out.x = r * Math.cos(lat) * Math.cos(lon); out.y = r * Math.cos(lat) * Math.sin(lon); out.z = r * Math.sin(lat);
    return out;
  }

  /* Équatorial (J2000) → écliptique */
  function eqToEcl(x, y, z, out) {
    out = out || {};
    var c = Math.cos(OBL), s = Math.sin(OBL);
    out.x = x; out.y = y * c + z * s; out.z = -y * s + z * c;
    return out;
  }
  function raDecToEcl(raDeg, decDeg, r, out) {
    var ra = raDeg * D2R, de = decDeg * D2R;
    return eqToEcl(r * Math.cos(de) * Math.cos(ra), r * Math.cos(de) * Math.sin(ra), r * Math.sin(de), out);
  }

  /* Orientation IAU : pôle (α0, δ0) et méridien W (degrés) → trois axes en repère écliptique
     X = méridien origine (longitude 0), Y = pôle nord, Z = X × Y (longitude −90°). */
  function bodyAxes(rot, jd) {
    var d = jd - J2000, T = d / 36525;
    var a0 = (rot.ra + (rot.raT || 0) * T) * D2R, d0 = (rot.dec + (rot.decT || 0) * T) * D2R;
    var W = norm360(rot.W0 + rot.Wd * d) * D2R;
    var P = [Math.cos(d0) * Math.cos(a0), Math.cos(d0) * Math.sin(a0), Math.sin(d0)];
    var N = [-Math.sin(a0), Math.cos(a0), 0];                       // nœud de l'équateur de l'astre sur l'équateur céleste
    var Mv = [P[1] * N[2] - P[2] * N[1], P[2] * N[0] - P[0] * N[2], P[0] * N[1] - P[1] * N[0]];
    var X = [N[0] * Math.cos(W) + Mv[0] * Math.sin(W), N[1] * Math.cos(W) + Mv[1] * Math.sin(W), N[2] * Math.cos(W) + Mv[2] * Math.sin(W)];
    var Pe = eqToEcl(P[0], P[1], P[2]), Xe = eqToEcl(X[0], X[1], X[2]);
    return { pole: Pe, prime: Xe };
  }

  /* Constellation approximative non nécessaire ici ; utilitaires d'affichage */
  var AU_KM = 149597870.7, LY_KM = 9460730472580.8, C_KMS = 299792.458;

  OBS.astro = {
    D2R: D2R, J2000: J2000, AU_KM: AU_KM, LY_KM: LY_KM, C_KMS: C_KMS,
    jdFromDate: jdFromDate, dateFromJd: dateFromJd,
    elements: elements, helio: helio, orbitPath: orbitPath, solveKepler: solveKepler, fromElements: fromElements,
    moonGeo: moonGeo, eqToEcl: eqToEcl, raDecToEcl: raDecToEcl, bodyAxes: bodyAxes,
    hasOrbit: function (id) { return !!(PLANETS[id] || SMALL[id]); },
    isSmall: function (id) { return !!SMALL[id]; },
    smallEpoch: function (id) { return SMALL[id] ? SMALL[id].ep : null; },
    /* écliptique → scène (Y vers le haut) */
    toScene: function (v, out) { out.set(v.x, v.z, -v.y); return out; }
  };
})();

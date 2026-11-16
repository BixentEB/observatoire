/* ======================================================================
   OBSERVATOIRE — éphémérides pour l'Agenda du ciel (aucune dépendance, aucun appel extérieur)
   Toutes les formules viennent de Jean Meeus, « Astronomical Algorithms » (2e éd., 1998) :
   - Soleil : chap. 25 (méthode de faible précision, ≈ 0,01°) ;
   - Lune : chap. 47 (60 termes en longitude et distance, 30 en latitude : ≈ 0,003°) ;
   - équinoxes et solstices : chap. 27 (à la minute près) ;
   - périhélie et aphélie de la Terre : chap. 38 ;
   - éclipses : chap. 54 (type, grandeur, instant du maximum à quelques minutes près) ;
   - ΔT (écart entre temps terrestre et temps universel) : polynômes d'Espenak et Meeus (NASA, 2006).
   Planètes : éléments de Standish (js/astro/astro.js), corrigés du temps de lumière et ramenés à l'équinoxe de la date.
   Les instants sont en temps universel (jour julien) ; l'affichage les passe à l'heure de l'appareil.
   ====================================================================== */
(function () {
  'use strict';
  var OBS = window.OBS = window.OBS || {};
  var R = Math.PI / 180;
  function sin(d) { return Math.sin(d * R); } function cos(d) { return Math.cos(d * R); }
  function n360(d) { d %= 360; return d < 0 ? d + 360 : d; }
  function n180(d) { d = n360(d); return d > 180 ? d - 360 : d; }
  function jdOf(date) { return date.getTime() / 86400000 + 2440587.5; }
  function dateOf(jd) { return new Date((jd - 2440587.5) * 86400000); }
  function yearOf(jd) { return 2000 + (jd - 2451545) / 365.25; }

  /* ΔT en secondes (Espenak et Meeus, NASA 2006), de 1800 à 2150 */
  function deltaT(y) {
    var t;
    if (y < 1860) { t = y - 1800; return 13.72 - .332447 * t + .0068612 * t * t + .0041116 * Math.pow(t, 3) - .00037436 * Math.pow(t, 4) + .0000121272 * Math.pow(t, 5) - .0000001699 * Math.pow(t, 6) + .000000000875 * Math.pow(t, 7); }
    if (y < 1900) { t = y - 1860; return 7.62 + .5737 * t - .251754 * t * t + .01680668 * Math.pow(t, 3) - .0004473624 * Math.pow(t, 4) + Math.pow(t, 5) / 233174; }
    if (y < 1920) { t = y - 1900; return -2.79 + 1.494119 * t - .0598939 * t * t + .0061966 * Math.pow(t, 3) - .000197 * Math.pow(t, 4); }
    if (y < 1941) { t = y - 1920; return 21.2 + .84493 * t - .0761 * t * t + .0020936 * Math.pow(t, 3); }
    if (y < 1961) { t = y - 1950; return 29.07 + .407 * t - t * t / 233 + Math.pow(t, 3) / 2547; }
    if (y < 1986) { t = y - 1975; return 45.45 + 1.067 * t - t * t / 260 - Math.pow(t, 3) / 718; }
    if (y < 2005) { t = y - 2000; return 63.86 + .3345 * t - .060374 * t * t + .0017275 * Math.pow(t, 3) + .000651814 * Math.pow(t, 4) + .00002373599 * Math.pow(t, 5); }
    if (y < 2050) { t = y - 2000; return 62.92 + .32217 * t + .005589 * t * t; }
    var u = (y - 1820) / 100; return -20 + 32 * u * u - .5628 * (2150 - y);
  }
  function tt(jdUT) { return jdUT + deltaT(yearOf(jdUT)) / 86400; }
  function ut(jdTT) { return jdTT - deltaT(yearOf(jdTT)) / 86400; }

  /* ---------- Soleil (chap. 25), longitude apparente sans nutation, distance en UA ---------- */
  function sun(jdUT) {
    var T = (tt(jdUT) - 2451545) / 36525;
    var L0 = 280.46646 + 36000.76983 * T + .0003032 * T * T, M = 357.52911 + 35999.05029 * T - .0001537 * T * T;
    var e = .016708634 - .000042037 * T;
    var C = (1.914602 - .004817 * T - .000014 * T * T) * sin(M) + (.019993 - .000101 * T) * sin(2 * M) + .000289 * sin(3 * M);
    var nu = M + C, r = 1.000001018 * (1 - e * e) / (1 + e * cos(nu));
    return { lon: n360(L0 + C - .00569), lat: 0, r: r, T: T };
  }

  /* ---------- Lune (chap. 47) : longitude, latitude (degrés, équinoxe de la date), distance (km) ---------- */
  var ML = [ // D, M, M', F, Σl (1e-6 °), Σr (1e-3 km)
    [0,0,1,0,6288774,-20905355],[2,0,-1,0,1274027,-3699111],[2,0,0,0,658314,-2955968],[0,0,2,0,213618,-569925],[0,1,0,0,-185116,48888],
    [0,0,0,2,-114332,-3149],[2,0,-2,0,58793,246158],[2,-1,-1,0,57066,-152138],[2,0,1,0,53322,-170733],[2,-1,0,0,45758,-204586],
    [0,1,-1,0,-40923,-129620],[1,0,0,0,-34720,108743],[0,1,1,0,-30383,104755],[2,0,0,-2,15327,10321],[0,0,1,2,-12528,0],
    [0,0,1,-2,10980,79661],[4,0,-1,0,10675,-34782],[0,0,3,0,10034,-23210],[4,0,-2,0,8548,-21636],[2,1,-1,0,-7888,24208],
    [2,1,0,0,-6766,30824],[1,0,-1,0,-5163,-8379],[1,1,0,0,4987,-16675],[2,-1,1,0,4036,-12831],[2,0,2,0,3994,-10445],
    [4,0,0,0,3861,-11650],[2,0,-3,0,3665,14403],[0,1,-2,0,-2689,-7003],[2,0,-1,2,-2602,0],[2,-1,-2,0,2390,10056],
    [1,0,1,0,-2348,6322],[2,-2,0,0,2236,-9884],[0,1,2,0,-2120,5751],[0,2,0,0,-2069,0],[2,-2,-1,0,2048,-4950],
    [2,0,1,-2,-1773,4130],[2,0,0,2,-1595,0],[4,-1,-1,0,1215,-3958],[0,0,2,2,-1110,0],[3,0,-1,0,-892,3258],
    [2,1,1,0,-810,2616],[4,-1,-2,0,759,-1897],[0,2,-1,0,-713,-2117],[2,2,-1,0,-700,2354],[2,1,-2,0,691,0],
    [2,-1,0,-2,596,0],[4,0,1,0,549,-1423],[0,0,4,0,537,-1117],[4,-1,0,0,520,-1571],[1,0,-2,0,-487,-1739],
    [2,1,0,-2,-399,0],[0,0,2,-2,-381,-4421],[1,1,1,0,351,0],[3,0,-2,0,-340,0],[4,0,-3,0,330,0],
    [2,-1,2,0,327,0],[0,2,1,0,-323,1165],[1,1,-1,0,299,0],[2,0,3,0,294,0],[2,0,-1,-2,0,8752]];
  var MB = [ // D, M, M', F, Σb (1e-6 °)
    [0,0,0,1,5128122],[0,0,1,1,280602],[0,0,1,-1,277693],[2,0,0,-1,173237],[2,0,-1,1,55413],[2,0,-1,-1,46271],
    [2,0,0,1,32573],[0,0,2,1,17198],[2,0,1,-1,9266],[0,0,2,-1,8822],[2,-1,0,-1,8216],[2,0,-2,-1,4324],
    [2,0,1,1,4200],[2,1,0,-1,-3359],[2,-1,-1,1,2463],[2,-1,0,1,2211],[2,-1,-1,-1,2065],[0,1,-1,-1,-1870],
    [4,0,-1,-1,1828],[0,1,0,1,-1794],[0,0,0,3,-1749],[0,1,-1,1,-1565],[1,0,0,1,-1491],[0,1,1,1,-1475],
    [0,1,1,-1,-1410],[0,1,0,-1,-1344],[1,0,0,-1,-1335],[0,0,3,1,1107],[4,0,0,-1,1021],[4,0,-1,1,833]];
  function moon(jdUT) {
    var T = (tt(jdUT) - 2451545) / 36525, T2 = T * T, T3 = T2 * T, T4 = T3 * T;
    var Lp = 218.3164477 + 481267.88123421 * T - .0015786 * T2 + T3 / 538841 - T4 / 65194000;
    var D = 297.8501921 + 445267.1114034 * T - .0018819 * T2 + T3 / 545868 - T4 / 113065000;
    var M = 357.5291092 + 35999.0502909 * T - .0001536 * T2 + T3 / 24490000;
    var Mp = 134.9633964 + 477198.8675055 * T + .0087414 * T2 + T3 / 69699 - T4 / 14712000;
    var F = 93.272095 + 483202.0175233 * T - .0036539 * T2 - T3 / 3526000 + T4 / 863310000;
    var A1 = 119.75 + 131.849 * T, A2 = 53.09 + 479264.29 * T, A3 = 313.45 + 481266.484 * T, E = 1 - .002516 * T - .0000074 * T2;
    var sl = 0, sr = 0, sb = 0, i, t, a, f;
    for (i = 0; i < ML.length; i++) {
      t = ML[i]; a = t[0] * D + t[1] * M + t[2] * Mp + t[3] * F; f = t[1] === 0 ? 1 : Math.abs(t[1]) === 1 ? E : E * E;
      sl += t[4] * f * sin(a); sr += t[5] * f * cos(a);
    }
    for (i = 0; i < MB.length; i++) {
      t = MB[i]; a = t[0] * D + t[1] * M + t[2] * Mp + t[3] * F; f = t[1] === 0 ? 1 : Math.abs(t[1]) === 1 ? E : E * E;
      sb += t[4] * f * sin(a);
    }
    sl += 3958 * sin(A1) + 1962 * sin(Lp - F) + 318 * sin(A2);
    sb += -2235 * sin(Lp) + 382 * sin(A3) + 175 * sin(A1 - F) + 175 * sin(A1 + F) + 127 * sin(Lp - Mp) - 115 * sin(Lp + Mp);
    return { lon: n360(Lp + sl / 1e6), lat: sb / 1e6, dist: 385000.56 + sr / 1000, T: T };
  }

  /* ---------- planètes : longitude et latitude géocentriques (équinoxe de la date), distance (UA) ---------- */
  var tmpE = {}, tmpP = {};
  function planet(id, jdUT) {
    var A = OBS.astro, jd = tt(jdUT), e = A.helio('terre', jd, tmpE), p = A.helio(id, jd, tmpP);
    var x = p.x - e.x, y = p.y - e.y, z = p.z - e.z, d = Math.sqrt(x * x + y * y + z * z);
    p = A.helio(id, jd - d * .0057755183, tmpP);                         // temps de lumière (UA / c, en jours)
    x = p.x - e.x; y = p.y - e.y; z = p.z - e.z; d = Math.sqrt(x * x + y * y + z * z);
    var T = (jd - 2451545) / 36525;
    return { lon: n360(Math.atan2(y, x) / R + 1.396971 * T), lat: Math.asin(z / d) / R, dist: d, rs: Math.sqrt(p.x * p.x + p.y * p.y + p.z * p.z) };
  }
  /* séparation angulaire entre deux directions écliptiques */
  function sep(l1, b1, l2, b2) {
    var c = sin(b1) * sin(b2) + cos(b1) * cos(b2) * cos(l1 - l2);
    return Math.acos(Math.max(-1, Math.min(1, c))) / R;
  }

  /* ---------- coordonnées locales ---------- */
  function obliq(T) { return 23.439291 - .0130042 * T; }
  function eclToEq(lon, lat, T) {
    var ep = obliq(T);
    var ra = Math.atan2(sin(lon) * cos(ep) - Math.tan(lat * R) * sin(ep), cos(lon)) / R;
    var de = Math.asin(sin(lat) * cos(ep) + cos(lat) * sin(ep) * sin(lon)) / R;
    return { ra: n360(ra), dec: de };
  }
  function gmst(jdUT) { var d = jdUT - 2451545, T = d / 36525; return n360(280.46061837 + 360.98564736629 * d + .000387933 * T * T - T * T * T / 38710000); }
  /* position topocentrique (parallaxe, chap. 40, Terre sphérique) et hauteur au-dessus de l'horizon */
  function topo(ra, dec, distKm, jdUT, lat, lon) {
    var H = n360(gmst(jdUT) + lon - ra), sp = 6378.14 / distKm, cp = cos(lat), spf = sin(lat);
    var dA = Math.atan2(-cp * sp * sin(H), cos(dec) - cp * sp * cos(H)) / R;
    var dec2 = Math.atan2((sin(dec) - spf * sp) * cos(dA), cos(dec) - cp * sp * cos(H)) / R;
    var ra2 = ra + dA, H2 = H - dA;
    var alt = Math.asin(spf * sin(dec2) + cp * cos(dec2) * cos(H2)) / R;
    return { ra: ra2, dec: dec2, alt: alt };
  }
  function altOf(body, jdUT, lat, lon) {
    var p = body === 'lune' ? moon(jdUT) : sun(jdUT), q = eclToEq(p.lon, p.lat, p.T);
    return topo(q.ra, q.dec, body === 'lune' ? p.dist : p.r * 149597870.7, jdUT, lat, lon).alt;
  }

  /* ---------- recherche numérique ---------- */
  /* zéro d'une fonction continue sur [a, b] (bissection) */
  function root(f, a, b, it) { var fa = f(a); for (var i = 0; i < (it || 40); i++) { var m = (a + b) / 2, fm = f(m); if ((fa < 0) === (fm < 0)) { a = m; fa = fm; } else b = m; } return (a + b) / 2; }
  /* minimum d'une fonction sur [a, b] (section dorée) */
  function argmin(f, a, b, it) {
    var g = .381966, c = a + g * (b - a), d = b - g * (b - a), fc = f(c), fd = f(d);
    for (var i = 0; i < (it || 40); i++) { if (fc < fd) { b = d; d = c; fd = fc; c = a + g * (b - a); fc = f(c); } else { a = c; c = d; fc = fd; d = b - g * (b - a); fd = f(d); } }
    return (a + b) / 2;
  }

  /* ---------- saisons (chap. 27) ---------- */
  var SEAS = [[485,324.96,1934.136],[203,337.23,32964.467],[199,342.08,20.186],[182,27.85,445267.112],[156,73.14,45036.886],[136,171.52,22518.443],
    [77,222.54,65928.934],[74,296.72,3034.906],[70,243.58,9037.513],[58,119.81,33718.147],[52,297.17,150.678],[50,21.02,2281.226],
    [45,247.54,29929.562],[44,325.15,31555.956],[29,60.93,4443.417],[18,155.12,67555.328],[17,288.79,4562.452],[16,198.04,62894.029],
    [14,199.76,31436.921],[12,95.39,14577.848],[12,287.11,31931.756],[12,320.81,34777.259],[9,227.73,1222.114],[8,15.45,16859.074]];
  function season(year, q) {
    var Y = (year - 2000) / 1000, c = [[2451623.80984, 365242.37404, .05169, -.00411, -.00057], [2451716.56767, 365241.62603, .00325, .00888, -.0003],
      [2451810.21715, 365242.01767, -.11575, .00337, .00078], [2451900.05952, 365242.74049, -.06223, -.00823, .00032]][q];
    var J0 = c[0] + c[1] * Y + c[2] * Y * Y + c[3] * Y * Y * Y + c[4] * Y * Y * Y * Y, T = (J0 - 2451545) / 36525;
    var W = 35999.373 * T - 2.47, dl = 1 + .0334 * cos(W) + .0007 * cos(2 * W), S = 0;
    SEAS.forEach(function (s) { S += s[0] * cos(s[1] + s[2] * T); });
    return ut(J0 + .00001 * S / dl);
  }

  /* ---------- périhélie et aphélie de la Terre (chap. 38) ---------- */
  function earthApsis(k) {   // k entier : périhélie ; k + 0,5 : aphélie
    var J = 2451547.507 + 365.2596358 * k + .0000000156 * k * k;
    var A1 = 328.41 + 132.788585 * k, A2 = 316.13 + 584.903153 * k, A3 = 346.2 + 450.380738 * k, A4 = 136.95 + 659.306737 * k, A5 = 249.52 + 329.653368 * k;
    J += k % 1 === 0 ? 1.278 * sin(A1) - .055 * sin(A2) - .091 * sin(A3) - .056 * sin(A4) - .045 * sin(A5)
      : -1.352 * sin(A1) + .061 * sin(A2) + .062 * sin(A3) + .029 * sin(A4) + .031 * sin(A5);
    return ut(J);
  }

  /* ---------- éclipses (chap. 54) : k entier = nouvelle lune (éclipse de Soleil), k + 0,5 = pleine lune (de Lune) ---------- */
  function eclipse(k) {
    var T = k / 1236.85, T2 = T * T, T3 = T2 * T, T4 = T3 * T;
    var F = 160.7108 + 390.67050284 * k - .0016118 * T2 - .00000227 * T3 + .000000011 * T4;
    if (Math.abs(sin(F)) > .36) return null;
    var J = 2451550.09766 + 29.530588861 * k + .00015437 * T2 - .00000015 * T3 + .00000000073 * T4;
    var E = 1 - .002516 * T - .0000074 * T2;
    var M = 2.5534 + 29.1053567 * k - .0000014 * T2 - .00000011 * T3;
    var Mp = 201.5643 + 385.81693528 * k + .0107582 * T2 + .00001238 * T3 - .000000058 * T4;
    var O = 124.7746 - 1.56375588 * k + .0020672 * T2 + .00000215 * T3;
    var F1 = F - .02665 * sin(O), A1 = 299.77 + .107408 * k - .009173 * T2, solar = k % 1 === 0;
    J += (solar ? -.4075 * sin(Mp) + .1721 * E * sin(M) : -.4065 * sin(Mp) + .1727 * E * sin(M))
      + .0161 * sin(2 * Mp) - .0097 * sin(2 * F1) + .0073 * E * sin(Mp - M) - .005 * E * sin(Mp + M) - .0023 * sin(Mp - 2 * F1)
      + .0021 * E * sin(2 * M) + .0012 * sin(Mp + 2 * F1) + .0006 * E * sin(2 * Mp + M) - .0004 * sin(3 * Mp) - .0003 * E * sin(M + 2 * F1)
      + .0003 * sin(A1) - .0002 * E * sin(M - 2 * F1) - .0002 * E * sin(2 * Mp - M) - .0002 * sin(O);
    var P = .207 * E * sin(M) + .0024 * E * sin(2 * M) - .0392 * sin(Mp) + .0116 * sin(2 * Mp) - .0073 * E * sin(Mp + M) + .0067 * E * sin(Mp - M) + .0118 * sin(2 * F1);
    var Q = 5.2207 - .0048 * E * cos(M) + .002 * E * cos(2 * M) - .3299 * cos(Mp) - .006 * E * cos(Mp + M) + .0041 * E * cos(Mp - M);
    var W = Math.abs(cos(F1)), g = (P * cos(F1) + Q * sin(F1)) * (1 - .0048 * W);
    var u = .0059 + .0046 * E * cos(M) - .0182 * cos(Mp) + .0004 * cos(2 * Mp) - .0005 * cos(M + Mp), ag = Math.abs(g);
    var out = { jd: ut(J), gamma: g, u: u, solar: solar };
    if (solar) {
      if (ag > 1.5433 + u) return null;
      if (ag < .9972) {
        var w = .00464 * Math.sqrt(1 - g * g);
        out.type = u < 0 ? 'totale' : u > .0047 ? 'annulaire' : u < w ? 'hybride' : 'annulaire';
        out.central = true;
      } else if (ag < .9972 + Math.abs(u)) { out.type = u < 0 ? 'totale' : 'annulaire'; out.central = false; }   // centrale non « centrale » : ombre rasant les pôles
      else { out.type = 'partielle'; out.mag = (1.5433 + u - ag) / (.5461 + 2 * u); }
    } else {
      var pen = (1.5573 + u - ag) / .545, umb = (1.0128 - u - ag) / .545;
      if (pen <= 0) return null;
      out.pen = pen; out.mag = umb; out.type = umb >= 1 ? 'totale' : umb > 0 ? 'partielle' : 'pénombrale';
      var n = .5458 + .04 * cos(Mp);
      out.sdPen = 60 / n * Math.sqrt(Math.max(0, Math.pow(1.5573 + u, 2) - g * g));
      out.sdPar = umb > 0 ? 60 / n * Math.sqrt(Math.max(0, Math.pow(1.0128 - u, 2) - g * g)) : 0;
      out.sdTot = umb >= 1 ? 60 / n * Math.sqrt(Math.max(0, Math.pow(.4678 - u, 2) - g * g)) : 0;
    }
    return out;
  }

  /* éclipse de Soleil vue d'un lieu : début, maximum, fin, grandeur et part du disque cachée (échantillonnage toutes les 2 minutes) */
  function localSolar(jdMax, lat, lon) {
    function st(jd) {
      var s = sun(jd), m = moon(jd), qs = eclToEq(s.lon, 0, s.T), qm = eclToEq(m.lon, m.lat, m.T);
      var ts = topo(qs.ra, qs.dec, s.r * 149597870.7, jd, lat, lon), tm = topo(qm.ra, qm.dec, m.dist, jd, lat, lon);
      var c = sin(ts.dec) * sin(tm.dec) + cos(ts.dec) * cos(tm.dec) * cos(ts.ra - tm.ra);
      var d = Math.acos(Math.max(-1, Math.min(1, c))) / R;
      var rs = .26656 / s.r, rm = Math.asin(1737.4 / (m.dist - 6378.14 * sin(Math.max(0, tm.alt)))) / R;   // rayons apparents (°), la Lune vue du lieu
      return { d: d, rs: rs, rm: rm, alt: ts.alt };
    }
    var best = null, first = null, last = null;
    for (var t = jdMax - 4 / 24; t <= jdMax + 4 / 24; t += 2 / 1440) {
      var s = st(t), on = s.d < s.rs + s.rm;
      if (on && s.alt > -.8) { if (first === null) first = t; last = t; if (!best || s.d < best.d) { best = s; best.jd = t; } }
    }
    if (!best) return null;
    var mag = (best.rs + best.rm - best.d) / (2 * best.rs), area = overlap(best.rs, best.rm, best.d);
    return { start: first, max: best.jd, end: last, mag: mag, obs: area, alt: best.alt, total: best.d + best.rs <= best.rm, annular: best.d + best.rm <= best.rs };
  }
  /* part du disque solaire (rayon a) couverte par un disque (rayon b) à la distance d */
  function overlap(a, b, d) {
    if (d >= a + b) return 0;
    if (d <= Math.abs(a - b)) return b >= a ? 1 : (b * b) / (a * a);
    var a2 = a * a, b2 = b * b;
    var x = Math.acos((d * d + a2 - b2) / (2 * d * a)), y = Math.acos((d * d + b2 - a2) / (2 * d * b));
    var area = a2 * x + b2 * y - .5 * Math.sqrt(Math.max(0, (-d + a + b) * (d + a - b) * (d - a + b) * (d + a + b)));
    return area / (Math.PI * a2);
  }

  OBS.ephem = {
    jdOf: jdOf, dateOf: dateOf, deltaT: deltaT, sun: sun, moon: moon, planet: planet, sep: sep, n180: n180, n360: n360,
    season: season, earthApsis: earthApsis, eclipse: eclipse, localSolar: localSolar, altOf: altOf, root: root, argmin: argmin
  };
})();

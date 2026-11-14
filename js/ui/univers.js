/* ======================================================================
   OBSERVATOIRE — Atlas › Univers observable (niveau 8 de la règle des échelles, lot 9)
   Données : data/univers.json, produit par tools/univers.py (tâche GitHub « Catalogues de galaxies ») :
   galaxies du relevé SDSS DR16 dans la bande équatoriale (déclinaison −2,5° à +2,5°) jusqu'à z = 0,25, distance comobile en Mpc.
   Deux vues : la tranche (éventail classique : direction dans le ciel, distance) et la vue d'ensemble, schématique et
   logarithmique, jusqu'au rayonnement fossile. Distances comobiles : univers plat, H0 = 70, Ωm = 0,3 (Ωr pour le fond diffus).
   ====================================================================== */
(function () {
  'use strict';
  var OBS = window.OBS = window.OBS || {}, esc = OBS.esc;
  var LOADING = null, MLY = 3.2616, H0 = 70, OM = .3, OR = 9e-5, C = 299792.458;
  function load() { return LOADING || (LOADING = fetch('data/univers.json', { cache: 'no-cache' }).then(function (r) { if (!r.ok) throw 0; return r.json(); }).catch(function () { LOADING = null; return null; })); }
  function nf(v, d) { return v.toLocaleString('fr-FR', { maximumFractionDigits: d || 0, minimumFractionDigits: d || 0 }); }
  // distance comobile (Mpc), intégration en log(1 + z) pour aller jusqu'au fond diffus
  function dcom(z) {
    var n = 400, a = Math.log(1 + z), s = 0;
    for (var i = 0; i <= n; i++) { var u = a * i / n, x = Math.exp(u), f = x / Math.sqrt(OR * Math.pow(x, 4) + OM * Math.pow(x, 3) + (1 - OM - OR)); s += (i === 0 || i === n ? 1 : i % 2 ? 4 : 2) * f; }
    return C / H0 * s * a / n / 3;
  }
  function zTxt(z) { return z < 1 ? nf(z, 3) : z < 10 ? nf(z, 1) : nf(z); }
  function gly(mpc) { return mpc * MLY / 1000; }        // milliards d'années-lumière
  function dTxt(mpc) { var g = gly(mpc); return g >= 1 ? nf(g, g < 10 ? 1 : 0) + ' milliards d\'al' : nf(mpc * MLY) + ' millions d\'al'; }
  // repères de la vue d'ensemble (distances comobiles calculées, valeurs arrondies)
  var MARKS = [
    { id: 'laniakea', n: 'Laniakea', z: .027, s: 'notre superamas, niveau précédent', c: '#f4c77a' },
    { id: 'sdss', n: 'Tranche du relevé SDSS', z: .25, s: 'les galaxies dessinées ici, une à une', c: '#bfe0ff' },
    { id: 'quasars', n: 'Quasars les plus lointains', z: 7.5, s: 'trous noirs géants qui brillaient moins d\'un milliard d\'années après le Big Bang', c: '#c9b8ff' },
    { id: 'jwst', n: 'Premières galaxies observées', z: 14, s: 'repérées par le télescope James Webb, environ 300 millions d\'années après le Big Bang', c: '#ffc2a8' },
    { id: 'cmb', n: 'Rayonnement fossile', z: 1100, s: 'la plus ancienne lumière visible, émise 380 000 ans après le Big Bang : le bord de l\'Univers observable', c: '#ff9f8a' }
  ];
  MARKS.forEach(function (m) { m.d = dcom(m.z); });
  function flags(over) {
    return '<div class="c-flags atlas-flags">' + (over ? '<span class="flag f-adapt" title="Adapté — échelle logarithmique : les distances sont multipliées, pas ajoutées, quand on s\'éloigne du centre"><i>Échelle</i>logarithmique</span><span class="flag f-adapt" title="Simulé — vue schématique : seuls les repères sont placés à leur distance calculée"><i>Vue</i>schématique</span>'
      : '<span class="flag f-real" title="Réel — directions et décalages vers le rouge mesurés (relevé SDSS)"><i>Galaxies</i>mesurées</span><span class="flag f-adapt" title="Adapté — distance comobile calculée à partir du décalage vers le rouge (univers plat, H0 = 70, Ωm = 0,3)"><i>Distances</i>calculées</span><span class="flag f-adapt" title="Adapté — une tranche de 5 degrés d\'épaisseur, aplatie"><i>Tranche</i>de 5°</span>') + '</div>';
  }
  var over = false;
  function slice(root, J) {
    var S = 900, cx = S / 2, cy = S / 2, R = S / 2 - 30, k = R / J.meta.dmax, PR = 2;
    var cv = document.createElement('canvas'); cv.width = S * PR; cv.height = S * PR;
    var g = cv.getContext('2d'); g.scale(PR, PR);
    J.g.forEach(function (p) {
      var a = p[0] / 100 * Math.PI / 180, d = p[1] / 10, t = Math.min(1, d / J.meta.dmax);
      g.fillStyle = 'rgba(' + Math.round(255 - 90 * t) + ',' + Math.round(232 - 40 * t) + ',' + Math.round(190 + 65 * t) + ',' + (.55 - .2 * t) + ')';
      g.fillRect(cx + Math.cos(a) * d * k - .45, cy - Math.sin(a) * d * k - .45, .9, .9);
    });
    var h = ['<image href="' + cv.toDataURL('image/png') + '" x="0" y="0" width="' + S + '" height="' + S + '"/>'];
    [1, 2, 3].forEach(function (b) { var mpc = b * 1000 / MLY, r = mpc * k; if (mpc > J.meta.dmax) return; h.push('<circle cx="' + cx + '" cy="' + cy + '" r="' + r.toFixed(1) + '" class="vl-ring"/><text x="' + (cx + r * .71 + 4).toFixed(1) + '" y="' + (cy - r * .71 - 4).toFixed(1) + '" class="at-d">' + b + ' milliard' + (b > 1 ? 's' : '') + ' d\'al</text>'); });
    // Grande Muraille de Sloan : ascension droite ≈ 135°–220°, z ≈ 0,07–0,08 (Gott et al. 2005)
    var gw = dcom(.075) * k, a0 = 135 * Math.PI / 180, a1 = 220 * Math.PI / 180;
    h.push('<path d="M' + (cx + Math.cos(a0) * gw).toFixed(1) + ',' + (cy - Math.sin(a0) * gw).toFixed(1) + ' A' + gw.toFixed(1) + ',' + gw.toFixed(1) + ' 0 0 0 ' + (cx + Math.cos(a1) * gw).toFixed(1) + ',' + (cy - Math.sin(a1) * gw).toFixed(1) + '" class="un-wall"/><text x="' + (cx + Math.cos(185 * Math.PI / 180) * (gw + 18)).toFixed(1) + '" y="' + (cy - Math.sin(185 * Math.PI / 180) * (gw + 18)).toFixed(1) + '" class="vl-n sc-named" text-anchor="end">Grande Muraille de Sloan</text>');
    h.push('<circle cx="' + cx + '" cy="' + cy + '" r="3" class="vl-here"/><text x="' + cx + '" y="' + (cy + 16) + '" class="at-n at-sun" text-anchor="middle">nous</text>');
    [0, 90, 180, 270].forEach(function (ra) { var a = ra * Math.PI / 180; h.push('<text x="' + (cx + Math.cos(a) * (R + 16)).toFixed(1) + '" y="' + (cy - Math.sin(a) * (R + 16) + 4).toFixed(1) + '" class="at-d" text-anchor="middle">' + ra / 15 + ' h</text>'); });
    return '<div class="atlas-scroll" tabindex="0"><svg class="atlas-map vl-map sc-map un-map" viewBox="0 0 ' + S + ' ' + S + '" width="' + S + '" height="' + S + '" role="img" aria-label="Tranche du relevé SDSS">' + h.join('') + '</svg></div>' +
      '<p class="note">' + nf(J.g.length) + ' galaxies du relevé SDSS, dans une tranche de 5 degrés autour de l\'équateur céleste, jusqu\'à ' + dTxt(J.meta.dmax) + '. Chaque point est une galaxie dont on a mesuré le spectre. La matière n\'est pas répartie au hasard : elle dessine une toile de filaments et de murailles autour de grands vides. Les deux secteurs vides sont les directions cachées par la Voie lactée ou non couvertes par le relevé ; au bord, les points se raréfient parce que seules les galaxies les plus brillantes restent visibles.</p>';
  }
  function overview() {
    var S = 900, cx = S / 2, cy = S / 2, R = S / 2 - 40, lo = Math.log10(50), hi = Math.log10(MARKS[4].d * 1.02);   // de 50 Mpc au fond diffus
    function rr(mpc) { return R * (Math.log10(mpc) - lo) / (hi - lo); }
    var h = ['<circle cx="' + cx + '" cy="' + cy + '" r="' + R + '" class="un-cmb"/>'];
    MARKS.forEach(function (m, i) {
      var r = rr(m.d), a = (-35 + i * 52) * Math.PI / 180, x = cx + Math.cos(a) * r, y = cy - Math.sin(a) * r;
      h.push('<circle cx="' + cx + '" cy="' + cy + '" r="' + r.toFixed(1) + '" fill="none" stroke="' + m.c + '" stroke-opacity=".5" stroke-dasharray="' + (i === 4 ? '0' : '3 5') + '"/>');
      h.push('<circle cx="' + x.toFixed(1) + '" cy="' + y.toFixed(1) + '" r="4.5" fill="' + m.c + '"/><text x="' + (x + 9).toFixed(1) + '" y="' + (y + 4).toFixed(1) + '" class="vl-n sc-named" style="fill:' + m.c + '">' + esc(m.n) + '</text><text x="' + (x + 9).toFixed(1) + '" y="' + (y + 18).toFixed(1) + '" class="at-d">' + dTxt(m.d) + ' · z ≈ ' + zTxt(m.z) + '</text>');
    });
    h.push('<circle cx="' + cx + '" cy="' + cy + '" r="3" class="vl-here"/><text x="' + cx + '" y="' + (cy + 16) + '" class="at-n at-sun" text-anchor="middle">nous</text>');
    return '<div class="atlas-scroll" tabindex="0"><svg class="atlas-map vl-map un-map" viewBox="0 0 ' + S + ' ' + S + '" width="' + S + '" height="' + S + '" role="img" aria-label="L\'Univers observable, vue schématique">' + h.join('') + '</svg></div>' +
      '<div class="rows">' + MARKS.map(function (m) { return '<article class="row"><div class="row-h"><h3><span class="vl-sw" style="background:' + m.c + '"></span>' + esc(m.n) + '</h3><p class="row-kind">' + dTxt(m.d) + ' · z ≈ ' + zTxt(m.z) + '</p></div><div class="row-b"><p>' + esc(m.s.charAt(0).toUpperCase() + m.s.slice(1)) + '.</p></div></article>'; }).join('') + '</div>' +
      '<p class="note">Échelle logarithmique : de la Terre au bord, chaque pas vers l\'extérieur multiplie la distance au lieu de l\'ajouter. Distances comobiles, c\'est-à-dire mesurées aujourd\'hui : la lumière du rayonnement fossile a voyagé 13,8 milliards d\'années, mais l\'expansion a depuis éloigné sa source à environ 44 milliards d\'années-lumière avec les valeurs arrondies utilisées ici (46 avec celles mesurées par le satellite Planck). D\'où les quelque 93 milliards d\'années-lumière de diamètre de l\'Univers observable. Au-delà, l\'Univers continue, mais sa lumière ne nous est pas encore parvenue.</p>';
  }
  function draw(root, J) {
    root.innerHTML = '<div class="atlas-head">' + flags(over) + '<div class="atlas-sizes"><span class="atlas-sizes-l">Vue :</span><span class="atlas-toggle"><button type="button" data-v="slice" aria-pressed="' + !over + '">Tranche SDSS</button><button type="button" data-v="over" aria-pressed="' + over + '">Jusqu\'au bord</button></span></div></div>' +
      (over || !J ? overview() : slice(root, J));
    root.querySelectorAll('[data-v]').forEach(function (b) { b.addEventListener('click', function () { over = b.getAttribute('data-v') === 'over'; draw(root, J); }); });
    OBS.armPinch(root);
  }
  OBS.UN = { load: load, dcom: dcom, dTxt: dTxt, MARKS: MARKS, nf: nf, zTxt: zTxt };
  OBS.atlasUnivers = function (root, view) {
    root.innerHTML = '<p class="note">Chargement du relevé…</p>';
    load().then(function (J) { if (view === 'liste') over = true; draw(root, J); });
  };
})();

/* ======================================================================
   OBSERVATOIRE — bandeaux de catégorie
   Un séparateur pour chaque famille d'objets dans les index : fond spatial (champ d'étoiles calculé,
   toujours le même pour une catégorie), illustration dessinée en SVG (spirale, comète, anneaux…),
   titre, sous-titre et nombre d'objets. Les illustrations sont symboliques : aucune n'est une image réelle.
   OBS.band(kind, titre, sous-titre, nombre)
   ====================================================================== */
(function () {
  'use strict';
  var OBS = window.OBS = window.OBS || {};
  var esc = function (s) { return OBS.esc ? OBS.esc(s) : String(s); };

  function rnd(seed) { var s = 0; for (var i = 0; i < seed.length; i++) s = (s * 31 + seed.charCodeAt(i)) >>> 0; return function () { s = (s * 1664525 + 1013904223) >>> 0; return s / 4294967296; }; }
  function stars(seed, n) {
    var r = rnd(seed), o = '';
    for (var i = 0; i < n; i++) { var x = r() * 640, y = r() * 150, a = .2 + r() * .7, rr = r() < .08 ? 1.3 : .55 + r() * .5; o += '<circle cx="' + x.toFixed(1) + '" cy="' + y.toFixed(1) + '" r="' + rr.toFixed(2) + '" fill="#fff" opacity="' + a.toFixed(2) + '"/>'; }
    return o;
  }
  // points répartis le long de bras spiraux (galaxie)
  function spiral(cx, cy, seed, col, arms, tilt) {
    var r = rnd(seed), o = '';
    for (var k = 0; k < 520; k++) {
      var arm = k % arms, t = r() * 3.4, ang = arm * 2 * Math.PI / arms + t * 1.25, rad = 6 + t * 17 + (r() - .5) * 9;
      var x = cx + Math.cos(ang) * rad, y = cy + Math.sin(ang) * rad * tilt, a = Math.max(.12, .85 - t * .2);
      o += '<circle cx="' + x.toFixed(1) + '" cy="' + y.toFixed(1) + '" r="' + (.5 + r() * .9).toFixed(2) + '" fill="' + col + '" opacity="' + a.toFixed(2) + '"/>';
    }
    return o;
  }
  function blob(cx, cy, seed, cols, n, spread) {
    var r = rnd(seed), o = '';
    for (var k = 0; k < n; k++) { var a = r() * 6.283, d = Math.pow(r(), .7) * spread; o += '<circle cx="' + (cx + Math.cos(a) * d * 1.4).toFixed(1) + '" cy="' + (cy + Math.sin(a) * d * .8).toFixed(1) + '" r="' + (8 + r() * 22).toFixed(1) + '" fill="' + cols[k % cols.length] + '" opacity="' + (.05 + r() * .09).toFixed(2) + '"/>'; }
    return o;
  }
  function cluster(cx, cy, seed, n, spread, col) {
    var r = rnd(seed), o = '';
    for (var k = 0; k < n; k++) { var a = r() * 6.283, d = Math.pow(r(), 1.6) * spread; o += '<circle cx="' + (cx + Math.cos(a) * d).toFixed(1) + '" cy="' + (cy + Math.sin(a) * d).toFixed(1) + '" r="' + (.6 + r() * 1.2).toFixed(2) + '" fill="' + col + '" opacity="' + (.4 + r() * .6).toFixed(2) + '"/>'; }
    return o;
  }
  var G = function (id, stops) { return '<radialGradient id="' + id + '">' + stops.map(function (s) { return '<stop offset="' + s[0] + '" stop-color="' + s[1] + '" stop-opacity="' + (s[2] == null ? 1 : s[2]) + '"/>'; }).join('') + '</radialGradient>'; };

  // chaque illustration : [couleur d'accent, fonction(id) → SVG dans un cadre 640 × 150, dessin à droite]
  var ART = {
    galaxie: ['#c9b8ff', function (u) { return '<defs>' + G(u + 'g', [[0, '#fff3d6', .95], [.25, '#d9c8ff', .35], [1, '#7a6cff', 0]]) + '</defs><g class="b-spin" style="transform-origin:520px 75px"><ellipse cx="520" cy="75" rx="70" ry="44" fill="url(#' + u + 'g)"/>' + spiral(520, 75, 'gal', '#e7ddff', 2, .62) + '</g>'; }],
    etoile: ['#ffd27a', function (u) { return '<defs>' + G(u + 's', [[0, '#fff', 1], [.18, '#ffe7b0', .9], [.5, '#ffb23e', .25], [1, '#ff8a2a', 0]]) + '</defs><circle cx="525" cy="75" r="68" fill="url(#' + u + 's)" class="b-pulse"/><path d="M525 15v120M465 75h120M482 32l86 86M568 32l-86 86" stroke="#fff3d0" stroke-width=".8" opacity=".35"/>'; }],
    naine: ['#ff9b7a', function (u) { return '<defs>' + G(u + 'r', [[0, '#ffe2d0', 1], [.3, '#ff8a5c', .7], [1, '#c2401f', 0]]) + G(u + 'w', [[0, '#fff', 1], [.4, '#cfe0ff', .5], [1, '#9fc0ff', 0]]) + '</defs><circle cx="480" cy="80" r="40" fill="url(#' + u + 'r)" class="b-pulse"/><circle cx="575" cy="55" r="22" fill="url(#' + u + 'w)"/><circle cx="610" cy="105" r="6" fill="#a0523a" opacity=".8"/>'; }],
    compact: ['#9fc0ff', function (u) { return '<defs>' + G(u + 'd', [[0, '#000', 1], [.55, '#000', 1], [.62, '#ffcf8a', .9], [.8, '#ff8a3a', .25], [1, '#ff6a20', 0]]) + '</defs><g class="b-spin" style="transform-origin:525px 75px"><ellipse cx="525" cy="75" rx="95" ry="16" fill="none" stroke="#ffb46a" stroke-width="5" opacity=".55"/></g><circle cx="525" cy="75" r="36" fill="url(#' + u + 'd)"/><ellipse cx="525" cy="78" rx="95" ry="14" fill="none" stroke="#ffd59a" stroke-width="2" opacity=".7" stroke-dasharray="120 300"/>'; }],
    planete: ['#e8c48a', function (u) { return '<defs><linearGradient id="' + u + 'p" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#f3d9a8"/><stop offset=".55" stop-color="#c79a5a"/><stop offset="1" stop-color="#3a2a1a"/></linearGradient></defs><ellipse cx="500" cy="78" rx="82" ry="16" fill="none" stroke="#e9d3a3" stroke-width="6" opacity=".35"/><circle cx="500" cy="75" r="36" fill="url(#' + u + 'p)"/><path d="M418 78a82 16 0 0 0 164 0" fill="none" stroke="#efdcb4" stroke-width="6" opacity=".55"/><path d="M470 64q30 -5 60 0M467 79q34 -4 68 2" stroke="#8a6232" stroke-width="3" opacity=".35" fill="none"/>'; }],
    naines: ['#c8b9a6', function (u) { return '<defs><linearGradient id="' + u + 'n" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#efe3d2"/><stop offset="1" stop-color="#5a4c40"/></linearGradient></defs><circle cx="500" cy="80" r="34" fill="url(#' + u + 'n)"/><circle cx="560" cy="48" r="11" fill="#a9978a"/><path d="M380 110q140 -70 260 -30" stroke="#c8b9a6" stroke-dasharray="3 5" fill="none" opacity=".4"/>'; }],
    lune: ['#d6d9e4', function (u) { return '<defs><mask id="' + u + 'm"><rect x="0" y="0" width="640" height="150" fill="#fff"/><circle cx="545" cy="62" r="44" fill="#000"/></mask>' + G(u + 'l', [[0, '#f4f5fa'], [1, '#8d91a2']]) + '</defs><circle cx="520" cy="75" r="48" fill="url(#' + u + 'l)" mask="url(#' + u + 'm)"/><circle cx="498" cy="92" r="6" fill="#9a9eb0" opacity=".5" mask="url(#' + u + 'm)"/><circle cx="486" cy="66" r="4" fill="#9a9eb0" opacity=".5" mask="url(#' + u + 'm)"/>'; }],
    comete: ['#9fd8ff', function (u) { return '<defs><linearGradient id="' + u + 'c" x1="1" y1="0" x2="0" y2="0"><stop offset="0" stop-color="#e8f6ff" stop-opacity=".9"/><stop offset="1" stop-color="#6fb6ff" stop-opacity="0"/></linearGradient>' + G(u + 'h', [[0, '#fff'], [.3, '#d6f0ff', .8], [1, '#8fd0ff', 0]]) + '</defs><path d="M590 52 L330 18 L332 50 Z" fill="url(#' + u + 'c)" opacity=".55"/><path d="M590 52 L350 88 L352 60 Z" fill="url(#' + u + 'c)" opacity=".35"/><circle cx="590" cy="52" r="20" fill="url(#' + u + 'h)" class="b-pulse"/>'; }],
    asteroide: ['#b9ab98', function () { return '<path d="M470 60l22-18 30 4 18 20-6 28-28 14-30-6-12-22z" fill="#6f6457" stroke="#a89a86" stroke-width="1"/><path d="M572 96l12-9 15 3 6 12-8 11-15 2-10-8z" fill="#5d5348"/><path d="M590 40l7-5 9 2 3 7-5 6-9 0z" fill="#7a6e61"/><circle cx="500" cy="68" r="5" fill="#4f463c"/><circle cx="520" cy="84" r="3" fill="#4f463c"/>'; }],
    region: ['#9aa6d8', function () { var r = rnd('belt'), o = ''; for (var k = 0; k < 260; k++) { var a = r() * 6.283, rr = 1 + (r() - .5) * .22; o += '<circle cx="' + (520 + Math.cos(a) * 110 * rr).toFixed(1) + '" cy="' + (75 + Math.sin(a) * 30 * rr).toFixed(1) + '" r="' + (.5 + r()).toFixed(2) + '" fill="#cbd3f0" opacity="' + (.3 + r() * .6).toFixed(2) + '"/>'; } return '<g class="b-spin" style="transform-origin:520px 75px">' + o + '</g><circle cx="520" cy="75" r="9" fill="#ffd27a"/>'; }],
    hypo: ['#7cc4ff', function () { return '<circle cx="530" cy="75" r="46" fill="rgba(124,196,255,.08)" stroke="#7cc4ff" stroke-dasharray="5 6" stroke-width="1.5"/><text x="530" y="90" text-anchor="middle" font-size="44" fill="#7cc4ff" opacity=".8" font-family="serif">?</text>'; }],
    nebuleuse: ['#ff8fb0', function () { return blob(520, 75, 'neb', ['#ff6f9c', '#7a8cff', '#ffb36b', '#c86bff'], 60, 70) + cluster(520, 75, 'nebs', 14, 50, '#fff'); }],
    amas: ['#cfe0ff', function (u) { return '<defs>' + G(u + 'a', [[0, '#fff', .5], [1, '#cfe0ff', 0]]) + '</defs><circle cx="520" cy="75" r="60" fill="url(#' + u + 'a)"/>' + cluster(520, 75, 'amas', 260, 62, '#f2f6ff'); }],
    exo: ['#9fe3b0', function (u) { return '<defs>' + G(u + 'e', [[0, '#fff'], [.3, '#ffe6b8', .8], [1, '#ffb23e', 0]]) + '</defs><ellipse cx="520" cy="75" rx="96" ry="26" fill="none" stroke="#9fe3b0" stroke-width="1" opacity=".5"/><ellipse cx="520" cy="75" rx="56" ry="15" fill="none" stroke="#9fe3b0" stroke-width="1" opacity=".35"/><circle cx="520" cy="75" r="24" fill="url(#' + u + 'e)"/><g class="b-spin" style="transform-origin:520px 75px"><circle cx="616" cy="75" r="6" fill="#7fc9a0"/></g>'; }],
    bras: ['#9aa6d8', function () { return '<path d="M380 120 Q470 20 640 40" stroke="#cbd3f0" stroke-width="18" fill="none" opacity=".08"/><path d="M380 120 Q470 20 640 40" stroke="#cbd3f0" stroke-width="1" stroke-dasharray="2 7" fill="none" opacity=".6"/>' + cluster(500, 55, 'bras', 90, 70, '#dfe6ff'); }],
    pluie: ['#ffd27a', function () { var r = rnd('pluie'), o = ''; for (var k = 0; k < 9; k++) { var x = 430 + r() * 190, y = 10 + r() * 90, L = 30 + r() * 50; o += '<line x1="' + x.toFixed(0) + '" y1="' + y.toFixed(0) + '" x2="' + (x - L).toFixed(0) + '" y2="' + (y + L * .45).toFixed(0) + '" stroke="#fff3d0" stroke-width="' + (1 + r()).toFixed(1) + '" stroke-linecap="round" opacity="' + (.35 + r() * .5).toFixed(2) + '"/>'; } return o; }],
    interstellaire: ['#b4f0ff', function () { return '<path d="M360 130 Q520 30 640 10" stroke="#b4f0ff" stroke-width="1.3" fill="none" stroke-dasharray="6 6" opacity=".7"/><circle cx="560" cy="45" r="4" fill="#fff"/><circle cx="560" cy="45" r="12" fill="#b4f0ff" opacity=".18"/><circle cx="450" cy="100" r="7" fill="#ffd27a" opacity=".85"/>'; }],
    vide: ['#8f96b8', function () { var r = rnd('vide'), o = ''; for (var k = 0; k < 160; k++) { var x = 380 + r() * 260, y = r() * 150; if (Math.hypot(x - 520, (y - 75) * 1.6) < 80) continue; o += '<circle cx="' + x.toFixed(1) + '" cy="' + y.toFixed(1) + '" r="' + (.6 + r() * .9).toFixed(2) + '" fill="#cfd6f0" opacity="' + (.3 + r() * .5).toFixed(2) + '"/>'; } return o + '<ellipse cx="520" cy="75" rx="80" ry="50" fill="none" stroke="#8f96b8" stroke-dasharray="3 7" opacity=".6"/>'; }],
    echelle: ['#9fe3b0', function () { var o = ''; for (var k = 0; k < 7; k++) { var r = 4 * Math.pow(1.6, k); o += '<circle cx="' + (400 + k * 34) + '" cy="75" r="' + r.toFixed(1) + '" fill="none" stroke="#9fe3b0" opacity="' + (.25 + k * .08).toFixed(2) + '"/>'; } return o; }]
  };

  var n = 0;
  OBS.band = function (kind, title, sub, count, opts) {
    var A = ART[kind] || ART.etoile, u = 'b' + (n++), o = opts || {};
    return '<header class="cat-band" data-kind="' + kind + '" style="--acc:' + A[0] + '"' + (o.id ? ' id="' + o.id + '"' : '') + '>' +
      '<svg class="cat-art" viewBox="0 0 640 150" preserveAspectRatio="xMaxYMid slice" aria-hidden="true">' + stars(kind, 70) + '<g class="cat-svg-art">' + A[1](u) + '</g></svg>' +
      '<div class="cat-txt"><h2>' + title + '</h2>' + (sub ? '<p>' + esc(sub) + '</p>' : '') + '</div>' +
      (count != null ? '<span class="cat-n">' + count + '<small>' + (count > 1 ? 'objets' : 'objet') + '</small></span>' : '') + '</header>';
  };
})();

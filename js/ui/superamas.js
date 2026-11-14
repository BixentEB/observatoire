/* ======================================================================
   OBSERVATOIRE — Atlas › Superamas local (niveau 6 de la règle des échelles, lot 6)
   Données : data/superamas.json, produit par tools/superamas.py (tâche GitHub « Catalogues de galaxies ») :
   8 779 groupes du catalogue de Kourkchi & Tully 2017 (« Galaxy groups within 3500 km/s »), jusqu'à ≈ 60 Mpc.
   Chaque groupe : n = galaxie principale (numéro PGC), k = nombre de galaxies, d = distance (Mpc),
   x, y, z = position supergalactique (Mpc), m = log10 de la masse (masses solaires), dv = distance tirée de la vitesse.
   Les noms d'usage ne sont donnés qu'aux amas et groupes identifiés sans ambiguïté ; les autres gardent leur numéro PGC.
   ====================================================================== */
(function () {
  'use strict';
  var OBS = window.OBS = window.OBS || {}, esc = OBS.esc;
  var DATA = null, LOADING = null, MLY = 3.2616;   // 1 Mpc = 3,26 millions d'années-lumière
  function load() { return LOADING || (LOADING = fetch('data/superamas.json', { cache: 'no-cache' }).then(function (r) { if (!r.ok) throw 0; return r.json(); }).then(function (j) { DATA = j; return j; }).catch(function () { LOADING = null; return null; })); }
  // galaxie principale (PGC) → nom d'usage
  var NAMES = {
    '41220': ['Amas de la Vierge', 'autour de M49 et M87 · le cœur du Superamas local'],
    '13418': ['Amas du Fourneau', 'autour de NGC 1399'],
    '43296': ['Amas du Centaure', 'autour de NGC 4696'],
    '31478': ['Amas de l\'Hydre', 'autour de NGC 3311'],
    '32256': ['Groupe du Lion I', 'M96, M105'],
    '28630': ['Groupe de M81', 'M81, M82'],
    '2557': ['Groupe local', 'la Voie lactée, Andromède · vous êtes ici']
  };
  function name(g) { return NAMES[g.n] ? NAMES[g.n][0] : (g.k >= 50 ? 'Amas de PGC ' : 'Groupe de PGC ') + g.n; }
  function nf(v, d) { return v.toLocaleString('fr-FR', { maximumFractionDigits: d || 0, minimumFractionDigits: d || 0 }); }
  function dTxt(mpc) { return nf(mpc * MLY) + ' M al'; }
  function mass(m) { var e = Math.floor(m), c = Math.pow(10, m - e); return nf(c, 1) + ' × 10<sup>' + e + '</sup> Soleils'; }
  function tier(k) { return k >= 50 ? 0 : k >= 10 ? 1 : k >= 2 ? 2 : 3; }
  var TIERS = [['#f4c77a', 'amas (50 galaxies ou plus)'], ['#8fc2ff', 'groupes riches (10 à 49)'], ['#c9b8ff', 'petits groupes (2 à 9)'], ['#5d6585', 'galaxies isolées']];
  function flags(side) {
    return '<div class="c-flags atlas-flags"><span class="flag f-real" title="Réel — positions du catalogue de Kourkchi et Tully 2017"><i>Positions</i>mesurées</span>' +
      '<span class="flag f-adapt" title="Adapté — sans distance mesurée, la distance est tirée de la vitesse d\'éloignement (loi de Hubble) : c\'est le cas de la plupart des petits groupes"><i>Distances</i>souvent par la vitesse</span>' +
      '<span class="flag f-adapt" title="Adapté — la carte est une projection : ' + (side ? 'vue de côté, la profondeur est écrasée' : 'vue de dessus du plan supergalactique, la hauteur est écrasée') + '"><i>Vue</i>' + (side ? 'de côté' : 'de dessus') + '</span>' +
      '<span class="flag f-adapt" title="Adapté — la taille des points dépend du nombre de galaxies du groupe"><i>Points</i>selon la richesse</span></div>';
  }
  var side = false;
  function map(root, J) {
    var S = 860, C = S / 2, R = 50, k = (S / 2 - 28) / R;          // ± 50 Mpc (≈ 163 M al) dans le cadre
    function P(g) { return [C + g.x * k, C - (side ? g.z : g.y) * k]; }
    var Gx = J.groupes.filter(function (g) { var p = P(g); return p[0] > 6 && p[0] < S - 6 && p[1] > 6 && p[1] < S - 6; });
    var h = [];
    [[25, '25 M al'], [50, '50 M al'], [100, '100 M al'], [150, '150 M al']].forEach(function (r) { var rr = r[0] / MLY * k; h.push('<circle cx="' + C + '" cy="' + C + '" r="' + rr.toFixed(1) + '" class="vl-ring"/><text x="' + (C + rr * .71 + 4).toFixed(1) + '" y="' + (C - rr * .71 - 4).toFixed(1) + '" class="at-d">' + r[1] + '</text>'); });
    h.push('<line x1="20" y1="' + C + '" x2="' + (S - 20) + '" y2="' + C + '" class="vl-ax"/><line x1="' + C + '" y1="20" x2="' + C + '" y2="' + (S - 20) + '" class="vl-ax"/>');
    if (side) h.push('<text x="' + C + '" y="36" class="vl-dir" text-anchor="middle">Vue de côté : les groupes se serrent autour du plan supergalactique</text>');
    Gx.slice().sort(function (a, b) { return a.k - b.k; }).forEach(function (g) {
      var p = P(g), t = tier(g.k), r = g.k === 1 ? .9 : Math.min(15, 1.2 + Math.sqrt(g.k) * .55);
      var c = '<circle cx="' + p[0].toFixed(1) + '" cy="' + p[1].toFixed(1) + '" r="' + r.toFixed(1) + '" fill="' + TIERS[t][0] + '" class="sc-g t' + t + '"><title>' + esc(name(g) + ' — ' + g.k + ' galaxie' + (g.k > 1 ? 's' : '') + ' — ' + dTxt(g.d) + (g.dv ? ' (distance tirée de la vitesse)' : '')) + '</title></circle>';
      h.push(g.k >= 5 || NAMES[g.n] ? '<a href="#/superamas/pgc' + g.n + '" class="ab">' + c + '</a>' : c);   // les groupes d'au moins 5 galaxies se rejoignent dans l'espace
    });
    var lab = Gx.filter(function (g) { return NAMES[g.n] || g.k >= 60; }).sort(function (a, b) { return b.k - a.k; });
    var boxes = [[C - 60, C - 10, C + 60, C + 26]];
    lab.forEach(function (g) {
      if (g.n === '2557') return;
      var p = P(g), t = name(g), w = t.length * 6.4 + 6, x = p[0] + 8, y = p[1] - 8, b = [x, y - 11, x + w, y + 3];
      function hit(bb) { return boxes.some(function (o) { return bb[0] < o[2] && bb[2] > o[0] && bb[1] < o[3] && bb[3] > o[1]; }); }
      if (hit(b)) { x = p[0] - 8 - w; b = [x, y - 11, x + w, y + 3]; if (hit(b)) { y = p[1] + 18; x = p[0] - w / 2; b = [x, y - 11, x + w, y + 3]; if (hit(b)) return; } }
      boxes.push(b); h.push('<text x="' + x.toFixed(1) + '" y="' + y.toFixed(1) + '" class="vl-n' + (NAMES[g.n] ? ' sc-named' : '') + '">' + esc(t) + '</text>');
    });
    h.push('<circle cx="' + C + '" cy="' + C + '" r="6" class="vl-here"/><text x="' + C + '" y="' + (C + 20) + '" class="at-n at-sun" text-anchor="middle">Groupe local · vous êtes ici</text>');
    var legend = TIERS.map(function (t) { return '<span class="at-key"><i style="background:' + t[0] + '"></i>' + esc(t[1]) + '</span>'; }).join('');
    var amas = J.groupes.filter(function (g) { return g.k >= 50; }).length;
    root.innerHTML = '<div class="atlas-head">' + flags(side) + '<div class="atlas-sizes"><span class="atlas-sizes-l">Vue :</span><span class="atlas-toggle"><button type="button" data-v="top" aria-pressed="' + !side + '">Dessus</button><button type="button" data-v="side" aria-pressed="' + side + '">Côté</button></span></div></div>' +
      '<div class="atlas-scroll" tabindex="0"><svg class="atlas-map vl-map sc-map" viewBox="0 0 ' + S + ' ' + S + '" width="' + S + '" height="' + S + '" role="img" aria-label="Carte du Superamas local">' + h.join('') + '</svg></div>' +
      '<p class="note vl-leg">' + legend + '</p>' +
      '<p class="note">' + (side ? 'Vue de côté : la plupart des groupes se tiennent près du plan supergalactique, la grande nappe qui passe par l\'amas de la Vierge et par notre Groupe local.' : 'Vue de dessus, dans le plan supergalactique : ' + nf(J.groupes.length) + ' groupes et galaxies isolées jusqu\'à près de 200 millions d\'années-lumière, dont ' + amas + ' amas de 50 galaxies ou plus. L\'amas de la Vierge, à 51 millions d\'années-lumière, en est le centre de gravité : le Groupe local, à sa périphérie, tombe lentement vers lui.') + ' Survolez un point pour son nom, son nombre de galaxies et sa distance ; cliquez sur un groupe pour le rejoindre dans l\'espace.</p>';
    root.querySelectorAll('[data-v]').forEach(function (b) { b.addEventListener('click', function () { side = b.getAttribute('data-v') === 'side'; map(root, J); OBS.armPinch(root); }); });
    OBS.armPinch(root);
  }
  function list(root, J) {
    var top = J.groupes.filter(function (g) { return g.k >= 25 || NAMES[g.n]; }).sort(function (a, b) { return b.k - a.k; });
    var counts = [0, 0, 0, 0]; J.groupes.forEach(function (g) { counts[tier(g.k)]++; });
    var rows = top.map(function (g) {
      var t = tier(g.k);
      return '<article class="row"><div class="row-h"><h3><span class="vl-sw" style="background:' + TIERS[t][0] + '"></span>' + esc(name(g)) + '</h3><p class="row-kind">' + g.k + ' galaxies · ' + dTxt(g.d) + '</p></div>' +
        '<div class="row-b"><p>' + (NAMES[g.n] ? esc(NAMES[g.n][1].charAt(0).toUpperCase() + NAMES[g.n][1].slice(1)) + '. ' : '') + 'Masse ≈ ' + mass(g.m) + ' (d\'après l\'éclat de ses galaxies)' + (g.dv ? ' · distance tirée de la vitesse' : ' · distance mesurée') + '.</p></div></article>';
    }).join('');
    root.innerHTML = '<p>Les groupes et amas les plus riches du Superamas local, du plus peuplé au plus modeste. Sur ' + nf(J.groupes.length) + ' entrées du catalogue : ' + counts[0] + ' amas, ' + nf(counts[1]) + ' groupes riches, ' + nf(counts[2]) + ' petits groupes et ' + nf(counts[3]) + ' galaxies isolées.</p><div class="rows">' + rows + '</div>' +
      '<p class="note">Source : ' + esc(J.meta.source) + '. Distances mesurées quand le catalogue en donne, sinon tirées de la vitesse (H0 = ' + nf(J.meta.H0) + ' km/s/Mpc, valeur des auteurs). Les groupes sans nom d\'usage portent le numéro PGC de leur galaxie principale.</p>';
  }
  // partagé avec la vue 3D (js/engine/superamas.js) et la console
  OBS.SC = { load: load, name: name, tier: tier, TIERS: TIERS, NAMES: NAMES, dTxt: dTxt, mass: mass, nf: nf };
  OBS.atlasSuperamas = function (root, view) {
    root.innerHTML = '<p class="note">Chargement du catalogue…</p>';
    load().then(function (J) {
      if (!J) { root.innerHTML = '<p class="note">Le catalogue du Superamas local n\'a pas pu être chargé.</p>'; return; }
      (view === 'liste' ? list : map)(root, J);
    });
  };
})();

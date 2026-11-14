/* ======================================================================
   OBSERVATOIRE — Atlas › Laniakea (niveau 7 de la règle des échelles, lot 8)
   Données : data/laniakea.json, produit par tools/laniakea.py (tâche GitHub « Catalogues de galaxies ») :
   ≈ 40 000 galaxies du relevé 2MRS (Huchra et al. 2012) jusqu'à cz = 20 000 km/s (≈ 930 millions d'al).
   Format compact : g = [[x, y, z, k]] en dixièmes de Mpc (coordonnées supergalactiques) et magnitude Ks × 10.
   Distances tirées de la vitesse (H0 = 70) : approximation signalée. Plus loin, seules les galaxies brillantes sont recensées.
   La carte est dessinée une fois dans un canvas (40 000 points), posé comme image dans un svg pour garder le zoom des cartes.
   ====================================================================== */
(function () {
  'use strict';
  var OBS = window.OBS = window.OBS || {}, esc = OBS.esc;
  var LOADING = null, MLY = 3.2616;
  function load() { return LOADING || (LOADING = fetch('data/laniakea.json', { cache: 'no-cache' }).then(function (r) { if (!r.ok) throw 0; return r.json(); }).catch(function () { LOADING = null; return null; })); }
  function nf(v, d) { return v.toLocaleString('fr-FR', { maximumFractionDigits: d || 0, minimumFractionDigits: d || 0 }); }
  function dTxt(mpc) { var ly = mpc * MLY; return ly >= 1000 ? nf(ly / 1000, 2) + ' milliard d\'al' : nf(ly) + ' M al'; }
  // couleur d'une galaxie selon sa distance (proche : doré pâle → lointaine : bleu), comme une profondeur
  function col(d, a) { var t = Math.min(1, d / 290); return 'rgba(' + Math.round(255 - 120 * t) + ',' + Math.round(225 - 60 * t) + ',' + Math.round(170 + 85 * t) + ',' + a + ')'; }
  function flags(side) {
    return '<div class="c-flags atlas-flags"><span class="flag f-real" title="Réel — directions mesurées (relevé 2MRS)"><i>Directions</i>mesurées</span>' +
      '<span class="flag f-adapt" title="Adapté — distance tirée de la vitesse d\'éloignement (loi de Hubble, H0 = 70 km/s/Mpc) : les mouvements propres étirent un peu les amas le long de la ligne de visée"><i>Distances</i>par la vitesse</span>' +
      '<span class="flag f-adapt" title="Adapté — la carte est une projection : ' + (side ? 'vue de côté, la profondeur est écrasée' : 'vue de dessus du plan supergalactique, la hauteur est écrasée') + '"><i>Vue</i>' + (side ? 'de côté' : 'de dessus') + '</span></div>';
  }
  var side = false;
  function map(root, J) {
    var S = 900, C = S / 2, R = 300, k = (S / 2 - 24) / R, PR = 2;          // ± 300 Mpc dans le cadre
    var cv = document.createElement('canvas'); cv.width = S * PR; cv.height = S * PR;
    var cx = cv.getContext('2d'); cx.scale(PR, PR);
    J.g.forEach(function (g) {
      var x = g[0] / 10, y = side ? g[2] / 10 : g[1] / 10, d = Math.hypot(g[0], g[1], g[2]) / 10, m = g[3] / 10;
      var r = Math.max(.4, Math.min(1.8, .45 + (11.75 - m) * .3));
      cx.fillStyle = col(d, (m < 10 ? .9 : .5) * (.35 + .65 * Math.min(1, d / 150))); cx.beginPath(); cx.arc(C + x * k, C - y * k, r, 0, 6.2832); cx.fill();
    });
    var h = ['<image href="' + cv.toDataURL('image/png') + '" x="0" y="0" width="' + S + '" height="' + S + '"/>'];
    [[250, '250 M al'], [500, '500 M al'], [750, '750 M al']].forEach(function (r) { var rr = r[0] / MLY * k; h.push('<circle cx="' + C + '" cy="' + C + '" r="' + rr.toFixed(1) + '" class="vl-ring"/><text x="' + (C + rr * .71 + 4).toFixed(1) + '" y="' + (C - rr * .71 - 4).toFixed(1) + '" class="at-d">' + r[1] + '</text>'); });
    var rs = 50 * k; h.push('<circle cx="' + C + '" cy="' + C + '" r="' + rs.toFixed(1) + '" class="lk-sa"/><text x="' + C + '" y="' + (C + rs + 14).toFixed(1) + '" class="at-d lk-sa-t" text-anchor="middle">Superamas local</text>');
    if (!side) h.push('<text x="' + C + '" y="30" class="vl-dir" text-anchor="middle">Les zones vides en éventail depuis le centre : la région cachée par notre propre galaxie</text>');
    var boxes = [[C - 40, C + 6, C + 40, C + 22]];   // « vous êtes ici », sous le centre
    function hit(b) { return boxes.some(function (o) { return b[0] < o[2] && b[2] > o[0] && b[1] < o[3] && b[3] > o[1]; }); }
    J.amas.forEach(function (a) {
      var x = C + a.x * k, y = C - (side ? a.z : a.y) * k, w = a.n.length * 6.4 + 6, tries = [[x + 9, y + 4, 'start'], [x - 9, y + 4, 'end'], [x, y - 10, 'middle'], [x, y + 18, 'middle']], t = null;
      tries.some(function (p) { var l = p[2] === 'start' ? p[0] : p[2] === 'end' ? p[0] - w : p[0] - w / 2, b = [l, p[1] - 11, l + w, p[1] + 3]; if (hit(b)) return false; boxes.push(b); t = p; return true; });
      h.push('<a href="#/laniakea/' + a.id + '" class="ab"><circle cx="' + x.toFixed(1) + '" cy="' + y.toFixed(1) + '" r="5" class="lk-amas"><title>' + esc(a.n + ' — ' + dTxt(Math.hypot(a.x, a.y, a.z))) + '</title></circle>' + (t ? '<text x="' + t[0].toFixed(1) + '" y="' + t[1].toFixed(1) + '" text-anchor="' + t[2] + '" class="vl-n sc-named">' + esc(a.n) + '</text>' : '') + '</a>');
    });
    h.push('<circle cx="' + C + '" cy="' + C + '" r="4" class="vl-here"/><text x="' + C + '" y="' + (C + 18) + '" class="at-n at-sun" text-anchor="middle">vous êtes ici</text>');
    root.innerHTML = '<div class="atlas-head">' + flags(side) + '<div class="atlas-sizes"><span class="atlas-sizes-l">Vue :</span><span class="atlas-toggle"><button type="button" data-v="top" aria-pressed="' + !side + '">Dessus</button><button type="button" data-v="side" aria-pressed="' + side + '">Côté</button></span></div></div>' +
      '<div class="atlas-scroll" tabindex="0"><svg class="atlas-map vl-map sc-map lk-map" viewBox="0 0 ' + S + ' ' + S + '" width="' + S + '" height="' + S + '" role="img" aria-label="Carte de Laniakea et de ses voisins">' + h.join('') + '</svg></div>' +
      '<p class="note vl-leg"><span class="at-key"><i style="background:' + col(20, 1) + '"></i>galaxies proches</span><span class="at-key"><i style="background:' + col(280, 1) + '"></i>galaxies lointaines</span><span class="at-key"><i style="background:#f4c77a"></i>amas nommés</span></p>' +
      '<p class="note">' + nf(J.g.length) + ' galaxies du relevé 2MRS jusqu\'à près d\'un milliard d\'années-lumière. Laniakea, notre superamas, s\'étend sur environ 520 millions d\'années-lumière : il englobe le Superamas local, les amas du Centaure et de l\'Hydre et le Grand Attracteur, vers lequel s\'écoulent toutes ses galaxies. Plus loin, la concentration de Shapley et l\'amas de Coma appartiennent à d\'autres bassins. Les zones vides en éventail depuis le centre sont cachées par notre propre galaxie (zone d\'évitement). Au loin, les points s\'éclaircissent : seules les galaxies les plus brillantes y sont recensées, ce n\'est pas un vide. Le contour de Laniakea, déduit des mouvements des galaxies (Tully et al. 2014), n\'est pas encore dessiné.</p>';
    root.querySelectorAll('[data-v]').forEach(function (b) { b.addEventListener('click', function () { side = b.getAttribute('data-v') === 'side'; map(root, J); OBS.armPinch(root); }); });
    OBS.armPinch(root);
  }
  function list(root, J) {
    root.innerHTML = '<p>Les grands amas repérés sur la carte, du plus proche au plus lointain. Distances tirées de leur vitesse d\'éloignement (H0 = 70 km/s/Mpc).</p><div class="rows">' +
      J.amas.map(function (a) {
        var d = Math.hypot(a.x, a.y, a.z);
        return '<article class="row"><div class="row-h"><h3><span class="vl-sw" style="background:#f4c77a"></span><a href="#/laniakea/' + a.id + '">' + esc(a.n) + '</a></h3><p class="row-kind">' + dTxt(d) + ' · ' + nf(a.v) + ' km/s</p></div><div class="row-b"><p>' + esc(a.s) + '.</p></div></article>';
      }).join('') + '</div><p class="note">Source : ' + esc(J.meta.source) + '. Positions des amas : directions et vitesses publiées (NED).</p>';
  }
  OBS.LK = { load: load, dTxt: dTxt, col: col, nf: nf };
  OBS.atlasLaniakea = function (root, view) {
    root.innerHTML = '<p class="note">Chargement du relevé…</p>';
    load().then(function (J) {
      if (!J) { root.innerHTML = '<p class="note">Le relevé 2MRS n\'a pas pu être chargé.</p>'; return; }
      (view === 'liste' ? list : map)(root, J);
    });
  };
})();

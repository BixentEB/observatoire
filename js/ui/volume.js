/* ======================================================================
   OBSERVATOIRE — Atlas › Volume local (niveau 5 de la règle des échelles)
   Données : data/volume-local.json (catalogue de Karachentsev et al. 2013, 869 galaxies à moins de 11 Mpc),
   produit par tools/volume.py. Positions en coordonnées supergalactiques : le plan SGX-SGY contient la
   « Feuille locale », la nappe de galaxies où se trouve le Groupe local.
   Carte : vue de dessus (SGX, SGY) ou de côté (SGX, SGZ). Liste : les groupes, reconstitués d'après la galaxie
   dont la gravité domine chacune (« perturbateur principal » du catalogue, indice de marée positif).
   ====================================================================== */
(function () {
  'use strict';
  var OBS = window.OBS = window.OBS || {}, esc = OBS.esc;
  var DATA = null, LOADING = null, MLY = 3.2616;   // 1 Mpc = 3,26 millions d'années-lumière
  function load() { return LOADING || (LOADING = fetch('data/volume-local.json', { cache: 'no-cache' }).then(function (r) { if (!r.ok) throw 0; return r.json(); }).then(function (j) { DATA = j; return j; }).catch(function () { LOADING = null; return null; })); }
  // noms du catalogue : « MESSIER081 », « NGC0253 », « IC0342 » → M81, NGC253, IC342
  function key(s) { return String(s || '').toUpperCase().replace(/[\s_.-]/g, '').replace(/^MESSIER0*/, 'M').replace(/^(NGC|IC|UGC|PGC|ESO|DDO)0+(?=\d)/, '$1'); }
  // noms d'usage des galaxies les plus connues
  var ALIAS = { NGC3031: 'M81', NGC3034: 'M82', NGC5128: 'Centaurus A', NGC5236: 'M83', NGC5457: 'M101', NGC4736: 'M94', NGC4258: 'M106', NGC5194: 'M51', NGC4594: 'Sombrero', NGC5055: 'M63', NGC6946: 'Galaxie du Feu d\'artifice', NGC253: 'Galaxie du Sculpteur', NGC224: 'Andromède', MESSIER031: 'Andromède', M31: 'Andromède', NGC598: 'Triangle', M33: 'Triangle', MILKYWAY: 'Voie lactée', MW: 'Voie lactée', LMC: 'Grand Nuage de Magellan', SMC: 'Petit Nuage de Magellan', NGC300: 'NGC 300', IC342: 'IC 342', MAFFEI1: 'Maffei 1', MAFFEI2: 'Maffei 2', NGC2403: 'NGC 2403', NGC55: 'NGC 55', NGC4449: 'NGC 4449', NGC4826: 'M64 (Œil noir)', NGC3115: 'Galaxie du Fuseau', NGC3368: 'M96', NGC3627: 'M66', NGC3623: 'M65', NGC3379: 'M105', NGC4945: 'NGC 4945', NGC6744: 'NGC 6744', NGC3521: 'NGC 3521', NGC891: 'NGC 891', NGC2903: 'NGC 2903', NGC1291: 'NGC 1291', NGC4631: 'Galaxie de la Baleine', NGC2683: 'Galaxie de l\'OVNI', NGC3351: 'M95', NGC2784: 'NGC 2784', NGC1400: 'NGC 1400', NGC1533: 'NGC 1533', NGC3384: 'NGC 3384', NGC925: 'NGC 925', M81: 'M81', M82: 'M82', M101: 'M101', NGC7793: 'NGC 7793', NGC247: 'NGC 247', NGC4214: 'NGC 4214' };
  function pretty(n) { var k = key(n); if (ALIAS[k]) return ALIAS[k]; return String(n).replace(/^MESSIER0*(\d+)/, 'M$1').replace(/^(NGC|IC|UGC|PGC|ESO|DDO)0*(\d)/, '$1 $2').replace(/^UGCA0*(\d)/, 'UGCA $1'); }
  function nm(n) { return pretty(n); }
  // groupes : clé du perturbateur principal → [nom, couleur]
  var G = [
    [['MW', 'MILKYWAY', 'M31', 'NGC224', 'MESSIER031', 'ANDROMEDA'], 'Groupe local', '#f4c77a'],
    [['M81', 'NGC3031', 'M82', 'NGC3034'], 'Groupe de M81', '#8fc2ff'],
    [['NGC5128', 'CENA', 'CENTAURUSA'], 'Groupe de Centaurus A', '#ff9f8a'],
    [['M83', 'NGC5236'], 'Groupe de M83', '#ffc2a8'],
    [['NGC253', 'NGC300', 'NGC55', 'NGC7793', 'NGC247'], 'Filament du Sculpteur', '#9fe3b0'],
    [['IC342', 'MAFFEI1', 'MAFFEI2', 'DWINGELOO1'], 'Groupe IC 342 / Maffei', '#c9b8ff'],
    [['M101', 'NGC5457', 'NGC5474', 'NGC5585'], 'Groupe de M101', '#e7b8ff'],
    [['NGC4736', 'M94', 'NGC4258', 'M106', 'NGC4449', 'NGC4214', 'NGC4244', 'NGC4395'], 'Nuage des Chiens de chasse', '#7fe0e0'],
    [['NGC5194', 'M51', 'NGC5055', 'M63'], 'Groupe de M51 et M63', '#b8e88f'],
    [['NGC3368', 'M96', 'NGC3379', 'M105', 'NGC3412', 'NGC3384', 'NGC3351', 'M95', 'NGC3627', 'M66', 'NGC3623', 'M65', 'NGC3628'], 'Groupes du Lion (M96, M66)', '#ffd98a'],
    [['NGC4594', 'SOMBRERO'], 'Groupe du Sombrero', '#f0a8c8']
  ];
  var IDX = {}; G.forEach(function (g, i) { g[0].forEach(function (k) { IDX[k] = i; }); });
  function grp(g) { var i = IDX[key(g.n)]; if (i !== undefined) return i; if (g.th !== undefined && g.th < 0) return -1; i = IDX[key(g.md)]; return i === undefined ? -2 : i; }
  function col(gi) { return gi >= 0 ? G[gi][2] : gi === -2 ? '#7f93c8' : '#6c7290'; }
  function nf(v, d) { return v.toLocaleString('fr-FR', { maximumFractionDigits: d || 0, minimumFractionDigits: d || 0 }); }
  function dTxt(mpc) { var ly = mpc * MLY; return (ly < 10 ? nf(ly, 1) : nf(ly)) + ' M al'; }
  function flags(side) {
    return '<div class="c-flags atlas-flags"><span class="flag f-real" title="Réel — distances et directions mesurées (catalogue de Karachentsev et al. 2013)"><i>Positions</i>mesurées</span>' +
      '<span class="flag f-adapt" title="Adapté — la carte est une projection : ' + (side ? 'vue de côté, la profondeur (SGY) est écrasée' : 'vue de dessus du plan supergalactique, la hauteur (SGZ) est écrasée') + '"><i>Vue</i>' + (side ? 'de côté' : 'de dessus') + '</span>' +
      '<span class="flag f-adapt" title="Adapté — la taille des points dépend de la luminosité de la galaxie, pas de son diamètre"><i>Points</i>selon l\'éclat</span></div>';
  }
  var side = false;
  function map(root, J) {
    var Gx = J.galaxies.filter(function (g) { return Math.abs(g.x) < 11.5 && Math.abs(side ? g.z : g.y) < 11.5 && g.d < 12; }), S = 820, C = S / 2, R = 11.5, k = (S / 2 - 30) / R;          // ± 11,5 Mpc dans le cadre
    function P(g) { return [C + g.x * k, C - (side ? g.z : g.y) * k]; }
    var h = [];
    [2, 4, 6, 8, 10].forEach(function (r) { h.push('<circle cx="' + C + '" cy="' + C + '" r="' + (r * k).toFixed(1) + '" class="vl-ring"/><text x="' + (C + r * k * .71 + 4).toFixed(1) + '" y="' + (C - r * k * .71 - 4).toFixed(1) + '" class="at-d">' + dTxt(r) + '</text>'); });
    h.push('<line x1="' + 20 + '" y1="' + C + '" x2="' + (S - 20) + '" y2="' + C + '" class="vl-ax"/><line x1="' + C + '" y1="20" x2="' + C + '" y2="' + (S - 20) + '" class="vl-ax"/>');
    if (!side) h.push('<text x="' + (C - 3.7 * k).toFixed(1) + '" y="34" class="vl-dir" text-anchor="middle">↑ vers l\'amas de la Vierge (54 M al)</text>');
    else h.push('<text x="' + C + '" y="40" class="vl-dir" text-anchor="middle">↑ le Vide local : presque aucune galaxie</text>');
    var lab = Gx.filter(function (g) { return g.lk !== undefined; }).sort(function (a, b) { return b.lk - a.lk; }).slice(0, 26);
    var labSet = {}; lab.forEach(function (g) { labSet[g.n] = 1; });
    Gx.slice().sort(function (a, b) { return (a.lk || 0) - (b.lk || 0); }).forEach(function (g) {
      var p = P(g), gi = grp(g), cl = col(gi), r = g.lk ? Math.max(1.2, Math.min(7, (g.lk - 6) * 1.25)) : 1.2;
      h.push('<circle cx="' + p[0].toFixed(1) + '" cy="' + p[1].toFixed(1) + '" r="' + r.toFixed(1) + '" fill="' + cl + '" class="vl-g' + (gi === -1 ? ' f' : '') + '"><title>' + esc(nm(g.n) + (nm(g.n) !== g.n ? ' (' + g.n + ')' : '') + ' — ' + dTxt(g.d) + (gi >= 0 ? ' — ' + G[gi][1] : '')) + '</title></circle>');
    });
    var boxes = [[C - 40, C - 12, C + 40, C + 22]];
    lab.forEach(function (g) {
      if (key(g.n) === 'MW' || key(g.n) === 'MILKYWAY') return;
      var p = P(g), t = nm(g.n), w = t.length * 6.4 + 6, x = p[0] + 6, y = p[1] - 6, b = [x, y - 11, x + w, y + 3];
      if (boxes.some(function (o) { return b[0] < o[2] && b[2] > o[0] && b[1] < o[3] && b[3] > o[1]; })) { x = p[0] - 6 - w; b = [x, y - 11, x + w, y + 3]; if (boxes.some(function (o) { return b[0] < o[2] && b[2] > o[0] && b[1] < o[3] && b[3] > o[1]; })) return; }
      boxes.push(b); h.push('<text x="' + x.toFixed(1) + '" y="' + y.toFixed(1) + '" class="vl-n">' + esc(t) + '</text>');
    });
    h.push('<circle cx="' + C + '" cy="' + C + '" r="7" class="vl-here"/><text x="' + C + '" y="' + (C + 22) + '" class="at-n at-sun" text-anchor="middle">Groupe local · vous êtes ici</text>');
    var legend = G.map(function (g) { return '<span class="at-key"><i style="background:' + g[2] + '"></i>' + esc(g[1]) + '</span>'; }).join('') + '<span class="at-key"><i style="background:#7f93c8"></i>autres petits groupes</span><span class="at-key"><i style="background:#6c7290"></i>galaxies isolées</span>';
    root.innerHTML = '<div class="atlas-head">' + flags(side) + '<div class="atlas-sizes"><span class="atlas-sizes-l">Vue :</span><span class="atlas-toggle"><button type="button" data-v="top" aria-pressed="' + !side + '">Dessus</button><button type="button" data-v="side" aria-pressed="' + side + '">Côté</button></span></div></div>' +
      '<div class="atlas-scroll" tabindex="0"><svg class="atlas-map vl-map" viewBox="0 0 ' + S + ' ' + S + '" width="' + S + '" height="' + S + '" role="img" aria-label="Carte du Volume local">' + h.join('') + '</svg></div>' +
      '<p class="note vl-leg">' + legend + '</p>' +
      '<p class="note">' + (side ? 'Vue de côté : presque toutes les galaxies proches tiennent dans une nappe épaisse d\'un ou deux millions d\'années-lumière, la Feuille locale. Au-dessus s\'étend le Vide local, une immense région presque vide.' : 'Vue de dessus, dans le plan de la Feuille locale : ' + nf(Gx.length) + ' galaxies à moins d\'environ 38 millions d\'années-lumière. La plupart sont des naines ; les grandes se regroupent autour de M81, de Centaurus A, de M83 ou le long du filament du Sculpteur.') + ' Survolez un point pour son nom et sa distance.</p>';
    root.querySelectorAll('[data-v]').forEach(function (b) { b.addEventListener('click', function () { side = b.getAttribute('data-v') === 'side'; map(root, J); OBS.armPinch(root); }); });
    OBS.armPinch(root);
  }
  function list(root, J) {
    var buckets = G.map(function () { return []; }), field = [], other = [];
    J.galaxies.forEach(function (g) { var i = grp(g); (i === -1 ? field : i === -2 ? other : buckets[i]).push(g); });
    function bright(L) { return L.slice().sort(function (a, b) { return (b.lk || 0) - (a.lk || 0); }); }
    var rows = G.map(function (g, i) {
      var L = buckets[i]; if (!L.length) return '';
      var B = bright(L), ds = L.map(function (x) { return x.d; }).sort(function (a, b) { return a - b; }), med = ds[Math.floor(ds.length / 2)];
      return '<article class="row"><div class="row-h"><h3><span class="vl-sw" style="background:' + g[2] + '"></span>' + esc(g[1]) + '</h3><p class="row-kind">' + L.length + ' galaxie' + (L.length > 1 ? 's' : '') + ' · vers ' + dTxt(med) + '</p></div>' +
        '<div class="row-b"><p>Les plus brillantes : ' + B.slice(0, 6).map(function (x) { return esc(nm(x.n)) + ' <span class="vl-d">' + dTxt(x.d) + '</span>'; }).join(', ') + (L.length > 6 ? ', et ' + (L.length - 6) + ' autres, surtout des naines.' : '.') + '</p></div></article>';
    }).join('');
    var FB = bright(field);
    root.innerHTML = '<p>Les galaxies du Volume local, rangées par groupe. Un groupe rassemble les galaxies liées par la gravité à une grande voisine (d\'après l\'indice de marée du catalogue).</p><div class="rows">' + rows +
      (other.length ? '<article class="row"><div class="row-h"><h3><span class="vl-sw" style="background:#7f93c8"></span>Autres petits groupes</h3><p class="row-kind">' + other.length + ' galaxies</p></div><div class="row-b"><p>Des galaxies liées à des voisines plus modestes. Les plus brillantes : ' + bright(other).slice(0, 6).map(function (x) { return esc(nm(x.n)) + ' <span class="vl-d">' + dTxt(x.d) + '</span>'; }).join(', ') + '.</p></div></article>' : '') +
      '<article class="row"><div class="row-h"><h3><span class="vl-sw" style="background:#6c7290"></span>Galaxies isolées</h3><p class="row-kind">' + field.length + ' galaxies</p></div><div class="row-b"><p>Des galaxies sans grande voisine dominante, dispersées dans la Feuille locale. Les plus brillantes : ' + FB.slice(0, 6).map(function (x) { return esc(nm(x.n)) + ' <span class="vl-d">' + dTxt(x.d) + '</span>'; }).join(', ') + '.</p></div></article></div>' +
      '<p class="note">Source : ' + esc(J.meta.source) + '.</p>';
  }
  OBS.atlasVolume = function (root, view) {
    root.innerHTML = '<p class="note">Chargement du catalogue…</p>';
    load().then(function (J) {
      if (!J) { root.innerHTML = '<p class="note">Le catalogue du Volume local n\'a pas pu être chargé.</p>'; return; }
      (view === 'liste' ? list : map)(root, J);
    });
  };
})();

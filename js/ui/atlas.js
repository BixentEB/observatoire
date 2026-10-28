/* ======================================================================
   OBSERVATOIRE — Atlas
   L'atlas suit l'endroit où l'on se trouve : système solaire, voisinage stellaire (puis galaxie).
   Deux vues pour chaque portée :
   - carte : une carte à plat (à la manière des planches astronomiques), cliquable ;
   - liste : tous les objets, par familles.
   Adresses : #/atlas, #/atlas/<systeme|voisinage|galaxie>, #/atlas/<portée>/<carte|liste>
   ====================================================================== */
(function () {
  'use strict';
  var OBS = window.OBS, esc = OBS.esc;
  var SCOPES = [
    { id: 'systeme', label: 'Système solaire' },
    { id: 'voisinage', label: 'Voisinage stellaire' },
    { id: 'galaxie', label: 'Voie lactée', soon: true }
  ];
  function hex(c) { return '#' + ('000000' + (c >>> 0).toString(16)).slice(-6); }
  function colorOf(b) { return b.id === 'soleil' ? '#ffb23e' : b.look && b.look.c ? hex(b.look.c[1]) : '#8f96b8'; }
  var nf = function (v, d) { return v.toLocaleString('fr-FR', { maximumFractionDigits: d || 0, minimumFractionDigits: d || 0 }); };
  var sizeMode = 'lisibles';
  try { sizeMode = localStorage.getItem('obs.atlas.tailles') || 'lisibles'; } catch (e) {}
  var reduced = false; try { reduced = matchMedia('(prefers-reduced-motion: reduce)').matches; } catch (e) {}

  OBS.pages.atlas = function (root, scope, view) {
    if (!scope) scope = OBS.engine.level && OBS.engine.level.id === 'voisinage' ? 'voisinage' : 'systeme';   // l'atlas suit l'endroit où l'on est
    if (!SCOPES.some(function (s) { return s.id === scope; })) scope = 'systeme';
    view = view === 'liste' || view === 'unites' ? view : 'carte';
    var h = [];
    h.push('<p class="p-kicker">Atlas</p><h1>' + esc(SCOPES.filter(function (s) { return s.id === scope; })[0].label) + '</h1>');
    h.push('<div class="tabs" role="tablist" aria-label="Portée">' + SCOPES.map(function (s) {
      return '<a role="tab" class="tab' + (s.soon ? ' soon' : '') + '" href="#/atlas/' + s.id + '/' + view + '" aria-selected="' + (s.id === scope) + '">' + esc(s.label) + (s.soon ? ' <small>bientôt</small>' : '') + '</a>';
    }).join('') + '<span class="tabs-sep"></span>' +
      '<a class="tab tab-view" href="#/atlas/' + scope + '/carte" aria-selected="' + (view === 'carte') + '">Carte</a>' +
      '<a class="tab tab-view" href="#/atlas/' + scope + '/liste" aria-selected="' + (view === 'liste') + '">Liste</a>' +
      '<a class="tab tab-view" href="#/atlas/' + scope + '/unites" aria-selected="' + (view === 'unites') + '">Unités</a></div>');
    h.push('<div id="atlas-body"></div>');
    root.innerHTML = h.join('');
    var body = root.querySelector('#atlas-body');
    if (view === 'unites') return unites(body);
    if (scope === 'galaxie') return galaxie(body);
    if (view === 'liste') return scope === 'voisinage' ? listeVoisinage(body) : listeSysteme(body);
    return scope === 'voisinage' ? carteVoisinage(body) : carteSysteme(body);
  };

  /* ---------------- listes ---------------- */
  function card(href, color, name, sub) {
    return '<a class="obj" href="' + href + '"><i style="background:' + color + ';box-shadow:0 0 10px ' + color + '"></i><span><b>' + esc(name) + '</b><small>' + esc(sub) + '</small></span></a>';
  }
  function listeSysteme(root) {
    var B = OBS.BODIES, h = [];
    function group(title, list) {
      if (!list.length) return;
      h.push('<h2>' + title + '</h2><div class="grid-list">' + list.map(function (b) { return card('#/explorer/' + b.id, colorOf(b), b.name, b.kind); }).join('') + '</div>');
    }
    group('Étoile', B.filter(function (b) { return b.id === 'soleil'; }));
    group('Planètes', B.filter(function (b) { return b.parent === 'soleil' && !b.dwarf && !b.comet && !b.moon; }));
    group('Planètes naines', B.filter(function (b) { return b.dwarf; }));
    var parents = []; B.forEach(function (b) { if (b.moon && parents.indexOf(b.parent) < 0) parents.push(b.parent); });
    parents.forEach(function (p) { group('Lunes · ' + OBS.byId[p].name, B.filter(function (b) { return b.moon && b.parent === p; })); });
    group('Comète', B.filter(function (b) { return b.comet; }));
    group('Régions', OBS.REGIONS);
    root.innerHTML = h.join('');
  }
  function listeVoisinage(root) {
    var stars = OBS.STARS.slice().sort(function (a, b) { return a.ly - b.ly; });
    root.innerHTML = '<p>Les étoiles et naines brunes à moins de 12 années-lumière, de la plus proche à la plus lointaine.</p><div class="grid-list">' +
      stars.map(function (s) { return card('#/etoile/' + s.id, hex(OBS.STAR_COLORS[s.cls] || 0xffffff), s.name, s.spec + ' · ' + nf(s.ly, 2) + ' al'); }).join('') + '</div>';
  }
  function galaxie(root) {
    root.innerHTML = '<div class="atlas-soon"><p class="lead">La Voie lactée vue de l\'extérieur est en préparation.</p><p>Personne n\'a jamais photographié notre galaxie de l\'extérieur : ce sera une reconstitution fondée sur les représentations scientifiques officielles, présentée comme telle, avec la position du Soleil sur le bras d\'Orion et, peut-être, des systèmes d\'exoplanètes connus à visiter.</p></div>';
  }

  /* ---------------- unités : les repères de l'astronomie ---------------- */
  function unites(root) {
    var U = [
      { u: 'km', n: 'Kilomètre', v: 'Notre unité de tous les jours', ex: 'La Terre fait 12 742 km de diamètre ; la Lune est à 384 400 km.', use: 'Tailles des astres, distances autour d\'une planète.' },
      { u: 's-l', n: 'Seconde-lumière', v: '299 792 km', ex: 'La lumière de la Lune met environ 1,3 seconde pour nous parvenir.', use: 'Distances dans le système Terre-Lune.' },
      { u: 'UA', n: 'Unité astronomique', v: '149 597 870,7 km, la distance moyenne Terre-Soleil', ex: 'La lumière du Soleil met 8 min 19 s pour la parcourir. Jupiter est à 5,2 UA, Neptune à 30 UA.', use: 'Distances dans le système solaire.' },
      { u: 'al', n: 'Année-lumière', v: '≈ 9 461 milliards de km, soit ≈ 63 241 UA', ex: 'La distance parcourue par la lumière en un an. Proxima du Centaure est à 4,24 al.', use: 'Distances entre les étoiles.' },
      { u: 'pc', n: 'Parsec', v: '≈ 3,26 al, soit ≈ 206 265 UA', ex: 'La distance d\'où l\'on verrait l\'orbite terrestre sous un angle d\'une seconde d\'arc. C\'est l\'unité des astronomes professionnels.', use: 'Distances entre les étoiles et les galaxies.' },
      { u: 'M⊕', n: 'Masse terrestre', v: '5,97 × 10²⁴ kg', ex: 'Jupiter pèse 318 masses terrestres, le Soleil 333 000.', use: 'Masses des planètes et des exoplanètes rocheuses.' },
      { u: 'MJ', n: 'Masse jovienne', v: '≈ 318 masses terrestres', ex: 'Les naines brunes font de 13 à environ 80 masses joviennes.', use: 'Masses des planètes géantes et des naines brunes.' },
      { u: 'R☉ · M☉', n: 'Rayon et masse solaires', v: '696 340 km ; 1,989 × 10³⁰ kg', ex: 'Proxima du Centaure fait 0,15 rayon solaire, Sirius A 1,7.', use: 'Tailles et masses des étoiles.' },
      { u: 'K', n: 'Kelvin', v: '0 K = −273,15 °C, le zéro absolu', ex: 'La surface du Soleil est à 5 772 K (≈ 5 500 °C).', use: 'Températures des étoiles et du froid spatial.' }
    ];
    root.innerHTML = '<p class="lead" style="margin-top:0">Les distances de l\'univers sont si grandes qu\'on change d\'unité à chaque étape. Chacune sert à une échelle.</p>' +
      '<div class="units">' + U.map(function (x) {
        return '<div class="unit"><span class="unit-sym">' + esc(x.u) + '</span><h3>' + esc(x.n) + '</h3><p class="unit-v">' + esc(x.v) + '</p><p>' + esc(x.ex) + '</p><p class="unit-use">' + esc(x.use) + '</p></div>';
      }).join('') + '</div>' +
      '<h2>Une échelle pour se représenter</h2><div class="scale-row">' +
      [['Terre → Lune', '1,3 seconde-lumière'], ['Terre → Soleil', '8 minutes-lumière'], ['Soleil → Neptune', '4 heures-lumière'], ['Soleil → Proxima', '4,24 années-lumière'], ['Traversée de la Voie lactée', '≈ 100 000 années-lumière']]
        .map(function (r, i) { return '<div class="sr" style="--i:' + i + '"><b>' + r[1] + '</b><span>' + r[0] + '</span></div>'; }).join('') + '</div>' +
      '<p class="note">Chaque étape est des milliers de fois plus grande que la précédente : c\'est pour cela que l\'Observatoire change de niveau et d\'échelle quand on zoome.</p>';
  }

  /* ---------------- carte à plat du système solaire ---------------- */
  /* Colonnes dans l'ordre réel depuis le Soleil ; sous chaque planète, ses lunes dans l'ordre de leur distance. */
  function columns() {
    var B = OBS.byId;
    return [
      { id: 'mercure' }, { id: 'venus' }, { id: 'terre' }, { id: 'mars' },
      { region: 'ceinture', members: ['ceres'] },
      { id: 'jupiter' }, { id: 'saturne' }, { id: 'uranus' }, { id: 'neptune' },
      { region: 'kuiper', members: ['pluton', 'haumea', 'makemake'] },
      { id: 'eris', far: true }, { id: 'halley', far: true }
    ].map(function (c) { c.def = B[c.id || c.region]; return c; });
  }
  function radius(km) {
    if (sizeMode === 'reelles') return km * 72 / 69911;              // Jupiter = 72 px, tout le reste à la même échelle
    return 5 + 52 * Math.pow(km / 69911, .55);
  }
  function rotPeriodDays(def) { if (def.rot) return 360 / Math.abs(def.rot.Wd); if (def.spinH) return def.spinH / 24; return 1; }

  function carteSysteme(root) {
    var cols = columns(), AXIS = 150, GAP = 26, x = 0, defs = [], back = [], front = [], labels = [];
    var sunR = sizeMode === 'reelles' ? radius(696340) : 230;
    x = Math.min(sunR, 230) * .42 + 30;                      // le Soleil déborde à gauche, comme sur les planches
    defs.push('<radialGradient id="ag-sun" cx="100%" cy="50%" r="100%"><stop offset="0" stop-color="#fff2cf"/><stop offset=".25" stop-color="#ffd27a"/><stop offset=".7" stop-color="#ff9a2e"/><stop offset="1" stop-color="#b9480e"/></radialGradient>');
    defs.push('<radialGradient id="ag-shade" cx="30%" cy="40%" r="75%"><stop offset="0" stop-color="#fff" stop-opacity=".08"/><stop offset=".55" stop-color="#000" stop-opacity="0"/><stop offset="1" stop-color="#000" stop-opacity=".72"/></radialGradient>');
    back.push('<a href="#/explorer/soleil" class="ab"><circle cx="' + (x - sunR - 10).toFixed(1) + '" cy="' + AXIS + '" r="' + sunR.toFixed(1) + '" fill="url(#ag-sun)"/><title>Soleil</title></a>');
    labels.push('<text x="12" y="' + (AXIS - Math.min(sunR, 120) - 14) + '" class="at-n at-sun">Soleil</text>');
    var maxY = AXIS + 80;
    cols.forEach(function (c, ci) {
      var d = c.def;
      if (c.region) {
        var w = 30 + c.members.length * 26, cx = x + w / 2;
        back.push('<rect x="' + x + '" y="' + (AXIS - 70) + '" width="' + w + '" height="140" rx="12" class="at-belt"/>');
        // poussière de la ceinture
        for (var k = 0; k < 26; k++) { var px = x + 6 + (k * 37 % (w - 12)), py = AXIS - 60 + (k * 53 % 120); back.push('<circle cx="' + px + '" cy="' + py + '" r="' + (.8 + (k % 3) * .4) + '" class="at-dust"/>'); }
        labels.push('<a href="#/explorer/' + d.id + '" class="ab"><text x="' + cx + '" y="' + (AXIS - 82) + '" class="at-n at-reg" text-anchor="middle">' + esc(d.name) + '</text></a>');
        c.members.forEach(function (mid, mi) {
          var m = OBS.byId[mid], r = Math.max(radius(m.rKm), 1.6), my = AXIS + 100 + mi * 30;
          front.push(planet(m, cx, my, r, defs));
          labels.push('<a href="#/explorer/' + mid + '" class="ab"><text x="' + (cx + Math.max(r, 3) + 6) + '" y="' + (my + 4) + '" class="at-m">' + esc(m.name) + '</text></a>');
          front.push('<line x1="' + cx + '" y1="' + (AXIS + 70) + '" x2="' + cx + '" y2="' + (my - r - 3) + '" class="at-stem"/>');
          maxY = Math.max(maxY, my + 20);
        });
        x += w + GAP; return;
      }
      var r = Math.max(radius(d.rKm), 1.6), colW = Math.max(r * 2, d.ring ? r * 2.4 * 2 : 0, 64), cx = x + colW / 2;
      if (c.far && ci === cols.length - 2) { back.push('<text x="' + (x - GAP / 2) + '" y="' + (AXIS + 4) + '" class="at-gap" text-anchor="middle">⋯</text>'); }
      front.push(planet(d, cx, AXIS, r, defs));
      var el = OBS.astro.elements(d.id, OBS.time.jd);
      var top = d.id === 'uranus' && d.ring ? r * d.ring.outer / d.rKm : r;
      labels.push('<a href="#/explorer/' + d.id + '" class="ab"><text x="' + cx + '" y="' + (AXIS - Math.max(top, 3) - 14) + '" class="at-n" text-anchor="middle">' + esc(d.name) + '</text></a>');
      if (el) labels.push('<text x="' + cx + '" y="' + (AXIS + Math.max(top, 6) + 18) + '" class="at-d" text-anchor="middle">' + nf(el.a, el.a < 10 ? 2 : 1) + ' UA</text>');
      var moons = OBS.childrenOf(d.id).sort(function (a, b) { return a.orbit.aKm - b.orbit.aKm; });
      if (moons.length) {
        var y0 = AXIS + Math.max(top, 6) + 34;
        front.push('<line x1="' + cx + '" y1="' + y0 + '" x2="' + cx + '" y2="' + (y0 + 14 + (moons.length - 1) * 30) + '" class="at-stem"/>');
        moons.forEach(function (m, mi) {
          var mr = Math.max(radius(m.rKm), 1.6), my = y0 + 18 + mi * 30;
          front.push(planet(m, cx, my, mr, defs));
          labels.push('<a href="#/explorer/' + m.id + '" class="ab"><text x="' + (cx + Math.max(mr, 3) + 6) + '" y="' + (my + 4) + '" class="at-m">' + esc(m.name) + '</text></a>');
          maxY = Math.max(maxY, my + 22);
        });
      }
      x += colW + GAP;
    });
    var W = x + 20, H = Math.max(maxY, AXIS + 120);
    var svg = '<svg class="atlas-map" viewBox="0 0 ' + W + ' ' + H + '" width="' + W + '" height="' + H + '" role="img" aria-label="Carte à plat du système solaire">' +
      '<defs>' + defs.join('') + '</defs>' +
      '<line x1="0" y1="' + AXIS + '" x2="' + W + '" y2="' + AXIS + '" class="at-axis"/>' + back.join('') + front.join('') + labels.join('') + '</svg>';
    root.innerHTML = '<div class="c-flags atlas-flags">' +
      '<span class="flag f-real" title="Réel — les objets sont rangés dans leur vrai ordre depuis le Soleil"><i>Ordre</i>réel</span>' +
      '<span class="flag f-adapt" title="Adapté — les écarts entre colonnes ne sont pas à l\'échelle ; la distance moyenne est indiquée en UA"><i>Distances</i>non à l\'échelle</span>' +
      (sizeMode === 'reelles' ? '<span class="flag f-real" title="Réel — toutes les tailles sont à la même échelle (Jupiter = 72 px)"><i>Tailles</i>réelles</span>'
        : '<span class="flag f-adapt" title="Adapté — les petits objets sont agrandis pour rester lisibles"><i>Tailles</i>lisibles</span>') +
      '<span class="flag f-sim" title="Simulé — vitesse de rotation indicative"><i>Rotation</i>indicative</span>' +
      '<span class="atlas-toggle"><button type="button" data-s="lisibles" aria-pressed="' + (sizeMode === 'lisibles') + '">Tailles lisibles</button><button type="button" data-s="reelles" aria-pressed="' + (sizeMode === 'reelles') + '">Tailles réelles</button></span></div>' +
      '<div class="atlas-scroll" tabindex="0" aria-label="Carte, défilement horizontal">' + svg + '</div>' +
      '<p class="note">Cliquez sur un objet pour le rejoindre dans l\'espace. ' + (sizeMode === 'reelles' ? 'À l\'échelle réelle, le Soleil est si grand qu\'on n\'en voit qu\'un bord, et les petites lunes ne sont plus que des points.' : 'Passez en « tailles réelles » pour voir les vraies proportions.') + '</p>';
    Array.prototype.forEach.call(root.querySelectorAll('[data-s]'), function (b) {
      b.addEventListener('click', function () { sizeMode = b.getAttribute('data-s'); try { localStorage.setItem('obs.atlas.tailles', sizeMode); } catch (e) {} carteSysteme(root); });
    });
  }

  /* un astre dessiné : carte réelle qui défile (rotation) ou couleur, ombré côté opposé au Soleil */
  function planet(d, cx, cy, r, defs) {
    var out = [], fill;
    if (d.tex && r >= 4) {
      var id = 'ap-' + d.id + '-' + Math.round(r * 10), w = r * 4;
      var days = rotPeriodDays(d), dur = Math.max(6, Math.min(90, 14 * Math.pow(days, .35))), retro = d.rot && d.rot.Wd < 0;
      var anim = reduced ? '' : '<animateTransform attributeName="patternTransform" type="translate" from="0 0" to="' + (retro ? w : -w) + ' 0" dur="' + dur.toFixed(1) + 's" repeatCount="indefinite"/>';
      defs.push('<pattern id="' + id + '" patternUnits="userSpaceOnUse" x="' + (cx - r) + '" y="' + (cy - r) + '" width="' + w + '" height="' + (r * 2) + '"><image href="textures/' + d.tex + '" width="' + w + '" height="' + (r * 2) + '" preserveAspectRatio="none"/>' + anim + '</pattern>');
      fill = 'url(#' + id + ')';
    } else {
      var gid = 'apc-' + d.id;
      if (!defs.some(function (x) { return x.indexOf('"' + gid + '"') >= 0; })) {
        var c = d.look && d.look.c ? d.look.c : [0x888888, 0xaaaaaa];
        defs.push('<radialGradient id="' + gid + '" cx="35%" cy="40%" r="70%"><stop offset="0" stop-color="' + hex(c[3] || c[1]) + '"/><stop offset=".5" stop-color="' + hex(c[1]) + '"/><stop offset="1" stop-color="' + hex(c[0]) + '"/></radialGradient>');
      }
      fill = 'url(#' + gid + ')';
    }
    var ring = d.ring && r >= 3, ringRx = ring ? r * d.ring.outer / d.rKm : 0, ringIn = ring ? r * d.ring.inner / d.rKm : 0;
    var vertical = d.id === 'uranus';                         // Uranus : axe couché, anneaux presque verticaux
    function ringPath(half) {
      // anneau = cercle épais aplati ; on dessine la moitié arrière avant la planète, la moitié avant après
      var cid = 'rc-' + d.id + '-' + half + '-' + Math.round(r * 10), R = ringRx + 2;
      var clip = vertical ? (half === 'back' ? [cx - R, cy - R, R, 2 * R] : [cx, cy - R, R, 2 * R]) : (half === 'back' ? [cx - R, cy - R, 2 * R, R] : [cx - R, cy, 2 * R, R]);
      defs.push('<clipPath id="' + cid + '"><rect x="' + clip[0] + '" y="' + clip[1] + '" width="' + clip[2] + '" height="' + clip[3] + '"/></clipPath>');
      var mid = (ringRx + ringIn) / 2, sw = ringRx - ringIn;
      var tf = vertical ? 'translate(' + cx + ' ' + cy + ') scale(.2 1) translate(' + (-cx) + ' ' + (-cy) + ')' : 'translate(' + cx + ' ' + cy + ') scale(1 .2) translate(' + (-cx) + ' ' + (-cy) + ')';
      return '<g clip-path="url(#' + cid + ')"><circle cx="' + cx + '" cy="' + cy + '" r="' + mid.toFixed(2) + '" transform="' + tf + '" class="at-ring' + (vertical ? ' faint' : '') + '" stroke-width="' + sw.toFixed(2) + '"/></g>';
    }
    out.push('<a href="#/explorer/' + d.id + '" class="ab"><title>' + esc(d.name) + '</title>');
    if (ring) out.push(ringPath('back'));
    if (d.stretch) out.push('<ellipse cx="' + cx + '" cy="' + cy + '" rx="' + (r * d.stretch[0]) + '" ry="' + (r * d.stretch[2]) + '" fill="' + fill + '"/>');
    else out.push('<circle cx="' + cx + '" cy="' + cy + '" r="' + r.toFixed(2) + '" fill="' + fill + '"/>');
    if (r >= 3) out.push('<circle cx="' + cx + '" cy="' + cy + '" r="' + r.toFixed(2) + '" fill="url(#ag-shade)"/>');
    if (ring) out.push(ringPath('front'));
    if (r < 2.5) out.push('<circle cx="' + cx + '" cy="' + cy + '" r="5" class="at-tiny"/>');   // repère autour d'un objet minuscule
    out.push('</a>');
    return out.join('');
  }

  /* ---------------- carte du voisinage : une règle à l'échelle réelle ---------------- */
  function carteVoisinage(root) {
    var stars = OBS.STARS.slice().sort(function (a, b) { return a.ly - b.ly; });
    var W = 1100, L0 = 50, L1 = W - 40, AX = 250, k = (L1 - L0) / 12, H = 500, out = [];
    for (var t = 0; t <= 12; t++) {
      var tx = L0 + t * k;
      out.push('<line x1="' + tx + '" y1="' + (AX - (t % 2 ? 5 : 9)) + '" x2="' + tx + '" y2="' + (AX + (t % 2 ? 5 : 9)) + '" class="at-tick"/>');
      if (!(t % 2)) out.push('<text x="' + tx + '" y="' + (AX + 26) + '" class="at-d" text-anchor="middle">' + t + ' al</text>');
    }
    out.push('<a href="#/explorer/soleil" class="ab"><circle cx="' + L0 + '" cy="' + AX + '" r="9" fill="#ffd27a"/><text x="' + L0 + '" y="' + (AX - 20) + '" class="at-n at-sun" text-anchor="middle">Soleil</text></a>');
    var lanes = [-1, 1, -2, 2, -3, 3, -4, 4, -5, 5], lastX = {};
    stars.forEach(function (s, i) {
      var sx = L0 + s.ly * k, col = hex(OBS.STAR_COLORS[s.cls] || 0xffffff), r = s.cls === 'BD' ? 3 : 3 + 3.5 * Math.pow(Math.min(s.lum, 30), .2);
      var lane = 0;
      for (var li = 0; li < lanes.length; li++) { var ln = lanes[li]; if (lastX[ln] === undefined || sx - lastX[ln] > 150) { lane = ln; break; } }
      if (!lane) lane = lanes[i % lanes.length];
      lastX[lane] = sx;
      var ly = AX + lane * 42 - (lane > 0 ? -8 : 8);
      out.push('<line x1="' + sx + '" y1="' + AX + '" x2="' + sx + '" y2="' + ly + '" class="at-stem"/>');
      out.push('<a href="#/etoile/' + s.id + '" class="ab"><title>' + esc(s.name + ' — ' + nf(s.ly, 2) + ' al') + '</title><circle cx="' + sx + '" cy="' + AX + '" r="' + r.toFixed(1) + '" fill="' + col + '" class="at-star"/>' +
        '<text x="' + sx + '" y="' + (ly + (lane > 0 ? 12 : -4)) + '" class="at-m" text-anchor="middle">' + esc(s.name) + '</text></a>');
    });
    var svg = '<svg class="atlas-map" viewBox="0 0 ' + W + ' ' + H + '" width="' + W + '" height="' + H + '" role="img" aria-label="Distances des étoiles voisines">' +
      '<line x1="' + L0 + '" y1="' + AX + '" x2="' + L1 + '" y2="' + AX + '" class="at-axis strong"/>' + out.join('') + '</svg>';
    root.innerHTML = '<div class="c-flags atlas-flags">' +
      '<span class="flag f-real" title="Réel — distances mesurées, à l\'échelle"><i>Distances</i>réelles</span>' +
      '<span class="flag f-adapt" title="Adapté — toutes les étoiles sont ramenées sur une seule ligne : leur direction dans le ciel n\'est pas représentée"><i>Directions</i>non représentées</span>' +
      '<span class="flag f-adapt" title="Adapté — la taille des points dépend de la luminosité"><i>Tailles</i>symboliques</span></div>' +
      '<div class="atlas-scroll" tabindex="0">' + svg + '</div>' +
      '<p class="note">À cette échelle, tout le système solaire jusqu\'à Neptune tiendrait dans moins d\'un dixième de pixel autour du Soleil. Cliquez sur une étoile pour visiter son système.</p>';
  }
})();

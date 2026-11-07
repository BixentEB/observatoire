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
    { id: 'galaxie', label: 'Voie lactée' },
    { id: 'groupe-local', label: 'Groupe local' },
    { id: 'visiteurs', label: 'Visiteurs', theme: true, title: 'Les visiteurs du système solaire' },
    { id: 'types', label: 'Types d\'objets', theme: true, title: 'Les types d\'objets' },
    { id: 'echelles', label: 'Échelles', theme: true, title: 'De l\'atome à l\'Univers' }
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
    var S = SCOPES.filter(function (s) { return s.id === scope; })[0], sub = view;
    view = view === 'liste' || view === 'unites' ? view : 'carte';
    var h = [];
    h.push('<p class="p-kicker">Atlas</p><h1>' + esc(S.title || S.label) + '</h1>');
    var tab = function (s) { return '<a role="tab" class="tab' + (s.theme ? ' tab-theme' : '') + '" href="#/atlas/' + s.id + (s.theme ? '' : '/' + view) + '" aria-selected="' + (s.id === scope) + '">' + esc(s.label) + '</a>'; };
    h.push('<div class="tabs" role="tablist" aria-label="Portée">' + SCOPES.filter(function (s) { return !s.theme; }).map(tab).join('') +
      '<span class="tabs-gap"></span>' + SCOPES.filter(function (s) { return s.theme; }).map(tab).join('') +
      (S.theme ? '' : '<span class="tabs-sep"></span>' +
      '<a class="tab tab-view" href="#/atlas/' + scope + '/carte" aria-selected="' + (view === 'carte') + '">Carte</a>' +
      '<a class="tab tab-view" href="#/atlas/' + scope + '/liste" aria-selected="' + (view === 'liste') + '">Liste</a>' +
      '<a class="tab tab-view" href="#/atlas/' + scope + '/unites" aria-selected="' + (view === 'unites') + '">Unités</a>') + '</div>');
    h.push('<div id="atlas-body"></div>');
    root.innerHTML = h.join('');
    var body = root.querySelector('#atlas-body');
    if (scope === 'visiteurs') return visiteurs(body, sub);
    if (scope === 'types') return types(body, sub);
    if (scope === 'echelles') return echelles(body);
    if (view === 'unites') return unites(body);
    if (scope === 'galaxie') return view === 'liste' ? galaxie(body) : carteGalaxie(body);
    if (scope === 'groupe-local') return view === 'liste' ? groupeLocal(body) : carteGroupeLocal(body);
    if (view === 'liste') return scope === 'voisinage' ? listeVoisinage(body) : listeSysteme(body);
    return scope === 'voisinage' ? carteVoisinage(body) : carteSysteme(body);
  };

  /* ---------------- listes ---------------- */
  function card(href, color, name, sub) {
    return '<a class="obj" href="' + href + '"><i style="background:' + color + ';box-shadow:0 0 10px ' + color + '"></i><span><b>' + esc(name) + '</b><small>' + esc(sub) + '</small></span></a>';
  }
  function grid(list) { return '<div class="grid-list">' + list.join('') + '</div>'; }
  function section(kind, title, sub, cards) { return cards.length ? '<section class="cat-sec">' + OBS.band(kind, title, sub, cards.length) + grid(cards) + '</section>' : ''; }
  function listeSysteme(root) {
    var B = OBS.BODIES, h = [], cb = function (b) { return card('#/explorer/' + b.id, colorOf(b), b.name, b.kind); };
    h.push(section('etoile', 'Étoile', 'Le Soleil : 99,86 % de la masse du système solaire.', B.filter(function (b) { return b.id === 'soleil'; }).map(cb)));
    h.push(section('planete', 'Planètes', 'Quatre rocheuses près du Soleil, quatre géantes au-delà.', B.filter(function (b) { return b.parent === 'soleil' && !b.dwarf && !b.comet && !b.moon && !b.minor; }).map(cb)));
    h.push(section('naines', 'Planètes naines', 'Arrondies, mais elles partagent leur orbite avec d\'autres corps.', B.filter(function (b) { return b.dwarf; }).map(cb)));
    var parents = []; B.forEach(function (b) { if (b.moon && parents.indexOf(b.parent) < 0) parents.push(b.parent); });
    parents.forEach(function (p) { h.push(section('lune', 'Lunes de ' + OBS.byId[p].name, null, B.filter(function (b) { return b.moon && b.parent === p; }).map(cb))); });
    h.push(section('comete', 'Comète', 'Des blocs de glace venus des confins, qui s\'allument près du Soleil.', B.filter(function (b) { return b.comet; }).map(cb)));
    h.push(section('asteroide', 'Petits corps', 'Les débris de la formation des planètes.', B.filter(function (b) { return b.minor; }).map(cb)));
    h.push(section('region', 'Régions', 'Ceintures et grandes zones du système solaire.', OBS.REGIONS.filter(function (r) { return !r.theorique; }).map(cb)));
    h.push(section('hypo', '<span style="color:var(--sci)">Objets hypothétiques</span>', 'Proposés par des chercheurs, jamais observés.', OBS.REGIONS.filter(function (r) { return r.theorique; }).map(cb)));
    root.innerHTML = h.join('');
  }
  function listeVoisinage(root) {
    var stars = OBS.STARS.slice().sort(function (a, b) { return a.ly - b.ly; }), cs = function (s) { return card('#/etoile/' + s.id, hex(OBS.STAR_COLORS[s.cls] || 0xffffff), s.name, s.spec + ' · ' + nf(s.ly, 2) + ' al'); };
    var by = function (f) { return stars.filter(f).map(cs); };
    root.innerHTML = '<p>Les étoiles et naines brunes à moins de 12 années-lumière, de la plus proche à la plus lointaine, par famille.</p>' +
      section('etoile', 'Étoiles comme le Soleil, ou plus chaudes', 'Naines jaunes et étoiles blanches : rares, mais les plus brillantes du voisinage.', by(function (s) { return 'OBAFG'.indexOf(s.cls) >= 0; })) +
      section('etoile', 'Naines orange', 'Un peu plus petites que le Soleil, et plus durables.', by(function (s) { return s.cls === 'K'; })) +
      section('naine', 'Naines rouges', 'Les étoiles les plus nombreuses : aucune n\'est visible à l\'œil nu.', by(function (s) { return s.cls === 'M'; })) +
      section('naine', 'Naines brunes', 'Ni tout à fait étoiles, ni planètes.', by(function (s) { return s.cls === 'BD'; }));
  }
  function galaxie(root) {
    var objs = OBS.GALAXY_OBJECTS.slice().sort(function (a, b) { return a.ly - b.ly; }), co = function (o) { return card('#/galaxie/' + o.id, o.sun ? '#ffd27a' : '#bfe0ff', o.name, o.kind + (o.ly ? ' · ' + nf(o.ly) + ' al' : '')); };
    var is = function (re) { return function (o) { return re.test(o.kind); }; };
    root.innerHTML = '<p>Personne n\'a jamais vu notre galaxie de l\'extérieur : sa forme est reconstituée d\'après les mesures. Les repères ci-dessous sont, eux, à leurs positions mesurées.</p>' +
      section('etoile', 'Étoiles remarquables', null, objs.filter(function (o) { return /[ÉE]toile/.test(o.kind) && !/Pouponni/.test(o.kind); }).map(co)) +
      section('nebuleuse', 'Nébuleuses', 'Pouponnières d\'étoiles et restes d\'explosions.', objs.filter(is(/Pouponni|supernova/)).map(co)) +
      section('amas', 'Amas d\'étoiles', null, objs.filter(is(/Amas/)).map(co)) +
      section('compact', 'Trous noirs', null, objs.filter(is(/Trou noir/)).map(co)) +
      section('galaxie', 'Galaxies satellites', 'Des petites galaxies en orbite autour de la nôtre.', objs.filter(is(/Galaxie/)).map(co)) +
      section('exo', 'Systèmes d\'exoplanètes', 'Des étoiles dont on connaît des planètes, à visiter.', (OBS.EXOSYS || []).slice().sort(function (a, b) { return a.ly - b.ly; }).map(function (x) { return card('#/galaxie/' + x.id, '#9fe3b0', x.name, x.kind + ' · ' + nf(x.ly) + ' al'); })) +
      section('bras', 'Bras spiraux', 'Des zones plus denses du disque, où naissent les étoiles.', OBS.GALAXY.arms.map(function (A) { return card('#/galaxie/' + A.id, '#9aa6d8', A.name, 'Bras spiral · ' + (A.alias || '')); }));
  }

  function groupeLocal(root) {
    var gs = OBS.LOCALGROUP.slice().sort(function (a, b) { return a.ly - b.ly; });
    var cg = function (g) { return card('#/groupe-local/' + g.id, g.home ? '#ffd27a' : '#c9d8ff', g.name, g.kind + (g.ly ? ' · ' + (g.ly >= 1e6 ? nf(g.ly / 1e6, 2) + ' millions d\'al' : nf(g.ly) + ' al') : '')); };
    var by = function (f) { return gs.filter(function (g) { return g.form === f; }).map(cg); };
    root.innerHTML = '<p>Les galaxies du Groupe local par forme, de la plus proche à la plus lointaine.</p>' +
      section('galaxie', 'Spirales', 'Les trois grandes : la Voie lactée, Andromède et le Triangle.', by('spirale')) +
      section('amas', 'Elliptiques', 'Des ballons d\'étoiles anciennes, presque sans gaz.', by('elliptique')) +
      section('nebuleuse', 'Irrégulières', 'Sans forme définie, riches en gaz, elles forment encore des étoiles.', by('irreguliere')) +
      section('vide', 'Sphéroïdales naines', 'Très pâles, faites surtout de matière noire.', by('spheroidale'));
  }

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
        return '<div class="unit"><div class="unit-head"><h3>' + esc(x.n) + '</h3><span class="unit-sym">' + esc(x.u) + '</span></div><p class="unit-v">' + esc(x.v) + '</p><p>' + esc(x.ex) + '</p><p class="unit-use">' + esc(x.use) + '</p></div>';
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
      { region: 'kuiper', members: ['pluton', 'haumea', 'makemake', 'arrokoth'] },
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

  /* ---------------- règle commune : un axe (linéaire ou logarithmique), des points, des étiquettes en couloirs ----------------
     items : { v (valeur), name, href, color, r, title, sub } ; o : { min, max, log, ticks [[valeur, texte]], origin {name, href, color}, W, label } */
  function ruler(items, o) {
    var W = o.W || 1100, L0 = 50, L1 = W - 40, lanesMax = o.lanes || 7, LH = 40, out = [], pos;
    if (o.log) { var a0 = Math.log10(o.min), a1 = Math.log10(o.max); pos = function (v) { return L0 + (Math.log10(Math.max(v, o.min)) - a0) / (a1 - a0) * (L1 - L0); }; }
    else pos = function (v) { return L0 + (v - o.min) / (o.max - o.min) * (L1 - L0); };
    var placed = [], lastEnd = {}, order = [];
    for (var i = 1; i <= lanesMax; i++) order.push(-i, i);
    items.slice().sort(function (p, q) { return p.v - q.v; }).forEach(function (it, k) {
      var sx = pos(it.v), w = it.name.length * 6.3 + 14, lane = 0;
      for (var li = 0; li < order.length; li++) { var ln = order[li]; if (lastEnd[ln] === undefined || lastEnd[ln] < sx - w / 2) { lane = ln; break; } }
      if (!lane) lane = order[k % order.length];
      lastEnd[lane] = sx + w / 2;
      placed.push({ it: it, sx: sx, lane: lane });
    });
    var up = 1, down = 1; placed.forEach(function (p) { if (p.lane < 0) up = Math.max(up, -p.lane); else down = Math.max(down, p.lane); });
    var AX = 40 + up * LH + 10, H = AX + down * LH + 50;
    (o.ticks || []).forEach(function (t, i) {
      var tx = pos(t[0]);
      out.push('<line x1="' + tx.toFixed(1) + '" y1="' + (AX - (t[2] ? 5 : 9)) + '" x2="' + tx.toFixed(1) + '" y2="' + (AX + (t[2] ? 5 : 9)) + '" class="at-tick"/>');
      if (t[1]) out.push('<text x="' + tx.toFixed(1) + '" y="' + (AX + 26) + '" class="at-d" text-anchor="middle">' + t[1] + '</text>');
    });
    if (o.origin) out.push('<a href="' + o.origin.href + '" class="ab"><circle cx="' + L0 + '" cy="' + AX + '" r="9" fill="' + (o.origin.color || '#ffd27a') + '"/><text x="' + L0 + '" y="' + (AX - 20) + '" class="at-n at-sun" text-anchor="middle">' + esc(o.origin.name) + '</text></a>');
    placed.forEach(function (p) {
      var it = p.it, ly = AX + p.lane * LH - (p.lane > 0 ? -8 : 8), tx = Math.max(L0 + 10, Math.min(L1 + 20, p.sx));
      out.push('<line x1="' + p.sx.toFixed(1) + '" y1="' + AX + '" x2="' + p.sx.toFixed(1) + '" y2="' + ly + '" class="at-stem"/>');
      out.push('<a href="' + it.href + '" class="ab"><title>' + esc(it.title || it.name) + '</title><circle cx="' + p.sx.toFixed(1) + '" cy="' + AX + '" r="' + (it.r || 4).toFixed(1) + '" fill="' + (it.color || '#cfd6f0') + '" class="at-star"/>' +
        '<text x="' + tx.toFixed(1) + '" y="' + (ly + (p.lane > 0 ? 12 : -4)) + '" class="at-m' + (it.cls ? ' ' + it.cls : '') + '" text-anchor="middle">' + esc(it.name) + '</text></a>');
    });
    return '<svg class="atlas-map" viewBox="0 0 ' + W + ' ' + H + '" width="' + W + '" height="' + H + '" role="img" aria-label="' + esc(o.label || 'Carte') + '">' +
      '<line x1="' + L0 + '" y1="' + AX + '" x2="' + L1 + '" y2="' + AX + '" class="at-axis strong"/>' + out.join('') + '</svg>';
  }
  function flags(list) { return '<div class="c-flags atlas-flags">' + list.map(function (f) { return '<span class="flag f-' + f[0] + '" title="' + esc(f[3]) + '"><i>' + f[1] + '</i>' + f[2] + '</span>'; }).join('') + '</div>'; }
  function logTicks(minExp, maxExp, fmt) {
    var t = [];
    for (var e = minExp; e <= maxExp; e++) { t.push([Math.pow(10, e), fmt(e)]); if (e < maxExp) for (var m = 2; m < 10; m++) t.push([m * Math.pow(10, e), '', 1]); }
    return t;
  }
  function lyTxt(v) { return v >= 1e6 ? nf(v / 1e6, v >= 1e7 ? 0 : 1) + ' M al' : v >= 1000 ? nf(v / 1000) + ' 000 al' : nf(v) + ' al'; }

  /* ---------------- carte du voisinage : une règle à l'échelle réelle ---------------- */
  function carteVoisinage(root) {
    var ticks = []; for (var t = 0; t <= 12; t++) ticks.push([t, t % 2 ? '' : t + ' al', t % 2]);
    var items = OBS.STARS.map(function (s) {
      return { v: s.ly, name: s.name, href: '#/etoile/' + s.id, color: hex(OBS.STAR_COLORS[s.cls] || 0xffffff), r: s.cls === 'BD' ? 3 : 3 + 3.5 * Math.pow(Math.min(s.lum, 30), .2), title: s.name + ' — ' + nf(s.ly, 2) + ' al' };
    });
    root.innerHTML = flags([['real', 'Distances', 'réelles', 'Réel — distances mesurées, à l\'échelle'], ['adapt', 'Directions', 'non représentées', 'Adapté — toutes les étoiles sont ramenées sur une seule ligne : leur direction dans le ciel n\'est pas représentée'], ['adapt', 'Tailles', 'symboliques', 'Adapté — la taille des points dépend de la luminosité']]) +
      '<div class="atlas-scroll" tabindex="0">' + ruler(items, { min: 0, max: 12, ticks: ticks, origin: { name: 'Soleil', href: '#/explorer/soleil' }, label: 'Distances des étoiles voisines', lanes: 5 }) + '</div>' +
      '<p class="note">À cette échelle, tout le système solaire jusqu\'à Neptune tiendrait dans moins d\'un dixième de pixel autour du Soleil. Cliquez sur une étoile pour visiter son système.</p>';
  }

  /* ---------------- carte de la Voie lactée : distances au Soleil, échelle logarithmique ---------------- */
  function carteGalaxie(root) {
    var items = OBS.GALAXY_OBJECTS.filter(function (o) { return !o.sun && o.ly; }).map(function (o) {
      return { v: o.ly, name: o.name, href: '#/galaxie/' + o.id, color: '#bfe0ff', r: 4.5, title: o.name + ' — ' + o.kind + ' — ' + nf(o.ly) + ' al' };
    }).concat((OBS.EXOSYS || []).map(function (x) {
      return { v: x.ly, name: x.name, href: '#/galaxie/' + x.id, color: '#9fe3b0', r: 3.5, cls: 'at-exo', title: x.name + ' — système planétaire — ' + nf(x.ly) + ' al' };
    }));
    root.innerHTML = flags([['real', 'Distances', 'mesurées', 'Réel — distances au Soleil mesurées (valeurs arrondies)'], ['adapt', 'Échelle', 'logarithmique', 'Adapté — chaque graduation principale multiplie la distance par 10 : sinon, tout le voisinage tiendrait dans un point'], ['adapt', 'Directions', 'non représentées', 'Adapté — tout est ramené sur une seule ligne']]) +
      '<div class="atlas-scroll" tabindex="0">' + ruler(items, { min: 10, max: 300000, log: true, W: 1500, ticks: logTicks(1, 5, function (e) { return lyTxt(Math.pow(10, e)); }).concat([[300000, '']]), origin: { name: 'Soleil', href: '#/galaxie/soleil-g' }, label: 'Distances des repères de la Voie lactée' }) + '</div>' +
      '<p class="note"><span class="at-key"><i style="background:#bfe0ff"></i>repères de la Voie lactée</span> <span class="at-key"><i style="background:#9fe3b0"></i>systèmes d\'exoplanètes</span> Échelle logarithmique : de 10 à 100 années-lumière il y a autant de place que de 10 000 à 100 000. La Voie lactée mesure environ 100 000 années-lumière de diamètre ; les Nuages de Magellan sont déjà en dehors.</p>';
  }

  /* ---------------- carte du Groupe local : distances au Soleil, échelle logarithmique ---------------- */
  function carteGroupeLocal(root) {
    var items = OBS.LOCALGROUP.filter(function (g) { return !g.home; }).map(function (g) {
      return { v: g.ly, name: g.name, href: '#/groupe-local/' + g.id, color: g.form === 'spirale' ? '#c9d8ff' : '#9aa6cc', r: g.form === 'spirale' ? 6 : g.minor ? 3 : 4, cls: g.form === 'spirale' ? 'at-big' : '', title: g.name + ' — ' + g.kind + ' — ' + lyTxt(g.ly) };
    });
    root.innerHTML = flags([['real', 'Distances', 'mesurées', 'Réel — distances au Soleil mesurées (valeurs arrondies)'], ['adapt', 'Échelle', 'logarithmique', 'Adapté — chaque graduation principale multiplie la distance par 10'], ['adapt', 'Directions', 'non représentées', 'Adapté — tout est ramené sur une seule ligne']]) +
      '<div class="atlas-scroll" tabindex="0">' + ruler(items, { min: 30000, max: 6000000, log: true, W: 1900, lanes: 7, ticks: logTicks(5, 6, function (e) { return lyTxt(Math.pow(10, e)); }).concat([[30000, '30 000 al'], [5000000, '5 M al']]), origin: { name: 'Voie lactée', href: '#/groupe-local/voielactee' }, label: 'Distances des galaxies du Groupe local' }) + '</div>' +
      '<p class="note">Les satellites de la Voie lactée sont à quelques centaines de milliers d\'années-lumière ; ceux d\'Andromède se pressent autour de 2,5 millions ; au-delà de 4 millions, les naines du bord du Groupe local. Cliquez sur une galaxie pour la rejoindre.</p>';
  }

  function traits(list) { return '<dl class="t-traits">' + list.map(function (f) { return '<div><dt>' + esc(f[0]) + '</dt><dd>' + esc(f[1]) + '</dd></div>'; }).join('') + '</dl>'; }

  /* ---------------- visiteurs du système solaire ---------------- */
  function today() { var d = new Date(); return new Date(d.getFullYear(), d.getMonth(), d.getDate()); }
  function parseD(t) { var p = t.split('-'); return new Date(+p[0], +p[1] - 1, +p[2]); }
  function rel(d) {
    var n = today(), days = Math.round((d - n) / 864e5), a = Math.abs(days), y = a / 365.25, txt;
    if (days === 0) return 'aujourd\'hui';
    txt = a < 45 ? a + ' jour' + (a > 1 ? 's' : '') : a < 700 ? Math.round(a / 30.44) + ' mois' : nf(Math.floor(y)) + ' ans';
    return (days > 0 ? 'dans ' : 'il y a ') + txt;
  }
  function dateFr(d) { return d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' }); }
  function wiki(t) { return 'https://fr.wikipedia.org/w/index.php?search=' + encodeURIComponent(t); }
  function nextYearly(md) { var n = today(), p = md.split('-'), d = new Date(n.getFullYear(), +p[0] - 1, +p[1]); if (d < n) d.setFullYear(d.getFullYear() + 1); return d; }
  function visitorCard(v) {
    var h = '<article class="v-card" id="v-' + v.id + '"><p class="c-kind">' + esc(v.kind) + '</p><h3>' + esc(v.name) + (v.des && v.des !== v.name ? ' <small>' + esc(v.des) + '</small>' : '') + '</h3>';
    if (v.yearly) { var nd = nextYearly(v.yearly); h += '<ul class="v-dates"><li class="fut"><b>' + dateFr(nd) + '</b><span>prochain maximum · ' + rel(nd) + '</span></li></ul>'; }
    else h += '<ul class="v-dates">' + v.dates.map(function (d) { var dd = parseD(d[0]), fut = dd >= today(); return '<li class="' + (fut ? 'fut' : 'past') + '"><b>' + dateFr(dd) + '</b><span>' + esc(d[1]) + ' · ' + rel(dd) + '</span></li>'; }).join('') + '</ul>';
    h += '<p>' + esc(v.text) + '</p>';
    if (v.facts && v.facts.length) h += traits(v.facts);
    h += '<div class="lx-links">' + (v.obs ? '<a class="chip chip-go" href="' + v.obs[0] + '">' + esc(v.obs[1]) + ' ›</a>' : '') +
      (v.hypo ? '<a class="chip chip-sci" href="#/hypotheses/chercheurs/' + v.hypo + '">Hypothèse liée</a>' : '') +
      (v.wiki ? '<a class="chip" href="' + wiki(v.wiki) + '" target="_blank" rel="noopener">Photos et détails (Wikipédia) ↗</a>' : '') + '</div></article>';
    return h;
  }
  function visiteurs(root, cat) {
    var cats = OBS.VISITOR_CATS, V = OBS.VISITORS;
    if (!cats.some(function (c) { return c[0] === cat; })) cat = null;
    // frise des passages : chaque date connue entre 1985 et 2065
    var ev = [], y0 = 1985, y1 = 2066;
    V.forEach(function (v) { (v.dates || []).filter(function (d, i) { return (v.frise || [0]).indexOf(i) >= 0; }).forEach(function (d) { var dd = parseD(d[0]), yf = dd.getFullYear() + (dd - new Date(dd.getFullYear(), 0, 1)) / 31557600000; if (yf >= y0 && yf <= y1) ev.push({ v: yf, name: v.name, href: '#/atlas/visiteurs/' + v.cat, color: dd >= today() ? '#f4c77a' : '#8f96b8', r: 4, title: v.name + ' — ' + dateFr(dd) + ' — ' + d[1] }); }); });
    var now = today(), nowY = now.getFullYear() + (now - new Date(now.getFullYear(), 0, 1)) / 31557600000;
    ev.push({ v: nowY, name: 'Aujourd\'hui', href: '#/atlas/visiteurs', color: '#9fe3b0', r: 6, cls: 'at-big' });
    var ticks = []; for (var y = y0; y <= y1; y += 5) ticks.push([y, y % 10 ? '' : String(y), y % 10 ? 1 : 0]);
    var list = (cat ? cats.filter(function (c) { return c[0] === cat; }) : cats).map(function (c) {
      var L = V.filter(function (v) { return v.cat === c[0]; });
      return '<section class="cat-sec">' + OBS.band({ interstellaire: 'interstellaire', periodique: 'comete', grande: 'comete', geocroiseur: 'asteroide', pluie: 'pluie' }[c[0]], esc(c[1]), c[2], L.length) + '<div class="v-grid">' + L.map(visitorCard).join('') + '</div></section>';
    }).join('');
    root.innerHTML = '<p class="lead">Comètes venues d\'ailleurs, retours attendus, astéroïdes qui frôlent la Terre et rendez-vous annuels avec les étoiles filantes. Les durées sont calculées par rapport à aujourd\'hui.</p>' +
      '<h2 class="v-h">Frise des passages</h2><div class="atlas-scroll" tabindex="0">' + ruler(ev, { min: y0, max: y1, W: 1500, lanes: 4, ticks: ticks, label: 'Frise des passages' }) + '</div>' +
      '<p class="note"><span class="at-key"><i style="background:#8f96b8"></i>passé</span><span class="at-key"><i style="background:#f4c77a"></i>à venir</span>Dates du JPL (NASA) et de l\'ESA. Le prochain retour de la comète de Halley, en 2061, est au bout de la frise.</p>' +
      '<div class="v-filter">' + '<a class="chip' + (!cat ? ' on' : '') + '" href="#/atlas/visiteurs">Tous</a>' + cats.map(function (c) { return '<a class="chip' + (cat === c[0] ? ' on' : '') + '" href="#/atlas/visiteurs/' + c[0] + '">' + esc(c[1]) + '</a>'; }).join('') + '</div>' + list +
      '<p class="note">Les photos ne sont pas hébergées ici : chaque fiche renvoie vers Wikipédia, qui rassemble les images de la NASA, de l\'ESA et des observatoires avec leurs crédits.</p>';
  }

  /* ---------------- types d'objets ---------------- */
  function types(root, fam) {
    var F = OBS.TYPE_FAMILIES, lexHref = function (t) { var e = (OBS.LEXIQUE || []).filter(function (x) { return x.t === t; })[0]; return e ? '#/lexique/' + e.tab + '/' + OBS.lexSlug(e.t) : null; };
    var nav = '<div class="v-filter"><a class="chip' + (!fam ? ' on' : '') + '" href="#/atlas/types">Tous</a>' + F.map(function (f) { return '<a class="chip' + (fam === f[0] ? ' on' : '') + '" href="#/atlas/types/' + f[0] + '">' + esc(f[1]) + '</a>'; }).join('') +
      '<a class="chip' + (fam === 'cycles' ? ' on' : '') + '" href="#/atlas/types/cycles">Cycles de formation</a></div>';
    var secs = (fam === 'cycles' ? [] : F.filter(function (f) { return !fam || f[0] === fam; })).map(function (f) {
      var L = OBS.TYPES.filter(function (t) { return t.fam === f[0]; });
      return '<section class="cat-sec">' + OBS.band({ etoiles: 'etoile', compacts: 'compact', planetes: 'planete', petits: 'asteroide', nuages: 'nebuleuse', galaxies: 'galaxie', non: 'vide' }[f[0]], esc(f[1]), f[2], L.length) + '<div class="v-grid t-grid">' + L.map(function (t) {
        var lh = t.lex && lexHref(t.lex);
        return '<article class="v-card t-card"><h3>' + esc(t.name) + '</h3>' + (t.note ? '<p class="t-note">' + esc(t.note) + '</p>' : '') +
          traits(t.traits) +
          '<div class="lx-links">' + t.ex.map(function (e) { return '<a class="chip chip-go" href="' + e[0] + '">' + esc(e[1]) + '</a>'; }).join('') + (lh ? '<a class="chip" href="' + lh + '">Définition</a>' : '') + '</div></article>';
      }).join('') + '</div></section>';
    }).join('');
    var cyc = (!fam || fam === 'cycles') ? '<section class="cat-sec" id="cycles">' + OBS.band('nebuleuse', 'Cycles de formation', 'Comment naissent et évoluent les étoiles, les planètes et les galaxies.', null) + flags([['sim', 'Schéma', 'simplifié', 'Simulé — étapes résumées, durées non représentées ; les exemples, eux, sont réels']]) + OBS.CYCLES.map(cycle).join('') + '</section>' : '';
    root.innerHTML = '<p class="lead">Les grandes familles d\'objets de l\'Univers, avec leurs caractéristiques typiques et des exemples à visiter dans l\'Observatoire. Les définitions détaillées sont dans le <a href="#/lexique">Lexique</a>.</p>' + nav + secs + cyc;
  }
  function stepHtml(st, i) {
    return '<div class="cy-step" style="--i:' + i + '"><b>' + esc(st[0]) + '</b>' + (st[1] ? '<a href="' + st[1] + '">' + esc(st[2]) + ' ›</a>' : '') + '</div>';
  }
  function cycle(c) {
    var n = c.start.length, h = '<div class="cy"><h3>' + esc(c.title) + '</h3><p>' + esc(c.intro) + '</p><div class="cy-flow">' +
      c.start.map(function (st, i) { return (i ? '<span class="cy-arrow" style="--i:' + i + '" aria-hidden="true"></span>' : '') + stepHtml(st, i); }).join('') + '</div>';
    if (c.branches) h += '<div class="cy-branches">' + c.branches.map(function (b, bi) {
      return '<div class="cy-branch b' + bi + '"><p class="cy-label">' + esc(b.label) + '</p><div class="cy-flow">' + b.steps.map(function (st, i) { return '<span class="cy-arrow" style="--i:' + (n + i) + '" aria-hidden="true"></span>' + stepHtml(st, n + i); }).join('') + '</div></div>';
    }).join('') + '</div>';
    return h + '<p class="note">' + esc(c.note) + '</p></div>';
  }

  /* ---------------- de l'atome à l'Univers ---------------- */
  var SUP = { '-': '⁻', 0: '⁰', 1: '¹', 2: '²', 3: '³', 4: '⁴', 5: '⁵', 6: '⁶', 7: '⁷', 8: '⁸', 9: '⁹' };
  function pow10(e) { return '10' + String(e).split('').map(function (c) { return SUP[c]; }).join('') + ' m'; }
  function sizeTxt(m) {
    if (m >= 9.46e15) return nf(m / 9.46e15, m < 9.46e16 ? 1 : 0) + ' al';
    if (m >= 1e9) return nf(m / 1e3 / 1e6, 0) + ' millions de km';
    var f = function (v, u) { return nf(v, v < 10 && v % 1 ? 1 : 0) + ' ' + u; };
    if (m >= 1e3) return f(m / 1e3, 'km');
    if (m >= 1) return f(m, 'm');
    if (m >= 1e-3) return f(m * 1e3, 'mm');
    if (m >= 1e-6) return f(m * 1e6, 'µm');
    if (m >= 1e-9) return f(m * 1e9, 'nm');
    return pow10(Math.round(Math.log10(m)));
  }
  function echelles(root) {
    var S = OBS.SCALES, ticks = [];
    for (var e = -15; e <= 27; e++) ticks.push([Math.pow(10, e), e % 3 ? '' : pow10(e), e % 3 ? 1 : 0]);
    var items = S.map(function (x, i) { return { v: x.m, name: x.name, href: x.go ? x.go[0] : '#/atlas/echelles', color: x.m < 1e-3 ? '#9fe3b0' : x.m < 1e7 ? '#f4c77a' : x.m < 1e13 ? '#ffb23e' : x.m < 1e19 ? '#bfe0ff' : '#c9b8ff', r: 4.5, title: x.name + ' — ' + sizeTxt(x.m) }; });
    root.innerHTML = flags([['real', 'Tailles', 'réelles', 'Réel — ordres de grandeur publiés, arrondis'], ['adapt', 'Échelle', 'logarithmique', 'Adapté — chaque graduation multiplie la taille par 10 : 42 puissances de dix séparent un proton de l\'Univers observable']]) +
      '<p class="lead">Du cœur d\'un atome à l\'Univers observable, chaque graduation multiplie la taille par dix. Faites défiler de gauche à droite, et cliquez sur un repère pour le retrouver dans l\'Observatoire ou le Lexique.</p>' +
      '<div class="atlas-scroll" tabindex="0">' + ruler(items, { min: 1e-15, max: 1e27, log: true, W: 2600, lanes: 5, ticks: ticks, label: 'Échelle des tailles, de l\'atome à l\'Univers' }) + '</div>' +
      '<p class="note">L\'être humain est à peu près au milieu : il y a autant de puissances de dix entre un atome et nous qu\'entre nous et une étoile géante.</p>' +
      '<div class="v-grid sc-grid">' + S.map(function (x) {
        return '<article class="v-card sc-card"><p class="c-kind">' + sizeTxt(x.m) + '</p><h3>' + esc(x.name) + '</h3><p>' + esc(x.d) + '</p>' + (x.go ? '<div class="lx-links"><a class="chip chip-go" href="' + x.go[0] + '">' + esc(x.go[1]) + ' ›</a></div>' : '') + '</article>';
      }).join('') + '</div>';
  }
})();

/* ======================================================================
   OBSERVATOIRE — règle des échelles de l'Atlas + zoom des cartes
   8 niveaux, du Système solaire à l'Univers observable.
   - Ordinateur : panneau à gauche de la carte, ouvert par défaut (vignettes, étendue, recherche),
     repliable en fine règle numérotée ; + et − changent de niveau. L'état replié est mémorisé.
   - Téléphone (≤ 760 px) : barre « − niveau + » collée au-dessus de la carte ; un appui sur le niveau
     déplie la même liste.
   « à venir » n'est jamais écrit à la main : un niveau est disponible dès que l'Atlas sait l'afficher
   (son id figure dans OBS.ATLAS_SCOPES), la mention disparaît alors d'elle-même.
   OBS.armPinch(root) : zoom des cartes .atlas-scroll : boutons − % + ⤢ en coin (clic sur % = taille normale),
   pincement à deux doigts, double toucher, Ctrl + molette ou pincement du pavé tactile.
   ====================================================================== */
(function () {
  'use strict';
  var OBS = window.OBS = window.OBS || {}, esc = OBS.esc;
  var LV = OBS.SCALE_LEVELS = [
    { id: 'systeme', n: 'Système solaire', r: 'jusqu\'à ≈ 120 UA', s: 'Le Soleil, les planètes et leurs lunes, jusqu\'à l\'héliosphère.', mini: 'planet:band:#e8c890:#a8783a:1', band: 'planete' },
    { id: 'voisinage', n: 'Voisinage stellaire', r: '12 années-lumière', s: 'Les étoiles les plus proches, à leurs positions mesurées.', mini: 'open', band: 'etoile' },
    { id: 'galaxie', n: 'Voie lactée', r: '100 000 années-lumière', s: 'Notre galaxie reconstituée, ses bras et ses repères.', mini: 'spiral', band: 'galaxie' },
    { id: 'groupe-local', n: 'Groupe local', r: '10 millions d\'al', s: 'Andromède, le Triangle et une quarantaine de galaxies naines.', mini: 'halo', band: 'galaxie' },
    { id: 'volume-local', n: 'Volume local', r: '40 millions d\'al', s: 'Les groupes de galaxies voisins : M81, Sculpteur, Centaurus A.', mini: 'irregular', band: 'nebuleuse' },
    { id: 'superamas', n: 'Superamas local', r: '150 millions d\'al', s: 'L\'amas de la Vierge et les groupes qui l\'entourent.', mini: 'globular', band: 'amas' },
    { id: 'laniakea', n: 'Laniakea', r: '≈ 520 millions d\'al', s: 'Environ 100 000 galaxies qui s\'écoulent vers le Grand Attracteur.', mini: 'arm', band: 'bras' },
    { id: 'univers', n: 'Univers observable', r: '93 milliards d\'al', s: 'La toile cosmique, jusqu\'au rayonnement fossile.', mini: 'void', band: 'vide' }
  ];
  function ok(l) { return (OBS.ATLAS_SCOPES || []).indexOf(l.id) >= 0; }
  OBS.scaleLevel = function (id) { return LV.filter(function (l) { return l.id === id; })[0]; };
  OBS.scaleAvail = ok;
  function norm(s) { return String(s).toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, ''); }
  var IDX = null;
  function index() {
    if (IDX) return IDX; IDX = [];
    (OBS.BODIES || []).forEach(function (b) { IDX.push([b.name, '#/explorer/' + b.id, 0]); });
    (OBS.STARS || []).forEach(function (s) { IDX.push([s.name, '#/etoile/' + s.id, 1]); });
    (OBS.GALAXY_OBJECTS || []).forEach(function (o) { if (!o.sun) IDX.push([o.name, '#/galaxie/' + o.id, 2]); });
    (OBS.EXOSYS || []).forEach(function (o) { IDX.push([o.name, '#/galaxie/' + o.id, 2]); });
    (OBS.LOCALGROUP || []).forEach(function (o) { if (!o.home && !o.galaxie) IDX.push([o.name, '#/groupe-local/' + o.id, 3]); });
    return IDX;
  }
  var store = { get: function (k) { try { return localStorage.getItem(k); } catch (e) { return null; } }, set: function (k, v) { try { localStorage.setItem(k, v); } catch (e) {} } };
  var narrowMQ = window.matchMedia ? matchMedia('(max-width: 760px)') : { matches: false };

  /* host : conteneur de la règle ; cur : id du niveau affiché ; view : carte | liste | unites */
  OBS.scaleNav = function (host, curId, view) {
    var cur = Math.max(0, LV.map(function (l) { return l.id; }).indexOf(curId)), mode, open;
    function link(i) { var l = LV[i]; return '#/atlas/' + l.id + (ok(l) && view ? '/' + view : ''); }
    function go(i) { i = Math.max(0, Math.min(LV.length - 1, i)); if (i !== cur) location.hash = link(i); else if (mode === 'tel') { open = false; draw(); } }
    function search() { return '<label class="sn-search"><span aria-hidden="true">⌕</span><span class="sr-only">Chercher un objet</span><input type="search" placeholder="Chercher un objet…" autocomplete="off"></label>'; }
    function steps(full) {
      return '<ol class="sn-steps">' + LV.slice().reverse().map(function (l) {
        var i = LV.indexOf(l), avail = ok(l);
        return '<li class="' + (i === cur ? 'on ' : '') + (avail ? '' : 'soon') + '"><a href="' + link(i) + '" data-i="' + i + '" title="' + esc(l.n + ' · ' + l.r) + '"' + (i === cur ? ' aria-current="page"' : '') + '>' +
          '<span class="sn-dot"></span>' + (full ? '<canvas class="sn-th" data-mini="' + l.mini + '" width="56" height="56"></canvas><span class="sn-t"><b>' + esc(l.n) + '</b><small>' + esc(l.r) + (avail ? '' : ' · à venir') + '</small></span>' : '<span class="sn-lbl">' + (i + 1) + '</span>') +
          '</a></li>';
      }).join('') + '</ol>';
    }
    function draw() {
      var l = LV[cur];
      mode = narrowMQ.matches ? 'tel' : 'pc';
      host.className = 'sn sn-' + mode + (open ? ' open' : '');
      if (mode === 'tel') {
        host.innerHTML = '<div class="sn-bar"><button type="button" class="sn-zoom" data-z="-1" aria-label="Échelle plus petite"' + (cur ? '' : ' disabled') + '>−</button>' +
          '<button type="button" class="sn-cur" data-tog aria-expanded="' + open + '"><canvas class="sn-th" data-mini="' + l.mini + '" width="56" height="56"></canvas><span class="sn-t"><b>' + esc(l.n) + '</b><small>' + (cur + 1) + ' / ' + LV.length + '</small><small>' + esc(l.r) + '</small></span><span class="sn-chev" aria-hidden="true">' + (open ? '▴' : '▾') + '</span></button>' +
          '<button type="button" class="sn-zoom" data-z="+1" aria-label="Échelle plus grande"' + (cur < LV.length - 1 ? '' : ' disabled') + '>+</button></div>' +
          (open ? '<div class="sn-drop">' + search() + '<div class="sn-res" hidden></div>' + steps(true) + '</div>' : '');
      } else {
        host.innerHTML = '<div class="sn-top"><button type="button" class="sn-tog" data-tog aria-label="' + (open ? 'Replier' : 'Déplier') + ' le panneau des échelles" title="' + (open ? 'Replier' : 'Déplier') + '">' + (open ? '‹' : '›') + '</button>' + (open ? search() : '') + '</div>' +
          '<button type="button" class="sn-zoom" data-z="+1" aria-label="Échelle plus grande" title="Plus loin"' + (cur < LV.length - 1 ? '' : ' disabled') + '>+</button>' + steps(open) +
          '<button type="button" class="sn-zoom" data-z="-1" aria-label="Échelle plus petite" title="Plus près"' + (cur ? '' : ' disabled') + '>−</button>' + (open ? '<div class="sn-res" hidden></div>' : '');
      }
      var inp = host.querySelector('input'), res = host.querySelector('.sn-res');
      if (inp) inp.addEventListener('input', function () {
        var q = norm(inp.value.trim()); if (!q) { res.hidden = true; return; }
        var L = index(), hits = L.filter(function (x) { return norm(x[0]).indexOf(q) === 0; }).concat(L.filter(function (x) { var p = norm(x[0]).indexOf(q); return p > 0; })).slice(0, 7);
        res.hidden = false;
        res.innerHTML = hits.length ? hits.map(function (x) { return '<a href="' + x[1] + '">' + esc(x[0]) + '<small>' + esc(LV[x[2]].n) + '</small></a>'; }).join('') : '<p>Rien trouvé. La recherche générale (touche /) couvre tout le site.</p>';
      });
    }
    open = narrowMQ.matches ? false : store.get('obs.atlas.panneau') !== 'replie';
    host.onclick = function (e) {
      var t = e.target.closest('button, a'); if (!t || !host.contains(t)) return;
      if (t.hasAttribute('data-tog')) { open = !open; if (mode === 'pc') store.set('obs.atlas.panneau', open ? 'ouvert' : 'replie'); draw(); return; }
      if (t.hasAttribute('data-z')) { go(cur + +t.getAttribute('data-z')); return; }
    };
    var onMQ = function () { if (!document.body.contains(host)) { narrowMQ.removeListener && narrowMQ.removeListener(onMQ); return; } open = narrowMQ.matches ? false : store.get('obs.atlas.panneau') !== 'replie'; draw(); };
    narrowMQ.addListener && narrowMQ.addListener(onMQ);
    draw();
  };

  /* ---------- zoom des cartes ----------
     On change la taille affichée du svg (il a un viewBox) en gardant sous les doigts le point pincé.
     Le plus petit zoom fait tenir toute la carte dans la largeur ; deux touchers rapides reviennent au départ. */
  function pinch(sc) {
    var svg = sc.querySelector('svg'); if (!svg || sc.dataset.pinch) return; sc.dataset.pinch = 1;
    var W = +svg.getAttribute('width'), H = +svg.getAttribute('height'); if (!W || !H) return;
    var z = 1, g = null, lastTap = 0;
    function zmin() { return Math.min(1, (sc.clientWidth - 2) / W); }
    function apply() { svg.setAttribute('width', (W * z).toFixed(0)); svg.setAttribute('height', (H * z).toFixed(0)); }
    if (narrowMQ.matches) { var fit = Math.min(1, window.innerHeight * .62 / H); if (fit < 1) { z = Math.max(zmin(), fit); apply(); } }
    var z0 = z;
    function set(nz, cx, cy) {
      nz = Math.max(zmin(), Math.min(2.5, nz)); if (Math.abs(nz - z) < 1e-4) return;
      var r = sc.getBoundingClientRect(), px = cx - r.left, py = cy - r.top;
      var fx = (sc.scrollLeft + px) / z, fy = (sc.scrollTop + py) / z;
      z = nz; apply(); sc.scrollLeft = fx * z - px; sc.scrollTop = fy * z - py; label();
    }
    function mid(nz) { var r = sc.getBoundingClientRect(); set(nz, r.left + r.width / 2, r.top + r.height / 2); }
    // commandes visibles : − / pourcentage (clic = taille normale) / + / carte entière
    var wrap = document.createElement('div'); wrap.className = 'az-wrap';
    sc.parentNode.insertBefore(wrap, sc); wrap.appendChild(sc);
    var ui = document.createElement('div'); ui.className = 'az'; ui.setAttribute('role', 'group'); ui.setAttribute('aria-label', 'Zoom de la carte');
    ui.innerHTML = '<button type="button" data-a="out" aria-label="Dézoomer" title="Dézoomer">−</button><button type="button" data-a="reset" class="az-pct" title="Taille normale"></button>' +
      '<button type="button" data-a="in" aria-label="Zoomer" title="Zoomer">+</button><button type="button" data-a="fit" aria-label="Voir toute la carte" title="Voir toute la carte">⤢</button>';
    wrap.appendChild(ui);
    function label() { var b = ui.querySelector('.az-pct'); if (b) b.textContent = Math.round(z * 100) + ' %'; }
    ui.addEventListener('click', function (e) {
      var b = e.target.closest('button'); if (!b) return; var a = b.getAttribute('data-a');
      if (a === 'in') mid(z * 1.25); else if (a === 'out') mid(z / 1.25); else if (a === 'fit') mid(zmin()); else { mid(z0); }
    });
    label();
    function d(t) { return Math.hypot(t[0].clientX - t[1].clientX, t[0].clientY - t[1].clientY); }
    sc.style.touchAction = 'pan-x pan-y';
    sc.addEventListener('touchstart', function (e) {
      if (e.touches.length === 2) { g = { d: d(e.touches), z: z }; e.preventDefault(); return; }
      var now = Date.now();
      if (e.touches.length === 1 && now - lastTap < 300) { var t = e.touches[0]; set(Math.abs(z - z0) < .01 ? zmin() : z0, t.clientX, t.clientY); e.preventDefault(); lastTap = 0; return; }
      lastTap = now;
    }, { passive: false });
    sc.addEventListener('touchmove', function (e) {
      if (!g || e.touches.length !== 2) return; e.preventDefault();
      var t = e.touches; set(g.z * d(t) / g.d, (t[0].clientX + t[1].clientX) / 2, (t[0].clientY + t[1].clientY) / 2);
    }, { passive: false });
    sc.addEventListener('touchend', function (e) { if (e.touches.length < 2) g = null; });
    sc.addEventListener('wheel', function (e) { if (!e.ctrlKey) return; e.preventDefault(); var dy = Math.max(-40, Math.min(40, e.deltaY)); set(z * Math.exp(-dy * .006), e.clientX, e.clientY); }, { passive: false });
  }
  OBS.armPinch = function (root) { Array.prototype.forEach.call((root || document).querySelectorAll('.atlas-scroll'), pinch); };
})();

/* ======================================================================
   OBSERVATOIRE — MAQUETTE (page cachée #/maquette, non reliée au menu)
   Navigation par échelles de l'Atlas : 8 crans du Système solaire à l'Univers observable.
   Ordinateur : panneau dépliant (règle verticale repliée → panneau large), + / −, zoom, recherche.
   Téléphone : règle horizontale défilante avec + / −.
   À valider avant intégration dans l'Atlas ; les niveaux 5 à 8 n'existent pas encore (« à venir »).
   ====================================================================== */
(function () {
  'use strict';
  var OBS = window.OBS = window.OBS || {}, esc = OBS.esc;
  var LV = [
    { id: 'systeme', n: 'Système solaire', r: 'jusqu\'à ≈ 120 UA', s: 'Le Soleil, les planètes et leurs lunes, jusqu\'à l\'héliosphère.', mini: 'planet:band:#e8c890:#a8783a:1', ok: true, href: '#/atlas/systeme' },
    { id: 'voisinage', n: 'Voisinage stellaire', r: '12 années-lumière', s: 'Les étoiles les plus proches, à leurs positions mesurées.', mini: 'open', ok: true, href: '#/atlas/voisinage' },
    { id: 'galaxie', n: 'Voie lactée', r: '100 000 années-lumière', s: 'Notre galaxie reconstituée, ses bras et ses repères.', mini: 'spiral', ok: true, href: '#/atlas/galaxie' },
    { id: 'groupe-local', n: 'Groupe local', r: '10 millions d\'al', s: 'Andromède, le Triangle et 40 galaxies naines.', mini: 'halo', ok: true, href: '#/atlas/groupe-local' },
    { id: 'volume', n: 'Volume local', r: '40 millions d\'al', s: 'Les groupes voisins : M81, Sculpteur, Centaurus A.', mini: 'irregular', ok: false },
    { id: 'superamas', n: 'Superamas local', r: '150 millions d\'al', s: 'L\'amas de la Vierge et les groupes qui l\'entourent.', mini: 'globular', ok: false },
    { id: 'laniakea', n: 'Laniakea', r: '≈ 1 milliard d\'al', s: '100 000 galaxies qui s\'écoulent vers le Grand Attracteur.', mini: 'arm', ok: false },
    { id: 'univers', n: 'Univers observable', r: '93 milliards d\'al', s: 'La toile cosmique, jusqu\'au rayonnement fossile.', mini: 'void', ok: false }
  ];
  function index() {
    var L = [];
    (OBS.BODIES || []).forEach(function (b) { L.push([b.name, 0]); });
    (OBS.STARS || []).forEach(function (s) { L.push([s.name, 1]); });
    (OBS.GALAXY_OBJECTS || []).forEach(function (o) { L.push([o.name, 2]); });
    (OBS.EXOSYS || []).forEach(function (o) { L.push([o.name, 2]); });
    (OBS.LOCALGROUP || []).forEach(function (o) { L.push([o.name, 3]); });
    return L;
  }
  function norm(s) { return String(s).toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, ''); }
  var BAND = ['planete', 'etoile', 'galaxie', 'galaxie', 'nebuleuse', 'amas', 'bras', 'vide'];

  /* Un navigateur d'échelles autonome. mode 'pc' : panneau à gauche, carte à droite.
     mode 'tel' : barre compacte (− niveau courant +) au-dessus de la carte ; un appui sur le niveau
     déplie la même liste que sur PC (vignettes, recherche), le choix la referme. */
  function mount(host, mode, IDX) {
    var cur = 0, open = mode === 'pc';
    host.className = 'mq-nav mq-' + mode;
    host.innerHTML = '<nav class="mq-panel" aria-label="Échelles"></nav><div class="mq-stage"></div>';
    var panel = host.querySelector('.mq-panel'), stage = host.querySelector('.mq-stage');

    function search() { return '<label class="mq-search"><span aria-hidden="true">⌕</span><input type="search" placeholder="Chercher un objet…" autocomplete="off"></label>'; }
    function steps(full) {
      return '<ol class="mq-steps">' + LV.slice().reverse().map(function (l) {
        var i = LV.indexOf(l);
        return '<li class="' + (i === cur ? 'on ' : '') + (l.ok ? '' : 'soon') + '"><button type="button" data-i="' + i + '" title="' + esc(l.n + ' · ' + l.r) + '">' +
          '<span class="mq-dot"></span>' + (full ? '<canvas class="mq-th" data-mini="' + l.mini + '" width="56" height="56"></canvas><span class="mq-t"><b>' + esc(l.n) + '</b><small>' + esc(l.r) + (l.ok ? '' : ' · à venir') + '</small></span>' : '<span class="mq-lbl">' + (i + 1) + '</span>') +
          '</button></li>';
      }).join('') + '</ol>';
    }
    function drawPanel() {
      var l = LV[cur];
      panel.className = 'mq-panel' + (open ? ' open' : '');
      if (mode === 'tel') {
        panel.innerHTML = '<div class="mq-bar"><button type="button" class="mq-zoom" data-z="-1" aria-label="Échelle plus petite"' + (cur ? '' : ' disabled') + '>−</button>' +
          '<button type="button" class="mq-cur mq-tog" aria-expanded="' + open + '"><canvas class="mq-th" data-mini="' + l.mini + '" width="56" height="56"></canvas><span class="mq-t"><b>' + esc(l.n) + '</b><small>' + (cur + 1) + ' / 8</small><small>' + esc(l.r) + '</small></span><span class="mq-chev" aria-hidden="true">' + (open ? '▴' : '▾') + '</span></button>' +
          '<button type="button" class="mq-zoom" data-z="+1" aria-label="Échelle plus grande"' + (cur < LV.length - 1 ? '' : ' disabled') + '>+</button></div>' +
          (open ? '<div class="mq-drop">' + search() + '<div class="mq-res" hidden></div>' + steps(true) + '</div>' : '');
      } else {
        panel.innerHTML = '<div class="mq-top"><button type="button" class="mq-tog" aria-label="' + (open ? 'Replier' : 'Déplier') + ' le panneau">' + (open ? '‹' : '›') + '</button>' + (open ? search() : '') + '</div>' +
          '<button type="button" class="mq-zoom" data-z="+1" aria-label="Échelle plus grande" title="Plus loin">+</button>' + steps(open) +
          '<button type="button" class="mq-zoom" data-z="-1" aria-label="Échelle plus petite" title="Plus près">−</button>' + (open ? '<div class="mq-res" hidden></div>' : '');
      }
      var inp = panel.querySelector('input'), res = panel.querySelector('.mq-res');
      if (inp) inp.addEventListener('input', function () {
        var q = norm(inp.value.trim()); if (!q) { res.hidden = true; return; }
        var hits = IDX.filter(function (x) { return norm(x[0]).indexOf(q) >= 0; }).slice(0, 6);
        res.hidden = false;
        res.innerHTML = hits.length ? hits.map(function (x) { return '<button type="button" data-i="' + x[1] + '">' + esc(x[0]) + '<small>' + esc(LV[x[1]].n) + '</small></button>'; }).join('') : '<p>Rien trouvé.</p>';
      });
    }
    function drawStage() {
      var l = LV[cur], here = '';
      if (!l.ok) {
        stage.innerHTML = OBS.band(BAND[cur], esc(l.n), l.s, null) +
          '<p class="mq-cap">Niveau à venir : <b>' + esc(l.n) + '</b>, ' + esc(l.r) + '. Sa carte horizontale viendra ici, comme pour les quatre premiers.</p>' + here;
        return;
      }
      // niveaux existants : la vraie carte horizontale de l'Atlas, sans la rangée d'onglets qu'elle remplacerait
      stage.innerHTML = (mode === 'pc' ? '<div class="mq-head"><b>' + esc(l.n) + '</b><span>' + esc(l.r) + '</span></div>' : '') + here + '<div class="mq-atlas"></div>';
      var box = stage.querySelector('.mq-atlas');
      try { OBS.pages.atlas(box, l.id, 'carte'); } catch (err) { box.innerHTML = '<p class="note">Carte indisponible ici.</p>'; }
      box.querySelectorAll('.p-kicker, h1, .tabs').forEach(function (x) { x.remove(); });
      if (mode === 'tel') {
        // téléphone : la carte juste sous la barre, les indications en dessous (ordre réglé en CSS) ;
        // le bouton « Tailles » redessine la carte, on réarme donc le zoom sur chaque nouvelle carte
        var arm = function () { var sc = box.querySelector('.atlas-scroll'); if (sc && !sc.dataset.pinch) { sc.dataset.pinch = 1; pinch(sc); } };
        arm(); new MutationObserver(arm).observe(box, { childList: true, subtree: true });
      }
    }
    function go(i) { cur = Math.max(0, Math.min(LV.length - 1, i)); if (mode === 'tel') open = false; drawPanel(); drawStage(); }
    host.onclick = function (e) {
      var t = e.target.closest('button'); if (!t || !host.contains(t) || !panel.contains(t)) return;
      if (t.classList.contains('mq-tog')) { open = !open; drawPanel(); return; }
      if (t.hasAttribute('data-z')) { go(cur + +t.getAttribute('data-z')); return; }
      if (t.hasAttribute('data-i')) go(+t.getAttribute('data-i'));
    };
    go(0);
  }

  /* Zoom à deux doigts sur une carte de l'Atlas (svg avec viewBox) : on change sa taille affichée
     en gardant sous les doigts le point qu'on pince ; deux touchers rapides reviennent à la taille d'origine.
     Le plus petit zoom fait tenir toute la carte dans la largeur de l'écran. */
  function pinch(sc) {
    var svg = sc.querySelector('svg'); if (!svg) return;
    var W = +svg.getAttribute('width'), H = +svg.getAttribute('height'), z = 1, g = null, lastTap = 0;
    function zmin() { return Math.min(1, (sc.clientWidth - 2) / W); }
    function set(nz, cx, cy) {
      nz = Math.max(zmin(), Math.min(2.5, nz));
      var r = sc.getBoundingClientRect(), px = cx - r.left, py = cy - r.top;
      var fx = (sc.scrollLeft + px) / z, fy = (sc.scrollTop + py) / z;
      z = nz; svg.setAttribute('width', (W * z).toFixed(0)); svg.setAttribute('height', (H * z).toFixed(0));
      sc.scrollLeft = fx * z - px; sc.scrollTop = fy * z - py;
    }
    function d(t) { return Math.hypot(t[0].clientX - t[1].clientX, t[0].clientY - t[1].clientY); }
    sc.style.touchAction = 'pan-x pan-y';
    // d'entrée, une carte très haute (Groupe local) est réduite pour tenir dans la hauteur du cadre
    var fit = Math.min(1, (sc.clientHeight - 4) / H);
    if (fit < 1) { z = Math.max(zmin(), fit); svg.setAttribute('width', (W * z).toFixed(0)); svg.setAttribute('height', (H * z).toFixed(0)); }
    var z0 = z;
    sc.addEventListener('touchstart', function (e) {
      if (e.touches.length === 2) { g = { d: d(e.touches), z: z }; e.preventDefault(); return; }
      var now = Date.now(); if (e.touches.length === 1 && now - lastTap < 300) { var t = e.touches[0]; set(Math.abs(z - z0) < .01 ? zmin() : z0, t.clientX, t.clientY); e.preventDefault(); }
      lastTap = now;
    }, { passive: false });
    sc.addEventListener('touchmove', function (e) {
      if (!g || e.touches.length !== 2) return; e.preventDefault();
      var t = e.touches; set(g.z * d(t) / g.d, (t[0].clientX + t[1].clientX) / 2, (t[0].clientY + t[1].clientY) / 2);
    }, { passive: false });
    sc.addEventListener('touchend', function (e) { if (e.touches.length < 2) g = null; });
  }
  OBS.mqPinch = pinch;

  OBS.pages.maquette = function (root) {
    var IDX = index(), narrow = window.innerWidth < 760;
    root.innerHTML = '<p class="p-kicker">Maquette · à valider</p><h1>Naviguer par échelles</h1>' +
      '<p class="lead">Huit crans, du Système solaire à l\'Univers observable, à la place de la rangée « Système solaire, Voisinage, Voie lactée, Groupe local ». Les quatre derniers niveaux n\'existent pas encore : ils sont grisés. Cette page n\'est reliée à aucun menu.</p>' +
      (narrow ? '' : '<h2>Sur ordinateur</h2>' +
      '<p class="note">Le panneau des échelles est ouvert d\'entrée, à gauche ; la flèche le replie en fine règle. À droite, la vraie carte horizontale de l\'Atlas pour le niveau choisi.</p>' +
      '<div id="mq-pc"></div>') +
      '<h2>Sur téléphone</h2>' +
      '<p class="note">Le même panneau, replié en une barre au-dessus de la carte : − et + changent de niveau, un appui sur le niveau déplie la liste complète avec les vignettes et la recherche. Le choix la referme.' + (narrow ? '' : ' Ouvrez cette page sur votre téléphone pour le vrai rendu.') + '</p>' +
      (narrow ? '<div id="mq-tel"></div>' : '<div class="mq-phone"><div class="mq-ph-in"><div id="mq-tel"></div></div></div>') +
      '<p class="note" style="margin-top:28px">Dites-moi ce qui vous plaît, ce qui manque, ou ce qu\'il faut changer avant l\'intégration.</p>';
    if (!narrow) mount(root.querySelector('#mq-pc'), 'pc', IDX);
    mount(root.querySelector('#mq-tel'), 'tel', IDX);
  };
})();

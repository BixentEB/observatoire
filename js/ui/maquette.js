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
  var cur = 0, open = true;   // sur ordinateur, le panneau est déplié d'entrée

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

  OBS.pages.maquette = function (root) {
    var IDX = index();
    root.innerHTML = '<p class="p-kicker">Maquette · à valider</p><h1>Naviguer par échelles</h1>' +
      '<p class="lead">Huit crans, du Système solaire à l\'Univers observable, à la place de la rangée « Système solaire, Voisinage, Voie lactée, Groupe local ». Les quatre derniers niveaux n\'existent pas encore : ils sont grisés. Cette page n\'est reliée à aucun menu.</p>' +
      '<h2>Sur ordinateur : le panneau dépliant</h2>' +
      '<p class="note">Le panneau des échelles est ouvert d\'entrée, à gauche ; la flèche le replie en fine règle. À droite, la carte horizontale du niveau choisi (la vraie, celle de l\'Atlas). Les deux se complètent : le panneau pour changer d\'échelle, la carte pour voir les objets du niveau.</p>' +
      '<div class="mq-desk"><div class="mq-stage" id="mq-stage"></div><nav class="mq-panel" id="mq-panel" aria-label="Échelles"></nav></div>' +
      '<h2>Sur téléphone : la règle défilante</h2>' +
      '<p class="note">Une ligne de crans qui défile de côté, le cran courant centré, + et − aux extrémités.</p>' +
      '<div class="mq-phone"><div class="mq-ph-in"><div class="mq-ph-bar" id="mq-ph"></div><div class="mq-ph-body" id="mq-ph-body"></div></div></div>' +
      '<p class="note" style="margin-top:28px">Dites-moi ce qui vous plaît, ce qui manque, ou ce qu\'il faut changer avant l\'intégration.</p>';
    var panel = root.querySelector('#mq-panel'), stage = root.querySelector('#mq-stage'), ph = root.querySelector('#mq-ph'), phb = root.querySelector('#mq-ph-body');

    function drawPanel() {
      panel.className = 'mq-panel' + (open ? ' open' : '');
      panel.innerHTML = '<div class="mq-top"><button type="button" class="mq-tog" aria-label="' + (open ? 'Replier' : 'Déplier') + ' le panneau">' + (open ? '‹' : '›') + '</button>' +
        (open ? '<label class="mq-search"><span aria-hidden="true">⌕</span><input type="search" placeholder="Chercher un objet…" autocomplete="off"></label>' : '') + '</div>' +
        '<button type="button" class="mq-zoom" data-z="+1" aria-label="Échelle plus grande" title="Plus loin">+</button>' +
        '<ol class="mq-steps">' + LV.slice().reverse().map(function (l) {
          var i = LV.indexOf(l);
          return '<li class="' + (i === cur ? 'on ' : '') + (l.ok ? '' : 'soon') + '"><button type="button" data-i="' + i + '" title="' + esc(l.n + ' · ' + l.r) + '">' +
            '<span class="mq-dot"></span>' + (open ? '<canvas class="mq-th" data-mini="' + l.mini + '" width="56" height="56"></canvas><span class="mq-t"><b>' + esc(l.n) + '</b><small>' + esc(l.r) + (l.ok ? '' : ' · à venir') + '</small></span>' : '<span class="mq-lbl">' + (i + 1) + '</span>') +
            '</button></li>';
        }).join('') + '</ol>' +
        '<button type="button" class="mq-zoom" data-z="-1" aria-label="Échelle plus petite" title="Plus près">−</button>' +
        (open ? '<div class="mq-res" hidden></div>' : '');
      var inp = panel.querySelector('input'), res = panel.querySelector('.mq-res');
      if (inp) inp.addEventListener('input', function () {
        var q = norm(inp.value.trim()); if (!q) { res.hidden = true; return; }
        var hits = IDX.filter(function (x) { return norm(x[0]).indexOf(q) >= 0; }).slice(0, 6);
        res.hidden = false;
        res.innerHTML = hits.length ? hits.map(function (x) { return '<button type="button" data-i="' + x[1] + '">' + esc(x[0]) + '<small>' + esc(LV[x[1]].n) + '</small></button>'; }).join('') : '<p>Rien trouvé.</p>';
      });
    }
    function drawStage() {
      var l = LV[cur], here = '<p class="mq-here">Vous êtes ici : ' + LV.slice(0, cur + 1).map(function (x) { return esc(x.n); }).reverse().join(' ⊃ ') + '</p>';
      if (!l.ok) {
        stage.innerHTML = OBS.band(['planete', 'etoile', 'galaxie', 'galaxie', 'nebuleuse', 'amas', 'bras', 'vide'][cur], esc(l.n), l.s, null) +
          '<p class="mq-cap">Niveau à venir : <b>' + esc(l.n) + '</b>, ' + esc(l.r) + '. Sa carte horizontale viendra ici, comme pour les quatre premiers.</p>' + here;
        return;
      }
      // niveaux existants : la vraie carte horizontale de l'Atlas, sans la rangée d'onglets qu'elle remplacerait
      stage.innerHTML = '<div class="mq-head"><b>' + esc(l.n) + '</b><span>' + esc(l.r) + '</span></div>' + here + '<div class="mq-atlas"></div>';
      var box = stage.querySelector('.mq-atlas');
      try { OBS.pages.atlas(box, l.id, 'carte'); } catch (err) { box.innerHTML = '<p class="note">Carte indisponible ici.</p>'; }
      box.querySelectorAll('.p-kicker, h1, .tabs').forEach(function (x) { x.remove(); });
    }
    function drawPhone() {
      ph.innerHTML = '<button type="button" class="mq-pz" data-z="-1" aria-label="Plus près">−</button><div class="mq-ph-scroll">' + LV.map(function (l, i) {
        return '<button type="button" data-i="' + i + '" class="mq-pill' + (i === cur ? ' on' : '') + (l.ok ? '' : ' soon') + '">' + esc(l.n) + '<small>' + esc(l.r) + '</small></button>';
      }).join('') + '</div><button type="button" class="mq-pz" data-z="+1" aria-label="Plus loin">+</button>';
      var on = ph.querySelector('.mq-pill.on'), sc = ph.querySelector('.mq-ph-scroll');
      if (on) sc.scrollLeft += on.getBoundingClientRect().left - sc.getBoundingClientRect().left - (sc.clientWidth - on.clientWidth) / 2;
      phb.innerHTML = '<p class="mq-ph-t">' + esc(LV[cur].n) + '</p><p>' + esc(LV[cur].s) + '</p>';
    }
    function go(i) { cur = Math.max(0, Math.min(LV.length - 1, i)); drawPanel(); drawStage(); drawPhone(); }
    root.onclick = function (e) {
      var t = e.target.closest('button'); if (!t || !root.contains(t)) return;
      if (t.classList.contains('mq-tog')) { open = !open; drawPanel(); return; }
      if (t.hasAttribute('data-z')) { go(cur + +t.getAttribute('data-z')); return; }
      if (t.hasAttribute('data-i')) go(+t.getAttribute('data-i'));
    };
    go(0);
  };
})();

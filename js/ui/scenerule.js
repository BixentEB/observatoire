/* ======================================================================
   OBSERVATOIRE — règle des échelles de l'Explorer (lot 6, 14 novembre 2026)
   Version raccourcie de la règle de l'Atlas (OBS.SCALE_LEVELS) : seulement les niveaux
   qu'on peut visiter en 3D, du Système solaire au Superamas local.
   - Ordinateur : colonne fine à gauche de la scène, ∞ (plus loin, vers l'infiniment grand) en haut, ⊕ (plus près, vers nous) en bas.
   - Téléphone (≤ 760 px) : pastille « ⊕ niveau ∞ » au début du fil d'Ariane ; un appui déplie la liste.
   Un clic sur le niveau affiché ramène à sa vue d'ensemble.
   Le menu « Aller vers » (app.js) ne montre que les destinations du niveau choisi ici.
   ====================================================================== */
(function () {
  'use strict';
  var OBS = window.OBS = window.OBS || {}, esc = OBS.esc;
  var IDS = ['systeme', 'voisinage', 'galaxie', 'groupe-local', 'volume-local', 'superamas'];   // du plus près au plus loin
  var narrowMQ = window.matchMedia ? matchMedia('(max-width: 760px)') : { matches: false };
  var host = null, open = false;

  function lv(id) { return (OBS.scaleLevel && OBS.scaleLevel(id)) || { id: id, n: id, r: '' }; }
  /* zone de la règle pour le niveau affiché : une étoile visitée appartient au voisinage, une exoplanète à la Voie lactée */
  function zone() {
    var L = OBS.engine && OBS.engine.level; if (!L) return 0;
    if (L === OBS.starsystem) { var st = OBS.starsystem.star(); return IDS.indexOf(st && st.exo ? 'galaxie' : 'voisinage'); }
    return Math.max(0, IDS.indexOf(L.id));
  }
  OBS.sceneZone = function () { return IDS[zone()]; };

  function go(i) {
    i = Math.max(0, Math.min(IDS.length - 1, i));
    var L = OBS.engine.level, id = IDS[i]; if (!L) return;
    if (i === zone() && L !== OBS.starsystem) { if (L.select) L.select(null); return; }   // niveau affiché : vue d'ensemble
    if (L === OBS.starsystem && id === 'voisinage') { OBS.engine.go('voisinage', { focus: OBS.starsystem.star().id, from: 'etoile' }); return; }
    var cur = IDS.indexOf(L.id), opts = {};
    if (Math.abs(i - cur) === 1) opts.from = L.id;   // niveau voisin : on garde le vol de passage habituel
    OBS.engine.go(id, opts);
  }

  function stepsHtml(cur, full) {
    return '<ol class="sr-steps">' + IDS.slice().reverse().map(function (id) {
      var i = IDS.indexOf(id), l = lv(id);
      return '<li' + (i === cur ? ' class="on"' : '') + '><button type="button" data-i="' + i + '" title="' + esc(l.n + ' · ' + l.r) + (i === cur ? ' · vue d\'ensemble' : '') + '"' + (i === cur ? ' aria-current="location"' : '') + '>' +
        '<span class="sn-dot"></span><span class="sr-n">' + esc(l.n) + (full ? '<small>' + esc(l.r) + '</small>' : '') + '</span>' + '</button></li>';
    }).join('') + '</ol>';
  }

  /* ordinateur : colonne à gauche */
  function drawPc() {
    if (!host) { host = document.createElement('nav'); host.id = 'scene-rule'; host.className = 'sr'; host.setAttribute('aria-label', 'Échelles'); document.body.appendChild(host); host.addEventListener('click', onClick); }
    var cur = zone();
    host.innerHTML = '<button type="button" class="sn-zoom" data-z="1" title="Plus loin, vers l\'infiniment grand" aria-label="Échelle plus grande"' + (cur < IDS.length - 1 ? '' : ' disabled') + '>∞</button>' +
      stepsHtml(cur, false) +
      '<button type="button" class="sn-zoom" data-z="-1" title="Plus près, vers nous" aria-label="Échelle plus petite"' + (cur ? '' : ' disabled') + '>⊕</button>';
  }
  function onClick(e) {
    var b = e.target.closest('button'); if (!b) return;
    if (b.hasAttribute('data-z')) { go(zone() + +b.getAttribute('data-z')); return; }
    if (b.hasAttribute('data-i')) { open = false; go(+b.getAttribute('data-i')); OBS.emit('crumbs'); return; }
    if (b.hasAttribute('data-tog')) { open = !open; OBS.emit('crumbs'); }
  }

  /* téléphone : pastille au début du fil d'Ariane (rendue par app.js à chaque mise à jour du fil) */
  OBS.sceneRulePill = function () {
    var cur = zone(), l = lv(IDS[cur]);
    var el = document.createElement('div'); el.className = 'sr-pill' + (open ? ' open' : '');
    el.innerHTML = '<button type="button" class="sr-z" data-z="-1" title="Plus près, vers nous" aria-label="Échelle plus petite"' + (cur ? '' : ' disabled') + '>⊕</button>' +
      '<button type="button" class="sr-cur" data-tog aria-expanded="' + open + '"><b>' + esc(l.n) + '</b><small>' + (cur + 1) + ' / ' + IDS.length + '</small><span aria-hidden="true">' + (open ? '▴' : '▾') + '</span></button>' +
      '<button type="button" class="sr-z" data-z="1" title="Plus loin, vers l\'infiniment grand" aria-label="Échelle plus grande"' + (cur < IDS.length - 1 ? '' : ' disabled') + '>∞</button>' +
      (open ? '<div class="sr-drop">' + stepsHtml(cur, true) + '</div>' : '');
    el.addEventListener('click', onClick);
    return el;
  };
  OBS.sceneRuleNarrow = function () { return narrowMQ.matches; };
  document.addEventListener('pointerdown', function (e) { if (open && !e.target.closest('.sr-pill')) { open = false; OBS.emit('crumbs'); } });

  function draw() {
    var page = document.body.classList.contains('page-open');
    if (narrowMQ.matches || page || !OBS.engine || !OBS.engine.level) { if (host) host.hidden = true; return; }
    drawPc(); host.hidden = false;
  }
  OBS.on('level', function () { setTimeout(draw, 0); });
  OBS.on('page', function () { setTimeout(draw, 0); });
  if (narrowMQ.addListener) narrowMQ.addListener(function () { open = false; draw(); OBS.emit('crumbs'); });
})();

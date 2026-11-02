/* ======================================================================
   OBSERVATOIRE — renvois entre fiches
   Dans le texte d'une fiche, le nom d'un autre objet de l'Observatoire devient un lien
   (souligné en pointillé) : au survol ou au toucher, une bulle donne l'essentiel
   et un bouton permet d'aller le voir. Seule la première mention de chaque objet est liée.
   ====================================================================== */
(function () {
  'use strict';
  var OBS = window.OBS = window.OBS || {};
  var esc = OBS.esc;
  // autres noms sous lesquels un objet est cité dans les textes
  var ALIASES = { jwst: ['télescope James Webb', 'Webb'], iss: ['ISS'], parker: ['Parker'], halley: ['comète de Halley', 'Halley'], ceinture: ['ceinture d\'astéroïdes', 'ceinture principale'], kuiper: ['ceinture de Kuiper'] };
  var index = null, re = null;

  function build() {
    index = {};
    var all = (OBS.BODIES || []).concat(OBS.REGIONS || [], OBS.CRAFT || []);
    all.forEach(function (d) {
      [d.name].concat(d.short && d.short !== d.name ? [d.short] : [], ALIASES[d.id] || []).forEach(function (n) { if (n && n.length > 1 && !index[n]) index[n] = d.id; });
    });
    var names = Object.keys(index).sort(function (a, b) { return b.length - a.length; })
      .map(function (n) { return n.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); });
    try { re = new RegExp('(^|[^\\p{L}\\d\\-])(' + names.join('|') + ')(?![\\p{L}\\d])', 'gu'); }
    catch (e) { re = new RegExp('(^|[^A-Za-zÀ-ÿ\\d\\-])(' + names.join('|') + ')(?![A-Za-zÀ-ÿ\\d])', 'g'); }
  }
  function def(id) { return OBS.byId[id] || (OBS.CRAFT || []).filter(function (c) { return c.id === id; })[0] || null; }

  /* texte brut → HTML échappé, avec les renvois */
  OBS.xref = function (text, selfId) {
    if (!text) return '';
    if (!index) build();
    var used = {}, html = esc(String(text));
    if (selfId) used[selfId] = 1;
    return html.replace(re, function (m, pre, name) {
      var id = index[name]; if (!id || used[id]) return m;
      used[id] = 1;
      return pre + '<button type="button" class="xref" data-xref="' + id + '">' + name + '</button>';
    });
  };

  /* bulle d'information */
  var bub = document.createElement('div'); bub.className = 'xbub'; bub.hidden = true; bub.setAttribute('role', 'dialog');
  document.body.appendChild(bub);
  var cur = null, pinned = false, hideT = 0;
  function firstSentence(t) { if (!t) return ''; var m = String(t).match(/^.{20,220}?[.!?](\s|$)/); return m ? m[0].trim() : String(t).slice(0, 200) + '…'; }
  function show(btn, pin) {
    var id = btn.getAttribute('data-xref'), d = def(id); if (!d) return;
    clearTimeout(hideT); cur = btn; pinned = !!pin;
    var P = OBS.system && OBS.system.get && OBS.system.get(id), off = P && P.craft && !P.on;
    bub.innerHTML = '<p class="xb-kind">' + esc(d.kind || '') + '</p><p class="xb-name">' + esc(d.name) + '</p><p class="xb-text">' + esc(firstSentence(d.text)) + '</p>' +
      (off ? '<p class="xb-note">Pas de position à la date affichée.</p>' : '') +
      '<button type="button" class="xb-go" data-go="' + id + '">Aller voir ' + esc(d.short || d.name) + ' →</button>';
    bub.hidden = false;
    var r = btn.getBoundingClientRect(), bw = Math.min(290, window.innerWidth - 24);
    bub.style.width = bw + 'px';
    var x = Math.max(12, Math.min(window.innerWidth - bw - 12, r.left + r.width / 2 - bw / 2));
    var bh = bub.offsetHeight, y = r.top - bh - 10;
    if (y < 60) y = r.bottom + 10;
    bub.style.left = x + 'px'; bub.style.top = y + 'px';
  }
  function hide(now) {
    clearTimeout(hideT);
    hideT = setTimeout(function () { bub.hidden = true; cur = null; pinned = false; }, now ? 0 : 260);
  }
  function go(id) {
    hide(true);
    if (OBS.engine && OBS.engine.level && OBS.engine.level !== OBS.system) OBS.engine.go('systeme', { focus: id });
    else if (OBS.system && OBS.system.select) OBS.system.select(id);
  }
  var fine = window.matchMedia && window.matchMedia('(hover: hover) and (pointer: fine)').matches;
  document.addEventListener('pointerover', function (e) {
    var b = e.target.closest && e.target.closest('.xref');
    if (b && fine && !pinned) show(b, false);
    else if (b || (e.target.closest && e.target.closest('.xbub'))) clearTimeout(hideT);
  });
  document.addEventListener('pointerout', function (e) {
    var b = e.target.closest && (e.target.closest('.xref') || e.target.closest('.xbub'));
    if (b && !pinned) hide();
  });
  document.addEventListener('click', function (e) {
    var g = e.target.closest('.xb-go'); if (g) { go(g.getAttribute('data-go')); return; }
    var b = e.target.closest('.xref');
    if (b) { e.preventDefault(); if (cur === b && pinned) hide(true); else show(b, true); return; }
    if (!e.target.closest('.xbub')) hide(true);
  });
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && !bub.hidden) { hide(true); e.stopPropagation(); } }, true);
  OBS.on && OBS.on('select', function () { hide(true); });
  OBS.on && OBS.on('page', function () { hide(true); });
  window.addEventListener('scroll', function () { if (!pinned) hide(true); }, true);
})();

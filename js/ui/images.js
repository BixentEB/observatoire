/* ======================================================================
   OBSERVATOIRE — photos dans les fiches
   Catalogue data/images.json (généré par tools/images.py : Wikimedia Commons, licences libres, crédits).
   Tout élément <div data-photo="niveau/id"> reçoit l'image de l'objet, avec son auteur, sa licence et un
   lien vers la source ; une vue d'artiste est toujours étiquetée « illustration », jamais « photo ».
   Rien n'est affiché quand aucune image libre n'existe.
   ====================================================================== */
(function () {
  'use strict';
  var OBS = window.OBS = window.OBS || {};
  var byUse = null, loading = null;
  function esc(s) { return OBS.esc ? OBS.esc(s) : String(s); }
  function load() {
    if (!loading) loading = fetch('data/images.json', { cache: 'no-cache' }).then(function (r) { return r.ok ? r.json() : null; }).then(function (j) {
      byUse = {};
      Object.keys((j && j.objets) || {}).forEach(function (id) {
        var o = j.objets[id]; if (!o.files) return;
        (o.uses || [id]).forEach(function (u) { byUse[u] = o; });
      });
      return byUse;
    }).catch(function () { byUse = {}; return byUse; });
    return loading;
  }
  var KIND = { photo: '', radar: 'Image radar', illustration: 'Illustration (vue d\'artiste)' };
  function html(o, small) {
    var f = o.files, s = f['480'], b = f['1024'] || f['1280'] || s, lic = o.license || '';
    var auth = (o.author || '').replace(/\s+/g, ' ').slice(0, 90);
    return '<figure class="c-photo' + (small ? ' sm' : '') + '"><a href="' + esc(b.src) + '" target="_blank" rel="noopener" title="Agrandir">' +
      '<img src="' + esc(s.src) + '" srcset="' + esc(s.src) + ' ' + s.w + 'w, ' + esc(b.src) + ' ' + b.w + 'w" sizes="' + (small ? '120px' : '(max-width: 720px) 100vw, 360px') + '" width="' + s.w + '" height="' + s.h + '" alt="' + esc(o.alt || '') + '" loading="lazy"></a>' +
      (small ? '' : '<figcaption>' + (KIND[o.kind] ? '<b>' + KIND[o.kind] + '</b> · ' : '') + esc(auth || 'Auteur inconnu') + ' · ' +
        (o.licenseUrl ? '<a href="' + esc(o.licenseUrl) + '" target="_blank" rel="noopener">' + esc(lic) + '</a>' : esc(lic)) +
        ' · <a href="' + esc(o.page) + '" target="_blank" rel="noopener">source</a></figcaption>') + '</figure>';
  }
  function fill() {
    var els = document.querySelectorAll('[data-photo]:not([data-ph-done])'); if (!els.length) return;
    load().then(function (m) {
      Array.prototype.forEach.call(els, function (el) {
        el.setAttribute('data-ph-done', '1');
        var u = el.getAttribute('data-photo'), o = m[u]; if (o) { el.innerHTML = html(o, el.hasAttribute('data-photo-sm')); var a = el.querySelector('a'); if (a) a.setAttribute('data-lb', u); }
      });
    });
  }
  /* agrandissement dans une fenêtre : image, puis qui, quoi, quand, d'où ; croix, clic à côté ou Échap pour fermer */
  var box = null;
  function closeBox() { if (box) { box.remove(); box = null; window.removeEventListener('keydown', onKey, true); } }
  function onKey(e) { if (e.key === 'Escape') { e.preventDefault(); e.stopImmediatePropagation(); closeBox(); } }
  function openBox(o) {
    closeBox();
    var f = o.files, b = f['1024'] || f['1280'] || f['480'];
    var desc = (o.description || '').replace(/\s+/g, ' ').trim(); if (desc.length > 260) desc = desc.slice(0, 257).replace(/\s\S*$/, '') + '…';
    var rows = [['Auteur', o.author], ['Date', o.date], ['Crédit', o.credit && o.credit !== o.author ? o.credit.slice(0, 160) : ''], ['Licence', o.license]].filter(function (r) { return r[1]; });
    box = document.createElement('div'); box.className = 'lb'; box.setAttribute('role', 'dialog'); box.setAttribute('aria-modal', 'true'); box.setAttribute('aria-label', o.alt || 'Image');
    box.innerHTML = '<div class="lb-in"><button class="lb-x" type="button" aria-label="Fermer">✕</button>' +
      '<div class="lb-img"><img src="' + esc(b.src) + '" width="' + b.w + '" height="' + b.h + '" alt="' + esc(o.alt || '') + '"></div>' +
      '<div class="lb-txt">' + (KIND[o.kind] ? '<p class="lb-kind">' + KIND[o.kind] + '</p>' : '') + '<h3>' + esc(o.alt || o.title || '') + '</h3>' + (desc ? '<p class="lb-desc">' + esc(desc) + '</p>' : '') +
      '<dl>' + rows.map(function (r) { return '<div><dt>' + r[0] + '</dt><dd>' + esc(String(r[1]).replace(/\s+/g, ' ')) + '</dd></div>'; }).join('') + '</dl>' +
      '<p class="lb-links"><a href="' + esc(o.page) + '" target="_blank" rel="noopener">Voir la source sur Wikimedia Commons</a>' + (o.licenseUrl ? '<a href="' + esc(o.licenseUrl) + '" target="_blank" rel="noopener">Texte de la licence</a>' : '') + '</p></div></div>';
    document.body.appendChild(box);
    box.addEventListener('click', function (e) { if (e.target === box || e.target.closest('.lb-x')) closeBox(); });
    window.addEventListener('keydown', onKey, true);
    box.querySelector('.lb-x').focus();
  }
  document.addEventListener('click', function (e) {
    var a = e.target.closest && e.target.closest('.c-photo a[data-lb]'); if (!a) return;
    var o = byUse && byUse[a.getAttribute('data-lb')]; if (!o) return;
    e.preventDefault(); openBox(o);
  });
  window.addEventListener('hashchange', function () { closeBox(); });
  OBS.img = { load: load, open: openBox, get: function (u) { return byUse && byUse[u]; }, html: html };
  var pend = 0;
  function start() { fill(); new MutationObserver(function () { if (!pend) pend = requestAnimationFrame(function () { pend = 0; fill(); }); }).observe(document.body, { childList: true, subtree: true }); }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start); else start();
})();

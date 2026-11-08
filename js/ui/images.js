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
        var o = m[el.getAttribute('data-photo')]; if (o) el.innerHTML = html(o, el.hasAttribute('data-photo-sm'));
      });
    });
  }
  OBS.img = { load: load, get: function (u) { return byUse && byUse[u]; }, html: html };
  var pend = 0;
  function start() { fill(); new MutationObserver(function () { if (!pend) pend = requestAnimationFrame(function () { pend = 0; fill(); }); }).observe(document.body, { childList: true, subtree: true }); }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start); else start();
})();

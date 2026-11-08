/* ======================================================================
   OBSERVATOIRE — pastille « Nouveau »
   Chaque nouveauté a une date d'ajout fixe, la même pour tous. Pendant 14 jours, les liens qui y mènent
   portent une pastille « Nouveau » (et un point sur l'entrée du menu qui la contient). La pastille
   s'éteint dès que le visiteur a ouvert la nouveauté (mémorisé dans son navigateur).
   Ajouter une nouveauté : une ligne dans NEWS (href exact du lien, date AAAA-MM-JJ).
   ====================================================================== */
(function () {
  'use strict';
  var OBS = window.OBS = window.OBS || {};
  var NEWS = [
    { href: '#/hypotheses/chercheurs', date: '2026-11-03', menu: 'hypotheses' },
    { href: '#/lexique', date: '2026-11-03', menu: 'outils' },
    { href: '#/atlas/visiteurs', date: '2026-11-07', menu: 'atlas' },
    { href: '#/atlas/types', date: '2026-11-07', menu: 'atlas' },
    { href: '#/atlas/echelles', date: '2026-11-07', menu: 'atlas' },
    { href: '#/ressources', date: '2026-11-08', menu: 'methode' }
  ];
  var DAYS = 14;
  OBS.NEWS = NEWS;

  function get(k) { try { return localStorage.getItem(k); } catch (e) { return null; } }
  function set(k, v) { try { localStorage.setItem(k, v); } catch (e) {} }
  function active(n) {
    var d = new Date(n.date + 'T00:00:00'), age = (Date.now() - d) / 864e5;
    return age >= 0 && age < DAYS && !get('obs.vu.' + n.href);
  }
  function seen() {
    var h = location.hash || '#/';
    NEWS.forEach(function (n) { if (h === n.href || h.indexOf(n.href + '/') === 0) set('obs.vu.' + n.href, '1'); });
  }
  function decorate() {
    var live = NEWS.filter(active), hrefs = {};
    live.forEach(function (n) { hrefs[n.href] = 1; });
    Array.prototype.forEach.call(document.querySelectorAll('a[href^="#/"]'), function (a) {
      var on = !!hrefs[a.getAttribute('href')] && !a.closest('#menu, .menu') && a.matches('.tab, .tool, .chip, .h-tab');
      if (on !== a.classList.contains('is-new')) a.classList.toggle('is-new', on);
    });
    var menus = {}; live.forEach(function (n) { menus[n.menu] = 1; });
    Array.prototype.forEach.call(document.querySelectorAll('[data-route]'), function (a) {
      var on = !!menus[a.getAttribute('data-route')];
      if (on !== a.classList.contains('has-new')) a.classList.toggle('has-new', on);
    });
  }
  var pend = 0;
  function soon() { if (!pend) pend = requestAnimationFrame(function () { pend = 0; decorate(); }); }
  function start() {
    seen(); decorate();
    window.addEventListener('hashchange', function () { seen(); soon(); });
    new MutationObserver(soon).observe(document.getElementById('page') || document.body, { childList: true, subtree: true });
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start); else start();
})();

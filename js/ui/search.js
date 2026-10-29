/* ======================================================================
   OBSERVATOIRE — recherche
   Trouver un astre ou un objet : planètes, lunes, planètes naines, régions, étoiles, exoplanètes,
   hypothèses et pages. Insensible aux accents et aux majuscules ; quelques noms anglais reconnus.
   Raccourcis : « / » ou Ctrl+K pour ouvrir, flèches pour choisir, Entrée pour y aller, Échap pour fermer.
   ====================================================================== */
(function () {
  'use strict';
  var OBS = window.OBS, esc = OBS.esc;
  var ALIAS = { soleil: 'sun sol', terre: 'earth', lune: 'moon luna', venus: 'venus', mars: 'mars', saturne: 'saturn', neptune: 'neptune', pluton: 'pluto',
    europe: 'europa', ganymede: 'ganymede', encelade: 'enceladus', japet: 'iapetus', rhea: 'rhea', dione: 'dione', tethys: 'tethys', oberon: 'oberon',
    ceres: 'ceres', eris: 'eris', haumea: 'haumea', makemake: 'makemake', halley: '1p comete comet', ceinture: 'asteroides asteroid belt',
    kuiper: 'kuiper belt', proxima: 'proxima centauri', alphacen: 'rigil kentaurus alpha centauri', sirius: 'sirius canicule', '61cyg': '61 cygni', tauceti: 'tau ceti', epseri: 'epsilon eridani' };
  var CRAFT_ALIAS = { jwst: 'jwst webb telescope', iss: 'iss station', tiangong: 'css station chinoise', artemis1: 'orion', artemis2: 'orion integrity wiseman glover koch hansen', osirisapex: 'osiris rex bennu apophis', clipper: 'europe europa', juice: 'ganymede', hope: 'al amal emirats', marsexpress: 'mex', lro: 'lunar reconnaissance', parker: 'psp' };
  function norm(s) { return String(s || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]+/g, ' ').trim(); }

  var index = null;
  function build() {
    index = [];
    OBS.BODIES.forEach(function (b) { index.push({ name: b.name, sub: b.kind, href: '#/explorer/' + b.id, key: norm(b.name + ' ' + (ALIAS[b.id] || '') + ' ' + b.kind), w: b.moon ? 1 : 3 }); });
    Object.keys(OBS.SURFACE || {}).forEach(function (bid) {
      (OBS.SURFACE[bid].sites || []).forEach(function (x) {
        index.push({ name: x.name, sub: (OBS.SITE_TYPES[x.type] || 'Lieu') + ' · ' + OBS.byId[bid].name + (x.date ? ' · ' + x.date : ''), href: '#/explorer/' + bid + '/' + x.id, key: norm(x.name + ' ' + (OBS.SITE_TYPES[x.type] || '') + ' ' + OBS.byId[bid].name), w: 1 });
      });
    });
    (OBS.CRAFT || []).forEach(function (c) { index.push({ name: c.name, sub: c.kind, href: '#/explorer/' + c.id, key: norm(c.name + ' ' + (c.short || '') + ' ' + c.kind + ' ' + (CRAFT_ALIAS[c.id] || '') + ' sonde engin mission'), w: 2 }); });
    OBS.REGIONS.forEach(function (r) { index.push({ name: r.name, sub: r.kind, href: '#/explorer/' + r.id, key: norm(r.name + ' ' + (ALIAS[r.id] || '') + ' ' + r.kind), w: 2 }); });
    OBS.STARS.forEach(function (s) {
      index.push({ name: s.name, sub: (s.cls === 'BD' ? 'Naine brune' : 'Étoile') + ' · ' + s.ly.toLocaleString('fr-FR') + ' al · ' + (s.cons || ''), href: '#/etoile/' + s.id, key: norm(s.name + ' ' + (ALIAS[s.id] || '') + ' ' + s.spec + ' ' + (s.cons || '') + ' etoile star'), w: 2 });
      (s.sys || []).forEach(function (p) { index.push({ name: p.n, sub: 'Exoplanète · système de ' + s.name, href: '#/etoile/' + s.id, key: norm(p.n + ' exoplanete planete ' + s.name), w: 1 }); });
      if (s.comp) index.push({ name: s.comp.n, sub: 'Étoile compagne · ' + s.name, href: '#/etoile/' + s.id, key: norm(s.comp.n + ' ' + s.name), w: 1 });
    });
    [['Atlas', 'Cartes et listes de tous les objets', '#/atlas', 'atlas carte liste index'], ['Unités', 'UA, année-lumière, parsec… les repères de l\'astronomie', '#/atlas/systeme/unites', 'unites ua annee lumiere parsec al km'],
     ['Méthode', 'Ce qui est réel, adapté ou simulé ; sources et crédits', '#/methode', 'methode sources credits licences'], ['Simulateur', 'Modeler un corps céleste', '#/simulateur', 'simulateur modeler'],
     ['Hypothèses', 'Pistes de réflexion personnelles', '#/hypotheses', 'hypotheses idees']].forEach(function (p) { index.push({ name: p[0], sub: p[1], href: p[2], key: norm(p[0] + ' ' + p[3]), w: 2, page: true }); });
    if (OBS.hypo) OBS.hypo.list().then(function (l) { (l || []).forEach(function (h) { index.push({ name: h.titre, sub: 'Hypothèse personnelle', href: '#/hypotheses/' + encodeURIComponent(h.id), key: norm(h.titre + ' ' + (h.resume || '') + ' hypothese'), w: 1, hypo: true }); }); });
  }
  function find(q) {
    var n = norm(q); if (!n) return [];
    var words = n.split(' ');
    return index.map(function (e) {
      var nameN = norm(e.name), score = 0;
      if (nameN === n) score = 100; else if (nameN.indexOf(n) === 0) score = 60; else if ((' ' + nameN).indexOf(' ' + n) >= 0) score = 45;
      else if (words.every(function (w) { return e.key.indexOf(w) >= 0; })) score = 20;
      return score ? { e: e, s: score + e.w } : null;
    }).filter(Boolean).sort(function (a, b) { return b.s - a.s || a.e.name.localeCompare(b.e.name, 'fr'); }).slice(0, 9).map(function (r) { return r.e; });
  }

  /* interface */
  var btn = document.getElementById('search-btn'), box = document.getElementById('search'), input = document.getElementById('search-input'), list = document.getElementById('search-results');
  var results = [], cur = 0;
  function open() { if (!index) build(); box.hidden = false; input.value = ''; draw(); setTimeout(function () { input.focus(); }, 20); btn.setAttribute('aria-expanded', 'true'); }
  function close() { box.hidden = true; btn.setAttribute('aria-expanded', 'false'); }
  function draw() {
    var q = input.value; results = find(q); cur = 0;
    if (!q.trim()) { list.innerHTML = '<li class="s-hint">Un astre, une lune, une étoile, une sonde… par exemple <b>Titan</b>, <b>Proxima</b> ou <b>Voyager</b>.</li>'; return; }
    if (!results.length) { list.innerHTML = '<li class="s-hint">Aucun objet ne correspond. L\'Observatoire ne montre que des objets réels : il n\'y a peut-être pas encore de fiche pour celui-ci.</li>'; return; }
    list.innerHTML = results.map(function (r, i) {
      return '<li role="option" aria-selected="' + (i === cur) + '"><a href="' + r.href + '" class="' + (r.hypo ? 's-hypo' : r.page ? 's-page' : '') + '"><b>' + esc(r.name) + '</b><small>' + esc(r.sub || '') + '</small></a></li>';
    }).join('');
  }
  function move(d) { if (!results.length) return; cur = (cur + d + results.length) % results.length; Array.prototype.forEach.call(list.querySelectorAll('li[role=option]'), function (li, i) { li.setAttribute('aria-selected', String(i === cur)); if (i === cur) li.scrollIntoView({ block: 'nearest' }); }); }
  btn.addEventListener('click', function () { if (box.hidden) open(); else close(); });
  input.addEventListener('input', draw);
  input.addEventListener('keydown', function (e) {
    if (e.key === 'ArrowDown') { e.preventDefault(); move(1); }
    else if (e.key === 'ArrowUp') { e.preventDefault(); move(-1); }
    else if (e.key === 'Enter' && results[cur]) { e.preventDefault(); go(results[cur].href); }
    else if (e.key === 'Escape') { e.stopPropagation(); close(); }
  });
  function go(href) { close(); if (location.hash === href) window.dispatchEvent(new HashChangeEvent('hashchange')); else location.hash = href; }
  list.addEventListener('click', function (e) { var a = e.target.closest('a'); if (a) { e.preventDefault(); go(a.getAttribute('href')); } });
  document.addEventListener('keydown', function (e) {
    var typing = /input|textarea|select/i.test((e.target && e.target.tagName) || '');
    if ((e.key === '/' && !typing) || ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k')) { e.preventDefault(); open(); }
  });
  document.addEventListener('pointerdown', function (e) { if (!box.hidden && !box.contains(e.target) && !btn.contains(e.target)) close(); });
})();

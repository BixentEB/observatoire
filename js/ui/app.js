/* ======================================================================
   OBSERVATOIRE — application : démarrage, navigation, temps, réglages
   Adresses :
     #/                      exploration (système solaire)
     #/explorer/<objet>      un objet du système solaire
     #/voisinage[/<étoile>]  le voisinage stellaire
     #/atlas[/<portée>[/carte|liste]]  #/hypotheses[/<fiche>]  #/simulateur  #/methode  #/credits
   ====================================================================== */
(function () {
  'use strict';
  var OBS = window.OBS, $ = function (id) { return document.getElementById(id); };
  var boot = $('boot');

  function fail(msg) { boot.classList.add('fail'); boot.lastElementChild.textContent = msg; }

  /* ---------- démarrage du moteur ---------- */
  try {
    OBS.engine.init($('stage'));
  } catch (e) {
    console.error(e);
    fail('Votre navigateur ne permet pas d\'afficher la 3D (WebGL indisponible). Les pages Index, Hypothèses et Méthode restent consultables.');
  }
  var ok = !!OBS.engine.renderer;
  if (ok) {
    OBS.system.build(OBS.engine.renderer, $('labels-systeme'));
    OBS.neighborhood.build(OBS.engine.renderer, $('labels-voisinage'));
    OBS.starsystem.build(OBS.engine.renderer, $('labels-etoile'));
    OBS.engine.add(OBS.system); OBS.engine.add(OBS.neighborhood); OBS.engine.add(OBS.starsystem);
    OBS.on('ready', function () { setTimeout(function () { boot.classList.add('done'); }, 150); setTimeout(function () { boot.hidden = true; }, 1100); });
  }

  /* ---------- navigation ---------- */
  var PAGES = { atlas: 1, hypotheses: 1, simulateur: 1, methode: 1, credits: 1 };
  var silent = false;
  function parse() {
    var h = location.hash.replace(/^#\/?/, '').split('/').map(decodeURIComponent);
    var name = h[0] || 'explorer';
    if (name === 'index') name = 'atlas';
    return { name: name, param: h[1] || null, sub: h[2] || null };
  }
  function route() {
    if (silent) { silent = false; return; }
    var r = parse();
    closeMenu();
    Array.prototype.forEach.call(document.querySelectorAll('#menu a[data-route]'), function (a) {
      var rt = a.getAttribute('data-route');
      var on = rt === r.name || (r.name === 'voisinage' && rt === 'explorer') || (r.name === 'credits' && rt === 'methode') || (r.name === 'simulateur' && rt === 'hypotheses');
      if (on) a.setAttribute('aria-current', 'page'); else a.removeAttribute('aria-current');
    });
    if (PAGES[r.name]) { openPage(r.name, r.param, r.sub); return; }
    closePage();
    if (!ok) return;
    if (r.name === 'etoile' && r.param && OBS.neighborhood.get(r.param)) {
      var cur = OBS.starsystem.star();
      if (OBS.engine.level === OBS.starsystem && cur && cur.id === r.param) return;
      OBS.engine.go('etoile', { star: r.param, instant: !OBS.engine.level });
    }
    else if (r.name === 'voisinage') OBS.engine.go('voisinage', { focus: r.param && OBS.neighborhood.get(r.param) ? r.param : undefined });
    else {
      var id = r.name === 'explorer' && r.param && OBS.byId[r.param] ? r.param : null;
      var site = id && r.sub && OBS.SURFACE && OBS.SURFACE[id] ? r.sub : null;
      if (OBS.engine.level !== OBS.system) {
        OBS.engine.go('systeme', { focus: id, instant: !OBS.engine.level });
        if (site) setTimeout(function () { OBS.system.site(id, site); }, OBS.engine.level ? 2600 : 900);
      }
      else if (site) { if (site !== OBS.system.siteSelected() || id !== OBS.system.selected()) OBS.system.site(id, site); }
      else if (id !== OBS.system.selected() || OBS.system.siteSelected()) OBS.system.select(id);
    }
  }
  function setHash(h) { if (location.hash === h || (h === '#/' && !location.hash)) return; silent = true; history.replaceState(null, '', h); silent = false; }
  OBS.on('select', function (e) {
    if (PAGES[parse().name]) return;
    if (e.level === 'etoile') { setHash('#/etoile/' + e.id); return; }
    if (e.level === 'systeme') setHash(e.id ? '#/explorer/' + e.id + (e.site ? '/' + e.site : '') : '#/');
    else setHash(e.id ? '#/voisinage/' + e.id : '#/');   // le voisinage n'est pas une adresse d'arrivée : un rechargement ramène au système solaire
  });

  var page = $('page'), pageInner = $('page-inner');
  function openPage(name, param, sub) {
    OBS.emit('page', name);
    page.hidden = false; document.body.classList.add('page-open');
    pageInner.innerHTML = ''; page.querySelector('.page-scroll').scrollTop = 0;
    OBS.pages[name](pageInner, param, sub);
    pageInner.style.animation = 'none'; void pageInner.offsetWidth; pageInner.style.animation = '';
    var h1 = pageInner.querySelector('h1'); document.title = (h1 ? h1.textContent + ' · ' : '') + 'Observatoire · Codex Mental';
  }
  function closePage() {
    if (page.hidden) return;
    OBS.emit('page', null);
    page.hidden = true; document.body.classList.remove('page-open'); pageInner.innerHTML = '';
    document.title = 'Observatoire · Codex Mental';
  }
  window.addEventListener('hashchange', route);
  document.addEventListener('keydown', function (e) {
    if (e.key !== 'Escape') return;
    if (!$('settings').hidden) { toggleSettings(false); return; }
    if (!page.hidden) { location.hash = '#/'; return; }
    var L = OBS.engine.level;
    if (L === OBS.system && L.siteSelected()) { L.select(L.selected()); return; }      // d'un lieu, on remonte à l'astre
    if (L === OBS.system && L.selected() && !L.sysView() && L.hasMoons(L.selected())) { L.select(L.selected()); return; }   // de près, on recule d'abord à la vue du système
    if (L && L.selected && L.selected()) { var cur = L.selected(), d = OBS.byId[cur]; L.select(L === OBS.system && d && d.moon ? d.parent : null); }
  });

  /* menu (petits écrans) */
  var menuBtn = $('menu-btn'), menu = $('menu');
  function closeMenu() { menu.classList.remove('open'); menuBtn.setAttribute('aria-expanded', 'false'); }
  menuBtn.addEventListener('click', function () { var o = !menu.classList.contains('open'); menu.classList.toggle('open', o); menuBtn.setAttribute('aria-expanded', String(o)); });
  document.addEventListener('pointerdown', function (e) { if (!menu.contains(e.target) && e.target !== menuBtn && !menuBtn.contains(e.target)) closeMenu(); });

  /* ---------- fil d'Ariane ---------- */
  var crumbs = $('crumbs');
  function renderCrumbs() {
    var L = OBS.engine.level; if (!L) return;
    var items = [];
    // niveaux au-dessus du niveau actuel (on peut y remonter d'un clic)
    items.push({ label: 'Voie lactée', soon: true });
    if (L === OBS.system) items.push({ label: 'Voisinage stellaire', act: function () { OBS.engine.go('voisinage', { from: 'systeme' }); } });
    if (L === OBS.neighborhood && L.selected()) { var sid = L.selected(); items = items.concat(L.crumbs()); items.push({ label: '↓ Visiter ce système', down: true, act: function () { OBS.engine.go('etoile', { star: sid }); } }); items.push({ label: '↓ Système solaire', down: true, act: function () { OBS.engine.go('systeme', { from: 'voisinage' }); } }); render(items); return; }
    items = items.concat(L.crumbs());
    if (L === OBS.neighborhood) items.push({ label: '↓ Entrer dans le système solaire', down: true, act: function () { OBS.engine.go('systeme', { from: 'voisinage' }); } });
    render(items);
  }
  function render(items) {
    crumbs.innerHTML = '';
    items.forEach(function (c, i) {
      if (i && !c.down) { var s = document.createElement('span'); s.className = 'sep'; s.textContent = '›'; crumbs.appendChild(s); }
      var b = document.createElement('button'); b.type = 'button'; b.textContent = c.label;
      if (c.soon) { b.className = 'c-soon'; b.title = 'Niveau en préparation'; }
      else if (c.current) b.setAttribute('aria-current', 'location');
      else if (c.act) b.addEventListener('click', c.act);
      if (c.down) b.className = 'c-down';
      crumbs.appendChild(b);
    });
  }
  OBS.on('crumbs', renderCrumbs); OBS.on('level', function () { setTimeout(renderCrumbs, 0); });

  /* titre du niveau, au changement */
  var title = $('level-title'), titleT = 0, firstLevel = true;
  OBS.on('level', function (L) {
    $('timebar').hidden = L.id === 'voisinage'; $('scale-badge').hidden = L.id !== 'systeme';
    $('size-badge').textContent = L.id === 'voisinage' ? 'Tailles des étoiles symboliques' : 'Tailles agrandies';
    toggleSettings(false);
    if (firstLevel) { firstLevel = false; return; }
    if (L.id === 'etoile') { var st = OBS.starsystem.star(); title.innerHTML = '<b>' + OBS.esc(st ? st.name : '') + '</b><span>' + (st && st.sys ? st.sys.length + (st.sys.length > 1 ? ' planètes confirmées' : ' planète confirmée') : 'Aucune planète confirmée') + ' · à ' + (st ? st.ly.toLocaleString('fr-FR') : '') + ' années-lumière</span>'; title.classList.add('on'); clearTimeout(titleT); titleT = setTimeout(function () { title.classList.remove('on'); }, 2400); return; }
    var sub = L.id === 'voisinage' ? 'Les étoiles à moins de 12 années-lumière' : 'Positions réelles du ' + OBS.astro.dateFromJd(OBS.time.jd).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' });
    title.innerHTML = '<b>' + L.label + '</b><span>' + sub + '</span>';
    title.classList.add('on'); clearTimeout(titleT); titleT = setTimeout(function () { title.classList.remove('on'); }, 2200);
  });
  var edge = $('edge'), edgeT = 0;
  OBS.on('edge', function (k) { edge.hidden = false; clearTimeout(edgeT); edgeT = setTimeout(function () { edge.hidden = true; }, 1400); });
  OBS.on('level:leaving', function () { edge.hidden = true; });

  /* ---------- temps ---------- */
  var tDate = $('t-date'), tSpeed = $('t-speed'), tPlay = $('t-play');
  function renderTime() {
    var t = OBS.time, d = OBS.astro.dateFromJd(t.jd);
    var fast = Math.abs(t.rate) >= 1;
    tDate.textContent = d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' }) + (fast ? '' : ' · ' + d.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit', second: t.speed === 0 ? '2-digit' : undefined }));
    var live = t.isLive;
    tSpeed.textContent = t.paused ? 'En pause' : live ? 'Temps réel' : (t.dir < 0 ? '◂ ' : '') + t.SPEEDS[t.speed].label + (t.speed === 0 ? ' (date décalée)' : '');
    $('t-now').classList.toggle('is-live', live);
    $('t-now').querySelector('.live-txt').textContent = live ? 'En direct' : 'Temps réel';
    tPlay.textContent = t.paused ? '▶' : '❚❚';
    tPlay.setAttribute('aria-label', t.paused ? 'Lecture' : 'Pause');
    $('t-rev').classList.toggle('on', t.dir < 0);
  }
  $('t-play').addEventListener('click', function () { OBS.time.toggle(); });
  $('t-slow').addEventListener('click', function () { OBS.time.setSpeed(OBS.time.speed - 1); });
  $('t-fast').addEventListener('click', function () { OBS.time.setSpeed(OBS.time.speed + 1); });
  $('t-rev').addEventListener('click', function () { OBS.time.reverse(); });
  $('t-now').addEventListener('click', function () { OBS.time.live(); });
  OBS.on('time', renderTime);
  setInterval(renderTime, 250); renderTime();

  /* ---------- réglages et repères d'échelle ---------- */
  var settings = $('settings'), sBtn = $('settings-btn');
  function toggleSettings(open) { settings.hidden = !open; sBtn.setAttribute('aria-expanded', String(open)); sBtn.classList.toggle('on', open); }
  sBtn.addEventListener('click', function () { toggleSettings(settings.hidden); });
  document.addEventListener('pointerdown', function (e) { if (!settings.hidden && !settings.contains(e.target) && e.target !== sBtn) toggleSettings(false); });

  function get(k) { try { return localStorage.getItem(k); } catch (e) { return null; } }
  function set(k, v) { try { localStorage.setItem(k, v); } catch (e) {} }
  var sScale = $('s-scale'), sOrbits = $('s-orbits'), sLabels = $('s-labels'), sQ = $('s-quality');
  function renderScale() {
    var real = OBS.system.scale.mode === 'reelle';
    $('scale-badge').textContent = real ? 'Distances réelles' : 'Échelle adaptée';
    $('scale-badge').title = real ? 'Les distances sont proportionnelles. Cliquer pour revenir à l\'échelle adaptée.' : 'Les distances sont compressées pour que tout tienne à l\'écran. Cliquer pour passer aux distances réelles.';
    sScale.value = OBS.system.scale.mode;
  }
  if (ok) {
    sScale.addEventListener('change', function () { OBS.system.setScale(sScale.value); });
    $('scale-badge').addEventListener('click', function () { OBS.system.setScale(OBS.system.scale.mode === 'reelle' ? 'adaptee' : 'reelle'); });
    OBS.on('scale', renderScale);
    sOrbits.checked = get('obs.orbits') !== '0'; OBS.system.setOrbits(sOrbits.checked);
    sOrbits.addEventListener('change', function () { OBS.system.setOrbits(sOrbits.checked); set('obs.orbits', sOrbits.checked ? '1' : '0'); });
    sLabels.value = get('obs.labels') || 'all'; OBS.system.setLabels(sLabels.value);
    sLabels.addEventListener('change', function () { OBS.system.setLabels(sLabels.value); set('obs.labels', sLabels.value); });
  }
  renderScale();
  sQ.value = OBS.perf.pref;
  $('s-quality-note').textContent = 'Qualité actuelle : ' + OBS.perf.LEVELS[OBS.perf.tier].label.toLowerCase() + (OBS.perf.pref === 'auto' ? ' (choisie d\'après votre appareil).' : '.');
  sQ.addEventListener('change', function () {
    $('s-quality-note').textContent = 'La scène va se reconstruire avec cette qualité : cela prend quelques secondes.';
    setTimeout(function () { OBS.perf.setPref(sQ.value); }, 900);
  });

  /* ---------- c'est parti ---------- */
  if (ok && OBS.perf.demo && OBS.demo) { OBS.demo(); return; }
  if (ok) {
    route();
    if (!OBS.engine.level) OBS.engine.go('systeme', { instant: true });
    OBS.engine.start();
  } else route();
})();

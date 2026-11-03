/* ======================================================================
   OBSERVATOIRE — application : démarrage, navigation, temps, réglages
   Adresses :
     #/                      exploration (système solaire)
     #/explorer/<objet>      un objet du système solaire
     #/voisinage[/<étoile>]  le voisinage stellaire
     #/atlas[/<portée>[/carte|liste|unites]]  #/outils  #/lexique[/<thème>[/<terme>]]  #/simulateur  #/hypotheses[/<fiche>]  #/methode  #/credits
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
    OBS.galaxy.build(OBS.engine.renderer, $('labels-galaxie'));
    OBS.localgroup.build(OBS.engine.renderer, $('labels-groupe-local'));
    OBS.engine.add(OBS.system); OBS.engine.add(OBS.neighborhood); OBS.engine.add(OBS.starsystem); OBS.engine.add(OBS.galaxy); OBS.engine.add(OBS.localgroup);
    OBS.on('ready', function () { setTimeout(function () { boot.classList.add('done'); }, 150); setTimeout(function () { boot.hidden = true; }, 1100); });
  }

  /* ---------- navigation ---------- */
  var PAGES = { atlas: 1, outils: 1, lexique: 1, hypotheses: 1, simulateur: 1, methode: 1, credits: 1, projet: 1 };
  var silent = false;
  function parse() {
    var h = location.hash.replace(/^#\/?/, '').split('/').map(decodeURIComponent);
    var name = h[0] || 'explorer';
    if (name === 'index') name = 'atlas';
    return { name: name, param: h[1] || null, sub: h[2] || null };
  }
  var prevHash = '', returnTo = null;   // venu d'une page (Atlas…) : un bouton du fil d'Ariane permet d'y retourner
  var PAGE_NAMES = { atlas: 'l\'Atlas', lexique: 'le Lexique', hypotheses: 'Hypothèses', simulateur: 'Simulateur', outils: 'Outils', methode: 'Méthode', credits: 'Méthode', projet: 'Le projet' };
  function route() {
    if (silent) { silent = false; return; }
    var r = parse();
    var prevName = prevHash.replace(/^#\/?/, '').split('/')[0];
    if (PAGES[r.name]) returnTo = null;
    else if (PAGES[prevName]) { returnTo = { hash: prevHash, name: PAGE_NAMES[prevName] || 'la page' }; setTimeout(renderCrumbs, 0); }
    prevHash = location.hash;
    closeMenu();
    Array.prototype.forEach.call(document.querySelectorAll('#menu a[data-route]'), function (a) {
      var rt = a.getAttribute('data-route');
      var on = rt === r.name || (r.name === 'voisinage' && rt === 'explorer') || ((r.name === 'credits' || r.name === 'projet') && rt === 'methode') || ((r.name === 'simulateur' || r.name === 'lexique') && rt === 'outils');
      if (on) a.setAttribute('aria-current', 'page'); else a.removeAttribute('aria-current');
    });
    if (PAGES[r.name]) { openPage(r.name, r.param, r.sub); return; }
    closePage();
    lastScene = location.hash || '#/';
    if (!ok) return;
    if (r.name === 'etoile' && r.param && (OBS.neighborhood.get(r.param) || (OBS.exoById && OBS.exoById[r.param]))) {
      var cur = OBS.starsystem.star();
      if (OBS.engine.level === OBS.starsystem && cur && cur.id === r.param) return;
      OBS.engine.go('etoile', { star: r.param, instant: !OBS.engine.level });
    }
    else if (r.name === 'groupe-local') OBS.engine.go('groupe-local', { focus: r.param && OBS.localgroup.get(r.param) ? r.param : undefined, instant: !OBS.engine.level });
    else if (r.name === 'galaxie') OBS.engine.go('galaxie', { focus: r.param && OBS.galaxy.get(r.param) ? r.param : undefined, instant: !OBS.engine.level });
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
  var lastScene = '#/';                 // dernière adresse de la scène : une page fermée y ramène (Voie lactée comprise)
  function backToScene() { location.hash = lastScene; }
  function setHash(h) { if (!PAGES[parse().name]) lastScene = h; if (location.hash === h || (h === '#/' && !location.hash)) return; silent = true; history.replaceState(null, '', h); silent = false; }
  OBS.on('select', function (e) {
    if (PAGES[parse().name]) return;
    if (e.level === 'etoile') { setHash('#/etoile/' + e.id); return; }
    if (e.level === 'groupe-local') { setHash('#/groupe-local' + (e.id ? '/' + e.id : '')); return; }
    if (e.level === 'galaxie') { setHash('#/galaxie' + (e.id ? '/' + e.id : '')); return; }
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
  document.querySelector('.page-close').addEventListener('click', function (e) { e.preventDefault(); backToScene(); });
  document.addEventListener('keydown', function (e) {
    if (e.key !== 'Escape') return;
    if (!$('settings').hidden) { toggleSettings(false); return; }
    if (!$('photo').hidden) { OBS.photo.close(); return; }
    if (!page.hidden) { backToScene(); return; }
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
    if (L === OBS.localgroup) {
      items = L.crumbs();
      if (L.selected() === 'voielactee') items.push({ label: '↓ Entrer dans la Voie lactée', down: true, act: function () { OBS.engine.go('galaxie', { from: 'groupe-local' }); } });
      render(items); return;
    }
    items.push({ label: 'Groupe local', act: function () { OBS.engine.go('groupe-local', {}); } });
    if (L === OBS.galaxy) {
      items = items.concat(L.crumbs());
      if (L.selected() === 'soleil-g') items.push({ label: '↓ Voisinage stellaire', down: true, act: function () { OBS.engine.go('voisinage', { from: 'galaxie' }); } });
      render(items); return;
    }
    var exoSt = L === OBS.starsystem && OBS.starsystem.star() && OBS.starsystem.star().exo;
    items.push({ label: 'Voie lactée', act: function () { OBS.engine.go('galaxie', exoSt ? { focus: exoSt ? OBS.starsystem.star().id : undefined } : { from: L === OBS.neighborhood ? 'voisinage' : 'haut' }); } });
    if (L === OBS.system) items.push({ label: 'Voisinage stellaire', act: function () { OBS.engine.go('voisinage', { from: 'systeme' }); } });
    if (L === OBS.neighborhood && L.selected()) {
      var sid = L.selected(); items = items.concat(L.crumbs());
      if (sid !== 'soleil-v') items.push({ label: '↓ Visiter ce système', down: true, act: function () { OBS.engine.go('etoile', { star: sid }); } });
      items.push({ label: sid === 'soleil-v' ? '↓ Entrer dans le système solaire' : '↓ Système solaire', down: true, act: function () { OBS.engine.go('systeme', { from: 'voisinage' }); } });
      render(items); return;
    }
    items = items.concat(L.crumbs());
    if (L === OBS.neighborhood) items.push({ label: '↓ Entrer dans le système solaire', down: true, act: function () { OBS.engine.go('systeme', { from: 'voisinage' }); } });
    render(items);
  }
  /* menu « Aller vers… » : tous les niveaux, et quelques destinations du niveau actuel */
  var gotoEl = $('goto');
  function gotoItems() {
    var L = OBS.engine.level, out = [];
    var levels = [['groupe-local', 'Groupe local', 'Andromède, le Triangle, les galaxies naines'], ['galaxie', 'Voie lactée', 'Notre galaxie, reconstituée'], ['voisinage', 'Voisinage stellaire', 'Les étoiles à moins de 12 al'], ['systeme', 'Système solaire', 'Le Soleil, les planètes, les sondes']];
    out.push({ h: 'Niveaux' });
    levels.forEach(function (l) { out.push({ label: l[1], sub: l[2], cur: L && L.id === l[0], act: function () { location.hash = l[0] === 'systeme' ? '#/' : '#/' + l[0]; } }); });
    var here = [];
    if (L === OBS.galaxy) { here = [['sgra', 'Centre galactique'], ['soleil-g', 'Le Soleil']].concat((OBS.EXOSYS || []).slice(0, 6).map(function (x) { return [x.id, x.name, 'exoplanètes · ' + x.ly.toLocaleString('fr-FR') + ' al']; })); here = here.map(function (x) { return { label: x[1], sub: x[2], act: function () { location.hash = '#/galaxie/' + x[0]; } }; }); }
    else if (L === OBS.localgroup) here = ['m31', 'm33', 'lg-gnm', 'm32'].map(function (id) { return { label: OBS.localgroup.get(id).def.name, act: function () { location.hash = '#/groupe-local/' + id; } }; });
    else if (L === OBS.neighborhood) here = OBS.STARS.slice(0, 6).map(function (s) { return { label: s.name, sub: s.ly.toLocaleString('fr-FR') + ' al', act: function () { location.hash = '#/voisinage/' + s.id; } }; });
    else if (L === OBS.system) here = ['terre', 'lune', 'mars', 'jupiter', 'saturne'].map(function (id) { return { label: OBS.byId[id].name, act: function () { location.hash = '#/explorer/' + id; } }; });
    if (here.length) { out.push({ h: 'Dans ce niveau' }); out = out.concat(here); }
    out.push({ label: 'Tout l\'Atlas →', act: function () { location.hash = '#/atlas'; } });
    return out;
  }
  function openGoto(btn) {
    if (!gotoEl.hidden) { gotoEl.hidden = true; return; }
    gotoEl.innerHTML = '';
    gotoItems().forEach(function (it) {
      if (it.h) { var h = document.createElement('h4'); h.textContent = it.h; gotoEl.appendChild(h); return; }
      var b = document.createElement('button'); b.type = 'button'; b.innerHTML = OBS.esc(it.label) + (it.sub ? '<small>' + OBS.esc(it.sub) + '</small>' : '');
      if (it.cur) b.setAttribute('aria-current', 'true');
      b.addEventListener('click', function () { gotoEl.hidden = true; it.act(); }); gotoEl.appendChild(b);
    });
    var r = btn.getBoundingClientRect(); gotoEl.style.left = Math.min(r.left, window.innerWidth - 310) + 'px'; gotoEl.style.top = (r.bottom + 6) + 'px'; gotoEl.hidden = false;
  }
  document.addEventListener('pointerdown', function (e) { if (!gotoEl.hidden && !gotoEl.contains(e.target) && !e.target.closest('.c-goto')) gotoEl.hidden = true; });
  function render(items) {
    items = items.concat([{ label: 'Aller vers… ▾', goto: true }]);
    if (returnTo) items.unshift({ label: '← Retour à ' + returnTo.name, back: true });
    crumbs.innerHTML = '';
    items.forEach(function (c, i) {
      if (i && !c.down && !c.goto && !items[i - 1].back) { var s = document.createElement('span'); s.className = 'sep'; s.textContent = '›'; crumbs.appendChild(s); }
      var b = document.createElement('button'); b.type = 'button'; b.textContent = c.label;
      if (c.soon) { b.className = 'c-soon'; b.title = 'Niveau en préparation'; }
      else if (c.current) b.setAttribute('aria-current', 'location');
      else if (c.act) b.addEventListener('click', c.act);
      if (c.down) b.className = 'c-down';
      if (c.back) { b.className = 'c-back'; b.addEventListener('click', function () { var h = returnTo.hash; returnTo = null; location.hash = h; }); }
      if (c.goto) { b.className = 'c-goto'; b.addEventListener('click', function () { openGoto(b); }); }
      crumbs.appendChild(b);
    });
  }
  OBS.on('crumbs', renderCrumbs); OBS.on('level', function () { setTimeout(renderCrumbs, 0); });

  /* titre du niveau, au changement */
  var title = $('level-title'), titleT = 0, firstLevel = true;
  OBS.on('level', function (L) {
    $('timebar').hidden = L.id === 'voisinage' || L.id === 'galaxie' || L.id === 'groupe-local'; $('scale-badge').hidden = L.id !== 'systeme'; $('views').hidden = L.id !== 'systeme';
    legendView();
    sizeBadgeView(L);
    capView(L);
    if (false) $('size-badge').textContent = L.id === 'voisinage' ? 'Tailles des étoiles symboliques' : L.id === 'galaxie' ? 'Reconstitution' : L.id === 'groupe-local' ? 'Positions mesurées · aspect reconstitué' : 'Tailles agrandies';
    $('size-badge').title = L.id === 'galaxie' ? 'Personne n\'a jamais vu la Voie lactée de l\'extérieur : forme reconstituée d\'après les mesures (voir Méthode). Les objets repères sont à leurs positions mesurées.' : '';
    toggleSettings(false);
    if (firstLevel) { firstLevel = false; return; }
    if (L.id === 'etoile') { var st = OBS.starsystem.star(); title.innerHTML = '<b>' + OBS.esc(st ? st.name : '') + '</b><span>' + (st && st.sys ? st.sys.length + (st.sys.length > 1 ? ' planètes confirmées' : ' planète confirmée') : 'Aucune planète confirmée') + ' · à ' + (st ? st.ly.toLocaleString('fr-FR') : '') + ' années-lumière</span>'; title.classList.add('on'); clearTimeout(titleT); titleT = setTimeout(function () { title.classList.remove('on'); }, 2400); return; }
    var sub = L.id === 'voisinage' ? 'Les étoiles à moins de 12 années-lumière' : L.id === 'galaxie' ? 'Une reconstitution fondée sur les mesures · 100 000 années-lumière de diamètre' : L.id === 'groupe-local' ? 'Andromède, le Triangle et les principales galaxies naines · plus de 80 galaxies connues' : 'Positions réelles du ' + OBS.astro.dateFromJd(OBS.time.jd).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' });
    title.innerHTML = '<b>' + L.label + '</b><span>' + sub + '</span>';
    title.classList.add('on'); clearTimeout(titleT); titleT = setTimeout(function () { title.classList.remove('on'); }, 2200);
  });
  /* badge du bas : dans la Voie lactée, il bascule le mode « mesuré / reconstitué » */
  function sizeBadgeView(L) {
    var b = $('size-badge'), gal = L && L.id === 'galaxie';
    b.classList.toggle('badge-quiet', !gal); b.classList.toggle('on', gal && !!OBS.galaxy.unc);
    b.textContent = !L ? '' : L.id === 'voisinage' ? 'Tailles des étoiles symboliques' : gal ? (OBS.galaxy.unc ? 'Bras : mesuré en clair · extrapolé en gris' : 'Reconstitution · voir ce qui est mesuré') : L.id === 'groupe-local' ? 'Positions mesurées · aspect reconstitué' : 'Tailles agrandies';
    b.title = gal ? 'Personne n\'a jamais vu la Voie lactée de l\'extérieur. Cliquer pour distinguer les portions de bras mesurées (masers) de celles qui sont prolongées.' : '';
  }
  $('size-badge').addEventListener('click', function () { if (OBS.engine.level === OBS.galaxy) OBS.galaxy.setUnc(!OBS.galaxy.unc); });
  OBS.on('unc', function () { sizeBadgeView(OBS.engine.level); });
  /* légende du niveau : reste lisible sous le fil d'Ariane après le titre d'arrivée */
  var cap = $('level-cap');
  function capView(L) {
    var t = { voisinage: 'Les étoiles à moins de 12 années-lumière · positions réelles', galaxie: 'Reconstitution fondée sur les mesures · 100 000 années-lumière de diamètre', 'groupe-local': (OBS.LOCALGROUP || []).length + ' galaxies sur plus de 80 connues · positions mesurées' }[L.id];
    cap.textContent = t || ''; cap.hidden = !t;
  }

  var edge = $('edge'), edgeT = 0;
  OBS.on('edge', function (k) {
    var lv = OBS.engine.level && OBS.engine.level.id;
    edge.textContent = 'Faites une courte pause, puis dézoomez encore pour sortir ' + (lv === 'voisinage' ? 'du voisinage stellaire' : lv === 'galaxie' ? 'de la Voie lactée' : 'du système solaire');
    edge.hidden = false; clearTimeout(edgeT); edgeT = setTimeout(function () { edge.hidden = true; }, 1400); });
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
    var sCraft = $('s-craft');
    sCraft.checked = get('obs.craft') !== '0'; OBS.system.setCraft(sCraft.checked);
    sCraft.addEventListener('change', function () { OBS.system.setCraft(sCraft.checked); set('obs.craft', sCraft.checked ? '1' : '0'); });
    var sBack = $('s-back'), sKeys = $('s-keys'), keys = $('keys');
    function keysView() { keys.hidden = !sKeys.checked; keys.querySelector('[data-k-back]').hidden = !sBack.checked; }
    sBack.checked = get('obs.back') !== '0'; OBS.system.setBack(sBack.checked);
    sBack.addEventListener('change', function () { OBS.system.setBack(sBack.checked); set('obs.back', sBack.checked ? '1' : '0'); keysView(); });
    sKeys.checked = get('obs.keys') !== '0';
    sKeys.addEventListener('change', function () { set('obs.keys', sKeys.checked ? '1' : '0'); keysView(); });
    keys.querySelector('.keys-x').addEventListener('click', function () { sKeys.checked = false; set('obs.keys', '0'); keysView(); });
    keysView();
    sLabels.value = get('obs.labels') || 'all'; OBS.system.setLabels(sLabels.value);
    sLabels.addEventListener('change', function () { OBS.system.setLabels(sLabels.value); set('obs.labels', sLabels.value); });

    /* plan de l'écliptique, inclinaison des orbites */
    var sEcl = $('s-ecl'), sIncl = $('s-incl');
    sEcl.checked = get('obs.ecl') === '1'; OBS.system.setEcliptic(sEcl.checked);
    sEcl.addEventListener('change', function () { OBS.system.setEcliptic(sEcl.checked); set('obs.ecl', sEcl.checked ? '1' : '0'); });
    sIncl.value = get('obs.incl') || 'off'; OBS.system.setIncl(sIncl.value);
    sIncl.addEventListener('change', function () { OBS.system.setIncl(sIncl.value); set('obs.incl', sIncl.value); });

    /* vues prédéfinies */
    var views = $('views');
    views.addEventListener('click', function (e) { var b = e.target.closest('[data-view]'); if (b) OBS.system.setView(b.getAttribute('data-view')); });
    OBS.on('view', function (k) { Array.prototype.forEach.call(views.querySelectorAll('[data-view]'), function (b) { b.setAttribute('aria-pressed', String(b.getAttribute('data-view') === k)); }); });

    /* légende : explique les symboles et masque ou réaffiche chaque famille d'objets */
    var legend = $('legend'), sLegend = $('s-legend');
    var LAYERS_SAVED = (function () { try { return JSON.parse(get('obs.layers') || '{}'); } catch (e) { return {}; } })();
    Object.keys(LAYERS_SAVED).forEach(function (k) { if (k !== 'missions') OBS.system.setLayer(k, !!LAYERS_SAVED[k]); });
    function renderLayers() {
      var ly = OBS.system.layers();
      Array.prototype.forEach.call(legend.querySelectorAll('[data-layer]'), function (b) {
        var on = ly[b.getAttribute('data-layer')] !== false; b.setAttribute('aria-pressed', String(on));
        b.title = on ? 'Cliquer pour masquer' : 'Cliquer pour réafficher';
      });
      sCraft.checked = ly.missions; sTheo.checked = ly.theoriques;
    }
    var sTheo = $('s-theo');
    sTheo.addEventListener('change', function () {
      OBS.system.setLayer('theoriques', sTheo.checked);
      var ly = OBS.system.layers(), keep = {}; Object.keys(ly).forEach(function (x) { if (x !== 'missions' && !ly[x]) keep[x] = false; });
      set('obs.layers', JSON.stringify(keep));
    });
    legend.addEventListener('click', function (e) {
      var b = e.target.closest('[data-layer]'); if (!b) return;
      var k = b.getAttribute('data-layer'), on = b.getAttribute('aria-pressed') !== 'true';
      if (k === 'missions') { set('obs.craft', on ? '1' : '0'); }
      OBS.system.setLayer(k, on);
      var ly = OBS.system.layers(), keep = {}; Object.keys(ly).forEach(function (x) { if (x !== 'missions' && !ly[x]) keep[x] = false; });
      set('obs.layers', JSON.stringify(keep));
    });
    OBS.on('layers', renderLayers); renderLayers();
    sLegend.checked = get('obs.legend') !== '0';
    sLegend.addEventListener('change', function () { set('obs.legend', sLegend.checked ? '1' : '0'); legendView(); });
    legend.querySelector('.legend-x').addEventListener('click', function () {
      sLegend.checked = false; set('obs.legend', '0'); legendView();
      toast('Légende masquée : vous pouvez la réafficher ou la masquer dans les <b>Réglages</b> ⚙');
    });
    legendView();
  }
  function legendView() {
    var L = OBS.engine.level, lg = $('legend');
    lg.hidden = !$('s-legend').checked || !L || L.id !== 'systeme';
    document.documentElement.style.setProperty('--legend-h', !lg.hidden && window.innerWidth <= 720 ? (lg.offsetHeight + 8) + 'px' : '0px');
  }
  window.addEventListener('resize', legendView);
  var toastT = 0;
  function toast(html) {
    var t = document.querySelector('.toast'); if (t) t.remove();
    t = document.createElement('div'); t.className = 'toast'; t.setAttribute('role', 'status'); t.innerHTML = html;
    document.body.appendChild(t); clearTimeout(toastT); toastT = setTimeout(function () { t.remove(); }, 5200);
  }
  OBS.toast = toast;
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

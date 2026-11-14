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
    OBS.volumelocal.build(OBS.engine.renderer, $('labels-volume-local'));
    OBS.superamas.build(OBS.engine.renderer, $('labels-superamas'));
    OBS.laniakea.build(OBS.engine.renderer, $('labels-laniakea'));
    OBS.engine.add(OBS.system); OBS.engine.add(OBS.neighborhood); OBS.engine.add(OBS.starsystem); OBS.engine.add(OBS.galaxy); OBS.engine.add(OBS.localgroup); OBS.engine.add(OBS.volumelocal); OBS.engine.add(OBS.superamas); OBS.engine.add(OBS.laniakea);
    OBS.on('ready', function () { setTimeout(function () { boot.classList.add('done'); }, 150); setTimeout(function () { boot.hidden = true; }, 1100); });
  }

  /* ---------- navigation ---------- */
  var PAGES = { atlas: 1, outils: 1, lexique: 1, hypotheses: 1, simulateur: 1, methode: 1, credits: 1, ressources: 1, projet: 1, lunaisons: 1, comparateur: 1 };
  var silent = false;
  function parse() {
    var h = location.hash.replace(/^#\/?/, '').split('/').map(decodeURIComponent);
    var name = h[0] || 'explorer';
    if (name === 'index') name = 'atlas';
    return { name: name, param: h[1] || null, sub: h[2] || null };
  }
  var prevHash = '', returnTo = null;   // venu d'une page (Atlas…) : un bouton du fil d'Ariane permet d'y retourner
  var PAGE_NAMES = { atlas: 'l\'Atlas', lexique: 'le Lexique', hypotheses: 'Hypothèses', simulateur: 'Simulateur', outils: 'Outils', methode: 'Méthode', credits: 'Méthode', ressources: 'Ressources', projet: 'Le projet', lunaisons: 'les Lunaisons', comparateur: 'le Comparateur' };
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
      var on = rt === r.name || (r.name === 'voisinage' && rt === 'explorer') || ((r.name === 'credits' || r.name === 'ressources' || r.name === 'projet') && rt === 'methode') || ((r.name === 'simulateur' || r.name === 'lexique') && rt === 'outils');
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
    else if (r.name === 'laniakea') OBS.engine.go('laniakea', { focus: r.param || undefined, instant: !OBS.engine.level });
    else if (r.name === 'superamas') OBS.engine.go('superamas', { focus: r.param || undefined, instant: !OBS.engine.level });
    else if (r.name === 'volume-local') OBS.engine.go('volume-local', { focus: r.param || undefined, instant: !OBS.engine.level });
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
    if (e.level === 'laniakea') { setHash('#/laniakea' + (e.id ? '/' + e.id : '')); return; }
    if (e.level === 'superamas') { setHash('#/superamas' + (e.id ? '/' + e.id : '')); return; }
    if (e.level === 'volume-local') { setHash('#/volume-local' + (e.id ? '/' + e.id : '')); return; }
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
  var GEAR = $('settings-btn');   // gardé à part : la rangée est vidée à chaque rendu
  function renderCrumbs() {
    if (GEAR && GEAR.parentNode === crumbs) crumbs.removeChild(GEAR);
    var L = OBS.engine.level; if (!L) return;
    // les niveaux eux-mêmes se choisissent sur la règle des échelles (js/ui/scenerule.js) ; le fil ne garde que le niveau affiché et l'objet choisi
    var items = L.crumbs();
    if (OBS.sceneRuleNarrow && OBS.sceneRuleNarrow()) {
      var names = ['Système solaire', 'Voisinage stellaire', 'Voie lactée', 'Groupe local', 'Volume local', 'Superamas local', 'Laniakea'];
      items = items.filter(function (c) { return names.indexOf(c.label) < 0; });   // déjà écrit dans la pastille de la règle
    }
    if (L === OBS.laniakea && L.selected() === L.homeId) items.push({ label: '↓ Entrer dans le Superamas local', down: true, act: function () { OBS.engine.go('superamas', { from: 'laniakea' }); } });
    if (L === OBS.superamas && L.selected() === L.homeId) items.push({ label: '↓ Entrer dans le Volume local', down: true, act: function () { OBS.engine.go('volume-local', { from: 'superamas' }); } });
    if (L === OBS.volumelocal && L.selected() === 'milkyway') items.push({ label: '↓ Entrer dans le Groupe local', down: true, act: function () { OBS.engine.go('groupe-local', { from: 'volume-local' }); } });
    if (L === OBS.localgroup && L.selected() === 'voielactee') items.push({ label: '↓ Entrer dans la Voie lactée', down: true, act: function () { OBS.engine.go('galaxie', { from: 'groupe-local' }); } });
    if (L === OBS.galaxy && L.selected() === 'soleil-g') items.push({ label: '↓ Voisinage stellaire', down: true, act: function () { OBS.engine.go('voisinage', { from: 'galaxie' }); } });
    if (L === OBS.neighborhood) {
      var sid = L.selected();
      if (sid && sid !== 'soleil-v') items.push({ label: '↓ Visiter ce système', down: true, act: function () { OBS.engine.go('etoile', { star: sid }); } });
      items.push({ label: sid && sid !== 'soleil-v' ? '↓ Système solaire' : '↓ Entrer dans le système solaire', down: true, act: function () { OBS.engine.go('systeme', { from: 'voisinage' }); } });
    }
    render(items);
  }
  /* menu « Aller vers… » : tous les niveaux, et quelques destinations du niveau actuel */
  var gotoEl = $('goto');
  function gotoItems() {
    var L = OBS.engine.level, z = OBS.sceneZone ? OBS.sceneZone() : (L && L.id), out = [], here = [];
    var lvl = OBS.scaleLevel && OBS.scaleLevel(z);
    function sys(id, sub) { var d = OBS.byId[id]; return d && { label: d.name, sub: sub, act: function () { location.hash = '#/explorer/' + id; } }; }
    if (z === 'galaxie') {
      here = (OBS.GALAXY_OBJECTS || []).map(function (o) { return { label: o.sun ? 'Le Soleil' : o.name, sub: o.sun ? 'vous êtes ici' : (o.ly ? o.ly.toLocaleString('fr-FR') + ' al' : ''), act: function () { location.hash = '#/galaxie/' + o.id; } }; });
      var ex = (OBS.EXOSYS || []).map(function (x) { return { label: x.name, sub: 'exoplanètes · ' + x.ly.toLocaleString('fr-FR') + ' al', act: function () { location.hash = '#/galaxie/' + x.id; } }; });
      if (ex.length) here = here.concat([{ h: 'Systèmes à exoplanètes' }]).concat(ex);
    }
    else if (z === 'laniakea') here = ['superamas-local', 'vierge', 'centaure', 'hydre', 'norma', 'persee', 'coma', 'shapley'].map(function (id) { var it = OBS.laniakea.get(id); return it && { label: it.name, sub: it.home ? 'vous êtes ici' : OBS.LK.dTxt(it.pos.length()), act: function () { location.hash = '#/laniakea/' + id; } }; }).filter(Boolean);
    else if (z === 'superamas') { var SC = OBS.SC; here = ['pgc2557', 'pgc41220', 'pgc32256', 'pgc28630', 'pgc13418', 'pgc43296', 'pgc31478'].map(function (id) { var it = OBS.superamas.get(id); return it && { label: it.name, sub: it.home ? 'vous êtes ici' : it.def.k + ' galaxies · ' + SC.dTxt(it.def.d), act: function () { location.hash = '#/superamas/' + id; } }; }).filter(Boolean); }
    else if (z === 'volume-local') here = [['milkyway', 'Groupe local', 'vous êtes ici'], ['m81', 'M81'], ['ngc5128', 'Centaurus A'], ['m83', 'M83'], ['ngc253', 'Galaxie du Sculpteur'], ['m101', 'M101'], ['ngc4594', 'Sombrero'], ['m51', 'Galaxie du Tourbillon']].filter(function (x) { return OBS.volumelocal.get ? !!OBS.volumelocal.get(x[0]) : true; }).map(function (x) { return { label: x[1], sub: x[2], act: function () { location.hash = '#/volume-local/' + x[0]; } }; });
    else if (z === 'groupe-local') here = (OBS.LOCALGROUP || []).filter(function (g) { return OBS.localgroup.get(g.id); }).slice(0, 14).map(function (g) { return { label: g.name, sub: g.home ? 'vous êtes ici' : (g.ly ? (g.ly / 1e6).toLocaleString('fr-FR', { maximumFractionDigits: 2 }) + ' M al' : ''), act: function () { location.hash = '#/groupe-local/' + g.id; } }; });
    else if (z === 'voisinage') here = OBS.STARS.map(function (s) { return { label: s.name, sub: s.ly.toLocaleString('fr-FR') + ' al', act: function () { location.hash = '#/voisinage/' + s.id; } }; });
    else {
      here = ['soleil', 'mercure', 'venus', 'terre', 'lune', 'mars', 'ceres', 'jupiter', 'saturne', 'uranus', 'neptune', 'pluton'].map(function (id) { return sys(id); }).filter(Boolean);
      if (L === OBS.system && L.selected() && OBS.childrenOf) {
        var p = OBS.byId[L.selected()], host = p && p.moon ? p.parent : L.selected(), moons = OBS.childrenOf(host);
        if (moons.length) here = [{ h: 'Lunes de ' + OBS.byId[host].name }].concat(moons.map(function (m) { return sys(m.id); })).concat([{ h: 'Planètes' }]).concat(here);
      }
    }
    out.push({ h: lvl ? lvl.n : 'Dans ce niveau' });
    out = out.concat(here);
    out.push({ label: 'Tout l\'Atlas de ce niveau →', act: function () { location.hash = '#/atlas/' + (z || 'systeme'); } });
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
    if (OBS.sceneRuleNarrow && OBS.sceneRuleNarrow()) crumbs.appendChild(OBS.sceneRulePill());
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
    if (GEAR) crumbs.appendChild(GEAR);   // ⚙ toujours au même endroit : au bout de la rangée des niveaux
    placeCap();
  }
  /* la légende du niveau se place sous le fil d'Ariane, même quand il passe sur deux lignes (téléphone) */
  function placeCap() { var c = $('level-cap'); if (!c) return; var r = crumbs.getBoundingClientRect(); c.style.top = r.height ? Math.round(r.bottom + 8) + 'px' : ''; }
  window.addEventListener('resize', placeCap);
  OBS.on('crumbs', renderCrumbs); OBS.on('level', function () { setTimeout(renderCrumbs, 0); });

  /* titre du niveau, au changement */
  var title = $('level-title'), titleT = 0, firstLevel = true;
  OBS.on('level', function (L) {
    $('timebar').hidden = L.id === 'voisinage' || L.id === 'galaxie' || L.id === 'groupe-local' || L.id === 'volume-local' || L.id === 'superamas' || L.id === 'laniakea'; $('scale-badge').hidden = L.id !== 'systeme'; $('views').hidden = L.id !== 'systeme';
    legendView();
    sizeBadgeView(L);
    capView(L);
    if (false) $('size-badge').textContent = L.id === 'voisinage' ? 'Tailles des étoiles symboliques' : L.id === 'galaxie' ? 'Reconstitution' : L.id === 'groupe-local' ? 'Positions mesurées · aspect reconstitué' : 'Tailles agrandies';
    $('size-badge').title = L.id === 'galaxie' ? 'Personne n\'a jamais vu la Voie lactée de l\'extérieur : forme reconstituée d\'après les mesures (voir Méthode). Les objets repères sont à leurs positions mesurées.' : '';
    toggleSettings(false);
    Array.prototype.forEach.call($('settings').querySelectorAll('[data-lv]'), function (r) { var lv = r.getAttribute('data-lv'); r.hidden = lv === 'systeme' ? L.id !== 'systeme' : lv === 'autres' ? L.id === 'systeme' : lv.split(' ').indexOf(L.id) < 0; });
    if (firstLevel) { firstLevel = false; return; }
    if (L.id === 'etoile') { var st = OBS.starsystem.star(); title.innerHTML = '<b>' + OBS.esc(st ? st.name : '') + '</b><span>' + (st && st.sys ? st.sys.length + (st.sys.length > 1 ? ' planètes confirmées' : ' planète confirmée') : 'Aucune planète confirmée') + ' · à ' + (st ? st.ly.toLocaleString('fr-FR') : '') + ' années-lumière</span>'; title.classList.add('on'); clearTimeout(titleT); titleT = setTimeout(function () { title.classList.remove('on'); }, 2400); return; }
    var sub = L.id === 'voisinage' ? 'Les étoiles à moins de 12 années-lumière' : L.id === 'galaxie' ? 'Une reconstitution fondée sur les mesures · 100 000 années-lumière de diamètre' : L.id === 'groupe-local' ? 'Andromède, le Triangle et les principales galaxies naines · plus de 80 galaxies connues' : L.id === 'volume-local' ? '869 galaxies à leurs positions mesurées · 36 millions d\'années-lumière autour de nous' : L.id === 'laniakea' ? '42 405 galaxies du relevé 2MRS · près d\'un milliard d\'années-lumière autour de nous' : L.id === 'superamas' ? '8 779 groupes et galaxies à leurs positions mesurées · près de 200 millions d\'années-lumière autour de nous' : 'Positions réelles du ' + OBS.astro.dateFromJd(OBS.time.jd).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' });
    title.innerHTML = '<b>' + L.label + '</b><span>' + sub + '</span>';
    title.classList.add('on'); clearTimeout(titleT); titleT = setTimeout(function () { title.classList.remove('on'); }, 2200);
  });
  /* badge du bas : dans la Voie lactée, il bascule le mode « mesuré / reconstitué » */
  function sizeBadgeView(L) {
    var b = $('size-badge'), gal = L && L.id === 'galaxie';
    b.classList.toggle('badge-quiet', !gal); b.classList.toggle('on', gal && !!OBS.galaxy.unc);
    b.textContent = !L ? '' : L.id === 'voisinage' ? '1 point = 1 étoile ou un système d\'étoiles · tailles symboliques' : gal ? (OBS.galaxy.unc ? 'Bras : mesuré en clair · extrapolé en gris' : 'Reconstitution · voir ce qui est mesuré') : L.id === 'groupe-local' ? '1 forme = 1 galaxie · positions mesurées, aspect reconstitué' : L.id === 'volume-local' ? '1 point = 1 galaxie · des millions à des centaines de milliards d\'étoiles' : L.id === 'laniakea' ? '1 point = 1 galaxie brillante · plus loin, seules les plus brillantes sont recensées' : L.id === 'superamas' ? '1 point = 1 groupe de galaxies · jusqu\'à 714 dans l\'amas de la Vierge' : 'Tailles agrandies';
    b.title = gal ? 'Personne n\'a jamais vu la Voie lactée de l\'extérieur. Cliquer pour distinguer les portions de bras mesurées (masers) de celles qui sont prolongées.' : !L ? '' : ({
      voisinage: 'Un point = une étoile, ou un système de deux ou trois étoiles. Tailles symboliques : agrandies pour être visibles.',
      'groupe-local': 'Chaque forme est une galaxie entière. Positions mesurées ; aspect reconstitué d\'après les observations.',
      'volume-local': 'Chaque point est une galaxie entière : des millions à des centaines de milliards d\'étoiles. Positions mesurées.',
      laniakea: 'Chaque point est une galaxie du relevé 2MRS. Distances tirées de la vitesse d\'éloignement : une approximation.',
      superamas: 'Chaque point est un groupe de galaxies : jusqu\'à 714 galaxies dans l\'amas de la Vierge. Positions mesurées.'
    }[L.id] || '');
  }
  $('size-badge').addEventListener('click', function () { if (OBS.engine.level === OBS.galaxy) OBS.galaxy.setUnc(!OBS.galaxy.unc); });
  OBS.on('unc', function () { sizeBadgeView(OBS.engine.level); });
  /* légende du niveau : reste lisible sous le fil d'Ariane après le titre d'arrivée */
  var cap = $('level-cap');
  function capView(L) {
    var t = { voisinage: 'Les étoiles à moins de 12 années-lumière · positions réelles', galaxie: 'Reconstitution fondée sur les mesures · 100 000 années-lumière de diamètre · chaque grain de lumière figure des millions d\'étoiles', 'groupe-local': (OBS.LOCALGROUP || []).length + ' galaxies sur plus de 80 connues · positions mesurées', 'volume-local': 'Catalogue de Karachentsev et al. 2013 · plan de la Feuille locale à l\'horizontale', superamas: 'Catalogue de Kourkchi et Tully 2017 · plan supergalactique à l\'horizontale', laniakea: 'Relevé 2MRS (Huchra et al. 2012) · distances tirées de la vitesse · plan supergalactique à l\'horizontale' }[L.id];
    cap.textContent = t || ''; cap.hidden = !t;
  }

  /* en butée de dézoom (molette ou pincement), un bouton propose de passer à l'échelle suivante : jamais de saut automatique */
  var edge = $('edge'), NEXT = { systeme: ['voisinage', 'Passer au voisinage stellaire'], voisinage: ['galaxie', 'Passer à la Voie lactée'], galaxie: ['groupe-local', 'Passer au Groupe local'], 'groupe-local': ['volume-local', 'Passer au Volume local'], 'volume-local': ['superamas', 'Passer au Superamas local'], superamas: ['laniakea', 'Passer à Laniakea'] };
  edge.addEventListener('click', function () { var L = OBS.engine.level, n = L && NEXT[L.id]; if (n) { edge.hidden = true; OBS.engine.go(n[0], { from: L.id }); } });
  setInterval(function () {
    var L = OBS.engine.level, n = L && NEXT[L.id], show = false;
    if (n && L.controls && L.camera && !document.body.classList.contains('page-open')) {
      var sel = typeof L.selected === 'function' ? L.selected() : null;
      show = !sel && L.camera.position.distanceTo(L.controls.target) >= L.controls.maxDistance * .96;
    }
    if (show) edge.textContent = n[1] + ' ›';
    edge.hidden = !show;
  }, 300);
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
  var settings = $('settings'), sBtn = GEAR;
  function toggleSettings(open) { if (open) settings.style.top = Math.round(crumbs.getBoundingClientRect().bottom + 8) + 'px'; settings.hidden = !open; sBtn.setAttribute('aria-expanded', String(open)); sBtn.classList.toggle('on', open); }
  sBtn.addEventListener('click', function () { toggleSettings(settings.hidden); });
  document.addEventListener('pointerdown', function (e) { if (!settings.hidden && !settings.contains(e.target) && !sBtn.contains(e.target)) toggleSettings(false); });

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
    /* noms des autres niveaux (Voisinage, Voie lactée, Groupe local, Volume local, systèmes d'étoiles) : tous, ou seulement au survol */
    var sNames = $('s-names');
    function namesView() { ['voisinage', 'galaxie', 'groupe-local', 'volume-local', 'superamas', 'laniakea', 'etoile'].forEach(function (k) { var el = $('labels-' + k); if (el) el.classList.toggle('names-hover', sNames.value === 'hover'); }); }
    sNames.value = get('obs.names') || 'all'; namesView();
    sNames.addEventListener('change', function () { set('obs.names', sNames.value); namesView(); });
    /* Volume local : halos des groupes de galaxies (reconstitution de leur étendue) */
    var sGroups = $('s-groups');
    sGroups.value = get('obs.groups') || 'halos'; if (OBS.volumelocal && OBS.volumelocal.setGroups) OBS.volumelocal.setGroups(sGroups.value);
    if (OBS.superamas && OBS.superamas.setGroups) OBS.superamas.setGroups(sGroups.value);
    sGroups.addEventListener('change', function () { set('obs.groups', sGroups.value); OBS.volumelocal.setGroups(sGroups.value); OBS.superamas.setGroups(sGroups.value); });

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

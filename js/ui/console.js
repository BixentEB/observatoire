/* ======================================================================
   OBSERVATOIRE — console d'information d'un objet
   Données réelles (fiche) + valeurs calculées en direct pour la date affichée.
   Ce qui est adapté ou simulé est dit dans le bloc « Ce qui est représenté ».
   ====================================================================== */
(function () {
  'use strict';
  var OBS = window.OBS = window.OBS || {};
  var el = document.getElementById('console'), esc = OBS.esc;
  var nf = function (v, d) { return new Intl.NumberFormat('fr-FR', { maximumFractionDigits: d === undefined ? 0 : d, minimumFractionDigits: d === undefined ? 0 : Math.min(d, 1) }).format(v); };
  var current = null, liveTimer = 0;

  var CREDITS = {
    'mercure.jpg': 'Solar System Scope (CC BY 4.0), d\'après les images de MESSENGER (NASA/JHUAPL)',
    'terre.jpg': 'Solar System Scope (CC BY 4.0), d\'après NASA Blue Marble',
    'mars.jpg': 'Solar System Scope (CC BY 4.0), d\'après les données NASA',
    'jupiter.jpg': 'Solar System Scope (CC BY 4.0), d\'après les images de Cassini et Hubble',
    'saturne.jpg': 'Solar System Scope (CC BY 4.0), d\'après les images de Cassini',
    'uranus.jpg': 'Solar System Scope (CC BY 4.0), d\'après les images de Voyager 2',
    'neptune.jpg': 'Solar System Scope (CC BY 4.0), d\'après les images de Voyager 2',
    'lune.jpg': 'NASA Scientific Visualization Studio, CGI Moon Kit (données LRO)'
  };

  function swatch(def) {
    var c = def.look && def.look.c ? def.look.c[1] : 0xf4c77a;
    if (def.id === 'soleil') c = 0xffb23e;
    if (def.cls) c = OBS.STAR_COLORS[def.cls] || 0xffffff;
    return '#' + ('000000' + c.toString(16)).slice(-6);
  }
  function lightTime(km) {
    var s = km / OBS.astro.C_KMS;
    if (s < 90) return nf(s, 1) + ' s';
    if (s < 5400) return nf(s / 60, 1) + ' min';
    return nf(s / 3600, 1) + ' h';
  }
  function dateLabel() { return OBS.astro.dateFromJd(OBS.time.jd).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' }); }

  function liveSystem(id) {
    var L = OBS.system, lv = L.live(id), def = OBS.byId[id], h = [];
    if (!lv) return '';
    var AU = OBS.astro.AU_KM;
    function cell(label, big, small, wide) { h.push('<div' + (wide ? ' class="wide"' : '') + '><span>' + label + '</span><b>' + big + '</b>' + (small ? '<small>' + small + '</small>' : '') + '</div>'); }
    if (lv.sun !== undefined) cell('Distance au Soleil', nf(lv.sun, lv.sun < 10 ? 3 : 2) + ' UA', nf(lv.sun * AU / 1e6, 1) + ' millions de km');
    if (lv.earth !== undefined) cell('Distance à la Terre', nf(lv.earth, lv.earth < 10 ? 3 : 2) + ' UA', nf(lv.earth * AU / 1e6, 1) + ' millions de km');
    if (lv.earthKm !== undefined) cell('Distance à la Terre', nf(lv.earthKm) + ' km', 'lumière : ' + lightTime(lv.earthKm));
    else if (lv.parentKm !== undefined) cell('Distance à ' + lv.parent, nf(lv.parentKm) + ' km', 'valeur moyenne');
    if (lv.sun !== undefined) cell('Lumière du Soleil', lightTime(lv.sun * AU), 'temps de trajet jusqu\'ici');
    if (lv.earth !== undefined && id !== 'soleil') cell('Signal depuis la Terre', lightTime(lv.earth * AU), 'aller simple');
    if (id === 'soleil') cell('Lumière jusqu\'à la Terre', lightTime(lv.earth * AU), 'temps de trajet');
    var note = '';
    if (def.moon && !(def.orbit && def.orbit.real)) note = '<p class="c-note">Position sur l\'orbite : indicative. La distance et la période sont réelles, l\'emplacement exact de la lune à cette date ne l\'est pas encore.</p>';
    if (OBS.astro.isSmall(id)) note = '<p class="c-note">Position calculée à partir des éléments orbitaux du JPL (orbite képlérienne simple).</p>';
    return '<div class="c-live">' + h.join('') + '</div>' + note;
  }

  function liveStar(def) {
    var yr = OBS.astro.dateFromJd(OBS.time.jd).getUTCFullYear(), dep = Math.round(yr - def.ly);
    return '<div class="c-live">' +
      '<div><span>Distance</span><b>' + nf(def.ly, 2) + ' al</b><small>' + nf(def.ly * OBS.astro.LY_KM / 1e12) + ' milliards de km</small></div>' +
      '<div><span>Lumière visible aujourd\'hui</span><b>partie vers ' + dep + '</b><small>il y a ' + nf(def.ly, 1) + ' ans</small></div>' +
      '<div><span>Type spectral</span><b>' + esc(def.spec) + '</b></div>' +
      '<div><span>Constellation</span><b>' + esc(def.cons || '—') + '</b></div></div>';
  }

  /* les trois mentions de la page Méthode : réel, adapté, simulé */
  function flag(kind, label, value, tip) {
    var k = { real: 'Réel', adapt: 'Adapté', sim: 'Simulé' }[kind];
    return '<span class="flag f-' + kind + '" title="' + esc(k + ' — ' + tip) + '"><i>' + label + '</i>' + esc(value) + '</span>';
  }
  function flags(level, def, id) {
    var f = [];
    if (level === 'voisinage') {
      f.push(flag('real', 'Position', 'mesurée', 'position 3D issue des mesures de parallaxe'));
      f.push(flag('real', 'Distances', 'réelles', 'échelle linéaire, une année-lumière = une même longueur partout'));
      f.push(flag('adapt', 'Aspect', 'symbolique', 'la taille du repère dépend de la luminosité, aucune étoile n\'est à l\'échelle'));
    } else if (def.region) {
      f.push(flag('real', 'Étendue', 'réelle', 'la ceinture occupe sa vraie zone'));
      f.push(flag('sim', 'Corps', 'répartis', 'des points distribués selon la structure réelle, pas des objets catalogués'));
    } else {
      var pos = id === 'soleil' ? flag('real', 'Position', 'centre', 'le Soleil est l\'origine du repère')
        : def.moon && !(def.orbit && def.orbit.real) ? flag('sim', 'Position', 'indicative', 'distance et période réelles, emplacement sur l\'orbite non calculé')
        : OBS.astro.isSmall(id) ? flag('real', 'Position', 'calculée', 'éléments orbitaux du JPL, orbite képlérienne simple (approchée)')
        : flag('real', 'Position', 'calculée', 'modèle du JPL pour la date affichée');
      f.push(pos);
      f.push(def.tex ? flag('real', 'Aspect', 'carte réelle', 'carte de surface issue des missions' + (def.look && def.look.clouds ? ' ; nuages simulés' : ''))
        : flag('sim', 'Aspect', id === 'soleil' ? 'animé' : 'simulé', 'rendu procédural aux couleurs connues de l\'objet'));
      f.push(flag('adapt', 'Taille', 'agrandie', 'à l\'échelle des distances, l\'objet serait invisible'));
    }
    return '<div class="c-flags">' + f.join('') + '<a class="flag-help" href="#/methode" title="Ce que veulent dire ces mentions">?</a></div>';
  }
  function lore(id) {
    var L = OBS.LORE && OBS.LORE[id], h = [];
    if (!L) return { nom: '', projets: '' };
    if (L.nom) h.push('<aside class="c-name-origin"><h3>Origine du nom</h3>' + OBS.md(L.nom) + '</aside>');
    var pj = '';
    if (L.projets && L.projets.length) pj = '<section class="c-sec"><h3>Projets et pistes</h3><ul class="c-proj">' + L.projets.map(function (p) {
      return '<li><span class="ps ps-' + p.s + '">' + esc(OBS.PROJECT_STATUS[p.s] || p.s) + '</span>' + esc(p.t) + '</li>';
    }).join('') + '</ul></section>';
    return { nom: h.join(''), projets: pj };
  }

  function facts(def) {
    if (!def.facts || !def.facts.length) return '';
    return '<section class="c-sec"><h3>Données</h3><table class="c-facts">' + def.facts.map(function (f) { return '<tr><th>' + esc(f[0]) + '</th><td>' + esc(f[1]) + '</td></tr>'; }).join('') + '</table></section>';
  }

  function render(level, id) {
    current = id ? { level: level, id: id } : null;
    clearInterval(liveTimer);
    if (!id) { el.hidden = true; el.innerHTML = ''; if (OBS.engine.setShift) OBS.engine.setShift(0, 0); return; }
    var def = level === 'voisinage' ? OBS.neighborhood.get(id).def : OBS.byId[id];
    var h = [];
    h.push('<div class="c-head"><p class="c-kind">' + esc(def.kind || (def.cls === 'BD' ? 'Naine brune · ' + def.spec : 'Étoile · ' + def.spec)) + '</p>');
    h.push('<h2 class="c-name"><span class="c-swatch" style="background:' + swatch(def) + ';color:' + swatch(def) + '"></span>' + esc(def.name) + '</h2>');
    h.push('<button class="c-min" type="button" aria-label="Réduire la console">▾</button><button class="c-close" type="button" aria-label="Fermer">✕</button></div>');
    h.push('<div class="c-body">');
    h.push(flags(level, def, id));
    var lr = lore(id);
    if (level === 'voisinage') {
      h.push('<section class="c-sec"><h3>Aujourd\'hui</h3>' + liveStar(def) + '</section>');
      h.push('<p class="c-text">' + esc(def.text || '') + '</p>');
      h.push(lr.nom);
      if (def.planets) h.push('<section class="c-sec"><h3>Planètes</h3><p class="c-text">' + esc(def.planets) + '</p></section>');
      h.push('<section class="c-sec"><h3>Ce qui est représenté</h3><p class="c-note">Position réelle dans l\'espace (ascension droite, déclinaison, distance). La taille du repère est symbolique et dépend de la luminosité de l\'étoile.</p></section>');
    } else {
      if (!def.region) h.push('<section class="c-sec"><h3>Le ' + esc(dateLabel()) + '</h3><div data-live>' + liveSystem(id) + '</div></section>');
      h.push('<p class="c-text">' + esc(def.text || '') + '</p>');
      h.push(lr.nom);
      h.push(facts(def));
      var moons = OBS.childrenOf(id);
      if (moons.length) h.push('<section class="c-sec"><h3>Lunes principales</h3><div class="c-chips">' + moons.map(function (m) { return '<button class="chip" type="button" data-go="' + m.id + '">' + esc(m.name) + '</button>'; }).join('') + '</div></section>');
      if (def.moon) h.push('<section class="c-sec"><div class="c-chips"><button class="chip" type="button" data-go="' + def.parent + '">← ' + esc(OBS.byId[def.parent].name) + '</button></div></section>');
      if (def.tex) h.push('<section class="c-sec"><h3>Carte de surface</h3><img class="c-map" src="textures/' + def.tex + '" alt="Carte de la surface de ' + esc(def.name) + ' à plat" loading="lazy"><p class="c-cap">' + esc(CREDITS[def.tex] || '') + '</p></section>');
      if (def.missions) h.push('<section class="c-sec"><h3>Exploration</h3><p class="c-text">' + esc(def.missions) + '</p></section>');
      h.push(lr.projets);
      var rep = [];
      if (def.lookNote) rep.push(def.lookNote);
      else if (def.look && !def.tex) rep.push('Aspect approché : rendu simulé aux couleurs connues de l\'objet.');
      if (!def.region && id !== 'soleil') rep.push(def.moon ? 'Taille et distance à la planète agrandies pour rester visibles.' : 'Taille agrandie pour rester visible : à l\'échelle des distances, ce serait un point.');
      if (rep.length) h.push('<section class="c-sec"><h3>Ce qui est représenté</h3>' + rep.map(function (r) { return '<p class="c-note">' + esc(r) + '</p>'; }).join('') + '</section>');
    }
    h.push('<div data-hypo></div></div>');
    el.innerHTML = h.join('');
    el.hidden = false;
    el.classList.remove('min');
    requestAnimationFrame(reshift);
    el.querySelector('.c-close').addEventListener('click', function () {
      if (level === 'voisinage') OBS.neighborhood.select(null);
      else if (def.moon) OBS.system.select(def.parent);
      else OBS.system.select(null);
    });
    el.querySelector('.c-min').addEventListener('click', function () { el.classList.toggle('min'); this.textContent = el.classList.contains('min') ? '▴' : '▾'; reshift(); });
    Array.prototype.forEach.call(el.querySelectorAll('[data-go]'), function (b) { b.addEventListener('click', function () { OBS.system.select(b.getAttribute('data-go')); }); });
    // hypothèses liées (chargées à la demande)
    if (OBS.hypo) OBS.hypo.forObject(id).then(function (list) {
      if (!current || current.id !== id || !list.length) return;
      var box = el.querySelector('[data-hypo]'); if (!box) return;
      box.innerHTML = '<section class="c-sec c-hypo"><h3>Hypothèses liées</h3>' + list.map(function (hy) {
        return '<a href="#/hypotheses/' + encodeURIComponent(hy.id) + '"><small>Hypothèse personnelle' + (hy.exemple ? ' · exemple' : '') + '</small>' + esc(hy.titre) + '</a>';
      }).join('') + '</section>';
    });
    if (level === 'systeme' && !def.region) liveTimer = setInterval(function () {
      var box = el.querySelector('[data-live]'); if (!box || el.hidden) return;
      box.innerHTML = liveSystem(id);
      var h3 = box.parentNode.querySelector('h3'); if (h3) h3.textContent = 'Le ' + dateLabel();
    }, 500);
  }

  /* garder l'objet centré dans la partie de la scène que la console ne couvre pas */
  function reshift() {
    if (el.hidden) { OBS.engine.setShift(0, 0); return; }
    var r = el.getBoundingClientRect(), small = window.innerWidth <= 720;
    if (small) OBS.engine.setShift(0, el.classList.contains('min') ? 0 : Math.round(r.height / 2));
    else OBS.engine.setShift(Math.round((window.innerWidth - r.left + 16) / 2), 0);
  }
  if (window.ResizeObserver) new ResizeObserver(reshift).observe(el);
  window.addEventListener('resize', reshift);

  OBS.on('select', function (e) {
    if (OBS.engine.level && OBS.engine.level.id !== e.level) return;
    render(e.level, e.id);
  });
  OBS.on('level', function () { render(null, null); });
  OBS.console = { render: render };
})();

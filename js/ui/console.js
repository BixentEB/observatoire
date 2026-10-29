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
    'mercure.jpg': 'NASA/JHUAPL/Carnegie Institution, mosaïque MESSENGER MDIS (USGS), couleurs ramenées vers le naturel, domaine public',
    'io.jpg': 'NASA/JPL/USGS, mosaïque Galileo et Voyager, domaine public',
    'europe.jpg': 'NASA/JPL/USGS, mosaïque Galileo et Voyager (noir et blanc, teintée), domaine public',
    'ganymede.jpg': 'NASA/JPL/USGS, mosaïque Galileo et Voyager, domaine public',
    'callisto.jpg': 'NASA/JPL/USGS, mosaïque Galileo et Voyager (noir et blanc, teintée), domaine public',
    'titan.jpg': 'NASA/JPL-Caltech/Univ. of Arizona, mosaïque Cassini en infrarouge (PIA22770), domaine public',
    'encelade.jpg': 'NASA/JPL-Caltech/SSI/LPI (Paul Schenk), mosaïque Cassini (PIA18435), couleurs atténuées',
    'mimas.jpg': 'NASA/JPL-Caltech/SSI/LPI (Paul Schenk), mosaïque Cassini (PIA18437), couleurs atténuées',
    'rhea.jpg': 'NASA/JPL-Caltech/SSI/LPI (Paul Schenk), mosaïque Cassini (PIA18438), couleurs atténuées',
    'dione.jpg': 'NASA/JPL-Caltech/SSI/LPI (Paul Schenk), mosaïque Cassini (PIA18434), couleurs atténuées',
    'tethys.jpg': 'NASA/JPL-Caltech/SSI/LPI (Paul Schenk), mosaïque Cassini (PIA18439), couleurs atténuées',
    'japet.jpg': 'NASA/JPL-Caltech/SSI/LPI (Paul Schenk), mosaïque Cassini (PIA18436), couleurs atténuées',
    'triton.jpg': 'NASA/JPL-Caltech/LPI (Paul Schenk), mosaïque Voyager 2 (PIA18668) ; zones grises non photographiées',
    'pluton.jpg': 'NASA/JHUAPL/SwRI, carte New Horizons ; zones grises non photographiées',
    'charon.jpg': 'NASA/JHUAPL/SwRI/LPI, mosaïque New Horizons (USGS) ; zones grises non photographiées',
    'ceres.jpg': 'NASA/JPL-Caltech/UCLA/MPS/DLR/IDA, mosaïque Dawn (USGS), domaine public',
    'phobos.jpg': 'P. Stooke, Small Bodies Maps (NASA PDS), domaine public',
    'deimos.jpg': 'P. Stooke, Small Bodies Maps (NASA PDS), domaine public',
    'terre.jpg': 'Solar System Scope (CC BY 4.0), d\'après NASA Blue Marble',
    'mars.jpg': 'NASA/USGS, mosaïque Viking MDIM 2.1 (dominante bleue des régions sombres atténuée), domaine public ; relief MOLA (NASA/GSFC)',
    'jupiter.jpg': 'Solar System Scope (CC BY 4.0), d\'après les images de Cassini et Hubble',
    'saturne.jpg': 'Solar System Scope (CC BY 4.0), d\'après les images de Cassini',
    'uranus.jpg': 'Solar System Scope (CC BY 4.0), d\'après les images de Voyager 2',
    'neptune.jpg': 'Solar System Scope (CC BY 4.0), d\'après les images de Voyager 2',
    'lune.jpg': 'NASA SVS, CGI Moon Kit : mosaïque de la caméra LROC (Lunar Reconnaissance Orbiter), domaine public'
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
      var SFf = OBS.SURFACE && OBS.SURFACE[id];
      if (SFf && SFf.hd && SFf.hd.relief) f.push(flag('real', 'Relief', 'altimétrie réelle', 'relief tiré de l\'' + ((SFf.src && SFf.src.relief) || 'altimétrie') + ', chargé quand on s\'approche'));
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

  function render(level, id, part, site) {
    if (level === 'systeme' && id && site) return renderSite(id, site);
    current = id ? { level: level, id: id } : null;
    clearInterval(liveTimer);
    if (!id) { el.hidden = true; el.innerHTML = ''; if (OBS.engine.setShift) OBS.engine.setShift(0, 0); return; }
    if (level === 'etoile') return renderStar(id, part);
    if (level === 'systeme' && OBS.byId[id] && OBS.byId[id].craft) return renderCraft(id);
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
      h.push('<section class="c-sec"><div class="c-chips"><button class="chip chip-go" type="button" data-visit="' + def.id + '">Visiter le système de ' + esc(def.name) + ' →</button></div></section>');
      h.push('<section class="c-sec"><h3>Ce qui est représenté</h3><p class="c-note">Position réelle dans l\'espace (ascension droite, déclinaison, distance). La taille du repère est symbolique et dépend de la luminosité de l\'étoile.</p></section>');
    } else {
      if (!def.region) h.push('<section class="c-sec"><h3>Le ' + esc(dateLabel()) + '</h3><div data-live>' + liveSystem(id) + '</div></section>');
      h.push('<p class="c-text">' + esc(def.text || '') + '</p>');
      h.push(lr.nom);
      h.push(facts(def));
      var SF = OBS.SURFACE && OBS.SURFACE[id];
      if (SF) {
        if (SF.sites && SF.sites.length) {
          var groups = [['mer', 'Plaines, mers et régions', ['mer', 'bassin', 'region', 'lac']], ['montagne', 'Reliefs', ['montagne', 'volcan', 'canyon', 'calotte']], ['cratere', 'Cratères', ['cratere']],
            ['site', (SF.siteLabel || 'Site d\'atterrissage').replace(/^Site/, 'Sites'), ['site']], ['base', 'Bases et observatoires', ['base', 'observatoire']], ['extreme', 'Extrêmes', ['extreme']]];
          h.push('<section class="c-sec c-sites"><h3>Lieux remarquables</h3>' + groups.map(function (g) {
            var l = SF.sites.filter(function (x) { return g[2].indexOf(x.type) >= 0; }); if (!l.length) return '';
            return '<h4>' + g[1] + '</h4><div class="c-chips">' + l.map(function (x) { return '<button class="chip t-' + x.type + '" type="button" data-site="' + x.id + '">' + esc(x.name) + '</button>'; }).join('') + '</div>';
          }).join('') + '</section>');
        }
        if (SF.geologie) h.push('<section class="c-sec"><h3>' + esc(SF.geoTitle || 'Géologie') + '</h3><div class="c-geo">' + SF.geologie.map(function (g) { return '<div><b>' + esc(g[0]) + '</b>' + esc(g[1]) + '</div>'; }).join('') + '</div></section>');
        if (SF.ressources) h.push('<section class="c-sec"><h3>Composition et ressources</h3><div class="c-geo">' + SF.ressources.map(function (g) { return '<div><b>' + esc(g[0]) + '</b>' + esc(g[1]) + '</div>'; }).join('') + '</div></section>');
        if (SF.terre) h.push('<section class="c-sec"><h3>' + esc(SF.lien || 'Et la Terre') + '</h3><p class="c-text">' + esc(SF.terre) + '</p></section>');
      }
      var moons = OBS.childrenOf(id);
      if (moons.length) h.push('<section class="c-sec"><h3>Lunes principales</h3><div class="c-chips">' + moons.map(function (m) { return '<button class="chip" type="button" data-go="' + m.id + '">' + esc(m.name) + '</button>'; }).join('') + '</div></section>');
      if (def.moon) h.push('<section class="c-sec"><div class="c-chips"><button class="chip" type="button" data-go="' + def.parent + '">← ' + esc(OBS.byId[def.parent].name) + '</button></div></section>');
      if (def.tex) h.push('<section class="c-sec"><h3>Carte de surface</h3><img class="c-map" src="textures/' + def.tex + '" alt="Carte de la surface de ' + esc(def.name) + ' à plat" loading="lazy"><p class="c-cap">' + esc(CREDITS[def.tex] || '') + '</p></section>');
      if (def.missions) h.push('<section class="c-sec"><h3>Exploration</h3><p class="c-text">' + esc(def.missions) + '</p></section>');
      h.push(lr.projets);
      var rep = [];
      if (def.lookNote) rep.push(def.lookNote);
      else if (def.look && !def.tex) rep.push('Aspect approché : rendu simulé aux couleurs connues de l\'objet.');
      if (OBS.SURFACE && OBS.SURFACE[id] && OBS.SURFACE[id].res) rep.push('Netteté des données : ' + OBS.SURFACE[id].res + ' De très près, l\'image devient floue plutôt que d\'inventer des détails.');
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
    Array.prototype.forEach.call(el.querySelectorAll('[data-site]'), function (b) { b.addEventListener('click', function () { OBS.system.site(id, b.getAttribute('data-site')); }); });
    Array.prototype.forEach.call(el.querySelectorAll('[data-visit]'), function (b) { b.addEventListener('click', function () { OBS.engine.go('etoile', { star: b.getAttribute('data-visit') }); }); });
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

  /* un engin spatial : sonde, station, vaisseau */
  function fmtDate(jd, withTime) {
    var o = { day: 'numeric', month: 'long', year: 'numeric' }; if (withTime) { o.hour = '2-digit'; o.minute = '2-digit'; o.timeZone = 'UTC'; }
    return OBS.astro.dateFromJd(jd).toLocaleDateString('fr-FR', o) + (withTime ? ' UTC' : '');
  }
  function deNom(n) { return n === 'Terre' || n === 'Lune' ? 'la ' + n : n; }
  function liveCraft(def) {
    var lv = OBS.system.live(def.id) || {}, AU = OBS.astro.AU_KM, h = [];
    function cell(label, big, small, wide) { h.push('<div' + (wide ? ' class="wide"' : '') + '><span>' + label + '</span><b>' + big + '</b>' + (small ? '<small>' + small + '</small>' : '') + '</div>'); }
    if (!OBS.system.craftData()) return '<p class="c-note">Chargement des trajectoires…</p>';
    if (!lv.on) {
      var msg = lv.from === undefined ? 'Aucune donnée de position pour cet engin.' :
        'Pas de position pour cette date : les données du JPL couvrent du ' + fmtDate(lv.from) + ' au ' + fmtDate(lv.to) + '. L\'engin n\'est donc pas affiché.';
      var target = lv.from === undefined ? null : (OBS.time.jd < lv.from ? lv.from + .02 : lv.to - .02);
      var now = OBS.astro.jdFromDate(new Date());
      if (target && now && now > lv.from && now < lv.to) target = now;
      return '<p class="c-note">' + esc(msg) + '</p>' + (target ? '<div class="c-chips" style="margin-top:8px"><button class="chip chip-go" type="button" data-jump="' + target + '">' + (def.vol ? 'Revivre le vol depuis le départ' : 'Aller au ' + esc(fmtDate(target))) + '</button></div>' : '');
    }
    if (lv.hostKm !== undefined) {
      var alt = lv.hostKm - lv.hostR;
      if (alt < 30000) cell('Altitude au-dessus de ' + deNom(lv.hostName), nf(alt) + ' km', 'distance au centre : ' + nf(lv.hostKm) + ' km');
      else cell('Distance à ' + deNom(lv.hostName), lv.hostKm > 3e6 ? nf(lv.hostKm / 1e6, 2) + ' millions de km' : nf(lv.hostKm) + ' km', lv.hostName === 'Terre' ? 'lumière : ' + lightTime(lv.hostKm) : 'de centre à centre');
    }
    if (lv.sun !== undefined && !(lv.hostName === 'Terre' || lv.hostName === 'Lune')) cell('Distance au Soleil', nf(lv.sun, lv.sun < 10 ? 3 : 2) + ' UA', nf(lv.sun * AU / 1e6, 1) + ' millions de km');
    if (lv.earth !== undefined && lv.hostName !== 'Terre') cell('Signal depuis la Terre', lightTime(lv.earth * AU), lv.earth < .05 ? nf(lv.earth * AU) + ' km, aller simple' : nf(lv.earth, lv.earth < 10 ? 3 : 2) + ' UA, aller simple');
    if (lv.speed !== undefined) cell('Vitesse', nf(lv.speed, lv.speed < 10 ? 2 : 1) + ' km/s', nf(lv.speed * 3600) + ' km/h ' + lv.speedRef);
    return '<div class="c-live">' + h.join('') + '</div>';
  }
  function renderCraft(id) {
    var def = OBS.byId[id], h = [];
    current = { level: 'systeme', id: id }; clearInterval(liveTimer);
    var col = '#8ff0dc';
    h.push('<div class="c-head"><p class="c-kind">' + esc(def.kind) + '</p><h2 class="c-name"><span class="c-swatch c-craft" style="background:' + col + ';color:' + col + '"></span>' + esc(def.name) + '</h2>' +
      '<button class="c-min" type="button" aria-label="Réduire la console">▾</button><button class="c-close" type="button" aria-label="Fermer">✕</button></div><div class="c-body">');
    var now = OBS.astro.jdFromDate(new Date());
    var pos = def.fin && !def.vol ? flag('real', 'Position', 'extrapolée par le JPL', 'la sonde ne transmet plus : sa trajectoire est prolongée par le calcul')
      : flag('real', 'Position', 'JPL Horizons', 'trajectoire reconstituée ou prévue par les équipes de navigation, mise à jour chaque jour') ;
    h.push('<div class="c-flags">' + pos + '<span data-when></span>' + flag('adapt', 'Aspect', 'symbolique', 'un repère, pas une image de l\'engin') +
      flag('adapt', 'Échelle', 'adaptée', 'près d\'un astre, la distance est compressée comme celle des lunes ; la direction reste réelle') + '<a class="flag-help" href="#/methode">?</a></div>');
    h.push('<section class="c-sec"><h3>Le ' + esc(dateLabel()) + '</h3><div data-live>' + liveCraft(def) + '</div></section>');
    h.push('<p class="c-text">' + esc(def.text || '') + '</p>');
    h.push(facts(def));
    var host = def.host && OBS.byId[def.host];
    if (host) h.push('<section class="c-sec"><div class="c-chips"><button class="chip" type="button" data-go="' + host.id + '">← ' + esc(host.name) + '</button></div></section>');
    h.push('<section class="c-sec"><h3>Ce qui est représenté</h3><p class="c-note">Position : JPL Horizons (NASA/JPL-Caltech), ' + (def.fin && !def.vol ? 'trajectoire extrapolée après la fin des contacts' : 'reconstituée pour le passé, prévue pour l\'avenir et recalculée chaque jour') + '. Près d\'un astre, l\'engin est placé dans sa vraie direction, mais à une distance compressée comme celle des lunes. Hors des dates couvertes par les données, il n\'est pas affiché.</p></section>');
    h.push('</div>');
    el.innerHTML = h.join(''); el.hidden = false; el.classList.remove('min'); requestAnimationFrame(reshift);
    el.querySelector('.c-close').addEventListener('click', function () { OBS.system.select(def.host || null); });
    el.querySelector('.c-min').addEventListener('click', function () { el.classList.toggle('min'); this.textContent = el.classList.contains('min') ? '▴' : '▾'; reshift(); });
    Array.prototype.forEach.call(el.querySelectorAll('[data-go]'), function (b) { b.addEventListener('click', function () { OBS.system.select(b.getAttribute('data-go')); }); });
    function live() {
      var box = el.querySelector('[data-live]'); if (!box) return;
      var html = liveCraft(def); if (box._h !== html) { box.innerHTML = html; box._h = html; }
      var jb = box.querySelector('[data-jump]');
      if (jb && !jb._b) { jb._b = 1; jb.addEventListener('click', function () { OBS.time.set(+jb.getAttribute('data-jump')); }); }
      var h3 = box.parentNode.querySelector('h3'); if (h3) h3.textContent = 'Le ' + dateLabel();
      var w = el.querySelector('[data-when]'), n2 = OBS.astro.jdFromDate(new Date());
      if (w) w.innerHTML = n2 && OBS.time.jd > n2 + 1 && !def.fin ? flag('adapt', 'Date', 'à venir', 'trajectoire prévue : elle peut encore changer avec les manœuvres') : '';
    }
    live(); liveTimer = setInterval(live, 500);
  }

  /* système d'une étoile voisine : l'étoile, sa compagne ou une de ses planètes */
  /* un lieu de la surface : cratère, mer, site d'alunissage… */
  function renderSite(bodyId, siteId) {
    var B = OBS.byId[bodyId], SF = OBS.SURFACE[bodyId], S = SF.sites.filter(function (x) { return x.id === siteId; })[0];
    if (!S) return render('systeme', bodyId);
    current = { level: 'systeme', id: bodyId + ':' + siteId }; clearInterval(liveTimer);
    function deg(v, pos, neg) { return nf(Math.abs(v), 2) + '° ' + (v >= 0 ? pos : neg); }
    var h = [];
    var typeLabel = S.type === 'site' ? (SF.siteLabel || 'Site d\'atterrissage') : (OBS.SITE_TYPES[S.type] || 'Lieu');
    if (bodyId === 'lune' && S.type === 'mer') typeLabel = 'Mer';
    var src = SF.src || {};
    h.push('<div class="c-head"><p class="c-kind">' + esc(typeLabel + ' · ' + B.name) + '</p><h2 class="c-name"><span class="c-swatch" style="background:' + (S.type === 'site' ? '#f4c77a' : '#c9d2ea') + ';color:' + (S.type === 'site' ? '#f4c77a' : '#c9d2ea') + '"></span>' + esc(S.name) + '</h2>' +
      '<button class="c-min" type="button" aria-label="Réduire la console">▾</button><button class="c-close" type="button" aria-label="Revenir à ' + esc(B.name) + '">✕</button></div><div class="c-body">');
    h.push('<div class="c-flags">' + flag('real', 'Position', 'coordonnées IAU', 'latitude et longitude officielles du lieu') +
      (src.relief ? flag('real', 'Relief', src.relief, 'pentes calculées à partir des altitudes mesurées') : flag('adapt', 'Relief', 'non représenté', 'pas de données d\'altitude intégrées pour cet astre : la surface est éclairée comme une sphère lisse')) +
      (src.aspect ? flag('real', 'Aspect', src.aspect, 'images réelles prises par les sondes') : '') +
      (src.relief ? flag('adapt', 'Éclairage', 'sans ombres portées', 'le relief est éclairé par le vrai Soleil, mais les ombres des reliefs sur leurs voisins ne sont pas calculées') : '') + '<a class="flag-help" href="#/methode">?</a></div>');
    h.push('<section class="c-sec"><h3>En ce moment</h3><div data-live></div><p class="c-cap" data-skip></p></section>');
    var rows = [['Coordonnées', deg(S.lat, 'N', 'S') + ' · ' + deg(S.lon, 'E', 'O')]];
    if (S.d) rows.push(['Diamètre', '≈ ' + nf(S.d) + ' km']);
    if (S.date) rows.push(['Date', S.date]);
    h.push('<p class="c-text">' + esc(S.text) + '</p>');
    h.push('<section class="c-sec"><h3>Données</h3><table class="c-facts" data-facts>' + rows.map(function (r) { return '<tr><th>' + esc(r[0]) + '</th><td>' + esc(r[1]) + '</td></tr>'; }).join('') + '</table></section>');
    h.push('<section class="c-sec"><div class="c-chips"><button class="chip" type="button" data-back>← ' + esc(B.name) + '</button></div></section>');
    if (SF.res) h.push('<p class="c-note">' + esc(SF.res) + ' De très près, l\'image devient floue plutôt que d\'inventer des détails.</p>');
    h.push('</div>');
    el.innerHTML = h.join(''); el.hidden = false; el.classList.remove('min'); requestAnimationFrame(reshift);
    function live() {
      var box = el.querySelector('[data-live]'); if (!box) return;
      var inf = OBS.system.siteInfo(bodyId, siteId); if (!inf) return;
      var sun = inf.sun > 0.5 ? ['Jour', 'Soleil à ' + nf(inf.sun, 0) + '° au-dessus de l\'horizon'] : inf.sun > -0.5 ? ['Lever ou coucher', 'Soleil sur l\'horizon : les reliefs projettent leurs plus longues ombres'] : ['Nuit', 'Soleil à ' + nf(-inf.sun, 0) + '° sous l\'horizon'];
      var cells = '<div><span>Soleil</span><b>' + sun[0] + '</b><small>' + sun[1] + '</small>' + (inf.sun < 3 ? '<button class="chip chip-go" type="button" data-sunrise style="margin-top:8px">Avancer jusqu\'au lever du Soleil</button>' : '') + '</div>';
      if (inf.parent !== undefined) {
        var pe = inf.parent, pn = inf.parentName;
        var ptxt = pe > 8 ? ['Toujours visible', 'à ' + nf(pe, 0) + '° au-dessus de l\'horizon, presque immobile dans le ciel'] : pe > -8 ? ['Au ras de l\'horizon', 'visible ou non au gré des librations'] : ['Jamais visible', 'ce lieu est sur l\'hémisphère qui lui tourne le dos'];
        cells += '<div><span>' + esc(pn) + '</span><b>' + ptxt[0] + '</b><small>' + ptxt[1] + '</small></div>';
      }
      var had = box.querySelector('[data-sunrise]'), want = inf.sun < 3;
      if (!box.firstChild || !!had !== want || !want) box.innerHTML = '<div class="c-live">' + cells + '</div>';
      var sb = box.querySelector('[data-sunrise]');
      if (sb && !sb._b) { sb._b = 1; sb.addEventListener('click', function () {
        var jd = OBS.system.nextSunrise(bodyId, siteId);
        if (!jd) { sb.textContent = 'Pas de lever du Soleil proche (nuit polaire ?)'; return; }
        var dt = jd - OBS.time.jd, txt = dt < 1 ? Math.round(dt * 24) + ' h' : nf(dt, 1) + ' jours';
        OBS.time.set(jd);
        var note = el.querySelector('[data-skip]'); if (note) note.textContent = 'Temps avancé de ' + txt + ' : le Soleil se lève sur ce lieu.';
      }); }
      if (inf.alt !== null && inf.alt !== undefined) {
        var tb = el.querySelector('[data-facts]');
        if (tb && !tb.querySelector('[data-alt]')) { var tr = document.createElement('tr'); tr.setAttribute('data-alt', ''); tr.innerHTML = '<th>Altitude</th><td>≈ ' + (inf.alt >= 0 ? '+' : '−') + nf(Math.abs(inf.alt), 1) + ' km<br><small style="color:var(--muted)">par rapport à la sphère de ' + nf(SF.refKm || B.rKm, 1) + ' km (carte d\'altitude réduite)</small></td>'; tb.appendChild(tr); }
      }
    }
    live(); liveTimer = setInterval(live, 500);
    var back = function () { OBS.system.select(bodyId); };
    el.querySelector('.c-close').addEventListener('click', back);
    el.querySelector('[data-back]').addEventListener('click', back);
    el.querySelector('.c-min').addEventListener('click', function () { el.classList.toggle('min'); this.textContent = el.classList.contains('min') ? '▴' : '▾'; reshift(); });
  }

  function renderStar(id, part) {
    var SS = OBS.starsystem, st = SS.star(), h = [];
    current = { level: 'etoile', id: id + (part ? ':' + part : '') }; clearInterval(liveTimer);
    var head = function (kind, name, color) {
      return '<div class="c-head"><p class="c-kind">' + esc(kind) + '</p><h2 class="c-name"><span class="c-swatch" style="background:' + color + ';color:' + color + '"></span>' + esc(name) + '</h2>' +
        '<button class="c-min" type="button" aria-label="Réduire la console">▾</button><button class="c-close" type="button" aria-label="Fermer">✕</button></div><div class="c-body">';
    };
    var starCol = '#' + ('000000' + (OBS.STAR_COLORS[st.cls] || 0xffffff).toString(16)).slice(-6);
    if (!part) {
      h.push(head(st.cls === 'BD' ? 'Naine brune · ' + st.spec : 'Étoile · ' + st.spec, st.name, starCol));
      h.push('<div class="c-flags">' + flag('real', 'Étoile', 'mesurée', 'type, rayon et masse issus des observations (valeurs approchées)') +
        (st.sys ? flag('real', 'Orbites', 'calculées', 'périodes mesurées ; distances déduites par la troisième loi de Kepler') : '') +
        (st.sys ? flag('sim', 'Planètes', 'aspect inconnu', 'aucune image de ces planètes n\'existe : leur rendu est simulé') : '') +
        flag('adapt', 'Échelle', 'adaptée', 'distances compressées comme dans le système solaire, tailles agrandies') + '<a class="flag-help" href="#/methode">?</a></div>');
      h.push('<section class="c-sec"><h3>Aujourd\'hui</h3>' + liveStar(st) + '</section>');
      h.push('<p class="c-text">' + esc(st.text || '') + '</p>');
      h.push(lore(st.id).nom);
      var facts2 = [];
      if (st.r) facts2.push(['Rayon', '≈ ' + nf(st.r, st.r < .1 ? 3 : 2) + ' rayon solaire' + (st.r >= 2 ? 's' : '')]);
      if (st.m) facts2.push(['Masse', '≈ ' + nf(st.m, st.m < .1 ? 3 : 2) + ' masse solaire' + (st.m >= 2 ? 's' : '')]);
      if (st.comp) facts2.push(['Compagne', st.comp.n + ', à ≈ ' + nf(st.comp.aAU, 1) + ' UA, révolution en ' + nf(st.comp.Py, 1) + ' ans']);
      if (facts2.length) h.push('<section class="c-sec"><h3>Données</h3><table class="c-facts">' + facts2.map(function (f) { return '<tr><th>' + esc(f[0]) + '</th><td>' + esc(f[1]) + '</td></tr>'; }).join('') + '</table></section>');
      if (st.sys) h.push('<section class="c-sec"><h3>Planètes confirmées</h3><div class="c-chips">' + st.sys.map(function (p, i) { return '<button class="chip" type="button" data-part="p' + i + '">' + esc(p.n) + '</button>'; }).join('') + '</div></section>');
      else h.push('<section class="c-sec"><h3>Planètes</h3><p class="c-text">' + esc(st.planets || 'Aucune planète confirmée à ce jour.') + '</p></section>');
      if (st.planets && st.sys) h.push('<p class="c-note">' + esc(st.planets) + '</p>');
    } else if (part === 'comp') {
      var c = st.comp, cc = '#' + ('000000' + (OBS.STAR_COLORS[c.cls] || 0xffffff).toString(16)).slice(-6);
      h.push(head('Étoile compagne · système de ' + st.name, c.n, cc));
      h.push('<div class="c-flags">' + flag('real', 'Orbite', 'mesurée', 'demi-grand axe et période issus des observations') + flag('sim', 'Position', 'indicative', 'orbite représentée circulaire, emplacement non calculé') + flag('adapt', 'Échelle', 'adaptée', 'distances compressées, tailles agrandies') + '</div>');
      h.push('<table class="c-facts" style="margin-top:12px"><tr><th>Distance moyenne</th><td>≈ ' + nf(c.aAU, 1) + ' UA</td></tr><tr><th>Révolution</th><td>' + nf(c.Py, 1) + ' ans</td></tr><tr><th>Rayon</th><td>≈ ' + nf(c.r, c.r < .1 ? 4 : 2) + ' rayon solaire</td></tr></table>');
      if (/naine blanche/.test(c.n)) h.push('<p class="c-text">Une naine blanche : le cœur d\'une étoile qui a épuisé son combustible, aussi massif que le Soleil mais pas plus grand que la Terre.</p>');
    } else {
      var idx = +part.slice(1), p = st.sys[idx];
      var aAU = SS.keplerAU(st.m || .3, p.P);
      h.push(head('Exoplanète · système de ' + st.name, p.n, p.giant ? '#c8b894' : '#8c857c'));
      h.push('<div class="c-flags">' + flag('real', 'Période', 'mesurée', 'déduite des observations de l\'étoile') + flag('real', 'Distance', 'calculée', 'troisième loi de Kepler, à partir de la période et de la masse de l\'étoile') +
        flag('sim', 'Position', 'indicative', 'emplacement sur l\'orbite non calculé') + flag('sim', 'Aspect', 'inconnu', 'aucune image de cette planète n\'existe') + flag('adapt', 'Taille', 'estimée', 'seule une masse minimale est connue') + '<a class="flag-help" href="#/methode">?</a></div>');
      h.push('<div class="c-live" style="margin-top:14px"><div><span>Période</span><b>' + (p.P > 400 ? nf(p.P / 365.25, 1) + ' ans' : nf(p.P, 2) + ' jours') + '</b><small>une année sur cette planète</small></div>' +
        '<div><span>Distance à l\'étoile</span><b>≈ ' + nf(aAU, aAU < .1 ? 3 : 2) + ' UA</b><small>≈ ' + nf(aAU * OBS.astro.AU_KM / 1e6, 1) + ' millions de km</small></div>' +
        (p.me ? '<div class="wide"><span>Masse minimale</span><b>' + (p.me > 100 ? nf(p.me / 317.8, 2) + ' Jupiter' : nf(p.me, 2) + ' Terre' + (p.me >= 2 ? 's' : '')) + '</b><small>la vraie masse dépend de l\'inclinaison de l\'orbite, inconnue</small></div>' : '') + '</div>');
      h.push('<p class="c-text">' + (aAU < .1 ? 'Elle tourne bien plus près de son étoile que Mercure du Soleil (0,39 UA). Autour d\'une étoile aussi peu lumineuse, cette distance peut pourtant correspondre à des températures modérées.' : 'Une planète géante sur une orbite large, détectée par le mouvement qu\'elle imprime à son étoile.') + '</p>');
      h.push('<section class="c-sec"><div class="c-chips"><button class="chip" type="button" data-part="">← ' + esc(st.name) + '</button></div></section>');
    }
    h.push('</div>');
    el.innerHTML = h.join(''); el.hidden = false; el.classList.remove('min'); requestAnimationFrame(reshift);
    el.querySelector('.c-close').addEventListener('click', function () { if (part) SS.select(null); else OBS.engine.go('voisinage', { focus: st.id, from: 'etoile' }); });
    el.querySelector('.c-min').addEventListener('click', function () { el.classList.toggle('min'); this.textContent = el.classList.contains('min') ? '▴' : '▾'; reshift(); });
    Array.prototype.forEach.call(el.querySelectorAll('[data-part]'), function (b) { b.addEventListener('click', function () { SS.select(b.getAttribute('data-part') || null); }); });
  }

  /* garder l'objet centré dans la partie de la scène que la console ne couvre pas */
  function reshift() {
    if (el.hidden || document.documentElement.classList.contains('demo')) { OBS.engine.setShift(0, 0); return; }
    var r = el.getBoundingClientRect(), small = window.innerWidth <= 720;
    if (small) OBS.engine.setShift(0, el.classList.contains('min') ? 0 : Math.round(r.height / 2));
    else OBS.engine.setShift(Math.round((window.innerWidth - r.left + 16) / 2), 0);
  }
  if (window.ResizeObserver) new ResizeObserver(reshift).observe(el);
  window.addEventListener('resize', reshift);

  OBS.on('select', function (e) {
    if (OBS.engine.level && OBS.engine.level.id !== e.level) return;
    render(e.level, e.id, e.part, e.site);
  });
  OBS.on('level', function () { render(null, null); });
  OBS.console = { render: render };
})();

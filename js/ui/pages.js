/* ======================================================================
   OBSERVATOIRE — pages de lecture : index des objets, méthode, crédits
   ====================================================================== */
(function () {
  'use strict';
  var OBS = window.OBS = window.OBS || {};
  var esc = OBS.esc;
  function hex(c) { return '#' + ('000000' + c.toString(16)).slice(-6); }
  function colorOf(b) { return b.id === 'soleil' ? '#ffb23e' : b.look && b.look.c ? hex(b.look.c[1]) : '#8f96b8'; }
  function card(href, color, name, sub) {
    return '<a class="obj" href="' + href + '"><i style="background:' + color + ';box-shadow:0 0 10px ' + color + '"></i><span><b>' + esc(name) + '</b><small>' + esc(sub) + '</small></span></a>';
  }

  var pages = OBS.pages = {};

  pages.index = function (root) {
    var B = OBS.BODIES, h = [];
    h.push('<p class="p-kicker">Index des objets</p><h1>Tout ce que l\'on peut rejoindre</h1>');
    h.push('<p class="lead">Chaque objet ouvre sa console dans la scène : données réelles, position à la date affichée et ce qui est adapté pour l\'affichage.</p>');
    function group(title, list, href) {
      if (!list.length) return;
      h.push('<h2>' + title + '</h2><div class="grid-list">' + list.map(function (b) { return card(href(b), colorOf(b), b.name, b.kind); }).join('') + '</div>');
    }
    var sys = function (b) { return '#/explorer/' + b.id; };
    group('Étoile', B.filter(function (b) { return b.id === 'soleil'; }), sys);
    group('Planètes', B.filter(function (b) { return b.parent === 'soleil' && !b.dwarf && !b.comet && !b.moon; }), sys);
    group('Planètes naines', B.filter(function (b) { return b.dwarf; }), sys);
    var parents = []; B.forEach(function (b) { if (b.moon && parents.indexOf(b.parent) < 0) parents.push(b.parent); });
    parents.forEach(function (p) { group('Lunes · ' + OBS.byId[p].name, B.filter(function (b) { return b.moon && b.parent === p; }), sys); });
    group('Comète', B.filter(function (b) { return b.comet; }), sys);
    group('Régions', OBS.REGIONS, sys);
    h.push('<h2>Voisinage stellaire</h2><p>Les étoiles à moins de 12 années-lumière, à leurs vraies positions.</p><div class="grid-list">' +
      OBS.STARS.map(function (s) { return card('#/voisinage/' + s.id, hex(OBS.STAR_COLORS[s.cls] || 0xffffff), s.name, s.spec + ' · ' + s.ly.toLocaleString('fr-FR') + ' al'); }).join('') + '</div>');
    h.push('<h2>Voie lactée</h2><p>Le niveau suivant, la galaxie vue de l\'extérieur, est en préparation. Comme personne n\'a jamais photographié notre galaxie de l\'extérieur, ce sera une reconstitution fondée sur les représentations scientifiques officielles, et elle sera présentée comme telle.</p>');
    root.innerHTML = h.join('');
  };

  pages.methode = function (root) {
    root.innerHTML = [
      '<p class="p-kicker">Méthode</p><h1>Le visuel peut être adapté, les données jamais</h1>',
      '<p class="lead">L\'Observatoire montre le ciel tel qu\'il est, à la date affichée. Quand l\'affichage doit s\'écarter de la réalité pour rester lisible, c\'est dit, ici et dans chaque console.</p>',
      '<div class="legend">',
      '<div class="l-real"><h3>Réel</h3><ul><li>Les objets : rien n\'est inventé.</li><li>Les positions des planètes, planètes naines et de la comète de Halley, calculées pour la date affichée.</li><li>La position de la Lune.</li><li>L\'orientation des axes et la rotation des planètes (pôles et méridiens de l\'IAU).</li><li>Les positions 3D des étoiles voisines.</li><li>Toutes les valeurs des consoles.</li></ul></div>',
      '<div class="l-adapt"><h3>Adapté, et signalé</h3><ul><li>Les distances : compressées par défaut (badge « Échelle adaptée »), réelles sur demande.</li><li>Les tailles : toujours agrandies.</li><li>Le temps : accéléré, avec l\'allure affichée en permanence.</li><li>La luminosité : relevée pour que les planètes lointaines restent visibles.</li></ul></div>',
      '<div class="l-sim"><h3>Simulé, en attendant mieux</h3><ul><li>Les surfaces des objets sans carte disponible (lunes, planètes naines) : rendu aux couleurs connues.</li><li>Les nuages de Vénus et de la Terre.</li><li>La position des lunes sur leur orbite, sauf pour la Lune.</li><li>Les étoiles lointaines du fond de ciel.</li></ul></div>',
      '<div class="l-hypo"><h3>Hypothèses</h3><p>Mes hypothèses personnelles ont leur propre espace et leur propre couleur. Elles ne sont jamais mêlées aux données.</p></div>',
      '</div>',
      '<h2>Les échelles</h2>',
      '<p>À l\'échelle réelle, le système solaire est presque entièrement vide : si le Soleil était une balle de tennis, la Terre serait un grain de sable à environ 7 mètres, et Neptune une tête d\'épingle à plus de 200 mètres. Pour que tout tienne à l\'écran, les distances au Soleil sont compressées par une loi de puissance (la distance affichée croît comme la distance réelle à la puissance 0,55). L\'ordre, les orbites, les inclinaisons et les positions relatives restent justes ; seules les proportions changent.</p>',
      '<p>Le réglage « Distances réelles » rétablit des distances proportionnelles. Les tailles, elles, restent agrandies dans les deux modes : à l\'échelle, toutes les planètes seraient invisibles.</p>',
      '<p>Les lunes sont placées autour de leur planète avec la même logique : leurs distances sont compressées, mais leur ordre et leurs périodes sont réels.</p>',
      '<h2>Le temps</h2>',
      '<p>La scène démarre à la date et à l\'heure d\'aujourd\'hui. On peut accélérer de « temps réel » jusqu\'à « un an par seconde », revenir en arrière ou revenir à aujourd\'hui. Au-delà de deux jours par seconde, la rotation des planètes sur elles-mêmes est ralentie à l\'écran pour éviter un effet stroboscopique ; les positions sur les orbites, elles, restent exactes.</p>',
      '<h2>Les niveaux</h2>',
      '<p>On passe d\'un niveau à l\'autre en zoomant : un objet, le système solaire, puis le voisinage stellaire. Chaque niveau a sa propre scène et sa propre échelle, pour garder la précision du calcul. Le niveau suivant, la Voie lactée, est en préparation.</p>',
      '<h2>Les reconstitutions</h2>',
      '<p>Quand aucune image réelle n\'existe, comme pour notre galaxie vue de l\'extérieur, la représentation se fonde sur les calculs et les représentations officielles, éventuellement retravaillés dans leur aspect (couleur, densité), tout en restant proche de ce que la science juge probable. Une reconstitution est toujours étiquetée comme telle. Une éventuelle touche de fantaisie ne sera ajoutée que si elle reste acceptable, et elle sera signalée.</p>',
      '<h2>Sources des calculs</h2>',
      '<ul>',
      '<li>Planètes : E. M. Standish, JPL, « Approximate Positions of the Planets » (éléments valides de 1800 à 2050).</li>',
      '<li>Planètes naines et comète de Halley : JPL Small-Body Database (éléments osculateurs), orbite képlérienne simple.</li>',
      '<li>Lune : formule abrégée de la théorie lunaire (précision de l\'ordre du degré).</li>',
      '<li>Orientation des astres : rapport du groupe de travail de l\'IAU sur les coordonnées cartographiques (WGCCRE).</li>',
      '<li>Données physiques : NASA Planetary Fact Sheets.</li>',
      '<li>Étoiles voisines : catalogues RECONS et SIMBAD, parallaxes Gaia et Hipparcos.</li>',
      '</ul>'
    ].join('');
  };

  pages.credits = function (root) {
    root.innerHTML = [
      '<p class="p-kicker">Crédits</p><h1>Sources et licences</h1>',
      '<h2>Cartes de surface</h2><ul class="credits-list">',
      '<li><b>Solar System Scope</b> — cartes de Mercure, de la Terre, de Mars, de Jupiter, de Saturne et de ses anneaux, d\'Uranus et de Neptune. Licence <a href="https://creativecommons.org/licenses/by/4.0/" rel="noopener" target="_blank">CC BY 4.0</a>, d\'après les données des missions de la NASA. <a href="https://www.solarsystemscope.com/textures/" rel="noopener" target="_blank">solarsystemscope.com/textures</a></li>',
      '<li><b>NASA Scientific Visualization Studio</b> — carte de la Lune (CGI Moon Kit, données de Lunar Reconnaissance Orbiter). Domaine public.</li>',
      '<li><b>NASA Earth Observatory</b> — lumières nocturnes de la Terre (Black Marble, Suomi NPP VIIRS). Domaine public.</li>',
      '</ul>',
      '<h2>Données et calculs</h2><ul class="credits-list">',
      '<li>NASA / JPL : éléments orbitaux des planètes (Standish) et Small-Body Database.</li>',
      '<li>IAU WGCCRE : orientation et rotation des astres.</li>',
      '<li>NASA Planetary Fact Sheets : données physiques.</li>',
      '<li>RECONS, SIMBAD, Gaia, Hipparcos : étoiles du voisinage.</li>',
      '</ul>',
      '<h2>Logiciel</h2><ul class="credits-list">',
      '<li><b>three.js</b> r128 — licence MIT.</li>',
      '<li>Moteur graphique issu du thème <b>Héliosphère</b> de Codex Mental (shaders des planètes, du Soleil, des anneaux et du ciel).</li>',
      '<li>Polices <b>Syne</b>, <b>DM Sans</b> et <b>IBM Plex Mono</b> — licence SIL Open Font, hébergées sur le site.</li>',
      '</ul>',
      '<p>L\'Observatoire est un projet de <a href="https://codexmental.com">Codex Mental</a>.</p>'
    ].join('');
  };
})();

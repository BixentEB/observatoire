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

  pages.methode = function (root) {
    root.innerHTML = [
      '<p class="p-kicker">Méthode</p><h1>Le visuel peut être adapté, les données jamais</h1>',
      '<p class="lead">L\'Observatoire représente les positions calculées des corps célestes pour la date sélectionnée, avec des adaptations visuelles explicitement signalées.</p>',
      '<p>Ce n\'est pas exactement le ciel tel qu\'un observateur le verrait depuis la Terre : les positions affichées sont géométriques, calculées dans un référentiel centré sur le Soleil (l\'écliptique J2000). Vu d\'ici, chaque astre apparaît là où il était quand sa lumière en est partie, quelques minutes plus tôt pour les planètes, plusieurs années pour les étoiles. Les consoles indiquent ce temps de parcours de la lumière.</p>',
      '<div class="legend">',
      '<div class="l-real"><h3>Réel</h3><ul><li>Les objets : rien n\'est inventé.</li><li>Les positions des planètes, des planètes naines, de la comète de Halley et de la Lune, calculées à partir de modèles scientifiques pour la date affichée (précision variable, voir les sources).</li><li>L\'orientation des axes et la rotation des planètes (pôles et méridiens de l\'IAU).</li><li>Les positions 3D des étoiles voisines, issues des mesures de parallaxe.</li><li>Les valeurs des consoles : données scientifiques ou calculées à partir de modèles, avec leurs sources et leurs approximations. Elles sont moins précises pour les comètes et les objets mal connus.</li></ul></div>',
      '<div class="l-adapt"><h3>Adapté, et signalé</h3><ul><li>Les distances : compressées par défaut (badge « Échelle adaptée »), réelles sur demande.</li><li>Les tailles : toujours agrandies.</li><li>Le temps : accéléré, avec l\'allure affichée en permanence.</li><li>La luminosité : relevée pour que les planètes lointaines restent visibles.</li></ul></div>',
      '<div class="l-sim"><h3>Simulé, en attendant mieux</h3><ul><li>Les surfaces des objets sans carte disponible (lunes, planètes naines) : rendu aux couleurs connues.</li><li>Les nuages de Vénus et de la Terre.</li><li>La position des lunes sur leur orbite, sauf pour la Lune.</li><li>Les étoiles lointaines du fond de ciel.</li></ul></div>',
      '<div class="l-hypo"><h3>Hypothèses</h3><p>Mes hypothèses personnelles ont leur propre espace et leur propre couleur. Elles ne sont jamais mêlées aux données.</p></div>',
      '</div>',
      '<p>Ces trois mentions, réel, adapté et simulé, figurent aussi en tête de chaque console, pour la position, l\'aspect et l\'échelle de l\'objet affiché.</p>',
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
      '<li>Positions géométriques héliocentriques : ni le temps de parcours de la lumière ni l\'aberration ne sont appliqués.</li>',
      '<li>Orientation des astres : rapport du groupe de travail de l\'IAU sur les coordonnées cartographiques (WGCCRE).</li>',
      '<li>Données physiques : NASA Planetary Fact Sheets.</li>',
      '<li>Étoiles voisines : catalogues RECONS et SIMBAD, parallaxes Gaia et Hipparcos.</li>',
      '</ul>',
      '<h2 id="credits">Crédits et licences</h2>',
      '<h3>Cartes de surface</h3><ul class="credits-list">',
      '<li><b>Solar System Scope</b> — cartes de Mercure, de la Terre, de Mars, de Jupiter, de Saturne et de ses anneaux, d\'Uranus et de Neptune. Licence <a href="https://creativecommons.org/licenses/by/4.0/" rel="noopener" target="_blank">CC BY 4.0</a>, d\'après les données des missions de la NASA. <a href="https://www.solarsystemscope.com/textures/" rel="noopener" target="_blank">solarsystemscope.com/textures</a></li>',
      '<li><b>NASA Scientific Visualization Studio</b> — carte de la Lune (CGI Moon Kit, données de Lunar Reconnaissance Orbiter). Domaine public.</li>',
      '<li><b>NASA Earth Observatory</b> — lumières nocturnes de la Terre (Black Marble, Suomi NPP VIIRS). Domaine public.</li>',
      '</ul>',
      '<h3>Données et calculs</h3><ul class="credits-list">',
      '<li>NASA / JPL : éléments orbitaux des planètes (Standish) et Small-Body Database.</li>',
      '<li>IAU WGCCRE : orientation et rotation des astres.</li>',
      '<li>NASA Planetary Fact Sheets : données physiques.</li>',
      '<li>RECONS, SIMBAD, Gaia, Hipparcos : étoiles du voisinage.</li>',
      '</ul>',
      '<h3>Logiciel</h3><ul class="credits-list">',
      '<li><b>three.js</b> r128 — licence MIT.</li>',
      '<li>Moteur graphique issu du thème <b>Héliosphère</b> de Codex Mental (shaders des planètes, du Soleil, des anneaux et du ciel).</li>',
      '<li>Polices <b>Syne</b>, <b>DM Sans</b> et <b>IBM Plex Mono</b> — licence SIL Open Font, hébergées sur le site.</li>',
      '</ul>',
      '<p>L\'Observatoire est un projet de <a href="https://codexmental.com">Codex Mental</a>.</p>'
    ].join('');
  };

  /* les crédits sont une section de la page Méthode */
  pages.credits = function (root) {
    pages.methode(root);
    var c = root.querySelector('#credits'); if (c) setTimeout(function () { c.scrollIntoView({ block: 'start' }); }, 60);
  };
})();

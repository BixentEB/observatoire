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

  /* Outils : les instruments pour manipuler et comparer (le simulateur, puis d'autres) */
  pages.outils = function (root) {
    var T = [
      { href: '#/lexique', t: 'Lexique', k: 'Disponible', d: 'Ce qui compose l\'Univers, les éléments, les étoiles (qu\'est-ce qu\'une naine ?), les planètes, les galaxies et les mots pour les mesurer : des définitions courtes, avec une recherche.' },
      { href: '#/simulateur', t: 'Simulateur d\'objets', k: 'Disponible', d: 'Modeler un corps céleste : partir d\'un objet réel ou d\'une page blanche, changer sa taille, ses couleurs, ses anneaux, son atmosphère, puis copier les réglages.' },
      { act: 'galtime', t: 'Temps galactique', k: 'Disponible', d: 'Le Soleil fait le tour de la Voie lactée en environ 230 millions d\'années : remonter le temps jusqu\'à l\'explosion cambrienne, voir où nous étions à l\'époque des dinosaures.' },
      { act: 'photo', t: 'Mode photo', k: 'Disponible', d: 'Choisir ce qui apparaît à l\'écran (noms, orbites, engins, ceintures, plan de l\'écliptique, signature) et enregistrer une image du ciel à la date affichée.' },
      { href: '#/lunaisons', t: 'Lunaisons', k: 'Disponible', d: 'La Lune telle qu\'on la voit à n\'importe quelle date, ses prochaines phases, les super-lunes et un calendrier du mois, calculés à la minute près.' },
      { href: '#/comparateur', t: 'Comparateur', k: 'Disponible', d: 'Deux astres côte à côte, à la même échelle : la Terre et Jupiter, le Soleil et Sirius… puis leurs données face à face, avec le rapport entre les deux.' },
      { soon: true, t: 'Scénarios « et si… »', k: 'À l\'étude', d: 'Et si la Terre avait deux lunes ? Des expériences calculées quand un modèle simple le permet, toujours marquées comme simulées.' }
    ];
    root.innerHTML = '<p class="p-kicker">Outils</p><h1>Manipuler, comparer, capturer</h1>' +
      '<p class="lead">Les instruments de l\'Observatoire. Les données ne changent jamais : les outils permettent de les regarder autrement, ou de modeler un objet à part, clairement marqué comme simulé.</p>' +
      '<div class="tools">' + T.map(function (x) {
        var inner = '<span class="tool-k' + (x.soon ? ' soon' : '') + '">' + esc(x.k) + '</span><h3>' + esc(x.t) + '</h3><p>' + esc(x.d) + '</p>';
        if (x.soon) return '<div class="tool soon">' + inner + '</div>';
        if (x.act) return '<button type="button" class="tool" data-tool="' + x.act + '">' + inner + '</button>';
        return '<a class="tool" href="' + x.href + '">' + inner + '</a>';
      }).join('') + '</div>';
    var ph = root.querySelector('[data-tool="photo"]');
    if (ph) ph.addEventListener('click', function () { location.hash = '#/'; setTimeout(function () { if (OBS.photo) OBS.photo.open(); }, 450); });
    var gtb = root.querySelector('[data-tool="galtime"]');
    if (gtb) gtb.addEventListener('click', function () { location.hash = '#/'; setTimeout(function () { if (OBS.galtime) OBS.galtime.open(); }, 450); });
  };

  /* Méthode : un menu à onglets (Méthode, Crédits), d'autres pourront s'ajouter */
  var INFO_TABS = [['methode', 'Méthode'], ['credits', 'Crédits et licences'], ['ressources', 'Ressources'], ['projet', 'Le projet']];
  function infoTabs(cur) {
    return '<div class="tabs" role="tablist" aria-label="Informations">' + INFO_TABS.map(function (t) {
      return '<a role="tab" class="tab" href="#/' + t[0] + '" aria-selected="' + (t[0] === cur) + '">' + t[1] + '</a>';
    }).join('') + '</div>';
  }
  pages.methode = function (root) {
    root.innerHTML = [
      '<p class="p-kicker">Méthode</p><h1>Le visuel peut être adapté, les données jamais</h1>',
      infoTabs('methode'),
      '<p class="lead">L\'Observatoire représente les positions calculées des corps célestes pour la date sélectionnée, avec des adaptations visuelles explicitement signalées.</p>',
      '<p>Ce n\'est pas exactement le ciel tel qu\'un observateur le verrait depuis la Terre : les positions affichées sont géométriques, calculées dans un référentiel centré sur le Soleil (l\'écliptique J2000). Vu d\'ici, chaque astre apparaît là où il était quand sa lumière en est partie, quelques minutes plus tôt pour les planètes, plusieurs années pour les étoiles. Les consoles indiquent ce temps de parcours de la lumière.</p>',
      '<div class="legend">',
      '<div class="l-real"><h3>Réel</h3><ul><li>Les objets : rien n\'est inventé.</li><li>Les positions des planètes, des planètes naines, de la comète de Halley et de la Lune, calculées à partir de modèles scientifiques pour la date affichée (précision variable, voir les sources).</li><li>L\'orientation des axes et la rotation des planètes (pôles et méridiens de l\'IAU).</li><li>Les positions 3D des étoiles voisines, issues des mesures de parallaxe.</li><li>Les valeurs des consoles : données scientifiques ou calculées à partir de modèles, avec leurs sources et leurs approximations. Elles sont moins précises pour les comètes et les objets mal connus.</li></ul></div>',
      '<div class="l-adapt"><h3>Adapté, et signalé</h3><ul><li>Les distances : compressées par défaut (badge « Échelle adaptée »), réelles sur demande.</li><li>Les tailles : toujours agrandies.</li><li>Le temps : accéléré, avec l\'allure affichée en permanence.</li><li>La luminosité : relevée pour que les planètes lointaines restent visibles.</li></ul></div>',
      '<div class="l-sim"><h3>Simulé, en attendant mieux</h3><ul><li>Les surfaces des objets sans carte disponible (lunes, planètes naines) : rendu aux couleurs connues.</li><li>Les nuages de Vénus et de la Terre.</li><li>La position des lunes sur leur orbite, sauf pour la Lune.</li><li>Les étoiles lointaines du fond de ciel.</li></ul></div>',
      '<div class="l-hypo"><h3>Hypothèses</h3><div><p>Mes hypothèses personnelles ont leur propre espace et leur couleur violette. Les hypothèses proposées par des chercheurs (Planète 9, Némésis, Théia…) ont la leur, en bleu, avec leurs auteurs et leur statut. Ni les unes ni les autres ne sont jamais mêlées aux données.</p><p>Elles ne sont pas pour autant secondaires : presque tout ce qui est aujourd\'hui « réel » a d\'abord été une hypothèse. Neptune a été calculée avant d\'être vue, les ondes gravitationnelles ont attendu un siècle leur confirmation.</p></div></div>',
      '</div>',
      '<p>Ces trois mentions, réel, adapté et simulé, figurent aussi en tête de chaque console, pour la position, l\'aspect et l\'échelle de l\'objet affiché.</p>',
      '<h2>Les échelles</h2>',
      '<p>À l\'échelle réelle, le système solaire est presque entièrement vide : si le Soleil était une balle de tennis, la Terre serait un grain de sable à environ 7 mètres, et Neptune une tête d\'épingle à plus de 200 mètres. Pour que tout tienne à l\'écran, les distances au Soleil sont compressées par une loi de puissance (la distance affichée croît comme la distance réelle à la puissance 0,55). L\'ordre, les orbites, les inclinaisons et les positions relatives restent justes ; seules les proportions changent.</p>',
      '<p>Le réglage « Distances réelles » rétablit des distances proportionnelles. Les tailles, elles, restent agrandies dans les deux modes : à l\'échelle, toutes les planètes seraient invisibles. Elles sont aussi compressées (le rayon affiché croît comme le rayon réel à la puissance 0,4), si bien qu\'une petite planète paraît plus grosse qu\'elle n\'est à côté d\'une géante.</p>',
      '<p>Les lunes suivent une règle à part, pour rester lisibles autour de leur planète. Leur taille garde à peu près la proportion réelle par rapport à leur planète : la Lune fait environ un tiers de la Terre à l\'écran (un peu plus d\'un quart en réalité). Leur distance est réelle, comptée en rayons de la planète, jusqu\'à 2,5 rayons, puis compressée de plus en plus au-delà : la Lune, qui est à 60 rayons terrestres, est affichée à environ 7. Leur ordre et leurs périodes restent réels, et l\'orbite de la Lune est tracée dans son vrai plan, incliné d\'environ 5° sur celui de la Terre autour du Soleil.</p>',
      '<h2>Les engins spatiaux</h2>',
      '<p>Sondes, télescopes, stations et vaisseaux sont placés d\'après JPL Horizons, le service d\'éphémérides du Jet Propulsion Laboratory de la NASA : trajectoires reconstituées pour le passé, prévues pour l\'avenir, et extrapolées pour les sondes qui ne transmettent plus (Pioneer 10 et 11). Ces données sont récupérées chaque jour. Un engin n\'apparaît que pour les dates couvertes : en dehors, il n\'est pas affiché plutôt que d\'être placé au hasard. Les vols terminés, comme Artemis II, peuvent être revécus en revenant à leurs dates.</p>',
      '<p>Près d\'un astre, un engin est placé dans sa vraie direction, mais à une distance compressée comme celle des lunes : l\'ISS, à 400 km d\'altitude, rase la Terre ; le télescope Webb, à 1,5 million de km, est affiché un peu au-delà de la Lune. Le repère qui le représente est symbolique. Le réglage « Engins spatiaux » permet de les masquer. Les rovers et atterrisseurs figurent parmi les lieux remarquables de la surface, à leur site d\'arrivée.</p>',
      '<h2>Le temps</h2>',
      '<p>La scène démarre à la date et à l\'heure d\'aujourd\'hui. On peut accélérer de « temps réel » jusqu\'à « un an par seconde », revenir en arrière ou revenir à aujourd\'hui. Au-delà de deux jours par seconde, la rotation des planètes sur elles-mêmes est ralentie à l\'écran pour éviter un effet stroboscopique ; les positions sur les orbites, elles, restent exactes.</p>',
      '<h2>Les niveaux</h2>',
      '<p>On passe d\'un niveau à l\'autre en zoomant : un objet, le système solaire, le voisinage stellaire, puis la Voie lactée. Chaque niveau a sa propre scène et sa propre échelle, pour garder la précision du calcul.</p>',
      '<h2>Le Groupe local</h2>',
      '<p>Au-delà de la Voie lactée, le Groupe local réunit Andromède, le Triangle et des dizaines de galaxies naines. Leurs positions (direction et distance) sont mesurées et affichées à l\'échelle réelle ; Andromède et le Triangle sont orientés selon leur inclinaison et leur angle de position observés. Leur aspect, lui, est reconstitué : des points répartis selon leur forme et leur taille.</p>',
      '<h2>Les exoplanètes</h2>',
      '<p>Quinze systèmes d\'exoplanètes remarquables sont placés dans la Voie lactée à leurs positions mesurées, et visitables. Leurs données viennent du NASA Exoplanet Archive (valeurs arrondies). Selon la méthode de découverte, on connaît une masse minimale (vitesses radiales), une masse mesurée (variations des passages) ou seulement un rayon (transits), dont la masse est alors estimée : la console le précise. Aucune image de ces planètes n\'existe : leur aspect est simulé.</p>',
      '<h2>La Voie lactée, une reconstitution</h2>',
      '<p>Nous sommes à l\'intérieur de notre galaxie, derrière des nuages de poussière : aucune image ne la montre de l\'extérieur. Celle de l\'Observatoire est reconstituée à partir des mesures. Les bras spiraux suivent les spirales ajustées par Reid et ses collègues (2019) sur les distances de nuages de formation d\'étoiles, mesurées par interférométrie radio ; au-delà des portions mesurées, surtout de l\'autre côté du centre, ils sont prolongés avec le même enroulement. La barre centrale (demi-longueur ≈ 16 000 années-lumière, inclinée de ≈ 27°), le bulbe, le disque et son épaisseur suivent les modèles publiés ; la distance du Soleil au centre (≈ 26 670 années-lumière) vient de la collaboration GRAVITY (2019). Les étoiles dessinées sont des points répartis selon ces densités, pas des étoiles cataloguées. Le badge « Reconstitution », en bas à gauche, permet de griser les portions de bras qui ne sont pas mesurées mais prolongées. Les objets repères (nébuleuses, amas, trous noirs, galaxies satellites) sont à leurs positions mesurées. Les distances sont à l\'échelle réelle : une unité, cent années-lumière. La galaxie est figée : un tour du Soleil autour du centre prend 230 millions d\'années.</p>',
      '<h2>Les objets hypothétiques</h2>',
      '<p>Certains objets sont supposés par les astronomes sans avoir jamais été observés, comme la Planète 9. Ils sont affichés à part (calque « Objets hypothétiques » de la légende), dans la couleur des hypothèses de chercheurs (bleu), et jamais comme un astre : la Planète 9 apparaît comme une zone de probabilité, des points répartis le long des orbites possibles publiées (M. Brown et K. Batygin, 2021), avec leurs incertitudes. Sa fiche ne contient que des valeurs publiées ; l\'hypothèse elle-même est présentée dans <a href="#/hypotheses/chercheurs/planete-9">Hypothèses de chercheurs</a>.</p>',
      '<h2>Plan de l\'écliptique, inclinaisons et vues</h2>',
      '<p>Le plan de l\'écliptique, celui de l\'orbite de la Terre, sert de référence. Il peut être affiché comme une grille translucide (cercles à 1, 2, 5, 10, 20, 30, 40, 50 et 100 UA, rayons tous les 30° de longitude, la longitude 0, direction du point vernal, en doré). Le réglage « Inclinaison des orbites » relie une orbite à ce plan par des traits verticaux, trace son ombre dans le plan et la ligne des nœuds, là où elle le traverse, avec la valeur de l\'inclinaison. Avec la vue « Profil », on voit le système par la tranche : les orbites très inclinées, comme celles d\'Éris, de Pluton ou de la comète de Halley, ressortent nettement. En échelle adaptée, les distances sont compressées mais les angles d\'inclinaison restent justes.</p>',
      '<h2>Les reconstitutions</h2>',
      '<p>Quand aucune image réelle n\'existe, comme pour notre galaxie vue de l\'extérieur, la représentation se fonde sur les calculs et les représentations officielles, éventuellement retravaillés dans leur aspect (couleur, densité), tout en restant proche de ce que la science juge probable. Une reconstitution est toujours étiquetée comme telle. Une éventuelle touche de fantaisie ne sera ajoutée que si elle reste acceptable, et elle sera signalée.</p>',
      '<h2>Sources des calculs</h2>',
      '<ul>',
      '<li>Planètes : E. M. Standish, JPL, « Approximate Positions of the Planets » (éléments valides de 1800 à 2050).</li>',
      '<li>Planètes naines et comète de Halley : JPL Small-Body Database (éléments osculateurs), orbite képlérienne simple.</li>',
      '<li>Lune : formule abrégée de la théorie lunaire (précision de l\'ordre du degré).</li>',
      '<li>Positions géométriques héliocentriques : ni le temps de parcours de la lumière ni l\'aberration ne sont appliqués.</li>',
      '<li>Surfaces : cartes réelles de la Lune, de Mars, de Mercure, des grandes lunes et des planètes naines. Le relief réel (altimétrie) est représenté pour la Lune (LOLA), Mars (MOLA), Mercure (MESSENGER), Cérès (Dawn), Pluton et Charon (New Horizons, hémisphère photographié seulement) ; ailleurs, la surface est éclairée comme une sphère lisse, sans relief inventé. Pour la Lune, couleurs de la mosaïque LROC (≈ 2,7 km par pixel) et relief LOLA (≈ 1,9 km par pixel), éclairés par le vrai Soleil. Les ombres que les reliefs projettent sur leurs voisins ne sont pas calculées. De très près, l\'image devient floue : aucun détail n\'est inventé au-delà de la résolution des données.</li>',
      '<li>Engins spatiaux : NASA/JPL, service JPL Horizons (vecteurs d\'état et éléments orbitaux osculateurs), récupérés chaque jour.</li>',
      '<li>Orientation des astres : rapport du groupe de travail de l\'IAU sur les coordonnées cartographiques (WGCCRE).</li>',
      '<li>Données physiques : NASA Planetary Fact Sheets.</li>',
      '<li>Étoiles voisines : catalogues RECONS et SIMBAD, parallaxes Gaia et Hipparcos.</li>',
      '</ul>',
    ].join('');
  };

  /* Le projet : qui le fait, comment, et comment écrire */
  pages.projet = function (root) {
    root.innerHTML = [
      '<p class="p-kicker">Méthode</p><h1>Un humain, des IA, et beaucoup de ciel</h1>',
      infoTabs('projet'),
      '<p class="lead">L\'Observatoire est né d\'une envie simple : pouvoir se promener dans l\'espace tel qu\'il est vraiment, cliquer sur un astre et en apprendre un peu plus, sans jamais se faire raconter d\'histoires.</p>',
      '<h2>Qui le fait</h2>',
      '<p>Je m\'appelle Vincent, et je fais aussi <a href="https://codexmental.com">Codex Mental</a>, mon site d\'articles, de réflexions et d\'expériences. Je n\'ai aucune formation scientifique ni astronomique : juste de la curiosité, beaucoup de questions, et le goût des choses bien faites. C\'est justement pour ça que l\'Observatoire tient à sa règle d\'or : le visuel peut être adapté, les données jamais. Et quand une chose n\'est pas connue, on le dit.</p>',
      '<p>Mes propres idées sur l\'espace ont leur coin à part, les <a href="#/hypotheses">Hypothèses</a> : des pistes personnelles, spéculatives, à côté d\'hypothèses célèbres proposées par des chercheurs, jamais mêlées aux données.</p>',
      '<h2>Comment il est fait</h2>',
      '<p>L\'Observatoire se construit à plusieurs, avec des intelligences artificielles, et je préfère le dire clairement.</p>',
      '<ul class="credits-list">',
      '<li><b>Moi</b> — l\'idée, la direction, les choix, les essais sur tous mes écrans, les remarques (« la Lune est trop grosse », « les planètes se rentrent dedans »…) et les hypothèses.</li>',
      '<li><b>Claude</b> (Anthropic) — l\'écriture du code, la recherche et la vérification des données auprès des sources officielles (NASA, JPL, ESA, USGS, IAU…), les calculs de positions, et les textes des fiches.</li>',
      '<li><b>ChatGPT</b> (OpenAI) — un second regard : relectures, idées et suggestions d\'amélioration, comme le mode qui distingue ce qui est mesuré de ce qui est reconstitué dans la Voie lactée.</li>',
      '</ul>',
      '<p>Chaque nouveauté est discutée, testée, puis validée avant d\'être publiée. Les IA peuvent pourtant se tromper, et moi aussi : si vous repérez une erreur, une date douteuse ou un astre mal placé, dites-le-moi, je corrigerai.</p>',
      '<h2>Ce qu\'on a construit</h2>',
      '<p>Commencé en octobre 2026, l\'Observatoire couvre déjà, du plus grand au plus petit :</p>',
      '<ul>',
      '<li>le <b>Groupe local</b>, avec Andromède, le Triangle et une douzaine de galaxies naines à leurs positions mesurées ;</li>',
      '<li>la <b>Voie lactée</b>, reconstituée d\'après les mesures, avec des repères et quinze systèmes d\'exoplanètes à visiter ;</li>',
      '<li>le <b>voisinage stellaire</b>, les étoiles à moins de 12 années-lumière et leurs planètes ;</li>',
      '<li>le <b>système solaire</b> à la date du jour : planètes, lunes, planètes naines, comète de Halley, surfaces réelles et lieux remarquables, et les sondes et stations envoyées depuis la Terre, positionnées d\'après le JPL ;</li>',
      '<li>l\'<a href="#/atlas">Atlas</a>, la recherche, les <a href="#/outils">outils</a> et la page Méthode, qui dit pour chaque chose ce qui est réel, adapté ou simulé.</li>',
      '</ul>',
      '<p>Et ce n\'est qu\'un début : carte des lunaisons, dôme des constellations vu depuis chez vous, comparateur, visites guidées… sont dans les cartons.</p>',
      '<h2>Écrire</h2>',
      '<p>Une question, une erreur repérée, une idée d\'astre à ajouter ?</p>',
      '<div class="c-chips"><a class="btn btn-main mlink" data-u="tcatnoc" data-d="moc.latnemxedoc" href="#">✉ Écrire à Vincent</a><a class="btn" href="https://codexmental.com" rel="noopener" target="_blank">Codex Mental</a><a class="btn" href="https://github.com/BixentEB/observatoire" rel="noopener" target="_blank">Le code sur GitHub</a></div>',
      '<p class="note" style="margin-top:12px">Le bouton ouvre votre messagerie habituelle, avec mon adresse déjà remplie.</p>'
    ].join('');
  };

  /* adresse de contact : assemblée seulement au clic, jamais affichée ni écrite en clair (les robots qui aspirent les adresses ne la voient pas) */
  function rev(x) { return x.split('').reverse().join(''); }
  function mails(root) {
    Array.prototype.forEach.call(root.querySelectorAll('[data-u][data-d]'), function (m) {
      m.addEventListener('click', function (e) { e.preventDefault(); location.href = 'mai' + 'lto:' + rev(m.getAttribute('data-u')) + String.fromCharCode(64) + rev(m.getAttribute('data-d')) + '?subject=Observatoire'; });
    });
  }
  var _projet = pages.projet;
  pages.projet = function (root) { _projet(root); mails(root); };

  pages.credits = function (root) {
    root.innerHTML = [
      '<p class="p-kicker">Méthode</p><h1>Crédits et licences</h1>',
      infoTabs('credits'),
      '<p class="lead">Les images, données et logiciels qui font l\'Observatoire, avec leurs auteurs et leurs licences.</p>',
      '<h3>Cartes de surface</h3><ul class="credits-list">',
      '<li><b>Solar System Scope</b> — cartes de la Terre, de Jupiter, de Saturne et de ses anneaux, d\'Uranus et de Neptune. Licence <a href="https://creativecommons.org/licenses/by/4.0/" rel="noopener" target="_blank">CC BY 4.0</a>, d\'après les données des missions de la NASA. <a href="https://www.solarsystemscope.com/textures/" rel="noopener" target="_blank">solarsystemscope.com/textures</a></li>',
      '<li><b>NASA Scientific Visualization Studio</b>, CGI Moon Kit — carte de la Lune (mosaïque de la caméra LROC, en 2k et 4k) et relief (altimètre laser LOLA de Lunar Reconnaissance Orbiter), domaine public. Le relief est converti ici en carte de pentes ; les conversions intermédiaires viennent du projet libre LUNAOPS.</li>',
      '<li><b>NASA Earth Observatory</b> — lumières nocturnes de la Terre (Black Marble, Suomi NPP VIIRS). Domaine public.</li>',
      '<li><b>Relief de Mercure, Cérès, Pluton et Charon</b> — altimétrie publiée par l\'USGS Astrogeology : MESSENGER, modèle global 665 m (Becker et al. 2016) ; Dawn, modèle DLR 60 px/° (Preusker et al. 2016) ; New Horizons, modèles 300 m (Schenk et al. 2018). Converties en cartes de pentes par le script <code>tools/relief.py</code>, sans exagération ; la forme générale (aplatissement) est retirée pour ne garder que le relief local.</li>' +
      '<li><b>Mars</b> — mosaïque couleur Viking MDIM 2.1 (NASA/USGS) et relief de l\'altimètre MOLA (NASA/GSFC, MOLA Science Team), domaine public, d\'après les conversions du projet libre « Rotating Mars » de François Gourdeau. La dominante bleue des régions sombres de la mosaïque a été atténuée.</li>',
      '<li><b>Mercure</b> — mosaïque MESSENGER MDIS (NASA/JHUAPL/Carnegie Institution, via l\'USGS), domaine public, couleurs ramenées vers le naturel par le projet « solar-system-model ».</li>',
      '<li><b>Lunes et planètes naines</b> — mosaïques de l\'USGS et de la NASA (Galileo, Voyager, Cassini, New Horizons, Dawn ; cartes de Paul Schenk au LPI ; cartes de Phil Stooke pour Phobos et Déimos), domaine public, préparées par le projet « solar-system » d\'A. Marcher (teintes atténuées ou ajoutées sur les mosaïques en noir et blanc, zones jamais photographiées en gris).</li>',
      '</ul>',
      '<h3>Données et calculs</h3><ul class="credits-list">',
      '<li>Planète 9 : K. Batygin et M. Brown (2016), M. Brown et K. Batygin, « The Orbit of Planet Nine » (2021). Arrokoth : JPL Small-Body Database et mission New Horizons (NASA/JHUAPL/SwRI).</li>',
      '<li>NASA / JPL : éléments orbitaux des planètes (Standish), Small-Body Database et trajectoires des engins spatiaux (Horizons).</li>',
      '<li>IAU WGCCRE : orientation et rotation des astres.</li>',
      '<li>IAU, Gazetteer of Planetary Nomenclature, et NASA : noms et coordonnées des lieux remarquables (cratères, mers, volcans, sites d\'atterrissage).</li>',
      '<li>NASA Planetary Fact Sheets : données physiques.</li>',
      '<li>RECONS, SIMBAD, Gaia, Hipparcos : étoiles du voisinage.</li>',
      '</ul>',
      '<h3>Logiciel</h3><ul class="credits-list">',
      '<li><b>three.js</b> r128 — licence MIT.</li>',
      '<li>Moteur graphique propre à l\'Observatoire : il est parti des premiers essais du thème <b>Héliosphère</b> de Codex Mental, puis a été entièrement développé pour ce site (niveaux, données réelles, shaders des planètes, du Soleil, des anneaux et du ciel).</li>',
      '<li>Polices <b>Syne</b>, <b>DM Sans</b> et <b>IBM Plex Mono</b> — licence SIL Open Font, hébergées sur le site.</li>',
      '</ul>',
      '<p>L\'Observatoire est un projet de <a href="https://codexmental.com">Codex Mental</a>.</p>'
    ].join('');
  };

  /* Ressources : les sources de données utilisées, puis des sites de référence pour aller plus loin */
  var SOURCES = [
    ['Positions et trajectoires', [
      ['JPL Horizons', 'https://ssd.jpl.nasa.gov/horizons/', 'NASA/JPL — éphémérides des planètes, des lunes, des petits corps et des engins spatiaux.'],
      ['JPL Small-Body Database', 'https://ssd.jpl.nasa.gov/tools/sbdb_lookup.html', 'Orbites des astéroïdes et des comètes.'],
      ['CNEOS, rapprochements de la Terre', 'https://cneos.jpl.nasa.gov/ca/', 'Dates et distances des passages d\'astéroïdes près de la Terre.']]],
    ['Étoiles, exoplanètes et galaxies', [
      ['Gaia (ESA)', 'https://www.cosmos.esa.int/web/gaia', 'Positions et distances de près de 2 milliards d\'étoiles.'],
      ['NASA Exoplanet Archive', 'https://exoplanetarchive.ipac.caltech.edu/', 'Catalogue des exoplanètes confirmées.'],
      ['RECONS et SIMBAD', 'https://simbad.cds.unistra.fr/simbad/', 'Étoiles du voisinage solaire, base du CDS de Strasbourg.'],
      ['Reid et al. (2019)', 'https://doi.org/10.3847/1538-4357/ab4a11', 'Bras spiraux de la Voie lactée mesurés par interférométrie radio.'],
      ['McConnachie (2012)', 'https://doi.org/10.1088/0004-6256/144/1/4', 'Catalogue des galaxies du Groupe local.']]],
    ['Cartes et images', [
      ['USGS Astrogeology', 'https://astrogeology.usgs.gov/', 'Cartes et reliefs des planètes et des lunes.'],
      ['NASA Scientific Visualization Studio', 'https://svs.gsfc.nasa.gov/', 'Carte et relief de la Lune.'],
      ['Wikimedia Commons', 'https://commons.wikimedia.org/', 'Photographies libres, avec leurs auteurs et leurs licences.']]]
  ];
  var SITES = [
    ['Agences spatiales', [
      ['NASA', 'https://science.nasa.gov/', 'Missions, découvertes et images de l\'agence américaine.'],
      ['ESA', 'https://www.esa.int/', 'Agence spatiale européenne, missions et actualités.'],
      ['CNES', 'https://cnes.fr/', 'Agence spatiale française.']]],
    ['Observer et explorer', [
      ['Stellarium Web', 'https://stellarium-web.org/', 'Le ciel de chez soi, en direct dans le navigateur.'],
      ['NASA Eyes on the Solar System', 'https://eyes.nasa.gov/apps/solar-system/', 'Le système solaire et les sondes en 3D, par la NASA.'],
      ['IMCCE', 'https://www.imcce.fr/', 'Institut de mécanique céleste de l\'Observatoire de Paris : éphémérides et calendriers.']]],
    ['Images et actualités', [
      ['Astronomy Picture of the Day', 'https://apod.nasa.gov/apod/', 'Une image commentée par jour, depuis 1995.'],
      ['ESA/Hubble et ESA/Webb', 'https://esahubble.org/', 'Les images des télescopes spatiaux Hubble et James Webb.'],
      ['NASA Photojournal', 'https://photojournal.jpl.nasa.gov/', 'Les images des missions planétaires.']]]
  ];
  function resList(groups) {
    return groups.map(function (g) {
      return '<section class="res-g"><h3>' + esc(g[0]) + '</h3><div class="res-pills">' + g[1].map(function (x) {
        return '<a class="res-pill" href="' + x[1] + '" target="_blank" rel="noopener"><b>' + esc(x[0]) + '</b><span>' + esc(x[2]) + '</span></a>';
      }).join('') + '</div></section>';
    }).join('');
  }
  pages.ressources = function (root) {
    root.innerHTML = '<p class="p-kicker">Méthode</p><h1>Ressources</h1>' + infoTabs('ressources') +
      '<p class="lead">Les sources des données de l\'Observatoire, puis des sites de référence pour aller plus loin. Chaque bouton ouvre le site dans un nouvel onglet.</p>' +
      '<h2>Sources des données</h2>' + resList(SOURCES) +
      '<h2>Sites de référence</h2>' + resList(SITES) +
      '<p class="note" style="margin-top:28px">Les crédits détaillés des images et des logiciels sont dans l\'onglet <a href="#/credits">Crédits et licences</a>.</p>';
  };

})();

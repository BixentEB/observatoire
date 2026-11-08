/* ======================================================================
   OBSERVATOIRE — Hypothèses › « Sommes-nous seuls ? » (#/hypotheses/seuls)
   Ce que l'on sait, les indices à l'étude, le paradoxe de Fermi, l'équation de Drake (calculateur),
   la recherche (SETI, biosignatures), les messages envoyés et les PAN traités sérieusement.
   Chaque ligne porte sa nature : fait établi (vert), indice à l'étude (or), hypothèse (bleu), fiction (gris).
   État des connaissances : novembre 2026 (sources en bas de page).
   ====================================================================== */
(function () {
  'use strict';
  var OBS = window.OBS = window.OBS || {}, esc = OBS.esc;
  var K = { fait: ['fait', 'Fait établi'], indice: ['indice', 'Indice à l\'étude'], hypo: ['hypo', 'Hypothèse'], fiction: ['fiction', 'Fiction'] };
  function row(kind, title, sub, body, links) {
    return '<article class="row sq-row"><div class="row-h"><span class="sq-k sq-' + K[kind][0] + '">' + K[kind][1] + '</span><h3>' + title + '</h3>' + (sub ? '<p class="row-kind">' + sub + '</p>' : '') + '</div>' +
      '<div class="row-b"><p>' + body + '</p>' + (links ? '<p class="row-links">' + links + '</p>' : '') + '</div></article>';
  }
  function sec(id, title, intro, rows) { return '<section class="sq-sec" id="sq-' + id + '"><h2>' + title + '</h2>' + (intro ? '<p class="sq-intro">' + intro + '</p>' : '') + '<div class="rows">' + rows.join('') + '</div></section>'; }

  /* ---------- équation de Drake ---------- */
  // [clé, nom, explication, min, max, défaut, échelle log ?, nature, format]
  var DRAKE = [
    ['R', 'Étoiles qui naissent chaque année dans la Voie lactée', 'Mesuré : environ 1,5 à 3 par an.', 1, 3, 2, false, 'fait'],
    ['fp', 'Part de ces étoiles qui ont des planètes', 'Mesuré : presque toutes (missions Kepler et TESS).', .5, 1, 1, false, 'fait'],
    ['ne', 'Planètes habitables par système', 'Estimé : de 0,1 à 0,4 selon les études (zone où l\'eau peut rester liquide).', .05, .5, .2, false, 'indice'],
    ['fl', 'Part où la vie apparaît', 'Inconnu : sur Terre, la vie est apparue tôt, mais nous n\'avons qu\'un seul exemple.', 1e-6, 1, .1, true, 'hypo'],
    ['fi', 'Part où naît une intelligence', 'Inconnu : sur Terre, il a fallu environ 4 milliards d\'années.', 1e-6, 1, .01, true, 'hypo'],
    ['fc', 'Part qui émet des signaux détectables', 'Inconnu.', 1e-3, 1, .1, true, 'hypo'],
    ['L', 'Durée pendant laquelle elle émet (années)', 'Inconnu : nous émettons des ondes radio depuis environ 100 ans.', 10, 1e8, 1e4, true, 'hypo']
  ];
  var PRESETS = { pessimiste: { R: 1.5, fp: 1, ne: .1, fl: 1e-4, fi: 1e-4, fc: .01, L: 500 }, median: { R: 2, fp: 1, ne: .2, fl: .1, fi: .01, fc: .1, L: 1e4 }, optimiste: { R: 3, fp: 1, ne: .4, fl: 1, fi: .5, fc: .5, L: 1e6 } };
  function nf(v, d) { return v.toLocaleString('fr-FR', { maximumFractionDigits: d === undefined ? 0 : d }); }
  function fmt(v) { if (v >= 1000) return nf(v); if (v >= 10) return nf(v, 0); if (v >= 1) return nf(v, 1); if (v >= .01) return nf(v, 2); var e = Math.floor(Math.log10(v)); return '1 sur ' + nf(Math.round(1 / v)); }
  function drakeUI() {
    return '<div class="dk">' + DRAKE.map(function (d) {
      return '<div class="dk-r"><label for="dk-' + d[0] + '"><b>' + d[1] + '</b><small><span class="sq-dot sq-' + d[7] + '"></span>' + d[2] + '</small></label>' +
        '<input type="range" id="dk-' + d[0] + '" data-k="' + d[0] + '" min="0" max="1000" step="1"><output data-o="' + d[0] + '"></output></div>';
    }).join('') + '<div class="dk-pre">Essayer : <button type="button" data-p="pessimiste">pessimiste</button><button type="button" data-p="median">médian</button><button type="button" data-p="optimiste">optimiste</button></div>' +
      '<div class="dk-res"><p class="dk-n"></p><p class="dk-t"></p></div></div>';
  }
  function bindDrake(root) {
    var st = {}; DRAKE.forEach(function (d) { st[d[0]] = d[5]; });
    function toPos(d, v) { return d[6] ? (Math.log10(v) - Math.log10(d[3])) / (Math.log10(d[4]) - Math.log10(d[3])) * 1000 : (v - d[3]) / (d[4] - d[3]) * 1000; }
    function fromPos(d, p) { var t = p / 1000; return d[6] ? Math.pow(10, Math.log10(d[3]) + t * (Math.log10(d[4]) - Math.log10(d[3]))) : d[3] + t * (d[4] - d[3]); }
    function draw() {
      DRAKE.forEach(function (d) { root.querySelector('#dk-' + d[0]).value = Math.round(toPos(d, st[d[0]])); root.querySelector('[data-o="' + d[0] + '"]').textContent = d[0] === 'L' ? nf(st.L) + ' ans' : fmt(st[d[0]]); });
      var N = st.R * st.fp * st.ne * st.fl * st.fi * st.fc * st.L;
      var V = Math.PI * 50000 * 50000 * 1000;                     // disque de la Voie lactée : 100 000 al de diamètre, ≈ 1 000 al d'épaisseur
      root.querySelector('.dk-n').innerHTML = N >= 1 ? 'N ≈ <b>' + nf(N, N < 10 ? 1 : 0) + '</b> civilisation' + (N >= 2 ? 's' : '') + ' détectable' + (N >= 2 ? 's' : '') + ' en ce moment dans la Voie lactée' : 'N : <b>moins d\'une</b> civilisation détectable en ce moment (environ 1 chance sur ' + nf(Number((1 / N).toPrecision(2))) + ')';
      root.querySelector('.dk-t').textContent = N < 1 ? 'Avec ces réglages, il est probable qu\'aucune autre civilisation n\'émette en ce moment dans notre galaxie.' :
        N < 2 ? 'Avec ces réglages, nous serions probablement la seule.' :
        'En moyenne, la plus proche serait à environ ' + nf(Math.round(Math.pow(V / N, 1 / 3) / 100) * 100) + ' années-lumière' + (Math.pow(V / N, 1 / 3) * 2 > 200 ? ' : un signal mettrait des siècles pour un aller-retour.' : '.');
    }
    root.querySelectorAll('.dk input').forEach(function (inp) { inp.addEventListener('input', function () { var d = DRAKE.filter(function (x) { return x[0] === inp.getAttribute('data-k'); })[0]; st[d[0]] = fromPos(d, +inp.value); draw(); }); });
    root.querySelectorAll('[data-p]').forEach(function (b) { b.addEventListener('click', function () { var p = PRESETS[b.getAttribute('data-p')]; Object.keys(p).forEach(function (k) { st[k] = p[k]; }); draw(); }); });
    draw();
  }

  // onglets : chacun montre une ou plusieurs parties ; les anciennes ancres (fermi) mènent au bon onglet
  var TABS = [['sait', 'Ce que l\'on sait', ['sait']], ['indices', 'Les indices', ['indices']], ['paradoxes', 'Les paradoxes', ['fermi', 'autres']], ['drake', 'L\'équation de Drake', ['drake']], ['chercher', 'Chercher', ['chercher']], ['messages', 'Nos messages', ['messages']], ['pan', 'Les PAN', ['pan']]];
  OBS.seulsPage = function (root, tabsHTML, sub) {
    if (sub === 'fermi' || sub === 'autres') sub = 'paradoxes';
    var cur = TABS.filter(function (t) { return t[0] === sub; })[0] || TABS[0], idx = TABS.indexOf(cur);
    var h = [];
    h.push(tabsHTML);
    h.push('<div class="h-intro sq"><b>Sommes-nous seuls ?</b> Personne n\'a encore trouvé de vie ailleurs que sur Terre. Mais la question n\'a jamais été autant étudiée : voici ce que l\'on sait, ce que l\'on cherche et ce qui reste ouvert, en séparant toujours les faits, les indices et les hypothèses.</div>');
    h.push('<div class="sq-leg">' + ['fait', 'indice', 'hypo', 'fiction'].map(function (k) { return '<span class="sq-k sq-' + K[k][0] + '">' + K[k][1] + '</span>'; }).join('') + '<span class="sq-when">État des connaissances : novembre 2026</span></div>');
    h.push('<nav class="tabs sq-tabs" role="tablist" aria-label="Parties">' + TABS.map(function (t) { return '<a role="tab" class="tab" href="#/hypotheses/seuls/' + t[0] + '" aria-selected="' + (t === cur) + '">' + t[1] + '</a>'; }).join('') + '</nav>');

    h.push(sec('sait', 'Ce que l\'on sait', null, [
      row('fait', 'Aucune preuve de vie ailleurs', 'Novembre 2026', 'Aucune observation n\'a encore démontré l\'existence d\'une vie extraterrestre, même microscopique. Plusieurs indices sont étudiés (ci-dessous), aucun n\'est confirmé.'),
      row('fait', 'Les planètes sont partout', 'Plus de 6 000 exoplanètes confirmées', 'La NASA a franchi le cap des 6 000 exoplanètes confirmées en septembre 2025. Presque toutes les étoiles ont des planètes, et une part importante d\'entre elles tourne dans la zone où l\'eau peut rester liquide.', '<a href="#/galaxie/trappist1">TRAPPIST-1 dans l\'Observatoire</a><span class="sep">·</span><a href="#/lexique/planetes/zone-habitable">Zone habitable</a>'),
      row('fait', 'Les briques de la vie sont communes', 'Comètes, météorites, astéroïdes', 'Des acides aminés ont été trouvés dans des météorites (Murchison, 1969) et sur la comète Tchourioumov-Guérassimenko (Rosetta). Les grains rapportés de l\'astéroïde Bennu contiennent 14 des 20 acides aminés de la vie terrestre et les cinq bases de l\'ADN et de l\'ARN (2025). Des briques, pas des êtres vivants.', '<a href="#/atlas/visiteurs">Les visiteurs du système solaire</a>'),
      row('fait', 'Des océans cachés', 'Europe, Encelade, Titan, Ganymède', 'Plusieurs lunes abritent un océan d\'eau liquide sous leur glace. Les panaches d\'Encelade contiennent du sel, des molécules organiques et du phosphore (Cassini). Ce sont aujourd\'hui les endroits les plus prometteurs du système solaire.', '<a href="#/explorer/encelade">Encelade</a><span class="sep">·</span><a href="#/explorer/europe">Europe</a><span class="sep">·</span><a href="#/explorer/titan">Titan</a>')
    ]));

    h.push(sec('indices', 'Les indices à l\'étude', 'Des signaux intrigants, publiés et discutés. Aucun n\'est une preuve : chacun a aussi une explication sans vie possible.', [
      row('indice', 'Sapphire Canyon, sur Mars', 'Perseverance · annoncé en septembre 2025', 'Dans la roche « Cheyava Falls », le rover a trouvé des taches dites « léopard » contenant des minéraux (vivianite, greigite) qui, sur Terre, sont souvent produits par des microbes. La NASA parle de « biosignature potentielle » : des réactions chimiques sans vie pourraient aussi les expliquer. L\'échantillon est scellé à bord du rover, en attente d\'un retour sur Terre dont le calendrier est incertain.', '<a href="#/explorer/mars">Mars</a>'),
      row('indice', 'K2-18 b et le sulfure de diméthyle', 'Télescope James Webb · 2023-2025', 'En 2025, une équipe de Cambridge annonce un signal de sulfure de diméthyle (DMS), une molécule produite sur Terre par le plancton. Une réanalyse menée par la NASA avec de nouvelles observations ne trouve qu\'un signal faible (2,7 sigma, loin des 5 sigma d\'une détection). Le DMS peut aussi se former sans vie. Non confirmé.'),
      row('indice', 'La phosphine de Vénus', '2020', 'Un gaz associé à la vie sur Terre aurait été repéré dans les nuages de Vénus. Les mesures suivantes ont réduit ou contesté le signal ; le débat n\'est pas tranché.', '<a href="#/explorer/venus">Vénus</a>'),
      row('indice', 'Le signal « Wow! »', '15 août 1977 · radiotélescope Big Ear', 'Un signal radio très fort de 72 secondes, jamais revu malgré des dizaines de recherches. Une étude de 2024 propose une cause naturelle : un nuage d\'hydrogène brièvement illuminé par l\'éclair d\'une étoile à neutrons.')
    ]));

    h.push(sec('fermi', 'Le paradoxe de Fermi', 'En 1950, à Los Alamos, le physicien Enrico Fermi demande au déjeuner : « Où sont-ils ? » La galaxie a plus de 10 milliards d\'années ; une civilisation un peu en avance aurait eu le temps de la parcourir. Pourquoi ne voit-on personne ? Les réponses proposées sont des hypothèses, aucune n\'est démontrée.', [
      row('hypo', 'La Terre rare', 'P. Ward et D. Brownlee, 2000', 'La vie simple serait courante, mais la vie complexe exigerait une suite de hasards très rares : une grosse Lune qui stabilise l\'axe, Jupiter qui détourne les comètes, une tectonique des plaques…'),
      row('hypo', 'Le Grand Filtre', 'R. Hanson, 1996', 'Quelque part entre la chimie et une civilisation qui voyage entre les étoiles, une étape serait presque infranchissable. Si elle est derrière nous (l\'apparition de la vie, par exemple), nous sommes une exception ; si elle est devant, l\'avenir est inquiétant.'),
      row('hypo', 'Trop loin, trop bref', 'Distances et durées', 'Les civilisations seraient nombreuses mais séparées par des centaines d\'années-lumière, et elles n\'émettraient que pendant une courte période : nos signaux se croiseraient rarement au bon moment.'),
      row('hypo', 'Nous avons à peine cherché', 'J. Wright et al., 2018', 'Comparée à tout ce qu\'il faudrait explorer (directions, fréquences, intensités), la recherche menée depuis 1960 équivaut à examiner un bain à remous pour conclure qu\'il n\'y a pas de poissons dans les océans.'),
      row('hypo', 'L\'hypothèse du zoo', 'J. Ball, 1973', 'Des civilisations avancées nous observeraient sans se manifester, comme on observe une réserve naturelle.'),
      row('fiction', 'La forêt sombre', 'Liu Cixin, roman, 2008', 'Chaque civilisation se cacherait par peur des autres. Une idée de science-fiction, souvent citée dans les débats, mais sans base scientifique.')
    ]));

    h.push(sec('autres', 'D\'autres paradoxes', 'La question de la vie dans l\'Univers pose d\'autres énigmes que le silence des étoiles. Le paradoxe lui-même est un fait (une contradiction apparente) ; les explications proposées sont des hypothèses, sauf quand elles sont démontrées.', [
      row('fait', 'Le paradoxe du jeune Soleil faible', 'C. Sagan et G. Mullen, 1972', 'Il y a 4 milliards d\'années, le Soleil brillait environ 25 à 30 % moins qu\'aujourd\'hui : la Terre aurait dû être gelée. Pourtant, les roches montrent de l\'eau liquide et une vie déjà présente. Explication la plus avancée (hypothèse) : un effet de serre bien plus fort, grâce au gaz carbonique et au méthane de l\'atmosphère primitive.', '<a href="#/explorer/soleil">Le Soleil</a><span class="sep">·</span><a href="#/atlas/types/etoiles">La vie d\'une étoile</a>'),
      row('hypo', 'Une vie apparue très vite', 'C. Lineweaver et T. Davis, 2002', 'La Terre s\'est formée il y a 4,54 milliards d\'années et la vie y apparaît sans doute avant 3,5 milliards d\'années, dès que les conditions le permettent. Certains en déduisent que la vie naît facilement ; d\'autres rappellent qu\'un seul exemple ne permet pas de conclure, puisque nous n\'existerions pas pour nous poser la question sinon.'),
      row('hypo', 'Pourquoi un soleil jaune ?', 'J. Haqq-Misra et al., 2018', 'Trois étoiles sur quatre sont des naines rouges, et elles vivent des milliers de milliards d\'années. Statistiquement, nous aurions dû naître autour de l\'une d\'elles. Peut-être leurs éruptions violentes, et des planètes qui leur montrent toujours la même face, rendent-elles la vie complexe plus difficile.', '<a href="#/voisinage/proxima">Proxima du Centaure, une naine rouge</a>'),
      row('hypo', 'Pourquoi si tôt ?', 'A. Loeb, R. Batista et D. Sloan, 2016', 'Si la vie est possible autour des naines rouges, elle devrait être bien plus fréquente dans un lointain avenir, quand ces étoiles auront brillé des milliers de fois plus longtemps que le Soleil. Nous serions alors des pionniers, arrivés très tôt dans l\'histoire de l\'Univers.'),
      row('fait', 'La nuit noire (paradoxe d\'Olbers)', 'H. Olbers, 1823', 'Si l\'Univers était infini, éternel et rempli d\'étoiles, chaque direction du ciel tomberait sur une étoile, et la nuit serait aussi brillante que le Soleil. Résolu : l\'Univers a un âge (13,8 milliards d\'années), la lumière des étoiles les plus lointaines n\'a pas encore eu le temps de nous parvenir, et l\'expansion affaiblit celle qui arrive.', '<a href="#/atlas/echelles">De l\'atome à l\'Univers</a>')
    ]));

    h.push('<section class="sq-sec" id="sq-drake"><h2>L\'équation de Drake</h2><p class="sq-intro">En 1961, l\'astronome Frank Drake écrit une formule pour organiser la question : le nombre de civilisations détectables dans la Voie lactée est le produit de sept termes. Les trois premiers commencent à être mesurés ; les quatre derniers sont inconnus. Changez-les pour voir à quel point le résultat dépend de ce qu\'on ignore.</p>' + drakeUI() +
      '<p class="note">N = étoiles par an × part avec planètes × planètes habitables × part avec la vie × part avec l\'intelligence × part qui émet × durée d\'émission. Ce n\'est pas une prédiction : c\'est une manière de voir où sont nos ignorances.</p></section>');

    h.push(sec('chercher', 'Chercher', 'Deux approches : écouter des signaux artificiels (technosignatures), ou repérer la trace chimique de la vie (biosignatures).', [
      row('fait', 'SETI : écouter le ciel', 'Depuis 1960', 'Le projet Ozma de Frank Drake (1960) écoute deux étoiles proches. Aujourd\'hui, Breakthrough Listen (depuis 2016) et l\'Allen Telescope Array scrutent des millions d\'étoiles en radio et en lumière. Les quelques signaux suspects se sont révélés être des interférences humaines (comme BLC1 en 2020).', '<a class="sci" href="#/hypotheses/chercheurs/etoile-tabby">L\'étoile de Tabby</a><span class="sep">·</span><a class="sci" href="#/hypotheses/chercheurs/oumuamua-voile">ʻOumuamua, une voile ?</a>'),
      row('fait', 'Lire les atmosphères', 'James Webb, puis l\'ELT et Habitable Worlds', 'Quand une planète passe devant son étoile, un peu de lumière traverse son atmosphère : on peut y lire les gaz présents. L\'oxygène, le méthane ou le DMS ensemble seraient un indice fort. Le télescope géant européen ELT (fin de la décennie) puis le projet Habitable Worlds Observatory de la NASA (années 2040) sont conçus pour cela.'),
      row('fait', 'Aller voir sur place', 'Missions en route', 'Europa Clipper (NASA) arrive à Jupiter en 2030 pour étudier Europe ; JUICE (ESA) en 2031 pour Ganymède ; Dragonfly (NASA), un drone, doit se poser sur Titan en 2034.', '<a href="#/explorer/europe">Europe</a><span class="sep">·</span><a href="#/explorer/ganymede">Ganymède</a>')
    ]));

    h.push(sec('messages', 'Nos messages', 'Nous avons nous aussi envoyé des signes. Ils voyagent encore.', [
      row('fait', 'Les plaques de Pioneer', 'Pioneer 10 et 11 · 1972-1973', 'Deux plaques d\'aluminium doré : un homme et une femme, la position du Soleil repérée par rapport à 14 pulsars, et le trajet de la sonde depuis la Terre.'),
      row('fait', 'Le message d\'Arecibo', '16 novembre 1974', '1 679 impulsions radio envoyées vers l\'amas globulaire M13, à environ 25 000 années-lumière : les nombres, l\'ADN, un humain, le système solaire et le radiotélescope. Il arrivera dans environ 25 000 ans, et M13 aura bougé d\'ici là.'),
      row('fait', 'Le disque d\'or de Voyager', 'Voyager 1 et 2 · 1977', 'Des sons et des images de la Terre : saluts en 55 langues, musiques du monde, chants de baleines, bruits de la nature. Les deux sondes ont quitté l\'héliosphère.', '<a href="#/explorer/voyager1">Voyager 1 dans l\'Observatoire</a>')
    ]));

    h.push(sec('pan', 'Les PAN, traités sérieusement', 'Phénomènes aérospatiaux non identifiés (on disait OVNI). Des organismes officiels les étudient : voici ce que disent leurs chiffres, en séparant les faits, ce qui reste inexpliqué et les interprétations.', [
      row('fait', 'Le GEIPAN (CNES)', 'France · depuis 1977', 'Le service du CNES qui enquête sur les témoignages français. Sur 3 188 cas classés (février 2025) : 26 % parfaitement identifiés (A), 39 % probablement identifiés (B), 31 % inexploitables faute de données (C), 2,2 % inexpliqués après enquête (D). « Inexpliqué » veut dire que les données ne suffisent pas à trancher, pas « extraterrestre ».'),
      row('fait', 'L\'étude de la NASA', 'Septembre 2023', 'Un groupe d\'experts indépendants conclut qu\'aucune donnée ne montre une origine extraterrestre, et que le problème principal est la mauvaise qualité des observations. Il recommande de meilleures mesures et une démarche scientifique ouverte.'),
      row('fait', 'L\'AARO (Pentagone)', 'Rapports 2024 et juillet 2026', 'Le bureau américain chargé des PAN n\'a trouvé aucune preuve de technologie extraterrestre. Dans son rapport publié en juillet 2026 (319 nouveaux signalements), tous les cas résolus ont une explication ordinaire : ballons, drones, oiseaux, satellites reflétant le Soleil. Les autres manquent de données.'),
      row('indice', 'Ce qui reste ouvert', 'Inexpliqué ≠ extraterrestre', 'Quelques cas bien documentés restent sans explication, en France comme ailleurs. Ils méritent d\'être étudiés, avec des capteurs et des méthodes rigoureuses. Passer d\'« inexpliqué » à « visiteurs d\'ailleurs » est une interprétation, que les données actuelles ne permettent pas.')
    ]));

    h.push('<section class="sq-src"><h2>Sources</h2><ul>' + [
      ['NASA, 6 000 exoplanètes confirmées (septembre 2025)', 'https://science.nasa.gov/exoplanets/'],
      ['NASA, biosignature potentielle de Sapphire Canyon (septembre 2025)', 'https://www.nasa.gov/news-release/nasa-says-mars-rover-discovered-potential-biosignature-last-year/'],
      ['Astronomy, réanalyse de K2-18 b (juillet 2025)', 'https://www.astronomy.com/science/new-study-revisits-signs-of-life-on-k2-18-b/'],
      ['GEIPAN, statistiques par classe', 'https://geipan.fr/en/stats'],
      ['CNES, cinq choses à savoir sur le GEIPAN (janvier 2026)', 'https://cnes.fr/actualites/serie-ovnis-5-choses-savoir-geipan'],
      ['The Black Vault, rapport annuel 2025 de l\'AARO (juillet 2026)', 'https://theblackvault.com/documentarchive/aaro-releases-fy2025-uap-report-months-after-statutory-deadline-citing-319-new-cases-and-expanded-satellite-analysis']
    ].map(function (s) { return '<li><a href="' + s[1] + '" target="_blank" rel="noopener">' + esc(s[0]) + '</a></li>'; }).join('') + '</ul></section>');
    if (idx < TABS.length - 1 || idx > 0) h.push('<nav class="sq-nav">' + (idx > 0 ? '<a href="#/hypotheses/seuls/' + TABS[idx - 1][0] + '">‹ ' + TABS[idx - 1][1] + '</a>' : '<span></span>') + (idx < TABS.length - 1 ? '<a href="#/hypotheses/seuls/' + TABS[idx + 1][0] + '">' + TABS[idx + 1][1] + ' ›</a>' : '') + '</nav>');
    root.innerHTML = h.join('');
    // seules les parties de l'onglet choisi sont affichées ; les sources restent en bas
    root.querySelectorAll('.sq-sec').forEach(function (el) { el.hidden = cur[2].indexOf(el.id.replace('sq-', '')) < 0; });
    var src = root.querySelector('.sq-src'), nav = root.querySelector('.sq-nav'); if (src && nav) src.parentNode.insertBefore(nav, src);
    if (cur[0] === 'drake') bindDrake(root);
  };
})();

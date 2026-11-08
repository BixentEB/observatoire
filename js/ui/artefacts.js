/* ======================================================================
   OBSERVATOIRE — Atlas › Artefacts, la bibliothèque du ciel (#/atlas/artefacts)
   Ce que l'espace nous a donné (météorites, cratères, échantillons rapportés), ce que nous lui avons envoyé,
   et les sons de l'espace (liens vers les pages officielles : enregistrements réels ou sonifications, signalés).
   Photos : bibliothèque d'images (data/images-sources.json, uses « artefacts/<id> »), quand elles existent.
   ====================================================================== */
(function () {
  'use strict';
  var OBS = window.OBS = window.OBS || {}, esc = OBS.esc;
  // [id, nom, sous-titre (lieu · date), texte, données [[clé, valeur]], liens [[href, libellé]], photo ?]
  var RECU = [
    ['hoba', 'Hoba', 'Namibie · trouvée en 1920', 'La plus grosse météorite connue : un bloc de fer et de nickel d\'environ 60 tonnes, tombé il y a quelque 80 000 ans. Trop lourde pour être déplacée, elle est restée là où elle a été trouvée.', [['Masse', '≈ 60 t'], ['Type', 'fer']], [], 1],
    ['ensisheim', 'Ensisheim', 'Alsace · 7 novembre 1492', 'La plus ancienne chute observée en Europe dont on conserve des morceaux. Un bloc de 127 kg tombe dans un champ sous les yeux d\'un enfant ; il est enchaîné dans l\'église pour qu\'il ne s\'envole pas. Un fragment est exposé au musée d\'Ensisheim.', [['Masse', '127 kg à l\'origine'], ['Type', 'chondrite']], [], 1],
    ['orgueil', 'Orgueil', 'Tarn-et-Garonne · 14 mai 1864', 'Une vingtaine de pierres tombent près de Montauban. C\'est une chondrite carbonée très rare, riche en eau et en matière organique, dont la composition est proche de celle du Soleil : un échantillon presque intact du nuage qui a formé le système solaire.', [['Masse', '≈ 14 kg'], ['Type', 'chondrite carbonée']], [], 0],
    ['allende', 'Allende', 'Mexique · 8 février 1969', 'Plus de deux tonnes de fragments répartis sur des dizaines de kilomètres. Elle contient les plus vieux solides connus du système solaire, des inclusions formées il y a 4,567 milliards d\'années.', [['Âge', '4,567 milliards d\'années'], ['Type', 'chondrite carbonée']], [], 1],
    ['murchison', 'Murchison', 'Australie · 28 septembre 1969', 'Plus de 100 kg ramassés en quelques jours. On y a trouvé des dizaines d\'acides aminés, dont certains inconnus sur Terre : la preuve que les briques de la vie se forment aussi dans l\'espace.', [['Masse', '> 100 kg'], ['Type', 'chondrite carbonée']], [['#/hypotheses/seuls/sait', 'Sommes-nous seuls ?']], 1],
    ['alh84001', 'ALH 84001', 'Antarctique · trouvée en 1984', 'Une météorite venue de Mars. En 1996, des chercheurs y annoncent de possibles microfossiles ; la plupart des scientifiques pensent aujourd\'hui que ces formes s\'expliquent sans vie. Elle reste un repère dans l\'histoire de la recherche.', [['Origine', 'Mars'], ['Âge', '≈ 4 milliards d\'années']], [['#/explorer/mars', 'Mars']], 1],
    ['tcheliabinsk', 'Tcheliabinsk', 'Russie · 15 février 2013', 'Un astéroïde d\'environ 18 mètres explose à une trentaine de kilomètres d\'altitude. L\'onde de choc brise des vitres sur des kilomètres : environ 1 500 blessés. Un fragment de plus de 600 kg est repêché dans un lac.', [['Taille', '≈ 18 m'], ['Énergie', '≈ 30 bombes d\'Hiroshima']], [['#/atlas/visiteurs', 'Les visiteurs du système solaire']], 1]
  ];
  var IMPACTS = [
    ['barringer', 'Meteor Crater', 'Arizona · il y a ≈ 50 000 ans', 'Un cratère de 1,2 km de large et 170 m de profondeur, creusé par un bloc de fer d\'une cinquantaine de mètres. Le premier cratère reconnu comme le résultat d\'un impact (années 1960).', [['Diamètre', '1,2 km']], [], 1],
    ['chicxulub', 'Chicxulub', 'Mexique · il y a 66 millions d\'années', 'Un astéroïde d\'une dizaine de kilomètres frappe la péninsule du Yucatán. Le cratère, environ 180 km, est aujourd\'hui enfoui. La catastrophe met fin au règne des dinosaures non aviens.', [['Diamètre', '≈ 180 km']], [['#/outils', 'Temps galactique (Outils)']], 0],
    ['rochechouart', 'Rochechouart', 'Haute-Vienne · il y a ≈ 207 millions d\'années', 'La structure d\'impact française : le cratère a disparu sous l\'érosion, mais les roches brisées et fondues par le choc se voient encore dans les murs des maisons de la région. L\'image est une vue de synthèse du cratère peu après sa formation, pas une photo.', [['Âge', '≈ 207 millions d\'années']], [], 1],
    ['vredefort', 'Vredefort', 'Afrique du Sud · il y a ≈ 2 milliards d\'années', 'La plus grande structure d\'impact connue sur Terre, large à l\'origine de 250 à 300 km. Inscrite au patrimoine mondial de l\'Unesco.', [['Diamètre initial', '≈ 250-300 km']], [], 1],
    ['toungouska', 'Toungouska', 'Sibérie · 30 juin 1908', 'Une explosion dans l\'atmosphère couche environ 80 millions d\'arbres sur 2 000 km². Aucun cratère : l\'objet, astéroïde ou comète de quelques dizaines de mètres, s\'est désintégré avant de toucher le sol.', [['Surface touchée', '≈ 2 000 km²']], [], 0]
  ];
  var RAPPORTES = [
    ['apollo', 'Apollo 11 à 17', 'Lune · 1969-1972', 'Douze astronautes rapportent 382 kg de roches et de sols lunaires. Leur étude a montré que la Lune est née d\'un choc géant entre la jeune Terre et un autre astre.', [['Masse', '382 kg']], [['#/explorer/lune', 'La Lune'], ['#/hypotheses/chercheurs/theia', 'Théia']], 0],
    ['luna', 'Luna 16, 20 et 24', 'Lune · 1970-1976', 'Les premiers échantillons rapportés par des robots, pour l\'Union soviétique.', [['Masse', '≈ 300 g']], [], 0],
    ['change', 'Chang\'e 5 et 6', 'Lune · 2020 et 2024', 'La Chine rapporte des roches volcaniques récentes (Chang\'e 5), puis les premiers échantillons de la face cachée (Chang\'e 6).', [['Masse', '1,73 kg et 1,94 kg']], [], 0],
    ['stardust', 'Stardust', 'Comète Wild 2 · 2006', 'Des poussières de comète capturées dans un gel très léger, l\'aérogel, puis renvoyées sur Terre dans une capsule.', [['Prise', 'quelques milligrammes']], [], 0],
    ['itokawa', 'Hayabusa', 'Astéroïde Itokawa · 2010', 'La sonde japonaise rapporte environ 1 500 grains, malgré des pannes en série : le premier échantillon d\'astéroïde.', [['Prise', '≈ 1 500 grains']], [], 1],
    ['ryugu', 'Hayabusa2', 'Astéroïde Ryugu · 2020', '5,4 g d\'un astéroïde riche en carbone, aussi primitif que la météorite d\'Orgueil.', [['Masse', '5,4 g']], [], 1],
    ['bennu-ech', 'OSIRIS-REx', 'Astéroïde Bennu · 2023', '121,6 g de Bennu. On y a trouvé 14 des 20 acides aminés de la vie terrestre et les cinq bases de l\'ADN et de l\'ARN.', [['Masse', '121,6 g']], [['#/atlas/visiteurs', 'Bennu dans les Visiteurs']], 0]
  ];
  var ENVOYE = [
    ['plaque-pioneer', 'Les plaques de Pioneer', 'Pioneer 10 et 11 · 1972-1973', 'Une plaque d\'aluminium doré de 23 cm : un homme et une femme, la position du Soleil par rapport à 14 pulsars, la trajectoire de la sonde depuis la Terre.', [], [['#/hypotheses/seuls/messages', 'Nos messages']], 1],
    ['message-arecibo', 'Le message d\'Arecibo', '16 novembre 1974', '1 679 impulsions radio vers l\'amas d\'étoiles M13, à environ 25 000 années-lumière. Rangées en 73 lignes de 23, elles dessinent des nombres, l\'ADN, un humain, le système solaire et le radiotélescope.', [], [['#/hypotheses/seuls/messages', 'Nos messages']], 1],
    ['disque-voyager', 'Le disque d\'or de Voyager', 'Voyager 1 et 2 · 1977', 'Un disque de cuivre doré avec son aiguille et son mode d\'emploi gravé : 115 images, des saluts en 55 langues, 90 minutes de musique et des sons de la Terre. Voyager 1 est aujourd\'hui l\'objet humain le plus lointain.', [], [['#/explorer/voyager1', 'Voyager 1 aujourd\'hui']], 1]
  ];
  // sons : [nom, mission · date, texte, nature (réel = microphone, sonif = données converties en sons), lien officiel]
  var SONS = [
    ['Le vent sur Mars', 'Perseverance · depuis 2021', 'Les deux microphones du rover enregistrent le vent, les roues sur les cailloux, le laser qui frappe les roches et le vol de l\'hélicoptère Ingenuity. Les sons voyagent moins bien dans l\'air très mince de Mars.', 'reel', 'https://science.nasa.gov/mission/mars-2020-perseverance/sounds-of-mars/'],
    ['Le « chant » de la comète', 'Rosetta · 2014', 'Des oscillations du champ magnétique autour de la comète Tchourioumov-Guérassimenko, trop lentes pour l\'oreille, accélérées environ 10 000 fois pour devenir audibles.', 'sonif', 'https://sci.esa.int/web/rosetta/-/55034-the-singing-comet-67pchuryumov-gerasimenko'],
    ['L\'espace interstellaire', 'Voyager 1 · 2012-2013', 'Les vibrations du plasma, le gaz très ténu entre les étoiles, captées après la sortie de l\'héliosphère et converties en sons : plus aigus quand le gaz est plus dense.', 'sonif', 'https://science.nasa.gov/photojournal/voyager-captures-sounds-of-interstellar-space'],
    ['La surface de Vénus', 'Venera 13 et 14 · 1982', 'Les sondes soviétiques ont emporté des microphones : elles ont enregistré le vent et le bruit de leur propre forage, avant de succomber à la chaleur (plus de 450 °C).', 'reel', null]
  ];

  function row(o, sec) {
    var kv = o[4].length ? '<p class="kv">' + o[4].map(function (x) { return '<span><em>' + esc(x[0]) + '</em> ' + esc(x[1]) + '</span>'; }).join('') + '</p>' : '';
    var ln = o[5].length ? '<p class="row-links">' + o[5].map(function (x) { return '<a href="' + x[0] + '">' + esc(x[1]) + '</a>'; }).join('<span class="sep">·</span>') + '</p>' : '';
    return '<article class="row" id="a-' + o[0] + '"><div class="row-h">' + (o[6] ? '<div class="row-ph" data-photo="artefacts/' + o[0] + '" data-photo-sm></div>' : '') + '<h3>' + esc(o[1]) + '</h3><p class="row-kind">' + esc(o[2]) + '</p></div>' +
      '<div class="row-b"><p>' + esc(o[3]) + '</p>' + kv + ln + '</div></article>';
  }
  function son(s) {
    return '<article class="row"><div class="row-h"><span class="ar-k ar-' + s[3] + '">' + (s[3] === 'reel' ? 'Enregistrement' : 'Sonification') + '</span><h3>' + esc(s[0]) + '</h3><p class="row-kind">' + esc(s[1]) + '</p></div>' +
      '<div class="row-b"><p>' + esc(s[2]) + '</p>' + (s[4] ? '<p class="row-links"><a href="' + s[4] + '" target="_blank" rel="noopener">Écouter sur le site officiel ↗</a></p>' : '') + '</div></article>';
  }
  function section(kind, title, sub, html, n) { return '<section class="cat-sec">' + OBS.band(kind, title, sub, n) + '<div class="rows">' + html + '</div></section>'; }

  OBS.atlasArtefacts = function (root) {
    root.innerHTML = '<p>Ce que l\'espace nous a donné, ce que nous lui avons envoyé, et ce qu\'on peut en entendre.</p>' +
      section('asteroide', 'Tombés du ciel', 'Des météorites célèbres : des morceaux d\'astéroïdes, de la Lune ou de Mars.', RECU.map(row).join(''), RECU.length) +
      section('pluie', 'Les cicatrices des impacts', 'Cratères et explosions qui ont marqué la Terre.', IMPACTS.map(row).join(''), IMPACTS.length) +
      section('lune', 'Rapportés par les missions', 'Des échantillons ramassés sur place et ramenés sur Terre.', RAPPORTES.map(row).join(''), RAPPORTES.length) +
      section('interstellaire', 'Envoyés vers les étoiles', 'Nos messages, gravés ou émis.', ENVOYE.map(row).join(''), ENVOYE.length) +
      section('vide', 'Les sons de l\'espace', 'Le vide ne transmet pas le son : on entend ce que captent des microphones posés sur d\'autres mondes, ou des mesures converties en sons (sonifications).', SONS.map(son).join(''), SONS.length);
  };
})();

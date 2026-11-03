/* ======================================================================
   OBSERVATOIRE — « Le saviez-vous ? »
   De temps en temps, une petite carte en bas à droite donne un ordre de grandeur ou un fait
   sur le niveau affiché (système solaire, voisinage, Voie lactée, Groupe local, autre système).
   Quelques secondes après l'arrivée, puis toutes les deux minutes ; « Suivant » en montre un autre,
   la croix la ferme pour ce niveau. Réglage « Le saviez-vous ? » (mémorisé).
   ====================================================================== */
(function () {
  'use strict';
  var OBS = window.OBS = window.OBS || {};

  var FACTS = {
    systeme: [
      "Si le Soleil était un ballon de 1 mètre, la Terre serait une bille de 9 mm à 107 mètres de lui, et Neptune une balle de 3,5 cm à plus de 3 kilomètres.",
      "Le Soleil contient 99,86 % de la masse du système solaire. Jupiter possède presque tout le reste.",
      "La lumière du Soleil met 8 minutes et 20 secondes pour atteindre la Terre, et un peu plus de 4 heures pour atteindre Neptune.",
      "Voyager 1, lancée en 1977, est l'objet humain le plus lointain : environ 170 fois la distance de la Terre au Soleil. Ses signaux mettent près d'une journée à nous parvenir.",
      "Les distances sont compressées par défaut : à l'échelle réelle, les planètes seraient des points invisibles. Le badge « Échelle adaptée », en bas à gauche, montre les vraies distances.",
      "Sur Vénus, une journée (un tour sur elle-même, 243 jours terrestres) dure plus longtemps qu'une année (225 jours)."
    ],
    voisinage: [
      "La lumière de Proxima du Centaure, l'étoile la plus proche, met 4,2 ans à nous parvenir. Voyager 1, à 17 km/s, mettrait plus de 70 000 ans pour parcourir cette distance.",
      "Si le Soleil était une bille de 1 cm posée à Paris, Proxima du Centaure serait un grain de 1,5 mm à près de 300 km : à peu près à Bruxelles.",
      "Les naines rouges, petites et pâles, sont les étoiles les plus nombreuses du voisinage et de toute la galaxie. Pourtant, aucune n'est visible à l'œil nu.",
      "Le Soleil traverse en ce moment un nuage de gaz très ténu, le Nuage interstellaire local, large d'une trentaine d'années-lumière.",
      "Sirius, l'étoile la plus brillante du ciel nocturne, est à 8,6 années-lumière. Sa compagne Sirius B est une naine blanche : une étoile morte de la taille de la Terre, mais presque aussi massive que le Soleil."
    ],
    galaxie: [
      "Le Soleil met environ 230 millions d'années pour faire le tour de la galaxie, à près de 230 km/s. Au début de son dernier tour, les premiers dinosaures apparaissaient.",
      "Le centre de la galaxie est invisible à l'œil : la poussière absorbe presque toute sa lumière. Les astronomes l'observent en infrarouge, en ondes radio et en rayons X.",
      "Le satellite Gaia a mesuré la position de près de 2 milliards d'étoiles. C'est beaucoup, et pourtant à peine 1 % des étoiles de la Voie lactée.",
      "Au centre se trouve Sagittarius A*, un trou noir de 4 millions de fois la masse du Soleil. Sa première image a été publiée en 2022 par l'Event Horizon Telescope.",
      "Presque toutes les étoiles visibles à l'œil nu sont à moins de quelques milliers d'années-lumière : une toute petite bulle autour du Soleil, à cette échelle.",
      "Le disque de la Voie lactée n'est pas plat : il est gauchi, relevé d'un côté et abaissé de l'autre, comme le bord ondulé d'un chapeau."
    ],
    'groupe-local': [
      "Vide ? Pas tant que ça. Rapportées à leur taille, les galaxies sont proches : Andromède est à environ 25 fois le diamètre de la Voie lactée. Les étoiles, elles, sont séparées par des dizaines de millions de fois leur diamètre.",
      "Si la Voie lactée était une pièce de 1 euro, Andromède serait une soucoupe d'environ 3,5 cm posée à 60 cm d'elle.",
      "Ce qui n'est pas dessiné : chaque grande galaxie baigne dans un immense halo de gaz chaud et de matière noire. Celui d'Andromède, mesuré avec le télescope Hubble (projet AMIGA, 2020), s'étend sur au moins 1,3 million d'années-lumière : il touche presque le nôtre.",
      "Le Groupe local compte plus de 80 galaxies connues, presque toutes des naines si pâles qu'on en découvre encore dans les grands relevés du ciel. Seules les principales sont dessinées ici.",
      "Andromède se rapproche de nous à environ 110 km/s. Selon une étude de 2025 (Sawala et ses collègues), il y a à peu près une chance sur deux qu'elle percute la Voie lactée dans les 10 milliards d'années à venir.",
      "La lumière d'Andromède que l'on voit à l'œil nu est partie il y a 2,5 millions d'années, vers l'époque où les premiers humains du genre Homo apparaissaient en Afrique.",
      "Le noir n'est pas le vide. La brume bleutée autour de la Voie lactée et d'Andromède figure leurs halos : du gaz chaud, trop ténu pour briller, et surtout de la matière noire, qui ne brille pas du tout mais pèse environ cinq fois plus que toute la matière ordinaire.",
      "Entre les galaxies, il ne reste que quelques atomes par mètre cube. Dans un seul centimètre cube d'air, il y en a environ 25 milliards de milliards."
    ],
    etoile: [
      "Plus de 6 000 exoplanètes sont confirmées aujourd'hui, et des milliers d'autres attendent confirmation.",
      "La plupart des exoplanètes n'ont jamais été vues : on les détecte par la petite baisse de lumière quand elles passent devant leur étoile, ou par le léger balancement qu'elles impriment à l'étoile.",
      "Les orbites sont écartées ici pour rester lisibles : dans le système TRAPPIST-1, les sept planètes tiendraient toutes à l'intérieur de l'orbite de Mercure."
    ]
  };
  OBS.FACTS = FACTS;

  var box, txt, on = true, level = null, idx = {}, closed = {}, tShow = 0, tHide = 0;
  var FIRST = 6000, STAY = 26000, EVERY = 120000;
  function get(k) { try { return localStorage.getItem(k); } catch (e) { return null; } }
  function set(k, v) { try { localStorage.setItem(k, v); } catch (e) {} }

  function hide() { if (box) box.hidden = true; clearTimeout(tHide); }
  function show(next) {
    clearTimeout(tShow); clearTimeout(tHide);
    var L = FACTS[level]; if (!on || !L || closed[level] || document.body.classList.contains('page-open')) { schedule(EVERY); return; }
    if (idx[level] == null) idx[level] = Math.floor(Math.random() * L.length); else if (next) idx[level] = (idx[level] + 1) % L.length;
    txt.textContent = L[idx[level]];
    box.hidden = false;
    tHide = setTimeout(function () { hide(); schedule(EVERY); }, STAY);
  }
  function schedule(ms) { clearTimeout(tShow); tShow = setTimeout(function () { show(true); }, ms); }

  function start() {
    box = document.getElementById('facts'); if (!box) return;
    txt = box.querySelector('.facts-t');
    box.querySelector('.facts-next').addEventListener('click', function () { show(true); });
    box.querySelector('.facts-x').addEventListener('click', function () { closed[level] = true; hide(); clearTimeout(tShow); });
    var s = document.getElementById('s-facts');
    on = get('obs.facts') !== '0';
    if (s) { s.checked = on; s.addEventListener('change', function () { on = s.checked; set('obs.facts', on ? '1' : '0'); if (!on) hide(); else schedule(1500); }); }
    OBS.on('level:leaving', function () { hide(); clearTimeout(tShow); });
    OBS.on('level', function (L) {
      level = L && L.id; hide();
      if (FACTS[level] && !closed[level]) { clearTimeout(tShow); tShow = setTimeout(function () { show(false); }, FIRST); }
    });
    if (OBS.engine && OBS.engine.level) { level = OBS.engine.level.id; tShow = setTimeout(function () { show(false); }, FIRST); }
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start); else start();
})();

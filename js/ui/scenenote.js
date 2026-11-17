/* ======================================================================
   OBSERVATOIRE — « Lire la scène » (lot 12)
   Une petite note semi-transparente, en haut à droite, qui explique ce que l'on voit dans les niveaux où une forme
   peut tromper (lignes d'écoulement, halos, sphères, schémas). Elle s'ouvre seule à la première visite du niveau,
   se ferme d'une croix (mémorisé par niveau), et se rouvre par le bouton « ⓘ Lire la scène » du fil d'Ariane.
   Pour en ajouter une : une entrée dans NOTES (titre, puis lignes : [pastille, texte]).
   ====================================================================== */
(function () {
  'use strict';
  var OBS = window.OBS = window.OBS || {}, esc = OBS.esc;
  var NOTES = {
    galaxie: ['Lire la Voie lactée', [
      ['#f4c77a', 'Personne n\'a jamais vu notre galaxie de l\'extérieur : sa forme est reconstituée d\'après les mesures. Les grains de lumière ne sont pas des étoiles une à une ; chacun en figure des millions.'],
      ['#bfe0ff', 'Les repères nommés (nébuleuses, amas, trou noir central) sont, eux, à leur position mesurée.']]],
    'groupe-local': ['Lire le Groupe local', [
      ['#d8dcff', 'Chaque forme est une galaxie entière, à sa position mesurée. Leur aspect est reconstitué : vues d\'ici, la plupart ne sont que de pâles taches.'],
      ['#8aa6ff', 'La brume bleutée autour de la Voie lactée et d\'Andromède figure leurs halos de gaz et de matière noire : invisibles à l\'œil, mais bien réels.']]],
    'volume-local': ['Lire le Volume local', [
      ['#bfe0ff', 'Chaque point est une galaxie entière, à sa position mesurée. Sa couleur dit à quel groupe elle appartient.'],
      ['#9fe3b0', 'Les nuages colorés ne sont pas des objets : ils montrent l\'étendue occupée par les membres de chaque groupe (reconstitution).']]],
    superamas: ['Lire le Superamas local', [
      ['#f4c77a', 'Chaque point est un groupe de galaxies, parfois des centaines (l\'amas de la Vierge en compte 714).'],
      ['#8fc2ff', 'Les halos colorés ne sont pas des nuages visibles : ils montrent la région où chaque groupe retient ses galaxies par sa gravité, calculée d\'après sa masse.']]],
    laniakea: ['Lire Laniakea', [
      ['#e8ecff', 'Les points sont de vraies galaxies (relevé 2MRS). Plus loin, seules les plus brillantes sont recensées.'],
      ['#f4c77a', 'Les lignes dorées ne sont pas des objets ni des filaments de matière. Ce sont des lignes d\'écoulement, comme les flèches d\'une carte des vents : elles montrent dans quelle direction se déplacent les galaxies, en plus de l\'expansion de l\'Univers. Elles convergent vers l\'attracteur ✦.'],
      ['#ffd27a', 'Ce mouvement est très lent à notre échelle : quelques centaines de kilomètres par seconde. En des milliards d\'années, une galaxie ne parcourt qu\'une petite partie de sa ligne.'],
      ['#c9b8ff', 'Les nuages de points colorés marquent les frontières de Laniakea et de ses voisins : là où les écoulements partent dans des sens opposés.']]],
    univers: ['Lire l\'Univers observable', [
      ['#e8ecff', 'Les points sont de vraies galaxies (relevé SDSS), dans une tranche de 5 degrés. Les « filaments » qu\'ils dessinent sont réels : les galaxies s\'alignent en filaments et en murailles autour de grands vides. C\'est la toile cosmique.'],
      ['#ff9f8a', 'Les sphères marquent des distances. Autour de celle des quasars, des milliers de vrais quasars du SDSS ; sur celle des premières galaxies, les objets confirmés par le télescope James Webb ; le bord porte la vraie carte du rayonnement fossile mesurée par le satellite Planck. Ce n\'est pas un globe vu de l\'extérieur : c\'est le ciel qui nous entoure de tous côtés, dont on ne dessine que la paroi du fond.']]],
    'au-dela': ['Lire l\'au-delà', [
      ['#ff9f8a', 'Ceci est un schéma, pas une carte. Seule notre sphère orangée correspond à ce que l\'on peut voir.'],
      ['#8fc2ff', 'Tout ce qui est en bleu relève des hypothèses de chercheurs, de la plus admise à la plus spéculative. Rien n\'y a été observé.']]]
  };
  var box = null, cur = null;
  function key(lv) { return 'obs.note.' + lv; }
  function get(k) { try { return localStorage.getItem(k); } catch (e) { return null; } }
  function set(k, v) { try { localStorage.setItem(k, v); } catch (e) {} }
  function draw(lv) {
    var n = NOTES[lv]; if (!n) { hide(); return; }
    if (!box) { box = document.createElement('aside'); box.className = 'scene-note'; box.setAttribute('aria-label', 'Lire la scène'); document.body.appendChild(box); }
    cur = lv; place();
    box.classList.remove('sn-full');
    box.innerHTML = '<div class="sn-h"><b>' + esc(n[0]) + '</b><button type="button" class="sn-x" aria-label="Fermer la note">✕</button></div>' +
      n[1].map(function (l) { return '<p class="sn-l"><i style="background:' + l[0] + '"></i><span>' + esc(l[1]) + '</span></p>'; }).join('') +
      (n[1].length > 1 || n[1][0][1].length > 140 ? '<button type="button" class="sn-toggle">Lire la suite</button>' : '') +
      '<p class="sn-more"><a href="#/atlas/questions">Toutes les questions →</a></p>';
    box.querySelector('.sn-x').addEventListener('click', function () { set(key(cur), 'lu'); hide(); OBS.emit('crumbs'); });
    var tg = box.querySelector('.sn-toggle'); if (tg) tg.addEventListener('click', function () { box.classList.add('sn-full'); });
    box.hidden = false; OBS.emit('crumbs');
  }
  function hide() { if (box) box.hidden = true; }
  /* téléphone : la note se range en bas, à la place du « Le saviez-vous ? » (qui attend qu'elle soit fermée), en version courte :
     la première ligne, puis « Lire la suite » ; sur ordinateur, en haut à droite comme avant */
  var MOBILE = window.matchMedia('(max-width: 760px)');
  function place() {
    if (!box) return;
    var corner = document.querySelector('.corner'), host = MOBILE.matches && corner ? corner : document.body;
    if (box.parentNode !== host) host.insertBefore(box, host === corner ? corner.firstChild : null);
  }
  if (MOBILE.addEventListener) MOBILE.addEventListener('change', place);
  OBS.sceneNote = {
    has: function (lv) { return !!NOTES[lv]; },
    open: function (lv) { draw(lv || (OBS.engine.level && OBS.engine.level.id)); },
    isOpen: function () { return !!box && !box.hidden; }
  };
  OBS.on('level', function (L) { if (L && NOTES[L.id] && get(key(L.id)) !== 'lu') setTimeout(function () { if (OBS.engine.level === L) draw(L.id); }, 2600); else hide(); });
  OBS.on('page', function (name) { if (name) hide(); });
  OBS.on('level:leaving', hide);   // la note du niveau qu'on quitte part avec lui
})();

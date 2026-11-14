/* ======================================================================
   OBSERVATOIRE — Atlas › Questions (lot 10)
   Les grandes questions que posent les niveaux, chacune en deux temps : « En bref » pour tout le monde,
   « Pour aller plus loin » (dépliable) avec les chiffres et les sources, pour les passionnés et les pros.
   Liens vers la scène et l'Atlas. Pour en ajouter une : une entrée dans Q.
   ====================================================================== */
(function () {
  'use strict';
  var OBS = window.OBS = window.OBS || {}, esc = OBS.esc;
  var Q = [
    { id: 'au-dessus', t: 'Qu\'y a-t-il au-dessus de Laniakea ?', lv: 'laniakea',
      b: 'Pas un étage de plus, mais des voisins. Laniakea est un superamas parmi d\'autres de même rang : Shapley, Persée-Poissons, Hercule, Apus, Lepus. Au-delà, il n\'y a plus de « contenant » : seulement la toile cosmique, faite de filaments et de vides, qui remplit tout l\'Univers observable.',
      p: 'Les six bassins voisins ont été délimités de la même façon en 2023 (Dupuy et Courtois), à partir des vitesses de 56 000 galaxies (CosmicFlows-4). Leurs volumes vont de 2 à 9,5 millions de (Mpc/h)³ : Laniakea n\'est ni le plus grand ni le plus petit. Plus loin, les reconstructions deviennent trop incertaines pour délimiter d\'autres bassins de façon fiable.',
      go: [['#/laniakea', 'Voir Laniakea et ses voisins'], ['#/atlas/univers', 'La toile cosmique']] },
    { id: 'ecoulements', t: 'D\'où viennent les lignes d\'écoulement ? Les superamas voisins sont-ils attirés par Laniakea ?', lv: 'laniakea',
      b: 'Toutes les lignes dessinées partent de l\'intérieur de Laniakea et convergent vers son attracteur, dans la direction du Grand Attracteur. Les voisins ne sont pas attirés par Laniakea : chacun s\'écoule vers son propre attracteur. La frontière entre deux superamas, c\'est justement l\'endroit où les écoulements partent dans des sens opposés, comme une ligne de partage des eaux entre deux fleuves.',
      p: 'Les lignes suivent le champ de vitesses « particulières » des galaxies, c\'est-à-dire leur mouvement une fois retirée l\'expansion de l\'Univers. Ce champ est reconstruit à partir des distances mesurées de dizaines de milliers de galaxies : là où la distance et le décalage vers le rouge ne concordent pas, la galaxie a un mouvement propre. L\'Observatoire suit ce champ pas à pas (grille de 64³ cases, environ 15 Mpc/h par case) depuis 160 points répartis dans Laniakea.',
      go: [['#/laniakea', 'Voir les écoulements']] },
    { id: 'ou-allons-nous', t: 'Où va tout notre coin d\'Univers ?', lv: 'laniakea',
      b: 'Par rapport au rayonnement fossile, la Voie lactée et ses voisines filent à environ 600 km/s. Deux choses nous poussent : l\'attraction des grandes concentrations de matière, dont Shapley, et la « répulsion » d\'une immense région presque vide de l\'autre côté du ciel, le Dipole Repeller.',
      p: 'Un vide ne repousse pas vraiment : il attire moins que la moyenne, et tout s\'en éloigne vers les régions plus denses. L\'équipe de Yehuda Hoffman, Daniel Pomarède, R. Brent Tully et Hélène Courtois a identifié ce Dipole Repeller en 2017 (Nature Astronomy) ; attraction et « répulsion » contribuent à parts comparables à notre mouvement.',
      go: [['#/atlas/laniakea', 'Carte de Laniakea']] },
    { id: 'superamas', t: 'Un superamas, c\'est quoi exactement ?', lv: 'superamas',
      b: 'Un amas de galaxies est tenu par sa propre gravité. Un superamas, non : c\'est une région dont toutes les galaxies s\'écoulent vers le même point, comme un bassin versant. Ses contours sont donc irréguliers, et il ne restera pas ensemble : l\'expansion de l\'Univers finira par disperser ses parties.',
      p: 'Avant 2014, les superamas étaient définis à l\'œil, par des surdensités de galaxies sur les cartes. Tully et ses collègues ont proposé de les définir par les écoulements : c\'est ainsi qu\'est né Laniakea, « horizon céleste immense » en hawaïen, qui englobe notre ancien Superamas local (centré sur la Vierge).',
      go: [['#/superamas', 'Le Superamas local'], ['#/laniakea', 'Laniakea']] },
    { id: 'zones-vides', t: 'Pourquoi des zones vides sur les cartes des galaxies ?', lv: 'laniakea',
      b: 'Deux raisons, aucune n\'est un vide de l\'espace. D\'abord, notre propre galaxie cache une partie du ciel : ses étoiles et sa poussière masquent ce qui est derrière (la « zone d\'évitement »). Ensuite, plus on regarde loin, plus seules les galaxies brillantes sont visibles : les points se raréfient au bord.',
      p: 'La zone d\'évitement couvre environ 10 à 20 % du ciel, le long du plan de la Voie lactée. Les relevés en ondes radio (hydrogène neutre) et en infrarouge, comme 2MRS, la réduisent mais ne l\'effacent pas. Le Grand Attracteur est en partie derrière : repéré en 1987 par les mouvements des galaxies, il a fallu attendre 1996 pour reconnaître l\'amas de la Règle qui en forme le cœur.',
      go: [['#/atlas/laniakea', 'Voir la zone d\'évitement']] },
    { id: 'distances-vitesse', t: 'Comment connaît-on la distance d\'une galaxie lointaine ?', lv: 'univers',
      b: 'Par sa couleur. L\'expansion de l\'Univers étire la lumière en route, qui rougit d\'autant plus que la galaxie est loin : c\'est le décalage vers le rouge. La loi de Hubble transforme ce décalage en distance. C\'est une approximation : les mouvements propres des galaxies brouillent un peu le résultat.',
      p: 'L\'Observatoire utilise H0 = 70 km/s/Mpc. Les mesures actuelles hésitent entre environ 67 (satellite Planck) et 73 (céphéides et supernovæ) : c\'est la « tension de Hubble », non résolue. Dans les amas, la vitesse d\'agitation des galaxies étire leur image le long de la ligne de visée : on parle de « doigts de Dieu ». Les distances vraiment mesurées (céphéides, supernovæ, relation de Tully-Fisher) ne concernent qu\'une partie des galaxies.',
      go: [['#/atlas/univers', 'La tranche SDSS']] },
    { id: '93-milliards', t: 'L\'Univers a 13,8 milliards d\'années : comment peut-il mesurer 93 milliards d\'années-lumière ?', lv: 'univers',
      b: 'Parce que l\'espace s\'est étiré pendant le voyage de la lumière. La plus vieille lumière, le rayonnement fossile, a voyagé 13,8 milliards d\'années ; mais pendant ce temps, l\'expansion a éloigné sa source à environ 46 milliards d\'années-lumière. D\'où un diamètre de 93 milliards d\'années-lumière pour la partie que l\'on peut voir.',
      p: 'On parle de distance « comobile » : la distance qui sépare aujourd\'hui deux points, si l\'on pouvait arrêter l\'expansion pour la mesurer. Avec les valeurs arrondies de l\'Observatoire (H0 = 70, Ωm = 0,3), on trouve environ 44 milliards d\'années-lumière ; avec les paramètres mesurés par Planck, 46. Rien ne va plus vite que la lumière localement : c\'est l\'espace entre les galaxies qui grandit.',
      go: [['#/atlas/univers', 'Vue jusqu\'au bord']] },
    { id: 'au-dela', t: 'Qu\'y a-t-il au-delà de l\'Univers observable ?', lv: 'univers',
      b: 'Très probablement encore de l\'Univers : l\'Univers observable est la partie dont la lumière a eu le temps de nous parvenir, pas tout ce qui existe. Ce qu\'il y a au-delà relève des hypothèses : un Univers immense ou infini, d\'autres « bulles » nées de l\'inflation, un multivers… Un niveau leur sera consacré, clairement séparé des données.',
      p: 'La courbure de l\'Univers, mesurée très proche de zéro, suggère qu\'il est bien plus grand que la partie observable, sans permettre de dire s\'il est fini ou infini. Les hypothèses sur ce qui se trouve au-delà vont de prolongements simples (le même Univers, plus loin) à des idées non testées à ce jour (multivers de l\'inflation éternelle).',
      go: [['#/univers', 'L\'Univers observable']] },
    { id: 'groupe-local-futur', t: 'Le Groupe local va-t-il rester ensemble ?', lv: 'groupe-local',
      b: 'Oui : contrairement aux superamas, le Groupe local est tenu par sa propre gravité. Andromède se rapproche de nous à environ 110 km/s. Une collision avec la Voie lactée est possible dans les prochains milliards d\'années, mais pas certaine.',
      p: 'Une étude de 2025 (Sawala et ses collègues), qui tient compte des incertitudes de mesure et de l\'influence du Grand Nuage de Magellan et de M33, estime à environ une chance sur deux la fusion des deux galaxies dans les 10 milliards d\'années. Même en cas de collision, les étoiles elles-mêmes ne se heurteraient presque jamais : elles sont trop espacées.',
      go: [['#/groupe-local', 'Le Groupe local']] },
    { id: 'point', t: 'Que représente un point, selon le niveau ?', lv: null,
      b: 'Au Voisinage, un point est une étoile. Dans la Voie lactée, un grain de lumière figure des millions d\'étoiles. Au Volume local, un point est une galaxie entière ; au Superamas, un groupe de galaxies ; à Laniakea et dans l\'Univers observable, de nouveau une galaxie, mais seulement les plus brillantes ou celles dont on a mesuré le spectre.',
      p: 'Chaque niveau l\'indique en bas à gauche de la scène (« 1 point = … »), et chaque console précise ce qui est réel, adapté ou simulé.',
      go: [['#/atlas/echelles', 'De l\'atome à l\'Univers']] }
  ];
  var LV = { laniakea: 'Laniakea', superamas: 'Superamas local', univers: 'Univers observable', 'groupe-local': 'Groupe local' };
  OBS.atlasQuestions = function (root, sub) {
    var f = sub && LV[sub] ? sub : null;
    var chips = '<div class="v-filter" role="group" aria-label="Filtrer par niveau"><a class="chip" href="#/atlas/questions" aria-pressed="' + !f + '">Toutes</a>' +
      Object.keys(LV).map(function (k) { return '<a class="chip" href="#/atlas/questions/' + k + '" aria-pressed="' + (f === k) + '">' + esc(LV[k]) + '</a>'; }).join('') + '</div>';
    root.innerHTML = '<p>Les questions que posent les niveaux de l\'Observatoire. Chaque réponse se lit en deux temps : l\'essentiel, puis, en dépliant, les chiffres et les sources.</p>' + chips +
      '<div class="rows qa">' + Q.filter(function (q) { return !f || q.lv === f; }).map(function (q) {
        return '<article class="row" id="q-' + q.id + '"><div class="row-h"><h3>' + esc(q.t) + '</h3>' + (q.lv ? '<p class="row-kind">' + esc(LV[q.lv]) + '</p>' : '') + '</div><div class="row-b"><p>' + esc(q.b) + '</p>' +
          '<details><summary>Pour aller plus loin</summary><p>' + esc(q.p) + '</p></details>' +
          '<p class="qa-go">' + (q.go || []).map(function (g) { return '<a href="' + g[0] + '">' + esc(g[1]) + ' →</a>'; }).join('') + '</p></div></article>';
      }).join('') + '</div>';
  };
  OBS.QUESTIONS = Q;
})();

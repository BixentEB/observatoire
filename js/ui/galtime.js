/* ======================================================================
   OBSERVATOIRE — mode « temps galactique » (niveau Voie lactée)
   Une barre en bas de l'écran : lecture / pause, curseur de −600 à +300 millions d'années, repères de l'histoire
   de la Terre. Le calcul de la position est dans js/engine/galaxy.js (L.galTime, L.gtSet).
   Ouverture : OBS.galtime.open() (depuis la fiche du Soleil dans la Voie lactée, ou depuis la page Outils).
   ====================================================================== */
(function () {
  'use strict';
  var OBS = window.OBS = window.OBS || {}, esc = OBS.esc;
  var MIN = -600, MAX = 300, SPEED = 25;          // millions d'années par seconde en lecture
  // type : v = vie (vert), x = extinction (rouge), n = aujourd'hui (or), f = futur (bleu)
  var EVENTS = [
    [-541, 'Explosion cambrienne : la vie animale se diversifie', 'v'],
    [-444, 'Première grande extinction (fin de l\'Ordovicien)', 'x'],
    [-375, 'Les premiers vertébrés sortent de l\'eau', 'v'],
    [-252, 'Grande extinction du Permien : 9 espèces marines sur 10 disparaissent', 'x'],
    [-230, 'Premiers dinosaures', 'v'],
    [-201, 'Extinction de la fin du Trias', 'x'],
    [-150, 'Archaeopteryx, l\'un des premiers oiseaux', 'v'],
    [-66, 'Fin des dinosaures non aviens (astéroïde de Chicxulub)', 'x'],
    [-7, 'Premiers ancêtres de la lignée humaine', 'v'],
    [0, 'Aujourd\'hui', 'n'],
    [250, 'Les continents pourraient s\'être rassemblés en un nouveau supercontinent (prévision)', 'f']
  ];
  var bar = null, t = 0, playing = false, last = 0, raf = 0;
  function nf(v, d) { return v.toLocaleString('fr-FR', { maximumFractionDigits: d || 0, minimumFractionDigits: d || 0 }); }
  function when(x) { var a = Math.round(Math.abs(x)); return a === 0 ? 'Aujourd\'hui' : (x < 0 ? 'Il y a ' : 'Dans ') + nf(a) + ' million' + (a > 1 ? 's' : '') + ' d\'années'; }
  function near(x) { var best = null; EVENTS.forEach(function (e) { if (Math.abs(e[0] - x) <= 6 && (!best || Math.abs(e[0] - x) < Math.abs(best[0] - x))) best = e; }); return best; }

  function build() {
    bar = document.createElement('div'); bar.className = 'gt'; bar.setAttribute('role', 'region'); bar.setAttribute('aria-label', 'Temps galactique');
    // deux repères trop proches : le second passe sous le curseur
    var prev = -1e9, low = false;
    var ticks = EVENTS.map(function (e) { low = e[0] - prev < 45 ? !low : false; prev = e[0]; return '<button type="button" class="gt-ev t-' + e[2] + (low ? ' low' : '') + '" data-t="' + e[0] + '" style="left:' + ((e[0] - MIN) / (MAX - MIN) * 100).toFixed(2) + '%" title="' + esc(when(e[0]) + ' : ' + e[1]) + '"></button>'; }).join('');
    bar.innerHTML = '<div class="gt-top"><p class="gt-k">Temps galactique</p><p class="gt-when"></p><button type="button" class="gt-x" aria-label="Quitter le temps galactique">✕</button></div>' +
      '<p class="gt-ev-t"></p>' +
      '<div class="gt-row"><button type="button" class="gt-play" aria-label="Lecture">▶</button><div class="gt-track"><input type="range" min="' + MIN + '" max="' + MAX + '" step="1" value="0" aria-label="Millions d\'années avant ou après aujourd\'hui">' + ticks + '</div><button type="button" class="gt-now">Aujourd\'hui</button></div>' +
      '<p class="gt-leg"><span class="t-v">vie</span><span class="t-x">extinction</span><span class="t-f">prévision</span></p><div class="gt-info"><span class="gt-turns"></span><span class="gt-z"></span></div>' +
      '<p class="gt-flags"><span class="flag f-real" title="Réel — distance au centre mesurée (GRAVITY 2019), sens de rotation réel"><i>Rayon</i>mesuré</span><span class="flag f-adapt" title="Adapté — période estimée entre 220 et 250 millions d\'années ; l\'orbite réelle n\'est pas un cercle parfait"><i>Orbite</i>≈ 230 Ma, simplifiée</span><span class="flag f-adapt" title="Adapté — dans ce mode, les bras et les étoiles voisines restent immobiles ; en réalité, eux aussi tournent, à des vitesses différentes"><i>Bras</i>immobiles</span></p>';
    document.body.appendChild(bar);
    var rng = bar.querySelector('input');
    rng.addEventListener('input', function () { stop(); set(+rng.value); });
    bar.querySelector('.gt-play').addEventListener('click', function () { playing ? stop() : play(); });
    bar.querySelector('.gt-now').addEventListener('click', function () { stop(); set(0); });
    bar.querySelector('.gt-x').addEventListener('click', close);
    bar.addEventListener('click', function (e) { var b = e.target.closest('.gt-ev'); if (b) { stop(); set(+b.getAttribute('data-t')); } });
  }
  function set(x) {
    t = Math.max(MIN, Math.min(MAX, x));
    var r = OBS.galaxy.gtSet(t) || { turns: t / 230, z: 0 };
    bar.querySelector('input').value = Math.round(t);
    bar.querySelector('.gt-when').textContent = when(t);
    var ev = near(t); bar.querySelector('.gt-ev-t').textContent = ev ? (ev[0] === 0 ? 'Le Soleil à sa place d\'aujourd\'hui, à 26 670 années-lumière du centre' : ev[1]) : '';
    var tu = Math.abs(r.turns);
    bar.querySelector('.gt-turns').textContent = tu < .02 ? 'Un tour complet ≈ 230 millions d\'années' : nf(tu, tu < 1 ? 2 : 1) + ' tour' + (tu >= 2 ? 's' : '') + ' de galaxie ' + (t < 0 ? 'parcouru' + (tu >= 2 ? 's' : '') : 'à parcourir');
    bar.querySelector('.gt-z').textContent = (r.z >= 0 ? nf(r.z) + ' al au-dessus' : nf(-r.z) + ' al au-dessous') + ' du plan de la galaxie';
  }
  function frame(now) {
    if (!playing) return;
    var dt = Math.min(.1, (now - last) / 1000); last = now;
    var nx = t + dt * SPEED; if (nx >= MAX) { set(MAX); stop(); return; }
    set(nx); raf = requestAnimationFrame(frame);
  }
  function play() { if (t >= MAX - 1) set(MIN); playing = true; last = performance.now(); bar.querySelector('.gt-play').textContent = '❚❚'; bar.querySelector('.gt-play').setAttribute('aria-label', 'Pause'); raf = requestAnimationFrame(frame); }
  function stop() { playing = false; cancelAnimationFrame(raf); if (bar) { bar.querySelector('.gt-play').textContent = '▶'; bar.querySelector('.gt-play').setAttribute('aria-label', 'Lecture'); } }
  function open() {
    if (OBS.engine.level !== OBS.galaxy) { OBS.engine.go('galaxie', {}); setTimeout(open, 900); return; }
    if (!bar) build();
    bar.hidden = false; document.body.classList.add('gt-on');
    OBS.galaxy.galTime(true); set(t);
  }
  function close() { stop(); if (bar) bar.hidden = true; document.body.classList.remove('gt-on'); if (OBS.galaxy.gtOn) OBS.galaxy.galTime(false); }
  OBS.galtime = { open: open, close: close };
  OBS.on && OBS.on('level', function () { if (OBS.engine.level !== OBS.galaxy && bar && !bar.hidden) close(); });
  OBS.on && OBS.on('page', function (name) { if (name && bar && !bar.hidden) close(); });
})();

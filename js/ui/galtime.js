/* ======================================================================
   OBSERVATOIRE — le temps selon les niveaux (lot 11)
   Une barre en bas de l'écran : lecture / pause, curseur, repères. Chaque niveau qui le permet a son propre temps :
   - Voie lactée : le Soleil autour du centre, de −600 à +300 millions d'années, repères de l'histoire de la Terre
     (calcul dans js/engine/galaxy.js : L.galTime, L.gtSet) ;
   - Groupe local : Andromède vers la Voie lactée, d'aujourd'hui à +10 milliards d'années, trajectoire illustrative
     (js/engine/localgroup.js : L.timeMode, L.tSet, L.timeTraj) ;
   - Univers observable : l'expansion, du rayonnement fossile à +16 milliards d'années (js/engine/univers.js : L.timeMode, L.tSet).
   Ouverture : OBS.galtime.open([niveau]) : depuis une console, le fil d'Ariane (bouton ⏱) ou la page Outils.
   ====================================================================== */
(function () {
  'use strict';
  var OBS = window.OBS = window.OBS || {}, esc = OBS.esc;
  function nf(v, d) { return v.toLocaleString('fr-FR', { maximumFractionDigits: d || 0, minimumFractionDigits: d || 0 }); }
  function myr(x) { var a = Math.round(Math.abs(x)); if (a >= 1000) { var g = Math.round(a / 100) / 10; return nf(g, g % 1 ? 1 : 0) + ' milliard' + (g >= 2 ? 's' : ''); } return nf(a) + ' million' + (a > 1 ? 's' : ''); }
  // type des repères : v = vie (vert), x = extinction (rouge), n = aujourd'hui (or), f = futur, prévision (bleu), c = cosmos (violet)
  var MODES = {
    galaxie: {
      title: 'Temps galactique', min: -600, max: 300, step: 1, speed: 25, unit: 'Millions d\'années avant ou après aujourd\'hui',
      when: function (x) { var a = Math.round(Math.abs(x)); return a === 0 ? 'Aujourd\'hui' : (x < 0 ? 'Il y a ' : 'Dans ') + myr(x) + ' d\'années'; },
      events: [
        [-541, 'Explosion cambrienne : la vie animale se diversifie', 'v'], [-444, 'Première grande extinction (fin de l\'Ordovicien)', 'x'],
        [-375, 'Les premiers vertébrés sortent de l\'eau', 'v'], [-252, 'Grande extinction du Permien : 9 espèces marines sur 10 disparaissent', 'x'],
        [-230, 'Premiers dinosaures', 'v'], [-201, 'Extinction de la fin du Trias', 'x'], [-150, 'Archaeopteryx, l\'un des premiers oiseaux', 'v'],
        [-66, 'Fin des dinosaures non aviens (astéroïde de Chicxulub)', 'x'], [-7, 'Premiers ancêtres de la lignée humaine', 'v'],
        [0, 'Le Soleil à sa place d\'aujourd\'hui, à 26 670 années-lumière du centre', 'n'],
        [250, 'Les continents pourraient s\'être rassemblés en un nouveau supercontinent (prévision)', 'f']],
      legend: [['v', 'vie'], ['x', 'extinction'], ['f', 'prévision']],
      flags: '<span class="flag f-real" title="Réel — distance au centre mesurée (GRAVITY 2019), sens de rotation réel"><i>Rayon</i>mesuré</span><span class="flag f-adapt" title="Adapté — période estimée entre 220 et 250 millions d\'années ; l\'orbite réelle n\'est pas un cercle parfait"><i>Orbite</i>≈ 230 Ma, simplifiée</span><span class="flag f-adapt" title="Adapté — dans ce mode, les bras et les étoiles voisines restent immobiles ; en réalité, eux aussi tournent, à des vitesses différentes"><i>Bras</i>immobiles</span>',
      engine: function () { return OBS.galaxy; },
      on: function (b) { OBS.galaxy.galTime(b); },
      set: function (t) {
        var r = OBS.galaxy.gtSet(t) || { turns: t / 230, z: 0 }, tu = Math.abs(r.turns);
        return [tu < .02 ? 'Un tour complet ≈ 230 millions d\'années' : nf(tu, tu < 1 ? 2 : 1) + ' tour' + (tu >= 2 ? 's' : '') + ' de galaxie ' + (t < 0 ? 'parcouru' + (tu >= 2 ? 's' : '') : 'à parcourir'),
          (r.z >= 0 ? nf(r.z) + ' al au-dessus' : nf(-r.z) + ' al au-dessous') + ' du plan de la galaxie'];
      }
    },
    'groupe-local': {
      title: 'Temps du Groupe local', min: 0, max: 10000, step: 10, speed: 400, unit: 'Millions d\'années à partir d\'aujourd\'hui',
      when: function (x) { return x < 5 ? 'Aujourd\'hui' : 'Dans ' + myr(x) + ' d\'années'; },
      events: function () {
        var ev = OBS.localgroup.timeTraj(), out = [[0, 'Andromède à 2,5 millions d\'années-lumière, approche à 110 km/s', 'n']];
        ev.passes.forEach(function (p, i) { out.push([p[0], (i === 0 ? 'Premier' : i === 1 ? 'Deuxième' : 'Troisième') + ' passage d\'Andromède, à environ ' + nf(Math.round(p[1] * 3.2616 / 10) * 10) + ' 000 années-lumière (scénario illustratif)', 'f']); });
        out.push([5000, 'Le Soleil commence à devenir une géante rouge', 'c']);
        if (ev.merge) out.push([ev.merge, 'Fusion des deux galaxies en une grande elliptique, parfois surnommée « Milkomeda » (scénario illustratif)', 'f']);
        out.push([10000, 'Selon Sawala et ses collègues (2025), il y a environ une chance sur deux que la fusion ait eu lieu d\'ici là', 'x']);
        return out.sort(function (a, b) { return a[0] - b[0]; });
      },
      legend: [['f', 'scénario illustratif'], ['c', 'notre Soleil'], ['x', 'incertitude']],
      flags: '<span class="flag f-real" title="Réel — distance et vitesse d\'approche mesurées ; vitesse transverse d\'après Gaia (van der Marel et al. 2019)"><i>Départ</i>mesuré</span><span class="flag f-sim" title="Simulé — deux corps, masse totale 4 × 10^12 Soleils, direction transverse choisie arbitrairement, freinage simplifié dans les halos ; une collision n\'est pas certaine"><i>Trajectoire</i>illustrative</span><span class="flag f-adapt" title="Adapté — la Voie lactée reste au centre ; les autres galaxies sont immobiles"><i>Autres galaxies</i>immobiles</span>',
      engine: function () { return OBS.localgroup; },
      on: function (b) { OBS.localgroup.timeMode(b); },
      set: function (t) { var r = OBS.localgroup.tSet(t); return r ? ['Andromède à ' + (r.d >= 1e6 ? nf(r.d / 1e6, 2) + ' million' + (r.d >= 2e6 ? 's' : '') + ' d\'années-lumière' : nf(Math.round(r.d / 1000) * 1000) + ' années-lumière'), 'distance de centre à centre'] : ['', '']; }
    },
    univers: {
      title: 'Temps cosmique', min: 0, max: 30, step: .01, speed: 1.2, unit: 'Milliards d\'années depuis le Big Bang',
      when: function (x) { var d = x - OBS.univers.age; return x < .001 ? '380 000 ans après le Big Bang' : x < 1 ? nf(Math.round(x * 1000)) + ' millions d\'années après le Big Bang' : Math.abs(d) < .05 ? 'Aujourd\'hui, 13,8 milliards d\'années après le Big Bang' : nf(x, 1) + ' milliards d\'années après le Big Bang' + (d > 0 ? ' (dans ' + nf(d, 1) + ')' : ''); },
      events: function () { return [[.00038, 'Le rayonnement fossile est émis : l\'Univers devient transparent', 'c'], [.15, 'Les premières étoiles s\'allument (entre 100 et 200 millions d\'années environ)', 'c'], [.3, 'Les plus lointaines galaxies vues par le télescope James Webb', 'c'], [3.3, 'L\'âge d\'or de la formation des étoiles', 'v'], [7.7, 'L\'expansion commence à accélérer : l\'énergie noire prend le dessus', 'c'], [9.2, 'Naissance du Soleil et de la Terre', 'v'], [OBS.univers.age, 'Aujourd\'hui', 'n'], [30, 'Dans 16 milliards d\'années : les galaxies lointaines s\'éloignent de plus en plus vite (prévision)', 'f']]; },
      legend: [['c', 'cosmos'], ['v', 'étoiles et vie'], ['f', 'prévision']],
      flags: '<span class="flag f-real" title="Réel — paramètres mesurés par le satellite Planck (H0 = 67,4, Ωm = 0,315) : âge de 13,8 milliards d\'années"><i>Expansion</i>calculée</span><span class="flag f-adapt" title="Adapté — les galaxies d\'aujourd\'hui sont simplement rapprochées ou éloignées : en réalité, elles n\'existaient pas encore aux premiers instants"><i>Galaxies</i>celles d\'aujourd\'hui</span>',
      engine: function () { return OBS.univers; },
      on: function (b) { OBS.univers.timeMode(b); },
      set: function (t) { var r = OBS.univers.tSet(t); return ['Taille relative : ' + (r.a < .01 ? nf(r.a * 100, 2) : nf(r.a * 100)) + ' % de celle d\'aujourd\'hui', 'Rayonnement fossile : ' + (r.temp > 100 ? nf(Math.round(r.temp)) : nf(r.temp, 2)) + ' K']; }
    }
  };
  OBS.TIME_MODES = MODES;

  var bar = null, mode = null, M = null, EVENTS = [], t = 0, playing = false, last = 0, raf = 0;
  function near(x) { var tol = (M.max - M.min) / 120, best = null; EVENTS.forEach(function (e) { if (Math.abs(e[0] - x) <= tol && (!best || Math.abs(e[0] - x) < Math.abs(best[0] - x))) best = e; }); return best; }
  function build() {
    if (bar) bar.remove();
    EVENTS = typeof M.events === 'function' ? M.events() : M.events;
    bar = document.createElement('div'); bar.className = 'gt'; bar.setAttribute('role', 'region'); bar.setAttribute('aria-label', M.title);
    var prev = -1e9, low = false, span = M.max - M.min;
    var ticks = EVENTS.map(function (e) { low = (e[0] - prev) / span < .05 ? !low : false; prev = e[0]; return '<button type="button" class="gt-ev t-' + e[2] + (low ? ' low' : '') + '" data-t="' + e[0] + '" style="left:' + ((e[0] - M.min) / span * 100).toFixed(2) + '%" title="' + esc(M.when(e[0]) + ' : ' + e[1]) + '"></button>'; }).join('');
    bar.innerHTML = '<div class="gt-top"><p class="gt-k">' + esc(M.title) + '</p><p class="gt-when"></p><button type="button" class="gt-x" aria-label="Quitter">✕</button></div>' +
      '<p class="gt-ev-t"></p>' +
      '<div class="gt-row"><button type="button" class="gt-play" aria-label="Lecture">▶</button><div class="gt-track"><input type="range" min="' + M.min + '" max="' + M.max + '" step="' + M.step + '" value="0" aria-label="' + esc(M.unit) + '">' + ticks + '</div><button type="button" class="gt-now">Aujourd\'hui</button></div>' +
      '<p class="gt-leg">' + M.legend.map(function (l) { return '<span class="t-' + l[0] + '">' + esc(l[1]) + '</span>'; }).join('') + '</p><div class="gt-info"><span class="gt-turns"></span><span class="gt-z"></span></div>' +
      '<p class="gt-flags">' + M.flags + '</p>';
    document.body.appendChild(bar);
    var rng = bar.querySelector('input');
    rng.addEventListener('input', function () { stop(); set(+rng.value); });
    bar.querySelector('.gt-play').addEventListener('click', function () { playing ? stop() : play(); });
    bar.querySelector('.gt-now').addEventListener('click', function () { stop(); set(today()); });
    bar.querySelector('.gt-x').addEventListener('click', close);
    bar.addEventListener('click', function (e) { var b = e.target.closest('.gt-ev'); if (b) { stop(); set(+b.getAttribute('data-t')); } });
  }
  function today() { return mode === 'univers' ? OBS.univers.age : 0; }
  function set(x) {
    t = Math.max(M.min, Math.min(M.max, x));
    var info = M.set(t);
    bar.querySelector('input').value = t;
    bar.querySelector('.gt-when').textContent = M.when(t);
    var ev = near(t); bar.querySelector('.gt-ev-t').textContent = ev ? ev[1] : '';
    bar.querySelector('.gt-turns').textContent = info[0]; bar.querySelector('.gt-z').textContent = info[1];
  }
  function frame(now) {
    if (!playing) return;
    var dt = Math.min(.1, (now - last) / 1000); last = now;
    var nx = t + dt * M.speed; if (nx >= M.max) { set(M.max); stop(); return; }
    set(nx); raf = requestAnimationFrame(frame);
  }
  function play() { if (t >= M.max - M.step) set(M.min); playing = true; last = performance.now(); bar.querySelector('.gt-play').textContent = '❚❚'; bar.querySelector('.gt-play').setAttribute('aria-label', 'Pause'); raf = requestAnimationFrame(frame); }
  function stop() { playing = false; cancelAnimationFrame(raf); if (bar) { bar.querySelector('.gt-play').textContent = '▶'; bar.querySelector('.gt-play').setAttribute('aria-label', 'Lecture'); } }
  function open(lv) {
    var cur = OBS.engine.level && OBS.engine.level.id;
    lv = lv || (MODES[cur] ? cur : 'galaxie');
    if (cur !== lv) { OBS.engine.go(lv, {}); setTimeout(function () { open(lv); }, 900); return; }
    if (bar && !bar.hidden && mode === lv) return;
    if (mode && mode !== lv) close();
    mode = lv; M = MODES[lv]; build();
    bar.hidden = false; document.body.classList.add('gt-on');
    M.on(true); t = today(); set(t);
  }
  function close() { stop(); if (bar) bar.hidden = true; document.body.classList.remove('gt-on'); if (M) M.on(false); mode = null; }
  OBS.galtime = { open: open, close: close, has: function (lv) { return !!MODES[lv]; } };
  OBS.on && OBS.on('level', function (L) { if (bar && !bar.hidden && (!L || L.id !== mode)) close(); });
  OBS.on && OBS.on('page', function (name) { if (name && bar && !bar.hidden) close(); });
})();

/* ======================================================================
   OBSERVATOIRE — Carte des lunaisons (#/lunaisons)
   Tout est calculé dans le navigateur, sans appel extérieur :
   - instants des phases principales : Jean Meeus, Astronomical Algorithms, chap. 49 (termes principaux,
     corrections planétaires omises : écart de l'ordre de la minute) ; JDE (temps terrestre) ramené en temps
     universel avec ΔT ≈ 69 s ;
   - fraction éclairée et distance : chap. 48 et 47 (termes principaux, précision ≈ 0,5 % et quelques centaines de km).
   Contrôle : phases de novembre et décembre 2026 comparées au calendrier astronomique 2026 de l'IMCCE.
   La Lune est la texture réelle (lune.jpg) éclairée sous le bon angle ; la libration n'est pas représentée.
   ====================================================================== */
(function () {
  'use strict';
  var OBS = window.OBS = window.OBS || {}, esc = OBS.esc;
  var R = Math.PI / 180, DT = 69 / 86400, SYN = 29.530588861;
  function sin(d) { return Math.sin(d * R); } function cos(d) { return Math.cos(d * R); }
  function n360(d) { d %= 360; return d < 0 ? d + 360 : d; }
  function jdOf(date) { return date.getTime() / 86400000 + 2440587.5; }
  function dateOf(jd) { return new Date((jd - 2440587.5) * 86400000); }

  /* instant d'une phase : k entier (nouvelle lune), +.25 premier quartier, +.5 pleine lune, +.75 dernier quartier */
  function phaseJD(k) {
    var T = k / 1236.85, T2 = T * T, T3 = T2 * T, T4 = T3 * T;
    var jde = 2451550.09766 + 29.530588861 * k + .00015437 * T2 - .00000015 * T3 + .00000000073 * T4;
    var E = 1 - .002516 * T - .0000074 * T2, E2 = E * E;
    var M = 2.5534 + 29.1053567 * k - .0000014 * T2 - .00000011 * T3;
    var Mp = 201.5643 + 385.81693528 * k + .0107582 * T2 + .00001238 * T3 - .000000058 * T4;
    var F = 160.7108 + 390.67050284 * k - .0016118 * T2 - .00000227 * T3 + .000000011 * T4;
    var O = 124.7746 - 1.56375588 * k + .0020672 * T2 + .00000215 * T3;
    var f = Math.round((k - Math.floor(k)) * 4) % 4, c;
    var tail = -.00017 * sin(O) - .00007 * sin(Mp + 2 * M) + .00004 * sin(2 * Mp - 2 * F) + .00004 * sin(3 * M) + .00003 * sin(Mp + M - 2 * F) + .00003 * sin(2 * Mp + 2 * F)
      - .00003 * sin(Mp + M + 2 * F) + .00003 * sin(Mp - M + 2 * F) - .00002 * sin(Mp - M - 2 * F) - .00002 * sin(3 * Mp + M) + .00002 * sin(4 * Mp);
    if (f === 0 || f === 2) {
      var nw = f === 0;
      c = (nw ? -.4072 : -.40614) * sin(Mp) + (nw ? .17241 : .17302) * E * sin(M) + (nw ? .01608 : .01614) * sin(2 * Mp) + (nw ? .01039 : .01043) * sin(2 * F)
        + (nw ? .00739 : .00734) * E * sin(Mp - M) - (nw ? .00514 : .00515) * E * sin(Mp + M) + (nw ? .00208 : .00209) * E2 * sin(2 * M) - .00111 * sin(Mp - 2 * F)
        - .00057 * sin(Mp + 2 * F) + .00056 * E * sin(2 * Mp + M) - .00042 * sin(3 * Mp) + .00042 * E * sin(M + 2 * F) + .00038 * E * sin(M - 2 * F) - .00024 * E * sin(2 * Mp - M) + tail;
    } else {
      c = -.62801 * sin(Mp) + .17172 * E * sin(M) - .01183 * E * sin(Mp + M) + .00862 * sin(2 * Mp) + .00804 * sin(2 * F) + .00454 * E * sin(Mp - M) + .00204 * E2 * sin(2 * M)
        - .0018 * sin(Mp - 2 * F) - .0007 * sin(Mp + 2 * F) - .0004 * sin(3 * Mp) - .00034 * E * sin(2 * Mp - M) + .00032 * E * sin(M + 2 * F) + .00032 * E * sin(M - 2 * F)
        - .00028 * E2 * sin(Mp + 2 * M) + .00027 * E * sin(2 * M) - .00017 * sin(O) - .00005 * sin(Mp - M - 2 * F) + .00004 * sin(2 * Mp + 2 * F) - .00004 * sin(Mp + M + 2 * F)
        + .00004 * sin(Mp - 2 * M) + .00003 * sin(Mp + M - 2 * F) + .00003 * sin(3 * M) + .00002 * sin(2 * Mp - 2 * F) + .00002 * sin(Mp - M + 2 * F) - .00002 * sin(3 * Mp + M);
      var W = .00306 - .00038 * E * cos(M) + .00026 * cos(Mp) - .00002 * cos(Mp - M) + .00002 * cos(Mp + M) + .00002 * cos(2 * F);
      c += f === 1 ? W : -W;
    }
    return jde + c - DT;
  }

  /* état de la Lune à un instant : fraction éclairée, croissante ou non, distance (km), âge (jours depuis la nouvelle lune) */
  function moonAt(jd) {
    var T = (jd + DT - 2451545) / 36525;
    var D = n360(297.8501921 + 445267.1114034 * T), M = n360(357.5291092 + 35999.0502909 * T);
    var Mp = n360(134.9633964 + 477198.8675055 * T), F = n360(93.272095 + 483202.0175233 * T), E = 1 - .002516 * T;
    var i = 180 - D - 6.289 * sin(Mp) + 2.1 * sin(M) - 1.274 * sin(2 * D - Mp) - .658 * sin(2 * D) - .214 * sin(2 * Mp) - .11 * sin(D);
    var frac = (1 + cos(i)) / 2;
    var dist = 385000.56 - 20905.355 * cos(Mp) - 3699.111 * cos(2 * D - Mp) - 2955.968 * cos(2 * D) - 569.925 * cos(2 * Mp) + 48.888 * E * cos(M) - 3.149 * cos(2 * F)
      + 246.158 * cos(2 * D - 2 * Mp) - 152.138 * E * cos(2 * D - M - Mp) - 170.733 * cos(2 * D + Mp) - 204.586 * E * cos(2 * D - M) - 129.62 * E * cos(Mp - M)
      + 108.743 * cos(D) + 104.755 * E * cos(Mp + M) + 10.321 * cos(2 * D - 2 * F) + 79.661 * cos(Mp - 2 * F) - 34.782 * cos(4 * D - Mp) - 23.21 * cos(3 * Mp)
      - 21.636 * cos(4 * D - 2 * Mp) + 24.208 * E * cos(2 * D + M - Mp) + 30.824 * E * cos(2 * D + M) - 8.379 * cos(D - Mp) - 16.675 * E * cos(D + M) - 12.831 * E * cos(2 * D - M + Mp);
    var k = Math.floor((jd - 2451550.09766) / SYN), nm = phaseJD(k);
    if (nm > jd) { k--; nm = phaseJD(k); } else { var nx = phaseJD(k + 1); if (nx <= jd) { k++; nm = nx; } }
    var age = jd - nm;
    var ia = n360(i); if (ia > 180) ia = 360 - ia;          // angle de phase ramené entre 0 et 180°
    return { frac: frac, waxing: age < SYN / 2, dist: dist, age: age, i: ia };
  }
  OBS.moonAt = function (date) { return moonAt(jdOf(date)); };

  var NAMES = ['Nouvelle lune', 'Premier quartier', 'Pleine lune', 'Dernier quartier'];
  function phaseName(m) {
    var a = m.age / SYN;
    if (a < .0339 || a > .9661) return 'Nouvelle lune';
    if (Math.abs(a - .25) < .0339) return 'Premier quartier';
    if (Math.abs(a - .5) < .0339) return 'Pleine lune';
    if (Math.abs(a - .75) < .0339) return 'Dernier quartier';
    return a < .25 ? 'Premier croissant' : a < .5 ? 'Gibbeuse croissante' : a < .75 ? 'Gibbeuse décroissante' : 'Dernier croissant';
  }
  /* phases principales à partir d'un instant */
  function nextPhases(jd, n) {
    var k = Math.floor((jd - 2451550.09766) / SYN) - 1, out = [];
    for (var q = k * 4; out.length < n; q++) { var t = phaseJD(q / 4); if (t >= jd) out.push({ jd: t, f: ((q % 4) + 4) % 4 }); }
    return out;
  }
  var SUPER = 362000;   // convention de R. Nolle (1979), la plus reprise : pleine ou nouvelle lune à moins d'environ 362 000 km

  /* petite Lune vectorielle pour le calendrier : disque sombre + partie éclairée bornée par le terminateur */
  function icon(m, size) {
    var r = size / 2 - 1, c = size / 2, k = m.frac, rx = Math.abs(2 * k - 1) * r, sw = k > .5 ? 1 : 0;
    var lit = k < .01 ? '' : k > .99 ? '<circle cx="' + c + '" cy="' + c + '" r="' + r + '" fill="#e9e4d6"/>' :
      '<path d="M' + c + ' ' + (c - r) + ' A' + r + ' ' + r + ' 0 0 1 ' + c + ' ' + (c + r) + ' A' + rx.toFixed(2) + ' ' + r + ' 0 0 ' + sw + ' ' + c + ' ' + (c - r) + 'Z" fill="#e9e4d6"' + (m.waxing ? '' : ' transform="matrix(-1 0 0 1 ' + size + ' 0)"') + '/>';
    return '<svg class="lu-ico" viewBox="0 0 ' + size + ' ' + size + '" width="' + size + '" height="' + size + '" aria-hidden="true"><circle cx="' + c + '" cy="' + c + '" r="' + r + '" fill="#1c2033" stroke="#2c3350" stroke-width=".6"/>' + lit + '</svg>';
  }

  /* rendu 3D : la texture réelle, éclairée sous l'angle de phase (vue depuis la Terre) */
  function moonView(canvas) {
    var T = window.THREE; if (!T) return null;
    var ren = new T.WebGLRenderer({ canvas: canvas, antialias: true, alpha: true, preserveDrawingBuffer: true });
    ren.setPixelRatio(Math.min(2, window.devicePixelRatio || 1));
    var scene = new T.Scene(), cam = new T.PerspectiveCamera(20, 1, .1, 100); cam.position.set(0, 0, 6.2);
    ren.outputEncoding = T.sRGBEncoding;
    var tex = new T.TextureLoader().load('textures/lune.jpg', function () { draw(); }); tex.encoding = T.sRGBEncoding;
    var mesh = new T.Mesh(new T.SphereGeometry(1, 96, 64), new T.MeshStandardMaterial({ map: tex, roughness: 1, metalness: 0 }));
    mesh.rotation.y = -Math.PI / 2;                       // la face visible (longitude 0) tournée vers nous
    scene.add(mesh);
    var sun = new T.DirectionalLight(0xfff6e8, 1.25); scene.add(sun);
    scene.add(new T.AmbientLight(0x6a7aa8, .022));          // lumière cendrée : le disque reste à peine visible à la nouvelle lune
    var st = null;
    function size() { var w = canvas.clientWidth || 320; ren.setSize(w, w, false); }
    function draw() { if (!st) return; sun.position.set(Math.sin(st.i * R) * (st.waxing ? 1 : -1), 0, Math.cos(st.i * R)); ren.render(scene, cam); }
    size();
    return { set: function (m) { st = m; draw(); }, resize: function () { size(); draw(); }, dispose: function () { ren.dispose(); tex.dispose(); } };
  }

  var fmtD = new Intl.DateTimeFormat('fr-FR', { weekday: 'short', day: 'numeric', month: 'long', year: 'numeric' });
  var fmtT = new Intl.DateTimeFormat('fr-FR', { hour: '2-digit', minute: '2-digit' });
  var fmtM = new Intl.DateTimeFormat('fr-FR', { month: 'long', year: 'numeric' });
  function nf(v, d) { return v.toLocaleString('fr-FR', { maximumFractionDigits: d || 0, minimumFractionDigits: d || 0 }); }
  function store(k, v) { try { if (v === undefined) return localStorage.getItem(k); localStorage.setItem(k, v); } catch (e) { return null; } }

  OBS.pages.lunaisons = function (root) {
    var now = new Date(), cur = new Date(now), south = store('obs.lune.sud') === '1';
    root.innerHTML = '<p><a href="#/outils" class="chip">← Outils</a></p><p class="p-kicker">Outil</p><h1>Les lunaisons</h1>' +
      '<p class="lead">La Lune telle qu\'on la voit depuis la Terre, à n\'importe quelle date, et ses prochaines phases. Une lunaison, d\'une nouvelle lune à la suivante, dure en moyenne 29,53 jours.</p>' +
      '<div class="c-flags"><span class="flag f-real" title="Réel — instants calculés avec les formules de Jean Meeus (Astronomical Algorithms), à la minute près ; vérifiés sur le calendrier de l\'IMCCE"><i>Phases</i>calculées</span>' +
      '<span class="flag f-real" title="Réel — fraction éclairée et distance Terre-Lune calculées (termes principaux)"><i>Distance</i>calculée</span>' +
      '<span class="flag f-adapt" title="Adapté — vraie carte de la Lune, éclairée sous le bon angle ; le léger balancement de la Lune (libration) n\'est pas représenté"><i>Aspect</i>sans libration</span></div>' +
      '<div class="lu"><div class="lu-stage"><canvas class="lu-moon' + (south ? ' south' : '') + '" aria-label="La Lune à la date choisie"></canvas>' +
      '<div class="lu-hemi" role="group" aria-label="Hémisphère"><button type="button" data-h="n" aria-pressed="' + !south + '">Vue du Nord</button><button type="button" data-h="s" aria-pressed="' + south + '">Vue du Sud</button></div></div>' +
      '<div class="lu-info"><p class="lu-date"></p><h2 class="lu-name"></h2><dl class="lu-kv"></dl>' +
      '<div class="lu-ctrl"><button type="button" data-d="-1" aria-label="Jour précédent">‹ jour</button><button type="button" data-today>Aujourd\'hui</button><button type="button" data-d="1" aria-label="Jour suivant">jour ›</button>' +
      '<input type="date" class="lu-pick" aria-label="Choisir une date"></div>' +
      '<input type="range" class="lu-range" min="-366" max="366" step="1" value="0" aria-label="Jours avant ou après aujourd\'hui"><p class="lu-rl"><span>il y a un an</span><span>aujourd\'hui</span><span>dans un an</span></p></div></div>' +
      '<h2 class="lu-h">Prochaines phases</h2><div class="lu-next"></div>' +
      '<h2 class="lu-h lu-cal-h"><button type="button" data-m="-1" aria-label="Mois précédent">‹</button><span></span><button type="button" data-m="1" aria-label="Mois suivant">›</button></h2><div class="lu-cal"></div>' +
      '<p class="note">Super-lune : pleine lune à moins d\'environ 362 000 km de la Terre (convention de l\'astrologue Richard Nolle, 1979, reprise par les médias) : ce n\'est pas une définition astronomique officielle ; la Lune paraît alors environ 7 % plus grande et 15 % plus lumineuse qu\'en moyenne. Les heures sont données dans le fuseau de votre appareil.</p>';
    var cv = root.querySelector('.lu-moon'), view = moonView(cv);
    var $ = function (s) { return root.querySelector(s); }, calMonth = new Date(cur.getFullYear(), cur.getMonth(), 1);

    function upd() {
      var m = moonAt(jdOf(cur)), name = phaseName(m);
      if (view) view.set(m);
      $('.lu-date').textContent = fmtD.format(cur) + ' · ' + fmtT.format(cur);
      $('.lu-name').textContent = name;
      $('.lu-kv').innerHTML = '<div><dt>Éclairée</dt><dd>' + nf(m.frac * 100) + ' %</dd></div><div><dt>Âge</dt><dd>' + nf(m.age, 1) + ' j</dd></div>' +
        '<div><dt>Distance</dt><dd>' + nf(Math.round(m.dist / 100) * 100) + ' km</dd></div><div><dt>Taille apparente</dt><dd>' + nf(384400 / m.dist * 100) + ' %</dd></div>';
      var days = Math.round((new Date(cur.getFullYear(), cur.getMonth(), cur.getDate()) - new Date(now.getFullYear(), now.getMonth(), now.getDate())) / 864e5);
      $('.lu-range').value = Math.max(-366, Math.min(366, days));
      var p = cur; $('.lu-pick').value = p.getFullYear() + '-' + ('0' + (p.getMonth() + 1)).slice(-2) + '-' + ('0' + p.getDate()).slice(-2);
      var cm = new Date(cur.getFullYear(), cur.getMonth(), 1); if (cm.getTime() !== calMonth.getTime()) { calMonth = cm; cal(); } else markCal();
    }
    function next() {
      var L = nextPhases(jdOf(now), 8);
      $('.lu-next').innerHTML = L.map(function (p) {
        var d = dateOf(p.jd), m = moonAt(p.jd), sup = (p.f === 0 || p.f === 2) && m.dist < SUPER;
        return '<button type="button" class="lu-ph" data-jd="' + p.jd + '">' + icon(m, 34) + '<span><b>' + NAMES[p.f] + (sup ? ' <em class="lu-sup">super-lune</em>' : '') + '</b><small>' + esc(fmtD.format(d)) + ' · ' + fmtT.format(d) + '</small><small>' + nf(Math.round(m.dist / 100) * 100) + ' km</small></span></button>';
      }).join('');
    }
    function cal() {
      var y = calMonth.getFullYear(), mo = calMonth.getMonth(), nd = new Date(y, mo + 1, 0).getDate(), first = (new Date(y, mo, 1).getDay() + 6) % 7;
      $('.lu-cal-h span').textContent = fmtM.format(calMonth);
      var ph = nextPhases(jdOf(new Date(y, mo, 1)) - 1, 6).filter(function (p) { var d = dateOf(p.jd); return d.getFullYear() === y && d.getMonth() === mo; });
      var h = ['lun', 'mar', 'mer', 'jeu', 'ven', 'sam', 'dim'].map(function (d) { return '<span class="lu-dh">' + d + '</span>'; }).join('');
      for (var i = 0; i < first; i++) h += '<span></span>';
      for (var d = 1; d <= nd; d++) {
        var at = new Date(y, mo, d, 21, 0), m = moonAt(jdOf(at)), mark = ph.filter(function (p) { return dateOf(p.jd).getDate() === d; })[0];
        var today = d === now.getDate() && mo === now.getMonth() && y === now.getFullYear();
        h += '<button type="button" class="lu-day' + (today ? ' today' : '') + (mark ? ' key' : '') + '" data-day="' + d + '" title="' + esc(phaseName(m) + ' · ' + nf(m.frac * 100) + ' % éclairée (21 h)') + '"><span class="lu-dn">' + d + '</span>' + icon(m, 30) + (mark ? '<small>' + NAMES[mark.f].replace('Premier quartier', '1er quartier') + '</small>' : '') + '</button>';
      }
      $('.lu-cal').innerHTML = h; markCal();
    }
    function markCal() { Array.prototype.forEach.call(root.querySelectorAll('.lu-day'), function (b) { b.classList.toggle('on', +b.getAttribute('data-day') === cur.getDate() && calMonth.getMonth() === cur.getMonth() && calMonth.getFullYear() === cur.getFullYear()); }); }

    root.addEventListener('click', function (e) {
      var b = e.target.closest('button'); if (!b) return;
      if (b.hasAttribute('data-d')) { cur = new Date(cur.getTime() + +b.getAttribute('data-d') * 864e5); upd(); }
      else if (b.hasAttribute('data-today')) { cur = new Date(); upd(); }
      else if (b.hasAttribute('data-jd')) { cur = dateOf(+b.getAttribute('data-jd')); upd(); $('.lu').scrollIntoView({ behavior: 'smooth', block: 'start' }); }
      else if (b.hasAttribute('data-m')) { calMonth = new Date(calMonth.getFullYear(), calMonth.getMonth() + +b.getAttribute('data-m'), 1); cal(); }
      else if (b.hasAttribute('data-day')) { cur = new Date(calMonth.getFullYear(), calMonth.getMonth(), +b.getAttribute('data-day'), 21, 0); upd(); }
      else if (b.hasAttribute('data-h')) { south = b.getAttribute('data-h') === 's'; store('obs.lune.sud', south ? '1' : '0'); cv.classList.toggle('south', south); root.classList.toggle('lu-south', south); root.querySelectorAll('[data-h]').forEach(function (x) { x.setAttribute('aria-pressed', String(x === b)); }); }
    });
    root.classList.toggle('lu-south', south);
    $('.lu-range').addEventListener('input', function (e) { var t = new Date(now.getFullYear(), now.getMonth(), now.getDate() + +e.target.value, cur.getHours(), cur.getMinutes()); cur = t; upd(); });
    $('.lu-pick').addEventListener('change', function (e) { var v = e.target.value.split('-'); if (v.length === 3) { cur = new Date(+v[0], +v[1] - 1, +v[2], cur.getHours(), cur.getMinutes()); upd(); } });
    var onR = function () { if (!document.body.contains(cv)) { window.removeEventListener('resize', onR); if (view) view.dispose(); return; } if (view) view.resize(); };
    window.addEventListener('resize', onR);
    window.addEventListener('hashchange', function off() { if (!document.body.contains(cv)) { window.removeEventListener('hashchange', off); if (view) view.dispose(); } });
    next(); cal(); upd();
  };
  OBS.lunePhaseJD = phaseJD;   // pour vérification
})();

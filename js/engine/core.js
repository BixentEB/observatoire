/* ======================================================================
   OBSERVATOIRE — moteur commun
   Un seul rendu WebGL partagé par des « niveaux » (système solaire, voisinage stellaire…).
   Chaque niveau a sa propre scène, sa propre caméra et sa propre échelle : on ne met jamais
   la Terre et les étoiles voisines dans le même espace de coordonnées (précision numérique).
   Un niveau expose : id, label, scene, camera, controls, labelsEl,
     enter(opts), leave(), update(dt, now), resize(W, H), crumbs(), onWheelOut / onWheelIn.
   ====================================================================== */
(function () {
  'use strict';
  var OBS = window.OBS = window.OBS || {};
  var T = window.THREE;

  /* ---------- petit bus d'événements ---------- */
  var handlers = {};
  OBS.on = function (ev, fn) { (handlers[ev] = handlers[ev] || []).push(fn); };
  OBS.emit = function (ev, data) { (handlers[ev] || []).forEach(function (fn) { try { fn(data); } catch (e) { console.error(e); } }); };

  /* ---------- temps simulé ---------- */
  var SPEEDS = [
    { id: 'reel', label: 'Temps réel', short: '×1', rate: 1 / 86400 },
    { id: 'minute', label: '1 minute par seconde', short: '1 min/s', rate: 1 / 1440 },
    { id: 'heure', label: '1 heure par seconde', short: '1 h/s', rate: 1 / 24 },
    { id: 'jour', label: '1 jour par seconde', short: '1 j/s', rate: 1 },
    { id: 'semaine', label: '1 semaine par seconde', short: '1 sem/s', rate: 7 },
    { id: 'mois', label: '1 mois par seconde', short: '1 mois/s', rate: 30.4375 },
    { id: 'an', label: '1 an par seconde', short: '1 an/s', rate: 365.25 }
  ];
  var time = OBS.time = {
    SPEEDS: SPEEDS, jd: OBS.astro.jdFromDate(new Date()), speed: 2, dir: 1, paused: false,   // arrivée : légèrement accéléré (1 h/s), « Temps réel » pour passer en direct
    jdSpin: 0,                                  // date utilisée pour la rotation des astres (voir Méthode)
    get rate() { return SPEEDS[this.speed].rate * this.dir; },
    now: function () { this.jd = OBS.astro.jdFromDate(new Date()); this.jdSpin = this.jd; OBS.emit('time', this); },
    live: function () { this.speed = 0; this.dir = 1; this.paused = false; this.now(); },
    get isLive() { return this.speed === 0 && this.dir === 1 && !this.paused && Math.abs(this.jd - OBS.astro.jdFromDate(new Date())) < 2 / 1440; },
    set: function (jd) { this.jd = jd; this.jdSpin = jd; OBS.emit('time', this); },
    setSpeed: function (i) { this.speed = Math.max(0, Math.min(SPEEDS.length - 1, i)); OBS.emit('time', this); },
    toggle: function () { this.paused = !this.paused; OBS.emit('time', this); },
    reverse: function () { this.dir = -this.dir; OBS.emit('time', this); }
  };
  time.jdSpin = time.jd;
  var SPIN_MAX = 2;   // au-delà de 2 jours par seconde, la rotation affichée des astres est ralentie (sinon effet stroboscopique)

  /* ---------- rendu ---------- */
  var engine = OBS.engine = { levels: {}, level: null, W: 800, H: 600, PR: 1 };
  var stage, renderer, composer, renderPass, bloom, finalPass, customRT = false;

  engine.init = function (stageEl) {
    stage = stageEl;
    if (!T || !T.OrbitControls || !T.EffectComposer) throw new Error('moteur');
    renderer = new T.WebGLRenderer({ antialias: false, powerPreference: 'high-performance' });
    renderer.setClearColor(0x000000, 1);
    engine.renderer = renderer;
    var cv = renderer.domElement; cv.id = 'cv'; cv.setAttribute('aria-hidden', 'true');
    stage.insertBefore(cv, stage.firstChild);
    engine.canvas = cv;
    // la molette au-dessus d'une étiquette doit quand même zoomer la scène
    stage.addEventListener('wheel', function (e) {
      if (e.target === cv) return;
      e.preventDefault();
      cv.dispatchEvent(new WheelEvent('wheel', { deltaX: e.deltaX, deltaY: e.deltaY, deltaZ: e.deltaZ, deltaMode: e.deltaMode, clientX: e.clientX, clientY: e.clientY, ctrlKey: e.ctrlKey, bubbles: false, cancelable: true }));
    }, { passive: false });

    var cfg = OBS.perf.cfg, rt = null;
    try {
      if (cfg.msaa && renderer.capabilities.isWebGL2 && T.WebGLMultisampleRenderTarget) {
        rt = new T.WebGLMultisampleRenderTarget(800, 600, { minFilter: T.LinearFilter, magFilter: T.LinearFilter, format: T.RGBAFormat, type: T.HalfFloatType });
        rt.samples = 4;
      }
    } catch (e) { rt = null; }
    customRT = !!rt;
    composer = rt ? new T.EffectComposer(renderer, rt) : new T.EffectComposer(renderer);
    renderPass = new T.RenderPass(new T.Scene(), new T.PerspectiveCamera());
    composer.addPass(renderPass);
    if (cfg.bloom && T.UnrealBloomPass) {
      bloom = new T.UnrealBloomPass(new T.Vector2(800, 600), .85, .7, 1.15);
      composer.addPass(bloom);
    }
    finalPass = new T.ShaderPass({ uniforms: { tDiffuse: { value: null }, uTime: { value: 0 }, uFade: { value: 1 }, uRes: { value: new T.Vector2(800, 600) } },
      vertexShader: OBS.GLSL.FINAL_VERT, fragmentShader: OBS.GLSL.FINAL_FRAG });
    finalPass.renderToScreen = true;
    composer.addPass(finalPass);

    var rto = 0;
    function later() { clearTimeout(rto); rto = setTimeout(engine.resize, 80); }
    if (window.ResizeObserver) new ResizeObserver(later).observe(stage);
    window.addEventListener('resize', later);
    engine.resize();
  };

  engine.resize = function () {
    if (!renderer) return;
    var r = stage.getBoundingClientRect();
    engine.W = Math.max(280, Math.round(r.width)); engine.H = Math.max(300, Math.round(r.height));
    engine.PR = OBS.perf.pixelRatio();
    renderer.setPixelRatio(engine.PR);
    renderer.setSize(engine.W, engine.H, false);
    if (customRT) composer.setSize(engine.W * engine.PR, engine.H * engine.PR); else { composer.setPixelRatio(engine.PR); composer.setSize(engine.W, engine.H); }
    finalPass.uniforms.uRes.value.set(engine.W * engine.PR, engine.H * engine.PR);
    Object.keys(engine.levels).forEach(function (k) { engine.levels[k].resize(engine.W, engine.H, engine.PR); });
  };

  engine.add = function (level) { engine.levels[level.id] = level; level.resize(engine.W, engine.H, engine.PR); };

  /* ---------- changement de niveau, avec fondu court (jamais d'écran noir complet) ---------- */
  var fade = { v: 1, target: 1 }, switching = null;
  engine.go = function (id, opts) {
    opts = opts || {};
    var next = engine.levels[id]; if (!next || switching) return;
    if (engine.level === next) {
      if (opts.star && next.show) { next.show(opts.star); next.enter(opts); return; }   // une autre étoile, dans le même niveau
      if (opts.focus !== undefined && next.focus) next.focus(opts.focus); return;
    }
    if (!engine.level || opts.instant) { activate(next, opts); return; }
    var prev = engine.level;
    switching = { next: next, opts: opts, t: 0 };
    fade.target = .12;
    if (prev.leaveAnim) prev.leaveAnim(opts);
    OBS.emit('level:leaving', { from: prev.id, to: id });
  };
  function activate(level, opts) {
    if (engine.level && engine.level.leave) engine.level.leave();
    Object.keys(engine.levels).forEach(function (k) { engine.levels[k].labelsEl.hidden = engine.levels[k] !== level; });
    engine.level = level;
    renderPass.scene = level.scene; renderPass.camera = level.camera;
    OBS.emit('level', level);
    level.enter(opts || {});
    fade.target = 1;
  }

  /* ---------- décalage de la vue : l'objet suivi reste centré dans la partie visible (console ouverte) ---------- */
  var shift = { x: 0, y: 0, tx: 0, ty: 0 };
  engine.setShift = function (x, y) { shift.tx = x; shift.ty = y; };
  function applyShift(cam, dt) {
    shift.x += (shift.tx - shift.x) * Math.min(1, dt * 5); shift.y += (shift.ty - shift.y) * Math.min(1, dt * 5);
    if (Math.abs(shift.x) < .5 && Math.abs(shift.y) < .5 && !shift.tx && !shift.ty) { if (cam.view && cam.view.enabled) cam.clearViewOffset(); return; }
    cam.setViewOffset(engine.W, engine.H, shift.x, shift.y, engine.W, engine.H);
  }

  /* ---------- boucle ---------- */
  var last = 0, watch = null, lastDraw = 0;
  engine.start = function () {
    watch = OBS.perf.watch(function () { engine.resize(); });
    requestAnimationFrame(frame);
  };
  function frame(now) {
    requestAnimationFrame(frame);
    // page de lecture ouverte par-dessus la scène : on la fait tourner au ralenti pour ménager l'appareil
    var dimmed = document.body.classList.contains('page-open');
    if (dimmed && now - lastDraw < 66) return;
    var dt = Math.min(.1, last ? (now - last) / 1000 : .016); last = now; lastDraw = now;
    if (watch) watch(now);

    var wall = OBS.astro.jdFromDate(new Date());
    if (!time.paused && time.speed === 0 && time.dir === 1 && Math.abs(time.jd - wall) < 5 / 1440) {
      time.jd = wall; time.jdSpin = wall;          // en direct : calé sur l'horloge, même si des images ont sauté
    } else if (!time.paused) {
      time.jd += time.rate * dt;
      if (Math.abs(time.rate) <= SPIN_MAX) time.jdSpin = time.jd;
      else time.jdSpin += Math.sign(time.rate) * SPIN_MAX * dt;
    }
    // fondu
    fade.v += (fade.target - fade.v) * Math.min(1, dt * 9);
    if (switching) {
      switching.t += dt;
      if (switching.t > .42) { var s = switching; switching = null; activate(s.next, s.opts); }
    }
    finalPass.uniforms.uFade.value = fade.v;
    finalPass.uniforms.uTime.value = now / 1000;

    var L = engine.level;
    if (L) {
      applyShift(L.camera, dt);
      L.update(dt, now);
      composer.render();
    }
    if (!engine.ready) { engine.ready = true; OBS.emit('ready'); }
  }
})();

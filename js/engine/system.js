/* ======================================================================
   OBSERVATOIRE — niveau « Système solaire »
   Positions réelles à la date affichée (voir astro.js). Seule l'échelle est adaptée :
   - distances : compressées (r^0,55) par défaut, ou réelles (linéaires) sur demande ;
   - tailles : compressées (r^0,4), toujours agrandies par rapport aux distances.
   Les deux réglages sont signalés en permanence dans l'interface.
   ====================================================================== */
(function () {
  'use strict';
  var OBS = window.OBS = window.OBS || {};
  var T = window.THREE, A = OBS.astro, G = OBS.GLSL;
  var TAU = Math.PI * 2, D2R = Math.PI / 180;

  /* ---------- échelle ---------- */
  var AU = 36;                                   // 1 UA = 36 unités (Terre à la même place dans les deux modes)
  var scale = {
    mode: 'adaptee',
    dist: function (au) { return scale.mode === 'reelle' ? AU * au : AU * Math.pow(au, 0.55); },
    // tailles : compressées (r^0,4) et plus petites qu'avant, pour laisser de la place entre planètes voisines
    radius: function (km) { return 0.026 * Math.pow(km, 0.4); },
    // lunes : leur taille garde à peu près la proportion réelle par rapport à leur planète (exposant 0,8)
    moonRadius: function (km, parentKm, parentR) { return Math.max(0.02, parentR * Math.pow(km / parentKm, 0.8)); },
    // distance d'une lune : réelle (en rayons de la planète) jusqu'à 2,5 rayons, puis compressée (logarithme).
    // Mimas reste hors des anneaux de Saturne, et la Lune reste près de la Terre même quand Mars passe au plus près.
    moonDist: function (rp, aKm, rpKm) { var x = aKm / rpKm; return rp * (x <= 2.5 ? x : 2.5 + 1.4 * Math.log(x / 2.5)); }
  };
  var SUN_R = 7;

  var L = { id: 'systeme', label: 'Système solaire', scale: scale };
  OBS.system = L;

  var scene = L.scene = new T.Scene();
  var camera = L.camera = new T.PerspectiveCamera(40, 1, 0.02, 60000);
  var controls, labelsEl, W = 800, H = 600, PR = 1, tanHalf = Math.tan(20 * D2R);
  var cfg = OBS.perf.cfg;
  var sysView = false;
  var tmp = new T.Vector3(), tmp2 = new T.Vector3(), tmp3 = new T.Vector3(), ecl = {}, ecl2 = {};
  var sunPos = new T.Vector3();

  /* ---------- conversions ---------- */
  function toScene(v, out) {                      // v : écliptique en UA → scène, échelle radiale
    var r = Math.sqrt(v.x * v.x + v.y * v.y + v.z * v.z);
    if (r < 1e-9) return out.set(0, 0, 0);
    var k = scale.dist(r) / r;
    return out.set(v.x * k, v.z * k, -v.y * k);
  }
  function dirToScene(v, out) { return out.set(v.x, v.z, -v.y).normalize(); }

  /* ---------- ciel ---------- */
  function buildSky(renderer) {
    var rtSize = cfg.stars > 5000 ? 2048 : 1024;
    var skyRT = new T.WebGLRenderTarget(rtSize, rtSize / 2, { minFilter: T.LinearFilter, magFilter: T.LinearFilter, depthBuffer: false });
    var gn = dirToScene(A.raDecToEcl(192.85948, 27.12825, 1), new T.Vector3());
    var gc = dirToScene(A.raDecToEcl(266.40500, -28.93617, 1), new T.Vector3());
    var m = new T.ShaderMaterial({ uniforms: { uGalN: { value: gn }, uGalC: { value: gc } }, vertexShader: G.SKY_VERT, fragmentShader: G.SKY_FRAG, depthTest: false, depthWrite: false });
    var s2 = new T.Scene(); s2.add(new T.Mesh(new T.PlaneGeometry(2, 2), m));
    renderer.setRenderTarget(skyRT); renderer.render(s2, new T.Camera()); renderer.setRenderTarget(null); m.dispose();
    var sky = new T.Group();
    var sphere = new T.Mesh(new T.SphereGeometry(30000, 48, 32), new T.MeshBasicMaterial({ map: skyRT.texture, side: T.BackSide, depthWrite: false }));
    sphere.renderOrder = -2; sky.add(sphere);
    // étoiles de fond : champ illustratif, plus dense le long du plan galactique
    var N = cfg.stars, pos = new Float32Array(N * 3), col = new Float32Array(N * 3), size = new Float32Array(N);
    var v = new T.Vector3();
    for (var i = 0; i < N; i++) {
      do { v.set(Math.random() * 2 - 1, Math.random() * 2 - 1, Math.random() * 2 - 1); } while (v.lengthSq() > 1 || v.lengthSq() < .01);
      v.normalize();
      if (Math.random() < .45) { v.addScaledVector(gn, -v.dot(gn) * (.6 + Math.random() * .35)).normalize(); }
      pos[i * 3] = v.x * 28000; pos[i * 3 + 1] = v.y * 28000; pos[i * 3 + 2] = v.z * 28000;
      var b = .12 + .88 * Math.pow(Math.random(), 4.5), t = Math.random();
      var r = t < .5 ? .75 + t * .5 : 1, g = t < .5 ? .85 + t * .3 : 1 - (t - .5) * .3, bl = t < .5 ? 1 : 1 - (t - .5) * 1.1;
      col[i * 3] = r * b; col[i * 3 + 1] = g * b; col[i * 3 + 2] = bl * b;
      size[i] = 1 + 2.4 * Math.pow(Math.random(), 8);
    }
    var geo = new T.BufferGeometry();
    geo.setAttribute('position', new T.BufferAttribute(pos, 3));
    geo.setAttribute('aColor', new T.BufferAttribute(col, 3));
    geo.setAttribute('aSize', new T.BufferAttribute(size, 1));
    L.starUniforms = { uPR: { value: 1 } };
    var pts = new T.Points(geo, new T.ShaderMaterial({ uniforms: L.starUniforms, vertexShader: G.STAR_VERT, fragmentShader: G.STAR_FRAG, transparent: true, blending: T.AdditiveBlending, depthWrite: false }));
    pts.frustumCulled = false; pts.renderOrder = -1; sky.add(pts);
    return sky;
  }
  OBS.buildSky = buildSky;

  /* ---------- textures : chargées en arrière-plan, la scène s'affiche sans les attendre ---------- */
  var loader = new T.TextureLoader();
  function loadTex(file, cb) {
    loader.load('textures/' + file, function (tx) {
      tx.anisotropy = Math.min(4, (OBS.engine.renderer && OBS.engine.renderer.capabilities.getMaxAnisotropy()) || 1);
      cb(tx);
    }, undefined, function () { /* texture absente : on garde le rendu procédural */ });
  }

  function glowTexture(stops) {
    var c = document.createElement('canvas'); c.width = c.height = 256;
    var g = c.getContext('2d'), gr = g.createRadialGradient(128, 128, 0, 128, 128, 128);
    stops.forEach(function (s) { gr.addColorStop(s[0], s[1]); });
    g.fillStyle = gr; g.fillRect(0, 0, 256, 256);
    return new T.CanvasTexture(c);
  }
  function sprite(tex, size, op) {
    var sp = new T.Sprite(new T.SpriteMaterial({ map: tex, blending: T.AdditiveBlending, depthWrite: false, transparent: true, opacity: op || 1 }));
    sp.scale.set(size, size, 1); return sp;
  }
  var glowA = glowTexture([[0, 'rgba(255,238,205,0.85)'], [.16, 'rgba(255,185,105,0.4)'], [.4, 'rgba(255,125,50,0.12)'], [1, 'rgba(255,90,30,0)']]);
  var glowB = glowTexture([[0, 'rgba(255,170,90,0.28)'], [.3, 'rgba(255,120,50,0.10)'], [1, 'rgba(255,90,30,0)']]);
  var softTex = glowTexture([[0, 'rgba(255,255,255,1)'], [.35, 'rgba(255,255,255,0.35)'], [1, 'rgba(255,255,255,0)']]);
  L.glowTexture = glowTexture; L.softTex = softTex; L.glowA = glowA;

  /* ---------- matériaux ---------- */
  function C(h) { return new T.Color(h); }
  function planetMaterial(look, rScene) {
    var c = look.c || [0x888888, 0xaaaaaa, 0x666666, 0xcccccc];
    var u = {
      uType: { value: look.type === undefined ? 0 : look.type }, uScale: { value: look.scale || 1 }, uSeed: { value: look.seed || 0 }, uTime: { value: 0 },
      uRelief: { value: look.relief ? rScene * look.relief : 0 }, uClouds: { value: look.clouds || 0 },
      uBands: { value: look.bands || 6 }, uWarp: { value: look.warp || .05 }, uStorm: { value: look.storm || 0 },
      uStormLat: { value: look.stormLat === undefined ? -.3 : look.stormLat }, uStormLon: { value: look.stormLon || 1 },
      uIce: { value: look.ice || 0 }, uAtmoK: { value: look.atmoK || 0 }, uGloss: { value: look.gloss || 0 },
      uC0: { value: C(c[0]) }, uC1: { value: C(c[1]) }, uC2: { value: C(c[2]) }, uC3: { value: C(c[3]) }, uC4: { value: C(c[4] === undefined ? c[3] : c[4]) },
      uAtmo: { value: C(look.atmo || 0) }, uSun: { value: sunPos },
      uRingN: { value: new T.Vector3(0, 1, 0) }, uCenter: { value: new T.Vector3() }, uRing: { value: new T.Vector2(0, 0) }, uRadius: { value: rScene },
      uHasMap: { value: 0 }, uMap: { value: null }, uHasNight: { value: 0 }, uNight: { value: null }, uHasRingTex: { value: 0 }, uRingTex: { value: null },
      uHasNormal: { value: 0 }, uNormal: { value: null }, uNormalK: { value: 1 }, uGain: { value: look.gain || 1.35 }
    };
    return new T.ShaderMaterial({ uniforms: u, vertexShader: G.PLANET_VERT, fragmentShader: G.PLANET_FRAG, extensions: { derivatives: true } });
  }
  L.planetMaterial = planetMaterial;

  /* ---------- construction ---------- */
  var bodies = [], byId = {}, hitMeshes = [], sphereGeo, shellGeo, sunMesh, sunMat, sunGlowA, sunGlowB, belts = [], regionAnchors = [];
  var orbitGroup = new T.Group(); scene.add(orbitGroup);
  var builtJd = 0;

  /* latitude, longitude est (degrés) → point de la sphère unité, dans le repère de la carte (longitude 0 = +X, est = −Z) */
  function latLonObj(lat, lon, out) {
    var phi = Math.PI + lon * D2R, c = Math.cos(lat * D2R);
    return out.set(-Math.cos(phi) * c, Math.sin(lat * D2R), Math.sin(phi) * c);
  }
  var hdGeo = null;

  function phaseOf(id) { var h = 0; for (var i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) % 9973; return h / 9973 * TAU; }

  L.build = function (renderer, labelsContainer) {
    labelsEl = L.labelsEl = labelsContainer;
    sphereGeo = new T.SphereGeometry(1, cfg.seg[0], cfg.seg[1]);
    shellGeo = new T.SphereGeometry(1, 64, 48);
    L.sky = buildSky(renderer); scene.add(L.sky);

    // Soleil
    sunMat = new T.ShaderMaterial({ uniforms: { uTime: { value: 0 }, uTint: { value: new T.Vector3(1, .82, .6) }, uSpots: { value: 1 } }, vertexShader: G.SUN_VERT, fragmentShader: G.SUN_FRAG, extensions: { derivatives: true } });
    sunMesh = new T.Mesh(new T.SphereGeometry(SUN_R, cfg.seg[0], cfg.seg[1]), sunMat);
    scene.add(sunMesh);
    sunGlowA = sprite(glowA, SUN_R * 5.2); sunGlowB = sprite(glowB, SUN_R * 15);
    scene.add(sunGlowA); scene.add(sunGlowB);
    scene.add(new T.AmbientLight(0x1a2236, .5));
    scene.add(new T.PointLight(0xfff1dc, 1.6, 0));
    var sunHit = new T.Mesh(sphereGeo, new T.MeshBasicMaterial({ visible: false })); sunHit.scale.setScalar(SUN_R * 1.2); sunHit.userData.id = 'soleil';
    scene.add(sunHit); hitMeshes.push(sunHit);
    var sunBody = { id: 'soleil', def: OBS.byId.soleil, r: SUN_R, pos: new T.Vector3(), hit: sunHit, helio: { x: 0, y: 0, z: 0 } };
    bodies.push(sunBody); byId.soleil = sunBody;

    OBS.BODIES.forEach(function (d) { if (d.id !== 'soleil') makeBody(d); });
    makeBelts();
    OBS.REGIONS.forEach(function (rg) {
      var a = { id: rg.id, def: rg, r: 2, pos: new T.Vector3(), region: true };
      regionAnchors.push(a); byId[rg.id] = a; bodies.push(a);
    });
    bodies.forEach(makeLabel);
    bodies.forEach(function (P) { if (P.sites) P.sites.forEach(function (S) { makeSiteLabel(P, S); }); });
    rebuildOrbits(OBS.time.jd);
    buildCraft();

    controls = L.controls = new T.OrbitControls(camera, OBS.engine.canvas);
    controls.enableDamping = true; controls.dampingFactor = .08;
    controls.enablePan = true; controls.screenSpacePanning = true; controls.zoomSpeed = .9; controls.rotateSpeed = .6;
    controls.enabled = false;
    controls.addEventListener('start', function () { interacting = true; if (flight) { flight = null; } });
    controls.addEventListener('end', function () { interacting = false; });
    bindPointer();
    homeView(true);
  };

  function makeBody(d) {
    var par0 = d.moon && byId[d.parent];
    var r = par0 ? scale.moonRadius(d.rKm, par0.def.rKm, par0.r) : scale.radius(d.rKm);
    var holder = new T.Group(); scene.add(holder);
    var spin = new T.Group(); holder.add(spin);
    var mat = planetMaterial(d.look || {}, r);
    var mesh = new T.Mesh(sphereGeo, mat);
    mesh.scale.setScalar(r);
    if (d.stretch) mesh.scale.set(r * d.stretch[0], r * d.stretch[2], r * d.stretch[1]);
    spin.add(mesh);
    var P = { id: d.id, def: d, r: r, holder: holder, spin: spin, mesh: mesh, mat: mat, pos: new T.Vector3(), helio: { x: 0, y: 0, z: 0 }, pole: new T.Vector3(0, 1, 0), moonsOf: [] };
    var surf = OBS.SURFACE && OBS.SURFACE[d.id];
    if (surf && (surf.sites || surf.hd)) {                                         // surface détaillée : maillage plus fin, lieux remarquables
      if (!hdGeo) hdGeo = new T.SphereGeometry(1, cfg.seg[0] * 2, cfg.seg[1] * 2);
      mesh.geometry = hdGeo; P.surf = surf;
      P.sites = (surf.sites || []).map(function (sd) { return { def: sd, obj: latLonObj(sd.lat, sd.lon, new T.Vector3()), world: new T.Vector3(), nrm: new T.Vector3() }; });
    }
    if (d.tex) loadTex(d.tex, function (tx) { mat.uniforms.uMap.value = tx; mat.uniforms.uHasMap.value = 1; mat.uniforms.uRelief.value = 0; });   // pas de faux relief tiré des couleurs
    if (d.night) loadTex(d.night, function (tx) { mat.uniforms.uNight.value = tx; mat.uniforms.uHasNight.value = 1; });
    var look = d.look || {};
    if (look.shell) {
      var sm = new T.ShaderMaterial({ uniforms: { uAtmo: { value: C(look.atmo) }, uK: { value: look.shell.s }, uCmax: { value: Math.sqrt(1 - 1 / (look.shell.k * look.shell.k)) }, uSun: { value: sunPos } },
        vertexShader: G.ATMO_VERT, fragmentShader: G.ATMO_FRAG, side: T.BackSide, transparent: true, blending: T.AdditiveBlending, depthWrite: false });
      var shell = new T.Mesh(shellGeo, sm); shell.scale.setScalar(r * look.shell.k); holder.add(shell);
    }
    if (d.ring) {
      var rin = d.ring.inner / d.rKm, rout = d.ring.outer / d.rKm;
      var ringU = { uCenter: { value: new T.Vector3() }, uRingN: { value: new T.Vector3(0, 1, 0) }, uRadius: { value: r }, uIn: { value: rin * r }, uOut: { value: rout * r },
        uHasTex: { value: 0 }, uTex: { value: null }, uTint: { value: new T.Vector3().fromArray(d.ring.tint || [.8, .72, .6]) }, uAlphaK: { value: d.ring.alpha || .95 }, uSun: { value: sunPos } };
      var rm = new T.ShaderMaterial({ uniforms: ringU, vertexShader: G.RING_VERT, fragmentShader: G.RING_FRAG, side: T.DoubleSide, transparent: true, depthWrite: false });
      var ringMesh = new T.Mesh(new T.RingGeometry(rin * r, rout * r, 192, 2), rm);
      ringMesh.rotation.x = -Math.PI / 2;
      var ringFrame = new T.Group(); ringFrame.add(ringMesh); holder.add(ringFrame);
      P.ringFrame = ringFrame; P.ringMat = rm;
      mat.uniforms.uRing.value.set(rin, rout);
      if (d.ring.tex) loadTex(d.ring.tex, function (tx) { tx.wrapS = tx.wrapT = T.ClampToEdgeWrapping; ringU.uTex.value = tx; ringU.uHasTex.value = 1; mat.uniforms.uRingTex.value = tx; mat.uniforms.uHasRingTex.value = 1; });
    }
    if (d.comet) {
      P.tail = [makeTail(0x7fb4ff, .5), makeTail(0xffe2a8, .6)];
      P.coma = sprite(softTex, 1, 0); holder.add(P.coma);
    }
    var hit = new T.Mesh(sphereGeo, new T.MeshBasicMaterial({ visible: false }));
    hit.userData.id = d.id; holder.add(hit); P.hit = hit; hitMeshes.push(hit);
    bodies.push(P); byId[d.id] = P;
    if (d.moon && byId[d.parent]) byId[d.parent].moonsOf.push(P);
    if (d.orbit && !d.orbit.real) P.phase = phaseOf(d.id);
  }

  /* queue de comète (uniquement près du Soleil, dirigée à l'opposé) */
  var TAILN = 180;
  function makeTail(hex, size) {
    var g = new T.BufferGeometry(), pos = new Float32Array(TAILN * 3), col = new Float32Array(TAILN * 3), seed = [];
    for (var i = 0; i < TAILN; i++) seed.push({ s: Math.pow(Math.random(), 1.4), x: Math.random() - .5, y: Math.random() - .5, z: Math.random() - .5 });
    g.setAttribute('position', new T.BufferAttribute(pos, 3)); g.setAttribute('color', new T.BufferAttribute(col, 3));
    var pts = new T.Points(g, new T.PointsMaterial({ size: size, map: softTex, vertexColors: true, transparent: true, blending: T.AdditiveBlending, depthWrite: false, sizeAttenuation: true }));
    pts.frustumCulled = false; scene.add(pts);
    return { pts: pts, seed: seed, base: C(hex) };
  }
  function updateTail(tl, head, dir, len, curve, intensity) {
    var p = tl.pts.geometry.attributes.position, c = tl.pts.geometry.attributes.color;
    for (var i = 0; i < TAILN; i++) {
      var sd = tl.seed[i], s = sd.s, d = s * len, spread = .05 + s * len * .06;
      p.setXYZ(i, head.x + dir.x * d + sd.x * spread, head.y + dir.y * d + sd.y * spread + curve * s * s, head.z + dir.z * d + sd.z * spread);
      var f = Math.pow(1 - s, 1.6) * intensity; c.setXYZ(i, tl.base.r * f, tl.base.g * f, tl.base.b * f);
    }
    p.needsUpdate = true; c.needsUpdate = true;
    tl.pts.visible = intensity > .01;
  }

  /* ---------- ceintures : points répartis selon la structure réelle ---------- */
  function makeBelt(n, aMin, aMax, eMax, iSigma, colorFn, gaps) {
    var els = [], pos = new Float32Array(n * 3), col = new Float32Array(n * 3), size = new Float32Array(n);
    for (var k = 0; k < n; k++) {
      var a; do { a = aMin + Math.random() * (aMax - aMin); } while (gaps && gaps.some(function (g) { return Math.abs(a - g) < .025 && Math.random() < .85; }));
      var inc = Math.abs((Math.random() + Math.random() + Math.random() - 1.5) / 1.5) * iSigma;
      els.push({ a: a, e: Math.random() * eMax, i: inc, node: Math.random() * 360, peri: Math.random() * 360, M0: Math.random() * 360, n: 0.9856076686 / Math.pow(a, 1.5) });
      var c = colorFn(); col[k * 3] = c[0]; col[k * 3 + 1] = c[1]; col[k * 3 + 2] = c[2];
      size[k] = .35 + Math.pow(Math.random(), 3) * .9;
    }
    var g = new T.BufferGeometry();
    g.setAttribute('position', new T.BufferAttribute(pos, 3)); g.setAttribute('aColor', new T.BufferAttribute(col, 3)); g.setAttribute('aSize', new T.BufferAttribute(size, 1));
    var u = { uPR: { value: 1 }, uScaleH: { value: 500 } };
    var pts = new T.Points(g, new T.ShaderMaterial({ uniforms: u, vertexShader: G.DUST_VERT, fragmentShader: G.DUST_FRAG, transparent: true, blending: T.AdditiveBlending, depthWrite: false }));
    pts.frustumCulled = false; scene.add(pts);
    var B = { pts: pts, els: els, u: u, every: aMin > 10 ? 12 : 2, tick: 0 };
    belts.push(B); return B;
  }
  function makeBelts() {
    makeBelt(cfg.dust, 2.1, 3.3, .2, 14, function () { var t = .32 + Math.random() * .3; return [t, t * .93, t * .84]; }, [2.50, 2.82, 2.95]);
    makeBelt(cfg.kuiper, 39.0, 48.5, .12, 22, function () { var t = .35 + Math.random() * .35; return Math.random() < .25 ? [t, t * .74, t * .6] : [t * .82, t * .9, t]; });
  }
  var elTmp = {};
  function updateBelts(jd, force) {
    belts.forEach(function (B) {
      if (!force && (B.tick++ % B.every)) return;
      var p = B.pts.geometry.attributes.position;
      for (var k = 0; k < B.els.length; k++) {
        var e = B.els[k], M = ((e.M0 + e.n * (jd - A.J2000)) % 360) * D2R;
        A.fromElements(e, A.solveKepler(M, e.e), elTmp);
        toScene(elTmp, tmp); p.setXYZ(k, tmp.x, tmp.y, tmp.z);
      }
      p.needsUpdate = true;
    });
  }

  /* ---------- orbites ---------- */
  function rebuildOrbits(jd) {
    builtJd = jd;
    while (orbitGroup.children.length) { var o = orbitGroup.children.pop(); o.geometry.dispose(); o.material.dispose(); }
    bodies.forEach(function (P) {
      if (!P.def || P.def.moon || P.region || P.id === 'soleil' || !A.hasOrbit(P.id)) return;
      var path = A.orbitPath(P.id, jd, P.def.comet ? 720 : 360), pts = path.map(function (v) { return toScene(v, new T.Vector3()); });
      var color = P.def.comet ? 0x9fd0ff : P.def.dwarf ? 0x9aa6d8 : 0x8fa4ff;
      var m = new T.LineBasicMaterial({ color: color, transparent: true, opacity: .14, depthWrite: false });
      var line = new T.Line(new T.BufferGeometry().setFromPoints(pts), m);
      line.userData.id = P.id; orbitGroup.add(line); P.line = line; P.lineBase = P.def.dwarf || P.def.comet ? .08 : .15;
    });
    // orbites des lunes : cercles dans le plan équatorial de la planète (visibles quand on est près d'elle)
    bodies.forEach(function (P) {
      if (!P.def || !P.def.moon) return;
      var parent = byId[P.def.parent], d = scale.moonDist(parent.r, P.def.orbit.aKm, parent.def.rKm), pts = [];
      for (var i = 0; i <= 128; i++) { var t = i / 128 * TAU; pts.push(new T.Vector3(Math.cos(t) * d, 0, Math.sin(t) * d)); }
      var m = new T.LineBasicMaterial({ color: 0xaab6e8, transparent: true, opacity: 0, depthWrite: false });
      var line = new T.Line(new T.BufferGeometry().setFromPoints(pts), m);
      line.userData.moon = true; orbitGroup.add(line); P.line = line; P.lineBase = .16; P.moonRing = true;
    });
  }

  /* ---------- étiquettes ---------- */
  function makeLabel(P) {
    var d = P.def, el = document.createElement('button');
    el.type = 'button';
    el.className = 'lbl' + (d.moon ? ' is-moon' : '') + (d.dwarf ? ' is-dwarf' : '') + (P.region ? ' is-region' : '') + (d.comet ? ' is-comet' : '') + (P.id === 'soleil' ? ' is-sun' : '');
    el.innerHTML = '<span class="dot"></span><span class="nm">' + (d.short || d.name) + '</span>';
    el.setAttribute('aria-label', d.name + ' — ' + (d.kind || ''));
    el.addEventListener('click', function (e) { e.stopPropagation(); clickBody(P.id); });
    el.addEventListener('pointerenter', function () { hover = P.id; });
    el.addEventListener('pointerleave', function () { if (hover === P.id) hover = null; });
    labelsEl.appendChild(el); P.el = el;
  }

  /* ---------- surfaces détaillées : cartes chargées à l'approche ---------- */
  function loadHD(P) {
    if (P.hdState) return; P.hdState = 'loading';
    var H2 = P.surf.hd || {}, eco = OBS.perf.tier === 'eco';
    if (!eco && H2.map) loadTex(H2.map, function (tx) { P.mat.uniforms.uMap.value = tx; P.mat.uniforms.uHasMap.value = 1; });
    var rel = eco ? (H2.reliefEco || H2.relief) : H2.relief;
    if (rel) loadTex(rel, function (tx) { P.mat.uniforms.uNormal.value = tx; P.mat.uniforms.uHasNormal.value = 1; P.hdState = 'ok'; OBS.emit('hd', P.id); });
    if (H2.altitude) fetch('textures/' + H2.altitude + '.json').then(function (r) { return r.json(); }).then(function (m) {
      return fetch('textures/' + H2.altitude + '.bin').then(function (r) { return r.arrayBuffer(); }).then(function (b) { P.alt = { w: m.w, h: m.h, data: new Int16Array(b) }; });
    }).catch(function () {});
  }
  function siteWorld(P, S) {
    S.world.copy(S.obj).applyMatrix4(P.mesh.matrixWorld);
    S.nrm.copy(S.world).sub(P.pos).normalize();
    return S.world;
  }
  function altitudeAt(P, lat, lon) {                    // altitude (km) lue sur la carte réduite de l'altimétrie
    var A2 = P.alt; if (!A2) return null;
    var x = ((lon + 180) / 360 * A2.w - .5 + A2.w) % A2.w, y = Math.max(0, Math.min(A2.h - 1.001, (90 - lat) / 180 * A2.h - .5));
    var x0 = Math.floor(x), y0 = Math.floor(y), fx = x - x0, fy = y - y0, x1 = (x0 + 1) % A2.w;
    function v(xx, yy) { return A2.data[yy * A2.w + xx]; }
    return ((v(x0, y0) * (1 - fx) + v(x1, y0) * fx) * (1 - fy) + (v(x0, y0 + 1) * (1 - fx) + v(x1, y0 + 1) * fx) * fy) / 1000;
  }

  function makeSiteLabel(P, S) {
    var d = S.def, el = document.createElement('button'); el.type = 'button';
    el.className = 'lbl is-site t-' + d.type + ' hid';
    el.innerHTML = '<span class="dot"></span><span class="nm">' + OBS.esc(d.name) + '</span>';
    el.setAttribute('aria-label', d.name + ' — ' + (OBS.SITE_TYPES[d.type] || ''));
    el.addEventListener('click', function (e) { e.stopPropagation(); L.site(P.id, d.id); });
    labelsEl.appendChild(el); S.el = el;
  }

  /* ---------- sélection et vols de caméra ---------- */
  var selected = null, hover = null, flight = null, interacting = false, lastSel = new T.Vector3(), release = 0;
  var siteSel = null, siteFlight = null, lastSite = new T.Vector3(), qPrev = new T.Quaternion(), qNow = new T.Quaternion(), qInv = new T.Quaternion();
  var showOrbits = true, labelMode = 'all';
  /* vue « système » d'une planète à lunes : la planète et toutes ses lunes à l'écran */
  function sysDist(P) {
    var m = 0;
    P.moonsOf.forEach(function (M) { m = Math.max(m, scale.moonDist(P.r, M.def.orbit.aKm, P.def.rKm) + M.r); });
    var half = Math.tan(camera.fov * D2R / 2) * Math.min(1, camera.aspect);
    return Math.max(m * 1.25 / half, P.r * 6);
  }
  function selDist(P) {
    if (P.craft) {                                         // engin : on le montre avec l'astre qu'il entoure, sinon avec un peu de sa trajectoire
      var hP = P.host && byId[P.host];
      return (hP ? Math.max(P.pos.distanceTo(hP.pos) * 3.2 + hP.r * 2, 1.2) : 14) * Math.max(1, .95 / camera.aspect);
    }
    if (sysView && P.moonsOf && P.moonsOf.length) return sysDist(P) * Math.max(1, .95 / camera.aspect);
    var d = P.id === 'soleil' ? SUN_R * 4.5 : P.region ? 60 : Math.max(P.r * (P.def.ring ? 6.5 : 4.2), P.def.moon ? .9 : 2.2);
    return d * Math.max(1, .95 / camera.aspect);           // écran étroit (téléphone) : on recule un peu pour voir l'objet entier
  }
  function homeDist() { return (scale.mode === 'reelle' ? 2600 : 520) / Math.max(.55, Math.min(1.4, camera.aspect)); }
  function homeCam(out) { var el = 24 * D2R, d = homeDist(); return out.set(0, Math.sin(el), Math.cos(el)).multiplyScalar(d); }
  function homeView(instant) {
    if (instant) { homeCam(camera.position); controls.target.set(0, 0, 0); camera.lookAt(0, 0, 0); }
  }
  function startFlight(id) {
    flight = { t: 0, dur: id ? 2.4 : 2.0, id: id, fromOff: camera.position.clone().sub(controls.target), fromTgt: controls.target.clone() };
    controls.enabled = false;
  }
  function ease(k) { return k < .5 ? 4 * k * k * k : 1 - Math.pow(-2 * k + 2, 3) / 2; }

  L.select = function (id, opts) {
    opts = opts || {};
    if (id && !byId[id]) return;
    var Pn = id ? byId[id] : null;
    // premier clic sur une planète à lunes : vue d'ensemble de son système ; second clic : la planète de près
    sysView = !!(Pn && Pn.moonsOf && Pn.moonsOf.length && !opts.close);
    selected = id || null;
    release = 0; siteSel = null; siteFlight = null;
    pendingFly = null;
    if (Pn && Pn.craft && !Pn.on) { pendingFly = id; flight = null; controls.enabled = true; }   // pas (encore) de position : on attend sans bouger
    else startFlight(selected);
    if (opts.instant && flight) flight.t = flight.dur;
    var P = selected ? byId[selected] : null;
    controls.minDistance = P ? Math.max(P.r * (P.surf ? 1.06 : 1.35), .05) : 8;
    OBS.emit('select', { level: 'systeme', id: selected });
    OBS.emit('crumbs');
  };
  L.focus = function (id) { L.select(id); };
  L.sysView = function () { return sysView; };
  L.hasMoons = function (id) { var P = byId[id]; return !!(P && P.moonsOf && P.moonsOf.length); };
  // clic sur un astre : nouvel astre → on y va ; astre déjà choisi en vue système → on s'approche
  function clickBody(id) { if (!id) return; if (id !== selected) L.select(id); else if (sysView) L.select(id, { close: true }); }

  /* un lieu de la surface : la caméra descend au-dessus, puis le suit pendant que l'astre tourne */
  L.site = function (bodyId, siteId, opts) {
    var P = byId[bodyId]; if (!P || !P.sites) return;
    var S = P.sites.filter(function (x) { return x.def.id === siteId; })[0]; if (!S) return;
    if (selected !== bodyId) { selected = bodyId; release = 0; lastSel.copy(P.pos); }
    flight = null; loadHD(P);
    siteSel = { P: P, S: S };
    P.mesh.updateMatrixWorld(); siteWorld(P, S);
    siteFlight = { t: 0, dur: opts && opts.instant ? .01 : 2.2, fromOff: camera.position.clone().sub(controls.target), fromTgt: controls.target.clone() };
    controls.enabled = false; controls.minDistance = P.r * .05;
    OBS.emit('select', { level: 'systeme', id: bodyId, site: siteId });
    OBS.emit('crumbs');
  };
  L.siteSelected = function () { return siteSel ? siteSel.S.def.id : null; };
  /* prochain lever du Soleil sur un lieu (Soleil à plus de 10° : les reliefs sont bien dessinés) */
  L.nextSunrise = function (bodyId, siteId) {
    var P = byId[bodyId]; if (!P || !P.sites) return null;
    var S = P.sites.filter(function (x) { return x.def.id === siteId; })[0]; if (!S) return null;
    var d = P.def, per = d.rot ? 360 / Math.abs(d.rot.Wd) : d.orbit ? d.orbit.P : d.spinH ? d.spinH / 24 : 1;
    var step = Math.max(per / 200, 1 / 288), jd0 = OBS.time.jd, found = null;
    for (var i = 1; i <= 1600 && !found; i++) {
      var jd = jd0 + i * step;
      place(jd, jd); P.holder.updateMatrixWorld(true); siteWorld(P, S);
      if (S.nrm.dot(tmp.copy(P.pos).negate().normalize()) > Math.sin(10 * D2R)) found = jd;
    }
    place(jd0, OBS.time.jdSpin); lastJd = null;
    return found;
  };
  L.siteInfo = function (bodyId, siteId) {
    var P = byId[bodyId]; if (!P || !P.sites) return null;
    var S = P.sites.filter(function (x) { return x.def.id === siteId; })[0]; if (!S) return null;
    P.mesh.updateMatrixWorld(); siteWorld(P, S);
    var sd = tmp.copy(P.pos).negate().normalize(), out = { sun: Math.asin(Math.max(-1, Math.min(1, S.nrm.dot(sd)))) / D2R };
    var par = P.def.moon && P.def.parent && byId[P.def.parent];   // planète mère, vue depuis une lune synchrone
    if (par && par.pos) { var pd = tmp2.copy(par.pos).sub(P.pos).normalize(); out.parent = Math.asin(Math.max(-1, Math.min(1, S.nrm.dot(pd)))) / D2R; out.parentName = par.def.name; }
    out.alt = altitudeAt(P, S.def.lat, S.def.lon);
    return out;
  };
  L.selected = function () { return selected; };
  L.get = function (id) { return byId[id]; };

  function stepCamera(dt) {
    var P = selected ? byId[selected] : null;
    if (siteFlight || siteSel) {
      var SP = siteSel.P, S = siteSel.S;
      SP.holder.updateMatrixWorld(true); siteWorld(SP, S);
      if (siteFlight) {
        siteFlight.t += dt;
        var ks = Math.min(1, siteFlight.t / siteFlight.dur), es = ease(ks);
        // altitude d'arrivée : le lieu bien visible sans trop agrandir les données (un pixel de la carte ≈ 3 à 4 pixels d'écran) ;
        // on peut ensuite descendre plus bas, l'image devient alors floue plutôt que d'inventer des détails
        var big = S.def.d ? Math.max(.3, Math.min(1.2, 7 * S.def.d / SP.def.rKm)) : .3;
        var dToS = SP.r * big * Math.max(1, .95 / camera.aspect), dFromS = Math.max(siteFlight.fromOff.length(), .001);
        var fromDir = tmp2.copy(siteFlight.fromOff).normalize();
        var endDir = tmp.copy(S.nrm).addScaledVector(fromDir, .3).normalize();
        fromDir.lerp(endDir, es).normalize();
        controls.target.lerpVectors(siteFlight.fromTgt, S.world, es);
        camera.position.copy(controls.target).addScaledVector(fromDir, Math.exp(Math.log(dFromS) * (1 - es) + Math.log(dToS) * es));
        if (ks >= 1) { siteFlight = null; controls.enabled = true; lastSite.copy(S.world); lastSel.copy(SP.pos); SP.spin.getWorldQuaternion(qPrev); }
      } else {
        // la caméra tourne avec la surface : elle reste au-dessus du lieu même quand l'astre tourne (ou que le temps saute)
        SP.spin.getWorldQuaternion(qNow);
        tmp.copy(camera.position).sub(lastSite).applyQuaternion(qInv.copy(qPrev).invert()).applyQuaternion(qNow);
        controls.target.copy(S.world); camera.position.copy(S.world).add(tmp);
        qPrev.copy(qNow); lastSite.copy(S.world); lastSel.copy(SP.pos);
        if (!interacting && camera.position.distanceTo(SP.pos) > SP.r * 4) {    // on s'éloigne : retour à l'astre entier
          siteSel = null; controls.minDistance = SP.r * 1.06; flight = null;
          OBS.emit('select', { level: 'systeme', id: SP.id, soft: true }); OBS.emit('crumbs');
        }
      }
      return;
    }
    if (flight) {
      flight.t += dt;
      var k = Math.min(1, flight.t / flight.dur), e = ease(k);
      var tgt = flight.id ? byId[flight.id].pos : tmp3.set(0, 0, 0);
      var dTo = flight.id ? selDist(byId[flight.id]) : homeDist(), dFrom = Math.max(flight.fromOff.length(), .01);
      var dir = tmp2.copy(flight.fromOff).normalize();
      if (!flight.id) dir.lerp(homeCam(tmp).normalize(), e).normalize();     // retour : on revient aussi à l'angle de vue d'ensemble
      controls.target.lerpVectors(flight.fromTgt, tgt, e);
      camera.position.copy(controls.target).addScaledVector(dir, Math.exp(Math.log(dFrom) * (1 - e) + Math.log(dTo) * e));
      if (k >= 1) { flight = null; controls.enabled = true; if (P) lastSel.copy(P.pos); }
    } else if (P && !(P.craft && (!P.on || pendingFly))) {
      tmp.copy(P.pos).sub(lastSel); camera.position.add(tmp); controls.target.add(tmp); lastSel.copy(P.pos);
      // zoom arrière loin de l'objet : on le quitte en douceur (on remonte d'un niveau)
      var dist = camera.position.distanceTo(P.pos), out = P.region ? 400 : Math.max(P.r * 90, P.def.moon ? 30 : 70);
      if (!interacting && dist > out) up();
    }
  }
  function up() {
    var P = byId[selected], parent = P && P.def && P.def.moon ? P.def.parent : null;
    selected = parent; release = parent ? 0 : 1.6; siteSel = null; siteFlight = null;
    controls.minDistance = parent ? byId[parent].r * (byId[parent].surf ? 1.06 : 1.35) : 8;
    if (parent) lastSel.copy(byId[parent].pos);
    OBS.emit('select', { level: 'systeme', id: selected, soft: true });
    OBS.emit('crumbs');
  }

  /* ---------- pointeur ---------- */
  var ray = new T.Raycaster(), ndc = new T.Vector2(), down = { x: 0, y: 0 }, pointer = { x: 0, y: 0, in: false, dirty: false };
  function pick(cx, cy) {
    var r = OBS.engine.canvas.getBoundingClientRect();
    ndc.set(((cx - r.left) / r.width) * 2 - 1, -((cy - r.top) / r.height) * 2 + 1);
    ray.setFromCamera(ndc, camera);
    var hits = ray.intersectObjects(hitMeshes.filter(function (m) { return m.visible; }), false);
    // zones de clic élargies pour les petites lunes : un astre réellement touché (son vrai disque) passe avant elles
    for (var i = 0; i < hits.length; i++) { var Q = byId[hits[i].object.userData.id]; if (Q && Q.r && ray.ray.distanceToPoint(Q.pos) <= Q.r * 1.02) return Q.id; }
    return hits.length ? hits[0].object.userData.id : null;
  }
  function bindPointer() {
    var cv = OBS.engine.canvas;
    cv.addEventListener('pointermove', function (e) { if (OBS.engine.level !== L) return; pointer.x = e.clientX; pointer.y = e.clientY; pointer.in = true; pointer.dirty = true; });
    cv.addEventListener('pointerleave', function () { pointer.in = false; if (OBS.engine.level === L) { hover = null; cv.classList.remove('over'); } });
    cv.addEventListener('pointerdown', function (e) { down.x = e.clientX; down.y = e.clientY; });
    cv.addEventListener('contextmenu', function (e) { e.preventDefault(); });
    cv.addEventListener('pointerup', function (e) {
      if (OBS.engine.level !== L || e.button !== 0 || Math.hypot(e.clientX - down.x, e.clientY - down.y) > 6) return;
      var id = pick(e.clientX, e.clientY); clickBody(id);   // clic sur l'astre déjà choisi : on reste où l'on est (lieu compris)
    });
    cv.addEventListener('dblclick', function () { if (OBS.engine.level === L && selected) L.select(null); });
    // zoom arrière au maximum de la vue d'ensemble : on sort du système vers le voisinage stellaire.
    // Il faut un geste volontaire : arriver en butée ne suffit pas (l'élan d'un pavé tactile ne fait que montrer l'indice),
    // il faut relancer la molette après une courte pause, puis insister.
    var atMaxSince = 0, lastWheel = 0, armed = false, push = 0;
    cv.addEventListener('wheel', function (e) {
      if (OBS.engine.level !== L || selected || flight) return;
      var now = performance.now(), gap = now - lastWheel; lastWheel = now;
      var d = camera.position.distanceTo(controls.target);
      if (e.deltaY <= 0 || d < controls.maxDistance * .97) { atMaxSince = 0; armed = false; push = 0; return; }
      if (!atMaxSince) { atMaxSince = now; OBS.emit('edge', 0); return; }
      if (!armed) { if (gap > 300 && now - atMaxSince > 500) { armed = true; push = 0; } else { OBS.emit('edge', 0); return; } }
      if (++push >= 5) { push = 0; armed = false; atMaxSince = 0; OBS.engine.go('voisinage', { from: 'systeme' }); }
      else OBS.emit('edge', push / 5);
    }, { passive: true });
  }

  /* ---------- placement des objets à la date ---------- */
  var Xs = new T.Vector3(), Ys = new T.Vector3(), Zs = new T.Vector3(), m4 = new T.Matrix4();
  function orient(P, jdSpin) {
    var d = P.def;
    if (d.rot) {
      var ax = A.bodyAxes(d.rot, jdSpin);
      Ys.set(ax.pole.x, ax.pole.z, -ax.pole.y).normalize();
      Xs.set(ax.prime.x, ax.prime.z, -ax.prime.y).normalize();
      P.pole.copy(Ys);
    } else if (d.lock && byId[d.parent]) {
      var par = byId[d.parent];
      Xs.copy(par.pos).sub(P.pos).normalize();
      Ys.copy(par.pole).addScaledVector(Xs, -par.pole.dot(Xs)).normalize();
      P.pole.copy(Ys);
    } else {
      var ang = (jdSpin * 24 / (d.spinH || 24)) % 1 * TAU;
      Ys.set(0, 1, 0); Xs.set(Math.cos(ang), 0, -Math.sin(ang)); P.pole.copy(Ys);
    }
    Zs.crossVectors(Xs, Ys);
    m4.makeBasis(Xs, Ys, Zs); P.spin.quaternion.setFromRotationMatrix(m4);
    if (P.ringFrame) { P.ringFrame.quaternion.setFromUnitVectors(tmp.set(0, 1, 0), P.pole); }
  }

  var N = new T.Vector3(), Mv = new T.Vector3();
  function place(jd, jdSpin) {
    bodies.forEach(function (P) {
      var d = P.def; if (!d || P.id === 'soleil') return;
      if (P.region) { var au = d.au, lon = d.lonDeg * D2R; toScene({ x: au * Math.cos(lon), y: au * Math.sin(lon), z: 0 }, P.pos); return; }
      if (d.moon || P.craft) return;
      A.helio(P.id, jd, P.helio); toScene(P.helio, P.pos); P.holder.position.copy(P.pos);
    });
    bodies.forEach(function (P) {
      var d = P.def; if (!d || !d.moon) return;
      var par = byId[d.parent], dist = scale.moonDist(par.r, d.orbit.aKm, par.def.rKm);
      if (d.orbit.real === 'moon') {
        A.moonGeo(jd, ecl); dirToScene(ecl, tmp); P.realKm = Math.sqrt(ecl.x * ecl.x + ecl.y * ecl.y + ecl.z * ecl.z);
        P.pos.copy(par.pos).addScaledVector(tmp, dist);
        // plan réel de l'orbite (≈ 5° de l'écliptique) : normale tirée de deux positions à un quart de mois d'écart
        A.moonGeo(jd + 6.8, ecl2); dirToScene(ecl2, tmp2);
        P.ringN = (P.ringN || new T.Vector3()).crossVectors(tmp, tmp2).normalize();
        P.helio.x = par.helio.x + ecl.x / A.AU_KM; P.helio.y = par.helio.y + ecl.y / A.AU_KM; P.helio.z = par.helio.z + ecl.z / A.AU_KM;
      } else {
        var th = P.phase + TAU * (jd - A.J2000) / d.orbit.P * (d.orbit.retro ? -1 : 1);
        N.set(0, 0, 1).cross(par.pole); if (N.lengthSq() < 1e-6) N.set(1, 0, 0); N.normalize(); Mv.crossVectors(par.pole, N);
        tmp.copy(N).multiplyScalar(Math.cos(th)).addScaledVector(Mv, Math.sin(th));   // sens direct autour du pôle
        P.pos.copy(par.pos).addScaledVector(tmp, dist);
        P.helio.x = par.helio.x; P.helio.y = par.helio.y; P.helio.z = par.helio.z; P.realKm = d.orbit.aKm;
      }
      P.holder.position.copy(P.pos);
    });
    // orientation (après positions : les lunes synchrones regardent leur planète)
    bodies.forEach(function (P) { if (P.spin && !P.def.moon) orient(P, jdSpin); });
    bodies.forEach(function (P) { if (P.spin && P.def.moon) orient(P, jdSpin); });
    placeCraft(jd);
  }


  /* ======================================================================
     Engins spatiaux (sondes, stations, vaisseaux) — positions JPL Horizons
     Deux sortes de données (voir tools/missions.py) :
       v : positions à pas régulier (UA autour du Soleil, km autour d'un astre), interpolées ;
       e : éléments orbitaux osculateurs, propagés (orbite de Kepler) depuis l'époque la plus proche.
     Un engin n'est affiché que si les données couvrent la date : sinon, rien.
     Près d'un astre, il est placé par rapport à lui avec la même compression que les lunes
     (distance réelle jusqu'à 2,5 rayons, puis logarithmique) : l'ISS rase la Terre, Webb est au-delà de la Lune.
     ====================================================================== */
  var pendingFly = null;
  var crafts = [], craftData = null, showCraft = true, craftLoading = false;
  // rayon (km) dans lequel un engin est placé par rapport à un astre plutôt qu'au Soleil (au-delà de 2× : transition)
  var ZONE = { mercure: 4e5, venus: 1.5e6, terre: 3e6, lune: 6.6e4, mars: 1.5e6, jupiter: 5e7, saturne: 5e7, uranus: 3e7, neptune: 5e7 };
  var HOSTS = ['mercure', 'venus', 'terre', 'mars', 'jupiter', 'saturne', 'uranus', 'neptune'];
  var markTex = (function () {
    var c = document.createElement('canvas'); c.width = c.height = 64; var g = c.getContext('2d');
    g.translate(32, 32); g.rotate(Math.PI / 4);
    g.shadowColor = 'rgba(120,235,215,0.9)'; g.shadowBlur = 10;
    g.strokeStyle = 'rgba(150,245,225,1)'; g.lineWidth = 5; g.strokeRect(-12, -12, 24, 24);
    g.fillStyle = 'rgba(150,245,225,0.35)'; g.fillRect(-12, -12, 24, 24);
    return new T.CanvasTexture(c);
  })();
  function buildCraft() {
    (OBS.CRAFT || []).forEach(function (d) {
      var holder = new T.Group(); scene.add(holder); holder.visible = false;
      var mk = new T.Sprite(new T.SpriteMaterial({ map: markTex, sizeAttenuation: false, transparent: true, depthWrite: false }));
      mk.scale.set(.016, .016, 1); mk.renderOrder = 3; holder.add(mk);
      var P = { id: d.id, def: d, craft: true, r: .012, holder: holder, mark: mk, pos: new T.Vector3(), helio: { x: 0, y: 0, z: 0 }, on: false, host: null, rel: new T.Vector3() };
      var hit = new T.Mesh(sphereGeo, new T.MeshBasicMaterial({ visible: false })); hit.userData.id = d.id; holder.add(hit); P.hit = hit; hitMeshes.push(hit);
      bodies.push(P); byId[d.id] = P; crafts.push(P); makeLabel(P);
      P.el.classList.add('is-craft');
    });
    loadCraft();
  }
  function loadCraft() {
    if (craftData || craftLoading || !showCraft) return; craftLoading = true;
    fetch('data/missions.json').then(function (r) { return r.json(); }).then(function (j) {
      craftData = j; crafts.forEach(function (P) { P.data = j.craft[P.id] || null; });
      lastJd = null; OBS.emit('craft', j);
    }).catch(function () { craftLoading = false; });
  }
  L.setCraft = function (on) { showCraft = on; if (on) loadCraft(); lastJd = null; if (!on && selected && byId[selected].craft) L.select(null); };
  L.craftShown = function () { return showCraft; };
  L.craftData = function () { return craftData; };

  /* position dans le repère d'un segment à la date jd, ou null si la date n'est pas couverte */
  function segState(S, jd, out) {
    if (jd < S.from || jd > S.to) return null;
    if (S.k === 'v') {
      var f = (jd - S.jd0) / S.dt, i = Math.floor(f), n = S.n, p = S.p;
      if (i < 0 || i > n - 1 || (i === n - 1 && f > i + 1e-6)) return null;
      if (i === n - 1) { out.x = p[i * 3]; out.y = p[i * 3 + 1]; out.z = p[i * 3 + 2]; return out; }
      var t = f - i, i0 = Math.max(0, i - 1), i3 = Math.min(n - 1, i + 2);
      var t2 = t * t, t3 = t2 * t;                                // Catmull-Rom : passe par les points du JPL
      var a = -.5 * t3 + t2 - .5 * t, b = 1.5 * t3 - 2.5 * t2 + 1, c = -1.5 * t3 + 2 * t2 + .5 * t, d = .5 * t3 - .5 * t2;
      if (i0 === i) { a = 0; b = 1 - t; c = t; d = 0; }          // aux extrémités : linéaire
      if (i3 === i + 1) { a = 0; b = 1 - t; c = t; d = 0; }
      out.x = a * p[i0 * 3] + b * p[i * 3] + c * p[(i + 1) * 3] + d * p[i3 * 3];
      out.y = a * p[i0 * 3 + 1] + b * p[i * 3 + 1] + c * p[(i + 1) * 3 + 1] + d * p[i3 * 3 + 1];
      out.z = a * p[i0 * 3 + 2] + b * p[i * 3 + 2] + c * p[(i + 1) * 3 + 2] + d * p[i3 * 3 + 2];
      return out;
    }
    var E = S.e, lo = 0, hi = E.length - 1;                       // époque la plus proche (recherche dichotomique)
    if (!E.length) return null;
    while (hi - lo > 1) { var mid = (lo + hi) >> 1; if (E[mid][0] <= jd) lo = mid; else hi = mid; }
    var e = Math.abs(E[hi][0] - jd) < Math.abs(E[lo][0] - jd) ? E[hi] : E[lo];
    var step = E.length > 1 ? E[1][0] - E[0][0] : 1;
    if (Math.abs(e[0] - jd) > step * .75) return null;
    return keplerState(e, jd, out);
  }
  function keplerState(e, jd, out) {                              // [jd, e, q (km), i, Ω, ω, Tp, n (°/j)] → position (km)
    var ec = e[1], q = e[2], M = (e[7] * (jd - e[6])) * D2R, x, y;
    if (ec < 1) {
      var a = q / (1 - ec); M = M % TAU; if (M > Math.PI) M -= TAU; if (M < -Math.PI) M += TAU;
      var E2 = ec < .8 ? M : Math.PI * (M < 0 ? -1 : 1);
      for (var k = 0; k < 30; k++) { var dE = (E2 - ec * Math.sin(E2) - M) / (1 - ec * Math.cos(E2)); E2 -= dE; if (Math.abs(dE) < 1e-12) break; }
      x = a * (Math.cos(E2) - ec); y = a * Math.sqrt(1 - ec * ec) * Math.sin(E2);
    } else {
      var ah = q / (ec - 1), H2 = Math.asinh(M / ec);
      for (var k2 = 0; k2 < 40; k2++) { var dH = (ec * Math.sinh(H2) - H2 - M) / (ec * Math.cosh(H2) - 1); H2 -= dH; if (Math.abs(dH) < 1e-12) break; }
      x = ah * (ec - Math.cosh(H2)); y = ah * Math.sqrt(ec * ec - 1) * Math.sinh(H2);
    }
    var O = e[4] * D2R, w = e[5] * D2R, i = e[3] * D2R, cO = Math.cos(O), sO = Math.sin(O), cw = Math.cos(w), sw = Math.sin(w), ci = Math.cos(i), si = Math.sin(i);
    out.x = (cO * cw - sO * sw * ci) * x + (-cO * sw - sO * cw * ci) * y;
    out.y = (sO * cw + cO * sw * ci) * x + (-sO * sw + cO * cw * ci) * y;
    out.z = (sw * si) * x + (cw * si) * y;
    return out;
  }
  /* position à l'écran autour d'un astre : direction réelle, distance compressée comme pour les lunes */
  function hostDisplay(H, v, out) {
    var dk = Math.sqrt(v.x * v.x + v.y * v.y + v.z * v.z);
    if (dk < 1e-6) return out.copy(H.pos);
    dirToScene(v, out); return out.multiplyScalar(scale.moonDist(H.r, Math.max(dk, H.def.rKm * 1.0005), H.def.rKm)).add(H.pos);
  }
  function smooth01(x) { x = Math.max(0, Math.min(1, x)); return x * x * (3 - 2 * x); }
  var cs = { x: 0, y: 0, z: 0 }, cs2 = { x: 0, y: 0, z: 0 }, relv = { x: 0, y: 0, z: 0 }, dH = new T.Vector3(), dP = new T.Vector3(), dM = new T.Vector3();
  function placeCraft(jd) {
    crafts.forEach(function (P) {
      var on = false, data = P.data;
      P.host = null;
      if (showCraft && data) {
        var sun = null, planet = null, moonS = null;
        data.segs.forEach(function (S) {
          var o = S.c === 'soleil' ? cs : S.c === 'lune' ? cs2 : relv;
          if (!segState(S, jd, o)) return;
          if (S.c === 'soleil') sun = o; else if (S.c === 'lune') moonS = o; else planet = { c: S.c, v: o };
        });
        var AUK = A.AU_KM;
        if (planet || sun || moonS) {
          on = true;
          var Hp = null, hv = null, w = 1, h = P.helio;
          if (planet) {                                            // repère d'une planète (ou de la Terre)
            Hp = byId[planet.c]; hv = planet.v;
            h.x = Hp.helio.x + hv.x / AUK; h.y = Hp.helio.y + hv.y / AUK; h.z = Hp.helio.z + hv.z / AUK;
            if (sun && ZONE[planet.c]) w = smooth01(2 - Math.sqrt(hv.x * hv.x + hv.y * hv.y + hv.z * hv.z) / ZONE[planet.c]);   // encore loin de la planète : repère du Soleil
          } else if (sun) {                                        // autour du Soleil : près d'une planète, on bascule dans son repère
            h.x = sun.x; h.y = sun.y; h.z = sun.z;
            var best = null, bd = Infinity;
            HOSTS.forEach(function (id) {
              var Q = byId[id]; if (!Q) return;
              var dx = (sun.x - Q.helio.x) * AUK, dy = (sun.y - Q.helio.y) * AUK, dz = (sun.z - Q.helio.z) * AUK, dd = Math.sqrt(dx * dx + dy * dy + dz * dz);
              if (dd < 2 * ZONE[id] && dd / ZONE[id] < bd) { bd = dd / ZONE[id]; best = Q; relv.x = dx; relv.y = dy; relv.z = dz; }
            });
            if (best) { Hp = best; hv = relv; w = smooth01(2 - bd); }
          } else {                                                 // repère de la Lune seulement (orbiteurs lunaires)
            var Lu = byId.lune; h.x = Lu.helio.x + moonS.x / AUK; h.y = Lu.helio.y + moonS.y / AUK; h.z = Lu.helio.z + moonS.z / AUK;
          }
          if (sun) toScene(sun, dH); else dH.set(0, 0, 0);
          if (Hp) { hostDisplay(Hp, hv, dP); P.pos.copy(sun ? dH.lerp(dP, w) : dP); P.host = w > .5 ? Hp.id : null; }
          else P.pos.copy(dH);
          if (moonS) {                                             // près de la Lune : placé par rapport à elle
            var Lm = byId.lune, dm = Math.sqrt(moonS.x * moonS.x + moonS.y * moonS.y + moonS.z * moonS.z), wm = (planet || sun) ? smooth01(2 - dm / ZONE.lune) : 1;
            if (wm > 0) { hostDisplay(Lm, moonS, dM); P.pos.lerp(dM, wm); if (wm > .5) P.host = 'lune'; }
          }
          if (P.def.host && !P.host) P.host = P.def.host;
        }
      }
      P.on = on; P.holder.position.copy(P.pos);
      if (!on && P.path) P.path.visible = false;
    });
    if (pendingFly && byId[pendingFly].on && selected === pendingFly) { startFlight(pendingFly); pendingFly = null; }
  }
  function craftLive(P) {
    var out = { craft: true, on: P.on };
    var d = P.data;
    if (d) { var c0 = Infinity, c1 = -Infinity; d.segs.forEach(function (S) { c0 = Math.min(c0, S.from); c1 = Math.max(c1, S.to); }); out.from = c0; out.to = c1; }
    if (!P.on) return out;
    var h = P.helio, E = byId.terre.helio;
    out.sun = Math.sqrt(h.x * h.x + h.y * h.y + h.z * h.z);
    var dx = h.x - E.x, dy = h.y - E.y, dz = h.z - E.z; out.earth = Math.sqrt(dx * dx + dy * dy + dz * dz);
    // distance à l'astre le plus proche, quand l'engin est dans son repère (km, valeur du JPL)
    var jd = OBS.time.jd, best = null;
    d.segs.forEach(function (S) {
      if (S.c === 'soleil') return; var o = segState(S, jd, {}); if (!o) return;
      var dk = Math.sqrt(o.x * o.x + o.y * o.y + o.z * o.z);
      if (!best || (S.c === 'lune' && dk < ZONE.lune * 2)) best = { c: S.c, km: dk };
    });
    if (best) { out.hostKm = best.km; out.hostName = byId[best.c].def.name; out.hostR = byId[best.c].def.rKm; }
    // vitesse : différence de position sur une minute (héliocentrique, ou par rapport à l'astre)
    var sp = speedOf(P, jd); if (sp) { out.speed = sp.v; out.speedRef = sp.ref; }
    return out;
  }
  function speedOf(P, jd) {
    var dt = 60 / 86400, a = {}, b = {}, pick2 = null;
    P.data.segs.forEach(function (S) { if (!pick2 && S.c !== 'soleil' && segState(S, jd, a) && segState(S, jd + dt, b)) pick2 = S; });
    if (!pick2) P.data.segs.forEach(function (S) { if (!pick2 && segState(S, jd, a) && segState(S, jd + dt, b)) pick2 = S; });
    if (!pick2) return null;
    var k = pick2.c === 'soleil' ? A.AU_KM : 1, dx = (b.x - a.x) * k, dy = (b.y - a.y) * k, dz = (b.z - a.z) * k;
    return { v: Math.sqrt(dx * dx + dy * dy + dz * dz) / 60, ref: pick2.c === 'soleil' ? 'par rapport au Soleil' : 'par rapport à ' + (pick2.c === 'terre' || pick2.c === 'lune' ? 'la ' : '') + byId[pick2.c].def.name };
  }
  /* trajectoire de l'engin choisi : chemin du JPL autour du Soleil, ou orbite autour de son astre */
  var pathMat = new T.LineBasicMaterial({ color: 0x8ff0dc, transparent: true, opacity: .4, depthWrite: false });
  function updateCraftPaths() {
    crafts.forEach(function (P) {
      var want = P.on && (P.id === selected || P.id === hover);
      if (!want) { if (P.path) P.path.visible = false; return; }
      var jd = OBS.time.jd, S = null;
      P.data.segs.forEach(function (s) { if (jd >= s.from && jd <= s.to && (!S || (S.c === 'soleil' && s.c !== 'soleil' && s.c !== 'lune'))) S = s; });
      if (!S) return;
      // autour d'un astre, on ne trace qu'une fenêtre autour de la date (sinon des mois d'orbites s'empilent)
      var win = S.k === 'v' && S.c !== 'soleil' ? Math.max(10, 60 * S.dt) : 0;
      var key = S.k === 'e' ? S.c + Math.round((jd - S.e[0][0]) / ((S.e[1] || S.e[0])[0] - S.e[0][0] || 1)) : S.c + S.from + scale.mode + (win ? ':' + Math.floor(jd / (win / 4)) : '');
      if (P.pathKey !== key) {
        if (P.path) { scene.remove(P.path); P.path.geometry.dispose(); }
        var pts = [], o = {};
        if (S.k === 'v') {
          var stepN = Math.max(1, Math.floor(S.n / 3000));
          var SL = S.c === 'terre' && P.data.segs.filter(function (x) { return x.c === 'lune' && x.k === 'v'; })[0], om = {}, ml = new T.Vector3(), Lm = byId.lune;
          var i0 = 0, i1 = S.n;
          if (win) { i0 = Math.max(0, Math.floor((jd - win - S.jd0) / S.dt)); i1 = Math.min(S.n, Math.ceil((jd + win - S.jd0) / S.dt) + 1); stepN = Math.max(1, Math.floor((i1 - i0) / 3000)); }
          for (var i = i0; i < i1; i += stepN) {
            o.x = S.p[i * 3]; o.y = S.p[i * 3 + 1]; o.z = S.p[i * 3 + 2];
            if (S.c === 'soleil') { pts.push(toScene(o, new T.Vector3())); continue; }
            var q = hostDisplay(byId[S.c], o, new T.Vector3()).sub(byId[S.c].pos), tj = S.jd0 + i * S.dt;
            if (SL && segState(SL, tj, om)) {                       // près de la Lune : même placement que le repère, Lune à sa position de l'instant
              var dmk = Math.sqrt(om.x * om.x + om.y * om.y + om.z * om.z), wq = smooth01(2 - dmk / ZONE.lune);
              if (wq > 0) {
                A.moonGeo(tj, ecl); dirToScene(ecl, ml).multiplyScalar(scale.moonDist(byId.terre.r, Lm.def.orbit.aKm, byId.terre.def.rKm));
                ml.add(hostDisplay(Lm, om, tmp2).sub(Lm.pos)); q.lerp(ml, wq);
              }
            }
            pts.push(q);
          }
        } else {                                                   // orbite osculatrice du moment
          var e = null; segState(S, jd, o);
          S.e.forEach(function (x) { if (!e || Math.abs(x[0] - jd) < Math.abs(e[0] - jd)) e = x; });
          var per = e[1] < 1 ? 360 / e[7] : 2;
          for (var j = 0; j <= 180; j++) { keplerState(e, e[6] + (e[1] < 1 ? per * j / 180 : (j - 90) / 90 * per), o); pts.push(hostDisplay(byId[S.c], o, new T.Vector3()).sub(byId[S.c].pos)); }
        }
        P.path = new T.Line(new T.BufferGeometry().setFromPoints(pts), pathMat); P.path.frustumCulled = false;
        P.path.userData.rel = S.c !== 'soleil' ? S.c : null; scene.add(P.path); P.pathKey = key;
      }
      P.path.visible = true;
      if (P.path.userData.rel) P.path.position.copy(byId[P.path.userData.rel].pos); else P.path.position.set(0, 0, 0);
    });
  }

  /* ---------- API d'affichage ---------- */
  L.setScale = function (mode) {
    if (mode === scale.mode) return;
    scale.mode = mode;
    rebuildOrbits(OBS.time.jd); place(OBS.time.jd, OBS.time.jdSpin); updateBelts(OBS.time.jd, true);
    controls.maxDistance = homeDist() * 2.4;
    if (selected) { lastSel.copy(byId[selected].pos); startFlight(selected); } else startFlight(null);
    OBS.emit('scale', mode);
  };
  L.setOrbits = function (on) { showOrbits = on; };
  L.setLabels = function (m) { labelMode = m; };

  /* Informations calculées en direct pour la console */
  L.live = function (id) {
    var P = byId[id]; if (!P || !P.def || P.region) return null;
    if (P.craft) return craftLive(P);
    var out = {};
    var h = P.helio, rs = Math.sqrt(h.x * h.x + h.y * h.y + h.z * h.z);
    var E = byId.terre.helio, dx = h.x - E.x, dy = h.y - E.y, dz = h.z - E.z, re = Math.sqrt(dx * dx + dy * dy + dz * dz);
    if (id === 'soleil') { out.earth = re; return out; }
    if (P.def.moon) { out.parentKm = P.realKm; out.parent = byId[P.def.parent].def.name; if (id === 'lune') out.earthKm = P.realKm; else out.earth = re; return out; }
    out.sun = rs; if (id !== 'terre') out.earth = re;
    var el = A.elements(id, OBS.time.jd); if (el) out.el = el;
    return out;
  };

  /* fil d'Ariane */
  L.crumbs = function () {
    var c = [{ label: 'Système solaire', act: function () { L.select(null); } }];
    var P = selected ? byId[selected] : null;
    if (P && P.craft && P.host) { var hh = P.host, hp = byId[hh].def; if (hp.moon) c.push({ label: byId[hp.parent].def.name, act: function () { L.select(hp.parent); } }); c.push({ label: hp.name, act: function () { L.select(hh); } }); }
    if (P && P.def && P.def.moon) { var par = P.def.parent; c.push({ label: byId[par].def.name, act: function () { L.select(par); } }); }
    if (P && siteSel) { var bid = P.id; c.push({ label: P.def.name, act: function () { L.select(bid); } }); c.push({ label: siteSel.S.def.name, current: true }); }
    else if (P) c.push({ label: P.def.name, current: true });
    else c[0].current = true;
    return c;
  };

  /* ---------- niveau : entrée, sortie ---------- */
  L.enter = function (opts) {
    L._outward = 0;
    controls.enabled = true;
    controls.maxDistance = homeDist() * 2.4;
    if (opts.from === 'voisinage') {                   // on revient de l'extérieur : arrivée en plongée vers le Soleil
      camera.position.copy(homeCam(tmp)).multiplyScalar(2.3); controls.target.set(0, 0, 0);
      selected = null; startFlight(null);
    } else if (opts.focus) { L.select(opts.focus, { instant: !!opts.instant }); }
    OBS.emit('crumbs');
  };
  L.leave = function () { controls.enabled = false; };
  L.leaveAnim = function () { flight = null; controls.enabled = false; L._outward = 1; };

  L.resize = function (w, h, pr) {
    W = w; H = h; PR = pr; camera.aspect = W / H; camera.updateProjectionMatrix();
    if (L.starUniforms) L.starUniforms.uPR.value = PR;
    belts.forEach(function (B) { B.u.uPR.value = PR; B.u.uScaleH.value = H / (2 * tanHalf); });
    if (controls) controls.maxDistance = homeDist() * 2.4;
  };

  /* ---------- boucle ---------- */
  var lastJd = null, v3 = new T.Vector3(), camSpace = new T.Vector3(), sunDir = new T.Vector3();
  L.update = function (dt, now) {
    var jd = OBS.time.jd, jdSpin = OBS.time.jdSpin;
    if (Math.abs(jd - builtJd) > 18262) rebuildOrbits(jd);
    if (jd !== lastJd) { place(jd, jdSpin); updateBelts(jd, lastJd === null); lastJd = jd; }
    var simT = now / 1000;
    sunMat.uniforms.uTime.value = simT;
    bodies.forEach(function (P) { if (P.mat) P.mat.uniforms.uTime.value = simT; });

    if (L._outward) {                               // sortie vers le voisinage : la caméra s'éloigne
      camera.position.multiplyScalar(1 + dt * 2.6);
    }
    stepCamera(dt);
    if (release > 0) {                              // après avoir quitté un objet : la cible revient doucement au Soleil
      release -= dt; controls.target.multiplyScalar(Math.max(0, 1 - dt * 2.2));
    }
    controls.update();
    // ne jamais passer sous la surface d'un astre détaillé
    var focusB = siteSel ? siteSel.P : (selected ? byId[selected] : null);
    if (focusB && focusB.surf) {
      var dc = camera.position.distanceTo(focusB.pos);
      if (dc < focusB.r * 1.015) camera.position.sub(focusB.pos).setLength(focusB.r * 1.015).add(focusB.pos);
    }
    // plan de coupure proche adapté à l'altitude de la caméra (sinon la surface serait tranchée de près)
    var near = .02;
    if (focusB && focusB.r) near = Math.max(.0004, Math.min(.02, (camera.position.distanceTo(focusB.pos) - focusB.r) * .3));
    if (Math.abs(camera.near - near) > near * .05) { camera.near = near; camera.updateProjectionMatrix(); }
    L.sky.position.copy(camera.position);
    bodies.forEach(function (P) { if (P.surf && !P.hdState && P.rPx > 110) loadHD(P); });

    // anneaux et ombres
    bodies.forEach(function (P) {
      if (!P.ringMat) return;
      P.ringMat.uniforms.uCenter.value.copy(P.pos); P.ringMat.uniforms.uRingN.value.copy(P.pole);
      P.mat.uniforms.uCenter.value.copy(P.pos); P.mat.uniforms.uRingN.value.copy(P.pole);
    });

    // comète : queue seulement près du Soleil
    var hal = byId.halley;
    if (hal && hal.tail) {
      var rau = Math.sqrt(hal.helio.x * hal.helio.x + hal.helio.y * hal.helio.y + hal.helio.z * hal.helio.z);
      var inten = Math.max(0, Math.min(1, (4 - rau) / 3));
      sunDir.copy(hal.pos).normalize();
      var len = 30 * inten;
      updateTail(hal.tail[0], hal.pos, sunDir, len, 0, inten);
      updateTail(hal.tail[1], hal.pos, sunDir, len * .7, len * .08, inten * .8);
      hal.coma.material.opacity = inten * .8; hal.coma.scale.setScalar(.6 + 3 * inten);
    }

    // survol
    if (pointer.dirty && pointer.in && !flight) {
      pointer.dirty = false; var hid = pick(pointer.x, pointer.y);
      if (hid !== hover) hover = hid;
      OBS.engine.canvas.classList.toggle('over', !!hid);
    }

    // tailles minimales cliquables, opacité des orbites
    var focusSys = selected ? (byId[selected].def && byId[selected].def.moon ? byId[selected].def.parent : selected) : null;
    bodies.forEach(function (P) {
      var dist = camera.position.distanceTo(P.pos);
      P.rPx = (P.r || 1) / (dist * tanHalf) * (H / 2);
      if (P.hit && P.id !== 'soleil') {
        P.hit.scale.setScalar(P.r * Math.max(1.3, 14 / Math.max(P.rPx, .5)));
        P.hit.visible = !P.def.moon || P.def.parent === focusSys || (byId[P.def.parent].rPx > 18);
        if (P.craft) {                                     // un engin autour d'un astre lointain : caché tant que l'astre n'est qu'un point
          var hb = P.host && byId[P.host], hostSys = hb && (hb.def.moon ? hb.def.parent : hb.id);
          P.shown = P.on && (P.id === selected || !hb || hb.rPx > 6 || hostSys === focusSys);
          P.holder.visible = P.shown; P.hit.visible = P.shown;
        }
      }
      if (P.line) {
        var tgt;
        if (P.moonRing) tgt = showOrbits && (P.def.parent === focusSys || byId[P.def.parent].rPx > 22) ? P.lineBase : 0;
        else tgt = (hover === P.id || selected === P.id) ? .55 : (showOrbits ? P.lineBase : 0);
        P.line.material.opacity += (tgt - P.line.material.opacity) * .12;
        P.line.visible = P.line.material.opacity > .004;
        if (P.moonRing && P.line.visible) { var par = byId[P.def.parent]; P.line.position.copy(par.pos); P.line.quaternion.setFromUnitVectors(tmp.set(0, 1, 0), P.ringN || par.pole); }
      }
    });
    belts.forEach(function (B) { B.pts.visible = labelMode !== 'none' || true; });
    updateCraftPaths();

    layoutLabels(focusSys);
  };

  /* ---------- étiquettes des lieux de la surface ---------- */
  var camDir = new T.Vector3();
  function layoutSites() {
    bodies.forEach(function (P) {
      if (!P.sites) return;
      var active = (selected === P.id || (siteSel && siteSel.P === P)) && P.rPx > 90 && labelMode !== 'none';
      if (active) P.holder.updateMatrixWorld(true);
      var list = [];
      P.sites.forEach(function (S) {
        var el = S.el, d = S.def, isSel = siteSel && siteSel.S === S;
        if (!active) { if (!el.classList.contains('hid')) { el.classList.add('hid'); el.style.opacity = ''; } return; }
        siteWorld(P, S);
        camDir.copy(camera.position).sub(S.world).normalize();
        var facing = S.nrm.dot(camDir);
        var px = d.d ? d.d / P.def.rKm * P.rPx : 0;                 // taille apparente du lieu à l'écran
        var show = facing > .1 || (isSel && facing > -.05);
        if ((d.type === 'cratere' || d.type === 'montagne') && px < 7 && d.d > 0 && !isSel) show = false;   // trop petit pour être lu à cette distance
        if (d.type === 'site' && P.rPx < 170 && !isSel) show = false;
        v3.copy(S.world).project(camera);
        var x = (v3.x * .5 + .5) * W, y = (-v3.y * .5 + .5) * H;
        if (x < -40 || x > W + 40 || y < TOPZONE || y > H - 20) show = false;
        var big = d.type === 'mer' || d.type === 'bassin' || d.type === 'region' || d.type === 'lac' || d.type === 'calotte';
        var pri = isSel ? 2000 : (big ? 300 : d.type === 'site' || d.type === 'base' ? 260 : d.type === 'montagne' || d.type === 'volcan' || d.type === 'canyon' ? 240 : d.type === 'extreme' ? 200 : 150) + Math.min(px, 200) + facing * 50;
        list.push({ S: S, el: el, x: x, y: y, show: show, pri: pri, isSel: isSel, facing: facing });
      });
      list.sort(function (a, b) { return b.pri - a.pri; });
      list.forEach(function (it) {
        var el = it.el;
        if (!it.show) { if (!el.classList.contains('hid')) { el.classList.add('hid'); el.style.opacity = ''; } return; }
        if (!el._w) { el._w = el.offsetWidth || 80; el._h = el.offsetHeight || 20; }
        var box = { l: it.x + 8, t: it.y - el._h / 2, r: it.x + 8 + el._w, b: it.y + el._h / 2 };
        var clash = occupied.some(function (o) { return box.l < o.r + 3 && box.r + 3 > o.l && box.t < o.b + 1 && box.b + 1 > o.t; });
        if (clash && !it.isSel) { el.classList.add('hid'); el.style.opacity = ''; return; }
        occupied.push(box);
        el.classList.remove('hid');
        el.style.transform = 'translate(' + it.x.toFixed(1) + 'px,' + it.y.toFixed(1) + 'px)';
        el.style.setProperty('--off', '9px');
        el.style.opacity = Math.min(1, .35 + it.facing * 1.6).toFixed(2);
        el.classList.toggle('active', it.isSel);
      });
    });
  }

  /* ---------- placement des étiquettes, sans chevauchement ---------- */
  var occupied = [], TOPZONE = 96;   // sous la barre du haut et le fil d'Ariane
  function layoutLabels(focusSys) {
    camera.updateMatrixWorld();
    var items = [];
    var sunScreen = v3.set(0, 0, 0).project(camera), sx = (sunScreen.x * .5 + .5) * W, sy = (-sunScreen.y * .5 + .5) * H;
    var sunPx = SUN_R / (camera.position.length() * tanHalf) * (H / 2);
    bodies.forEach(function (P) {
      var el = P.el; if (!el) return;
      var d = P.def, show = true;
      if (labelMode === 'none') show = false;
      if (d.moon) show = show && (d.parent === focusSys || byId[d.parent].rPx > 26);
      if (P.region) show = show && labelMode === 'all' && !selected;
      if ((d.dwarf || d.comet) && labelMode === 'planetes') show = selected === P.id;
      if (P.craft) show = P.shown && labelMode !== 'none' && (selected === P.id || hover === P.id || (labelMode === 'all' && (P.host ? byId[P.host].rPx > 30 || P.host === focusSys || (byId[P.host].def.moon && byId[P.host].def.parent === focusSys && byId[P.host].rPx > 8) : !selected)));
      camSpace.copy(P.pos).applyMatrix4(camera.matrixWorldInverse);
      if (camSpace.z > 0) show = false;
      v3.copy(P.pos).project(camera);
      var x = (v3.x * .5 + .5) * W, y = (-v3.y * .5 + .5) * H;
      if (x < -60 || x > W + 60 || y < -40 || y > H + 40) show = false;
      if (show && P.id !== 'soleil' && camera.position.distanceTo(P.pos) > camera.position.length() && Math.hypot(sx - x, sy - y) < sunPx) show = false;   // caché derrière le Soleil
      if (show) { P._sx = x; P._sy = y; P._cd = -camSpace.z; }
      var pri = (P.id === selected ? 1000 : P.id === hover ? 500 : 0) + (P.id === 'soleil' ? 120 : P.id === 'terre' ? 115 : d.moon ? 20 : P.craft ? 15 : d.dwarf || d.comet ? 40 : P.region ? 10 : 100) + Math.min(60, P.rPx || 0);
      items.push({ P: P, el: el, x: x, y: y, show: show, pri: pri });
    });
    // caché derrière un astre plus proche qui occupe de la place à l'écran (une lune derrière sa planète…)
    var big = items.filter(function (it) { return it.show && it.P.rPx > 24 && !it.P.region; });
    items.forEach(function (it) {
      if (!it.show) return;
      for (var i = 0; i < big.length; i++) {
        var o = big[i].P; if (o === it.P) continue;
        if (it.P._cd > o._cd && Math.hypot(it.x - o._sx, it.y - o._sy) < o.rPx * .98) { it.show = false; break; }
      }
    });
    items.sort(function (a, b) { return b.pri - a.pri; });
    occupied.length = 0;
    items.forEach(function (it) {
      var el = it.el, P = it.P;
      if (!it.show) { if (!el.classList.contains('hid')) el.classList.add('hid'); return; }
      if (((P.rPx || 0) > 150 || (P.id === selected && (P.rPx || 0) > 60)) && P.id !== 'soleil') { el.classList.add('hid'); return; }   // l'objet remplit l'écran : la console porte déjà son nom
      var off = Math.max(P.rPx || 4, 4) + 6;
      if (!el._w) { el._w = el.offsetWidth || 80; el._h = el.offsetHeight || 22; }
      var bx = it.x + off, by = it.y - el._h / 2, box = { l: bx, t: by, r: bx + el._w, b: by + el._h };
      var clash = box.t < TOPZONE || occupied.some(function (o) { return box.l < o.r + 4 && box.r + 4 > o.l && box.t < o.b + 2 && box.b + 2 > o.t; });
      var keep = !clash || (P.id === selected && box.t >= TOPZONE);
      el.classList.toggle('hid', !keep);
      if (!keep) return;
      occupied.push(box);
      el.style.transform = 'translate(' + it.x.toFixed(1) + 'px,' + it.y.toFixed(1) + 'px)';
      el.style.setProperty('--off', off.toFixed(1) + 'px');
      el.classList.toggle('active', P.id === selected);
      el.classList.toggle('hov', P.id === hover);
      el.classList.toggle('dim', !!selected && P.id !== selected && !(P.def.moon && P.def.parent === selected));
    });
    layoutSites();
  }
})();

/* ======================================================================
   OBSERVATOIRE — mini-scènes 3D des bandeaux de catégorie
   Les bandeaux (js/ui/bands.js) ont un dessin SVG de secours ; quand WebGL est disponible, chacun reçoit
   une petite scène three.js animée : galaxie en nuage de points, étoile à surface bouillonnante, planète
   éclairée avec anneaux, comète et sa queue de particules, rochers qui tournent, trou noir et son disque…

   Un seul moteur WebGL partagé dessine tour à tour chaque bandeau visible dans son propre <canvas> 2D
   (les navigateurs limitent le nombre de contextes WebGL). Seuls les bandeaux à l'écran sont animés,
   à 30 images/s au plus ; rien ne tourne quand la page est fermée ou l'onglet caché ; une seule image fixe
   si l'appareil demande moins de mouvement. Ce sont des illustrations : rien n'y est à l'échelle.
   ====================================================================== */
(function () {
  'use strict';
  var OBS = window.OBS = window.OBS || {}, T = window.THREE;
  if (!T) return;
  var reduced = false; try { reduced = matchMedia('(prefers-reduced-motion: reduce)').matches; } catch (e) {}
  var frameN = 0, R = null, items = [], visible = new Set(), io = null, raf = 0, lastT = 0;

  function renderer() {
    if (R) return R;
    try {
      var c = document.createElement('canvas');
      R = new T.WebGLRenderer({ canvas: c, alpha: true, antialias: true, premultipliedAlpha: true, powerPreference: 'low-power' });
      R.setClearColor(0x000000, 0);
    } catch (e) { R = false; }
    return R;
  }
  function rnd(seed) { var s = seed >>> 0 || 1; return function () { s = (s * 1664525 + 1013904223) >>> 0; return s / 4294967296; }; }

  /* ---------- matériaux communs ---------- */
  var VP = 'attribute float size; attribute vec3 color; varying vec3 vC; uniform float uScale; void main(){ vC = color; vec4 mv = modelViewMatrix * vec4(position,1.0); gl_PointSize = size * uScale * 5.0 / -mv.z; gl_Position = projectionMatrix * mv; }';
  var FP = 'varying vec3 vC; uniform float uAlpha; void main(){ vec2 d = gl_PointCoord - .5; float r = length(d) * 2.0; if (r > 1.0) discard; float a = pow(1.0 - r, 1.8) * uAlpha; float mx = max(max(vC.r, vC.g), max(vC.b, .001)); gl_FragColor = vec4(vC / mx, a * mx); }';
  function points(pos, col, size, alpha) {
    var g = new T.BufferGeometry();
    g.setAttribute('position', new T.Float32BufferAttribute(pos, 3));
    g.setAttribute('color', new T.Float32BufferAttribute(col, 3));
    g.setAttribute('size', new T.Float32BufferAttribute(size, 1));
    return new T.Points(g, new T.ShaderMaterial({ uniforms: { uScale: { value: 300 }, uAlpha: { value: alpha == null ? 1 : alpha } }, vertexShader: VP, fragmentShader: FP, transparent: true, depthWrite: false, blending: T.AdditiveBlending }));
  }
  function glow(color, size, op) {
    var m = OBS.system && OBS.system.glowMesh ? OBS.system.glowMesh([[0, 1], [.2, .45], [.55, .1], [1, 0]], color, op == null ? 1 : op) : new T.Object3D();
    m.scale.setScalar(size); return m;
  }
  var NOISE = 'float h(vec3 p){ p = fract(p * .3183099 + .1); p *= 17.0; return fract(p.x * p.y * p.z * (p.x + p.y + p.z)); }' +
    'float n(vec3 x){ vec3 i = floor(x), f = fract(x); f = f * f * (3.0 - 2.0 * f); return mix(mix(mix(h(i), h(i + vec3(1,0,0)), f.x), mix(h(i + vec3(0,1,0)), h(i + vec3(1,1,0)), f.x), f.y), mix(mix(h(i + vec3(0,0,1)), h(i + vec3(1,0,1)), f.x), mix(h(i + vec3(0,1,1)), h(i + vec3(1,1,1)), f.x), f.y), f.z); }' +
    'float fbm(vec3 p){ float v = 0.0, a = .5; for (int k = 0; k < 5; k++) { v += a * n(p); p *= 2.03; a *= .5; } return v; }';
  // sphère à surface procédurale : mode 0 étoile (granulation), 1 bandes (géante), 2 roche (cratères), éclairée par uL
  function sphere(r, mode, c1, c2, c3, seed) {
    var mat = new T.ShaderMaterial({
      uniforms: { uT: { value: 0 }, uMode: { value: mode }, c1: { value: new T.Color(c1) }, c2: { value: new T.Color(c2) }, c3: { value: new T.Color(c3) }, uL: { value: new T.Vector3(-1, .4, .8).normalize() }, uSeed: { value: seed || 1 } },
      vertexShader: 'varying vec3 vN; varying vec3 vP; varying vec3 vV; void main(){ vP = position; vN = normalize(normalMatrix * normal); vec4 mv = modelViewMatrix * vec4(position,1.0); vV = normalize(-mv.xyz); gl_Position = projectionMatrix * mv; }',
      fragmentShader: 'uniform float uT; uniform int uMode; uniform vec3 c1; uniform vec3 c2; uniform vec3 c3; uniform vec3 uL; uniform float uSeed; varying vec3 vN; varying vec3 vP; varying vec3 vV;' + NOISE +
        'void main(){ vec3 p = normalize(vP); float fr = 1.0 - max(dot(vN, vV), 0.0); vec3 col;' +
        ' if (uMode == 0) { float g = fbm(p * 6.0 + vec3(uT * .15, uT * .1, uSeed)); col = mix(c2, c1, smoothstep(.35, .75, g)); col *= 1.0 - .45 * pow(fr, 1.5); col += c3 * pow(fr, 3.0) * .6; gl_FragColor = vec4(col, 1.0); return; }' +
        ' float d = max(dot(vN, uL), 0.0); float lit = smoothstep(-.05, .35, d) * (.25 + .75 * d) + .04;' +
        ' if (uMode == 1) { float b = p.y * 7.0 + fbm(p * 3.0 + uSeed) * 2.2; col = mix(c1, c2, .5 + .5 * sin(b)); col = mix(col, c3, smoothstep(.55, .9, fbm(p * 9.0 + uSeed)) * .35); }' +
        ' else { float g = fbm(p * 4.0 + uSeed); col = mix(c2, c1, g); float cr = smoothstep(.62, .7, fbm(p * 11.0 + uSeed * 2.0)); col *= 1.0 - cr * .35; }' +
        ' col *= lit; col += c1 * pow(fr, 4.0) * .15 * smoothstep(0.0, .4, d); gl_FragColor = vec4(col, 1.0); }'
    });
    var m = new T.Mesh(new T.SphereGeometry(r, 48, 32), mat); m.userData.mat = mat; return m;
  }
  function rock(r, seed, col) {
    var g = new T.IcosahedronGeometry(r, 2), p = g.attributes.position, v = new T.Vector3(), rr = rnd(seed);
    var bumps = []; for (var k = 0; k < 7; k++) bumps.push([new T.Vector3(rr() - .5, rr() - .5, rr() - .5).normalize(), .15 + rr() * .3]);
    for (var i = 0; i < p.count; i++) {
      v.fromBufferAttribute(p, i); var u = v.clone().normalize(), f = 1;
      bumps.forEach(function (b) { f -= b[1] * Math.max(0, u.dot(b[0]) - .55) * 1.6; });
      f *= .9 + .2 * ((Math.sin(u.x * 9 + seed) + Math.sin(u.y * 7) + Math.sin(u.z * 11)) / 3);
      v.multiplyScalar(f); p.setXYZ(i, v.x, v.y * .8, v.z);
    }
    g.computeVertexNormals();
    return new T.Mesh(g, new T.MeshStandardMaterial({ color: col, roughness: 1, metalness: 0, flatShading: true }));
  }

  /* ---------- scènes : chacune renvoie { scene, cam, tick(t) } ; l'objet principal est vers x > 0 ---------- */
  function base(fov) {
    var s = new T.Scene(), c = new T.PerspectiveCamera(6, 4, 1, 400); c.position.set(0, 0, 50);   // téléobjectif : pas de déformation sur le côté du bandeau
    return { scene: s, cam: c, tick: function () {} };
  }
  var S = {};
  S.galaxie = function () {
    var o = base(), r = rnd(7), pos = [], col = [], size = [], N = 9000;
    for (var k = 0; k < N; k++) {
      var arm = k % 2, t = Math.pow(r(), .8), ang = arm * Math.PI + t * 7.5 + (r() - .5) * .5 * (1.1 - t), rad = .15 + t * 2.4 + (r() - .5) * .25;
      var core = r() < .22; if (core) { rad = Math.pow(r(), 2) * .7; ang = r() * 6.28; }
      pos.push(Math.cos(ang) * rad, (r() - .5) * (core ? .3 : .08), Math.sin(ang) * rad);
      var w = core ? 1 : Math.max(0, 1 - t * 1.3), c = core || r() < .3 ? [1, .86, .62] : [.62, .72, 1];
      if (!core && r() < .05) c = [1, .55, .7];
      col.push(c[0] * (.4 + w * .6), c[1] * (.4 + w * .6), c[2] * (.4 + w * .6)); size.push(core ? 9 + r() * 10 : 5 + r() * 9);
    }
    var g = new T.Group(); g.add(points(pos, col, size, .5)); g.add(glow(0xffe2b0, 2.2, .9));
    g.rotation.set(1.05, 0, -.35); var holder = new T.Group(); holder.add(g); o.scene.add(holder); holder.position.x = 2.6;
    o.tick = function (t) { g.rotation.y = -t * .06; }; return o;
  };
  S.etoile = function () {
    var o = base(), st = sphere(1.15, 0, 0xfff1c8, 0xff9a2e, 0xffd27a, 3); st.position.x = 2.8; o.scene.add(st);
    var gl = glow(0xffc070, 5.4, .9); gl.position.copy(st.position); o.scene.add(gl);
    o.tick = function (t) { st.userData.mat.uniforms.uT.value = t; st.rotation.y = t * .05; gl.scale.setScalar(5.4 + Math.sin(t * .8) * .15); }; return o;
  };
  S.naine = function () {
    var o = base(), a = sphere(.8, 0, 0xffb08a, 0xc23a1c, 0xff6a3a, 5), b = sphere(.28, 0, 0xffffff, 0xbcd2ff, 0xcfe0ff, 9);
    a.position.set(2.2, -.1, 0); b.position.set(3.9, .5, 0); o.scene.add(a, b);
    var g1 = glow(0xff6a3a, 3.4, .8), g2 = glow(0xcfe0ff, 1.6, .9); g1.position.copy(a.position); g2.position.copy(b.position); o.scene.add(g1, g2);
    o.tick = function (t) { a.userData.mat.uniforms.uT.value = t; b.userData.mat.uniforms.uT.value = t * 2; b.position.set(3.1 + Math.cos(t * .3) * .9, .3 + Math.sin(t * .3) * .25, Math.sin(t * .3)); g2.position.copy(b.position); }; return o;
  };
  S.planete = function () {
    var o = base(), p = sphere(.95, 1, 0xf0d6a2, 0xb98a50, 0xfff2d8, 2), grp = new T.Group();
    grp.add(p);
    var ring = new T.Mesh(new T.RingGeometry(1.25, 2.1, 96, 1), new T.ShaderMaterial({
      side: T.DoubleSide, transparent: true, depthWrite: false,
      vertexShader: 'varying vec3 vP; void main(){ vP = position; gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }',
      fragmentShader: 'varying vec3 vP; void main(){ float r = length(vP.xy); float a = .55 + .45 * sin(r * 38.0); a *= smoothstep(1.25, 1.35, r) * (1.0 - smoothstep(1.95, 2.1, r)); a *= 1.0 - .8 * smoothstep(1.62, 1.66, r) * (1.0 - smoothstep(1.7, 1.74, r)); gl_FragColor = vec4(vec3(.93, .85, .7), a * .75); }'
    }));
    ring.rotation.x = Math.PI / 2; grp.add(ring); grp.rotation.set(.38, 0, -.32); grp.position.x = 2.7; o.scene.add(grp);
    o.tick = function (t) { p.rotation.y = t * .25; }; return o;
  };
  S.naines = function () {
    var o = base(), a = sphere(.75, 2, 0xe9dccb, 0x7a6858, 0xffffff, 4), b = sphere(.3, 2, 0xb8a898, 0x5a4c40, 0xffffff, 8);
    a.position.set(2.4, 0, 0); o.scene.add(a, b);
    o.tick = function (t) { a.rotation.y = t * .12; b.position.set(2.4 + Math.cos(t * .5) * 1.5, Math.sin(t * .5) * .35, Math.sin(t * .5) * 1.5); b.rotation.y = t * .4; }; return o;
  };
  S.lune = function () {
    var o = base(), m = sphere(1.05, 2, 0xe7e9f0, 0x7d8194, 0xffffff, 6); m.position.x = 2.8; o.scene.add(m);
    o.tick = function (t) { var ph = .5 + .55 * Math.sin(t * .08); m.userData.mat.uniforms.uL.value.set(-Math.cos(ph), .25, Math.sin(ph) + .25).normalize(); m.rotation.y = .3; }; return o;
  };
  S.comete = function () {
    var o = base(), N = 1600, r = rnd(11), pos = new Float32Array(N * 3), col = [], size = [], age = new Float32Array(N), vel = [];
    for (var k = 0; k < N; k++) { age[k] = r(); vel.push([-(1 + r() * 1.5), (r() - .5) * .25 + (k % 3 ? 0 : .25), (r() - .5) * .25]); var dust = k % 3 === 0; col.push(dust ? 1 : .55, dust ? .9 : .8, dust ? .75 : 1); size.push(4 + r() * 8); }
    var pts = points(Array.prototype.slice.call(pos), col, size, .55); o.scene.add(pts);
    var head = new T.Vector3(3.4, .45, 0), core = glow(0xdff4ff, 1.4, 1), coma = glow(0x9fd8ff, 3.2, .55); core.position.copy(head); coma.position.copy(head); o.scene.add(core, coma);
    var P = pts.geometry.attributes.position;
    o.tick = function (t, dt) {
      for (var k = 0; k < N; k++) {
        age[k] += dt * .22; if (age[k] > 1) age[k] -= 1;
        var a = age[k], v = vel[k], L = a * 3.6;
        P.setXYZ(k, head.x + v[0] * L, head.y + v[1] * L * (1 + a) - (k % 3 === 0 ? a * a * .5 : 0), head.z + v[2] * L);
      }
      P.needsUpdate = true; core.scale.setScalar(1.4 + Math.sin(t * 3) * .06);
    }; return o;
  };
  S.asteroide = function () {
    var o = base(), L = new T.DirectionalLight(0xfff2dd, 1.6); L.position.set(-3, 2, 4); o.scene.add(L, new T.AmbientLight(0x404660, .5));
    var rocks = [[rock(.9, 3, 0x8a7d6c), 2.4, 0], [rock(.38, 9, 0x6e6458), 3.9, .55], [rock(.22, 17, 0x7d7266), 3.5, -.6], [rock(.15, 23, 0x8a7d6c), 1.5, .7]];
    rocks.forEach(function (x) { x[0].position.set(x[1], x[2], 0); o.scene.add(x[0]); });
    o.tick = function (t) { rocks.forEach(function (x, i) { x[0].rotation.set(t * (.2 + i * .07), t * (.15 + i * .05), 0); }); }; return o;
  };
  S.region = function () {
    var o = base(), r = rnd(13), N = 2600, pos = [], col = [], size = [], rad = [], ph = [];
    for (var k = 0; k < N; k++) { var R0 = 1.6 + (r() + r() - 1) * .45, a = r() * 6.283; rad.push(R0); ph.push(a); pos.push(0, 0, 0); var b = .5 + r() * .5; col.push(b * .85, b * .82, b * .78); size.push(3 + r() * 5); }
    var pts = points(pos, col, size, .8), grp = new T.Group(); grp.add(pts); grp.add(glow(0xffd27a, 1.6, 1)); grp.rotation.x = 1.2; grp.position.x = 2.7; o.scene.add(grp);
    var P = pts.geometry.attributes.position;
    o.tick = function (t) { for (var k = 0; k < N; k++) { var a = ph[k] + t * .35 / Math.pow(rad[k], 1.5); P.setXYZ(k, Math.cos(a) * rad[k], 0, Math.sin(a) * rad[k]); } P.needsUpdate = true; }; return o;
  };
  S.hypo = function () {
    var o = base(), m = new T.Mesh(new T.SphereGeometry(1, 24, 16), new T.MeshBasicMaterial({ color: 0x7cc4ff, wireframe: true, transparent: true, opacity: .35 }));
    m.position.x = 2.9; o.scene.add(m); var g = glow(0x7cc4ff, 3, .45); g.position.copy(m.position); o.scene.add(g);
    o.tick = function (t) { m.rotation.y = t * .2; m.rotation.x = .4; g.scale.setScalar(3 + Math.sin(t * 1.2) * .3); }; return o;
  };
  S.nebuleuse = function () {
    var o = base(), r = rnd(17), N = 900, pos = [], col = [], size = [];
    var pal = [[1, .35, .55], [.45, .55, 1], [1, .65, .35], [.75, .4, 1]];
    for (var k = 0; k < N; k++) { var a = r() * 6.283, d = Math.pow(r(), .6) * 1.6, c = pal[k % 4]; pos.push(Math.cos(a) * d * 1.4, Math.sin(a) * d * .8, (r() - .5) * 1.2); col.push(c[0], c[1], c[2]); size.push(50 + r() * 110); }
    var cloud = points(pos, col, size, .05), grp = new T.Group(); grp.add(cloud);
    var sp = [], sc = [], ss = []; for (var j = 0; j < 40; j++) { sp.push((r() - .5) * 2.4, (r() - .5) * 1.4, (r() - .5)); sc.push(1, 1, 1); ss.push(6 + r() * 8); } grp.add(points(sp, sc, ss, .9));
    grp.position.x = 2.7; o.scene.add(grp);
    o.tick = function (t) { grp.rotation.z = Math.sin(t * .05) * .15; cloud.rotation.y = t * .03; }; return o;
  };
  S.amas = function () {
    var o = base(), r = rnd(19), N = 3000, pos = [], col = [], size = [];
    for (var k = 0; k < N; k++) { var u = new T.Vector3(r() - .5, r() - .5, r() - .5).normalize(), d = Math.pow(r(), 2.2) * 1.8; pos.push(u.x * d, u.y * d, u.z * d); var c = r() < .2 ? [1, .8, .6] : [.85, .9, 1]; col.push(c[0], c[1], c[2]); size.push(4 + r() * 7); }
    var pts = points(pos, col, size, .6); pts.position.x = 2.7; o.scene.add(pts); var g = glow(0xe8eeff, 2.6, .5); g.position.x = 2.7; o.scene.add(g);
    o.tick = function (t) { pts.rotation.y = t * .05; }; return o;
  };
  S.compact = function () {
    var o = base(), grp = new T.Group();
    var disk = new T.Mesh(new T.RingGeometry(.75, 2.2, 128, 1), new T.ShaderMaterial({
      side: T.DoubleSide, transparent: true, depthWrite: false, blending: T.AdditiveBlending, uniforms: { uT: { value: 0 } },
      vertexShader: 'varying vec3 vP; void main(){ vP = position; gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }',
      fragmentShader: 'uniform float uT; varying vec3 vP;' + NOISE + 'void main(){ float r = length(vP.xy), a = atan(vP.y, vP.x); float s = fbm(vec3(a * 3.0 + uT * 1.6 / r, r * 4.0, uT * .2)); float hot = smoothstep(2.2, .75, r); vec3 c = mix(vec3(1., .35, .1), vec3(1., .92, .75), hot); float al = hot * (.35 + .65 * s) * smoothstep(.75, .82, r); gl_FragColor = vec4(min(c * 1.6, vec3(1.0)), al); }'
    }));
    disk.rotation.x = Math.PI / 2 - .22; grp.add(disk);
    var hole = new T.Mesh(new T.SphereGeometry(.68, 40, 24), new T.MeshBasicMaterial({ color: 0x000000 })); grp.add(hole);
    var ringG = glow(0xffb070, 2.4, .6); grp.add(ringG);
    grp.rotation.z = -.35; grp.position.x = 2.8; o.scene.add(grp);
    o.tick = function (t) { disk.material.uniforms.uT.value = t; }; return o;
  };
  S.exo = function () {
    var o = base(), st = sphere(.45, 0, 0xfff1c8, 0xffa040, 0xffd27a, 7), grp = new T.Group(); grp.add(st); var g = glow(0xffc070, 2.4, .9); grp.add(g);
    var pl = [[1.1, .9, 0x7fc9a0, .12], [1.75, .55, 0x9fb6ff, .16], [2.5, .35, 0xd9b27a, .2]].map(function (x) {
      var orbit = new T.LineLoop(new T.BufferGeometry().setFromPoints(new T.EllipseCurve(0, 0, x[0], x[0]).getPoints(96).map(function (p) { return new T.Vector3(p.x, 0, p.y); })), new T.LineBasicMaterial({ color: 0x9fe3b0, transparent: true, opacity: .25 }));
      var m = sphere(x[3], 2, x[2], 0x333a44, 0xffffff, x[0] * 10); m.userData.mat.uniforms.uL.value.set(0, 0, 1); grp.add(orbit, m); return [m, x[0], x[1]];
    });
    grp.rotation.x = .42; grp.position.x = 2.6; o.scene.add(grp);
    o.tick = function (t) { st.userData.mat.uniforms.uT.value = t; pl.forEach(function (p, i) { var a = t * p[2] + i * 2; p[0].position.set(Math.cos(a) * p[1], 0, Math.sin(a) * p[1]); p[0].userData.mat.uniforms.uL.value.set(-Math.cos(a), 0, -Math.sin(a)); }); }; return o;
  };
  S.bras = function () {
    var o = base(), r = rnd(23), N = 4000, pos = [], col = [], size = [];
    for (var k = 0; k < N; k++) { var t = r(), ang = t * 2.2, rad = 1 + t * 2.6, sp = (r() - .5) * .45; pos.push(Math.cos(ang) * (rad + sp), (r() - .5) * .12, Math.sin(ang) * (rad + sp)); var b = r() < .1; col.push(b ? .6 : .75, b ? .75 : .78, 1); size.push(4 + r() * 8); }
    var pts = points(pos, col, size, .28); pts.rotation.set(1.1, 0, .2); pts.position.set(1.6, -.4, 0); o.scene.add(pts);
    o.tick = function (t) { pts.rotation.y = -t * .03; }; return o;
  };
  S.pluie = function () {
    var o = base(), r = rnd(29), M = 9, lines = [];
    for (var k = 0; k < M; k++) {
      var g = new T.BufferGeometry(); g.setAttribute('position', new T.Float32BufferAttribute([0, 0, 0, 0, 0, 0], 3)); g.setAttribute('color', new T.Float32BufferAttribute([1, .95, .8, 0, 0, 0], 3));
      var l = new T.Line(g, new T.LineBasicMaterial({ vertexColors: true, transparent: true, blending: T.AdditiveBlending })); o.scene.add(l);
      lines.push({ l: l, x: 1 + r() * 3.4, y: -.5 + r() * 2, ph: r(), sp: .25 + r() * .3, len: .8 + r() * 1.2 });
    }
    o.tick = function (t) { lines.forEach(function (m) { var a = (t * m.sp + m.ph) % 1, x = m.x - a * 2.2, y = m.y - a * 1, P = m.l.geometry.attributes.position; P.setXYZ(0, x, y, 0); P.setXYZ(1, x + m.len * Math.min(1, a * 5), y + m.len * .45 * Math.min(1, a * 5), 0); P.needsUpdate = true; m.l.material.opacity = Math.sin(a * Math.PI); }); }; return o;
  };
  S.interstellaire = function () {
    var o = base(), e = 2.2, q = .9, pts = [];
    for (var k = -60; k <= 60; k++) { var H = k / 60 * 2.2, x = q / (e - 1) * (e - Math.cosh(H)), y = q / (e - 1) * Math.sqrt(e * e - 1) * Math.sinh(H); pts.push(new T.Vector3(x, y * .6, 0)); }
    var path = new T.Line(new T.BufferGeometry().setFromPoints(pts), new T.LineDashedMaterial({ color: 0xb4f0ff, dashSize: .12, gapSize: .1, transparent: true, opacity: .7 })); path.computeLineDistances();
    var grp = new T.Group(); grp.add(path); var sun = glow(0xffd27a, 1.4, 1); grp.add(sun);
    var obj = glow(0xffffff, .5, 1); grp.add(obj); grp.rotation.z = -.5; grp.position.set(2.8, .1, 0); o.scene.add(grp);
    o.tick = function (t) { var H = ((t * .12) % 1) * 4.4 - 2.2, x = q / (e - 1) * (e - Math.cosh(H)), y = q / (e - 1) * Math.sqrt(e * e - 1) * Math.sinh(H); obj.position.set(x, y * .6, 0); }; return o;
  };
  S.vide = function () {
    var o = base(), r = rnd(31), pos = [], col = [], size = [];
    for (var f = 0; f < 14; f++) {
      var a = new T.Vector3(r() - .5, r() - .5, r() - .5).normalize().multiplyScalar(1.9 + r() * .6), b = new T.Vector3(r() - .5, r() - .5, r() - .5).normalize().multiplyScalar(1.9 + r() * .6);
      for (var k = 0; k < 160; k++) { var t = r(), p = a.clone().lerp(b, t); if (p.length() < 1.3) p.setLength(1.3 + r() * .3); pos.push(p.x + (r() - .5) * .12, p.y + (r() - .5) * .12, p.z + (r() - .5) * .12); col.push(.7, .75, 1); size.push(3 + r() * 6); }
    }
    var pts = points(pos, col, size, .55); pts.position.x = 2.7; o.scene.add(pts);
    o.tick = function (t) { pts.rotation.y = t * .05; pts.rotation.x = .3; }; return o;
  };


  /* ---------- vignettes : une scène par type d'objet (data-mini="nom:paramètres"), objet centré en x = 2,7 ---------- */
  function cloudPts(seed, N, fn, alpha) { var r = rnd(seed), pos = [], col = [], size = []; for (var k = 0; k < N; k++) { var o = fn(r, k); pos.push(o[0], o[1], o[2]); col.push(o[3], o[4], o[5]); size.push(o[6]); } return points(pos, col, size, alpha); }
  function hex3(h) { var c = new T.Color(h); return [c.r, c.g, c.b]; }
  var TH = {
    star: function (c1, c2, sc) { var o = base(), k = +sc || 1, st = sphere(.95 * k, 0, c1, c2, c1, k * 7); st.position.x = 2.7; o.scene.add(st); var g = glow(c2, 3.4 * k, .9); g.position.x = 2.7; o.scene.add(g);
      o.tick = function (t) { st.userData.mat.uniforms.uT.value = t; st.rotation.y = t * .08; }; return o; },
    wd: function () { var o = base(), st = sphere(.35, 0, '#ffffff', '#cfe0ff', '#ffffff', 3); st.position.x = 2.7; o.scene.add(st); var g = glow(0xbfd6ff, 2.6, 1); g.position.x = 2.7; o.scene.add(g);
      o.tick = function (t) { st.userData.mat.uniforms.uT.value = t * 3; g.scale.setScalar(2.6 + Math.sin(t * 2) * .1); }; return o; },
    pulsar: function () { var o = base(), grp = new T.Group(), st = sphere(.22, 0, '#ffffff', '#9fc0ff', '#ffffff', 5); grp.add(st); grp.add(glow(0x9fc0ff, 1.4, 1));
      var beamMat = new T.MeshBasicMaterial({ color: 0x9fd0ff, transparent: true, opacity: .35, blending: T.AdditiveBlending, depthWrite: false, side: T.DoubleSide });
      var beams = new T.Group(); [1, -1].forEach(function (d) { var c = new T.Mesh(new T.ConeGeometry(.35, 2.4, 24, 1, true), beamMat); c.position.y = d * 1.25; if (d < 0) c.rotation.x = Math.PI; c.rotation.x += Math.PI; beams.add(c); });
      beams.rotation.z = .5; grp.add(beams); grp.position.x = 2.7; o.scene.add(grp);
      o.tick = function (t) { grp.rotation.y = t * 3.5; st.userData.mat.uniforms.uT.value = t; }; return o; },
    bh: function () { return S.compact(); },
    smbh: function () { var o = S.compact(); var g = glow(0xffd8a0, 5.5, .35); g.position.x = 2.8; o.scene.add(g); return o; },
    planet: function (kind, c1, c2, ring) { var o = base(), p = sphere(1.05, kind === 'band' ? 1 : 2, c1, c2, '#ffffff', c1.length * 3), grp = new T.Group(); grp.add(p);
      if (ring) { var rg = new T.Mesh(new T.RingGeometry(1.35, 2.2, 96, 1), new T.MeshBasicMaterial({ color: 0xe9d3a3, transparent: true, opacity: .45, side: T.DoubleSide, depthWrite: false })); rg.rotation.x = Math.PI / 2; grp.add(rg); grp.rotation.set(.4, 0, -.3); }
      grp.position.x = 2.7; o.scene.add(grp); o.tick = function (t) { p.rotation.y = t * .3; }; return o; },
    hotjup: function () { var o = base(), st = sphere(1.2, 0, '#fff1c8', '#ffa040', '#ffd27a', 2); st.position.set(4.4, 0, -1); o.scene.add(st); var g = glow(0xffc070, 4, .8); g.position.copy(st.position); o.scene.add(g);
      var p = sphere(.55, 1, '#d98a5a', '#5a2a1a', '#ffb070', 9); p.position.set(2.2, 0, 0); p.userData.mat.uniforms.uL.value.set(1, 0, .2).normalize(); o.scene.add(p);
      o.tick = function (t) { st.userData.mat.uniforms.uT.value = t; p.rotation.y = t * .5; }; return o; },
    rocks: function () { return S.asteroide(); },
    comet: function () { return S.comete(); },
    inter: function () { return S.interstellaire(); },
    neb: function (c1, c2, c3) { var cs = [hex3(c1), hex3(c2), hex3(c3)], o = base();
      var cl = cloudPts(41, 360, function (r, k) { var a = r() * 6.283, d = Math.pow(r(), .6) * 1.7, c = cs[k % 3]; return [Math.cos(a) * d, Math.sin(a) * d * .9, (r() - .5), c[0], c[1], c[2], 40 + r() * 70]; }, .025);
      var grp = new T.Group(); grp.add(cl); grp.add(cloudPts(43, 25, function (r) { return [(r() - .5) * 2.6, (r() - .5) * 2.6, 0, 1, 1, 1, 6 + r() * 6]; }, .9)); grp.position.x = 2.7; o.scene.add(grp);
      o.tick = function (t) { cl.rotation.z = t * .04; }; return o; },
    ringneb: function () { var o = base(), grp = new T.Group();
      grp.add(cloudPts(47, 700, function (r) { var a = r() * 6.283, d = 1.3 + (r() - .5) * .35; var c = r() < .5 ? [.4, 1, .85] : [1, .45, .55]; return [Math.cos(a) * d, Math.sin(a) * d * .85, (r() - .5) * .3, c[0], c[1], c[2], 18 + r() * 25]; }, .12));
      var wd = sphere(.08, 0, '#ffffff', '#cfe0ff', '#ffffff', 2); grp.add(wd); grp.add(glow(0xcfe0ff, .9, 1)); grp.position.x = 2.7; o.scene.add(grp);
      o.tick = function (t) { grp.rotation.z = t * .05; }; return o; },
    open: function () { var o = base(), p = cloudPts(53, 90, function (r) { return [(r() - .5) * 3, (r() - .5) * 3, (r() - .5) * 2, .75, .85, 1, 8 + r() * 14]; }, .9); p.position.x = 2.7; o.scene.add(p);
      var n = cloudPts(59, 80, function (r) { var a = r() * 6.283, d = r() * 1.8; return [Math.cos(a) * d, Math.sin(a) * d, -1, .35, .5, 1, 40 + r() * 60]; }, .05); n.position.x = 2.7; o.scene.add(n);
      o.tick = function (t) { p.rotation.y = t * .08; }; return o; },
    globular: function () { return S.amas(); },
    spiral: function () { return S.galaxie(); },
    elliptical: function () { var o = base(), p = cloudPts(61, 3500, function (r) { var u = new T.Vector3(r() - .5, r() - .5, r() - .5).normalize(), d = Math.pow(r(), 2.4) * 2.2; return [u.x * d * 1.3, u.y * d * .8, u.z * d, 1, .85, .65, 4 + r() * 6]; }, .5); p.position.x = 2.7; o.scene.add(p); var g = glow(0xffe0b0, 2.6, .6); g.position.x = 2.7; o.scene.add(g);
      o.tick = function (t) { p.rotation.y = t * .04; }; return o; },
    irregular: function () { var o = base(), p = cloudPts(67, 2200, function (r, k) { var cx = [[-.6, .3], [.5, -.2], [.1, .7], [.7, .6]][k % 4], d = Math.pow(r(), 1.5) * .9, a = r() * 6.283, b = r() < .35; return [cx[0] + Math.cos(a) * d, cx[1] + Math.sin(a) * d * .7, (r() - .5) * .4, b ? .6 : 1, b ? .75 : .85, b ? 1 : .75, 4 + r() * 5]; }, .22); p.position.x = 2.7; o.scene.add(p);
      o.tick = function (t) { p.rotation.z = Math.sin(t * .1) * .1; p.rotation.y = t * .05; }; return o; },
    sph: function () { var o = base(), p = cloudPts(71, 900, function (r) { var u = new T.Vector3(r() - .5, r() - .5, r() - .5).normalize(), d = Math.pow(r(), 1.3) * 1.6; return [u.x * d, u.y * d * .85, u.z * d, .95, .85, .75, 4 + r() * 4]; }, .35); p.position.x = 2.7; o.scene.add(p);
      var dm = glow(0x6a5aff, 4.4, .25); dm.position.x = 2.7; o.scene.add(dm); o.tick = function (t) { p.rotation.y = t * .06; }; return o; },
    udg: function () { var o = base(), p = cloudPts(73, 500, function (r) { var u = new T.Vector3(r() - .5, r() - .5, r() - .5).normalize(), d = Math.pow(r(), .7) * 2.4; return [u.x * d, u.y * d * .9, u.z * d, .85, .85, .95, 3 + r() * 4]; }, .3); p.position.x = 2.7; o.scene.add(p);
      o.tick = function (t) { p.rotation.y = t * .04; }; return o; },
    belt: function () { return S.region(); },
    helio: function () { var o = base(), grp = new T.Group(), sh = new T.Mesh(new T.SphereGeometry(1.6, 40, 24), new T.ShaderMaterial({ transparent: true, depthWrite: false, blending: T.AdditiveBlending,
        vertexShader: 'varying vec3 vN; varying vec3 vV; void main(){ vN = normalize(normalMatrix * normal); vec4 mv = modelViewMatrix * vec4(position,1.0); vV = normalize(-mv.xyz); gl_Position = projectionMatrix * mv; }',
        fragmentShader: 'varying vec3 vN; varying vec3 vV; void main(){ float f = pow(1.0 - abs(dot(vN, vV)), 3.0); gl_FragColor = vec4(vec3(.55, .75, 1.0), f * .9); }' }));
      sh.scale.set(1.25, 1, 1); grp.add(sh); grp.add(glow(0xffd27a, .9, 1)); grp.position.x = 2.7; o.scene.add(grp);
      o.tick = function (t) { grp.rotation.y = .6 + Math.sin(t * .2) * .2; }; return o; },
    arm: function () { return S.bras(); },
    halo: function () { var o = S.galaxie(); o.scene.children[0].scale.setScalar(.45); var h = glow(0x8aa6ff, 5.5, .35); h.position.x = 2.6; o.scene.add(h); return o; },
    void: function () { return S.vide(); }
  };
  function makeThumb(spec) { var p = spec.split(':'), f = TH[p[0]]; return f ? f.apply(null, p.slice(1)) : null; }

  /* ---------- branchement sur les bandeaux ---------- */
  function setup(band) {
    if (band._mini || !renderer()) return;
    var it;
    if (band.hasAttribute('data-mini')) {          // vignette : le canvas lui-même
      var sc = makeThumb(band.getAttribute('data-mini')); if (!sc) return;
      it = { band: band, cv: band, ctx: band.getContext('2d'), sc: sc, t0: Math.random() * 100, thumb: true };
      // cadrage : la taille de l'objet (hors lueurs) remplit la vignette
      sc.tick(1, .016); var box = new T.Box3();
      sc.scene.traverse(function (o) { if ((o.isMesh || o.isPoints || o.isLine) && !o.isGlow && o.geometry) { o.updateWorldMatrix(true, false); if (!o.geometry.boundingBox) o.geometry.computeBoundingBox(); box.union(o.geometry.boundingBox.clone().applyMatrix4(o.matrixWorld)); } });
      var sz = box.isEmpty() ? new T.Vector3(4, 4, 4) : box.getSize(new T.Vector3()), ctr = box.isEmpty() ? new T.Vector3(2.7, 0, 0) : box.getCenter(new T.Vector3());
      it.dist = Math.max(sz.x, sz.y) / 2 / Math.tan(3 * Math.PI / 180) / .8; it.ctr = ctr;
    } else {
      var kind = band.getAttribute('data-kind'), make = S[kind]; if (!make) return;
      var cv = document.createElement('canvas'); cv.className = 'cat-gl'; cv.setAttribute('aria-hidden', 'true');
      band.insertBefore(cv, band.firstChild.nextSibling); band.classList.add('has-gl');
      it = { band: band, cv: cv, ctx: cv.getContext('2d'), sc: make(), t0: Math.random() * 100 };
    }
    // lumière additive : la couleur s'ajoute, et la transparence s'accumule avec elle (image prémultipliée valide,
    // sinon le navigateur écrase les lueurs en recopiant le dessin dans le bandeau)
    it.sc.scene.traverse(function (o) {
      var m = o.material; if (!m || m.blending !== T.AdditiveBlending) return;
      m.blending = T.CustomBlending; m.blendEquation = T.AddEquation; m.blendSrc = T.SrcAlphaFactor; m.blendDst = T.OneFactor;
      m.blendEquationAlpha = T.AddEquation; m.blendSrcAlpha = T.OneFactor; m.blendDstAlpha = T.OneFactor; m.needsUpdate = true;
    });
    band._mini = it; items.push(it);
    io.observe(band);
  }
  function draw(it, t, dt) {
    var w = it.band.clientWidth, h = it.band.clientHeight; if (!w || !h) return;
    var dpr = Math.min(window.devicePixelRatio || 1, 1.25), W = Math.round(w * dpr), H = Math.round(h * dpr);
    if (it.cv.width !== W || it.cv.height !== H) { it.cv.width = W; it.cv.height = H; }
    var r = R, cs = r.getSize(new T.Vector2());
    if (cs.x < W || cs.y < H) r.setSize(Math.max(cs.x, W), Math.max(cs.y, H), false);
    cs = r.getSize(new T.Vector2());
    // l'objet est placé vers x ≈ 2,7 : on cadre pour qu'il tombe aux trois quarts de la largeur, à taille constante en hauteur
    var cam = it.sc.cam; cam.aspect = w / h;
    if (it.thumb) cam.position.set(it.ctr.x, it.ctr.y, it.ctr.z + it.dist); else cam.position.set(2.7 - Math.tan(cam.fov * Math.PI / 360) * 50 * cam.aspect * (w < 600 ? .35 : .5), 0, 50);
    cam.updateProjectionMatrix();
    var us = (it.thumb ? H * 50 / it.dist : H) * .028;
    it.sc.scene.traverse(function (o) { if (o.material && o.material.uniforms && o.material.uniforms.uScale) o.material.uniforms.uScale.value = us; });
    it.sc.tick(t + it.t0, dt);
    r.setViewport(0, 0, W, H); r.setScissor(0, 0, W, H); r.setScissorTest(true);
    r.clear(); r.render(it.sc.scene, cam);
    it.ctx.clearRect(0, 0, W, H);
    it.ctx.drawImage(r.domElement, 0, cs.y - H, W, H, 0, 0, W, H);
  }
  function loop(now) {
    raf = 0;
    if (!document.querySelector('.cat-band, canvas[data-mini]')) { cleanup(); return; }
    if (document.hidden || !visible.size) return;
    raf = requestAnimationFrame(loop);
    if (now - lastT < 33) return;
    var dt = Math.min(.1, lastT ? (now - lastT) / 1000 : .033); lastT = now;
    frameN++;
    visible.forEach(function (it) { if (!it.thumb || frameN % 2 === 0) draw(it, now / 1000, it.thumb ? dt * 2 : dt); });   // vignettes : 15 i/s
  }
  function kick() { if (!raf && !reduced) raf = requestAnimationFrame(loop); }
  function cleanup() {
    items = items.filter(function (it) {
      if (document.body.contains(it.band)) return true;
      io.unobserve(it.band); visible.delete(it);
      it.sc.scene.traverse(function (o) { if (o.geometry) o.geometry.dispose(); if (o.material) o.material.dispose(); });
      return false;
    });
  }
  function scan() {
    cleanup();
    Array.prototype.forEach.call(document.querySelectorAll('.cat-band[data-kind], canvas[data-mini]'), setup);
  }
  function start() {
    if (!renderer()) return;
    io = new IntersectionObserver(function (ents) {
      ents.forEach(function (e) { var it = e.target._mini; if (!it) return; if (e.isIntersecting) { visible.add(it); if (reduced) draw(it, 10, 0); } else visible.delete(it); });
      kick();
    }, { rootMargin: '80px' });
    var pend = 0, page = document.getElementById('page') || document.body;
    new MutationObserver(function () { if (!pend) pend = requestAnimationFrame(function () { pend = 0; scan(); }); }).observe(page, { childList: true, subtree: true });
    document.addEventListener('visibilitychange', kick);
    scan();
  }
  OBS.minis = { scan: scan };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start); else start();
})();

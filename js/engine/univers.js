/* ======================================================================
   OBSERVATOIRE — niveau « Univers observable » (Explorer, niveau 8 de la règle des échelles, lot 9)
   La tranche du relevé SDSS (data/univers.json, lu par js/ui/univers.js) en vrais points 3D (bande de 5° autour de
   l'équateur céleste), puis, à leur distance comobile calculée, les sphères repères jusqu'au rayonnement fossile.
   Repère équatorial (ascension droite dans le plan horizontal). 1 unité = 10 Mpc ≈ 32,6 millions d'al.
   ====================================================================== */
(function () {
  'use strict';
  var OBS = window.OBS = window.OBS || {};
  var T = window.THREE, D2R = Math.PI / 180, TAU = Math.PI * 2;
  var L = { id: 'univers', label: 'Univers observable' };
  OBS.univers = L;
  var scene = L.scene = new T.Scene();
  var camera = L.camera = new T.PerspectiveCamera(45, 1, 0.5, 40000);
  var controls, W = 800, H = 600, PR = 1;
  var web = new T.Group(), marks = new T.Group(), items = [], byId = {}, selected = null, hover = null, flight = null, uniforms = [], built = false, pending = null;
  var tmp = new T.Vector3(), tmp2 = new T.Vector3(), v3 = new T.Vector3(), camSpace = new T.Vector3();
  var VERT = [
    'attribute float aSize; attribute vec3 aColor; uniform float uPR; varying vec3 vC;',
    'void main(){ vC=aColor; vec4 mv=modelViewMatrix*vec4(position,1.0); gl_PointSize=aSize*uPR; gl_Position=projectionMatrix*mv; }'
  ].join('\n');
  var FRAG = 'varying vec3 vC; void main(){ float d=length(gl_PointCoord-0.5); float a=1.0-smoothstep(0.12,0.5,d); gl_FragColor=vec4(vC*a,a); }';
  function eq(ra, dec, d, out) { var a = ra * D2R, b = dec * D2R; return out.set(Math.cos(b) * Math.cos(a) * d, Math.sin(b) * d, -Math.cos(b) * Math.sin(a) * d); }

  /* le rayonnement fossile : la vraie carte de Planck (ESA, CC BY 4.0), en coordonnées galactiques, posée sur la sphère
     du bord dans le repère équatorial de la scène. Vue de l'extérieur, elle apparaît retournée, comme un globe céleste. */
  function cmbSphere(R) {
    new T.TextureLoader().load('assets/img/fond-diffus.webp', function (tex) {
      var mat = new T.ShaderMaterial({
        uniforms: { map: { value: tex }, uOp: { value: .38 },
          r0: { value: new T.Vector3(-0.0548755604, -0.8734370902, -0.4838350155) }, r1: { value: new T.Vector3(0.4941094279, -0.4448296300, 0.7469822445) }, r2: { value: new T.Vector3(-0.8676661490, -0.1980763734, 0.4559837762) } },
        vertexShader: 'varying vec3 vP; void main(){ vP = position; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }',
        fragmentShader: 'uniform sampler2D map; uniform float uOp; uniform vec3 r0, r1, r2; varying vec3 vP;' +
          'void main(){ vec3 e = normalize(vec3(vP.x, -vP.z, vP.y)); vec3 g = vec3(dot(r0, e), dot(r1, e), dot(r2, e));' +
          ' float l = atan(g.y, g.x), b = asin(clamp(g.z, -1.0, 1.0)); vec2 uv = vec2(0.5 - l / 6.2831853, 0.5 + b / 3.1415927);' +
          ' gl_FragColor = vec4(texture2D(map, uv).rgb * uOp, uOp); }',
        transparent: true, side: T.DoubleSide, depthWrite: false });
      var mesh = new T.Mesh(new T.SphereGeometry(R * .999, 96, 64), mat); marks.add(mesh); L.cmbMesh = mesh;
    });
  }
  /* quasars lointains du SDSS (z de 3 à 7,6), à leur vraie direction et distance : ils peuplent la sphère des quasars */
  function quasars() {
    fetch('data/quasars.json', { cache: 'no-cache' }).then(function (r) { if (!r.ok) throw 0; return r.json(); }).then(function (J) {
      var Q = J.q, n = Q.length, P = new Float32Array(n * 3), C = new Float32Array(n * 3), Z = new Float32Array(n);
      Q.forEach(function (q, i) { eq(q[0] / 100, q[1] / 100, q[2] / 100, tmp); P[i * 3] = tmp.x; P[i * 3 + 1] = tmp.y; P[i * 3 + 2] = tmp.z; C[i * 3] = .55; C[i * 3 + 1] = .48; C[i * 3 + 2] = .8; Z[i] = 2.2; });
      var geo = new T.BufferGeometry(); geo.setAttribute('position', new T.BufferAttribute(P, 3)); geo.setAttribute('aColor', new T.BufferAttribute(C, 3)); geo.setAttribute('aSize', new T.BufferAttribute(Z, 1));
      var un = { uPR: { value: PR } }; uniforms.push(un);
      var pts = new T.Points(geo, new T.ShaderMaterial({ uniforms: un, vertexShader: VERT, fragmentShader: FRAG, transparent: true, depthWrite: false, blending: T.AdditiveBlending })); pts.frustumCulled = false; marks.add(pts);
      L.nQuasars = n;
    }).catch(function () {});
  }
  function populate(J) {
    var G = J.g, n = G.length, P = new Float32Array(n * 3), C = new Float32Array(n * 3), Z = new Float32Array(n), dmax = J.meta.dmax;
    G.forEach(function (g, i) {
      var d = g[1] / 100, t = Math.min(1, d * 10 / dmax);                   // d en unités (10 Mpc)
      eq(g[0] / 100, 0, d, tmp); P[i * 3] = tmp.x; P[i * 3 + 1] = tmp.y; P[i * 3 + 2] = tmp.z;
      var a = .55 - .25 * t; C[i * 3] = (255 - 90 * t) / 255 * a; C[i * 3 + 1] = (232 - 40 * t) / 255 * a; C[i * 3 + 2] = (190 + 65 * t) / 255 * a; Z[i] = 1.8;
    });
    var geo = new T.BufferGeometry();
    geo.setAttribute('position', new T.BufferAttribute(P, 3)); geo.setAttribute('aColor', new T.BufferAttribute(C, 3)); geo.setAttribute('aSize', new T.BufferAttribute(Z, 1));
    var un = { uPR: { value: PR } }; uniforms.push(un);
    var pts = new T.Points(geo, new T.ShaderMaterial({ uniforms: un, vertexShader: VERT, fragmentShader: FRAG, transparent: true, depthWrite: false, blending: T.AdditiveBlending }));
    pts.frustumCulled = false; web.add(pts);
    built = true;
    if (pending) { var p = pending; pending = null; L.select(p); }
  }
  function label(id, name, pos, kind, extra) {
    var it = { id: id, name: name, pos: pos, def: extra || {}, home: kind === 'home', kind: kind };
    var el = document.createElement('button'); el.type = 'button'; el.className = 'lbl ' + (kind === 'home' ? 'is-sun' : 'is-moon');
    el.innerHTML = '<span class="dot"></span><span class="nm">' + OBS.esc(name) + (kind === 'home' ? ' <em>vous êtes ici</em>' : '') + '</span>';
    el.addEventListener('click', function (e) { e.stopPropagation(); el.blur(); if (id === 'laniakea' && selected === id && !flight) OBS.engine.go('laniakea', { from: 'univers' }); else L.select(id); });
    el.addEventListener('pointerenter', function () { hover = id; });
    el.addEventListener('pointerleave', function () { if (hover === id) hover = null; });
    L.labelsEl.appendChild(el); it.el = el; items.push(it); byId[id] = it; return it;
  }

  L.build = function (renderer, labelsContainer) {
    L.labelsEl = labelsContainer;
    scene.add(web); scene.add(marks);
    var U = OBS.UN;
    // sphères repères à leur distance comobile : cercle dans le plan de la tranche + sphère très légère
    U.MARKS.forEach(function (m, i) {
      var R = m.d / 10, col = new T.Color(m.c);
      if (m.id !== 'laniakea') {
        var pts = []; for (var j = 0; j <= 256; j++) { var t = j / 256 * TAU; pts.push(new T.Vector3(Math.cos(t) * R, 0, Math.sin(t) * R)); }
        marks.add(new T.Line(new T.BufferGeometry().setFromPoints(pts), new T.LineBasicMaterial({ color: col, transparent: true, opacity: m.id === 'cmb' ? .55 : .3, depthWrite: false })));
        var sph = new T.Mesh(new T.SphereGeometry(R, 48, 32), new T.MeshBasicMaterial({ color: col, transparent: true, opacity: m.id === 'cmb' ? .035 : .01, side: T.BackSide, depthWrite: false }));
        marks.add(sph);
        if (m.id === 'cmb') cmbSphere(R);
      } else {
        var gl = OBS.system.glowMesh([[0, .7], [.4, .25], [1, 0]], 0xf4c77a, .6); gl.scale.setScalar(R * 2); web.add(gl);
      }
      // un repère qui a des objets réels se place sur le premier d'entre eux : on va voir une vraie galaxie, pas un point vide
      var o0 = U.OBJS.filter(function (o) { return o.mk === m.id; })[0];
      label(m.id, m.n, m.id === 'laniakea' ? new T.Vector3() : o0 ? eq(o0.ra, o0.dec, o0.d / 10, new T.Vector3()).add(new T.Vector3(0, 6, 0)) : eq(25 + i * 40, 0, R, new T.Vector3()), m.id === 'laniakea' ? 'home' : 'mark', m);
    });
    U.OBJS.forEach(function (o) {   // les objets réels : un point lumineux à leur direction et distance comobile
      var p = eq(o.ra, o.dec, o.d / 10, new T.Vector3()), mk = U.MARKS.filter(function (m) { return m.id === o.mk; })[0];
      var g = OBS.system.glowMesh([[0, 1], [.2, .45], [1, 0]], mk ? mk.c : '#ffffff', .9); g.scale.setScalar(14); g.position.copy(p); marks.add(g);
      label(o.id, o.n, p, 'obj', o);
    });
    controls = L.controls = new T.OrbitControls(camera, OBS.engine.canvas);
    controls.enableDamping = true; controls.dampingFactor = .08; controls.screenSpacePanning = true; controls.zoomSpeed = .9; controls.rotateSpeed = .5;
    controls.minDistance = 5; controls.maxDistance = 4200; controls.enabled = false;
    controls.addEventListener('start', function () { flight = null; });
    var cv = OBS.engine.canvas, down = { x: 0, y: 0 };
    function pick(cx, cy) {
      var r = cv.getBoundingClientRect(), best = null, bd = 16 * 16;
      items.forEach(function (it) {
        if (it.tag) return; v3.copy(it.pos).project(camera); if (v3.z > 1) return;
        var x = (v3.x * .5 + .5) * r.width + r.left - cx, y = (-v3.y * .5 + .5) * r.height + r.top - cy, d = x * x + y * y;
        if (d < bd) { bd = d; best = it.id; }
      });
      return best;
    }
    cv.addEventListener('pointerdown', function (e) { down.x = e.clientX; down.y = e.clientY; });
    cv.addEventListener('pointerup', function (e) {
      if (OBS.engine.level !== L || e.button !== 0 || Math.hypot(e.clientX - down.x, e.clientY - down.y) > 6) return;
      var id = pick(e.clientX, e.clientY); if (id) L.select(id);
    });
    cv.addEventListener('pointermove', function (e) { if (OBS.engine.level !== L) return; var id = pick(e.clientX, e.clientY); hover = id; cv.classList.toggle('over', !!id); });
    cv.addEventListener('dblclick', function (e) {
      if (OBS.engine.level !== L) return;
      var id = pick(e.clientX, e.clientY);
      if (!id) { if (selected) L.select(null); return; }
      if (id === 'laniakea') OBS.engine.go('laniakea', { from: 'univers' }); else L.select(id);
    });
    var push = 0, pushT = 0;
    cv.addEventListener('wheel', function (e) {
      if (OBS.engine.level !== L || flight || e.deltaY >= 0 || selected !== 'laniakea') return;
      if (camera.position.distanceTo(controls.target) > 40) return;
      var now = performance.now(); if (now - pushT > 900) push = 0; pushT = now;
      if (++push >= 3) { push = 0; OBS.engine.go('laniakea', { from: 'univers' }); }
    }, { passive: true });
    U.load().then(function (J) { if (J) populate(J); else built = true; });
    quasars();
  };

  /* temps cosmique (js/ui/galtime.js) : l'expansion seule. Facteur d'échelle d'un univers plat avec matière et énergie noire
     (H0 = 67,4 km/s/Mpc, Ωm = 0,315, valeurs Planck : âge 13,8 milliards d'années) ; les galaxies dessinées aujourd'hui sont
     rapprochées ou éloignées d'autant. Leur formation et leurs mouvements propres ne sont pas représentés (signalé). */
  var timeView = false, H0g = 67.4 / 977.8, OMm = .315, OML = .685;
  function aOf(t) { return Math.pow(OMm / OML, 1 / 3) * Math.pow(Math.sinh(1.5 * Math.sqrt(OML) * H0g * t), 2 / 3); }
  var T0 = Math.asinh(Math.sqrt(OML / OMm)) / (1.5 * Math.sqrt(OML) * H0g);   // âge aujourd'hui (≈ 13,8 milliards d'années)
  L.age = T0;
  L.tSet = function (tGyr) {
    var a = Math.max(1e-4, aOf(Math.max(1e-4, tGyr)) / aOf(T0));
    web.scale.setScalar(a);
    return { a: a, temp: 2.7255 / a };
  };
  L.timeMode = function (on) {
    marks.visible = !on; items.forEach(function (it) { if (!it.home) it.el.style.display = on ? 'none' : ''; });
    timeView = on; if (on) L.select(null); else { web.scale.setScalar(1); L.select(null); }
  };
  function homeCam(out) { var el = 38 * D2R, d = 3600 / Math.max(.45, Math.min(1.3, camera.aspect)); return out.set(Math.cos(el) * d * .5, Math.sin(el) * d, Math.cos(el) * d * .87); }
  function ease(k) { return k < .5 ? 4 * k * k * k : 1 - Math.pow(-2 * k + 2, 3) / 2; }
  function viewDist(it) { if (!it && timeView) return 320; return it ? (it.home ? 60 : it.kind !== 'home' && it.kind !== 'mark' ? 140 : OBS.UN.OBJS.some(function (o) { return o.mk === it.id; }) ? 220 : Math.max(60, it.pos.length() * .45)) * Math.max(1, .95 / camera.aspect) : homeCam(tmp).length(); }
  function startFlight(id, dur) { flight = { t: 0, dur: dur || 2.4, id: id, fromOff: camera.position.clone().sub(controls.target), fromTgt: controls.target.clone() }; controls.enabled = false; }
  L.select = function (id) {
    if (id && !built) { pending = id; return; }
    selected = id && byId[id] ? id : null;
    startFlight(selected);
    OBS.emit('select', { level: 'univers', id: selected });
    OBS.emit('crumbs');
  };
  L.focus = L.select;
  L.selected = function () { return selected; };
  L.get = function (id) { return byId[id]; };
  L.homeId = 'laniakea';
  L.crumbs = function () {
    var c = [{ label: 'Univers observable', act: function () { L.select(null); }, current: !selected }];
    if (selected) c.push({ label: byId[selected].name, current: true });
    return c;
  };
  L.enter = function (opts) {
    L._inward = 0; controls.enabled = true; selected = null;
    if (opts.from === 'laniakea') { controls.target.set(0, 0, 0); camera.position.set(0, 50, 90); startFlight(null, 3.4); }
    else if (opts.from === 'au-dela') { controls.target.set(0, 0, 0); homeCam(camera.position).multiplyScalar(1.8); startFlight(null, 2.8); }
    else { homeCam(camera.position); controls.target.set(0, 0, 0); }
    if (opts.focus) L.select(opts.focus);
    OBS.emit('select', { level: 'univers', id: selected });
    OBS.emit('crumbs');
  };
  L.leave = function () { controls.enabled = false; };
  L.leaveAnim = function () { flight = null; controls.enabled = false; L._inward = 1; };
  L.resize = function (w, h, pr) { W = w; H = h; PR = pr; camera.aspect = W / H; camera.updateProjectionMatrix(); uniforms.forEach(function (u) { u.uPR.value = PR; }); };
  L.update = function (dt) {
    if (L._inward) { controls.target.multiplyScalar(Math.max(0, 1 - dt * 4)); camera.position.lerp(controls.target, Math.min(1, dt * 2.4)); }
    if (flight) {
      flight.t += dt;
      var k = Math.min(1, flight.t / flight.dur), e = ease(k), it = flight.id ? byId[flight.id] : null;
      var tgt = it ? it.pos : tmp2.set(0, 0, 0), dTo = viewDist(it), dFrom = Math.max(flight.fromOff.length(), .01);
      var dir = tmp.copy(flight.fromOff).normalize();
      if (!it) dir.lerp(homeCam(v3).normalize(), e).normalize();
      else if (!it.home) dir.lerp(v3.copy(it.pos).normalize().add(tmp2.set(0, .8, 0)).normalize(), e).normalize();   // un repère : on s'y rend en le regardant depuis un peu au-dessus de sa sphère
      controls.target.lerpVectors(flight.fromTgt, tgt, e);
      camera.position.copy(controls.target).addScaledVector(dir, Math.exp(Math.log(dFrom) * (1 - e) + Math.log(dTo) * e));
      if (k >= 1) { flight = null; controls.enabled = true; }
    }
    controls.update(); camera.updateMatrixWorld();
    var occ = [];
    items.filter(function (it) { return it.el; }).sort(function (a, b) {
      function pri(x) { return x.id === selected ? 100 : x.id === hover ? 90 : x.home ? 80 : 10; }
      return pri(b) - pri(a);
    }).forEach(function (it) {
      var el = it.el;
      camSpace.copy(it.pos).applyMatrix4(camera.matrixWorldInverse); v3.copy(it.pos).project(camera);
      var x = (v3.x * .5 + .5) * W, y = (-v3.y * .5 + .5) * H;
      var show = camSpace.z < 0 && x > -60 && x < W + 60 && y > -30 && y < H + 30;
      if (show) {
        if (!el._w) { el._w = el.offsetWidth || 90; el._h = el.offsetHeight || 22; }
        var box = { l: x + 10, t: y - el._h / 2, r: x + 10 + el._w, b: y + el._h / 2 };
        var clash = box.t < 96 || occ.some(function (o) { return box.l < o.r + 4 && box.r + 4 > o.l && box.t < o.b + 2 && box.b + 2 > o.t; });
        show = !clash || it.id === selected || it.id === hover;
        if (show) { occ.push(box); el.style.transform = 'translate(' + x.toFixed(1) + 'px,' + y.toFixed(1) + 'px)'; el.style.setProperty('--off', '10px'); }
      }
      el.classList.toggle('hid', !show);
      el.classList.toggle('active', it.id === selected);
      el.classList.toggle('hov', it.id === hover);
    });
  };
})();

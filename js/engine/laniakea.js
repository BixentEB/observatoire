/* ======================================================================
   OBSERVATOIRE — niveau « Laniakea » (Explorer, niveau 7 de la règle des échelles, lot 8)
   ≈ 40 000 galaxies du relevé 2MRS (data/laniakea.json, lu par js/ui/laniakea.js), jusqu'à ≈ 930 millions d'al.
   Repère supergalactique comme les niveaux 5 et 6 (SGX → x, SGZ → haut, SGY → −z). 1 unité = 1 Mpc ≈ 3,26 millions d'al.
   Distances tirées de la vitesse : approximation signalée. Seuls les grands amas nommés sont sélectionnables.
   ====================================================================== */
(function () {
  'use strict';
  var OBS = window.OBS = window.OBS || {};
  var T = window.THREE, D2R = Math.PI / 180, TAU = Math.PI * 2, MLY = 3.2616;
  var L = { id: 'laniakea', label: 'Laniakea' };
  OBS.laniakea = L;
  var scene = L.scene = new T.Scene();
  var camera = L.camera = new T.PerspectiveCamera(45, 1, 0.5, 20000);
  var controls, W = 800, H = 600, PR = 1;
  var basin = null, basinOn = true, items = [], byId = {}, selected = null, hover = null, flight = null, uniforms = [], built = false, pending = null;
  var tmp = new T.Vector3(), tmp2 = new T.Vector3(), v3 = new T.Vector3(), camSpace = new T.Vector3();
  var VERT = [
    'attribute float aSize; attribute vec3 aColor; uniform float uPR; varying vec3 vC;',
    'void main(){ vC=aColor; vec4 mv=modelViewMatrix*vec4(position,1.0); gl_PointSize=aSize*uPR; gl_Position=projectionMatrix*mv; }'
  ].join('\n');
  var FRAG = 'varying vec3 vC; void main(){ float d=length(gl_PointCoord-0.5); float a=1.0-smoothstep(0.12,0.5,d); gl_FragColor=vec4(vC*a,a); }';
  function sg(x, y, z, out) { return out.set(x, z, -y); }

  function populate(J) {
    var G = J.g, n = G.length, P = new Float32Array(n * 3), C = new Float32Array(n * 3), Z = new Float32Array(n);
    G.forEach(function (g, i) {
      var x = g[0] / 10, y = g[1] / 10, z = g[2] / 10, m = g[3] / 10, d = Math.hypot(x, y, z), t = Math.min(1, d / 290);
      sg(x, y, z, tmp); P[i * 3] = tmp.x; P[i * 3 + 1] = tmp.y; P[i * 3 + 2] = tmp.z;
      var a = (m < 10 ? .95 : .6) * (.3 + .7 * t);   // les proches, très nombreuses, plus pâles : sinon le centre sature
      C[i * 3] = (255 - 120 * t) / 255 * a; C[i * 3 + 1] = (225 - 60 * t) / 255 * a; C[i * 3 + 2] = (170 + 85 * t) / 255 * a;
      Z[i] = Math.max(1.4, Math.min(4.5, 1.4 + (11.75 - m) * .7));
    });
    var geo = new T.BufferGeometry();
    geo.setAttribute('position', new T.BufferAttribute(P, 3)); geo.setAttribute('aColor', new T.BufferAttribute(C, 3)); geo.setAttribute('aSize', new T.BufferAttribute(Z, 1));
    var un = { uPR: { value: PR } }; uniforms.push(un);
    var pts = new T.Points(geo, new T.ShaderMaterial({ uniforms: un, vertexShader: VERT, fragmentShader: FRAG, transparent: true, depthWrite: false, blending: T.AdditiveBlending }));
    pts.frustumCulled = false; scene.add(pts);
    J.amas.forEach(function (a) {
      var it = { id: a.id, def: a, name: a.n, pos: sg(a.x, a.y, a.z, new T.Vector3()) };
      var el = document.createElement('button'); el.type = 'button'; el.className = 'lbl is-moon';
      el.innerHTML = '<span class="dot"></span><span class="nm">' + OBS.esc(a.n) + '</span>';
      el.addEventListener('click', function (e) { e.stopPropagation(); L.select(a.id); });
      el.addEventListener('pointerenter', function () { hover = a.id; });
      el.addEventListener('pointerleave', function () { if (hover === a.id) hover = null; });
      L.labelsEl.appendChild(el); it.el = el; items.push(it); byId[a.id] = it;
      var gl = OBS.system.glowMesh([[0, .7], [.35, .25], [1, 0]], 0xf4c77a, .5); gl.scale.setScalar(8); gl.position.copy(it.pos); scene.add(gl);
    });
    // le Superamas local : l'étage précédent, au centre
    var home = { id: 'superamas-local', def: { n: 'Superamas local', home: true, x: 0, y: 0, z: 0 }, name: 'Superamas local', home: true, pos: new T.Vector3() };
    var he = document.createElement('button'); he.type = 'button'; he.className = 'lbl is-sun';
    he.innerHTML = '<span class="dot"></span><span class="nm">Superamas local <em>vous êtes ici</em></span>';
    he.addEventListener('click', function (e) { e.stopPropagation(); if (selected === 'superamas-local' && !flight) OBS.engine.go('superamas', { from: 'laniakea' }); else L.select('superamas-local'); });
    L.labelsEl.appendChild(he); home.el = he; items.push(home); byId[home.id] = home;
    built = true;
    if (pending) { var p = pending; pending = null; L.select(p); }
  }

  L.build = function (renderer, labelsContainer) {
    L.labelsEl = labelsContainer;
    [250, 500, 750].forEach(function (r) {
      var R = r / MLY, pts = []; for (var i = 0; i <= 240; i++) { var t = i / 240 * TAU; pts.push(new T.Vector3(Math.cos(t) * R, 0, Math.sin(t) * R)); }
      scene.add(new T.Line(new T.BufferGeometry().setFromPoints(pts), new T.LineBasicMaterial({ color: 0x7f8fd0, transparent: true, opacity: .12, depthWrite: false })));
      var tag = document.createElement('span'); tag.className = 'ring-tag'; tag.textContent = r + ' millions d\'al';
      labelsContainer.appendChild(tag); items.push({ tag: true, el: tag, pos: new T.Vector3(0, 0, R) });
    });
    var sa = OBS.system.glowMesh([[0, .3], [.7, .1], [1, 0]], 0xffd27a, .45); sa.scale.setScalar(100); scene.add(sa);   // Superamas local, ≈ 50 Mpc de rayon

    controls = L.controls = new T.OrbitControls(camera, OBS.engine.canvas);
    controls.enableDamping = true; controls.dampingFactor = .08; controls.screenSpacePanning = true; controls.zoomSpeed = .9; controls.rotateSpeed = .5;
    controls.minDistance = 4; controls.maxDistance = 1500; controls.enabled = false;
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
      if (id === 'superamas-local') OBS.engine.go('superamas', { from: 'laniakea' }); else L.select(id);
    });
    var push = 0, pushT = 0;
    cv.addEventListener('wheel', function (e) {
      if (OBS.engine.level !== L || flight || e.deltaY >= 0 || selected !== 'superamas-local') return;
      if (camera.position.distanceTo(controls.target) > 30) return;
      var now = performance.now(); if (now - pushT > 900) push = 0; pushT = now;
      if (++push >= 3) { push = 0; OBS.engine.go('superamas', { from: 'laniakea' }); }
    }, { passive: true });
    OBS.LK.load().then(function (J) { if (J) populate(J); });
    OBS.LK.loadBasin().then(function (B) { if (B) addBasin(B); });
  };

  /* contour de Laniakea (bord du bassin d'attraction, voxels de 11 Mpc) et lignes d'écoulement vers son attracteur :
     reconstitution d'après le champ de vitesses CosmicFlows-4 (Dupuy et Courtois 2023), data/laniakea-bassin.json */
  function addBasin(B) {
    basin = new T.Group();
    var n = B.bord.length, P = new Float32Array(n * 3), C = new Float32Array(n * 3), Z = new Float32Array(n);
    B.bord.forEach(function (q, i) { sg(q[0] / 10, q[1] / 10, q[2] / 10, tmp); P[i * 3] = tmp.x; P[i * 3 + 1] = tmp.y; P[i * 3 + 2] = tmp.z; C[i * 3] = .32; C[i * 3 + 1] = .24; C[i * 3 + 2] = .11; Z[i] = 5; });
    var geo = new T.BufferGeometry(); geo.setAttribute('position', new T.BufferAttribute(P, 3)); geo.setAttribute('aColor', new T.BufferAttribute(C, 3)); geo.setAttribute('aSize', new T.BufferAttribute(Z, 1));
    var un = { uPR: { value: PR } }; uniforms.push(un);
    var shell = new T.Points(geo, new T.ShaderMaterial({ uniforms: un, vertexShader: VERT, fragmentShader: FRAG, transparent: true, depthWrite: false, blending: T.AdditiveBlending }));
    shell.frustumCulled = false; basin.add(shell);
    (B.flux || []).forEach(function (L) {
      var pts = L.map(function (q) { return sg(q[0] / 10, q[1] / 10, q[2] / 10, new T.Vector3()); }), cols = [];
      pts.forEach(function (p, i) { var t = i / Math.max(1, pts.length - 1); cols.push(.25 + .65 * t, .2 + .5 * t, .08 + .2 * t); });   // pâle au départ, plus vive vers l'attracteur
      var g = new T.BufferGeometry().setFromPoints(pts); g.setAttribute('color', new T.Float32BufferAttribute(cols, 3));
      basin.add(new T.Line(g, new T.LineBasicMaterial({ vertexColors: true, transparent: true, opacity: .7, depthWrite: false, blending: T.AdditiveBlending })));
    });
    if (B.attracteur) {   // l'attracteur de Laniakea (Dupuy et Courtois 2023), là où convergent les lignes
      var ap = sg(B.attracteur[0] / 10, B.attracteur[1] / 10, B.attracteur[2] / 10, new T.Vector3());
      var ag = OBS.system.glowMesh([[0, .9], [.25, .35], [1, 0]], 0xffe2a0, .7); ag.scale.setScalar(14); ag.position.copy(ap); basin.add(ag);
      var at = document.createElement('span'); at.className = 'ring-tag halo-tag'; at.style.color = '#ffe2a0'; at.textContent = '✦ attracteur de Laniakea';
      L.labelsEl.appendChild(at); items.push({ tag: true, el: at, pos: ap, basin: true });
    }
    basin.visible = basinOn; scene.add(basin);
    var tag = document.createElement('span'); tag.className = 'ring-tag halo-tag'; tag.style.color = '#f4c77a'; tag.textContent = 'Laniakea : contour du bassin (reconstitution)';
    L.labelsEl.appendChild(tag);
    var far = null; B.bord.forEach(function (q) { if (!far || q[1] < far[1]) far = q; });          // un point du bord, pour y poser l'étiquette
    items.push({ tag: true, el: tag, pos: sg(far[0] / 10, far[1] / 10, far[2] / 10, new T.Vector3()), basin: true });
  }
  L.setBasin = function (on) { basinOn = on; if (basin) basin.visible = on; items.forEach(function (it) { if (it.basin) it.el.style.display = on ? '' : 'none'; }); };
  function homeCam(out) { var el = 34 * D2R, d = 820 / Math.max(.45, Math.min(1.3, camera.aspect)); return out.set(Math.cos(el) * d * .5, Math.sin(el) * d, Math.cos(el) * d * .87); }
  function ease(k) { return k < .5 ? 4 * k * k * k : 1 - Math.pow(-2 * k + 2, 3) / 2; }
  function viewDist(it) { return it ? (it.home ? 160 : 70) * Math.max(1, .95 / camera.aspect) : homeCam(tmp).length(); }
  function startFlight(id, dur) { flight = { t: 0, dur: dur || 2.2, id: id, fromOff: camera.position.clone().sub(controls.target), fromTgt: controls.target.clone() }; controls.enabled = false; }
  L.select = function (id) {
    if (id && !built) { pending = id; return; }
    selected = id && byId[id] ? id : null;
    startFlight(selected);
    OBS.emit('select', { level: 'laniakea', id: selected });
    OBS.emit('crumbs');
  };
  L.focus = L.select;
  L.selected = function () { return selected; };
  L.get = function (id) { return byId[id]; };
  L.homeId = 'superamas-local';
  L.crumbs = function () {
    var c = [{ label: 'Laniakea', act: function () { L.select(null); }, current: !selected }];
    if (selected) c.push({ label: byId[selected].name, current: true });
    return c;
  };
  L.enter = function (opts) {
    L._inward = 0; controls.enabled = true; selected = null;
    if (opts.from === 'superamas') { controls.target.set(0, 0, 0); camera.position.set(0, 90, 160); startFlight(null, 3); }
    else { homeCam(camera.position); controls.target.set(0, 0, 0); }
    if (opts.focus) L.select(opts.focus);
    OBS.emit('select', { level: 'laniakea', id: selected });
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
      controls.target.lerpVectors(flight.fromTgt, tgt, e);
      camera.position.copy(controls.target).addScaledVector(dir, Math.exp(Math.log(dFrom) * (1 - e) + Math.log(dTo) * e));
      if (k >= 1) { flight = null; controls.enabled = true; }
    }
    controls.update(); camera.updateMatrixWorld();
    var occ = [];
    items.filter(function (it) { return it.el; }).sort(function (a, b) {
      function pri(x) { return x.tag ? -1 : x.id === selected ? 100 : x.id === hover ? 90 : x.home ? 80 : 10; }
      return pri(b) - pri(a);
    }).forEach(function (it) {
      var el = it.el;
      camSpace.copy(it.pos).applyMatrix4(camera.matrixWorldInverse); v3.copy(it.pos).project(camera);
      var x = (v3.x * .5 + .5) * W, y = (-v3.y * .5 + .5) * H;
      var show = camSpace.z < 0 && x > -60 && x < W + 60 && y > -30 && y < H + 30;
      if (it.tag) { el.hidden = !show; if (show) el.style.transform = 'translate(' + x.toFixed(1) + 'px,' + y.toFixed(1) + 'px)'; return; }
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

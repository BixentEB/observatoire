/* ======================================================================
   OBSERVATOIRE — niveau « Superamas local » (Explorer, niveau 6 de la règle des échelles, lot 7)
   8 779 groupes et galaxies isolées du catalogue de Kourkchi et Tully 2017 (data/superamas.json, lu par js/ui/superamas.js),
   à leurs positions supergalactiques, jusqu'à ≈ 60 Mpc.
   Repère : comme le Volume local, le plan horizontal est le plan supergalactique (SGX → x, SGZ → haut, SGY → −z).
   Échelle linéaire : 1 unité = 1 Mpc / 10 ≈ 326 000 années-lumière. Le Groupe local est au centre.
   Chaque point est un groupe entier (taille selon le nombre de galaxies, couleur selon la richesse) :
   le Volume local de l'étage précédent tient dans la petite bulle dorée autour du centre.
   ====================================================================== */
(function () {
  'use strict';
  var OBS = window.OBS = window.OBS || {};
  var T = window.THREE, D2R = Math.PI / 180, TAU = Math.PI * 2;
  var K = 10, MLY = 3.2616;                           // 1 Mpc = 10 unités
  var L = { id: 'superamas', label: 'Superamas local' };
  OBS.superamas = L;
  var scene = L.scene = new T.Scene();
  var camera = L.camera = new T.PerspectiveCamera(45, 1, 0.5, 20000);
  var controls, W = 800, H = 600, PR = 1;
  var items = [], byId = {}, selected = null, hover = null, flight = null, uniforms = [], built = false, pending = null;
  var tmp = new T.Vector3(), tmp2 = new T.Vector3(), v3 = new T.Vector3(), camSpace = new T.Vector3();
  var VERT = [
    'attribute float aSize; attribute vec3 aColor; uniform float uPR; varying vec3 vC;',
    'void main(){ vC=aColor; vec4 mv=modelViewMatrix*vec4(position,1.0); gl_PointSize=aSize*uPR; gl_Position=projectionMatrix*mv; }'
  ].join('\n');
  var FRAG = 'varying vec3 vC; void main(){ float d=length(gl_PointCoord-0.5); float a=1.0-smoothstep(0.12,0.5,d); gl_FragColor=vec4(vC*a,a); }';
  function hexRGB(h) { var n = parseInt(h.slice(1), 16); return [(n >> 16 & 255) / 255, (n >> 8 & 255) / 255, (n & 255) / 255]; }
  function pos(g, out) { return out.set(g.x * K, g.z * K, -g.y * K); }
  var HOME = '2557';                                   // galaxie principale du Groupe local dans le catalogue (Andromède)

  function populate(J) {
    var S = OBS.SC, G = J.groupes, n = G.length;
    var P = new Float32Array(n * 3), C = new Float32Array(n * 3), Z = new Float32Array(n);
    G.forEach(function (g, i) {
      pos(g, tmp); P[i * 3] = tmp.x; P[i * 3 + 1] = tmp.y; P[i * 3 + 2] = tmp.z;
      var t = S.tier(g.k), c = hexRGB(S.TIERS[t][0]), dim = t === 3 ? .55 : t === 2 ? .8 : 1;
      C[i * 3] = c[0] * dim; C[i * 3 + 1] = c[1] * dim; C[i * 3 + 2] = c[2] * dim;
      Z[i] = g.k === 1 ? 2 : Math.min(18, 2.6 + Math.sqrt(g.k) * 1.1);
    });
    var geo = new T.BufferGeometry();
    geo.setAttribute('position', new T.BufferAttribute(P, 3)); geo.setAttribute('aColor', new T.BufferAttribute(C, 3)); geo.setAttribute('aSize', new T.BufferAttribute(Z, 1));
    var un = { uPR: { value: PR } }; uniforms.push(un);
    var pts = new T.Points(geo, new T.ShaderMaterial({ uniforms: un, vertexShader: VERT, fragmentShader: FRAG, transparent: true, depthWrite: false, blending: T.AdditiveBlending }));
    pts.frustumCulled = false; scene.add(pts);
    // sélectionnables : les groupes d'au moins 5 galaxies et les groupes nommés (les 7 000 galaxies isolées restent des points)
    G.forEach(function (g) {
      if (g.k < 5 && !S.NAMES[g.n]) return;
      var id = 'pgc' + g.n, home = g.n === HOME, named = !!S.NAMES[g.n];
      var it = { id: id, def: g, name: S.name(g), pos: pos(g, new T.Vector3()), home: home, show: home || named || g.k >= 50 };
      if (it.show) {
        var el = document.createElement('button'); el.type = 'button'; el.className = 'lbl' + (home ? ' is-sun' : ' is-moon');
        el.innerHTML = '<span class="dot"></span><span class="nm">' + OBS.esc(it.name) + (home ? ' <em>vous êtes ici</em>' : '') + '</span>';
        el.addEventListener('click', function (e) { e.stopPropagation(); clickItem(id); });
        el.addEventListener('pointerenter', function () { hover = id; });
        el.addEventListener('pointerleave', function () { if (hover === id) hover = null; });
        L.labelsEl.appendChild(el); it.el = el;
      }
      items.push(it); byId[id] = it;
    });
    built = true;
    if (pending) { var p = pending; pending = null; L.select(p); }
  }

  L.build = function (renderer, labelsContainer) {
    L.labelsEl = labelsContainer;
    // repères : 25, 50, 100 et 150 millions d'années-lumière dans le plan supergalactique
    [25, 50, 100, 150].forEach(function (r) {
      var R = r / MLY * K, pts = []; for (var i = 0; i <= 240; i++) { var t = i / 240 * TAU; pts.push(new T.Vector3(Math.cos(t) * R, 0, Math.sin(t) * R)); }
      scene.add(new T.Line(new T.BufferGeometry().setFromPoints(pts), new T.LineBasicMaterial({ color: 0x7f8fd0, transparent: true, opacity: .12, depthWrite: false })));
      var tag = document.createElement('span'); tag.className = 'ring-tag'; tag.textContent = r + ' millions d\'al';
      labelsContainer.appendChild(tag); items.push({ tag: true, el: tag, pos: new T.Vector3(0, 0, R) });
    });
    // le Volume local (étage précédent, ≈ 11 Mpc) en bulle dorée très légère
    var vl = OBS.system.glowMesh([[0, .35], [.6, .12], [1, 0]], 0xffd27a, .45); vl.scale.setScalar(11 * K * 2); scene.add(vl);
    var tagV = document.createElement('span'); tagV.className = 'ring-tag halo-tag'; tagV.textContent = 'Volume local'; tagV.style.color = '#f4c77a';
    labelsContainer.appendChild(tagV); items.push({ tag: true, el: tagV, pos: new T.Vector3(0, -11 * K * .8, 0) });

    controls = L.controls = new T.OrbitControls(camera, OBS.engine.canvas);
    controls.enableDamping = true; controls.dampingFactor = .08; controls.screenSpacePanning = true; controls.zoomSpeed = .9; controls.rotateSpeed = .5;
    controls.minDistance = 6; controls.maxDistance = 2600; controls.enabled = false;
    controls.addEventListener('start', function () { flight = null; });
    var cv = OBS.engine.canvas, down = { x: 0, y: 0 };
    function pick(cx, cy) {           // le groupe le plus proche du pointeur, à moins de 14 px
      var r = cv.getBoundingClientRect(), best = null, bd = 14 * 14;
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
      var id = pick(e.clientX, e.clientY); if (id) clickItem(id);
    });
    cv.addEventListener('pointermove', function (e) { if (OBS.engine.level !== L) return; var id = pick(e.clientX, e.clientY); hover = id; cv.classList.toggle('over', !!id); });
    cv.addEventListener('dblclick', function (e) {
      if (OBS.engine.level !== L) return;
      var id = pick(e.clientX, e.clientY);
      if (!id) { if (selected) L.select(null); return; }
      if (byId[id].home) OBS.engine.go('volume-local', { from: 'superamas' }); else L.select(id);
    });
    var push = 0, pushT = 0;
    cv.addEventListener('wheel', function (e) {          // zoom avant sur le Groupe local, en insistant : on entre dans le Volume local
      if (OBS.engine.level !== L || flight || e.deltaY >= 0 || selected !== 'pgc' + HOME) return;
      if (camera.position.distanceTo(controls.target) > 20) return;
      var now = performance.now(); if (now - pushT > 900) push = 0; pushT = now;
      if (++push >= 3) { push = 0; OBS.engine.go('volume-local', { from: 'superamas' }); }
    }, { passive: true });
    OBS.SC.load().then(function (J) { if (J) populate(J); });
  };

  function clickItem(id) {
    if (id === selected && byId[id].home && !flight) { OBS.engine.go('volume-local', { from: 'superamas' }); return; }
    L.select(id);
  }
  function homeCam(out) { var el = 34 * D2R, d = 1500 / Math.max(.45, Math.min(1.3, camera.aspect)); return out.set(Math.cos(el) * d * .5, Math.sin(el) * d, Math.cos(el) * d * .87); }
  function ease(k) { return k < .5 ? 4 * k * k * k : 1 - Math.pow(-2 * k + 2, 3) / 2; }
  function viewDist(it) { return it ? (it.home ? 40 : 30 + Math.sqrt(it.def.k) * 8) * Math.max(1, .95 / camera.aspect) : homeCam(tmp).length(); }
  function startFlight(id, dur) { flight = { t: 0, dur: dur || 2.2, id: id, fromOff: camera.position.clone().sub(controls.target), fromTgt: controls.target.clone() }; controls.enabled = false; }
  L.select = function (id) {
    if (id && !built) { pending = id; return; }
    selected = id && byId[id] ? id : null;
    startFlight(selected);
    OBS.emit('select', { level: 'superamas', id: selected });
    OBS.emit('crumbs');
  };
  L.focus = L.select;
  L.selected = function () { return selected; };
  L.get = function (id) { return byId[id]; };
  L.homeId = 'pgc' + HOME;
  L.crumbs = function () {
    var c = [{ label: 'Superamas local', act: function () { L.select(null); }, current: !selected }];
    if (selected) c.push({ label: byId[selected].name, current: true });
    return c;
  };
  L.enter = function (opts) {
    L._inward = 0; controls.enabled = true; selected = null;
    if (opts.from === 'volume-local') { controls.target.set(0, 0, 0); camera.position.set(0, 60, 110); startFlight(null, 3); }
    else { homeCam(camera.position); controls.target.set(0, 0, 0); }
    if (opts.focus) L.select(opts.focus);
    OBS.emit('select', { level: 'superamas', id: selected });
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
    var occ = [], sel = selected && byId[selected], hov = hover && byId[hover];
    [sel, hov].forEach(function (it) {
      if (it && !it.el) { var el = document.createElement('button'); el.type = 'button'; el.className = 'lbl is-moon'; el.innerHTML = '<span class="dot"></span><span class="nm">' + OBS.esc(it.name) + '</span>'; L.labelsEl.appendChild(el); it.el = el; it.tmp = true; }
    });
    items.forEach(function (it) { if (it.tmp && it !== sel && it !== hov && it.el) { it.el.remove(); it.el = null; it.tmp = false; } });
    items.filter(function (it) { return it.el; }).sort(function (a, b) {
      function pri(x) { return x.tag ? -1 : x.id === selected ? 1e6 : x.id === hover ? 9e5 : x.home ? 8e5 : (OBS.SC.NAMES[x.def.n] ? 1e4 : 0) + x.def.k; }
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

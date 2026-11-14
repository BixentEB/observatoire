/* ======================================================================
   OBSERVATOIRE — niveau « Volume local » (Explorer, niveau 5 de la règle des échelles)
   869 galaxies du catalogue de Karachentsev et al. 2013 (data/volume-local.json), à leurs positions mesurées.
   Repère supergalactique : le plan horizontal est celui de la Feuille locale (SGX → x, SGZ → haut, SGY → −z).
   Échelle linéaire : 1 unité = 100 000 années-lumière. Le Groupe local est au centre.
   Les galaxies sont des points (taille selon la luminosité K, couleur selon le groupe) : à cette échelle, même
   Andromède ne fait que quelques pixels ; leur aspect n'est pas représenté.
   ====================================================================== */
(function () {
  'use strict';
  var OBS = window.OBS = window.OBS || {};
  var T = window.THREE, D2R = Math.PI / 180, TAU = Math.PI * 2;
  var MLY = 3.2616, K = MLY * 10;                     // 1 Mpc = 3,26 M al = 32,6 unités
  var L = { id: 'volume-local', label: 'Volume local' };
  OBS.volumelocal = L;
  var scene = L.scene = new T.Scene();
  var camera = L.camera = new T.PerspectiveCamera(45, 1, 0.5, 20000);
  var controls, W = 800, H = 600, PR = 1, tanHalf = Math.tan(22.5 * D2R);
  var GH = [], groupMode = 'halos', items = [], byId = {}, selected = null, hover = null, flight = null, uniforms = [], built = false, pending = null;
  var tmp = new T.Vector3(), tmp2 = new T.Vector3(), v3 = new T.Vector3(), camSpace = new T.Vector3();
  var VERT = [
    'attribute float aSize; attribute vec3 aColor; uniform float uPR; varying vec3 vC;',
    'void main(){ vC=aColor; vec4 mv=modelViewMatrix*vec4(position,1.0); gl_PointSize=aSize*uPR; gl_Position=projectionMatrix*mv; }'
  ].join('\n');
  var FRAG = 'varying vec3 vC; void main(){ float d=length(gl_PointCoord-0.5); float a=1.0-smoothstep(0.12,0.5,d); gl_FragColor=vec4(vC*a,a); }';
  function hexRGB(h) { var n = parseInt(h.slice(1), 16); return [(n >> 16 & 255) / 255, (n >> 8 & 255) / 255, (n & 255) / 255]; }
  function pos(g, out) { return out.set(g.x * K, g.z * K, -g.y * K); }

  function populate(J) {
    var V = OBS.VL, G = J.galaxies, n = G.length;
    var P = new Float32Array(n * 3), C = new Float32Array(n * 3), S = new Float32Array(n);
    G.forEach(function (g, i) {
      pos(g, tmp); P[i * 3] = tmp.x; P[i * 3 + 1] = tmp.y; P[i * 3 + 2] = tmp.z;
      var c = hexRGB(V.col(V.grp(g))); C[i * 3] = c[0]; C[i * 3 + 1] = c[1]; C[i * 3 + 2] = c[2];
      S[i] = g.lk ? Math.max(2.2, Math.min(11, (g.lk - 5.5) * 1.6)) : 2.2;
    });
    var geo = new T.BufferGeometry();
    geo.setAttribute('position', new T.BufferAttribute(P, 3)); geo.setAttribute('aColor', new T.BufferAttribute(C, 3)); geo.setAttribute('aSize', new T.BufferAttribute(S, 1));
    var un = { uPR: { value: PR } }; uniforms.push(un);
    var pts = new T.Points(geo, new T.ShaderMaterial({ uniforms: un, vertexShader: VERT, fragmentShader: FRAG, transparent: true, depthWrite: false, blending: T.AdditiveBlending }));
    pts.frustumCulled = false; scene.add(pts);
    // galaxies sélectionnables : toutes ; étiquetées en permanence : les plus brillantes et le Groupe local
    var bright = G.filter(function (g) { return g.lk !== undefined; }).sort(function (a, b) { return b.lk - a.lk; }).slice(0, 34).map(function (g) { return g.n; });
    G.forEach(function (g) {
      var id = V.slug(g.n), home = id === 'milkyway';
      if (byId[id]) return;
      var it = { id: id, def: g, name: home ? 'Groupe local' : V.nm(g.n), pos: pos(g, new T.Vector3()), home: home, group: V.grp(g), show: home || bright.indexOf(g.n) >= 0 };
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
    /* halos des groupes : reconstitution — la zone occupée par les membres mesurés de chaque groupe (galaxies liées
       à une même grande galaxie dans le catalogue), pas un nuage visible dans le ciel. Rayon : 80 % des membres, un peu élargi. */
    V.groups.forEach(function (gd, gi) {
      if (gi === 0) return;                              // le Groupe local a déjà son halo doré
      var m = items.filter(function (it) { return it.group === gi; }); if (m.length < 3) return;
      var c = new T.Vector3(); m.forEach(function (it) { c.add(it.pos); }); c.multiplyScalar(1 / m.length);
      var d = m.map(function (it) { return it.pos.distanceTo(c); }).sort(function (a, b) { return a - b; });
      var r = Math.max(5, d[Math.floor(d.length * .8)] * 1.25);
      var mesh = OBS.system.glowMesh([[0, .5], [.45, .26], [.8, .08], [1, 0]], gd[2], 0); mesh.scale.setScalar(r * 2); mesh.position.copy(c); mesh.renderOrder = -1; scene.add(mesh);
      var tag = document.createElement('span'); tag.className = 'ring-tag halo-tag gh-tag'; tag.textContent = gd[1] + ' · ' + m.length + ' galaxies'; tag.style.color = gd[2];
      L.labelsEl.appendChild(tag); var ti = { tag: true, el: tag, pos: c.clone().add(new T.Vector3(0, -r * .75, 0)) }; items.push(ti);
      GH.push({ gi: gi, mesh: mesh, tag: tag, op: 0 });
    });
    // le Groupe local en halo doré, repérable de loin
    var gl = OBS.system.glowMesh([[0, .9], [.3, .25], [1, 0]], 0xffd27a, .6); gl.scale.setScalar(50);            // ≈ 5 millions d'al : l'étendue du Groupe local scene.add(gl);
    built = true;
    if (pending) { var p = pending; pending = null; L.select(p); }
  }

  L.setGroups = function (m) { groupMode = m; };
  L.build = function (renderer, labelsContainer) {
    L.labelsEl = labelsContainer;
    // repères : 10, 20 et 30 millions d'années-lumière dans le plan de la Feuille locale
    [10, 20, 30].forEach(function (r) {
      var R = r * 10, pts = []; for (var i = 0; i <= 200; i++) { var t = i / 200 * TAU; pts.push(new T.Vector3(Math.cos(t) * R, 0, Math.sin(t) * R)); }
      scene.add(new T.Line(new T.BufferGeometry().setFromPoints(pts), new T.LineBasicMaterial({ color: 0x7f8fd0, transparent: true, opacity: .12, depthWrite: false })));
      var tag = document.createElement('span'); tag.className = 'ring-tag'; tag.textContent = r + ' millions d\'al';
      labelsContainer.appendChild(tag); items.push({ tag: true, el: tag, pos: new T.Vector3(0, 0, R) });
    });
    // direction de l'amas de la Vierge (hors du volume, ≈ 54 M al)
    var vir = new T.Vector3(-3.7 * K, -.7 * K, -16 * K).normalize().multiplyScalar(360);
    var tagV = document.createElement('span'); tagV.className = 'ring-tag halo-tag'; tagV.textContent = 'vers l\'amas de la Vierge →';
    labelsContainer.appendChild(tagV); items.push({ tag: true, el: tagV, pos: vir });

    controls = L.controls = new T.OrbitControls(camera, OBS.engine.canvas);
    controls.enableDamping = true; controls.dampingFactor = .08; controls.screenSpacePanning = true; controls.zoomSpeed = .9; controls.rotateSpeed = .5;
    controls.minDistance = 4; controls.maxDistance = 1400; controls.enabled = false;
    controls.addEventListener('start', function () { flight = null; });
    var cv = OBS.engine.canvas, down = { x: 0, y: 0 };
    function pick(cx, cy) {           // la galaxie la plus proche du pointeur, à moins de 14 px
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
      if (byId[id].home || byId[id].group === 0) OBS.engine.go('groupe-local', { from: 'volume-local' }); else L.select(id);
    });
    var push = 0, pushT = 0;
    cv.addEventListener('wheel', function (e) {          // zoom avant sur le Groupe local, en insistant : on y entre
      if (OBS.engine.level !== L || flight || e.deltaY >= 0 || selected !== 'milkyway') return;
      if (camera.position.distanceTo(controls.target) > 14) return;
      var now = performance.now(); if (now - pushT > 900) push = 0; pushT = now;
      if (++push >= 3) { push = 0; OBS.engine.go('groupe-local', { from: 'volume-local' }); }
    }, { passive: true });
    OBS.VL.load().then(function (J) { if (J) populate(J); });
  };

  function clickItem(id) {
    if (id === selected && byId[id].home && !flight) { OBS.engine.go('groupe-local', { from: 'volume-local' }); return; }
    L.select(id);
  }
  function homeCam(out) { var el = 32 * D2R, d = 760 / Math.max(.45, Math.min(1.3, camera.aspect)); return out.set(Math.cos(el) * d * .5, Math.sin(el) * d, Math.cos(el) * d * .87); }
  function ease(k) { return k < .5 ? 4 * k * k * k : 1 - Math.pow(-2 * k + 2, 3) / 2; }
  function viewDist(it) { return it ? (it.home ? 30 : 60) * Math.max(1, .95 / camera.aspect) : homeCam(tmp).length(); }
  function startFlight(id, dur) { flight = { t: 0, dur: dur || 2.2, id: id, fromOff: camera.position.clone().sub(controls.target), fromTgt: controls.target.clone() }; controls.enabled = false; }
  L.select = function (id) {
    if (id && !built) { pending = id; return; }
    selected = id && byId[id] ? id : null;
    startFlight(selected);
    OBS.emit('select', { level: 'volume-local', id: selected });
    OBS.emit('crumbs');
  };
  L.focus = L.select;
  L.selected = function () { return selected; };
  L.get = function (id) { return byId[id]; };
  L.crumbs = function () {
    var c = [{ label: 'Volume local', act: function () { L.select(null); }, current: !selected }];
    if (selected) c.push({ label: byId[selected].name, current: true });
    return c;
  };
  L.enter = function (opts) {
    L._inward = 0; controls.enabled = true; selected = null;
    if (opts.from === 'groupe-local') { controls.target.set(0, 0, 0); camera.position.set(0, 10, 16); startFlight(null, 3); }
    else if (opts.from === 'superamas') { controls.target.set(0, 0, 0); homeCam(camera.position).multiplyScalar(2.6); startFlight(null, 2.6); }   // on plonge depuis le Superamas local
    else { homeCam(camera.position); controls.target.set(0, 0, 0); }
    if (opts.focus) L.select(opts.focus);
    OBS.emit('select', { level: 'volume-local', id: selected });
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
    // halos des groupes : tous (réglage « Halos »), seulement celui de la galaxie survolée ou choisie (« Au survol »), ou aucun
    var act = (hov && hov.group >= 0 && hov.group) || (sel && sel.group >= 0 && sel.group) || null;
    GH.forEach(function (h) {
      var on = groupMode === 'halos' ? (act === h.gi ? .6 : .3) : groupMode === 'survol' ? (act === h.gi ? .5 : 0) : 0;
      h.op += (on - h.op) * Math.min(1, dt * 5); h.mesh.material.uniforms.uOpacity.value = h.op; h.mesh.visible = h.op > .005;
      h.tag.style.opacity = act === h.gi && groupMode !== 'couleurs' ? '1' : '0';   // le nom du groupe : seulement pour celui qu'on survole
    });
    // l'astre choisi ou survolé reçoit une étiquette même s'il n'en a pas en permanence
    [sel, hov].forEach(function (it) {
      if (it && !it.el) { var el = document.createElement('button'); el.type = 'button'; el.className = 'lbl is-moon'; el.innerHTML = '<span class="dot"></span><span class="nm">' + OBS.esc(it.name) + '</span>'; L.labelsEl.appendChild(el); it.el = el; it.tmp = true; }
    });
    items.forEach(function (it) { if (it.tmp && it !== sel && it !== hov && it.el) { it.el.remove(); it.el = null; it.tmp = false; } });
    items.filter(function (it) { return it.el; }).sort(function (a, b) {
      function pri(x) { return x.tag ? -1 : x.id === selected ? 100 : x.id === hover ? 90 : x.home ? 80 : (x.def.lk || 0); }
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

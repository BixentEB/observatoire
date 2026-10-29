/* ======================================================================
   OBSERVATOIRE — niveau « Système d'une étoile voisine »
   On entre dans une étoile du voisinage : l'étoile elle-même (couleur selon son type, taille selon
   son rayon réel, compressé), sa compagne s'il s'agit d'un système double, et ses planètes confirmées.
   Réel : périodes mesurées, masses minimales, distances déduites par la troisième loi de Kepler.
   Simulé : l'aspect des planètes (inconnu) et leur position sur l'orbite (non calculée).
   Adapté : distances compressées comme dans le système solaire, tailles agrandies.
   ====================================================================== */
(function () {
  'use strict';
  var OBS = window.OBS = window.OBS || {};
  var T = window.THREE, G = OBS.GLSL, D2R = Math.PI / 180, TAU = Math.PI * 2;

  var L = { id: 'etoile', label: 'Système stellaire' };
  OBS.starsystem = L;
  var scene = L.scene = new T.Scene();
  var camera = L.camera = new T.PerspectiveCamera(40, 1, 0.02, 60000);
  var controls, W = 800, H = 600, tanHalf = Math.tan(20 * D2R);
  var content = new T.Group(); scene.add(content);
  var star = null, items = [], byKey = {}, hits = [], selected = null, hover = null, flight = null, lastSel = new T.Vector3();
  var tmp = new T.Vector3(), tmp2 = new T.Vector3(), v3 = new T.Vector3(), camSpace = new T.Vector3();
  var TINT = { O: [.7, .8, 1], B: [.72, .82, 1], A: [.78, .86, 1], F: [.98, .93, .82], G: [1, .82, .6], K: [1, .68, .42], M: [1, .52, .32], BD: [.8, .3, .16] };
  var sphereGeo, glow;

  function starRadius(rSun) { return Math.max(.35, 7 * Math.pow(rSun, .5)); }
  function dist(au) { return 36 * Math.pow(au, .55); }
  function keplerAU(mSun, Pdays) { var y = Pdays / 365.25; return Math.cbrt(mSun * y * y); }
  L.keplerAU = keplerAU;

  L.build = function (renderer, labelsContainer) {
    L.labelsEl = labelsContainer;
    L.sky = OBS.buildSky(renderer); scene.add(L.sky);
    sphereGeo = new T.SphereGeometry(1, OBS.perf.cfg.seg[0], OBS.perf.cfg.seg[1]);
    glow = OBS.system.glowTexture([[0, 'rgba(255,255,255,0.85)'], [.16, 'rgba(255,255,255,0.35)'], [.42, 'rgba(255,255,255,0.09)'], [1, 'rgba(255,255,255,0)']]);
    scene.add(new T.AmbientLight(0x1a2236, .5));
    controls = L.controls = new T.OrbitControls(camera, OBS.engine.canvas);
    controls.enableDamping = true; controls.dampingFactor = .08; controls.screenSpacePanning = true; controls.zoomSpeed = .9; controls.rotateSpeed = .6;
    controls.enabled = false;
    controls.addEventListener('start', function () { flight = null; });
    var cv = OBS.engine.canvas, down = { x: 0, y: 0 }, ray = new T.Raycaster(), ndc = new T.Vector2();
    function pick(cx, cy) {
      var r = cv.getBoundingClientRect(); ndc.set(((cx - r.left) / r.width) * 2 - 1, -((cy - r.top) / r.height) * 2 + 1); ray.setFromCamera(ndc, camera);
      var h = ray.intersectObjects(hits, false); return h.length ? h[0].object.userData.key : null;
    }
    cv.addEventListener('pointerdown', function (e) { down.x = e.clientX; down.y = e.clientY; });
    cv.addEventListener('pointerup', function (e) {
      if (OBS.engine.level !== L || e.button !== 0 || Math.hypot(e.clientX - down.x, e.clientY - down.y) > 6) return;
      var k = pick(e.clientX, e.clientY); if (k) L.select(k);
    });
    cv.addEventListener('pointermove', function (e) { if (OBS.engine.level !== L) return; hover = pick(e.clientX, e.clientY); cv.classList.toggle('over', !!hover); });
    // zoom arrière au maximum : retour au voisinage (même geste volontaire que pour le système solaire)
    var atMax = 0, lastW = 0, armed = false, push = 0;
    cv.addEventListener('wheel', function (e) {
      if (OBS.engine.level !== L || flight || selected) return;
      var now = performance.now(), gap = now - lastW; lastW = now;
      if (e.deltaY <= 0 || camera.position.distanceTo(controls.target) < controls.maxDistance * .97) { atMax = 0; armed = false; push = 0; return; }
      if (!atMax) { atMax = now; return; }
      if (!armed) { if (gap > 300 && now - atMax > 500) armed = true; else return; }
      if (++push >= 4) { push = 0; armed = false; atMax = 0; OBS.engine.go('voisinage', { focus: star && star.id, from: 'etoile' }); }
    }, { passive: true });
  };

  function clear() {
    while (content.children.length) { var o = content.children.pop(); if (o.geometry && o.geometry !== sphereGeo) o.geometry.dispose(); if (o.material) o.material.dispose && o.material.dispose(); }
    Array.prototype.slice.call(L.labelsEl.querySelectorAll('.lbl')).forEach(function (e) { e.remove(); });
    items = []; byKey = {}; hits = []; selected = null;
  }
  function label(it) {
    var el = document.createElement('button'); el.type = 'button';
    el.className = 'lbl' + (it.kind === 'star' ? ' is-sun' : it.kind === 'comp' ? ' is-sun' : ' is-moon');
    el.innerHTML = '<span class="dot"></span><span class="nm">' + OBS.esc(it.name) + '</span>';
    el.addEventListener('click', function (e) { e.stopPropagation(); L.select(it.key); });
    L.labelsEl.appendChild(el); it.el = el;
  }
  function makeStar(def, rSun, cls, key, name, kind) {
    var R = starRadius(rSun), t = TINT[cls] || TINT.G;
    var mat = new T.ShaderMaterial({ uniforms: { uTime: { value: 0 }, uTint: { value: new T.Vector3(t[0], t[1], t[2]) }, uSpots: { value: cls === 'M' ? 1.4 : cls === 'BD' ? 2 : 1 } },
      vertexShader: G.SUN_VERT, fragmentShader: G.SUN_FRAG, extensions: { derivatives: true } });
    var mesh = new T.Mesh(sphereGeo, mat); mesh.scale.setScalar(R);
    var holder = new T.Group(); holder.add(mesh); content.add(holder);
    var col = new T.Color(t[0], t[1], t[2]);
    var g1 = new T.Sprite(new T.SpriteMaterial({ map: glow, color: col, blending: T.AdditiveBlending, depthWrite: false, transparent: true, opacity: cls === 'BD' ? .35 : .9 }));
    g1.scale.setScalar(R * 5); holder.add(g1);
    var g2 = new T.Sprite(new T.SpriteMaterial({ map: glow, color: col, blending: T.AdditiveBlending, depthWrite: false, transparent: true, opacity: cls === 'BD' ? .15 : .35 }));
    g2.scale.setScalar(R * 14); holder.add(g2);
    var hit = new T.Mesh(sphereGeo, new T.MeshBasicMaterial({ visible: false })); hit.scale.setScalar(R * 1.2); hit.userData.key = key; holder.add(hit); hits.push(hit);
    var it = { key: key, kind: kind, name: name, def: def, holder: holder, mat: mat, r: R, pos: holder.position, hit: hit };
    items.push(it); byKey[key] = it; label(it); return it;
  }

  L.show = function (id) {
    var def = OBS.neighborhood.get(id) ? OBS.neighborhood.get(id).def : null; if (!def) return false;
    clear(); star = def;
    var main = makeStar(def, def.r || .3, def.cls, def.id, def.name, 'star');
    var maxD = main.r * 6, inner = main.r * 1.6;
    (def.sys || []).forEach(function (p, i) {
      var aAU = keplerAU(def.m || .3, p.P), d = Math.max(dist(aAU), inner + 1.4 * i + 1.2);
      var km = p.giant ? 70000 : 6371 * Math.pow(p.me || .3, .27), r = 0.042 * Math.pow(km, 0.4);   // échelle propre à ce niveau (étoile seule, pas de voisines à départager)
      var look = p.giant ? { type: 3, bands: 6, warp: .05, seed: 30 + i, c: [0x8a7a62, 0xc8b894, 0xe8dcc0, 0x7a6a52, 0xb8a080], atmoK: .4, atmo: 0xd8c8a0, shell: { k: 1.04, s: .45 } }
        : { type: 0, scale: 1.5, seed: 70 + i * 3, relief: .03, ice: 0, c: [0x5f5a55, 0x8c857c, 0x45403b, 0xb0a89c] };
      var mat = OBS.system.planetMaterial(look, r);
      var mesh = new T.Mesh(sphereGeo, mat); mesh.scale.setScalar(r);
      var holder = new T.Group(); holder.add(mesh); content.add(holder);
      var pts = []; for (var k = 0; k <= 128; k++) { var a = k / 128 * TAU; pts.push(new T.Vector3(Math.cos(a) * d, 0, Math.sin(a) * d)); }
      content.add(new T.Line(new T.BufferGeometry().setFromPoints(pts), new T.LineBasicMaterial({ color: 0xaab6e8, transparent: true, opacity: .18, depthWrite: false })));
      var hit = new T.Mesh(sphereGeo, new T.MeshBasicMaterial({ visible: false })); hit.userData.key = 'p' + i; holder.add(hit); hits.push(hit);
      var it = { key: 'p' + i, kind: 'planet', name: p.n, def: p, holder: holder, mesh: mesh, mat: mat, r: r, d: d, aAU: aAU, phase: (i * 2.39 + def.ly) % TAU, pos: holder.position, hit: hit };
      items.push(it); byKey[it.key] = it; label(it); maxD = Math.max(maxD, d * 1.25);
    });
    if (def.comp) {
      var c = def.comp, d2 = dist(c.aAU);
      var ci = makeStar(c, c.r, c.cls, 'comp', c.n, 'comp');
      ci.d = d2; ci.phase = 1.2; ci.Pdays = c.Py * 365.25;
      var pts2 = []; for (var k2 = 0; k2 <= 160; k2++) { var a2 = k2 / 160 * TAU; pts2.push(new T.Vector3(Math.cos(a2) * d2, 0, Math.sin(a2) * d2)); }
      content.add(new T.Line(new T.BufferGeometry().setFromPoints(pts2), new T.LineBasicMaterial({ color: 0xffd9a0, transparent: true, opacity: .14, depthWrite: false })));
      maxD = Math.max(maxD, d2 * 1.2);
    }
    L.extent = maxD;
    controls.maxDistance = Math.max(maxD * 3.2, 40); controls.minDistance = main.r * 1.4;
    return true;
  };

  function homeCam(out) { return out.set(0, Math.sin(26 * D2R), Math.cos(26 * D2R)).multiplyScalar(Math.max(L.extent * 1.9, 18) / Math.max(.6, Math.min(1.3, camera.aspect))); }
  function ease(k) { return k < .5 ? 4 * k * k * k : 1 - Math.pow(-2 * k + 2, 3) / 2; }
  function startFlight(key) { flight = { t: 0, dur: 2, key: key, fromOff: camera.position.clone().sub(controls.target), fromTgt: controls.target.clone() }; controls.enabled = false; }
  function selDist(it) { return (it.kind === 'planet' ? Math.max(it.r * 5, 1.5) : it.r * 4.5) * Math.max(1, .95 / camera.aspect); }

  L.select = function (key) {
    if (key === star.id) key = null;
    selected = key && byKey[key] ? key : null;
    startFlight(selected);
    controls.minDistance = selected ? byKey[selected].r * 1.3 : byKey[star.id].r * 1.4;
    OBS.emit('select', { level: 'etoile', id: star.id, part: selected, item: selected ? byKey[selected] : null });
    OBS.emit('crumbs');
  };
  L.selected = function () { return selected; };
  L.star = function () { return star; };
  L.crumbs = function () {
    var c = [{ label: 'Voisinage stellaire', act: function () { OBS.engine.go('voisinage', { focus: star.id, from: 'etoile' }); } },
             { label: star.name, act: function () { L.select(null); }, current: !selected }];
    if (selected) c.push({ label: byKey[selected].name, current: true });
    return c;
  };

  L.enter = function (opts) {
    L._out = 0; controls.enabled = true;
    if (opts.star && (!star || star.id !== opts.star)) L.show(opts.star);
    if (!star) return;
    camera.position.copy(homeCam(tmp)).multiplyScalar(.12); controls.target.set(0, 0, 0);
    selected = null; flight = { t: 0, dur: 2.4, key: null, fromOff: camera.position.clone(), fromTgt: new T.Vector3() }; controls.enabled = false;
    OBS.emit('select', { level: 'etoile', id: star.id, part: null });
    OBS.emit('crumbs');
  };
  L.leave = function () { controls.enabled = false; };
  L.leaveAnim = function () { flight = null; controls.enabled = false; L._out = 1; };
  L.resize = function (w, h) { W = w; H = h; camera.aspect = W / H; camera.updateProjectionMatrix(); };

  L.update = function (dt, now) {
    if (!star) return;
    var jd = OBS.time.jd, t = now / 1000;
    items.forEach(function (it) {
      if (it.mat && it.mat.uniforms.uTime) it.mat.uniforms.uTime.value = t;
      if (it.kind === 'planet') {
        var th = it.phase + TAU * (jd - OBS.astro.J2000) / it.def.P;
        it.holder.position.set(Math.cos(th) * it.d, 0, -Math.sin(th) * it.d);
        it.mesh.rotation.y = th;                                   // rotation synchrone probable, comme beaucoup de planètes proches de leur étoile
      } else if (it.kind === 'comp') {
        var th2 = it.phase + TAU * (jd - OBS.astro.J2000) / it.Pdays;
        it.holder.position.set(Math.cos(th2) * it.d, 0, -Math.sin(th2) * it.d);
      }
    });
    if (L._out) camera.position.multiplyScalar(1 + dt * 2.6);
    var it = selected ? byKey[selected] : null;
    if (flight) {
      flight.t += dt;
      var k = Math.min(1, flight.t / flight.dur), e = ease(k);
      var tgt = flight.key ? byKey[flight.key].pos : tmp2.set(0, 0, 0);
      var dTo = flight.key ? selDist(byKey[flight.key]) : homeCam(tmp).length(), dFrom = Math.max(flight.fromOff.length(), .01);
      var dir = v3.copy(flight.fromOff).normalize();
      if (!flight.key) dir.lerp(homeCam(tmp).normalize(), e).normalize();
      controls.target.lerpVectors(flight.fromTgt, tgt, e);
      camera.position.copy(controls.target).addScaledVector(dir, Math.exp(Math.log(dFrom) * (1 - e) + Math.log(dTo) * e));
      if (k >= 1) { flight = null; controls.enabled = true; if (it) lastSel.copy(it.pos); }
    } else if (it) {
      tmp.copy(it.pos).sub(lastSel); camera.position.add(tmp); controls.target.add(tmp); lastSel.copy(it.pos);
    }
    controls.update();
    L.sky.position.copy(camera.position);
    camera.updateMatrixWorld();
    var occ = [];
    items.slice().sort(function (a, b) { return (b.key === selected) - (a.key === selected) || (b.kind !== 'planet') - (a.kind !== 'planet'); }).forEach(function (it2) {
      var dd = camera.position.distanceTo(it2.pos), rPx = it2.r / (dd * tanHalf) * (H / 2);
      if (it2.kind === 'planet') it2.hit.scale.setScalar(it2.r * Math.max(1.3, 14 / Math.max(rPx, .5)));
      else it2.hit.scale.setScalar(Math.max(it2.r * 1.2, 14 / (H / 2) * dd * tanHalf));   // cible cliquable d'au moins ~14 px
      var el = it2.el; camSpace.copy(it2.pos).applyMatrix4(camera.matrixWorldInverse); v3.copy(it2.pos).project(camera);
      var x = (v3.x * .5 + .5) * W, y = (-v3.y * .5 + .5) * H, show = camSpace.z < 0 && x > -60 && x < W + 60 && y > 96 && y < H + 30 && rPx < 150;
      if (show) {
        if (!el._w) { el._w = el.offsetWidth || 90; el._h = el.offsetHeight || 22; }
        var off = Math.max(rPx, 4) + 6, box = { l: x + off, t: y - el._h / 2, r: x + off + el._w, b: y + el._h / 2 };
        show = !occ.some(function (o) { return box.l < o.r + 4 && box.r + 4 > o.l && box.t < o.b + 2 && box.b + 2 > o.t; }) || it2.key === selected;
        if (show) { occ.push(box); el.style.transform = 'translate(' + x.toFixed(1) + 'px,' + y.toFixed(1) + 'px)'; el.style.setProperty('--off', off.toFixed(1) + 'px'); }
      }
      el.classList.toggle('hid', !show); el.classList.toggle('active', it2.key === selected); el.classList.toggle('hov', it2.key === hover);
    });
  };
})();

/* ======================================================================
   OBSERVATOIRE — niveau « Voisinage stellaire »
   Vraies positions 3D des étoiles à moins de 12 années-lumière (1 al = 14 unités, échelle linéaire).
   Le plan horizontal est celui de l'écliptique, comme dans le système solaire : on garde ses repères.
   Les tailles des étoiles sont symboliques (selon leur luminosité) : aucune n'est à l'échelle.
   ====================================================================== */
(function () {
  'use strict';
  var OBS = window.OBS = window.OBS || {};
  var T = window.THREE, A = OBS.astro;
  var LY = 14, D2R = Math.PI / 180;

  var L = { id: 'voisinage', label: 'Voisinage stellaire' };
  OBS.neighborhood = L;
  var scene = L.scene = new T.Scene();
  var camera = L.camera = new T.PerspectiveCamera(45, 1, 0.1, 60000);
  var controls, W = 800, H = 600, PR = 1, tanHalf = Math.tan(22.5 * D2R);
  var stars = [], byId = {}, hits = [], selected = null, hover = null, flight = null, lastSel = new T.Vector3();
  var tmp = new T.Vector3(), tmp2 = new T.Vector3(), v3 = new T.Vector3(), camSpace = new T.Vector3();

  function toScene(raDeg, decDeg, ly, out) {
    var e = A.raDecToEcl(raDeg, decDeg, ly * LY);
    return out.set(e.x, e.z, -e.y);
  }

  L.build = function (renderer, labelsContainer) {
    L.labelsEl = labelsContainer;
    L.sky = OBS.buildSky(renderer); scene.add(L.sky);
    var glow = OBS.system.glowTexture([[0, 'rgba(255,255,255,1)'], [.12, 'rgba(255,255,255,0.55)'], [.35, 'rgba(255,255,255,0.12)'], [1, 'rgba(255,255,255,0)']]);

    // repères : cercles de 5 et 10 années-lumière dans le plan de l'écliptique
    [5, 10].forEach(function (r) {
      var pts = [];
      for (var i = 0; i <= 160; i++) { var t = i / 160 * Math.PI * 2; pts.push(new T.Vector3(Math.cos(t) * r * LY, 0, Math.sin(t) * r * LY)); }
      var line = new T.Line(new T.BufferGeometry().setFromPoints(pts), new T.LineBasicMaterial({ color: 0x7f8fd0, transparent: true, opacity: .16, depthWrite: false }));
      scene.add(line);
      var tag = document.createElement('span'); tag.className = 'ring-tag'; tag.textContent = r + ' al';
      labelsContainer.appendChild(tag); L['tag' + r] = { el: tag, pos: new T.Vector3(r * LY, 0, 0) };
    });

    var list = [{ id: 'soleil-v', name: 'Soleil', sun: true, ly: 0, ra: 0, dec: 0, spec: 'G2 V', cls: 'G', lum: 1 }].concat(OBS.STARS);
    var hitGeo = new T.SphereGeometry(1, 12, 8), hitMat = new T.MeshBasicMaterial({ visible: false });
    list.forEach(function (s) {
      var pos = s.sun ? new T.Vector3() : toScene(s.ra, s.dec, s.ly, new T.Vector3());
      var col = new T.Color(OBS.STAR_COLORS[s.cls] || 0xffffff);
      var size = s.cls === 'BD' ? 2.2 : 3 + 6 * Math.pow(Math.min(s.lum, 30), .25);
      var sp = new T.Sprite(new T.SpriteMaterial({ map: glow, color: col, blending: T.AdditiveBlending, depthWrite: false, transparent: true, opacity: s.cls === 'BD' ? .55 : 1 }));
      sp.scale.set(size, size, 1); sp.position.copy(pos); scene.add(sp);
      // ligne verticale jusqu'au plan de l'écliptique : aide à lire la profondeur
      if (!s.sun) {
        var drop = new T.Line(new T.BufferGeometry().setFromPoints([pos.clone(), new T.Vector3(pos.x, 0, pos.z)]), new T.LineBasicMaterial({ color: col, transparent: true, opacity: .22, depthWrite: false }));
        scene.add(drop);
        var foot = new T.Mesh(new T.RingGeometry(.6, .9, 20), new T.MeshBasicMaterial({ color: col, transparent: true, opacity: .3, side: T.DoubleSide, depthWrite: false }));
        foot.rotation.x = -Math.PI / 2; foot.position.set(pos.x, 0, pos.z); scene.add(foot);
      }
      var hit = new T.Mesh(hitGeo, hitMat); hit.position.copy(pos); hit.userData.id = s.id; scene.add(hit); hits.push(hit);
      var S = { id: s.id, def: s, pos: pos, sprite: sp, size: size, hit: hit };
      var el = document.createElement('button'); el.type = 'button';
      el.className = 'lbl is-star' + (s.sun ? ' is-sun' : '') + (s.cls === 'BD' ? ' is-dwarf' : '');
      el.innerHTML = '<span class="dot"></span><span class="nm">' + s.name + (s.sun ? ' <em>vous êtes ici</em>' : '') + '</span>';
      el.addEventListener('click', function (e) { e.stopPropagation(); clickStar(s.id); });
      el.addEventListener('pointerenter', function () { hover = s.id; });
      el.addEventListener('pointerleave', function () { if (hover === s.id) hover = null; });
      labelsContainer.appendChild(el); S.el = el;
      stars.push(S); byId[s.id] = S;
    });

    controls = L.controls = new T.OrbitControls(camera, OBS.engine.canvas);
    controls.enableDamping = true; controls.dampingFactor = .08; controls.screenSpacePanning = true; controls.zoomSpeed = .9; controls.rotateSpeed = .5;
    controls.minDistance = 6; controls.maxDistance = 900; controls.enabled = false;
    controls.addEventListener('start', function () { flight = null; });
    var cv = OBS.engine.canvas, down = { x: 0, y: 0 }, ray = new T.Raycaster(), ndc = new T.Vector2();
    function pick(cx, cy) {
      var r = cv.getBoundingClientRect();
      ndc.set(((cx - r.left) / r.width) * 2 - 1, -((cy - r.top) / r.height) * 2 + 1); ray.setFromCamera(ndc, camera);
      var h = ray.intersectObjects(hits, false); return h.length ? h[0].object.userData.id : null;
    }
    cv.addEventListener('pointerdown', function (e) { down.x = e.clientX; down.y = e.clientY; });
    cv.addEventListener('pointerup', function (e) {
      if (OBS.engine.level !== L || e.button !== 0 || Math.hypot(e.clientX - down.x, e.clientY - down.y) > 6) return;
      var id = pick(e.clientX, e.clientY); if (id) clickStar(id);
    });
    cv.addEventListener('pointermove', function (e) { if (OBS.engine.level !== L) return; var id = pick(e.clientX, e.clientY); hover = id; cv.classList.toggle('over', !!id); });
    // zoom avant sur le Soleil : on rentre dans le système solaire
    var push = 0, pushT = 0;
    cv.addEventListener('wheel', function (e) {
      if (OBS.engine.level !== L || flight) return;
      if (e.deltaY < 0 && controls.target.length() < 1 && camera.position.length() <= controls.minDistance * 1.6 + 2) {
        var now = performance.now(); if (now - pushT > 900) push = 0; pushT = now;
        if (++push >= 3) { push = 0; OBS.engine.go('systeme', { from: 'voisinage' }); }
      }
    }, { passive: true });
  };

  function clickStar(id) {
    if (id === 'soleil-v') {
      if (selected === null && camera.position.length() < 60) { OBS.engine.go('systeme', { from: 'voisinage' }); return; }
      if (selected === null) { L.select(null, true); return; }
    }
    L.select(id);
  }

  function homeCam(out) { return out.set(0, Math.sin(24 * D2R), Math.cos(24 * D2R)).multiplyScalar(470 / Math.max(.6, Math.min(1.3, camera.aspect))); }
  function ease(k) { return k < .5 ? 4 * k * k * k : 1 - Math.pow(-2 * k + 2, 3) / 2; }
  function startFlight(id, toHome) {
    flight = { t: 0, dur: 2.2, id: id, home: toHome, fromOff: camera.position.clone().sub(controls.target), fromTgt: controls.target.clone() };
    controls.enabled = false;
  }
  L.select = function (id, home) {
    if (id === 'soleil-v') id = null;
    selected = id && byId[id] ? id : null;
    startFlight(selected, !selected);
    OBS.emit('select', { level: 'voisinage', id: selected });
    OBS.emit('crumbs');
  };
  L.focus = L.select;
  L.selected = function () { return selected; };
  L.get = function (id) { return byId[id]; };
  L.crumbs = function () {
    var c = [{ label: 'Voisinage stellaire', act: function () { L.select(null); }, current: !selected }];
    if (selected) c.push({ label: byId[selected].def.name, current: true });
    return c;
  };

  L.enter = function (opts) {
    L._inward = 0; controls.enabled = true; selected = null;
    if (opts.from === 'systeme') {                     // on vient du système : on part du Soleil et on s'éloigne
      camera.position.copy(homeCam(tmp)).multiplyScalar(.05); controls.target.set(0, 0, 0);
      startFlight(null, true); flight.dur = 2.6;
    } else { homeCam(camera.position); controls.target.set(0, 0, 0); }
    if (opts.focus) L.select(opts.focus);
    OBS.emit('select', { level: 'voisinage', id: selected });
    OBS.emit('crumbs');
  };
  L.leave = function () { controls.enabled = false; };
  L.leaveAnim = function () { flight = null; controls.enabled = false; L._inward = 1; };
  L.resize = function (w, h, pr) { W = w; H = h; PR = pr; camera.aspect = W / H; camera.updateProjectionMatrix(); };

  L.update = function (dt) {
    if (L._inward) { controls.target.multiplyScalar(Math.max(0, 1 - dt * 4)); camera.position.lerp(controls.target, Math.min(1, dt * 2.4)); }
    if (flight) {
      flight.t += dt;
      var k = Math.min(1, flight.t / flight.dur), e = ease(k);
      var tgt = flight.id ? byId[flight.id].pos : tmp2.set(0, 0, 0);
      var dTo = flight.id ? 28 : homeCam(tmp).length(), dFrom = Math.max(flight.fromOff.length(), .01);
      var dir = tmp.copy(flight.fromOff).normalize();
      if (flight.home) dir.lerp(homeCam(v3).normalize(), e).normalize();
      controls.target.lerpVectors(flight.fromTgt, tgt, e);
      camera.position.copy(controls.target).addScaledVector(dir, Math.exp(Math.log(dFrom) * (1 - e) + Math.log(dTo) * e));
      if (k >= 1) { flight = null; controls.enabled = true; }
    }
    controls.update();
    L.sky.position.copy(camera.position);
    camera.updateMatrixWorld();

    // cibles cliquables d'au moins ~16 px, étiquettes
    var occ = [];
    var list = stars.map(function (S) {
      var dist = camera.position.distanceTo(S.pos);
      S.hit.scale.setScalar(Math.max(S.size * .4, 16 / (H / 2) * dist * tanHalf));
      return S;
    }).sort(function (a, b) { return (b.id === selected) - (a.id === selected) || (b.def.sun ? 1 : 0) - (a.def.sun ? 1 : 0) || (b.def.lum || 0) - (a.def.lum || 0); });
    list.forEach(function (S) {
      var el = S.el;
      camSpace.copy(S.pos).applyMatrix4(camera.matrixWorldInverse);
      v3.copy(S.pos).project(camera);
      var x = (v3.x * .5 + .5) * W, y = (-v3.y * .5 + .5) * H;
      var show = camSpace.z < 0 && x > -60 && x < W + 60 && y > -30 && y < H + 30;
      if (show) {
        if (!el._w) { el._w = el.offsetWidth || 90; el._h = el.offsetHeight || 22; }
        var off = 10, box = { l: x + off, t: y - el._h / 2, r: x + off + el._w, b: y + el._h / 2 };
        var clash = box.t < 96 || occ.some(function (o) { return box.l < o.r + 4 && box.r + 4 > o.l && box.t < o.b + 2 && box.b + 2 > o.t; });
        show = !clash || S.id === selected;
        if (show) { occ.push(box); el.style.transform = 'translate(' + x.toFixed(1) + 'px,' + y.toFixed(1) + 'px)'; el.style.setProperty('--off', off + 'px'); }
      }
      el.classList.toggle('hid', !show);
      el.classList.toggle('active', S.id === selected);
      el.classList.toggle('hov', S.id === hover);
      el.classList.toggle('dim', !!selected && S.id !== selected);
    });
    [5, 10].forEach(function (r) {
      var t = L['tag' + r]; camSpace.copy(t.pos).applyMatrix4(camera.matrixWorldInverse); v3.copy(t.pos).project(camera);
      t.el.hidden = camSpace.z > 0;
      t.el.style.transform = 'translate(' + ((v3.x * .5 + .5) * W).toFixed(1) + 'px,' + ((-v3.y * .5 + .5) * H).toFixed(1) + 'px)';
    });
  };
})();

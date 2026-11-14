/* ======================================================================
   OBSERVATOIRE — niveau « Au-delà » (Explorer, 9e cran de la règle des échelles, hypothèses, lot 11)
   Une vue schématique, sans données : notre Univers observable (sphère orangée), l'horizon des événements à
   l'intérieur, les sphères observables d'observateurs lointains qui chevauchent la nôtre (même Univers), puis,
   très loin et en pointillé bleu, des « univers-bulles » (hypothèse spéculative de l'inflation éternelle).
   1 unité = 100 Mpc. Tout est signalé « hypothèse » ou « schéma ».
   ====================================================================== */
(function () {
  'use strict';
  var OBS = window.OBS = window.OBS || {};
  var T = window.THREE, D2R = Math.PI / 180;
  var L = { id: 'au-dela', label: 'Au-delà' };
  OBS.audela = L;
  var scene = L.scene = new T.Scene();
  var camera = L.camera = new T.PerspectiveCamera(45, 1, 0.5, 40000);
  var controls, W = 800, H = 600, PR = 1;
  var items = [], byId = {}, selected = null, hover = null, flight = null, built = false, pending = null, bubbles = [];
  var tmp = new T.Vector3(), tmp2 = new T.Vector3(), v3 = new T.Vector3(), camSpace = new T.Vector3();
  var R0 = 136;                                        // rayon de l'Univers observable : ≈ 13 600 Mpc (H0 = 70)

  function sphere(r, col, op, wire) {
    var g = new T.Group();
    g.add(new T.Mesh(new T.SphereGeometry(r, 48, 32), new T.MeshBasicMaterial({ color: col, transparent: true, opacity: op, side: T.BackSide, depthWrite: false })));
    if (wire) g.add(new T.LineSegments(new T.EdgesGeometry(new T.IcosahedronGeometry(r, 2)), new T.LineBasicMaterial({ color: col, transparent: true, opacity: wire, depthWrite: false })));
    return g;
  }
  function label(id, name, pos, kind) {
    var it = { id: id, name: name, pos: pos, home: kind === 'home', kind: kind };
    var el = document.createElement('button'); el.type = 'button'; el.className = 'lbl ' + (kind === 'home' ? 'is-sun' : 'is-moon') + (kind === 'hypo' ? ' is-hypo' : '');
    el.innerHTML = '<span class="dot"></span><span class="nm">' + OBS.esc(name) + (kind === 'home' ? ' <em>vous êtes ici</em>' : kind === 'hypo' ? ' <em>hypothèse</em>' : '') + '</span>';
    el.addEventListener('click', function (e) { e.stopPropagation(); el.blur(); if (it.home && selected === id && !flight) OBS.engine.go('univers', { from: 'au-dela' }); else L.select(id); });
    el.addEventListener('pointerenter', function () { hover = id; });
    el.addEventListener('pointerleave', function () { if (hover === id) hover = null; });
    L.labelsEl.appendChild(el); it.el = el; items.push(it); byId[id] = it; return it;
  }
  L.build = function (renderer, labelsContainer) {
    L.labelsEl = labelsContainer;
    var us = sphere(R0, 0xff9f8a, .09, .12); scene.add(us);
    scene.add(sphere(49, 0xffd27a, .05, .12));                                  // horizon des événements, ≈ 16 milliards d'al
    [[1, .3, .2], [-.6, -.2, .9], [-.3, .5, -1], [.4, -.6, -.7]].forEach(function (d) {   // horizons d'observateurs lointains
      var g = sphere(R0, 0xd8dcf0, .025, .04); g.position.set(d[0], d[1], d[2]).normalize().multiplyScalar(R0 * 1.15); scene.add(g);
    });
    var big = sphere(R0 * 3.2, 0x8fc2ff, .015, 0); scene.add(big);                   // le même Univers, bien plus grand
    [[1, .2, .3, 120], [-1, .4, -.4, 160], [.2, -1, .6, 100], [-.4, .3, 1, 140], [.7, .8, -.9, 110]].forEach(function (b) {   // univers-bulles (spéculatif)
      var g = sphere(b[3], 0x8fc2ff, .045, .07); g.position.set(b[0], b[1], b[2]).normalize().multiplyScalar(R0 * 5.2); scene.add(g); bubbles.push(g);
    });
    label('nous', 'Notre Univers observable', new T.Vector3(), 'home');
    label('evenements', 'Horizon des événements', new T.Vector3(0, 49, 0), 'fait');
    label('horizons', 'Horizon d\'un autre observateur', new T.Vector3(1, .3, .2).normalize().multiplyScalar(R0 * 1.15).add(new T.Vector3(0, R0, 0)), 'fait');
    label('univers-plus-grand', 'Le même Univers, bien plus grand', new T.Vector3(-1, .6, .2).normalize().multiplyScalar(R0 * 3.2), 'hypo');
    label('inflation-eternelle', 'Autres univers-bulles', bubbles[0].position.clone().add(new T.Vector3(0, 130, 0)), 'hypo');
    controls = L.controls = new T.OrbitControls(camera, OBS.engine.canvas);
    controls.enableDamping = true; controls.dampingFactor = .08; controls.screenSpacePanning = true; controls.zoomSpeed = .9; controls.rotateSpeed = .5;
    controls.minDistance = 20; controls.maxDistance = 5000; controls.enabled = false;
    controls.addEventListener('start', function () { flight = null; });
    var cv = OBS.engine.canvas, down = { x: 0, y: 0 };
    function pick(cx, cy) {
      var r = cv.getBoundingClientRect(), best = null, bd = 18 * 18;
      items.forEach(function (it) { v3.copy(it.pos).project(camera); if (v3.z > 1) return; var x = (v3.x * .5 + .5) * r.width + r.left - cx, y = (-v3.y * .5 + .5) * r.height + r.top - cy, d = x * x + y * y; if (d < bd) { bd = d; best = it.id; } });
      return best;
    }
    cv.addEventListener('pointerdown', function (e) { down.x = e.clientX; down.y = e.clientY; });
    cv.addEventListener('pointerup', function (e) { if (OBS.engine.level !== L || e.button !== 0 || Math.hypot(e.clientX - down.x, e.clientY - down.y) > 6) return; var id = pick(e.clientX, e.clientY); if (id) L.select(id); });
    cv.addEventListener('pointermove', function (e) { if (OBS.engine.level !== L) return; var id = pick(e.clientX, e.clientY); hover = id; cv.classList.toggle('over', !!id); });
    cv.addEventListener('dblclick', function (e) { if (OBS.engine.level !== L) return; var id = pick(e.clientX, e.clientY); if (id === 'nous') OBS.engine.go('univers', { from: 'au-dela' }); else if (!id && selected) L.select(null); });
    built = true;
  };
  function homeCam(out) { var el = 26 * D2R, d = 2600 / Math.max(.45, Math.min(1.3, camera.aspect)); return out.set(Math.cos(el) * d * .5, Math.sin(el) * d, Math.cos(el) * d * .87); }
  function ease(k) { return k < .5 ? 4 * k * k * k : 1 - Math.pow(-2 * k + 2, 3) / 2; }
  function viewDist(it) { return it ? (it.home ? 420 : it.id === 'evenements' ? 260 : it.id === 'inflation-eternelle' ? 700 : 900) * Math.max(1, .95 / camera.aspect) : homeCam(tmp).length(); }
  function startFlight(id, dur) { flight = { t: 0, dur: dur || 2.4, id: id, fromOff: camera.position.clone().sub(controls.target), fromTgt: controls.target.clone() }; controls.enabled = false; }
  L.select = function (id) { if (id && !built) { pending = id; return; } selected = id && byId[id] ? id : null; startFlight(selected); OBS.emit('select', { level: 'au-dela', id: selected }); OBS.emit('crumbs'); };
  L.focus = L.select;
  L.selected = function () { return selected; };
  L.get = function (id) { return byId[id]; };
  L.homeId = 'nous';
  L.crumbs = function () { var c = [{ label: 'Au-delà', act: function () { L.select(null); }, current: !selected }]; if (selected) c.push({ label: byId[selected].name, current: true }); return c; };
  L.enter = function (opts) {
    L._inward = 0; controls.enabled = true; selected = null;
    if (opts.from === 'univers') { controls.target.set(0, 0, 0); camera.position.set(0, 120, 300); startFlight(null, 3.4); }
    else { homeCam(camera.position); controls.target.set(0, 0, 0); }
    if (opts.focus) L.select(opts.focus);
    OBS.emit('select', { level: 'au-dela', id: selected }); OBS.emit('crumbs');
  };
  L.leave = function () { controls.enabled = false; };
  L.leaveAnim = function () { flight = null; controls.enabled = false; L._inward = 1; };
  L.resize = function (w, h, pr) { W = w; H = h; PR = pr; camera.aspect = W / H; camera.updateProjectionMatrix(); };
  L.update = function (dt) {
    if (L._inward) { controls.target.multiplyScalar(Math.max(0, 1 - dt * 4)); camera.position.lerp(controls.target, Math.min(1, dt * 2.4)); }
    bubbles.forEach(function (b, i) { b.rotation.y += dt * .02 * (i % 2 ? 1 : -1); });
    if (flight) {
      flight.t += dt;
      var k = Math.min(1, flight.t / flight.dur), e = ease(k), it = flight.id ? byId[flight.id] : null;
      var tgt = it ? it.pos : tmp2.set(0, 0, 0), dTo = viewDist(it), dFrom = Math.max(flight.fromOff.length(), .01);
      var dir = tmp.copy(flight.fromOff).normalize(); if (!it) dir.lerp(homeCam(v3).normalize(), e).normalize();
      controls.target.lerpVectors(flight.fromTgt, tgt, e);
      camera.position.copy(controls.target).addScaledVector(dir, Math.exp(Math.log(dFrom) * (1 - e) + Math.log(dTo) * e));
      if (k >= 1) { flight = null; controls.enabled = true; }
    }
    controls.update(); camera.updateMatrixWorld();
    var occ = [];
    items.slice().sort(function (a, b) { function p(x) { return x.id === selected ? 100 : x.id === hover ? 90 : x.home ? 80 : 10; } return p(b) - p(a); }).forEach(function (it) {
      var el = it.el; camSpace.copy(it.pos).applyMatrix4(camera.matrixWorldInverse); v3.copy(it.pos).project(camera);
      var x = (v3.x * .5 + .5) * W, y = (-v3.y * .5 + .5) * H, show = camSpace.z < 0 && x > -60 && x < W + 60 && y > -30 && y < H + 30;
      if (show) {
        if (!el._w) { el._w = el.offsetWidth || 90; el._h = el.offsetHeight || 22; }
        var box = { l: x + 10, t: y - el._h / 2, r: x + 10 + el._w, b: y + el._h / 2 };
        var clash = box.t < 96 || occ.some(function (o) { return box.l < o.r + 4 && box.r + 4 > o.l && box.t < o.b + 2 && box.b + 2 > o.t; });
        show = !clash || it.id === selected || it.id === hover;
        if (show) { occ.push(box); el.style.transform = 'translate(' + x.toFixed(1) + 'px,' + y.toFixed(1) + 'px)'; el.style.setProperty('--off', '10px'); }
      }
      el.classList.toggle('hid', !show); el.classList.toggle('active', it.id === selected); el.classList.toggle('hov', it.id === hover);
    });
  };
})();

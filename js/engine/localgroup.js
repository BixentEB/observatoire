/* ======================================================================
   OBSERVATOIRE — niveau « Groupe local »
   Positions mesurées (direction et distance) ; aspect des galaxies reconstitué.
   Andromède et le Triangle sont orientés selon leur inclinaison et leur angle de position mesurés.
   Échelle linéaire : 1 unité = 10 000 années-lumière. Centre : celui de la Voie lactée, plan galactique horizontal.
   ====================================================================== */
(function () {
  'use strict';
  var OBS = window.OBS = window.OBS || {};
  var T = window.THREE, D2R = Math.PI / 180, TAU = Math.PI * 2, U = 10000;
  var GX = OBS.GALAXY;

  var L = { id: 'groupe-local', label: 'Groupe local' };
  OBS.localgroup = L;
  var scene = L.scene = new T.Scene();
  var camera = L.camera = new T.PerspectiveCamera(45, 1, 0.05, 50000);
  var controls, W = 800, H = 600, PR = 1, tanHalf = Math.tan(22.5 * D2R);
  var items = [], byId = {}, hits = [], selected = null, hover = null, flight = null, uniforms = [];
  var tmp = new T.Vector3(), tmp2 = new T.Vector3(), v3 = new T.Vector3(), camSpace = new T.Vector3();

  /* repère : galactique héliocentrique → scène (centre de la Voie lactée à l'origine) */
  function galVec(gx, gy, gz, ly, out) { return out.set((gx * ly - GX.R0) / U, (gz * ly + GX.zSun) / U, -(gy * ly) / U); }
  function eqToGal(x, y, z) {
    return [-0.0548755604 * x - 0.8734370902 * y - 0.4838350155 * z, 0.4941094279 * x - 0.4448296300 * y + 0.7469822445 * z, -0.8676661490 * x - 0.1980763734 * y + 0.4559837762 * z];
  }
  function dirScene(g, out) { return out.set(g[0], g[2], -g[1]).normalize(); }   // direction galactique → scène
  function lbVec(l, b) { var cb = Math.cos(b * D2R); return [cb * Math.cos(l * D2R), cb * Math.sin(l * D2R), Math.sin(b * D2R)]; }

  var VERT = [
    'attribute float aSize; attribute vec3 aColor; uniform float uPR,uScaleH; varying vec3 vC; varying float vA;',
    'void main(){ vC=aColor; vec4 mv=modelViewMatrix*vec4(position,1.0); float s=aSize*uPR*uScaleH/max(-mv.z,0.001);',
    '  vA=s<1.6?max(s/1.6,0.0)*max(s/1.6,0.0)+0.07:1.0; gl_PointSize=clamp(s,1.6,8.0*uPR); gl_Position=projectionMatrix*mv; }'
  ].join('\n');
  var FRAG = 'varying vec3 vC; varying float vA; void main(){ float d=length(gl_PointCoord-0.5); float a=1.0-smoothstep(0.0,0.5,d); gl_FragColor=vec4(vC*a*a*vA,1.0); }';
  function gauss() { var u = 1 - Math.random(), v = Math.random(); return Math.sqrt(-2 * Math.log(u)) * Math.cos(TAU * v); }

  /* une galaxie en points, dans son propre plan (u, v : axes du disque, n : normale) */
  function galaxyCloud(o, center, u, v, n, count) {
    var R = o.d / 2 / U, pos = new Float32Array(count * 3), col = new Float32Array(count * 3), size = new Float32Array(count);
    var pitch = Math.tan(21 * D2R), bar = o.home ? .35 : 0;
    for (var i = 0; i < count; i++) {
      var a, b, c, r, g, bl, s, kind = Math.random();
      if (o.form === 'spirale') {
        if (kind < .3) { a = gauss() * R * .12; b = gauss() * R * .12; c = gauss() * R * .06; if (bar) a *= 2.4; r = 1; g = .82; bl = .55; s = .9; }
        else if (kind < .78) {                                   // deux bras logarithmiques
          var rr = R * (.12 + .88 * Math.random()), th = Math.log(rr / (R * .12)) / pitch + (Math.random() < .5 ? 0 : Math.PI);
          var off = gauss() * R * (.04 + .06 * rr / R);
          a = rr * Math.cos(th) + off * Math.cos(th + 1.5); b = rr * Math.sin(th) + off * Math.sin(th + 1.5); c = gauss() * R * .015;
          r = .7; g = .82; bl = 1; s = .8;
        } else { var re = -Math.log(1 - Math.random()) * R * .3, t2 = Math.random() * TAU; a = re * Math.cos(t2); b = re * Math.sin(t2); c = gauss() * R * .02; r = .9; g = .85; bl = .8; s = .7; }
      } else {
        var flat = o.form === 'irreguliere' ? [.5, .35, .25] : o.form === 'elliptique' ? [.3, .22, .2] : [.4, .32, .3];
        a = gauss() * R * flat[0]; b = gauss() * R * flat[1]; c = gauss() * R * flat[2];
        if (o.form === 'irreguliere' && Math.random() < .3) { a += R * .25; b -= R * .1; }
        if (o.form === 'irreguliere') { r = .75; g = .85; bl = 1; } else { r = 1; g = .85; bl = .65; }
        s = .7;
      }
      var k = (.4 + .6 * Math.random()) * (o.home ? .9 : 1.15);
      pos[i * 3] = center.x + u.x * a + v.x * b + n.x * c; pos[i * 3 + 1] = center.y + u.y * a + v.y * b + n.y * c; pos[i * 3 + 2] = center.z + u.z * a + v.z * b + n.z * c;
      col[i * 3] = r * k; col[i * 3 + 1] = g * k; col[i * 3 + 2] = bl * k; size[i] = s * Math.max(.02, R * .03) * (1 + Math.random());
    }
    var geo = new T.BufferGeometry();
    geo.setAttribute('position', new T.BufferAttribute(pos, 3)); geo.setAttribute('aColor', new T.BufferAttribute(col, 3)); geo.setAttribute('aSize', new T.BufferAttribute(size, 1));
    var un = { uPR: { value: PR }, uScaleH: { value: 500 } }; uniforms.push(un);
    var pts = new T.Points(geo, new T.ShaderMaterial({ uniforms: un, vertexShader: VERT, fragmentShader: FRAG, transparent: true, depthWrite: false, blending: T.AdditiveBlending }));
    pts.frustumCulled = false; scene.add(pts);
  }

  L.build = function (renderer, labelsContainer) {
    L.labelsEl = labelsContainer;
    var cfg = OBS.perf.cfg, scaleN = cfg.stars > 8000 ? 1 : cfg.stars > 5000 ? .6 : .3;
    var hitGeo = new T.SphereGeometry(1, 10, 8), hitMat = new T.MeshBasicMaterial({ visible: false });
    OBS.LOCALGROUP.forEach(function (o) {
      var center = new T.Vector3(), u = new T.Vector3(), v = new T.Vector3(), n = new T.Vector3();
      if (o.home) { center.set(0, 0, 0); u.set(1, 0, 0); v.set(0, 0, 1); n.set(0, 1, 0); }
      else {
        var g = o.gl !== undefined ? lbVec(o.gl, o.gb) : (function () { var a = o.ra * D2R, d = o.dec * D2R; return eqToGal(Math.cos(d) * Math.cos(a), Math.cos(d) * Math.sin(a), Math.sin(d)); })();
        galVec(g[0], g[1], g[2], o.ly, center);
        if (o.pa !== undefined) {
          // ciel local : Est et Nord au point (ra, dec), puis grand axe (angle de position) et inclinaison du disque
          var A = o.ra * D2R, Dd = o.dec * D2R;
          var nd = dirScene(g, new T.Vector3());
          var E = dirScene(eqToGal(-Math.sin(A), Math.cos(A), 0), new T.Vector3());
          var No = dirScene(eqToGal(-Math.sin(Dd) * Math.cos(A), -Math.sin(Dd) * Math.sin(A), Math.cos(Dd)), new T.Vector3());
          var pa = o.pa * D2R, inc = o.inc * D2R;
          u.copy(No).multiplyScalar(Math.cos(pa)).addScaledVector(E, Math.sin(pa)).normalize();        // grand axe
          var kmin = new T.Vector3().copy(No).multiplyScalar(-Math.sin(pa)).addScaledVector(E, Math.cos(pa));
          n.copy(nd).multiplyScalar(Math.cos(inc)).addScaledVector(kmin, Math.sin(inc)).normalize();   // normale au disque
          v.crossVectors(n, u).normalize();
        } else { u.set(1, 0, 0); v.set(0, 0, 1); n.set(0, 1, 0); }
      }
      var count = Math.round((o.form === 'spirale' ? (o.home || o.big ? 26000 : 12000) : Math.max(500, Math.min(3000, o.d / 4))) * scaleN);
      galaxyCloud(o, center, u, v, n, count);
      // halo lumineux discret : la galaxie reste repérable de loin
      var gl = OBS.system.glowMesh([[0, .9], [.25, .25], [1, 0]], o.form === 'spirale' ? 0xd8dcff : 0xc8c8e0, o.form === 'spirale' ? .55 : .4);
      gl.scale.setScalar(o.d / U * 1.3); gl.position.copy(center); scene.add(gl);
      var hit = new T.Mesh(hitGeo, hitMat); hit.position.copy(center); hit.userData.id = o.id; scene.add(hit); hits.push(hit);
      var el = document.createElement('button'); el.type = 'button'; el.className = 'lbl' + (o.home ? ' is-sun' : o.form === 'spirale' ? '' : ' is-moon');
      el.innerHTML = '<span class="dot"></span><span class="nm">' + OBS.esc(o.name) + (o.home ? ' <em>vous êtes ici</em>' : '') + '</span>';
      el.addEventListener('click', function (e) { e.stopPropagation(); clickItem(o.id); });
      el.addEventListener('pointerenter', function () { hover = o.id; });
      el.addEventListener('pointerleave', function () { if (hover === o.id) hover = null; });
      labelsContainer.appendChild(el);
      var it = { id: o.id, def: o, pos: center, el: el, R: o.d / 2 / U, hit: hit }; items.push(it); byId[o.id] = it;
    });
    /* le noir n'est pas vide : les halos de gaz chaud et de matière noire des deux grandes galaxies.
       Rayons : Andromède ≈ 1,3 million d'al (Lehner et al. 2020, projet AMIGA) ; Voie lactée ≈ 900 000 al (rayon du viriel, ≈ 280 kpc).
       Rendu reconstitué : une brume sphérique, sans détail mesuré. */

    [['voielactee', 9e5], ['m31', 1.3e6]].forEach(function (h) {
      var it = byId[h[0]]; if (!it) return;
      var sp = OBS.system.glowMesh([[0, .55], [.45, .22], [.8, .07], [1, 0]], 0x8aa6ff, .2);
      sp.scale.setScalar(h[1] * 2 / U); sp.position.copy(it.pos); sp.renderOrder = -1; scene.add(sp);
      var tag = document.createElement('span'); tag.className = 'ring-tag halo-tag'; tag.textContent = 'halo de gaz et de matière noire';
      labelsContainer.appendChild(tag); items.push({ tag: true, el: tag, pos: it.pos.clone().add(new T.Vector3(0, -h[1] * .72 / U, 0)) });
    });
    // repères de distance : 1, 2 et 3 millions d'années-lumière autour de la Voie lactée, dans son plan
    [1e6, 2e6, 3e6].forEach(function (r) {
      var pts = []; for (var i = 0; i <= 200; i++) { var t = i / 200 * TAU; pts.push(new T.Vector3(Math.cos(t) * r / U, 0, Math.sin(t) * r / U)); }
      scene.add(new T.Line(new T.BufferGeometry().setFromPoints(pts), new T.LineBasicMaterial({ color: 0x7f8fd0, transparent: true, opacity: .1, depthWrite: false })));
      var tag = document.createElement('span'); tag.className = 'ring-tag'; tag.textContent = (r / 1e6) + ' million' + (r > 1e6 ? 's' : '') + ' d\'al';
      labelsContainer.appendChild(tag); items.push({ tag: true, el: tag, pos: new T.Vector3(0, 0, r / U) });   // côté proche de la vue d'arrivée : les trois étiquettes ne se chevauchent pas
    });

    controls = L.controls = new T.OrbitControls(camera, OBS.engine.canvas);
    controls.enableDamping = true; controls.dampingFactor = .08; controls.screenSpacePanning = true; controls.zoomSpeed = .9; controls.rotateSpeed = .5;
    controls.minDistance = 2; controls.maxDistance = 1400; controls.enabled = false;
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
      var id = pick(e.clientX, e.clientY); if (id) clickItem(id);
    });
    cv.addEventListener('pointermove', function (e) { if (OBS.engine.level !== L) return; var id = pick(e.clientX, e.clientY); hover = id; cv.classList.toggle('over', !!id); });
    cv.addEventListener('dblclick', function (e) {           // double-clic : entrer dans la galaxie quand elle a une carte détaillée
      if (OBS.engine.level !== L) return;
      var id = pick(e.clientX, e.clientY);
      if (!id) { if (selected) L.select(null); return; }
      if (id === 'voielactee') OBS.engine.go('galaxie', { from: 'groupe-local' });
      else if (byId[id].def.galaxie) OBS.engine.go('galaxie', { focus: byId[id].def.galaxie });
      else L.select(id);
    });
    var push = 0, pushT = 0;
    cv.addEventListener('wheel', function (e) {                // zoom avant sur la Voie lactée, en insistant : on y entre
      if (OBS.engine.level !== L || flight || e.deltaY >= 0 || selected !== 'voielactee') return;
      if (camera.position.length() > 14) return;
      var now = performance.now(); if (now - pushT > 900) push = 0; pushT = now;
      if (++push >= 3) { push = 0; OBS.engine.go('galaxie', { from: 'groupe-local' }); }
    }, { passive: true });
  };

  function clickItem(id) {
    if (id === selected && id === 'voielactee' && !flight) { OBS.engine.go('galaxie', { from: 'groupe-local' }); return; }
    var g = byId[id].def.galaxie;
    if (id === selected && g && !flight) { OBS.engine.go('galaxie', { focus: g }); return; }
    L.select(id);
  }
  function homeCam(out) { var el = 30 * D2R, d = 320 / Math.max(.45, Math.min(1.3, camera.aspect)); return out.set(Math.cos(el) * d * .55, Math.sin(el) * d, Math.cos(el) * d * .84); }
  function homeTarget(out) { return out.copy(byId.m31.pos).multiplyScalar(.45); }
  function ease(k) { return k < .5 ? 4 * k * k * k : 1 - Math.pow(-2 * k + 2, 3) / 2; }
  function viewDist(it) { return it ? Math.max(it.R * 5, 3) * Math.max(1, .95 / camera.aspect) : homeCam(tmp).length(); }
  function startFlight(id, dur) { flight = { t: 0, dur: dur || 2.2, id: id, fromOff: camera.position.clone().sub(controls.target), fromTgt: controls.target.clone() }; controls.enabled = false; }
  L.select = function (id) {
    selected = id && byId[id] ? id : null;
    startFlight(selected);
    OBS.emit('select', { level: 'groupe-local', id: selected });
    OBS.emit('crumbs');
  };
  L.focus = L.select;
  L.selected = function () { return selected; };
  L.get = function (id) { return byId[id]; };
  L.crumbs = function () {
    var c = [{ label: 'Groupe local', act: function () { L.select(null); }, current: !selected }];
    if (selected) c.push({ label: byId[selected].def.name, current: true });
    return c;
  };
  L.info = function (id) { var it = byId[id]; return it ? { fromSun: it.def.ly, fromMW: it.pos.length() * U } : null; };

  L.enter = function (opts) {
    L._inward = 0; controls.enabled = true; selected = null;
    if (opts.from === 'galaxie') { controls.target.set(0, 0, 0); camera.position.set(0, 6, 9); startFlight(null, 3); }
    else { homeCam(camera.position); homeTarget(controls.target); }
    if (opts.focus) L.select(opts.focus);
    OBS.emit('select', { level: 'groupe-local', id: selected });
    OBS.emit('crumbs');
  };
  L.leave = function () { controls.enabled = false; };
  L.leaveAnim = function () { flight = null; controls.enabled = false; L._inward = 1; };
  L.resize = function (w, h, pr) {
    W = w; H = h; PR = pr; camera.aspect = W / H; camera.updateProjectionMatrix();
    uniforms.forEach(function (u) { u.uPR.value = PR; u.uScaleH.value = H / (2 * tanHalf); });
  };

  L.update = function (dt) {
    if (L._inward) { controls.target.multiplyScalar(Math.max(0, 1 - dt * 4)); camera.position.lerp(controls.target, Math.min(1, dt * 2.4)); }
    if (flight) {
      flight.t += dt;
      var k = Math.min(1, flight.t / flight.dur), e = ease(k), it = flight.id ? byId[flight.id] : null;
      var tgt = it ? it.pos : homeTarget(tmp2), dTo = viewDist(it), dFrom = Math.max(flight.fromOff.length(), .01);
      var dir = tmp.copy(flight.fromOff).normalize();
      if (!it) dir.lerp(homeCam(v3).normalize(), e).normalize();
      controls.target.lerpVectors(flight.fromTgt, tgt, e);
      camera.position.copy(controls.target).addScaledVector(dir, Math.exp(Math.log(dFrom) * (1 - e) + Math.log(dTo) * e));
      if (k >= 1) { flight = null; controls.enabled = true; }
    }
    controls.update(); camera.updateMatrixWorld();
    var occ = [];
    items.forEach(function (it) { if (it.hit) it.hit.scale.setScalar(Math.max(it.R * 1.1, 16 / (H / 2) * camera.position.distanceTo(it.pos) * tanHalf)); });
    items.slice().sort(function (a, b) {
      function pri(x) { return x.tag ? -1 : x.id === selected ? 100 : x.id === hover ? 90 : x.def.home ? 80 : x.def.form === 'spirale' ? 60 : x.def.minor ? 10 : 20; }
      return pri(b) - pri(a);
    }).forEach(function (it) {
      var el = it.el;
      camSpace.copy(it.pos).applyMatrix4(camera.matrixWorldInverse); v3.copy(it.pos).project(camera);
      var x = (v3.x * .5 + .5) * W, y = (-v3.y * .5 + .5) * H;
      var show = camSpace.z < 0 && x > -60 && x < W + 60 && y > -30 && y < H + 30;
      if (it.tag) { el.hidden = !show; if (show) el.style.transform = 'translate(' + x.toFixed(1) + 'px,' + y.toFixed(1) + 'px)'; return; }
      if (show) {
        if (!el._w) { el._w = el.offsetWidth || 90; el._h = el.offsetHeight || 22; }
        var off = 10 + Math.min(40, it.R / (camera.position.distanceTo(it.pos) * tanHalf) * (H / 2) * .6);
        var box = { l: x + off, t: y - el._h / 2, r: x + off + el._w, b: y + el._h / 2 };
        var clash = box.t < 96 || occ.some(function (o) { return box.l < o.r + 4 && box.r + 4 > o.l && box.t < o.b + 2 && box.b + 2 > o.t; });
        show = !clash || it.id === selected;
        if (show) { occ.push(box); el.style.transform = 'translate(' + x.toFixed(1) + 'px,' + y.toFixed(1) + 'px)'; el.style.setProperty('--off', off.toFixed(1) + 'px'); }
      }
      el.classList.toggle('hid', !show);
      el.classList.toggle('active', it.id === selected);
      el.classList.toggle('hov', it.id === hover);
    });
  };
})();

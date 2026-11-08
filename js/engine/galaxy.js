/* ======================================================================
   OBSERVATOIRE — niveau « Voie lactée »
   Personne n'a jamais vu notre galaxie de l'extérieur : c'est une RECONSTITUTION, signalée comme telle.
   Ce qui la fonde :
     - bras spiraux : spirales logarithmiques ajustées sur les distances de masers (VLBI, Reid et al. 2019),
       prolongées au-delà des portions mesurées ;
     - barre centrale : demi-longueur ≈ 5 kpc, inclinée de ≈ 27° sur la ligne Soleil–centre (Wegg et al. 2015) ;
     - disque : densité exponentielle (longueur d'échelle ≈ 2,6 kpc), épaisseur réelle (≈ 300 années-lumière) ;
     - distance Soleil–centre : 8,178 kpc (GRAVITY 2019).
   Les objets repères (nébuleuses, amas, Nuages de Magellan…) sont à leurs positions mesurées.
   Échelle linéaire : 1 unité = 100 années-lumière. Plan galactique = plan horizontal, pôle Nord galactique en haut.
   ====================================================================== */
(function () {
  'use strict';
  var OBS = window.OBS = window.OBS || {};
  var T = window.THREE, D2R = Math.PI / 180, TAU = Math.PI * 2;
  var U = 100, KPC = 3261.56 / U;                               // années-lumière et kpc → unités de scène
  var GX = OBS.GALAXY, R0 = GX.R0 / U;

  var L = { id: 'galaxie', label: 'Voie lactée' };
  OBS.galaxy = L;
  var scene = L.scene = new T.Scene();
  var camera = L.camera = new T.PerspectiveCamera(45, 1, 0.5, 200000);
  var controls, W = 800, H = 600, PR = 1, tanHalf = Math.tan(22.5 * D2R);
  var items = [], byId = {}, hits = [], selected = null, hover = null, flight = null, uniforms = [];
  var tmp = new T.Vector3(), tmp2 = new T.Vector3(), v3 = new T.Vector3(), camSpace = new T.Vector3();
  var sunPos = new T.Vector3();

  /* coordonnées galactiques (l, b en degrés, d en années-lumière depuis le Soleil) → scène */
  function galToScene(l, b, d, out) {
    var cb = Math.cos(b * D2R), x = d * cb * Math.cos(l * D2R), y = d * cb * Math.sin(l * D2R), z = d * Math.sin(b * D2R);
    return out.set((x - GX.R0) / U, (z + GX.zSun) / U, -y / U);
  }
  L.galToScene = galToScene;
  /* point d'un bras : rayon R (kpc), azimut β (degrés) */
  function armR(A, beta) {
    var psi = (beta < A.bk ? A.psi[0] : A.psi[1]) * D2R;
    return A.Rk * Math.exp(-(beta - A.bk) * D2R * Math.tan(psi));
  }

  /* ---------- nuages de points ---------- */
  var VERT = [
    'attribute float aSize; attribute vec3 aColor; attribute float aEx; uniform float uPR,uScaleH,uUnc; varying vec3 vC; varying float vA;',
    // mode « mesuré / reconstitué » : les portions de bras extrapolées s'estompent et virent au gris
    'void main(){ vC=mix(aColor, vec3(dot(aColor,vec3(0.33)))*0.22, uUnc*aEx); vec4 mv=modelViewMatrix*vec4(position,1.0); float s=aSize*uPR*uScaleH/max(-mv.z,0.001);',
    // un point plus petit qu'un pixel garde sa part de lumière au lieu de scintiller
    '  vA=s<1.6?max(s/1.6,0.0)*max(s/1.6,0.0)+0.04:1.0; gl_PointSize=clamp(s,1.6,9.0*uPR); gl_Position=projectionMatrix*mv; }'
  ].join('\n');
  var FRAG_ADD = 'varying vec3 vC; varying float vA; void main(){ float d=length(gl_PointCoord-0.5); float a=1.0-smoothstep(0.0,0.5,d); gl_FragColor=vec4(vC*a*a*vA,1.0); }';
  var FRAG_DUST = 'varying vec3 vC; varying float vA; void main(){ float d=length(gl_PointCoord-0.5); float a=1.0-smoothstep(0.1,0.5,d); gl_FragColor=vec4(vC,a*0.16*vA); }';

  function cloud(n, fill, dust) {
    var pos = new Float32Array(n * 3), col = new Float32Array(n * 3), size = new Float32Array(n), ex = new Float32Array(n), p = { x: 0, y: 0, z: 0, r: 1, g: 1, b: 1, s: 1, x2: 0 };
    var k = 0;
    for (var i = 0; i < n; i++) {
      p.x2 = 0;
      if (!fill(p, i)) continue;
      ex[k] = p.x2;
      pos[k * 3] = p.x; pos[k * 3 + 1] = p.y; pos[k * 3 + 2] = p.z;
      col[k * 3] = p.r; col[k * 3 + 1] = p.g; col[k * 3 + 2] = p.b; size[k] = p.s; k++;
    }
    var g = new T.BufferGeometry();
    g.setAttribute('position', new T.BufferAttribute(pos.subarray(0, k * 3), 3));
    g.setAttribute('aColor', new T.BufferAttribute(col.subarray(0, k * 3), 3));
    g.setAttribute('aSize', new T.BufferAttribute(size.subarray(0, k), 1));
    g.setAttribute('aEx', new T.BufferAttribute(ex.subarray(0, k), 1));
    var u = { uPR: { value: PR }, uScaleH: { value: 500 }, uUnc: { value: 0 } }; uniforms.push(u);
    var m = new T.ShaderMaterial({ uniforms: u, vertexShader: VERT, fragmentShader: dust ? FRAG_DUST : FRAG_ADD, transparent: true, depthWrite: false,
      blending: dust ? T.NormalBlending : T.AdditiveBlending });
    var pts = new T.Points(g, m); pts.frustumCulled = false; if (dust) pts.renderOrder = 2; scene.add(pts);
    return pts;
  }
  function gauss() { var u = 1 - Math.random(), v = Math.random(); return Math.sqrt(-2 * Math.log(u)) * Math.cos(TAU * v); }
  function expo(scale) { return -Math.log(1 - Math.random()) * scale; }

  /* une portion de bras est « mesurée » si son azimut est dans la plage couverte par les masers */
  function extrap(A, beta) { return beta >= A.mesure[0] && beta <= A.mesure[1] ? 0 : 1; }
  L.setUnc = function (on) { L.unc = !!on; uniforms.forEach(function (u) { u.uUnc.value = on ? 1 : 0; }); OBS.emit('unc', L.unc); };

  /* échantillonne un point le long d'un bras (pondéré par la longueur) */
  function armTables() {
    return GX.arms.map(function (A) {
      var pts = [], len = 0, prev = null;
      for (var bta = A.b[0]; bta <= A.b[1]; bta += .5) {
        var R = armR(A, bta); if (R < 3.2 || R > 17) { prev = null; continue; }
        var x = -R * Math.cos(bta * D2R), z = -R * Math.sin(bta * D2R);
        if (prev) len += Math.hypot(x - prev[0], z - prev[1]);
        prev = [x, z]; pts.push({ x: x, z: z, R: R, b: bta, c: len });
      }
      return { A: A, pts: pts, len: len };
    });
  }
  function onArm(tab, out) {
    var t = Math.random() * tab.len, a = tab.pts, lo = 0, hi = a.length - 1;
    while (hi - lo > 1) { var m = (lo + hi) >> 1; if (a[m].c < t) lo = m; else hi = m; }
    var P = a[lo], Q = a[Math.min(hi, a.length - 1)], dx = Q.x - P.x, dz = Q.z - P.z, dl = Math.hypot(dx, dz) || 1;
    out.x = P.x; out.z = P.z; out.nx = -dz / dl; out.nz = dx / dl; out.R = P.R; out.b = P.b;
    // bouts des bras : on s'estompe
    var f = Math.min(1, (t / tab.len) * 8, ((tab.len - t) / tab.len) * 8);
    return f;
  }

  L.build = function (renderer, labelsContainer) {
    L.labelsEl = labelsContainer;
    var cfg = OBS.perf.cfg, N = cfg.stars > 8000 ? 240000 : cfg.stars > 5000 ? 140000 : 60000;
    var tabs = armTables(), tmpA = {};
    var totLen = tabs.reduce(function (s, t) { return s + t.len * (t.A.major ? 1.6 : t.A.spur ? .7 : 1); }, 0);
    function pickArm() {
      var r = Math.random() * totLen;
      for (var i = 0; i < tabs.length; i++) { r -= tabs[i].len * (tabs[i].A.major ? 1.6 : tabs[i].A.spur ? .7 : 1); if (r <= 0) return tabs[i]; }
      return tabs[0];
    }
    var cb = Math.cos(GX.bar.angle * D2R), sb = Math.sin(GX.bar.angle * D2R), barA = GX.bar.halfKpc * KPC;

    // 1. disque d'étoiles anciennes et moyennes : exponentiel, mince
    cloud(Math.round(N * .26), function (p) {
      var R = expo(2.6 * KPC); if (R > 17 * KPC || R < .5 * KPC) return false;
      var th = Math.random() * TAU, thick = Math.random() < .12;
      p.x = R * Math.cos(th); p.z = R * Math.sin(th); p.y = gauss() * (thick ? 9 : 3);
      var w = .14 + .2 * Math.random(); p.r = w * 1.0; p.g = w * .9; p.b = w * .76; p.s = .9 + Math.random() * .8;
      return true;
    });
    // 2. barre et bulbe : vieilles étoiles jaune-orangé
    cloud(Math.round(N * .2), function (p) {
      var bulge = Math.random() < .35, a, b, c;
      if (bulge) { a = gauss() * .7 * KPC; b = gauss() * .55 * KPC; c = gauss() * .45 * KPC; }
      else { a = (Math.random() * 2 - 1) * barA * (.35 + .65 * Math.random()); b = gauss() * .32 * KPC * (1 - .5 * Math.abs(a) / barA); c = gauss() * .22 * KPC; }
      // axe de la barre : extrémité proche du côté des longitudes positives (β = +27°)
      p.x = -a * cb + b * sb; p.z = -a * sb - b * cb; p.y = c;
      var w = .35 + .35 * Math.random(); p.r = w; p.g = w * .78; p.b = w * .5; p.s = 1 + Math.random();
      return true;
    });
    // 3. bras : étoiles jeunes bleutées, et nébuleuses rosées
    cloud(Math.round(N * .44), function (p) {
      var tab = pickArm(), f = onArm(tab, tmpA); if (Math.random() > f) return false; p.x2 = extrap(tab.A, tmpA.b);
      var w = tab.A.w * KPC * (Math.random() < .6 ? .8 : 1.8), off = gauss() * w;
      p.x = tmpA.x * KPC + tmpA.nx * off; p.z = tmpA.z * KPC + tmpA.nz * off; p.y = gauss() * 2.2;
      var hii = Math.random() < .012;
      if (hii) { p.r = .85; p.g = .42; p.b = .58; p.s = 1.6 + Math.random() * 1.6; }
      else { var v = .5 + .7 * Math.random(); p.r = v * .74; p.g = v * .85; p.b = v; p.s = 1 + Math.random() * 1.4; }
      return true;
    });
    // 3 bis. lueur des bras et de la barre : gros points très pâles, qui lient les étoiles en un voile continu
    cloud(Math.round(N * .07), function (p) {
      if (Math.random() < .25) {
        var a = (Math.random() * 2 - 1) * barA, b = gauss() * .4 * KPC;
        p.x = -a * cb + b * sb; p.z = -a * sb - b * cb; p.y = gauss() * 3;
        p.r = .05; p.g = .038; p.b = .024; p.s = 14 + Math.random() * 10; return true;
      }
      var tab = pickArm(), f = onArm(tab, tmpA); if (Math.random() > f) return false; p.x2 = extrap(tab.A, tmpA.b);
      var off = gauss() * tab.A.w * KPC * 1.3;
      p.x = tmpA.x * KPC + tmpA.nx * off; p.z = tmpA.z * KPC + tmpA.nz * off; p.y = gauss() * 2;
      var k = tab.A.major ? 1 : .7; p.r = .022 * k; p.g = .028 * k; p.b = .04 * k; p.s = 10 + Math.random() * 10;
      return true;
    });
    // 4. halo : étoiles éparses et amas globulaires (répartition indicative)
    cloud(Math.round(N * .02), function (p) {
      var r = expo(4 * KPC) + 1 * KPC, th = Math.random() * TAU, ph = Math.acos(2 * Math.random() - 1);
      p.x = r * Math.sin(ph) * Math.cos(th); p.z = r * Math.sin(ph) * Math.sin(th); p.y = r * Math.cos(ph) * .8;
      var w = .25 + .25 * Math.random(); p.r = w; p.g = w * .85; p.b = w * .7; p.s = 1.2 + Math.random() * 2;
      return true;
    });
    // 5. Nuages de Magellan : galaxies irrégulières, à leurs vraies positions
    OBS.GALAXY_OBJECTS.forEach(function (o) {
      if (!o.gal) return;
      var c = galToScene(o.l, o.b, o.ly, new T.Vector3()), r = o.gal / U / 2;
      cloud(Math.round(N * (o.gal > 10000 ? .02 : .01)), function (p) {
        p.x = c.x + gauss() * r * .45; p.y = c.y + gauss() * r * .3; p.z = c.z + gauss() * r * .4;
        var w = .3 + .4 * Math.random(); p.r = w * .85; p.g = w * .88; p.b = w; p.s = 1 + Math.random() * 1.5; return true;
      });
    });
    // 6. poussière : bandes sombres le long du bord intérieur des bras, et dans le plan
    cloud(Math.round(N * .12), function (p) {
      var inner = Math.random() < .7;
      if (inner) {
        var tab = pickArm(); if (tab.A.spur && Math.random() < .5) return false;
        var f = onArm(tab, tmpA); if (Math.random() > f) return false; p.x2 = extrap(tab.A, tmpA.b);
        var off = (-.55 + gauss() * .3) * tab.A.w * KPC;          // côté intérieur (vers le centre)
        var sgn = (tmpA.nx * -tmpA.x + tmpA.nz * -tmpA.z) > 0 ? 1 : -1;
        p.x = tmpA.x * KPC + tmpA.nx * off * -sgn; p.z = tmpA.z * KPC + tmpA.nz * off * -sgn;
      } else {
        var R = expo(3 * KPC) + 1.5 * KPC, th = Math.random() * TAU; if (R > 14 * KPC) return false;
        p.x = R * Math.cos(th); p.z = R * Math.sin(th);
      }
      p.y = gauss() * 1.2;
      p.r = .05; p.g = .035; p.b = .025; p.s = 4 + Math.random() * 5;
      return true;
    }, true);

    // lueur diffuse du disque, sous les étoiles (adoucit le grain)
    var c = document.createElement('canvas'); c.width = c.height = 512; var g = c.getContext('2d');
    var gr = g.createRadialGradient(256, 256, 0, 256, 256, 256);
    gr.addColorStop(0, 'rgba(255,214,160,0.55)'); gr.addColorStop(.08, 'rgba(255,200,150,0.3)'); gr.addColorStop(.3, 'rgba(170,175,215,0.09)'); gr.addColorStop(1, 'rgba(120,130,190,0)');
    g.fillStyle = gr; g.fillRect(0, 0, 512, 512);
    var glow = new T.Mesh(new T.PlaneGeometry(36 * KPC, 36 * KPC), new T.MeshBasicMaterial({ map: new T.CanvasTexture(c), transparent: true, blending: T.AdditiveBlending, depthWrite: false, side: T.DoubleSide }));
    glow.rotation.x = -Math.PI / 2; glow.renderOrder = -1; scene.add(glow);

    // repères : cercles de 10 000 en 10 000 années-lumière autour du centre (discrets)
    [25000, 50000].forEach(function (r) {
      var pts = []; for (var i = 0; i <= 200; i++) { var t = i / 200 * TAU; pts.push(new T.Vector3(Math.cos(t) * r / U, 0, Math.sin(t) * r / U)); }
      scene.add(new T.Line(new T.BufferGeometry().setFromPoints(pts), new T.LineBasicMaterial({ color: 0x7f8fd0, transparent: true, opacity: .1, depthWrite: false })));
    });

    // le Soleil, les objets repères
    galToScene(0, 0, 0, sunPos);
    var hitGeo = new T.SphereGeometry(1, 10, 8), hitMat = new T.MeshBasicMaterial({ visible: false });
    var mark = OBS.system.glowTexture([[0, 'rgba(255,255,255,1)'], [.2, 'rgba(255,255,255,0.5)'], [1, 'rgba(255,255,255,0)']]);
    OBS.GALAXY_OBJECTS.forEach(function (o) {
      var pos = o.sun ? sunPos.clone() : galToScene(o.l, o.b, o.ly, new T.Vector3());
      var sp = new T.Sprite(new T.SpriteMaterial({ map: mark, color: o.sun ? 0xffd27a : 0xbfe0ff, sizeAttenuation: false, transparent: true, depthWrite: false, blending: T.AdditiveBlending }));
      sp.scale.set(o.sun ? .03 : .018, o.sun ? .03 : .018, 1); sp.position.copy(pos); sp.renderOrder = 4; scene.add(sp);
      var hit = new T.Mesh(hitGeo, hitMat); hit.position.copy(pos); hit.userData.id = o.id; scene.add(hit); hits.push(hit);
      add(o.id, o, pos, o.sun ? 'is-sun' : '');
    });
    // systèmes d'exoplanètes remarquables, à leurs positions mesurées (petits repères verts)
    (OBS.EXOSYS || []).forEach(function (o) {
      var pos = galToScene(o.l, o.b, o.ly, new T.Vector3());
      var sp = new T.Sprite(new T.SpriteMaterial({ map: mark, color: 0x9fe3b0, sizeAttenuation: false, transparent: true, depthWrite: false, blending: T.AdditiveBlending }));
      sp.scale.set(.012, .012, 1); sp.position.copy(pos); sp.renderOrder = 4; scene.add(sp);
      var hit = new T.Mesh(hitGeo, hitMat); hit.position.copy(pos); hit.userData.id = o.id; scene.add(hit); hits.push(hit);
      add(o.id, o, pos, 'is-exo'); byId[o.id].exo = true; byId[o.id].sprite = sp;
    });
    // noms des bras, sur leur portion mesurée
    GX.arms.forEach(function (A) {
      var bm = (A.mesure[0] + A.mesure[1]) / 2 + (A.id === 'orion' ? 14 : 0), R = armR(A, bm);
      var pos = new T.Vector3(-R * Math.cos(bm * D2R) * KPC, 0, -R * Math.sin(bm * D2R) * KPC);
      var hit = new T.Mesh(hitGeo, hitMat); hit.position.copy(pos); hit.userData.id = A.id; scene.add(hit); hits.push(hit);
      add(A.id, { id: A.id, name: A.name, arm: A }, pos, 'is-region');
    });
    function add(id, def, pos, cls) {
      var el = document.createElement('button'); el.type = 'button'; el.className = 'lbl ' + cls;
      el.innerHTML = '<span class="dot"></span><span class="nm">' + OBS.esc(def.name) + (def.sun ? ' <em>vous êtes ici</em>' : '') + '</span>';
      el.addEventListener('click', function (e) { e.stopPropagation(); clickItem(id); });
      el.addEventListener('pointerenter', function () { hover = id; });
      el.addEventListener('pointerleave', function () { if (hover === id) hover = null; });
      labelsContainer.appendChild(el);
      var it = { id: id, def: def, pos: pos, el: el, arm: !!def.arm };
      items.push(it); byId[id] = it;
    }

    controls = L.controls = new T.OrbitControls(camera, OBS.engine.canvas);
    controls.enableDamping = true; controls.dampingFactor = .08; controls.screenSpacePanning = true; controls.zoomSpeed = .9; controls.rotateSpeed = .5;
    controls.minDistance = 4; controls.maxDistance = 4200; controls.enabled = false;
    controls.addEventListener('start', function () { flight = null; });
    var cv = OBS.engine.canvas, down = { x: 0, y: 0 }, ray = new T.Raycaster(), ndc = new T.Vector2();
    function pick(cx, cy) {
      var r = cv.getBoundingClientRect();
      ndc.set(((cx - r.left) / r.width) * 2 - 1, -((cy - r.top) / r.height) * 2 + 1); ray.setFromCamera(ndc, camera);
      var h = ray.intersectObjects(hits, false); return h.length ? h[0].object.userData.id : null;
    }
    L._pick = pick;
    cv.addEventListener('pointerdown', function (e) { down.x = e.clientX; down.y = e.clientY; });
    cv.addEventListener('pointerup', function (e) {
      if (OBS.engine.level !== L || e.button !== 0 || Math.hypot(e.clientX - down.x, e.clientY - down.y) > 6) return;
      var id = pick(e.clientX, e.clientY); if (id) clickItem(id);
    });
    cv.addEventListener('pointermove', function (e) { if (OBS.engine.level !== L) return; var id = pick(e.clientX, e.clientY); hover = id; cv.classList.toggle('over', !!id); });
    // double-clic sur un objet : y aller de plus près (le voisinage pour le Soleil, la visite pour un système d'exoplanètes) ; dans le vide : vue d'ensemble
    cv.addEventListener('dblclick', function (e) {
      if (OBS.engine.level !== L) return;
      var id = pick(e.clientX, e.clientY);
      if (!id) { if (selected) L.select(null); return; }
      if (id === 'soleil-g') OBS.engine.go('voisinage', { from: 'galaxie' });
      else if (byId[id].exo) OBS.engine.go('etoile', { star: id });
      else L.select(id);
    });
    // zoom avant au plus près du Soleil, en insistant : on entre dans le voisinage stellaire
    var push = 0, pushT = 0, atMax = 0, lastW = 0, armed = false, out = 0;
    cv.addEventListener('wheel', function (e) {
      if (OBS.engine.level !== L || flight) return;
      // dézoom en butée, après une courte pause puis en insistant : on sort vers le Groupe local
      if (e.deltaY > 0 && !selected) {
        var t = performance.now(), gap = t - lastW; lastW = t;
        if (camera.position.distanceTo(controls.target) < controls.maxDistance * .97) { atMax = 0; armed = false; out = 0; return; }
        if (!atMax) { atMax = t; OBS.emit('edge', 0); return; }
        if (!armed) { if (gap > 300 && t - atMax > 500) { armed = true; out = 0; } else { OBS.emit('edge', 0); return; } }
        if (++out >= 5) { out = 0; armed = false; atMax = 0; OBS.engine.go('groupe-local', { from: 'galaxie' }); } else OBS.emit('edge', out / 5);
        return;
      }
      if (e.deltaY >= 0) return;
      if (selected !== 'soleil-g' || camera.position.distanceTo(sunPos) > controls.minDistance * 1.8 + 1) return;
      var now = performance.now(); if (now - pushT > 900) push = 0; pushT = now;
      if (++push >= 3) { push = 0; OBS.engine.go('voisinage', { from: 'galaxie' }); }
    }, { passive: true });
  };

  function clickItem(id) {
    if (id === selected && id === 'soleil-g' && !flight) { OBS.engine.go('voisinage', { from: 'galaxie' }); return; }
    if (id === selected && byId[id].exo && !flight) { OBS.engine.go('etoile', { star: id }); return; }
    L.select(id);
  }
  function homeCam(out) { var el = 52 * D2R, d = 1150 / Math.max(.42, Math.min(1.3, camera.aspect)); return out.set(-Math.cos(el) * d * .35, Math.sin(el) * d, Math.cos(el) * d * .94); }
  function ease(k) { return k < .5 ? 4 * k * k * k : 1 - Math.pow(-2 * k + 2, 3) / 2; }
  function viewDist(it) {
    if (!it) return homeCam(tmp).length();
    if (it.arm) return 520;
    if (it.exo) return 70 * Math.max(1, .95 / camera.aspect);
    var d = it.def.id === 'soleil-g' ? 240 : it.def.id === 'sgra' ? 160 : it.def.gal ? 420 : it.def.ly > 50000 ? 600 : 120;
    return d * Math.max(1, .95 / camera.aspect);
  }
  function startFlight(id, dur) {
    flight = { t: 0, dur: dur || 2.2, id: id, fromOff: camera.position.clone().sub(controls.target), fromTgt: controls.target.clone() };
    controls.enabled = false;
  }
  L.select = function (id) {
    selected = id && byId[id] ? id : null;
    startFlight(selected);
    OBS.emit('select', { level: 'galaxie', id: selected });
    OBS.emit('crumbs');
  };
  L.focus = L.select;
  L.selected = function () { return selected; };
  L.get = function (id) { return byId[id]; };
  L.crumbs = function () {
    var c = [{ label: 'Voie lactée', act: function () { L.select(null); }, current: !selected }];
    if (selected) c.push({ label: byId[selected].def.name, current: true });
    return c;
  };
  /* distances en direct pour la console */
  L.info = function (id) {
    var it = byId[id]; if (!it) return null;
    return { fromSun: it.def.ly, fromCenter: it.pos.length() * U };
  };

  L.enter = function (opts) {
    L._inward = 0; controls.enabled = true; selected = null;
    if (opts.from === 'voisinage') {                   // on vient du voisinage : on part du Soleil et on s'éloigne
      controls.target.copy(sunPos); camera.position.copy(sunPos).add(tmp.set(0, 3, 6));
      startFlight(null, 3.4);
    } else if (opts.from === 'groupe-local') {          // on plonge depuis le Groupe local
      camera.position.copy(homeCam(tmp)).multiplyScalar(3.2); controls.target.set(0, 0, 0); startFlight(null, 2.6);
    } else { homeCam(camera.position); controls.target.set(0, 0, 0); }
    if (opts.focus) L.select(opts.focus);
    OBS.emit('select', { level: 'galaxie', id: selected });
    OBS.emit('crumbs');
  };
  L.leave = function () { controls.enabled = false; };
  L.leaveAnim = function () { flight = null; controls.enabled = false; L._inward = 1; };
  L.resize = function (w, h, pr) {
    W = w; H = h; PR = pr; camera.aspect = W / H; camera.updateProjectionMatrix();
    uniforms.forEach(function (u) { u.uPR.value = PR; u.uScaleH.value = H / (2 * tanHalf); });
  };

  /* ---------- temps galactique : le Soleil autour du centre ----------
     Orbite simplifiée en cercle de rayon R0 dans le plan, période ≈ 230 millions d'années (estimations 220 à 250),
     sens de rotation réel (horaire vu du pôle Nord galactique), oscillation verticale ≈ ± 280 al en ≈ 64 millions
     d'années (montée actuelle). Les bras et les étoiles voisines ne bougent pas dans ce mode (eux aussi tournent). */
  var GT = { P: 230, Pz: 64, Az: 280 }, gtObj = null;
  function gtPos(t, out) {
    var th = TAU * t / GT.P, ph = Math.asin(Math.min(1, GX.zSun / GT.Az));
    var z = GT.Az * Math.sin(TAU * t / GT.Pz + ph);
    return out.set(-R0 * Math.cos(th), z / U, -R0 * Math.sin(th));
  }
  L.galTime = function (on) {
    if (on && !gtObj) {
      var pts = []; for (var i = 0; i <= 256; i++) { var a = TAU * i / 256; pts.push(new T.Vector3(-R0 * Math.cos(a), 0, -R0 * Math.sin(a))); }
      var ring = new T.Line(new T.BufferGeometry().setFromPoints(pts), new T.LineDashedMaterial({ color: 0xffd27a, transparent: true, opacity: .35, dashSize: 6, gapSize: 5, depthWrite: false }));
      ring.computeLineDistances();
      var trail = new T.Line(new T.BufferGeometry(), new T.LineBasicMaterial({ color: 0xffd27a, transparent: true, opacity: .9, depthWrite: false }));
      var c = document.createElement('canvas'); c.width = c.height = 64; var g = c.getContext('2d'), gr = g.createRadialGradient(32, 32, 0, 32, 32, 32);
      gr.addColorStop(0, 'rgba(255,240,200,1)'); gr.addColorStop(.25, 'rgba(255,210,122,.9)'); gr.addColorStop(1, 'rgba(255,180,80,0)'); g.fillStyle = gr; g.fillRect(0, 0, 64, 64);
      var mk = new T.Sprite(new T.SpriteMaterial({ map: new T.CanvasTexture(c), sizeAttenuation: false, transparent: true, depthWrite: false, blending: T.AdditiveBlending }));
      mk.scale.set(.032, .032, 1); mk.renderOrder = 6;
      gtObj = new T.Group(); gtObj.add(ring, trail, mk); gtObj.userData = { trail: trail, mk: mk };
      scene.add(gtObj);
    }
    if (gtObj) gtObj.visible = !!on;
    L.gtOn = !!on;
    if (on) { L.select(null); flight = null; startFlight(null, 1.6); L.gtSet(L.gtT || 0); }
  };
  L.gtSet = function (t) {
    L.gtT = t; if (!gtObj) return null;
    var p = gtPos(t, new T.Vector3()); gtObj.userData.mk.position.copy(p);
    var n = Math.max(2, Math.min(400, Math.round(Math.abs(t) / 1.5))), pts = [];
    for (var i = 0; i <= n; i++) pts.push(gtPos(t * i / n, new T.Vector3()));
    gtObj.userData.trail.geometry.dispose(); gtObj.userData.trail.geometry = new T.BufferGeometry().setFromPoints(pts);
    return { turns: t / GT.P, z: p.y * U, P: GT.P };
  };
  L.GT = GT;

  var TOP = 96;
  L.update = function (dt) {
    if (L._inward) { controls.target.lerp(sunPos, Math.min(1, dt * 4)); camera.position.lerp(sunPos, Math.min(1, dt * 2.4)); }
    if (flight) {
      flight.t += dt;
      var k = Math.min(1, flight.t / flight.dur), e = ease(k);
      var it = flight.id ? byId[flight.id] : null, tgt = it ? it.pos : tmp2.set(0, 0, 0);
      var dTo = viewDist(it), dFrom = Math.max(flight.fromOff.length(), .01);
      var dir = tmp.copy(flight.fromOff).normalize();
      if (!it) dir.lerp(homeCam(v3).normalize(), e).normalize();
      controls.target.lerpVectors(flight.fromTgt, tgt, e);
      camera.position.copy(controls.target).addScaledVector(dir, Math.exp(Math.log(dFrom) * (1 - e) + Math.log(dTo) * e));
      if (k >= 1) { flight = null; controls.enabled = true; }
    }
    controls.update();
    camera.updateMatrixWorld();

    var occ = [];
    items.forEach(function (it) { it.hitScale = 16 / (H / 2) * camera.position.distanceTo(it.pos) * tanHalf; });
    hits.forEach(function (h) { var it = byId[h.userData.id]; h.scale.setScalar(Math.max(.5, it.hitScale || 1)); });
    var list = items.slice().sort(function (a, b) {
      function pri(x) { return x.id === selected ? 100 : x.id === hover ? 90 : x.def.sun ? 80 : x.id === 'sgra' ? 70 : x.arm ? 10 : x.exo ? 5 : 30; }
      return pri(b) - pri(a);
    });
    list.forEach(function (it) {
      var el = it.el;
      camSpace.copy(it.pos).applyMatrix4(camera.matrixWorldInverse);
      v3.copy(it.pos).project(camera);
      var x = (v3.x * .5 + .5) * W, y = (-v3.y * .5 + .5) * H;
      var show = camSpace.z < 0 && x > -60 && x < W + 60 && y > -30 && y < H + 30;
      if (it.arm && selected && selected !== it.id) show = false;
      // exoplanètes : près du Soleil seulement (sinon elles se confondent avec lui)
      if (it.exo && it.id !== selected && it.id !== hover && camera.position.distanceTo(it.pos) > 140) show = false;
      if (show) {
        if (!el._w) { el._w = el.offsetWidth || 90; el._h = el.offsetHeight || 22; }
        var off = it.arm ? -el._w / 2 : 10, box = { l: x + off, t: y - el._h / 2, r: x + off + el._w, b: y + el._h / 2 };
        var clash = box.t < TOP || occ.some(function (o) { return box.l < o.r + 4 && box.r + 4 > o.l && box.t < o.b + 2 && box.b + 2 > o.t; });
        show = !clash || it.id === selected;
        if (show) { occ.push(box); el.style.transform = 'translate(' + x.toFixed(1) + 'px,' + y.toFixed(1) + 'px)'; el.style.setProperty('--off', off + 'px'); }
      }
      el.classList.toggle('hid', !show);
      el.classList.toggle('active', it.id === selected);
      el.classList.toggle('hov', it.id === hover);
    });
  };
})();

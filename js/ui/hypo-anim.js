/* ======================================================================
   OBSERVATOIRE — animations 3D des hypothèses
   Illustrations conceptuelles, pas des simulations physiques : elles montrent l'idée d'une fiche.
   Chaque animation : OBS.HYPO_ANIM[nom](conteneur) → { dispose() }.
   ====================================================================== */
(function () {
  'use strict';
  var OBS = window.OBS = window.OBS || {};
  var T = window.THREE;
  OBS.HYPO_ANIM = OBS.HYPO_ANIM || {};

  /* ----------------------------------------------------------------------
     Caelesterium : simulation conceptuelle, paramètres non calibrés.
     Deux architectures au choix (croûte minérale poreuse, enveloppe périphérique hypothétique).
     La matière circule à l'intérieur (sublimation, migration de vapeur, redépôt) ; près de l'étoile,
     l'activité augmente. Trois grandeurs illustratives distinguent les trois propriétés C.A.R. :
       Matière retenue (conservation) — varie avec les pertes et les apports extérieurs ;
       Pression interne (autorégulation) — monte avec l'activité, les dégazages la soulagent ;
       Cohésion structurelle (régénération) — les redépôts la renforcent, les contraintes thermiques l'usent.
     Le recyclage interne (redépôts) n'est jamais compté comme un gain de matière.
     ---------------------------------------------------------------------- */
  OBS.HYPO_ANIM.caelesterium = function (host) {
    host.innerHTML = '<div class="hanim"><div class="hanim-stage"><span class="viewer-tag">Simulation conceptuelle · paramètres non calibrés</span>' +
      '<div class="ha-read" aria-live="off"><span><i>Activité</i><b data-r="act">—</b></span><span class="r-loss"><i>Pertes</i><b data-r="loss">—</b></span><span class="r-redep"><i>Redépôts</i><b data-r="redep">—</b></span><span class="r-gain"><i>Apports</i><b data-r="gain">—</b></span><span><i>Bilan net</i><b data-r="bil">—</b></span></div></div>' +
      '<div class="hanim-ctrl">' +
      '<div class="ha-lab">Architecture</div>' +
      '<div class="ha-seg" role="group" aria-label="Architecture"><button type="button" data-arch="crust" aria-pressed="true">Croûte poreuse</button><button type="button" data-arch="env" aria-pressed="false">Enveloppe</button></div>' +
      '<div class="ha-lab">Régime</div>' +
      '<div class="ha-seg" role="group" aria-label="Régime"><button type="button" data-reg="cons" aria-pressed="true">Conservatif</button><button type="button" data-reg="actif" aria-pressed="false">Actif</button></div>' +
      '<label class="ha-row"><span>Distance à l\'étoile</span><input type="range" min="0" max="100" value="12" data-k="dist" aria-label="Rapprocher ou éloigner l\'étoile"><small data-o="dist"></small></label>' +
      '<label class="ha-row ha-check"><input type="checkbox" data-k="cut"><span>Vue en coupe (structure interne)</span></label>' +
      '<div class="ha-lab">Principe C.A.R. · valeurs illustratives</div>' +
      '<div class="ha-g g-c"><span>Matière retenue <em>conservation</em></span><i><b data-g="m"></b></i><small data-gv="m"></small></div>' +
      '<div class="ha-g g-a"><span>Pression interne <em>autorégulation</em></span><i><b data-g="p"></b></i><small data-gv="p"></small></div>' +
      '<div class="ha-g g-r"><span>Cohésion structurelle <em>régénération</em></span><i><b data-g="c"></b></i><small data-gv="c"></small></div>' +
      '<p class="ha-hint" data-hint aria-live="polite"></p>' +
      '<ul class="ha-leg"><li><i style="background:#7fe3ff"></i>vapeur qui migre</li><li><i style="background:#f2f6ff"></i>redépôt (recyclage interne)</li><li><i style="background:#ff9a5c"></i>pertes vers l\'espace</li><li><i style="background:#ffd27a"></i>apports extérieurs</li></ul>' +
      '<p class="note" style="margin:4px 0 0">Matière et cohésion évoluent séparément : on peut perdre de la matière sans perdre sa cohésion, ou l\'inverse. Les redépôts ne sont pas des gains. Aucune valeur n\'est calibrée. <button type="button" class="ha-reset" data-reset>Réinitialiser</button></p>' +
      '</div></div>';
    var stageEl = host.querySelector('.hanim-stage'), ctrl = host.querySelector('.hanim-ctrl');
    var renderer;
    try { renderer = new T.WebGLRenderer({ antialias: true }); } catch (e) { stageEl.insertAdjacentHTML('beforeend', '<p class="note" style="padding:40px 16px">WebGL indisponible.</p>'); return { dispose: function () {} }; }
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.localClippingEnabled = true;
    stageEl.insertBefore(renderer.domElement, stageEl.firstChild);
    var scene = new T.Scene(), camera = new T.PerspectiveCamera(36, 1, .01, 500);
    camera.position.set(0, 1.1, 6.4);
    var controls = new T.OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true; controls.enablePan = false; controls.minDistance = 2.4; controls.maxDistance = 16;

    function rnd(seed) { var x = seed >>> 0; return function () { x = (x * 1664525 + 1013904223) >>> 0; return x / 4294967296; }; }
    var R = rnd(7);
    function randDir(out) { var u = R() * 2 - 1, t = R() * Math.PI * 2, s = Math.sqrt(1 - u * u); return out.set(s * Math.cos(t), u, s * Math.sin(t)); }
    function smooth(x) { return x * x * (3 - 2 * x); }

    // fond étoilé discret
    var sg = new T.BufferGeometry(), sp = new Float32Array(1200 * 3), v = new T.Vector3();
    for (var i = 0; i < 1200; i++) { randDir(v); sp[i * 3] = v.x * 150; sp[i * 3 + 1] = v.y * 150; sp[i * 3 + 2] = v.z * 150; }
    sg.setAttribute('position', new T.BufferAttribute(sp, 3));
    scene.add(new T.Points(sg, new T.PointsMaterial({ color: 0x7880a0, size: .45 })));

    // l'étoile : lumière et halo, à une distance réglable
    var sunLight = new T.DirectionalLight(0xfff0d8, 1), amb = new T.AmbientLight(0x2a3050, .55);
    scene.add(sunLight); scene.add(amb);
    var glowTex = OBS.system && OBS.system.glowA, softTex = OBS.system && OBS.system.softTex;
    var star = new T.Sprite(new T.SpriteMaterial({ map: glowTex || null, color: 0xffe2b0, blending: T.AdditiveBlending, depthWrite: false, transparent: true }));
    scene.add(star);
    var sunDir = new T.Vector3(-1, .25, .35).normalize();

    // relief de la croûte (même fonction pour la surface et les fractures)
    function relief(d) {
      var n = Math.sin(d.x * 5.1 + 1.3) * Math.sin(d.y * 4.3 + .7) * Math.sin(d.z * 6.2 + 2.1) * .07 + Math.sin(d.x * 13 + d.z * 11) * .018 + Math.sin(d.y * 17 - d.x * 9) * .012;
      return { n: n, k: 1 + .12 * Math.pow(Math.max(0, d.x), 2) - .06 * d.y * d.y + n };
    }

    // le corps : noyau, cavités glacées, croûte irrégulière, fractures, enveloppe
    var body = new T.Group(); scene.add(body);
    var clip = new T.Plane(new T.Vector3(0, 0, -1), 0), clips = [];
    var core = new T.Mesh(new T.SphereGeometry(.42, 48, 32), new T.MeshStandardMaterial({ color: 0x5a4636, roughness: .95, metalness: 0 }));
    body.add(core);
    var m4 = new T.Matrix4(), q = new T.Quaternion(), sc = new T.Vector3();
    // cavités : petites poches glacées (enveloppe) ou grandes cavités irrégulières dans la croûte poreuse
    function cavities(n, r0, r1, s0, s1, color, op) {
      var mesh = new T.InstancedMesh(new T.SphereGeometry(1, 16, 12), new T.MeshStandardMaterial({ color: color, roughness: .4, emissive: 0x0b2a40, transparent: true, opacity: op }), n);
      for (var p = 0; p < n; p++) { randDir(v).multiplyScalar(r0 + R() * (r1 - r0)); var s = s0 + R() * (s1 - s0); q.setFromAxisAngle(randDir(sc).clone(), R() * 3); m4.compose(v, q, sc.set(s * (1 + R() * .8), s * (.5 + R() * .4), s)); mesh.setMatrixAt(p, m4); }
      body.add(mesh); return mesh;
    }
    var poresEnv = cavities(46, .5, .86, .035, .085, 0x9fd6ff, .7);
    var poresCrust = cavities(60, .55, .92, .035, .09, 0x6d8fa8, .5);
    var crustGeo = new T.SphereGeometry(1, 128, 96), cp = crustGeo.attributes.position, cols = new Float32Array(cp.count * 3);
    for (var k = 0; k < cp.count; k++) {
      v.fromBufferAttribute(cp, k); var rl = relief(v);
      v.multiplyScalar(rl.k); cp.setXYZ(k, v.x, v.y, v.z);
      var ice = Math.max(0, Math.min(1, .5 + rl.n * 7 + v.y * .25)), c0 = [.36, .3, .26], c1 = [.78, .84, .9];
      cols[k * 3] = c0[0] + (c1[0] - c0[0]) * ice; cols[k * 3 + 1] = c0[1] + (c1[1] - c0[1]) * ice; cols[k * 3 + 2] = c0[2] + (c1[2] - c0[2]) * ice;
    }
    crustGeo.setAttribute('color', new T.BufferAttribute(cols, 3)); crustGeo.computeVertexNormals();
    var crustMat = new T.MeshStandardMaterial({ vertexColors: true, roughness: .92, metalness: 0, side: T.DoubleSide, emissive: 0x000000 });
    var crust = new T.Mesh(crustGeo, crustMat); body.add(crust);
    // fractures de la croûte : des lignes brisées posées sur la surface ; elles s'ouvrent (lueur) quand la pression s'évacue
    var fracGroup = new T.Group(); body.add(fracGroup);
    var fracDirs = [], fracMat = new T.LineBasicMaterial({ color: 0x2a1a12, transparent: true, opacity: .9 });
    for (var f = 0; f < 7; f++) {
      var d0 = randDir(new T.Vector3()), tg = randDir(new T.Vector3()).cross(d0).normalize(), pts = [];
      fracDirs.push(d0.clone());
      for (var st = -7; st <= 7; st++) {
        var dd = d0.clone().addScaledVector(tg, st * .035 + (R() - .5) * .012).add(randDir(new T.Vector3()).multiplyScalar(.012)).normalize();
        pts.push(dd.multiplyScalar(relief(dd).k * 1.004));
      }
      fracGroup.add(new T.Line(new T.BufferGeometry().setFromPoints(pts), fracMat));
    }
    var envMat = new T.ShaderMaterial({
      uniforms: { uK: { value: .5 }, uCol: { value: new T.Color(0xb49cff) }, uSun: { value: sunDir }, uAct: { value: 0 } },
      vertexShader: 'varying vec3 vN; varying vec3 vV; varying vec3 vW; void main(){ vec4 w = modelMatrix * vec4(position,1.0); vW = normalize(w.xyz); vN = normalize(normalMatrix * normal); vV = normalize(-(modelViewMatrix * vec4(position,1.0)).xyz); gl_Position = projectionMatrix * viewMatrix * w; }',
      fragmentShader: 'uniform float uK; uniform vec3 uCol; uniform vec3 uSun; uniform float uAct; varying vec3 vN; varying vec3 vV; varying vec3 vW; void main(){ float f = pow(1.0 - abs(dot(vN, vV)), 2.6); float lit = .55 + .45 * max(0.0, dot(vW, uSun)); vec3 c = mix(uCol, vec3(1.0,.8,.6), uAct * max(0.0, dot(vW, uSun)) * .6); gl_FragColor = vec4(c * lit, f * uK); }',
      transparent: true, depthWrite: false, blending: T.AdditiveBlending, side: T.FrontSide
    });
    var env = new T.Mesh(new T.SphereGeometry(1.38, 64, 48), envMat); body.add(env);

    // circulation interne : chaque grain monte des cavités, migre, puis se redépose
    var arch = 'crust';
    var N = 900, gp = new Float32Array(N * 3), gc = new Float32Array(N * 3), G = [];
    for (var g = 0; g < N; g++) G.push(spawn({}));
    function spawn(o) {
      o.d = randDir(o.d || new T.Vector3()); o.ax = randDir(o.ax || new T.Vector3());
      o.rIn = .52 + R() * .34; o.ph = R(); o.sp = .05 + R() * .07; o.esc = 0; o.r = o.rIn; o.u = R();
      setOut(o); return o;
    }
    // croûte poreuse : la vapeur reste sous la surface ; enveloppe : elle monte jusqu'à l'enveloppe
    function setOut(o) { o.rOut = arch === 'crust' ? Math.max(o.rIn + .05, .84 + o.u * .12) : 1.1 + o.u * .22; }
    var grains = new T.BufferGeometry();
    grains.setAttribute('position', new T.BufferAttribute(gp, 3)); grains.setAttribute('color', new T.BufferAttribute(gc, 3));
    var grainPts = new T.Points(grains, new T.PointsMaterial({ size: .16, map: softTex || null, vertexColors: true, transparent: true, blending: T.AdditiveBlending, depthWrite: false, sizeAttenuation: true }));
    grainPts.frustumCulled = false; body.add(grainPts);
    // apports extérieurs : des poussières de l'espace, parfois captées
    var M = 140, dp = new Float32Array(M * 3), dc = new Float32Array(M * 3), D = [];
    for (var j = 0; j < M; j++) D.push(dust({}, true));
    function dust(o, init) { o.p = randDir(o.p || new T.Vector3()).multiplyScalar(init ? 2 + R() * 4 : 5.5 + R() * 1.5); o.v = .2 + R() * .35; o.on = init ? R() < .25 : false; return o; }
    var dustGeo = new T.BufferGeometry();
    dustGeo.setAttribute('position', new T.BufferAttribute(dp, 3)); dustGeo.setAttribute('color', new T.BufferAttribute(dc, 3));
    var dustPts = new T.Points(dustGeo, new T.PointsMaterial({ size: .2, map: softTex || null, vertexColors: true, transparent: true, blending: T.AdditiveBlending, depthWrite: false }));
    dustPts.frustumCulled = false; scene.add(dustPts);

    /* état (illustratif, sans unité) et commandes */
    var target = .12, act = .12, actPrev = .12, cut = false, alive = true, last = 0;
    var losses = [], gains = [], redeps = [], vents = [];
    var Mat = 1, Pr = .2, Coh = .8, ventFx = 0, lastVent = -1e9;
    function reset() { Mat = 1; Pr = .2; Coh = .8; losses.length = gains.length = redeps.length = vents.length = 0; G.forEach(spawn); }
    var inpDist = ctrl.querySelector('[data-k="dist"]'), outDist = ctrl.querySelector('[data-o="dist"]');
    function setTarget(x, fromSlider) {
      target = Math.max(0, Math.min(1, x));
      if (!fromSlider) inpDist.value = Math.round(target * 100);
      outDist.textContent = target < .35 ? 'loin, froid' : target < .65 ? 'intermédiaire' : 'proche, irradié';
      Array.prototype.forEach.call(ctrl.querySelectorAll('[data-reg]'), function (b) { b.setAttribute('aria-pressed', String((b.getAttribute('data-reg') === 'actif') === (target >= .5))); });
    }
    function setArch(a) {
      arch = a === 'env' ? 'env' : 'crust';
      Array.prototype.forEach.call(ctrl.querySelectorAll('[data-arch]'), function (b) { b.setAttribute('aria-pressed', String(b.getAttribute('data-arch') === arch)); });
      G.forEach(function (o) { if (!o.esc) setOut(o); });
      applyVis();
    }
    function applyVis() {
      env.visible = arch === 'env' && !cut;
      fracGroup.visible = arch === 'crust';
      poresEnv.visible = arch === 'env'; poresCrust.visible = arch === 'crust';
      crustMat.clippingPlanes = clips; fracMat.clippingPlanes = clips; crustMat.needsUpdate = true; fracMat.needsUpdate = true;
    }
    setTarget(.12); setArch('crust');
    ctrl.addEventListener('click', function (e) {
      var b = e.target.closest('[data-reg]'); if (b) { setTarget(b.getAttribute('data-reg') === 'actif' ? .88 : .12); return; }
      var a = e.target.closest('[data-arch]'); if (a) { setArch(a.getAttribute('data-arch')); return; }
      if (e.target.closest('[data-reset]')) reset();
    });
    inpDist.addEventListener('input', function () { setTarget(+inpDist.value / 100, true); });
    ctrl.querySelector('[data-k="cut"]').addEventListener('change', function () { cut = this.checked; clips = cut ? [clip] : []; applyVis(); });
    var rd = {}, gb = {}, gv = {};
    Array.prototype.forEach.call(host.querySelectorAll('[data-r]'), function (b) { rd[b.getAttribute('data-r')] = b; });
    Array.prototype.forEach.call(host.querySelectorAll('[data-g]'), function (b) { gb[b.getAttribute('data-g')] = b; });
    Array.prototype.forEach.call(host.querySelectorAll('[data-gv]'), function (b) { gv[b.getAttribute('data-gv')] = b; });
    var hintEl = host.querySelector('[data-hint]');

    var tmp = new T.Vector3(), w = new T.Vector3(), qa = new T.Quaternion(), fracCol = new T.Color(), cDark = new T.Color(0x2a1a12), cHot = new T.Color(0xff9a5c), cHeal = new T.Color(0x6e6258);
    var redepNow = 0, lossNow = 0, gainNow = 0, trendC = 0;
    function escapeGrain(o, sunLocal) {
      o.esc = .001;
      if (arch === 'crust') {                                          // par la croûte, la vapeur ne sort que par les fractures
        var best = fracDirs[0], bd = -2;
        for (var f = 0; f < fracDirs.length; f++) { var dt2 = fracDirs[f].dot(o.d) + .3 * fracDirs[f].dot(sunLocal); if (dt2 > bd) { bd = dt2; best = fracDirs[f]; } }
        o.d.copy(best).addScaledVector(randDir(tmp), .08).normalize();
        o.r = relief(o.d).k * .98; o.rOut = o.r;
      }
    }
    function step(dt, now) {
      actPrev = act;
      act += (target - act) * Math.min(1, dt * 1.6);
      var shock = Math.abs(act - actPrev) / Math.max(dt, 1e-3);   // variation brusque des conditions : choc thermique
      // l'étoile se rapproche : plus grosse, plus lumineuse
      var dist = 30 - act * 22;
      star.position.copy(sunDir).multiplyScalar(dist); star.scale.setScalar(4 + act * 10);
      sunLight.position.copy(sunDir).multiplyScalar(10); sunLight.intensity = .35 + act * 1.5;
      envMat.uniforms.uK.value = (.38 + .07 * Math.sin(now * .0011) + act * .25 + ventFx * .35) * (.35 + .65 * Coh); envMat.uniforms.uAct.value = act;
      crustMat.emissive.setRGB(.05 * act + ventFx * .05, .02 * act, 0);
      body.rotation.y += dt * .06;
      clip.normal.copy(camera.position).normalize().negate(); clip.constant = 0;   // le plan de coupe suit la caméra

      /* --- autorégulation : la pression interne monte avec l'activité ; au-delà d'un seuil, un dégazage la soulage --- */
      var vapor = act * (arch === 'crust' ? .55 : .42);
      Pr += dt * (vapor - Pr * (arch === 'crust' ? .16 : .26));
      var inv = body.quaternion.clone().invert(), sunLocal = new T.Vector3().copy(sunDir).applyQuaternion(inv);
      if (Pr > .78 && now - lastVent > 1600) {                          // dégazage : une perte qui protège
        lastVent = now; vents.push(now); Pr -= .32; ventFx = 1;
        var burst = 0;
        for (var b0 = 0; b0 < N && burst < 26; b0++) { var oo = G[(b0 * 37 + (now | 0)) % N]; if (!oo.esc && oo.d.dot(sunLocal) > -.1) { escapeGrain(oo, sunLocal); burst++; } }
        if (arch === 'crust') Coh -= .012;                               // une fracture s'ouvre un peu
      }
      ventFx = Math.max(0, ventFx - dt * 1.4);

      /* --- circulation --- */
      redepNow = 0; lossNow = 0;
      for (var i = 0; i < N; i++) {
        var o = G[i], face = Math.max(0, o.d.dot(sunLocal)), speed = o.sp * (.12 + 2.2 * act * (.35 + .65 * face));
        if (o.esc) {                                                   // grain qui s'échappe : il file vers l'extérieur et s'éteint
          o.esc += dt * (.5 + act); o.r = o.rOut + o.esc * 2.4;
          if (o.r > 4) { losses.push(now); lossNow++; spawn(o); }
        } else {
          o.ph += dt * speed;
          if (o.ph >= 1) { o.ph -= 1; redeps.push(now); redepNow++; }   // cycle complet : la matière s'est redéposée (recyclage interne)
          var ph = o.ph;
          if (ph < .45) o.r = o.rIn + (o.rOut - o.rIn) * smooth(ph / .45);
          else if (ph < .62) o.r = o.rOut;
          else o.r = o.rOut + (o.rIn - o.rOut) * smooth((ph - .62) / .38);
          qa.setFromAxisAngle(o.ax, dt * speed * (ph >= .45 && ph < .62 ? 2.2 : .25)); o.d.applyQuaternion(qa);
          // près de l'étoile, une partie de la vapeur côté éclairé s'échappe (moins facilement à travers une croûte saine)
          var leak = arch === 'crust' ? .9 + (1 - Coh) * 2.2 : 2.2;
          if (ph > .36 && ph < .45 && R() < dt * act * act * face * leak) escapeGrain(o, sunLocal);
        }
        w.copy(o.d).multiplyScalar(o.r);
        gp[i * 3] = w.x; gp[i * 3 + 1] = w.y; gp[i * 3 + 2] = w.z;
        var br = .25 + .75 * Math.min(1, .25 + act * 1.2);
        if (o.esc) { var fa = Math.max(0, 1 - o.esc * .6); gc[i * 3] = fa; gc[i * 3 + 1] = .6 * fa; gc[i * 3 + 2] = .36 * fa; }
        else if (o.ph < .45) { gc[i * 3] = .5 * br; gc[i * 3 + 1] = .89 * br; gc[i * 3 + 2] = br; }
        else if (o.ph < .62) { var e = .7 * br; gc[i * 3] = .7 * e; gc[i * 3 + 1] = .62 * e; gc[i * 3 + 2] = e; }
        else { var d2 = .8 * br; gc[i * 3] = .95 * d2; gc[i * 3 + 1] = .97 * d2; gc[i * 3 + 2] = d2; }
      }
      grains.attributes.position.needsUpdate = true; grains.attributes.color.needsUpdate = true;

      /* --- apports extérieurs --- */
      gainNow = 0;
      var capR = arch === 'env' ? 1.38 : 1.1;
      for (var jj = 0; jj < M; jj++) {
        var u = D[jj];
        if (!u.on && R() < dt * (.03 + act * .25)) u.on = true;
        if (u.on) { tmp.copy(u.p).normalize(); u.p.addScaledVector(tmp, -dt * u.v); }
        if (u.p.length() < capR) { gains.push(now); gainNow++; dust(u, false); }
        dp[jj * 3] = u.p.x; dp[jj * 3 + 1] = u.p.y; dp[jj * 3 + 2] = u.p.z;
        var l = u.on ? .9 : .25; dc[jj * 3] = l; dc[jj * 3 + 1] = .82 * l; dc[jj * 3 + 2] = .48 * l;
      }
      dustGeo.attributes.position.needsUpdate = true; dustGeo.attributes.color.needsUpdate = true;

      /* --- conservation : seuls les pertes et les apports changent la matière (pas le recyclage) --- */
      Mat = Math.max(.4, Math.min(1.3, Mat + (gainNow - lossNow) * .0007));
      /* --- régénération et usure : les redépôts renforcent, les contraintes thermiques usent --- */
      var moderate = act > .15 && act < .72 ? 1 - Math.abs(act - .45) / .3 : 0;          // redépôts surtout efficaces en activité modérée
      var regen = Math.min(1, redepNow / Math.max(dt, 1e-3) / 140) * .03 * Math.max(0, moderate);
      var damage = Math.pow(Math.max(0, act - .6), 1.4) * .09 + Math.min(.12, shock * .05) + (Pr > 1 ? .05 : 0);
      var dC = (regen - damage) * dt;
      Coh = Math.max(.12, Math.min(1, Coh + dC));
      trendC += (dC / Math.max(dt, 1e-3) - trendC) * Math.min(1, dt * 2);
      // fractures : sombres, rougeoyantes pendant un dégazage, plus claires quand la croûte se « cicatrise »
      fracCol.copy(cDark).lerp(cHeal, Math.max(0, Coh - .6) * 1.5).lerp(cHot, ventFx * .9);
      fracMat.color.copy(fracCol); fracMat.opacity = .55 + (1 - Coh) * .45;

      /* --- relevés (10 dernières secondes) --- */
      if (now - last > 400) {
        last = now;
        [losses, gains, redeps, vents].forEach(function (a) { while (a.length && now - a[0] > 10000) a.shift(); });
        var L2 = losses.length, G2 = gains.length, Rd = redeps.length, net = G2 - L2;
        rd.act.textContent = act < .3 ? 'faible' : act < .65 ? 'modérée' : 'forte';
        rd.loss.textContent = L2; rd.redep.textContent = Rd; rd.gain.textContent = G2;
        rd.bil.textContent = !L2 && !G2 ? 'stable' : Math.abs(net) <= Math.max(2, (L2 + G2) * .2) ? 'équilibré' : net < 0 ? 'négatif' : 'positif';
        gauge('m', Mat / 1.3, Mat >= 1.01 ? 'en hausse' : Mat > .97 ? 'stable' : 'en baisse');
        gauge('p', Math.min(1, Pr / 1.05), now - lastVent < 2500 ? 'dégazage' : Pr > .7 ? 'élevée' : Pr > .35 ? 'modérée' : 'basse');
        gauge('c', Coh, trendC > .004 ? 'se renforce' : trendC < -.004 ? 's\'use' : 'stable');
        hintEl.textContent = hint(now);
      }
    }
    function gauge(k, x, label) { gb[k].style.width = Math.round(Math.max(0, Math.min(1, x)) * 100) + '%'; gv[k].textContent = label; }
    function hint(now) {
      var h = act < .3 ? 'Régime conservatif : peu d\'activité, la matière reste piégée. La stabilité seule ne prouve pas un fonctionnement C.A.R.'
        : act < .65 ? 'Activité modérée : la circulation et les redépôts renforcent la structure, les pertes restent limitées.'
        : 'Forte irradiation : les pertes et les contraintes thermiques augmentent. Se rapprocher de l\'étoile n\'est pas forcément bénéfique : la cohésion peut baisser.';
      if (now - lastVent < 2500) h += ' Dégazage : une perte qui soulage la pression interne.';
      if (Coh < .35) h += ' Cohésion faible : la structure se fragilise, même si la matière est encore là.';
      return h;
    }

    function resize() {
      var r = stageEl.getBoundingClientRect(), W = Math.max(200, r.width), H = Math.max(240, r.height);
      renderer.setSize(W, H, false); camera.aspect = W / H; camera.updateProjectionMatrix();
    }
    var ro = window.ResizeObserver ? new ResizeObserver(resize) : null; if (ro) ro.observe(stageEl); resize();
    var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches, prev = 0;
    function loop(now) {
      if (!alive) return; requestAnimationFrame(loop);
      var dt = Math.min(.05, prev ? (now - prev) / 1000 : .016); prev = now;
      if (document.hidden) return;
      step(reduce ? dt * .3 : dt, now);
      controls.update(); renderer.render(scene, camera);
    }
    requestAnimationFrame(loop);
    return { dispose: function () { alive = false; if (ro) ro.disconnect(); controls.dispose(); renderer.dispose(); if (renderer.forceContextLoss) renderer.forceContextLoss(); } };
  };
})();

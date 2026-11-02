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
     Caelesterium : un corps poreux de roches et de glaces, entouré d'une enveloppe.
     À l'intérieur, la matière circule (sublimation, migration de vapeur, dépôt) ;
     près de l'étoile, l'activité augmente : une partie s'échappe (pertes),
     des poussières sont captées (gains). Le bilan affiché est illustratif.
     ---------------------------------------------------------------------- */
  OBS.HYPO_ANIM.caelesterium = function (host) {
    host.innerHTML = '<div class="hanim"><div class="hanim-stage"><span class="viewer-tag">Illustration conceptuelle · aucune donnée</span>' +
      '<div class="ha-read" aria-live="off"><span><i>Activité</i><b data-r="act">—</b></span><span><i>Pertes</i><b data-r="loss">—</b></span><span><i>Captures</i><b data-r="gain">—</b></span><span><i>Bilan</i><b data-r="bil">—</b></span></div></div>' +
      '<div class="hanim-ctrl">' +
      '<div class="ha-seg" role="group" aria-label="Régime"><button type="button" data-reg="cons" aria-pressed="true">Régime conservatif</button><button type="button" data-reg="actif" aria-pressed="false">Régime actif</button></div>' +
      '<label class="ha-row"><span>Distance à l\'étoile</span><input type="range" min="0" max="100" value="12" data-k="dist" aria-label="Rapprocher ou éloigner l\'étoile"><small data-o="dist"></small></label>' +
      '<label class="ha-row ha-check"><input type="checkbox" data-k="cut"><span>Vue en coupe (structure interne)</span></label>' +
      '<ul class="ha-leg"><li><i style="background:#7fe3ff"></i>vapeur qui migre dans les pores</li><li><i style="background:#f2f6ff"></i>matière qui se redépose</li><li><i style="background:#ff9a5c"></i>pertes vers l\'espace</li><li><i style="background:#ffd27a"></i>poussières captées</li></ul>' +
      '<p class="note" style="margin:6px 0 0">Les proportions, vitesses et le bilan sont illustratifs. L\'hypothèse ne dit pas encore si un tel équilibre est possible.</p>' +
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

    // le corps : noyau, pores glacés, croûte irrégulière, enveloppe
    var body = new T.Group(); scene.add(body);
    var clip = new T.Plane(new T.Vector3(0, 0, -1), 0), clips = [];
    var core = new T.Mesh(new T.SphereGeometry(.42, 48, 32), new T.MeshStandardMaterial({ color: 0x5a4636, roughness: .95, metalness: 0 }));
    body.add(core);
    var poreGeo = new T.SphereGeometry(1, 16, 12), pores = new T.InstancedMesh(poreGeo, new T.MeshStandardMaterial({ color: 0x9fd6ff, roughness: .35, emissive: 0x0b2a40, transparent: true, opacity: .7 }), 46), m4 = new T.Matrix4(), q = new T.Quaternion(), sc = new T.Vector3();
    for (var p = 0; p < 46; p++) { randDir(v).multiplyScalar(.5 + R() * .36); var s = .035 + R() * .05; m4.compose(v, q, sc.set(s, s * (.7 + R() * .5), s)); pores.setMatrixAt(p, m4); }
    body.add(pores);
    var crustGeo = new T.SphereGeometry(1, 128, 96), cp = crustGeo.attributes.position, cols = new Float32Array(cp.count * 3);
    for (var k = 0; k < cp.count; k++) {
      v.fromBufferAttribute(cp, k);
      var n = Math.sin(v.x * 5.1 + 1.3) * Math.sin(v.y * 4.3 + .7) * Math.sin(v.z * 6.2 + 2.1) * .07 + Math.sin(v.x * 13 + v.z * 11) * .018 + Math.sin(v.y * 17 - v.x * 9) * .012;
      var lobe = 1 + .12 * Math.pow(Math.max(0, v.x), 2) - .06 * v.y * v.y;   // un peu irrégulier, pas une sphère parfaite
      v.multiplyScalar(lobe + n); cp.setXYZ(k, v.x, v.y, v.z);
      var ice = Math.max(0, Math.min(1, .5 + n * 7 + v.y * .25)), c0 = [.36, .3, .26], c1 = [.78, .84, .9];
      cols[k * 3] = c0[0] + (c1[0] - c0[0]) * ice; cols[k * 3 + 1] = c0[1] + (c1[1] - c0[1]) * ice; cols[k * 3 + 2] = c0[2] + (c1[2] - c0[2]) * ice;
    }
    crustGeo.setAttribute('color', new T.BufferAttribute(cols, 3)); crustGeo.computeVertexNormals();
    var crustMat = new T.MeshStandardMaterial({ vertexColors: true, roughness: .92, metalness: 0, side: T.DoubleSide, emissive: 0x000000 });
    var crust = new T.Mesh(crustGeo, crustMat); body.add(crust);
    var envMat = new T.ShaderMaterial({
      uniforms: { uK: { value: .5 }, uCol: { value: new T.Color(0xb49cff) }, uSun: { value: sunDir }, uAct: { value: 0 } },
      vertexShader: 'varying vec3 vN; varying vec3 vV; varying vec3 vW; void main(){ vec4 w = modelMatrix * vec4(position,1.0); vW = normalize(w.xyz); vN = normalize(normalMatrix * normal); vV = normalize(-(modelViewMatrix * vec4(position,1.0)).xyz); gl_Position = projectionMatrix * viewMatrix * w; }',
      fragmentShader: 'uniform float uK; uniform vec3 uCol; uniform vec3 uSun; uniform float uAct; varying vec3 vN; varying vec3 vV; varying vec3 vW; void main(){ float f = pow(1.0 - abs(dot(vN, vV)), 2.6); float lit = .55 + .45 * max(0.0, dot(vW, uSun)); vec3 c = mix(uCol, vec3(1.0,.8,.6), uAct * max(0.0, dot(vW, uSun)) * .6); gl_FragColor = vec4(c * lit, f * uK); }',
      transparent: true, depthWrite: false, blending: T.AdditiveBlending, side: T.FrontSide
    });
    var env = new T.Mesh(new T.SphereGeometry(1.38, 64, 48), envMat); body.add(env);

    // circulation interne : chaque grain monte des pores vers l'enveloppe, y dérive, puis se redépose
    var N = 900, gp = new Float32Array(N * 3), gc = new Float32Array(N * 3), G = [];
    for (var g = 0; g < N; g++) G.push(spawn({}));
    function spawn(o) {
      o.d = randDir(o.d || new T.Vector3()); o.ax = randDir(o.ax || new T.Vector3());
      o.rIn = .52 + R() * .34; o.rOut = 1.1 + R() * .22; o.ph = R(); o.sp = .05 + R() * .07; o.esc = 0; o.r = o.rIn;
      return o;
    }
    var grains = new T.BufferGeometry();
    grains.setAttribute('position', new T.BufferAttribute(gp, 3)); grains.setAttribute('color', new T.BufferAttribute(gc, 3));
    var grainPts = new T.Points(grains, new T.PointsMaterial({ size: .16, map: softTex || null, vertexColors: true, transparent: true, blending: T.AdditiveBlending, depthWrite: false, sizeAttenuation: true }));
    grainPts.frustumCulled = false; body.add(grainPts);
    // poussières de l'espace, parfois captées par l'enveloppe
    var M = 140, dp = new Float32Array(M * 3), dc = new Float32Array(M * 3), D = [];
    for (var j = 0; j < M; j++) D.push(dust({}, true));
    function dust(o, init) { o.p = randDir(o.p || new T.Vector3()).multiplyScalar(init ? 2 + R() * 4 : 5.5 + R() * 1.5); o.v = .2 + R() * .35; o.on = init ? R() < .25 : false; return o; }
    var dustGeo = new T.BufferGeometry();
    dustGeo.setAttribute('position', new T.BufferAttribute(dp, 3)); dustGeo.setAttribute('color', new T.BufferAttribute(dc, 3));
    var dustPts = new T.Points(dustGeo, new T.PointsMaterial({ size: .2, map: softTex || null, vertexColors: true, transparent: true, blending: T.AdditiveBlending, depthWrite: false }));
    dustPts.frustumCulled = false; scene.add(dustPts);

    /* état et commandes */
    var target = .12, act = .12, cut = false, losses = [], gains = [], alive = true, last = 0;
    var inpDist = ctrl.querySelector('[data-k="dist"]'), outDist = ctrl.querySelector('[data-o="dist"]');
    function setTarget(x, fromSlider) {
      target = Math.max(0, Math.min(1, x));
      if (!fromSlider) inpDist.value = Math.round(target * 100);
      outDist.textContent = target < .35 ? 'loin, froid' : target < .65 ? 'intermédiaire' : 'proche, irradié';
      Array.prototype.forEach.call(ctrl.querySelectorAll('[data-reg]'), function (b) { b.setAttribute('aria-pressed', String((b.getAttribute('data-reg') === 'actif') === (target >= .5))); });
    }
    setTarget(.12);
    ctrl.addEventListener('click', function (e) { var b = e.target.closest('[data-reg]'); if (b) setTarget(b.getAttribute('data-reg') === 'actif' ? .88 : .12); });
    inpDist.addEventListener('input', function () { setTarget(+inpDist.value / 100, true); });
    ctrl.querySelector('[data-k="cut"]').addEventListener('change', function () {
      cut = this.checked;
      clips = cut ? [clip] : [];
      crustMat.clippingPlanes = clips; crustMat.needsUpdate = true;
      env.visible = !cut;
    });
    var rd = {}; Array.prototype.forEach.call(host.querySelectorAll('[data-r]'), function (b) { rd[b.getAttribute('data-r')] = b; });

    var tmp = new T.Vector3(), w = new T.Vector3(), qa = new T.Quaternion();
    function step(dt, now) {
      act += (target - act) * Math.min(1, dt * 1.6);
      // l'étoile se rapproche : plus grosse, plus lumineuse
      var dist = 30 - act * 22;
      star.position.copy(sunDir).multiplyScalar(dist); star.scale.setScalar(4 + act * 10);
      sunLight.position.copy(sunDir).multiplyScalar(10); sunLight.intensity = .35 + act * 1.5;
      envMat.uniforms.uK.value = .38 + .22 * Math.sin(now * .0011) * .3 + act * .25; envMat.uniforms.uAct.value = act;
      crustMat.emissive.setRGB(.05 * act, .02 * act, 0);
      body.rotation.y += dt * .06;
      // le plan de coupe suit la caméra : on voit toujours l'intérieur
      clip.normal.copy(camera.position).normalize().negate(); clip.constant = 0;
      // circulation
      var inv = body.quaternion.clone().invert(), sunLocal = tmp.copy(sunDir).applyQuaternion(inv);
      for (var i = 0; i < N; i++) {
        var o = G[i], face = Math.max(0, o.d.dot(sunLocal)), speed = o.sp * (.12 + 2.2 * act * (.35 + .65 * face));
        if (o.esc) {                                                   // grain qui s'échappe : il file vers l'extérieur et s'éteint
          o.esc += dt * (.5 + act); o.r = o.rOut + o.esc * 2.4;
          if (o.r > 4) { losses.push(now); spawn(o); }
        } else {
          o.ph += dt * speed;
          if (o.ph >= 1) o.ph -= 1;
          var ph = o.ph;
          if (ph < .45) o.r = o.rIn + (o.rOut - o.rIn) * smooth(ph / .45);
          else if (ph < .62) o.r = o.rOut;
          else o.r = o.rOut + (o.rIn - o.rOut) * smooth((ph - .62) / .38);
          // circulation latérale lente dans l'enveloppe
          qa.setFromAxisAngle(o.ax, dt * speed * (ph >= .45 && ph < .62 ? 2.2 : .25)); o.d.applyQuaternion(qa);
          // près de l'étoile, une partie de la vapeur côté éclairé quitte l'enveloppe
          if (ph > .36 && ph < .45 && R() < dt * act * act * face * 2.2) o.esc = .001;
        }
        w.copy(o.d).multiplyScalar(o.r);
        gp[i * 3] = w.x; gp[i * 3 + 1] = w.y; gp[i * 3 + 2] = w.z;
        var b = .25 + .75 * Math.min(1, .25 + act * 1.2);           // au repos la circulation est faible et peu visible
        if (o.esc) { var f = Math.max(0, 1 - o.esc * .6); gc[i * 3] = f; gc[i * 3 + 1] = .6 * f; gc[i * 3 + 2] = .36 * f; }
        else if (o.ph < .45) { gc[i * 3] = .5 * b; gc[i * 3 + 1] = .89 * b; gc[i * 3 + 2] = b; }
        else if (o.ph < .62) { var e = .7 * b; gc[i * 3] = .7 * e; gc[i * 3 + 1] = .62 * e; gc[i * 3 + 2] = e; }
        else { var d2 = .8 * b; gc[i * 3] = .95 * d2; gc[i * 3 + 1] = .97 * d2; gc[i * 3 + 2] = d2; }
      }
      grains.attributes.position.needsUpdate = true; grains.attributes.color.needsUpdate = true;
      // poussières : quelques-unes dérivent vers l'enveloppe, plus nombreuses en phase active
      for (var j = 0; j < M; j++) {
        var u = D[j];
        if (!u.on && R() < dt * (.03 + act * .25)) u.on = true;
        if (u.on) { tmp.copy(u.p).normalize(); u.p.addScaledVector(tmp, -dt * u.v); }
        if (u.p.length() < 1.38) { gains.push(now); dust(u, false); }
        dp[j * 3] = u.p.x; dp[j * 3 + 1] = u.p.y; dp[j * 3 + 2] = u.p.z;
        var l = u.on ? .9 : .25; dc[j * 3] = l; dc[j * 3 + 1] = .82 * l; dc[j * 3 + 2] = .48 * l;
      }
      dustGeo.attributes.position.needsUpdate = true; dustGeo.attributes.color.needsUpdate = true;
      // relevés (sur les 10 dernières secondes, illustratifs)
      if (now - last > 400) {
        last = now;
        while (losses.length && now - losses[0] > 10000) losses.shift();
        while (gains.length && now - gains[0] > 10000) gains.shift();
        var L2 = losses.length, G2 = gains.length;
        rd.act.textContent = act < .3 ? 'faible' : act < .6 ? 'modérée' : 'forte';
        rd.loss.textContent = L2; rd.gain.textContent = G2;
        rd.bil.textContent = !L2 && !G2 ? 'stable' : Math.abs(L2 - G2) <= Math.max(2, (L2 + G2) * .2) ? 'équilibré' : L2 > G2 ? 'négatif' : 'positif';
      }
    }
    function smooth(x) { return x * x * (3 - 2 * x); }

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

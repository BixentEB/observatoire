/* ======================================================================
   OBSERVATOIRE — espace « Hypothèses »
   Des pistes de réflexion personnelles, pas assez développées pour être des théories.
   Elles ont leur propre couleur (--hypo) et ne sont jamais mêlées aux données.
   Fichiers : hypotheses/index.json (liste) et hypotheses/<id>.md (texte de chaque fiche).
   Le simulateur permet de modeler un corps céleste pour mettre une hypothèse en perspective.
   ====================================================================== */
(function () {
  'use strict';
  var OBS = window.OBS = window.OBS || {};
  var T = window.THREE, G = OBS.GLSL, esc = OBS.esc;

  /* ---------- données ---------- */
  var listP = null;
  function list() {
    if (!listP) listP = fetch('hypotheses/index.json', { cache: 'no-cache' }).then(function (r) { if (!r.ok) throw new Error(r.status); return r.json(); })
      .then(function (j) { return (j.hypotheses || j || []).filter(function (h) { return !h.brouillon; }); })
      .catch(function () { listP = null; return null; });
    return listP;
  }
  OBS.hypo = {
    list: list,
    forObject: function (id) { return list().then(function (l) { return (l || []).filter(function (h) { return (h.objets || []).indexOf(id) >= 0; }); }); },
    get: function (id) { return list().then(function (l) { return (l || []).filter(function (h) { return h.id === id; })[0] || null; }); }
  };

  var STATUS = { piste: 'Piste', reflexion: 'En réflexion', developpement: 'En développement', abandonnee: 'Abandonnée', exemple: 'Exemple' };
  function dateFr(s) { if (!s) return ''; var d = new Date(s + 'T12:00:00'); return isNaN(d) ? esc(s) : d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' }); }
  function meta(h) {
    var st = h.statut || 'piste';
    return '<div class="h-meta"><span class="h-status' + (st === 'exemple' ? ' ex' : '') + '">' + esc(STATUS[st] || st) + '</span>' + (h.date ? '<span>' + dateFr(h.date) + '</span>' : '') +
      ((h.objets || []).length ? '<span>· ' + h.objets.map(function (o) { return esc((OBS.byId[o] || { name: o }).name); }).join(', ') + '</span>' : '') + '</div>';
  }

  /* ---------- pages ---------- */
  var activeViewer = null;
  function disposeViewer() { if (activeViewer) { activeViewer.dispose(); activeViewer = null; } }
  OBS.on('page', disposeViewer);

  OBS.pages.hypotheses = function (root, param) {
    disposeViewer();
    if (param === 'atelier' || param === 'simulateur') { location.replace('#/simulateur'); return; }
    if (param) return fiche(root, param);
    root.innerHTML = '<p class="p-kicker" style="color:var(--hypo)">Hypothèses</p><h1>Pistes de réflexion</h1>' +
      '<div class="h-intro"><b>Hypothèses personnelles.</b> Des idées sur l\'espace, pas assez développées pour être des théories. Elles sont signalées par cette couleur et ne sont jamais mêlées aux données de l\'Observatoire : chacune dit ce qui pourrait l\'appuyer, ce qui la contredirait et comment on pourrait la tester.</div>' +
      '<div class="h-list" id="h-list"><p class="note">Chargement…</p></div>' +
      '<h2>Simulateur</h2><p>Pour modeler un corps céleste et mettre une idée en perspective : partir d\'un objet réel ou d\'une page blanche, changer sa taille, ses couleurs, ses anneaux, son atmosphère. Les scénarios « et si… » y viendront aussi.</p>' +
      '<p><a class="btn btn-hypo" href="#/simulateur">Ouvrir le simulateur</a></p>';
    list().then(function (l) {
      var box = document.getElementById('h-list'); if (!box) return;
      if (l === null) { box.innerHTML = '<p class="note">Les fiches n\'ont pas pu être chargées. Elles s\'affichent quand le site est servi par un serveur web (en ligne, ou en local avec <code>python3 -m http.server</code>).</p>'; return; }
      if (!l.length) { box.innerHTML = '<p class="note">Aucune hypothèse publiée pour l\'instant.</p>'; return; }
      box.innerHTML = l.map(function (h) {
        return '<a class="h-card" href="#/hypotheses/' + encodeURIComponent(h.id) + '">' + meta(h) + '<h3>' + esc(h.titre) + '</h3><p>' + esc(h.resume || '') + '</p></a>';
      }).join('');
    });
  };

  function fiche(root, id) {
    root.innerHTML = '<p class="note">Chargement…</p>';
    OBS.hypo.get(id).then(function (h) {
      if (!h) { root.innerHTML = '<p class="p-kicker" style="color:var(--hypo)">Hypothèses</p><h1>Fiche introuvable</h1><p><a href="#/hypotheses">Revenir à la liste</a></p>'; return; }
      var objs = (h.objets || []).filter(function (o) { return OBS.byId[o]; });
      root.innerHTML = '<p><a href="#/hypotheses" class="chip">← Toutes les hypothèses</a></p>' +
        '<p class="h-badge">Hypothèse personnelle' + (h.exemple ? ' · fiche d\'exemple' : '') + '</p><h1>' + esc(h.titre) + '</h1>' + meta(h) +
        (h.resume ? '<p class="lead" style="margin-top:14px">' + esc(h.resume) + '</p>' : '') +
        (objs.length ? '<div class="h-objs">' + objs.map(function (o) { return '<a class="btn" href="#/explorer/' + o + '">Voir ' + esc(OBS.byId[o].name) + ' dans l\'espace</a>'; }).join('') + '</div>' : '') +
        (h.modele ? '<div id="h-viewer"></div>' : '') +
        '<div class="h-body" id="h-body"></div>' +
        '<p class="note" style="margin-top:30px">Une hypothèse est une piste de réflexion, pas un résultat établi. Les données de l\'Observatoire, elles, ne sont jamais modifiées pour servir une hypothèse.</p>';
      if (h.modele) activeViewer = new Viewer(document.getElementById('h-viewer'), h.modele, { tag: 'Modèle de l\'hypothèse' });
      if (h.fichier) fetch('hypotheses/' + h.fichier, { cache: 'no-cache' }).then(function (r) { return r.ok ? r.text() : ''; }).then(function (t) {
        var b = document.getElementById('h-body'); if (b) b.innerHTML = OBS.md(t);
      });
    });
  }

  /* ---------- simulateur (page à part, #/simulateur) ---------- */
  OBS.pages.simulateur = function (root) {
    disposeViewer();
    root.innerHTML = '<p class="p-kicker" style="color:var(--hypo)">Simulateur</p><h1>Modeler un corps céleste</h1>' +
      '<p class="lead">Partez d\'un objet réel ou d\'une page blanche. Les réglages peuvent être copiés pour accompagner une fiche d\'hypothèse.</p>' +
      '<div id="h-viewer"></div>' +
      '<h2>Bientôt : les scénarios « et si… »</h2><p>Et si la Terre avait deux lunes ? Si Jupiter était plus massive ? Si Mars avait gardé une atmosphère épaisse ? Des expériences avec des résultats calculés quand un modèle simple le permet, et clairement marquées comme simulées.</p>' +
      '<p><a href="#/hypotheses" class="chip">Voir les hypothèses</a></p>';
    activeViewer = new Viewer(document.getElementById('h-viewer'), { base: 'saturne' }, { tag: 'Simulateur · objet modelé' });
  };

  /* ---------- viewer de modelage ---------- */
  function hex(c) { return '#' + ('000000' + (c >>> 0).toString(16)).slice(-6); }
  function fromBase(id) {
    var b = OBS.byId[id] || {}, lk = b.look || {};
    var c = (lk.c || [0x888888, 0xaaaaaa, 0x666666, 0xcccccc]).slice(); while (c.length < 5) c.push(c[c.length - 1]);
    return {
      base: id, carte: !!b.tex, type: lk.type === 4 ? 0 : (lk.type || 0), couleurs: c.map(hex), bandes: lk.bands || 6, turbulence: lk.warp || .05,
      relief: lk.relief || .03, glace: lk.ice || 0, tempete: lk.storm || 0,
      atmosphere: { couleur: hex(lk.atmo || 0x6d7de8), intensite: lk.atmoK || 0 },
      anneaux: b.ring ? { actif: true, interieur: +(b.ring.inner / b.rKm).toFixed(2), exterieur: +(b.ring.outer / b.rKm).toFixed(2), opacite: b.ring.alpha || .9 } : { actif: false, interieur: 1.4, exterieur: 2.3, opacite: .9 },
      nuages: lk.clouds || 0, inclinaison: 20, rotation: 1, taille: 1
    };
  }
  function normalize(m) {
    var base = m.base && OBS.byId[m.base] ? fromBase(m.base) : fromBase('neptune');
    if (!m.base) { base.base = null; base.carte = false; }
    function merge(a, b) { Object.keys(b || {}).forEach(function (k) { a[k] = (b[k] && typeof b[k] === 'object' && !Array.isArray(b[k])) ? merge(a[k] || {}, b[k]) : b[k]; }); return a; }
    return merge(base, m);
  }

  function Viewer(host, model, opts) {
    var self = this; this.m = normalize(model || {}); this.alive = true;
    host.innerHTML = '<div class="viewer"><div class="viewer-stage"><span class="viewer-tag">' + esc(opts.tag || 'Viewer') + '</span></div><div class="viewer-ctrl"></div></div>';
    var stageEl = host.querySelector('.viewer-stage'), ctrl = host.querySelector('.viewer-ctrl');
    var renderer; try { renderer = new T.WebGLRenderer({ antialias: true }); } catch (e) { stageEl.innerHTML += '<p class="note" style="padding:40px 16px">WebGL indisponible.</p>'; return; }
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    stageEl.appendChild(renderer.domElement);
    var scene = new T.Scene(), camera = new T.PerspectiveCamera(35, 1, .01, 500);
    camera.position.set(0, 1.2, 7.5);
    var controls = new T.OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true; controls.enablePan = false; controls.minDistance = 2.2; controls.maxDistance = 30;
    var sun = new T.Vector3(-60, 18, 40);
    // fond étoilé discret
    var sg = new T.BufferGeometry(), sp = new Float32Array(1500 * 3);
    for (var i = 0; i < 1500; i++) { var v = new T.Vector3().randomDirection ? new T.Vector3().randomDirection() : new T.Vector3(Math.random() - .5, Math.random() - .5, Math.random() - .5).normalize(); sp[i * 3] = v.x * 200; sp[i * 3 + 1] = v.y * 200; sp[i * 3 + 2] = v.z * 200; }
    sg.setAttribute('position', new T.BufferAttribute(sp, 3));
    scene.add(new T.Points(sg, new T.PointsMaterial({ color: 0x8890b0, size: .6, sizeAttenuation: true })));

    var group = new T.Group(); scene.add(group);
    var sphere = new T.SphereGeometry(1, 96, 64), shellGeo = new T.SphereGeometry(1, 48, 32);
    var mesh, shell, ring, mat, texCache = {}, loader = new T.TextureLoader();

    function build() {
      var m = self.m;
      if (mesh) { group.remove(mesh); mat.dispose(); }
      if (shell) { group.remove(shell); shell.material.dispose(); shell = null; }
      if (ring) { group.remove(ring); ring.geometry.dispose(); ring.material.dispose(); ring = null; }
      var look = { type: +m.type, scale: 1.4, seed: 7, relief: +m.relief, ice: +m.glace, bands: +m.bandes, warp: +m.turbulence, storm: +m.tempete, stormLat: -.35, clouds: +m.nuages, gloss: 1,
        c: m.couleurs.map(function (h) { return parseInt(String(h).replace('#', ''), 16); }), atmoK: +m.atmosphere.intensite, atmo: parseInt(String(m.atmosphere.couleur).replace('#', ''), 16) };
      mat = OBS.system.planetMaterial(look, 1);
      mat.uniforms.uSun.value = sun;
      var b = m.base && OBS.byId[m.base];
      if (m.carte && b && b.tex) setTex(b.tex, 'uMap', 'uHasMap');
      if (m.carte && b && b.night) setTex(b.night, 'uNight', 'uHasNight');
      mesh = new T.Mesh(sphere, mat); group.add(mesh);
      if (look.atmoK > 0) {
        shell = new T.Mesh(shellGeo, new T.ShaderMaterial({ uniforms: { uAtmo: { value: new T.Color(look.atmo) }, uK: { value: Math.min(1, look.atmoK) }, uCmax: { value: Math.sqrt(1 - 1 / (1.05 * 1.05)) }, uSun: { value: sun } },
          vertexShader: G.ATMO_VERT, fragmentShader: G.ATMO_FRAG, side: T.BackSide, transparent: true, blending: T.AdditiveBlending, depthWrite: false }));
        group.add(shell);
      }
      if (m.anneaux.actif) {
        var rin = +m.anneaux.interieur, rout = Math.max(rin + .05, +m.anneaux.exterieur);
        var u = { uCenter: { value: new T.Vector3() }, uRingN: { value: new T.Vector3(0, 1, 0) }, uRadius: { value: 1 }, uIn: { value: rin }, uOut: { value: rout },
          uHasTex: { value: 0 }, uTex: { value: null }, uTint: { value: new T.Vector3(.8, .72, .6) }, uAlphaK: { value: +m.anneaux.opacite }, uSun: { value: sun } };
        ring = new T.Mesh(new T.RingGeometry(rin, rout, 160, 2), new T.ShaderMaterial({ uniforms: u, vertexShader: G.RING_VERT, fragmentShader: G.RING_FRAG, side: T.DoubleSide, transparent: true, depthWrite: false }));
        ring.rotation.x = -Math.PI / 2; group.add(ring);
        mat.uniforms.uRing.value.set(rin, rout);
        if (m.carte && b && b.ring && b.ring.tex) loader.load('textures/' + b.ring.tex, function (tx) { if (!ring) return; u.uTex.value = tx; u.uHasTex.value = 1; mat.uniforms.uRingTex.value = tx; mat.uniforms.uHasRingTex.value = 1; });
      }
      applyTransform();
    }
    function setTex(file, key, flag) {
      function put(tx) { if (!mat) return; mat.uniforms[key].value = tx; mat.uniforms[flag].value = 1; }
      if (texCache[file]) put(texCache[file]); else loader.load('textures/' + file, function (tx) { texCache[file] = tx; put(tx); });
    }
    function applyTransform() {
      var m = self.m, s = +m.taille;
      mesh.scale.setScalar(s); if (shell) shell.scale.setScalar(s * 1.05); if (ring) ring.scale.setScalar(s);
      if (mat) mat.uniforms.uRadius.value = s;
      if (ring) ring.material.uniforms.uRadius.value = s;
      group.rotation.z = -(+m.inclinaison) * Math.PI / 180;
      var n = new T.Vector3(0, 1, 0).applyEuler(group.rotation);       // normale des anneaux (pour leur ombre sur la planète)
      if (mat) mat.uniforms.uRingN.value.copy(n);
      if (ring) ring.material.uniforms.uRingN.value.copy(n);
    }

    /* panneau de réglages */
    var bases = OBS.BODIES.filter(function (b) { return b.look || b.tex; });
    function slider(key, label, min, max, step, path) {
      return '<label class="vc"><span class="vc-row">' + label + '<output data-o="' + key + '"></output></span><input type="range" data-k="' + key + '" min="' + min + '" max="' + max + '" step="' + step + '"></label>';
    }
    ctrl.innerHTML = '<h3>Réglages</h3>' +
      '<label class="vc"><span class="vc-row">Partir de<select data-k="base"><option value="">Page blanche</option>' + bases.map(function (b) { return '<option value="' + b.id + '">' + esc(b.name) + '</option>'; }).join('') + '</select></span></label>' +
      '<label class="vc"><span class="vc-row">Garder la carte réelle<input type="checkbox" data-k="carte"></span></label>' +
      '<label class="vc"><span class="vc-row">Type de surface<select data-k="type"><option value="0">Rocheuse, cratères</option><option value="1">Désertique</option><option value="3">Géante à bandes</option></select></span></label>' +
      '<div class="vc"><span class="vc-row">Couleurs</span><div class="vc-colors">' + [0, 1, 2, 3, 4].map(function (i) { return '<input type="color" data-c="' + i + '" aria-label="Couleur ' + (i + 1) + '">'; }).join('') + '</div></div>' +
      slider('taille', 'Taille', .3, 2.5, .05) + slider('inclinaison', 'Inclinaison de l\'axe (°)', 0, 180, 1) + slider('rotation', 'Rotation', 0, 6, .1) +
      slider('bandes', 'Bandes', 1, 16, 1) + slider('turbulence', 'Turbulence', 0, .2, .005) + slider('tempete', 'Tempête', 0, 1, .05) +
      slider('relief', 'Relief', 0, .1, .005) + slider('glace', 'Glace, calottes', 0, 1, .05) + slider('nuages', 'Nuages', 0, 1, .05) +
      '<div class="vc"><span class="vc-row">Atmosphère<input type="color" data-k="atmosphere.couleur"></span><input type="range" data-k="atmosphere.intensite" min="0" max="1.2" step=".05"></div>' +
      '<div class="vc"><span class="vc-row">Anneaux<input type="checkbox" data-k="anneaux.actif"></span>' +
      '<span class="vc-row">Bord intérieur<output data-o="anneaux.interieur"></output></span><input type="range" data-k="anneaux.interieur" min="1.05" max="4" step=".01">' +
      '<span class="vc-row">Bord extérieur<output data-o="anneaux.exterieur"></output></span><input type="range" data-k="anneaux.exterieur" min="1.1" max="6" step=".01">' +
      '<span class="vc-row">Densité</span><input type="range" data-k="anneaux.opacite" min="0" max="1" step=".05"></div>' +
      '<div class="viewer-actions"><button class="btn" type="button" data-a="copy">Copier les réglages</button><button class="btn" type="button" data-a="reset">Réinitialiser</button><span class="copied" hidden>Copié</span></div>' +
      '<p class="note">Un objet modelé ici est une représentation d\'idée, pas une donnée.</p>';

    function getK(k) { return k.split('.').reduce(function (o, p) { return o == null ? o : o[p]; }, self.m); }
    function setK(k, v) { var ps = k.split('.'), o = self.m; for (var i = 0; i < ps.length - 1; i++) o = o[ps[i]] = o[ps[i]] || {}; o[ps[ps.length - 1]] = v; }
    function sync() {
      Array.prototype.forEach.call(ctrl.querySelectorAll('[data-k]'), function (inp) {
        var v = getK(inp.getAttribute('data-k'));
        if (inp.type === 'checkbox') inp.checked = !!v; else inp.value = v == null ? '' : v;
      });
      Array.prototype.forEach.call(ctrl.querySelectorAll('[data-c]'), function (inp) { inp.value = self.m.couleurs[+inp.getAttribute('data-c')] || '#888888'; });
      Array.prototype.forEach.call(ctrl.querySelectorAll('[data-o]'), function (o) { var v = getK(o.getAttribute('data-o')); o.textContent = typeof v === 'number' ? (Math.round(v * 100) / 100).toLocaleString('fr-FR') : v; });
      var carte = ctrl.querySelector('[data-k="carte"]'), b = self.m.base && OBS.byId[self.m.base];
      carte.disabled = !(b && b.tex);
    }
    var LIGHT = { taille: 1, inclinaison: 1, rotation: 1 };
    ctrl.addEventListener('input', function (e) {
      var t = e.target, k = t.getAttribute('data-k'), c = t.getAttribute('data-c');
      if (c !== null) { self.m.couleurs[+c] = t.value; self.m.carte = false; sync(); build(); return; }
      if (!k) return;
      if (k === 'base') { var id = t.value; self.m = normalize(id ? { base: id } : { base: null }); sync(); build(); return; }
      var v = t.type === 'checkbox' ? t.checked : t.type === 'range' ? parseFloat(t.value) : t.value;
      setK(k, v); sync();
      if (LIGHT[k]) applyTransform(); else build();
    });
    ctrl.addEventListener('click', function (e) {
      var a = e.target.getAttribute && e.target.getAttribute('data-a'); if (!a) return;
      if (a === 'reset') { self.m = normalize(model || {}); sync(); build(); }
      if (a === 'copy') {
        var txt = JSON.stringify(self.m, null, 2), flag = ctrl.querySelector('.copied');
        var done = function () { flag.hidden = false; setTimeout(function () { flag.hidden = true; }, 1600); };
        if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(txt).then(done, function () { prompt('Réglages :', txt); });
        else prompt('Réglages :', txt);
      }
    });

    function resize() {
      var r = stageEl.getBoundingClientRect(); if (!r.width) return;
      renderer.setSize(r.width, r.height, false); camera.aspect = r.width / r.height; camera.updateProjectionMatrix();
    }
    var ro = window.ResizeObserver ? new ResizeObserver(resize) : null; if (ro) ro.observe(stageEl);
    var last = performance.now();
    function loop(now) {
      if (!self.alive) return;
      requestAnimationFrame(loop);
      var dt = Math.min(.05, (now - last) / 1000); last = now;
      mesh.rotation.y += dt * .25 * (+self.m.rotation);
      if (mat) mat.uniforms.uTime.value = now / 1000;
      controls.update(); renderer.render(scene, camera);
    }
    sync(); build(); resize(); requestAnimationFrame(loop);
    this.dispose = function () { self.alive = false; if (ro) ro.disconnect(); controls.dispose(); renderer.dispose(); if (renderer.forceContextLoss) renderer.forceContextLoss(); };
  }
  OBS.Viewer = Viewer;
})();

/* ======================================================================
   OBSERVATOIRE — Comparateur d'objets (#/comparateur[/<a>/<b>])
   Deux astres côte à côte, à la même échelle (vraie proportion des diamètres), posés sur une même ligne,
   puis leurs données face à face avec le rapport entre les deux.
   Astres : Soleil, planètes, planètes naines et grandes lunes (valeurs js/data/compare.js), étoiles voisines
   (rayon et masse de js/data/stars.js).
   ====================================================================== */
(function () {
  'use strict';
  var OBS = window.OBS = window.OBS || {}, esc = OBS.esc;
  function nf(v, d) { return v.toLocaleString('fr-FR', { maximumFractionDigits: d === undefined ? 0 : d, minimumFractionDigits: 0 }); }
  function hex(c) { return '#' + ('000000' + (c >>> 0).toString(16)).slice(-6); }
  var RSUN = 696340;

  var LIST = null;
  function list() {
    if (LIST) return LIST; LIST = [];
    var C = OBS.COMPARE || {};
    (OBS.BODIES || []).forEach(function (b) {
      var c = C[b.id]; if (!c || !b.rKm) return;
      var grp = b.id === 'soleil' ? 'Étoiles' : b.moon ? 'Lunes' : b.dwarf ? 'Planètes naines' : 'Planètes';
      LIST.push({ id: b.id, name: b.name, grp: grp, rKm: b.rKm, d: c, tex: b.tex, star: b.id === 'soleil', color: b.id === 'soleil' ? '#ffcf6a' : b.look && b.look.c ? hex(b.look.c[1]) : '#9aa0b8', ring: b.id === 'saturne', href: '#/explorer/' + b.id });
    });
    (OBS.STARS || []).forEach(function (s) {
      if (!s.r) return;
      LIST.push({ id: s.id, name: s.name.replace(/ A et B$/, ' A').replace(/ et B$/, ''), grp: 'Étoiles', rKm: s.r * RSUN, d: { m: s.m ? s.m * 333000 : null, lum: s.lum, ly: s.ly, spec: s.spec }, star: true, color: hex((OBS.STAR_COLORS || {})[s.cls] || 0xffffff), href: '#/etoile/' + s.id });
    });
    return LIST;
  }
  function get(id) { return list().filter(function (x) { return x.id === id; })[0]; }

  /* ---------- vue 3D : deux sphères à la même échelle, posées sur une ligne ---------- */
  function view(canvas) {
    var T = window.THREE; if (!T) return null;
    var ren = new T.WebGLRenderer({ canvas: canvas, antialias: true, alpha: true });
    ren.setPixelRatio(Math.min(2, window.devicePixelRatio || 1)); ren.outputEncoding = T.sRGBEncoding;
    var scene = new T.Scene(), cam = new T.OrthographicCamera(-2, 2, 1, -1, .1, 50); cam.position.set(0, 0, 10);
    var light = new T.DirectionalLight(0xffffff, 1.15); light.position.set(-3, 1.5, 4); scene.add(light); scene.add(new T.AmbientLight(0x8090b0, .18));
    var loader = new T.TextureLoader(), cache = {}, group = new T.Group(); scene.add(group);
    var aspect = 2;
    function size() { var w = canvas.clientWidth || 600, h = Math.round(w / (w < 560 ? 1.25 : 2)); aspect = w / h; ren.setSize(w, h, false); cam.left = -aspect; cam.right = aspect; cam.top = 1; cam.bottom = -1; cam.updateProjectionMatrix(); }
    function sphere(o, r) {
      var mat;
      if (o.star) mat = new T.MeshBasicMaterial({ color: o.color });
      else {
        mat = new T.MeshStandardMaterial({ color: o.tex ? 0xffffff : o.color, roughness: 1, metalness: 0 });
        if (o.tex) { var t = cache[o.tex] || (cache[o.tex] = loader.load('textures/' + o.tex, function () { draw(); })); t.encoding = T.sRGBEncoding; mat.map = t; }
      }
      var g = new T.Group(), m = new T.Mesh(new T.SphereGeometry(r, 64, 48), mat); m.rotation.y = -Math.PI / 2; g.add(m);
      if (o.star) { var glow = new T.Mesh(new T.SphereGeometry(r * 1.1, 48, 32), new T.MeshBasicMaterial({ color: o.color, transparent: true, opacity: .1 })); glow.scale.setScalar(.95); g.add(glow); }
      if (o.ring) { var ring = new T.Mesh(new T.RingGeometry(r * 1.24, r * 2.27, 96), new T.MeshBasicMaterial({ color: 0xcdbb94, transparent: true, opacity: .38, side: T.DoubleSide, depthWrite: false })); ring.rotation.x = Math.PI / 2 - .3; ring.rotation.z = .12; g.add(ring); }
      return g;
    }
    var marks = [];
    function set(a, b) {
      while (group.children.length) { var c = group.children.pop(); c.traverse(function (x) { if (x.geometry) x.geometry.dispose(); if (x.material) x.material.dispose(); }); }
      size();
      var big = Math.max(a.rKm, b.rKm), H = .78;                       // le plus grand occupe 78 % de la demi-hauteur
      var ra = H * a.rKm / big, rb = H * b.rKm / big;
      var wa = a.ring ? ra * 2.27 : ra, wb = b.ring ? rb * 2.27 : rb, gap = .34;
      var k = Math.min(1, (aspect * 2 - .3) / (2 * wa + 2 * wb + gap));           // les deux (anneaux compris) tiennent dans la largeur
      ra *= k; rb *= k; wa *= k; wb *= k;
      var base = -.9, xa = -(2 * wa + 2 * wb + gap) / 2 + wa, xb = xa + wa + gap + wb;
      var A = sphere(a, ra), B = sphere(b, rb);
      A.position.set(xa, base + ra, 0); B.position.set(xb, base + rb, 0); group.add(A, B);
      var line = new T.Line(new T.BufferGeometry().setFromPoints([new T.Vector3(-aspect, base, 0), new T.Vector3(aspect, base, 0)]), new T.LineBasicMaterial({ color: 0x3a4466 }));
      group.add(line);
      marks = [[xa, base + ra, ra], [xb, base + rb, rb]];
      draw();
      return marks.map(function (m) { return { x: (m[0] + aspect) / (2 * aspect), y: (1 - m[1]) / 2, r: m[2] / 2 }; });
    }
    function draw() { ren.render(scene, cam); }
    return { set: set, resize: function () { size(); draw(); }, dispose: function () { ren.dispose(); Object.keys(cache).forEach(function (k) { cache[k].dispose(); }); } };
  }

  /* ---------- données face à face ---------- */
  function dur(h) {
    var a = Math.abs(h), s = a < 48 ? nf(a, 1) + ' h' : a < 24 * 365 ? nf(a / 24, a / 24 < 10 ? 1 : 0) + ' jours' : nf(a / 24 / 365.25, 1) + ' ans';
    return s + (h < 0 ? ' (rétrograde)' : '');
  }
  function days(d) { return d < 365 * 2 ? nf(d, d < 10 ? 2 : 0) + ' jours' : nf(d / 365.25, 1) + ' ans'; }
  function mass(m) { return m === null || m === undefined ? null : m >= 1000 ? nf(m) + ' Terres' : m >= 1 ? nf(m, 1) + (m < 2 ? ' Terre' : ' Terres') : m >= .01 ? nf(m * 100, 1) + ' % de la Terre' : nf(m * 100, m * 100 >= .01 ? 2 : 4) + ' % de la Terre'; }
  function rows(a, b) {
    var A = a.d, B = b.d;
    function row(label, fa, fb, va, vb, cmpWord) {
      var x = fa(A, a), y = fb(B, b); if (!x && !y) return '';
      var ratio = '';
      if (va !== undefined && vb !== undefined && va > 0 && vb > 0) {
        var r = va / vb, w = r >= 1 ? r : 1 / r, who = r >= 1 ? a.name : b.name;
        ratio = w < 1.05 ? 'à peu près pareil' : esc(who) + ' : ' + (w >= 100 ? nf(w) : nf(w, w < 10 ? 1 : 0)) + ' fois ' + cmpWord;
      }
      return '<div class="cp-row"><span class="cp-l">' + label + '</span><span class="cp-a">' + (x || '—') + '</span><span class="cp-b">' + (y || '—') + '</span><span class="cp-r">' + ratio + '</span></div>';
    }
    var vol = Math.pow(a.rKm / b.rKm, 3);
    return row('Diamètre', function () { return nf(a.rKm * 2) + ' km'; }, function () { return nf(b.rKm * 2) + ' km'; }, a.rKm, b.rKm, 'plus grand') +
      row('Masse', function (D) { return mass(D.m); }, function (D) { return mass(D.m); }, A.m, B.m, 'plus massif') +
      row('Gravité à la surface', function (D) { return D.g ? nf(D.g, 1) + ' m/s²' + (D.g ? ' · ' + nf(D.g / 9.81 * 100) + ' % de la Terre' : '') : null; }, function (D) { return D.g ? nf(D.g, 1) + ' m/s²' + ' · ' + nf(D.g / 9.81 * 100) + ' % de la Terre' : null; }, A.g, B.g, 'plus forte') +
      row('Un tour sur soi-même', function (D) { return D.rot ? dur(D.rot) + (D.sync ? ', toujours la même face vers ' + D.of : '') : null; }, function (D) { return D.rot ? dur(D.rot) + (D.sync ? ', toujours la même face vers ' + D.of : '') : null; }, A.rot && Math.abs(A.rot), B.rot && Math.abs(B.rot), 'plus long') +
      row('Un tour autour', function (D) { return D.yr ? days(D.yr) + ' (du Soleil)' : D.orb ? days(D.orb) + ' (de ' + D.of + ')' : null; }, function (D) { return D.yr ? days(D.yr) + ' (du Soleil)' : D.orb ? days(D.orb) + ' (de ' + D.of + ')' : null; }) +
      row('Distance au Soleil', function (D) { return D.au ? nf(D.au, 2) + ' UA' : D.ly ? nf(D.ly, 2) + ' années-lumière' : null; }, function (D) { return D.au ? nf(D.au, 2) + ' UA' : D.ly ? nf(D.ly, 2) + ' années-lumière' : null; }) +
      row('Température', function (D) { return D.t !== undefined ? nf(D.t) + ' °C' + (D.tNote ? ' (' + D.tNote + ')' : '') : null; }, function (D) { return D.t !== undefined ? nf(D.t) + ' °C' + (D.tNote ? ' (' + D.tNote + ')' : '') : null; }) +
      row('Luminosité', function (D) { return D.lum ? nf(D.lum, D.lum < .01 ? 4 : 2) + ' fois le Soleil' : null; }, function (D) { return D.lum ? nf(D.lum, D.lum < .01 ? 4 : 2) + ' fois le Soleil' : null; }, A.lum, B.lum, 'plus lumineuse') +
      row('Lunes connues', function (D) { return D.moons || null; }, function (D) { return D.moons || null; }) +
      '<p class="cp-fun">' + (vol >= 1.5 ? 'On pourrait loger environ <b>' + nf(vol, vol < 10 ? 1 : 0) + '</b> ' + esc(b.name) + ' dans ' + esc(a.name) + '.' : vol <= 1 / 1.5 ? 'On pourrait loger environ <b>' + nf(1 / vol, 1 / vol < 10 ? 1 : 0) + '</b> ' + esc(a.name) + ' dans ' + esc(b.name) + '.' : 'Les deux ont presque le même volume.') + '</p>';
  }

  OBS.pages.comparateur = function (root, pa, pb) {
    var L = list(), a = get(pa) || get('terre'), b = get(pb) || get('jupiter');
    var groups = ['Étoiles', 'Planètes', 'Planètes naines', 'Lunes'];
    function sel(cls, cur) {
      return '<select class="cp-sel ' + cls + '" aria-label="Choisir un astre">' + groups.map(function (g) {
        return '<optgroup label="' + g + '">' + L.filter(function (x) { return x.grp === g; }).map(function (x) { return '<option value="' + x.id + '"' + (x.id === cur.id ? ' selected' : '') + '>' + esc(x.name) + '</option>'; }).join('') + '</optgroup>';
      }).join('') + '</select>';
    }
    root.innerHTML = '<p><a href="#/outils" class="chip">← Outils</a></p><p class="p-kicker">Outil</p><h1>Le comparateur</h1>' +
      '<p class="lead">Deux astres côte à côte, à la même échelle, puis leurs données face à face.</p>' +
      '<div class="c-flags"><span class="flag f-real" title="Réel — les deux diamètres sont dans leur vraie proportion"><i>Tailles</i>à la même échelle</span><span class="flag f-real" title="Réel — valeurs de la NASA (fiches planétaires), arrondies"><i>Données</i>NASA, arrondies</span><span class="flag f-adapt" title="Adapté — les deux astres sont posés côte à côte ; leur distance réelle n\'est pas représentée"><i>Distance</i>non représentée</span></div>' +
      '<div class="cp-pick">' + sel('cp-a', a) + '<button type="button" class="cp-swap" aria-label="Échanger les deux astres" title="Échanger">⇄</button>' + sel('cp-b', b) + '</div>' +
      '<div class="cp-stage"><canvas class="cp-cv" aria-label="Les deux astres à la même échelle"></canvas><div class="cp-lbls"></div></div>' +
      '<div class="cp-table"></div>';
    var cv = root.querySelector('.cp-cv'), V = view(cv), lbls = root.querySelector('.cp-lbls'), tbl = root.querySelector('.cp-table');
    function upd() {
      var pos = V ? V.set(a, b) : null;
      var ratio = a.rKm / b.rKm, w = ratio >= 1 ? ratio : 1 / ratio;
      lbls.innerHTML = [a, b].map(function (o, i) {
        var p = pos ? pos[i] : { x: i ? .75 : .25, y: .5, r: .1 }, tiny = p.r * (cv.clientHeight || 300) < 4;
        return '<a class="cp-lbl" href="' + o.href + '" style="left:' + (p.x * 100).toFixed(2) + '%"><b>' + esc(o.name) + '</b><small>' + nf(o.rKm * 2) + ' km</small></a>' +
          (tiny ? '<span class="cp-tiny" style="left:' + (p.x * 100).toFixed(2) + '%;top:' + ((p.y) * 100).toFixed(2) + '%" title="' + esc(o.name) + ' : trop petit pour être vu à cette échelle"></span>' : '');
      }).join('') + '<p class="cp-ratio">' + (w < 1.05 ? 'Presque la même taille' : esc(ratio >= 1 ? a.name : b.name) + ' est ' + (w >= 100 ? nf(w) : nf(w, 1)) + ' fois plus grand' + (ratio >= 1 ? '' : '') + (w > 150 ? ' : l\'autre n\'est presque plus qu\'un point' : '')) + '</p>';
      tbl.innerHTML = '<div class="cp-row cp-head"><span class="cp-l"></span><span class="cp-a">' + esc(a.name) + '</span><span class="cp-b">' + esc(b.name) + '</span><span class="cp-r">Rapport</span></div>' + rows(a, b);
      try { history.replaceState(null, '', '#/comparateur/' + a.id + '/' + b.id); } catch (e) {}
    }
    root.querySelector('.cp-a').addEventListener('change', function (e) { a = get(e.target.value); upd(); });
    root.querySelector('.cp-b').addEventListener('change', function (e) { b = get(e.target.value); upd(); });
    root.querySelector('.cp-swap').addEventListener('click', function () { var t = a; a = b; b = t; root.querySelector('.cp-a').value = a.id; root.querySelector('.cp-b').value = b.id; upd(); });
    var onR = function () { if (!document.body.contains(cv)) { window.removeEventListener('resize', onR); if (V) V.dispose(); return; } upd(); };
    window.addEventListener('resize', onR);
    upd();
  };
})();

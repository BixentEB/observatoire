/* ======================================================================
   OBSERVATOIRE — diagnostic des performances, invisible par défaut.
   S'active en ajoutant ?diag à l'adresse (https://obs.codexmental.com/?diag) : petit panneau en haut à droite
   avec les images par seconde, le temps de calcul de chaque image (JavaScript) et le temps passé à envoyer
   le dessin à la carte graphique, le contenu de la scène, et un journal des blocages (images de plus de 200 ms)
   qui dit si le temps est parti dans le calcul ou ailleurs (carte graphique, navigateur).
   ====================================================================== */
(function () {
  'use strict';
  var OBS = window.OBS = window.OBS || {};
  if (!/[?&]diag\b/.test(location.search)) return;
  var box, last = 0, frames = [], freezes = [], lt = [], upd = 0, rnd = 0, worst = 0, t0 = performance.now();
  try { new PerformanceObserver(function (l) { l.getEntries().forEach(function (e) { lt.push({ t: e.startTime, d: e.duration }); if (lt.length > 30) lt.shift(); }); }).observe({ type: 'longtask', buffered: true }); } catch (e) {}
  OBS.diag = {
    frame: function (now, u, r) {
      var gap = last ? now - last : 16; last = now; upd = u; rnd = r;
      var R = OBS.engine && OBS.engine.renderer; if (R) { if (R.info.autoReset) R.info.autoReset = false; OBS.diag.info = { c: R.info.render.calls, t: R.info.render.triangles, p: R.info.render.points }; R.info.reset(); }   // toutes les passes de l'image (scène, halo, image finale)
      frames.push([now, gap, u, r]); while (frames.length && now - frames[0][0] > 5000) frames.shift();
      if (gap > 200) {
        var L = OBS.engine && OBS.engine.level, cam = L && L.camera, lts = lt.filter(function (x) { return x.t > now - gap - 50; });
        freezes.unshift({ at: Math.round((now - t0) / 1000), gap: Math.round(gap), js: Math.round(lts.reduce(function (a, x) { return a + x.d; }, 0)), lv: L ? L.id : '?', d: cam ? Math.round(cam.position.length()) : 0 });
        if (freezes.length > 8) freezes.pop();
      }
    }
  };
  function draw() {
    if (!box) { box = document.createElement('div'); box.id = 'diag'; document.body.appendChild(box);
      box.style.cssText = 'position:fixed;z-index:9999;top:70px;right:12px;width:300px;padding:10px 12px;background:rgba(0,0,0,.85);color:#cfe;font:11px/1.45 monospace;border:1px solid #456;border-radius:8px;white-space:pre-wrap;pointer-events:auto'; }
    var n = frames.length, fps = n > 1 ? (n - 1) / ((frames[n - 1][0] - frames[0][0]) / 1000) : 0;
    var mx = 0, su = 0, sr = 0; frames.forEach(function (f) { mx = Math.max(mx, f[1]); su += f[2]; sr += f[3]; });
    var R = OBS.engine && OBS.engine.renderer, info = R ? R.info : null, L = OBS.engine && OBS.engine.level;
    var mem = performance.memory ? Math.round(performance.memory.usedJSHeapSize / 1e6) + ' Mo' : '–';
    box.textContent = 'DIAGNOSTIC (?diag)\n' +
      'niveau ' + (L ? L.id : '?') + ' · caméra à ' + (L && L.camera ? Math.round(L.camera.position.length()) : 0) + '\n' +
      'images/s ' + fps.toFixed(0) + ' · pire image (5 s) ' + Math.round(mx) + ' ms\n' +
      'calcul JS / image ' + (n ? (su / n).toFixed(1) : 0) + ' ms · envoi au GPU ' + (n ? (sr / n).toFixed(1) : 0) + ' ms\n' +
      (info && OBS.diag.info ? 'appels de dessin ' + OBS.diag.info.c + ' · triangles ' + OBS.diag.info.t + ' · points ' + OBS.diag.info.p + '\ntextures ' + info.memory.textures + ' · géométries ' + info.memory.geometries + '\n' : '') +
      'mémoire JS ' + mem + ' · pixels ' + (R ? R.getPixelRatio().toFixed(2) : '?') + ' × ' + window.innerWidth + '×' + window.innerHeight + '\n' +
      '\nBLOCAGES (> 200 ms) : durée · dont JS · niveau · caméra · à t s\n' +
      (freezes.length ? freezes.map(function (f) { return f.gap + ' ms · JS ' + f.js + ' ms · ' + f.lv + ' · ' + f.d + ' · ' + f.at + ' s'; }).join('\n') : 'aucun');
  }
  setInterval(draw, 500);
})();

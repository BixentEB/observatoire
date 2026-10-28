/* ======================================================================
   OBSERVATOIRE — mode démo (?demo), pour la fenêtre de présentation dans Codex Mental
   Système solaire en léger accéléré, caméra qui tourne doucement et visite quelques planètes,
   interface masquée, un lien pour ouvrir l'Observatoire en grand. Qualité plafonnée à « standard ».
   ====================================================================== */
(function () {
  'use strict';
  var OBS = window.OBS;
  OBS.demo = function () {
    document.documentElement.classList.add('demo');
    var a = document.createElement('a');
    a.className = 'demo-open'; a.href = location.origin + location.pathname; a.target = '_blank'; a.rel = 'noopener';
    a.innerHTML = '<span>Ouvrir l\'Observatoire</span> <b aria-hidden="true">↗</b>';
    document.body.appendChild(a);
    var cap = document.createElement('div'); cap.className = 'demo-cap'; cap.setAttribute('aria-live', 'polite'); document.body.appendChild(cap);

    // cadence propre à la démo : 12 h par seconde (1 j/s défilait trop vite dans la petite fenêtre, 1 h/s paraît figé)
    var SP = OBS.time.SPEEDS; SP.push({ id: 'demo', label: '12 heures par seconde', short: '12 h/s', rate: .5 });
    OBS.time.setSpeed(SP.length - 1);
    OBS.system.setLabels('planetes');
    OBS.engine.go('systeme', { instant: true });
    OBS.engine.start();

    var S = OBS.system, C = S.controls;
    C.autoRotate = true; C.autoRotateSpeed = .35;
    var TOUR = [[null, 14], ['terre', 11], [null, 7], ['saturne', 11], [null, 7], ['jupiter', 10], ['mars', 9], [null, 7], ['lune', 9], ['uranus', 9]];
    var step = -1, until = 0, pausedUntil = 0;
    function next() {
      step = (step + 1) % TOUR.length;
      var id = TOUR[step][0]; until = performance.now() + TOUR[step][1] * 1000;
      S.select(id);
      var d = id && OBS.byId[id], date = OBS.astro.dateFromJd(OBS.time.jd).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' });
      cap.innerHTML = d ? '<b>' + d.name + '</b><span>' + d.kind + '</span>' : '<b>Le système solaire</b><span>Positions calculées · ' + date + '</span>';
    }
    // le visiteur manipule la vue : la visite s'interrompt un moment
    OBS.engine.canvas.addEventListener('pointerdown', function () { pausedUntil = performance.now() + 20000; });
    OBS.engine.canvas.addEventListener('wheel', function () { pausedUntil = performance.now() + 20000; }, { passive: true });
    (function loop(now) {
      requestAnimationFrame(loop);
      if (now < pausedUntil) { until = Math.max(until, now + 2000); return; }
      if (now > until) next();
    })(performance.now());
  };
})();

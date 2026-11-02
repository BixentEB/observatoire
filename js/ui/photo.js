/* ======================================================================
   OBSERVATOIRE — mode photo
   Un petit menu pour choisir ce qui apparaît à l'image (noms, orbites, engins, ceintures,
   plan de l'écliptique, signature), puis la capture : le rendu 3D et les noms, dans un PNG.
   L'interface (barres, consoles) n'apparaît jamais sur la photo.
   ====================================================================== */
(function () {
  'use strict';
  var OBS = window.OBS, $ = function (id) { return document.getElementById(id); };
  var panel = $('photo'), btn = $('photo-btn');
  if (!panel || !btn) return;

  var OPTS = [
    ['noms', 'Noms des astres', true],
    ['orbites', 'Orbites', true],
    ['missions', 'Engins spatiaux', true],
    ['ceintures', 'Ceintures d\'astéroïdes', true],
    ['lunes', 'Lunes', true],
    ['ecliptique', 'Plan de l\'écliptique', false],
    ['signature', 'Date et signature', true]
  ];
  var hiOk = OBS.perf && OBS.perf.tier !== 'eco';
  panel.innerHTML = '<h2>Mode photo</h2><p class="note" style="margin:0 0 6px">Choisissez ce qui apparaît : la scène se met à jour en direct. L\'interface n\'est jamais sur la photo.</p>' +
    OPTS.map(function (o) { return '<label class="row"><span>' + o[1] + '</span><input type="checkbox" data-p="' + o[0] + '"' + (o[2] ? ' checked' : '') + '></label>'; }).join('') +
    (hiOk ? '<label class="row"><span>Définition</span><select data-p="def"><option value="1">Écran</option><option value="2">Haute (×2)</option></select></label>' : '') +
    '<div class="photo-act"><button type="button" class="btn" data-act="close">Fermer</button><button type="button" class="btn btn-main" data-act="shot">Capturer l\'image</button></div>';

  var saved = null;   // état d'affichage d'avant, rétabli à la fermeture
  function val(k) { var i = panel.querySelector('[data-p="' + k + '"]'); return i ? (i.type === 'checkbox' ? i.checked : i.value) : null; }
  function apply() {
    var S = OBS.system;
    S.setLabels(val('noms') ? saved.labels : 'none');
    S.setOrbits(!!val('orbites'));
    S.setLayer('missions', !!val('missions') && saved.layers.missions);
    S.setLayer('ceintures', !!val('ceintures') && saved.layers.ceintures);
    S.setLayer('lunes', !!val('lunes') && saved.layers.lunes);
    S.setEcliptic(!!val('ecliptique'));
  }
  function open() {
    if (!OBS.engine.level || OBS.engine.level !== OBS.system) { if (OBS.toast) OBS.toast('Le mode photo est disponible dans le système solaire.'); return; }
    var ly = OBS.system.layers(), sEcl = $('s-ecl');
    saved = { labels: $('s-labels').value, orbits: $('s-orbits').checked, ecl: sEcl ? sEcl.checked : false, layers: { missions: ly.missions, ceintures: ly.ceintures, lunes: ly.lunes } };
    if (saved.labels === 'none') saved.labels = 'all';
    panel.querySelector('[data-p="orbites"]').checked = saved.orbits;
    panel.querySelector('[data-p="ecliptique"]').checked = saved.ecl;
    panel.querySelector('[data-p="missions"]').checked = saved.layers.missions;
    panel.querySelector('[data-p="ceintures"]').checked = saved.layers.ceintures;
    panel.querySelector('[data-p="lunes"]').checked = saved.layers.lunes;
    panel.hidden = false; btn.classList.add('on'); btn.setAttribute('aria-expanded', 'true');
    document.body.classList.add('photo');
    apply();
  }
  function close() {
    if (panel.hidden) return;
    panel.hidden = true; btn.classList.remove('on'); btn.setAttribute('aria-expanded', 'false');
    document.body.classList.remove('photo');
    var S = OBS.system;
    S.setLabels($('s-labels').value); S.setOrbits(saved.orbits); S.setEcliptic(saved.ecl);
    S.setLayer('missions', saved.layers.missions); S.setLayer('ceintures', saved.layers.ceintures); S.setLayer('lunes', saved.layers.lunes);
  }

  /* les étiquettes visibles, redessinées sur l'image à leur place exacte */
  function drawLabels(ctx, k, cvRect) {
    var box = OBS.system.labelsEl; if (!box) return;
    Array.prototype.forEach.call(box.querySelectorAll('.lbl:not(.hid) .nm'), function (nm) {
      var r = nm.getBoundingClientRect(); if (!r.width) return;
      var cs = getComputedStyle(nm), x = (r.left - cvRect.left) * k, y = (r.top - cvRect.top) * k, w = r.width * k, h = r.height * k;
      var bg = cs.backgroundColor;
      if (bg && bg !== 'rgba(0, 0, 0, 0)' && bg !== 'transparent') {
        ctx.fillStyle = bg; ctx.beginPath();
        var rad = 7 * k; if (ctx.roundRect) ctx.roundRect(x, y, w, h, rad); else ctx.rect(x, y, w, h); ctx.fill();
      }
      ctx.font = cs.fontStyle + ' ' + cs.fontWeight + ' ' + parseFloat(cs.fontSize) * k + 'px ' + cs.fontFamily;
      ctx.fillStyle = cs.color; ctx.globalAlpha = parseFloat(cs.opacity) || 1; ctx.textBaseline = 'middle';
      ctx.shadowColor = 'rgba(0,0,0,.9)'; ctx.shadowBlur = 6 * k;
      ctx.fillText(nm.textContent, x + parseFloat(cs.paddingLeft) * k, y + h / 2 + k * .5);
      ctx.shadowBlur = 0; ctx.globalAlpha = 1;
    });
  }
  function signature(ctx, W, H, k) {
    var d = OBS.astro.dateFromJd(OBS.time.jd);
    var line1 = 'Observatoire · Codex Mental';
    var line2 = d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' }) + ' · ' + d.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }) +
      ' · positions calculées · ' + (OBS.system.scale.mode === 'reelle' ? 'distances réelles' : 'échelle adaptée') + ', tailles agrandies';
    var pad = 18 * k;
    ctx.textBaseline = 'alphabetic'; ctx.shadowColor = 'rgba(0,0,0,.9)'; ctx.shadowBlur = 8 * k;
    ctx.fillStyle = '#e9ecf8'; ctx.font = '700 ' + 15 * k + 'px Syne, sans-serif'; ctx.fillText(line1, pad, H - pad - 16 * k);
    ctx.fillStyle = '#f4c77a'; ctx.font = '400 ' + 11 * k + 'px "IBM Plex Mono", monospace'; ctx.fillText(line2, pad, H - pad);
    ctx.shadowBlur = 0;
  }
  function shot() {
    var k = +(val('def') || 1);
    var img = OBS.engine.capture(k); if (!img) return;
    var cvRect = OBS.engine.canvas.getBoundingClientRect(), sc = img.width / cvRect.width, ctx = img.getContext('2d');
    if (val('noms')) drawLabels(ctx, sc, cvRect);
    if (val('signature')) signature(ctx, img.width, img.height, sc);
    var name = 'observatoire-' + OBS.astro.dateFromJd(OBS.time.jd).toISOString().slice(0, 16).replace(/[T:]/g, '-') + '.png';
    var flash = document.createElement('div'); flash.className = 'photo-flash'; document.body.appendChild(flash); setTimeout(function () { flash.remove(); }, 500);
    img.toBlob(function (blob) {
      if (!blob) return;
      var a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = name;
      document.body.appendChild(a); a.click(); a.remove();
      setTimeout(function () { URL.revokeObjectURL(a.href); }, 4000);
      if (OBS.toast) OBS.toast('Image enregistrée : <b>' + name + '</b>');
    }, 'image/png');
  }

  btn.addEventListener('click', function () { if (panel.hidden) open(); else close(); });
  panel.addEventListener('change', function (e) { if (e.target.closest('[data-p]') && e.target.getAttribute('data-p') !== 'def' && e.target.getAttribute('data-p') !== 'signature') apply(); });
  panel.addEventListener('click', function (e) {
    var b = e.target.closest('[data-act]'); if (!b) return;
    if (b.getAttribute('data-act') === 'close') close(); else shot();
  });
  OBS.on('level', function () { close(); });
  OBS.on('page', function (p) { if (p) close(); });
  OBS.photo = { open: open, close: close };
})();

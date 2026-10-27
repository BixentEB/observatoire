/* ======================================================================
   OBSERVATOIRE — qualité d'affichage
   Principe (repris de Codex Mental, simplifié) :
   - une seule fabrication de la scène, au niveau estimé d'après l'appareil ;
   - une seconde fabrication seulement si le visiteur change la qualité dans les réglages
     (la page se recharge, ce qui prend quelques secondes) ;
   - jamais d'écran noir : la scène n'est jamais coupée automatiquement. Le seul allègement
     automatique est une baisse discrète de la définition si l'appareil peine durablement.
   ====================================================================== */
(function () {
  'use strict';
  var OBS = window.OBS = window.OBS || {};
  var KEY = 'obs.quality';
  function get(k) { try { return localStorage.getItem(k); } catch (e) { return null; } }
  function set(k, v) { try { if (v == null) localStorage.removeItem(k); else localStorage.setItem(k, v); } catch (e) {} }

  var info = { cores: navigator.hardwareConcurrency || 4, mem: navigator.deviceMemory || 0, mobile: false, soft: false, webgl2: false, gpu: '' };
  try { info.mobile = /Android|iPhone|iPad|Mobile/i.test(navigator.userAgent) || (matchMedia('(pointer:coarse)').matches && Math.min(screen.width, screen.height) < 820); } catch (e) {}
  try {
    var c = document.createElement('canvas'), g = c.getContext('webgl2') || c.getContext('webgl');
    if (g) {
      info.webgl2 = typeof WebGL2RenderingContext !== 'undefined' && g instanceof WebGL2RenderingContext;
      var ext = g.getExtension('WEBGL_debug_renderer_info');
      if (ext) info.gpu = String(g.getParameter(ext.UNMASKED_RENDERER_WEBGL) || '');
      var lose = g.getExtension('WEBGL_lose_context'); if (lose) lose.loseContext();
    }
  } catch (e) {}
  if (/swiftshader|llvmpipe|softpipe|software|basic render/i.test(info.gpu)) info.soft = true;

  function detect() {
    if (info.soft) return 'eco';
    if (/mali-4|mali-t[1-6]|adreno \(?[23]\d\d|powervr sgx|intel.*(hd graphics [2-4]\d{3}\b|gma)/i.test(info.gpu)) return 'eco';
    if (info.cores <= 2 || (info.mem && info.mem <= 2)) return 'eco';
    if (info.mobile) return 'std';                        // téléphone : qualité standard d'emblée, pas de mode dégradé
    if (info.cores <= 4 && info.mem && info.mem <= 4) return 'std';
    return 'high';
  }

  var LEVELS = {
    high: { label: 'Élevée',   pr: 2,    seg: [128, 96], bloom: 1,  msaa: true,  stars: 9000, dust: 2600, kuiper: 3000 },
    std:  { label: 'Standard', pr: 1.25, seg: [96, 64],  bloom: .5, msaa: false, stars: 6000, dust: 1800, kuiper: 2000 },
    eco:  { label: 'Économe',  pr: 1,    seg: [64, 48],  bloom: 0,  msaa: false, stars: 3500, dust: 900,  kuiper: 1000 }
  };
  var params = new URLSearchParams(location.search);
  var pref = params.get('qualite') || get(KEY) || 'auto';
  if (!LEVELS[pref]) pref = 'auto';
  var detected = detect(), tier = pref === 'auto' ? detected : pref;
  var prScale = 1;

  OBS.perf = {
    info: info, detected: detected, pref: pref, tier: tier, cfg: LEVELS[tier], LEVELS: LEVELS,
    pixelRatio: function () {
      var max = LEVELS[tier].pr; if (info.mobile) max = Math.min(max, 1.5);
      return Math.max(.6, Math.min(window.devicePixelRatio || 1, max) * prScale);
    },
    setPref: function (p) {
      set(KEY, p === 'auto' ? null : p);
      var u = new URL(location.href); u.searchParams.delete('qualite'); location.replace(u.toString());
    },
    /* surveillance légère : si l'appareil peine durablement, on baisse la définition une fois (sans reconstruire) */
    watch: function (onChange) {
      var t0 = performance.now(), frames = 0, slowFor = 0, last = 0, done = pref !== 'auto';
      return function (now) {
        if (done) return;
        if (now - t0 < 6000 || document.hidden) { last = now; return; }   // pas de jugement pendant le chargement
        var dt = last ? now - last : 16; last = now; frames++;
        if (dt > 250) return;                                              // saccade isolée : ignorée
        if (dt > 50) slowFor += dt; else slowFor = Math.max(0, slowFor - dt * .5);
        if (slowFor > 6000) { prScale = .75; done = true; onChange && onChange(); }
      };
    }
  };
})();

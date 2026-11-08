/* ======================================================================
   OBSERVATOIRE — page Lexique (#/lexique[/<onglet>[/<terme>]])
   Onglets thématiques, recherche sur tous les onglets à la fois (sans tenir compte des accents),
   renvois entre termes et liens vers les objets dans la scène. Données : js/data/lexique.js.
   ====================================================================== */
(function () {
  'use strict';
  var OBS = window.OBS = window.OBS || {};
  var esc = OBS.esc;
  function norm(s) { return String(s).toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[’']/g, ' '); }
  function slug(t) { return norm(t).replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, ''); }
  OBS.lexSlug = slug;

  var byNorm = {};
  function index() { if (!Object.keys(byNorm).length) (OBS.LEXIQUE || []).forEach(function (e) { e.slug = e.slug || slug(e.t); byNorm[norm(e.t)] = e; }); }

  function entry(e, q) {
    var see = (e.voir || []).filter(function (v) { return byNorm[norm(v)]; });
    var tabName = (OBS.LEXIQUE_TABS.filter(function (t) { return t[0] === e.tab; })[0] || [])[1];
    return '<article class="lx-e" id="lx-' + e.slug + '" data-slug="' + e.slug + '">' +
      (q ? '<p class="lx-tab">' + esc(tabName || '') + '</p>' : '') +
      '<h3>' + esc(e.t) + '</h3><p>' + esc(e.d) + '</p>' +
      ((see.length || e.obs) ? '<div class="lx-links">' +
        see.map(function (v) { var x = byNorm[norm(v)]; return '<a class="chip" href="#/lexique/' + x.tab + '/' + x.slug + '">→ ' + esc(x.t) + '</a>'; }).join('') +
        (e.obs ? '<a class="chip chip-go" href="' + e.obs[0] + '">' + esc(e.obs[1]) + ' ›</a>' : '') + '</div>' : '') +
      '</article>';
  }

  var COMPO = '<figure class="lx-compo" aria-label="Composition de l\'Univers"><div class="lx-bar">' +
    '<span class="c-de" style="width:68%"><b>68 %</b>énergie noire</span>' +
    '<span class="c-dm" style="width:27%"><b>27 %</b>matière noire</span>' +
    '<span class="c-om" style="width:5%"><b>5 %</b></span></div>' +
    '<figcaption><i class="c-om"></i>5 % de matière ordinaire : toutes les étoiles, les planètes, le gaz et nous. Le reste est invisible. <span>Satellite Planck, 2018 (valeurs arrondies).</span></figcaption></figure>';


  /* ---------- panneau latéral de définition ----------
     Un lien vers une définition (#/lexique/<thème>/<terme>) cliqué ailleurs que dans le Lexique ouvre un panneau
     sur le côté, sans quitter la page : la définition, ses renvois, et un lien pour ouvrir le Lexique complet.
     Fermeture : croix, clic à côté, Échap. */
  var drawer = null;
  function closeDef() { if (!drawer) return; drawer.classList.remove('on'); var d = drawer; drawer = null; setTimeout(function () { d.remove(); }, 250); window.removeEventListener('keydown', escDef, true); }
  function escDef(e) { if (e.key === 'Escape') { e.preventDefault(); e.stopImmediatePropagation(); closeDef(); } }
  function openDef(e) {
    index(); closeDef();
    var see = (e.voir || []).filter(function (v) { return byNorm[norm(v)]; }).map(function (v) { return byNorm[norm(v)]; });
    var tabName = (OBS.LEXIQUE_TABS.filter(function (t) { return t[0] === e.tab; })[0] || [])[1];
    drawer = document.createElement('div'); drawer.className = 'dfx';
    drawer.innerHTML = '<aside class="dfx-p" role="dialog" aria-label="Définition : ' + esc(e.t) + '"><button class="dfx-x" type="button" aria-label="Fermer">✕</button>' +
      '<p class="dfx-k">Lexique · ' + esc(tabName || '') + '</p><h2>' + esc(e.t) + '</h2><p class="dfx-d">' + esc(e.d) + '</p>' +
      (e.obs ? '<p class="dfx-go"><a href="' + e.obs[0] + '" data-dfx-close>' + esc(e.obs[1]) + ' ›</a></p>' : '') +
      (see.length ? '<p class="dfx-h">Voir aussi</p><div class="dfx-see">' + see.map(function (x) { return '<button type="button" data-dfx="' + x.tab + '/' + x.slug + '">' + esc(x.t) + '</button>'; }).join('') + '</div>' : '') +
      '<p class="dfx-all"><a href="#/lexique/' + e.tab + '/' + e.slug + '" data-dfx-close>Ouvrir dans le Lexique</a></p></aside>';
    document.body.appendChild(drawer);
    requestAnimationFrame(function () { if (drawer) drawer.classList.add('on'); });
    drawer.addEventListener('click', function (ev) {
      var t = ev.target;
      if (t === drawer || t.closest('.dfx-x')) { closeDef(); return; }
      var b = t.closest('[data-dfx]'); if (b) { var x = find(b.getAttribute('data-dfx')); if (x) openDef(x); return; }
      if (t.closest('[data-dfx-close]')) closeDef();
    });
    window.addEventListener('keydown', escDef, true);
    drawer.querySelector('.dfx-x').focus();
  }
  function find(path) { index(); var sl = path.split('/')[1]; return (OBS.LEXIQUE || []).filter(function (x) { return (x.slug || slug(x.t)) === sl; })[0]; }
  window.addEventListener('hashchange', function () { closeDef(); });
  OBS.lexDef = function (path) { var x = find(path); if (x) openDef(x); };
  document.addEventListener('click', function (ev) {
    var a = ev.target.closest && ev.target.closest('a[href^="#/lexique/"]'); if (!a || ev.ctrlKey || ev.metaKey || ev.shiftKey) return;
    if (/^#\/lexique/.test(location.hash) || a.closest('.dfx')) return;
    var parts = a.getAttribute('href').replace('#/lexique/', '').split('/'); if (parts.length < 2) return;
    var x = find(parts.join('/')); if (!x) return;
    ev.preventDefault(); openDef(x);
  });

  OBS.pages.lexique = function (root, param, sub) {
    index();
    var tabs = OBS.LEXIQUE_TABS, cur = tabs.some(function (t) { return t[0] === param; }) ? param : tabs[0][0];
    root.innerHTML = '<p><a href="#/outils" class="chip">← Outils</a></p><p class="p-kicker">Lexique</p><h1>Les mots de l\'espace</h1>' +
      '<p class="lead">Ce qui compose l\'Univers, les objets qu\'on y trouve et les mots pour les mesurer : ' + OBS.LEXIQUE.length + ' définitions courtes, avec des liens vers les objets dans l\'Observatoire.</p>' +
      '<label class="lx-search"><span class="sr-only">Chercher un mot</span><input type="search" placeholder="Chercher un mot : naine, parsec, quasar…" autocomplete="off"></label>' +
      '<div class="tabs lx-tabs" role="tablist" aria-label="Thèmes">' + tabs.map(function (t) {
        return '<a role="tab" class="tab" href="#/lexique/' + t[0] + '" data-tab="' + t[0] + '" aria-selected="' + (t[0] === cur) + '">' + esc(t[1]) + '</a>';
      }).join('') + '</div><div class="lx-list" id="lx-list"></div>';
    var list = root.querySelector('#lx-list'), input = root.querySelector('input'), tabsEl = root.querySelector('.lx-tabs');
    function showTab() {
      tabsEl.classList.remove('dim');
      list.innerHTML = (cur === 'univers' ? COMPO : '') + OBS.LEXIQUE.filter(function (e) { return e.tab === cur; }).map(function (e) { return entry(e); }).join('');
    }
    function search(q) {
      var n = norm(q.trim());
      if (!n) { showTab(); return; }
      var hits = OBS.LEXIQUE.map(function (e) { var nt = norm(e.t), s = nt.indexOf(n) === 0 ? 3 : nt.indexOf(n) >= 0 ? 2 : norm(e.d).indexOf(n) >= 0 ? 1 : 0; return { e: e, s: s }; })
        .filter(function (h) { return h.s; }).sort(function (a, b) { return b.s - a.s || a.e.t.localeCompare(b.e.t, 'fr'); });
      tabsEl.classList.add('dim');
      list.innerHTML = '<p class="note">' + (hits.length ? hits.length + ' résultat' + (hits.length > 1 ? 's' : '') + ' dans tous les thèmes' : 'Aucun mot trouvé. Essayez un autre terme, ou la recherche générale (touche /).') + '</p>' +
        hits.map(function (h) { return entry(h.e, true); }).join('');
    }
    input.addEventListener('input', function () { search(input.value); });
    showTab();
    if (sub) {
      var el = document.getElementById('lx-' + sub);
      if (el) { el.classList.add('lx-hit'); setTimeout(function () { el.scrollIntoView({ block: 'center', behavior: 'smooth' }); }, 60); }
    }
  };
})();

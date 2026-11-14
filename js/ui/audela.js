/* ======================================================================
   OBSERVATOIRE — Atlas › Au-delà (9e cran de la règle des échelles, hypothèses, lot 11)
   Ce qui pourrait exister au-delà de l'Univers observable. Rien ici n'est une donnée : ce sont des hypothèses de
   chercheurs (hypotheses/chercheurs.json, entrées « niveau : au-dela »), dans le bleu des hypothèses de chercheurs,
   avec leur état (admise, en débat, spéculative…). Seuls les deux horizons de l'encadré « Ce que l'on sait » sont
   des résultats du modèle cosmologique standard.
   ====================================================================== */
(function () {
  'use strict';
  var OBS = window.OBS = window.OBS || {}, esc = OBS.esc;
  var LOADING = null;
  function load() { return LOADING || (LOADING = fetch('hypotheses/chercheurs.json', { cache: 'no-cache' }).then(function (r) { if (!r.ok) throw 0; return r.json(); }).then(function (j) { return (j.hypotheses || []).filter(function (h) { return h.niveau === 'au-dela'; }); }).catch(function () { LOADING = null; return []; })); }
  var ETAT = { debat: 'En débat', admise: 'Admise', ecartee: 'Écartée', historique: 'Historique', speculative: 'Spéculative' };
  function sketch() {
    // schéma : notre Univers observable, ceux d'observateurs lointains (même Univers, autres horizons), puis des « bulles » (hypothèse)
    var S = 760, h = ['<defs><radialGradient id="ad-us"><stop offset="0" stop-color="#ff9f8a" stop-opacity=".22"/><stop offset="1" stop-color="#ff9f8a" stop-opacity=".04"/></radialGradient></defs>'];
    [[250, 380, 120], [430, 300, 120], [470, 470, 120], [330, 520, 120]].forEach(function (c, i) {
      h.push('<circle cx="' + c[0] + '" cy="' + c[1] + '" r="' + c[2] + '" class="ad-other"/>' + (i === 3 ? '<text x="' + c[0] + '" y="' + (c[1] + c[2] + 18) + '" class="ad-t" text-anchor="middle">l\'horizon d\'un autre observateur</text>' : ''));
    });
    h.push('<circle cx="360" cy="400" r="120" fill="url(#ad-us)" stroke="#ff9f8a" stroke-width="2"/><circle cx="360" cy="400" r="3" class="vl-here"/><text x="360" y="420" class="at-n at-sun" text-anchor="middle">nous</text><text x="360" y="268" class="ad-t" text-anchor="middle" style="fill:#ff9f8a">notre Univers observable</text>');
    h.push('<rect x="120" y="190" width="520" height="420" rx="40" class="ad-ours"/><text x="135" y="214" class="ad-t ad-sci">le même Univers, bien plus grand (admis)</text>');
    [[70, 90, 55], [690, 110, 70], [700, 680, 50], [60, 690, 65], [380, 60, 40]].forEach(function (c) { h.push('<circle cx="' + c[0] + '" cy="' + c[1] + '" r="' + c[2] + '" class="ad-bubble"/>'); });
    h.push('<text x="690" y="200" class="ad-t ad-sci" text-anchor="middle">autres univers-bulles ?</text><text x="690" y="216" class="ad-t ad-sci" text-anchor="middle">(spéculatif)</text>');
    return '<div class="atlas-scroll" tabindex="0"><svg class="atlas-map ad-map" viewBox="0 0 ' + S + ' ' + S + '" width="' + S + '" height="' + S + '" role="img" aria-label="Schéma : au-delà de l\'Univers observable">' + h.join('') + '</svg></div>';
  }
  OBS.AD = { load: load, ETAT: ETAT };
  OBS.atlasAuDela = function (root) {
    root.innerHTML = '<p class="note">Chargement…</p>';
    load().then(function (H) {
      root.innerHTML = '<div class="c-flags atlas-flags"><span class="flag f-sim" title="Rien ici n\'est une donnée : des hypothèses de chercheurs, avec leur état"><i>Contenu</i>hypothèses</span><span class="flag f-adapt" title="Schéma sans échelle"><i>Schéma</i>sans échelle</span></div>' +
        '<p class="lead">Jusqu\'ici, tout était mesuré. Au-delà de l\'Univers observable, on ne peut plus rien voir : seulement raisonner, calculer et supposer. Ce cran ne dit pas que l\'Univers s\'arrête là, au contraire.</p>' +
        '<div class="ad-know"><h3>Ce que l\'on sait</h3><ul>' +
        '<li><b>L\'horizon des particules</b> (≈ 46 milliards d\'al) : la limite de ce dont la lumière a pu nous parvenir depuis le Big Bang. Il recule avec le temps : on verra un peu plus loin demain.</li>' +
        '<li><b>L\'horizon des événements cosmologique</b> (≈ 16 milliards d\'al) : à cause de l\'accélération de l\'expansion, la lumière émise aujourd\'hui par une galaxie plus lointaine que cela ne nous atteindra jamais. Ces galaxies, on les voit encore telles qu\'elles étaient, mais on ne verra jamais leur avenir.</li>' +
        '<li><b>Chaque observateur a son horizon</b> : une galaxie lointaine a sa propre sphère observable, qui chevauche la nôtre en partie. Même Univers, autres horizons.</li></ul></div>' +
        sketch() +
        '<h2>Les hypothèses</h2><div class="rows">' + H.map(function (h) {
          return '<article class="row"><div class="row-h"><h3>' + esc(h.titre) + '</h3><p class="row-kind"><span class="h-status e-' + esc(h.etat) + '">' + esc(ETAT[h.etat] || h.etat) + '</span> ' + esc(h.auteurs) + ', ' + h.annee + '</p></div><div class="row-b"><p>' + esc(h.resume) + '</p><p><a href="#/hypotheses/chercheurs/' + encodeURIComponent(h.id) + '">Lire la fiche →</a></p></div></article>';
        }).join('') + '</div>' +
        '<p class="note">Ces fiches sont aussi dans <a href="#/hypotheses/chercheurs">Hypothèses › de chercheurs</a>, en bleu. États : admise (largement acceptée), en débat, spéculative (cohérente mais non testée), écartée. <a href="#/atlas/questions/univers">Questions sur l\'Univers observable</a></p>';
      OBS.armPinch(root);
    });
  };
})();

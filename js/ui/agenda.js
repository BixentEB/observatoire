/* ======================================================================
   OBSERVATOIRE — Agenda du ciel (#/agenda, #/agenda/AAAA-MM, #/agenda/AAAA-MM/JJ)
   Tout est calculé dans le navigateur (js/astro/ephem.js et les phases de js/ui/lunaisons.js), sans appel extérieur :
   phases et super-lunes, éclipses (et ce qu'on en voit depuis le lieu choisi), saisons, périhélie et aphélie,
   pluies d'étoiles filantes (pic d'après la longitude du Soleil, IMO), oppositions, élongations, conjonctions,
   rapprochements Lune-planète et Lune-étoile, et les dates des visiteurs de l'Atlas.
   Calculs valables de 1800 à 2100 (éléments des planètes de Standish), précision de l'ordre de la minute
   pour la Lune et les saisons, de quelques minutes pour les éclipses, de l'heure pour les rapprochements.
   Les lancements et les événements (salons, nuits des étoiles) viendront d'une tâche GitHub (lot suivant).
   ====================================================================== */
(function () {
  'use strict';
  var OBS = window.OBS = window.OBS || {}, esc = OBS.esc || function (s) { return String(s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); };
  var Y0 = 1800, Y1 = 2100;

  var CATS = [
    { id: 'lune', label: 'Lune', c: '#e9e4d6' },
    { id: 'eclipse', label: 'Éclipses', c: '#ff9a6b' },
    { id: 'planetes', label: 'Planètes', c: '#8fb4ff' },
    { id: 'filantes', label: 'Étoiles filantes', c: '#9fe3b0' },
    { id: 'saisons', label: 'Saisons', c: '#f4c77a' },
    { id: 'visiteurs', label: 'Visiteurs', c: '#b49cff' },
    { id: 'espace', label: 'Lancements', c: '#7fd7ff' },
    { id: 'rdv', label: 'Rendez-vous', c: '#ff8ec7' },
    { id: 'histoire', label: 'Histoire', c: '#c9b28a' }
  ];
  var CAT = {}; CATS.forEach(function (c) { CAT[c.id] = c; });

  var PLANETS = [['mercure', 'Mercure'], ['venus', 'Vénus'], ['mars', 'Mars'], ['jupiter', 'Jupiter'], ['saturne', 'Saturne'], ['uranus', 'Uranus'], ['neptune', 'Neptune']];
  var PN = {}; PLANETS.forEach(function (p) { PN[p[0]] = p[1]; });
  var BRIGHT = { mercure: 1, venus: 1, mars: 1, jupiter: 1, saturne: 1 };
  /* étoiles brillantes proches de l'écliptique que la Lune croise souvent (longitude et latitude écliptiques J2000) */
  var STARS = [['Régulus', 149.83, .46, 'du Lion', 'de Régulus'], ['l\'Épi (Spica)', 203.84, -2.05, 'de la Vierge', 'de l\'Épi (Spica)'], ['Antarès', 249.76, -4.57, 'du Scorpion', 'd\'Antarès'], ['Aldébaran', 69.79, -5.47, 'du Taureau', 'd\'Aldébaran'], ['les Pléiades', 60.0, 4.05, 'du Taureau', 'des Pléiades']];

  /* pluies d'étoiles filantes : pic en longitude du Soleil (J2000, calendrier de l'IMO), activité, taux horaire zénithal, corps parent, vitesse, constellation du radiant */
  var SHOWERS = [
    ['Quadrantides', 283.15, '28 décembre – 12 janvier', 80, 'l\'astéroïde 2003 EH1, sans doute une comète éteinte', 41, 'du Bouvier', 1],
    ['Lyrides', 32.32, '14 – 30 avril', 18, 'la comète C/1861 G1 (Thatcher)', 49, 'de la Lyre', 2],
    ['Êta Aquarides', 45.5, '19 avril – 28 mai', 50, 'la comète de Halley', 66, 'du Verseau', 2, 'Bien meilleures depuis l\'hémisphère Sud.'],
    ['Delta Aquarides du Sud', 127, '12 juillet – 23 août', 25, 'probablement la comète 96P/Machholz', 41, 'du Verseau', 3],
    ['Perséides', 140.0, '17 juillet – 24 août', 100, 'la comète 109P/Swift-Tuttle', 59, 'de Persée', 1],
    ['Draconides', 195.4, '6 – 10 octobre', 10, 'la comète 21P/Giacobini-Zinner', 20, 'du Dragon', 3, 'Très variables : faibles la plupart des années, parfois des sursauts.'],
    ['Taurides du Sud', 197, '20 septembre – 20 novembre', 5, 'la comète 2P/Encke', 27, 'du Taureau', 3, 'Peu nombreuses mais lentes, avec de beaux bolides.'],
    ['Orionides', 208, '2 octobre – 7 novembre', 20, 'la comète de Halley', 66, 'd\'Orion', 2],
    ['Taurides du Nord', 230, '20 octobre – 10 décembre', 5, 'la comète 2P/Encke', 29, 'du Taureau', 3],
    ['Léonides', 235.27, '6 – 30 novembre', 15, 'la comète 55P/Tempel-Tuttle', 71, 'du Lion', 2, 'Des tempêtes de milliers d\'étoiles filantes par heure ont eu lieu en 1833, 1966 et 2001.'],
    ['Géminides', 262.2, '4 – 20 décembre', 150, 'l\'astéroïde (3200) Phaéton', 35, 'des Gémeaux', 1, 'La pluie la plus riche de l\'année, visible dès le soir.'],
    ['Ursides', 270.7, '17 – 26 décembre', 10, 'la comète 8P/Tuttle', 33, 'de la Petite Ourse', 3]
  ];

  /* bandes de centralité des prochaines éclipses de Soleil (NASA, F. Espenak) : l'Agenda ne calcule que ce qu'on voit depuis le lieu choisi */
  var PATHS = {
    '2026-02-17': 'Anneau visible depuis l\'Antarctique seulement ; partielle au sud de l\'Afrique et de l\'Amérique du Sud.',
    '2026-08-12': 'Totale au Groenland, en Islande et dans le nord de l\'Espagne, au coucher du Soleil ; partielle dans toute l\'Europe.',
    '2027-02-06': 'Annulaire au Chili, en Argentine, puis à travers l\'Atlantique jusqu\'en Afrique de l\'Ouest (Côte d\'Ivoire, Ghana, Togo, Bénin, Nigeria).',
    '2027-08-02': 'Totale dans le sud de l\'Espagne, au Maroc, en Algérie, en Tunisie, en Libye, en Égypte (plus de six minutes à Louxor), en Arabie saoudite, au Yémen et en Somalie.',
    '2028-01-26': 'Annulaire en Équateur, au Pérou, au Brésil, puis au Portugal et en Espagne au coucher du Soleil.',
    '2028-07-22': 'Totale en Australie (Sydney) et en Nouvelle-Zélande.',
    '2030-06-01': 'Annulaire en Algérie, en Tunisie, en Grèce, en Turquie, en Russie et au Japon.',
    '2030-11-25': 'Totale en Namibie, au Botswana, en Afrique du Sud et en Australie.'
  };

  var PLACES = [
    ['paris', 'Paris', 48.857, 2.352], ['lyon', 'Lyon', 45.764, 4.836], ['marseille', 'Marseille', 43.296, 5.37], ['toulouse', 'Toulouse', 43.605, 1.444],
    ['bordeaux', 'Bordeaux', 44.838, -.579], ['nantes', 'Nantes', 47.218, -1.554], ['brest', 'Brest', 48.39, -4.486], ['lille', 'Lille', 50.629, 3.057],
    ['strasbourg', 'Strasbourg', 48.573, 7.752], ['nice', 'Nice', 43.71, 7.262], ['ajaccio', 'Ajaccio', 41.919, 8.739], ['bruxelles', 'Bruxelles', 50.85, 4.352],
    ['luxembourg', 'Luxembourg', 49.611, 6.13], ['geneve', 'Genève', 46.204, 6.143], ['montreal', 'Montréal', 45.502, -73.567], ['quebec', 'Québec', 46.813, -71.208],
    ['dakar', 'Dakar', 14.716, -17.467], ['abidjan', 'Abidjan', 5.36, -4.008], ['fort-de-france', 'Fort-de-France', 14.616, -61.059],
    ['saint-denis', 'Saint-Denis (La Réunion)', -20.882, 55.45], ['noumea', 'Nouméa', -22.276, 166.458], ['papeete', 'Papeete', -17.535, -149.569]
  ];

  function store(k, v) { try { if (v === undefined) return localStorage.getItem(k); localStorage.setItem(k, v); } catch (e) { return null; } }
  function place() {
    var v = store('obs.agenda.lieu') || 'paris', m = /^geo:(-?[\d.]+),(-?[\d.]+)$/.exec(v);
    if (m) return { id: v, name: 'ma position', lat: +m[1], lon: +m[2] };
    var p = PLACES.filter(function (x) { return x[0] === v; })[0] || PLACES[0];
    return { id: p[0], name: p[1], lat: p[2], lon: p[3] };
  }

  var pad = function (n) { return (n < 10 ? '0' : '') + n; };
  function key(d) { return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate()); }
  function nf(v, d) { return v.toLocaleString('fr-FR', { maximumFractionDigits: d || 0, minimumFractionDigits: d || 0 }); }
  var fT = new Intl.DateTimeFormat('fr-FR', { hour: '2-digit', minute: '2-digit' });
  var fD = new Intl.DateTimeFormat('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
  var fDs = new Intl.DateTimeFormat('fr-FR', { day: 'numeric', month: 'long' });
  var fM = new Intl.DateTimeFormat('fr-FR', { month: 'long', year: 'numeric' });
  var fMs = new Intl.DateTimeFormat('fr-FR', { month: 'long' });
  function range(a, b) { return a.getMonth() === b.getMonth() ? 'Du ' + a.getDate() + (a.getDate() === 1 ? 'er' : '') + ' au ' + fDs.format(b) + ' ' + b.getFullYear() : 'Du ' + fDs.format(a) + ' au ' + fDs.format(b) + ' ' + b.getFullYear(); }
  function hm(jd) { return fT.format(OBS.ephem.dateOf(jd)).replace(':', ' h '); }
  function cap(s) { return s.charAt(0).toUpperCase() + s.slice(1); }

  /* ---------- petits dessins ---------- */
  function svgEcl(solar, type) {
    var body = solar ? '<circle cx="12" cy="12" r="8" fill="#ffcf7a"/>' : '<circle cx="12" cy="12" r="8" fill="#e9e4d6"/>';
    var cover = solar ? '<circle class="ag-cov" cx="12" cy="12" r="' + (type === 'annulaire' ? 6.6 : 8.4) + '" fill="#0a0d1c"/>' : '<circle class="ag-cov ag-umb" cx="12" cy="12" r="10" fill="rgba(160,40,20,.75)"/>';
    return '<svg class="ag-ico ag-ecl" viewBox="0 0 24 24" aria-hidden="true">' + (solar ? '<circle cx="12" cy="12" r="11" fill="rgba(255,207,122,.18)"/>' : '') + body + cover + '</svg>';
  }
  var IB = {   // petites icônes d'action
    cal: '<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="3.5" y="5" width="17" height="15" rx="2.5" fill="none" stroke="currentColor" stroke-width="1.6"/><path d="M3.5 10h17M8 3v4M16 3v4M12 12.5v5M9.5 15h5" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/></svg>',
    share: '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="18" cy="5.5" r="2.5" fill="none" stroke="currentColor" stroke-width="1.6"/><circle cx="6" cy="12" r="2.5" fill="none" stroke="currentColor" stroke-width="1.6"/><circle cx="18" cy="18.5" r="2.5" fill="none" stroke="currentColor" stroke-width="1.6"/><path d="M8.2 10.8l7.6-4.1M8.2 13.2l7.6 4.1" stroke="currentColor" stroke-width="1.6"/></svg>',
    src: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M13.5 4.5h6v6M19.5 4.5L11 13M17 14v4.5a1.5 1.5 0 0 1-1.5 1.5h-10A1.5 1.5 0 0 1 4 18.5v-10A1.5 1.5 0 0 1 5.5 7H10" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/></svg>'
  };
  var ICO = {
    filantes: '<svg class="ag-ico ag-star" viewBox="0 0 24 24" aria-hidden="true"><path class="ag-trail" d="M3 4 L17 15" stroke="#9fe3b0" stroke-width="1.6" stroke-linecap="round"/><circle cx="18" cy="16" r="2.4" fill="#e9fff1"/></svg>',
    saison: '<svg class="ag-ico ag-sun" viewBox="0 0 24 24" aria-hidden="true"><g class="ag-rays" stroke="#f4c77a" stroke-width="1.4" stroke-linecap="round"><path d="M12 1.5v3M12 19.5v3M1.5 12h3M19.5 12h3M4.6 4.6l2.1 2.1M17.3 17.3l2.1 2.1M4.6 19.4l2.1-2.1M17.3 6.7l2.1-2.1"/></g><circle cx="12" cy="12" r="5.2" fill="#ffcf7a"/></svg>',
    orbite: '<svg class="ag-ico" viewBox="0 0 24 24" aria-hidden="true"><ellipse cx="12" cy="12" rx="10" ry="6" fill="none" stroke="#f4c77a" stroke-width="1" opacity=".7"/><circle cx="12" cy="12" r="2.6" fill="#ffcf7a"/><circle class="ag-orb" cx="22" cy="12" r="1.8" fill="#8fb4ff"/></svg>',
    conj: '<svg class="ag-ico ag-conj" viewBox="0 0 24 24" aria-hidden="true"><circle class="ag-c1" cx="9" cy="12" r="3.4" fill="#e9e4d6"/><circle class="ag-c2" cx="16" cy="11" r="2" fill="#8fb4ff"/></svg>',
    planete: '<svg class="ag-ico" viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="5" fill="#8fb4ff"/><ellipse cx="12" cy="12" rx="10" ry="3" fill="none" stroke="#8fb4ff" stroke-width="1" opacity=".55"/></svg>',
    fusee: '<svg class="ag-ico ag-rocket" viewBox="0 0 24 24" aria-hidden="true"><g class="ag-rk"><path d="M12 2c3 2.5 4 6 4 10l-1.6 3.2H9.6L8 12c0-4 1-7.5 4-10z" fill="#cfeeff"/><circle cx="12" cy="9" r="1.6" fill="#0a0d1c"/><path d="M8.4 12.5L5.5 16l3.2-.4M15.6 12.5l2.9 3.5-3.2-.4" fill="#7fd7ff"/></g><path class="ag-flame" d="M10.4 16h3.2L12 21.5z" fill="#ffb36b"/></svg>',
    rdv: '<svg class="ag-ico" viewBox="0 0 24 24" aria-hidden="true"><path d="M4 20l5.5-9 3 4.5 2-3L20 20z" fill="#ff8ec7" opacity=".85"/><path d="M15.5 3.5l.8 1.7 1.8.3-1.3 1.3.3 1.8-1.6-.9-1.6.9.3-1.8-1.3-1.3 1.8-.3z" fill="#ffe3f1"/><circle cx="7" cy="6" r=".9" fill="#ffe3f1"/></svg>',
    histoire: '<svg class="ag-ico" viewBox="0 0 24 24" aria-hidden="true"><path d="M6 3h12v3l-4 6 4 6v3H6v-3l4-6-4-6z" fill="none" stroke="#c9b28a" stroke-width="1.4" stroke-linejoin="round"/><path d="M8.5 19h7l-3.5-4.5z" fill="#c9b28a"/></svg>',
    visiteur: '<svg class="ag-ico ag-comet" viewBox="0 0 24 24" aria-hidden="true"><path class="ag-tail" d="M3 21 L15 9" stroke="#b49cff" stroke-width="3" stroke-linecap="round" opacity=".45"/><circle cx="16" cy="8" r="3" fill="#e4dcff"/></svg>'
  };

  /* ---------- calcul des événements d'une année ---------- */
  var cache = {}, acache = {};   // acache : phénomènes calculés (le plus long, ne dépend que du lieu) ; cache : avec rendez-vous et lancements
  function yearEvents(Y) {
    if (cache[Y]) return cache[Y];
    var ev = astroEvents(Y).slice();
    dataEvents(Y, ev);
    ev.sort(function (a, b) { return a.jd - b.jd; });
    return (cache[Y] = ev);
  }
  function astroEvents(Y) {
    if (acache[Y]) return acache[Y];
    var E = OBS.ephem, L = OBS.LUNE, ev = [];
    var j0 = E.jdOf(new Date(Y, 0, 1)) - 1, j1 = E.jdOf(new Date(Y + 1, 0, 1)) + 1;
    function push(o) { if (o.jd >= j0 && o.jd < j1) { var d = E.dateOf(o.jd); if (d.getFullYear() === Y) { o.date = d; o.key = key(d); ev.push(o); } } }

    /* --- Lune : phases, super-lunes, lune bleue --- */
    var k0 = Math.floor((j0 - 2451550.09766) / L.SYN) - 1, fullByMonth = {};
    for (var q = k0 * 4; ; q++) {
      var jd = L.phaseJD(q / 4); if (jd > j1) break;
      var f = ((q % 4) + 4) % 4, m = L.moonAt(jd), sup = (f === 0 || f === 2) && m.dist < L.SUPER, mini = f === 2 && m.dist > 405000;
      var o = { jd: jd, cat: 'lune', f: f, moon: m, prio: f === 2 || f === 0 ? 2 : 3, sup: sup };
      o.t = L.NAMES[f] + (sup ? ' (super-lune)' : mini ? ' (mini-lune)' : '');
      o.ico = L.icon(m, 22);
      o.body = [
        ['La Lune n\'est pas visible : elle passe entre la Terre et le Soleil. Les nuits sans Lune sont les meilleures pour observer les galaxies et les nébuleuses.',
          'La moitié droite de la Lune est éclairée (vue de l\'hémisphère Nord). Elle est haute au coucher du Soleil : le meilleur moment pour voir le relief le long de la limite entre le jour et la nuit.',
          'La Lune est entièrement éclairée : elle se lève au coucher du Soleil et reste visible toute la nuit.',
          'La moitié gauche est éclairée (vue de l\'hémisphère Nord). Elle se lève vers minuit et brille encore le matin.'][f],
        'Distance : ' + nf(Math.round(m.dist / 100) * 100) + ' km.'
      ];
      if (sup) o.body.push('Super-lune : à moins d\'environ 362 000 km, la Lune paraît jusqu\'à 14 % plus grande et 30 % plus brillante qu\'à son plus loin. Le terme vient de l\'astrologue Richard Nolle (1979) : ce n\'est pas une définition astronomique officielle.');
      if (mini) o.body.push('Mini-lune : la pleine lune tombe près du point le plus éloigné de son orbite, elle paraît un peu plus petite.');
      o.link = ['Voir la Lune ce jour-là', '#/lunaisons/' + key(E.dateOf(jd))];
      o.anim = sup ? 'super' : '';
      if (f === 2) { var dd = E.dateOf(jd), mk = dd.getFullYear() + '-' + dd.getMonth(); fullByMonth[mk] = (fullByMonth[mk] || 0) + 1; if (fullByMonth[mk] === 2) { o.t += ' · lune bleue'; o.body.push('Lune bleue : la deuxième pleine lune d\'un même mois civil, ce qui arrive environ tous les deux ans et demi. Elle n\'a rien de bleu.'); } }
      push(o);
    }

    /* --- éclipses --- */
    var P = place();
    for (var k = Math.floor((j0 - 2451550.09766) / L.SYN) - 1; ; k += .5) {
      var ec = E.eclipse(k); if (ec && ec.jd > j1) break; if (!ec) { if (L.phaseJD(k) > j1) break; continue; }
      var o2 = { jd: ec.jd, cat: 'eclipse', prio: 1, anim: 'ecl', ec: ec };
      if (ec.solar) {
        o2.t = 'Éclipse ' + ec.type + ' de Soleil'; o2.short = 'Éclipse de Soleil';
        o2.ico = svgEcl(true, ec.type);
        o2.body = [{ totale: 'La Lune cache entièrement le Soleil sur une étroite bande de la Terre : le ciel s\'assombrit, la couronne solaire apparaît.', annulaire: 'La Lune, trop loin pour couvrir tout le Soleil, laisse un anneau de feu sur une étroite bande de la Terre.', hybride: 'Éclipse rare, annulaire sur une partie de son trajet et totale sur l\'autre.', partielle: 'La Lune ne cache qu\'une partie du Soleil, nulle part entièrement.' }[ec.type] +
          (ec.type === 'partielle' ? ' Grandeur maximale : ' + nf(ec.mag, 2) + '.' : '')];
        var path = PATHS[key(E.dateOf(ec.jd))]; if (path) o2.body.push(path);
        var LS = E.localSolar(ec.jd, P.lat, P.lon);
        o2.vis = LS ? 'Depuis ' + P.name + ' : ' + (LS.total ? 'totale' : LS.annular ? 'annulaire' : 'partielle') + ', ' + (LS.obs > .99 && !LS.total ? nf(Math.floor(LS.obs * 1000) / 10, 1) : nf(Math.round(LS.obs * 100))) + ' % du disque du Soleil caché à ' + hm(LS.max) + ' (de ' + hm(LS.start) + ' à ' + hm(LS.end) + ', Soleil à ' + nf(Math.max(0, LS.alt)) + '° au-dessus de l\'horizon).' :
          'Pas visible depuis ' + P.name + '.';
        o2.warn = LS ? 'Ne jamais regarder le Soleil sans lunettes d\'éclipse certifiées (norme ISO 12312-2), même quand il est presque entièrement caché.' : '';
        o2.dur = LS ? Math.round((LS.end - LS.start) * 1440) : 120; if (LS) o2.jdStart = LS.start;
      } else {
        o2.t = 'Éclipse ' + ec.type + ' de Lune'; o2.short = 'Éclipse de Lune';
        o2.ico = svgEcl(false, ec.type);
        o2.body = [{ totale: 'La Lune entre tout entière dans l\'ombre de la Terre et se teinte de rouge cuivré : la lumière des levers et couchers de Soleil de toute la Terre, déviée par notre atmosphère.', partielle: 'Une partie de la Lune entre dans l\'ombre de la Terre et s\'assombrit nettement.', 'pénombrale': 'La Lune ne traverse que la pénombre de la Terre : un léger voile grisé, à peine visible.' }[ec.type],
          ec.type === 'totale' ? 'Totalité de ' + hm(ec.jd - ec.sdTot / 1440) + ' à ' + hm(ec.jd + ec.sdTot / 1440) + ' (' + nf(Math.round(ec.sdTot * 2)) + ' minutes).' :
          ec.type === 'partielle' ? 'Phase partielle de ' + hm(ec.jd - ec.sdPar / 1440) + ' à ' + hm(ec.jd + ec.sdPar / 1440) + ', grandeur ' + nf(ec.mag, 2) + '.' : 'Grandeur dans la pénombre : ' + nf(ec.pen, 2) + '.'];
        var sd = ec.sdPar || ec.sdPen, a0 = E.altOf('lune', ec.jd - sd / 1440, P.lat, P.lon), a1 = E.altOf('lune', ec.jd, P.lat, P.lon), a2 = E.altOf('lune', ec.jd + sd / 1440, P.lat, P.lon);
        o2.vis = 'Depuis ' + P.name + ' : ' + (a1 > 0 && a0 > 0 && a2 > 0 ? 'visible en entier, maximum à ' + hm(ec.jd) + '.' : a1 > 0 || a0 > 0 || a2 > 0 ? 'visible en partie (la Lune ' + (a0 <= 0 ? 'se lève' : 'se couche') + ' pendant l\'éclipse), maximum à ' + hm(ec.jd) + '.' : 'pas visible (la Lune est sous l\'horizon).');
        o2.dur = Math.round(sd * 2); o2.jdStart = ec.jd - sd / 1440;
        o2.warn = 'Aucun danger : une éclipse de Lune se regarde à l\'œil nu.';
      }
      o2.link = ['La Lune dans l\'Explorer', '#/explorer/lune'];
      push(o2);
    }

    /* --- saisons, périhélie, aphélie --- */
    var SN = [['Équinoxe de printemps', 'Le Soleil passe au-dessus de l\'équateur céleste : jour et nuit durent à peu près douze heures partout. Début du printemps dans l\'hémisphère Nord.'],
      ['Solstice d\'été', 'Le Soleil atteint son point le plus au nord : jour le plus long de l\'année dans l\'hémisphère Nord, le plus court dans l\'hémisphère Sud.'],
      ['Équinoxe d\'automne', 'Le Soleil repasse au sud de l\'équateur céleste : jour et nuit à peu près égaux. Début de l\'automne dans l\'hémisphère Nord.'],
      ['Solstice d\'hiver', 'Le Soleil atteint son point le plus au sud : jour le plus court de l\'année dans l\'hémisphère Nord, le plus long dans l\'hémisphère Sud.']];
    [Y - 1, Y, Y + 1].forEach(function (yy) { for (var s = 0; s < 4; s++) push({ jd: E.season(yy, s), cat: 'saisons', prio: 2, t: SN[s][0], short: SN[s][0].split(' ')[0], ico: ICO.saison, anim: 'sun', body: [SN[s][1], 'Les saisons viennent de l\'inclinaison de l\'axe de la Terre (23,4°), pas de sa distance au Soleil.'], link: ['La Terre dans l\'Explorer', '#/explorer/terre'] }); });
    var ka = Math.round(.99997 * (Y - 2000.01));
    [ka - 1, ka, ka + 1].forEach(function (kk) {
      [0, .5].forEach(function (h) {
        var jd = E.earthApsis(kk + h), r = E.sun(jd).r;
        push({ jd: jd, cat: 'saisons', prio: 3, t: h ? 'Aphélie : Terre au plus loin du Soleil' : 'Périhélie : Terre au plus près du Soleil', short: h ? 'Aphélie' : 'Périhélie', ico: ICO.orbite, anim: 'orb',
          body: [(h ? 'La Terre passe au point de son orbite le plus éloigné du Soleil' : 'La Terre passe au point de son orbite le plus proche du Soleil') + ', à ' + nf(Math.round(r * 149597.8707) * 1000) + ' km.',
            'Pourtant c\'est l\'' + (h ? 'été' : 'hiver') + ' dans l\'hémisphère Nord : l\'écart de distance (3 %) compte bien moins que l\'inclinaison de l\'axe.'], link: ['La Terre dans l\'Explorer', '#/explorer/terre'] });
      });
    });

    /* --- étoiles filantes : pic quand le Soleil atteint la longitude indiquée --- */
    SHOWERS.forEach(function (s) {
      [Y - 1, Y, Y + 1].forEach(function (yy) {
        var guess = E.jdOf(new Date(Date.UTC(yy, 0, 1))) + E.n360(s[1] + 1.397 * ((yy - 2000) / 100) - 280.2) / .98565;   // approximation, puis calcul exact
        var fn = function (jd) { var T = (jd - 2451545) / 36525; return E.n180(E.sun(jd).lon - 1.396971 * T - s[1]); };
        var jd = E.root(fn, guess - 6, guess + 6), md = L.moonAt(jd), lit = Math.round(md.frac * 100);
        push({ jd: jd, cat: 'filantes', prio: s[7], t: 'Pic des ' + s[0], short: s[0], ico: ICO.filantes, anim: 'filante', sh: s,
          body: ['Jusqu\'à ' + s[3] + ' météores par heure dans un ciel parfaitement noir, radiant au zénith (taux horaire zénithal) ; en pratique souvent deux à trois fois moins. Active du ' + s[2] + '.',
            'Ce sont les poussières laissées par ' + s[4] + ', qui brûlent dans l\'atmosphère à ' + s[5] + ' km/s. Elles semblent venir de la constellation ' + s[6] + '.' + (s[8] ? ' ' + s[8] : ''),
            'Mieux après minuit, loin des lumières, en laissant 20 minutes aux yeux pour s\'habituer au noir. Lune éclairée à ' + lit + ' %' + (lit > 60 ? ' : elle gênera.' : lit < 25 ? ' : bonnes conditions.' : '.')],
          link: ['Les visiteurs du système solaire', '#/atlas/visiteurs'] });
      });
    });

    /* --- planètes : un point par jour, puis affinage --- */
    var S = [], PL = {}, step;
    for (var t = j0 - 3; t <= j1 + 3; t += 1) S.push({ jd: t, s: E.sun(t) });
    PLANETS.forEach(function (p) { PL[p[0]] = S.map(function (x) { return E.planet(p[0], x.jd); }); });
    function elong(id, jd) { var s = E.sun(jd), pp = E.planet(id, jd); return { e: E.n180(pp.lon - s.lon), sep: E.sep(pp.lon, pp.lat, s.lon, 0), p: pp }; }
    function side(e) { return e > 0 ? 'le soir, à l\'ouest après le coucher du Soleil' : 'le matin, à l\'est avant le lever du Soleil'; }
    PLANETS.forEach(function (p) {
      var id = p[0], A = PL[id], inner = id === 'mercure' || id === 'venus';
      for (var i = 1; i < A.length; i++) {
        var e0 = E.n180(A[i - 1].lon - S[i - 1].s.lon), e1 = E.n180(A[i].lon - S[i].s.lon);
        /* conjonction avec le Soleil */
        if (Math.abs(e0) < 30 && (e0 < 0) !== (e1 < 0)) {
          var jc = E.root(function (jd) { return elong(id, jd).e; }, S[i - 1].jd, S[i].jd), pc = E.planet(id, jc), inf = inner && pc.dist < 1;
          push({ jd: jc, cat: 'planetes', prio: 3, t: p[1] + (inner ? (inf ? ' en conjonction inférieure' : ' en conjonction supérieure') : ' en conjonction avec le Soleil'), short: p[1] + ' · conjonction', ico: ICO.planete,
            body: [p[1] + ' passe ' + (inf ? 'entre la Terre et le Soleil' : 'derrière le Soleil, vu de la Terre') + ' : invisible, noyée dans sa lumière, pendant ' + (inner ? 'quelques jours à quelques semaines' : 'plusieurs semaines') + '.', 'Distance à la Terre : ' + nf(pc.dist, 2) + ' UA (' + nf(Math.round(pc.dist * 149.6)) + ' millions de km).'],
            link: [p[1] + ' dans l\'Explorer', '#/explorer/' + id] });
        }
        /* opposition */
        if (!inner && Math.abs(e0) > 150 && (e0 < 0) !== (e1 < 0)) {
          var jo = E.root(function (jd) { var x = elong(id, jd).e; return x > 0 ? x - 180 : x + 180; }, S[i - 1].jd, S[i].jd), po = E.planet(id, jo);
          push({ jd: jo, cat: 'planetes', prio: BRIGHT[id] ? 1 : 2, t: p[1] + ' à l\'opposition', short: p[1] + ' · opposition', ico: ICO.planete, anim: 'planet',
            body: [p[1] + ' est à l\'opposé du Soleil dans le ciel : elle se lève au coucher du Soleil, reste visible toute la nuit, et brille le plus de l\'année.', 'Distance à la Terre : ' + nf(po.dist, 2) + ' UA (' + nf(Math.round(po.dist * 149.6)) + ' millions de km).' + (id === 'mars' ? ' Mars ne revient à l\'opposition que tous les 26 mois environ.' : '')],
            link: [p[1] + ' dans l\'Explorer', '#/explorer/' + id] });
        }
        /* plus grande élongation (Mercure, Vénus) */
        if (inner && i > 1) {
          var a = Math.abs(E.n180(A[i - 2].lon - S[i - 2].s.lon)), b = Math.abs(e0), c = Math.abs(e1);
          if (b > a && b >= c && b > 15) {
            var jg = E.argmin(function (jd) { return -elong(id, jd).sep; }, S[i - 2].jd, S[i].jd), g = elong(id, jg);
            push({ jd: jg, cat: 'planetes', prio: id === 'venus' ? 1 : 2, t: p[1] + ' au plus loin du Soleil (' + (g.e > 0 ? 'soir' : 'matin') + ')', short: p[1] + ' · élongation', ico: ICO.planete, anim: 'planet',
              body: ['Plus grande élongation ' + (g.e > 0 ? 'est' : 'ouest') + ' : ' + p[1] + ' s\'écarte de ' + nf(g.sep, 1) + '° du Soleil, le meilleur moment pour la voir, ' + side(g.e) + '.', id === 'mercure' ? 'Mercure reste toujours basse sur l\'horizon : un horizon dégagé est indispensable.' : 'Vénus est alors l\'« étoile du ' + (g.e > 0 ? 'berger' : 'matin') + ' », l\'astre le plus brillant du ciel après le Soleil et la Lune.'],
              link: [p[1] + ' dans l\'Explorer', '#/explorer/' + id] });
          }
        }
      }
    });
    /* rapprochements entre planètes */
    for (var a1 = 0; a1 < PLANETS.length; a1++) for (var b1 = a1 + 1; b1 < PLANETS.length; b1++) (function (pa, pb) {
      var A = PL[pa[0]], B = PL[pb[0]], lim = BRIGHT[pa[0]] && BRIGHT[pb[0]] ? 3 : 1.2;
      var d = A.map(function (x, i) { return E.sep(x.lon, x.lat, B[i].lon, B[i].lat); });
      for (var i = 1; i < d.length - 1; i++) if (d[i] <= d[i - 1] && d[i] < d[i + 1] && d[i] < lim) {
        var f = function (jd) { var x = E.planet(pa[0], jd), y = E.planet(pb[0], jd); return E.sep(x.lon, x.lat, y.lon, y.lat); };
        var jm = E.argmin(f, S[i - 1].jd, S[i + 1].jd), sp = f(jm), el = elong(pa[0], jm);
        if (el.sep < 12) continue;
        push({ jd: jm, cat: 'planetes', prio: sp < 1 && BRIGHT[pa[0]] && BRIGHT[pb[0]] ? 1 : 2, t: pa[1] + ' et ' + pb[1] + ' côte à côte', short: pa[1] + ' – ' + pb[1], ico: ICO.conj, anim: 'conj',
          body: [pa[1] + ' et ' + pb[1] + ' ne sont plus qu\'à ' + (sp < 1 ? nf(sp * 60) + ' minutes d\'arc (' + nf(sp / .5, 1) + ' fois le diamètre de la pleine lune)' : nf(sp, 1) + '°') + ' l\'une de l\'autre dans le ciel, ' + side(el.e) + '.', 'Ce n\'est qu\'un alignement : en réalité elles restent à des centaines de millions de kilomètres l\'une de l\'autre.'],
          link: [pa[1] + ' dans l\'Explorer', '#/explorer/' + pa[0]] });
      }
    })(PLANETS[a1], PLANETS[b1]);
    /* rapprochements de la Lune : planètes et étoiles brillantes (un point toutes les 3 heures) */
    step = 3 / 24;
    var MS = [];
    for (var tm = j0 - 1; tm <= j1 + 1; tm += step) MS.push({ jd: tm, m: E.moon(tm) });
    var targets = PLANETS.filter(function (p) { return BRIGHT[p[0]]; }).map(function (p) { return { id: p[0], name: p[1], de: 'de ' + p[1], at: function (jd) { return E.planet(p[0], jd); }, lim: 4, planet: true }; })
      .concat(STARS.map(function (s) { return { name: s[0], cons: s[3], de: s[4], lim: s[0] === 'les Pléiades' ? 2 : 3, at: function (jd) { return { lon: s[1] + 1.396971 * (jd - 2451545) / 36525, lat: s[2] }; } }; }));
    targets.forEach(function (tg) {
      var d = MS.map(function (x) { var p = tg.at(x.jd); return E.sep(x.m.lon, x.m.lat, p.lon, p.lat); });
      for (var i = 1; i < d.length - 1; i++) if (d[i] <= d[i - 1] && d[i] < d[i + 1] && d[i] < tg.lim + .6) {
        var f = function (jd) { var m = E.moon(jd), p = tg.at(jd); return E.sep(m.lon, m.lat, p.lon, p.lat); };
        var jm = E.argmin(f, MS[i - 1].jd, MS[i + 1].jd), sp = f(jm); if (sp > tg.lim) continue;
        var s = E.sun(jm), mm = E.moon(jm), el = E.n180(mm.lon - s.lon); if (Math.abs(el) < 20) continue;
        var ml = L.moonAt(jm), occ = sp < 1.2;
        push({ jd: jm, cat: tg.planet ? 'planetes' : 'lune', prio: tg.planet ? (sp < 2 ? 2 : 3) : 3, t: 'La Lune ' + (occ ? 'frôle ' + tg.name : 'près ' + tg.de), short: 'Lune – ' + tg.name.replace(/^(les |l')/, '').replace(' (Spica)', ''), ico: ICO.conj, anim: 'conj',
          body: ['La Lune (éclairée à ' + Math.round(ml.frac * 100) + ' %) passe à ' + nf(sp, 1) + '° ' + tg.de + (tg.planet ? '' : ', dans la constellation ' + tg.cons) + ', ' + (Math.abs(el) > 150 ? 'visible une bonne partie de la nuit' : side(el)) + '.',
            occ ? 'Si près que, depuis certaines régions de la Terre, la Lune passe même devant (on parle d\'occultation) : l\'écart vu depuis chez vous peut différer d\'un degré.' : 'Un bon repère pour trouver ' + tg.name + (tg.planet ? ' à l\'œil nu.' : '.')],
          link: tg.planet ? [tg.name + ' dans l\'Explorer', '#/explorer/' + tg.id] : ['Voir la Lune ce jour-là', '#/lunaisons/' + key(E.dateOf(jm))] });
      }
    });

    /* --- visiteurs de l'Atlas --- */
    (OBS.VISITORS || []).forEach(function (v) {
      (v.dates || []).forEach(function (d) {
        var m = /^(\d{4})-(\d\d)-(\d\d)$/.exec(d[0]); if (!m || +m[1] !== Y) return;
        var dt = new Date(+m[1], +m[2] - 1, +m[3], 12, 0);
        ev.push({ jd: E.jdOf(dt), date: dt, key: key(dt), cat: 'visiteurs', prio: 2, allDay: true, t: v.name + ' : ' + d[1].charAt(0).toLowerCase() + d[1].slice(1), short: v.name, ico: ICO.visiteur, anim: 'comet',
          body: [d[1] + '.', v.text || ''], link: [v.name + ' dans l\'Atlas', '#/atlas/visiteurs/' + v.cat] });
      });
    });

    ev.sort(function (a, b) { return a.jd - b.jd; });
    return (acache[Y] = ev);
  }
  function dataEvents(Y, ev) {
    var E = OBS.ephem;
    /* --- rendez-vous : salons, festivals, nuits d'observation --- */
    function dOf(s) { var m = /^(\d{4})-(\d\d)-(\d\d)/.exec(s); return m ? new Date(+m[1], +m[2] - 1, +m[3], 12, 0) : null; }
    function allDay(o) { o.jd = E.jdOf(o.date); o.key = key(o.date); o.allDay = true; ev.push(o); }
    (OBS.AGENDA_RDV || []).forEach(function (r) {
      var a = dOf(r.start), b = r.end ? dOf(r.end) : null; if (!a || a.getFullYear() !== Y) return;
      allDay({ date: a, end: b, cat: 'rdv', prio: r.imp, t: r.name, ico: ICO.rdv, anim: r.imp === 1 ? 'rdv' : '', approx: r.approx,
        body: [r.d, r.where + '.', r.approx ? 'Dates à confirmer auprès des organisateurs.' : ''], ext: r.url ? ['Site de l\'événement', r.url] : null });
    });
    (OBS.AGENDA_JOURS || []).forEach(function (j) {
      if (Y < j.from) return;
      var a = new Date(Y, j.m - 1, j.d, 12), b = j.len ? new Date(Y, j.m - 1, j.d + j.len - 1, 12) : null;
      allDay({ date: a, end: b, cat: 'rdv', prio: 3, t: j.name, ico: ICO.rdv, body: [j.t] });
    });
    /* --- histoire : le jour même, puis chaque année en anniversaire --- */
    (OBS.AGENDA_HIST || []).forEach(function (h) {
      var m = /^(\d{4})-(\d\d)-(\d\d)$/.exec(h[0]), y0 = +m[1]; if (Y < y0) return;
      var n = Y - y0, a = new Date(Y, +m[2] - 1, +m[3], 12), round = n > 0 && (n % 25 === 0 || n % 10 === 0);
      allDay({ date: a, cat: 'histoire', ico: ICO.histoire, prio: n === 0 ? 1 : round ? 2 : 3, t: n === 0 ? h[1] : h[1] + ' (il y a ' + n + ' an' + (n > 1 ? 's' : '') + ')', short: h[1],
        body: [h[2], n > 0 ? 'C\'était le ' + fD.format(new Date(y0, +m[2] - 1, +m[3])) + '.' : ''],
        link: h[3] ? ['Voir dans l\'Explorer', h[3]] : null, anim: n === 0 || round ? 'hist' : '' });
    });
    /* --- lancements et événements spatiaux (Launch Library 2, mis à jour par une tâche GitHub) --- */
    var LD = OBS.AGENDA_LAUNCH;
    if (LD) {
      var swarm = store('obs.agenda.constellations') === '1';
      (LD.launches || []).forEach(function (l) {
        if (l.imp === 3 && !swarm) return;
        var d = new Date(l.net); if (isNaN(d) || d.getFullYear() !== Y) return;
        if (/^(Q\d?|H\d?|Y|FY)$/.test(l.prec || '')) return;   // prévu « au 4e trimestre », « en 2027 » : pas de jour à montrer
        var month = l.prec === 'M', vague = month || /^(DAY|W)$/.test(l.prec || ''), st = STATUS[l.status] || l.statusName || '';
        var mis = l.mission || l.name.split('|').pop().trim();
        var o = { jd: E.jdOf(d), date: d, key: key(d), cat: 'espace', prio: l.imp, allDay: vague, t: (l.crew ? 'Vol habité : ' : 'Lancement : ') + mis, short: mis, ico: ICO.fusee, anim: l.imp === 1 ? 'rocket' : '',
          body: [l.rocket + (l.prov ? ' (' + l.prov + ')' : '') + (l.loc ? ', depuis ' + l.loc : '') + '.',
            [l.type ? 'Mission : ' + (MTYPE[l.type] || l.type.toLowerCase()) : '', l.orbit ? (ORB[l.orbit] || 'orbite : ' + l.orbit) : '', l.agencies && l.agencies.length ? 'pour ' + l.agencies.join(', ') : ''].filter(Boolean).join(' · '),
            st ? 'Statut : ' + st + (l.prec === 'DAY' ? ' (jour connu, heure à préciser)' : l.prec === 'W' ? ' (semaine connue, jour à préciser)' : '') + '.' : '',
            l.desc ? 'Présentation de la mission (en anglais, Launch Library 2) : ' + l.desc : ''],
          warn: d > new Date() ? 'Les dates de lancement bougent souvent (météo, technique) : à vérifier la veille.' : '', dur: 30, month: month };
        if (month) { o.date = new Date(d.getFullYear(), d.getMonth(), 1, 12); o.key = key(o.date); o.jd = E.jdOf(o.date); o.body[2] = st ? 'Statut : ' + st + ', prévu en ' + fMs.format(d) + ' sans jour fixé.' : ''; }
        ev.push(o);
      });
      (LD.events || []).forEach(function (x) {
        if (/celestial|astronomical/i.test(x.type) || /^(M|Q\d?|H\d?|Y|FY)$/.test(x.prec || '')) return;   // phénomènes déjà calculés ici ; dates trop floues
        var d = new Date(x.date); if (isNaN(d) || d.getFullYear() !== Y) return;
        var vague = /^(DAY|W)$/.test(x.prec || '');
        ev.push({ jd: E.jdOf(d), date: d, key: key(d), cat: 'espace', prio: /landing|docking|spacewalk|eva|flyby|arrival|insertion/i.test(x.type + ' ' + x.name) ? 2 : 3, allDay: vague, t: x.name, ico: ICO.fusee,
          body: [x.type ? 'Type : ' + x.type.toLowerCase() + (x.loc ? ', ' + x.loc : '') + '.' : '', x.desc ? 'En anglais (Launch Library 2) : ' + x.desc : ''], ext: x.url ? ['En savoir plus', x.url] : null });
      });
    }
  }

  var ORB = { 'Low Earth Orbit': 'orbite basse', 'Very Low Earth Orbit': 'orbite très basse', 'Sun-Synchronous Orbit': 'orbite héliosynchrone', 'Geostationary Transfer Orbit': 'orbite de transfert géostationnaire', 'Geostationary Orbit': 'orbite géostationnaire', 'Geosynchronous Orbit': 'orbite géosynchrone',
    'Medium Earth Orbit': 'orbite moyenne', 'Polar Orbit': 'orbite polaire', 'Lunar Orbit': 'orbite lunaire', 'Heliocentric N/A': 'autour du Soleil', 'Suborbital': 'vol suborbital', 'Elliptical Orbit': 'orbite elliptique', 'Highly Elliptical Orbit': 'orbite très elliptique', 'Mars Orbit': 'orbite martienne', 'Lunar flyby': 'survol de la Lune', 'Translunar Injection': 'vers la Lune' };
  var MTYPE = { 'Communications': 'télécommunications', 'Earth Science': 'observation de la Terre', 'Government/Top Secret': 'gouvernementale ou secrète', 'Resupply': 'ravitaillement', 'Human Exploration': 'vol habité', 'Navigation': 'navigation par satellite',
    'Test Flight': 'vol d\'essai', 'Planetary Science': 'exploration planétaire', 'Astrophysics': 'astrophysique', 'Heliophysics': 'étude du Soleil', 'Technology': 'technologie', 'Dedicated Rideshare': 'lancement partagé', 'Tourism': 'tourisme spatial', 'Space Science': 'science spatiale', 'Lunar': 'mission lunaire', 'Robotic Exploration': 'exploration robotique' };
  var STATUS = { Go: 'feu vert', TBD: 'date à confirmer', TBC: 'date probable, à confirmer', Success: 'réussi', Failure: 'échec', 'Partial Failure': 'échec partiel', Hold: 'en attente', 'In Flight': 'en vol' };

  /* ---------- export .ics (agenda du téléphone ou de l'ordinateur) ---------- */
  function icsDate(d) { return d.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, ''); }
  function icsText(s) { return String(s).replace(/\\/g, '\\\\').replace(/\n/g, '\\n').replace(/[,;]/g, function (c) { return '\\' + c; }); }
  function ics(list) {
    var out = ['BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//Codex Mental//Observatoire//FR', 'CALSCALE:GREGORIAN'];
    list.forEach(function (e, i) {
      var st = OBS.ephem.dateOf(e.jdStart || e.jd), en = new Date(st.getTime() + (e.dur || 60) * 60000);
      out.push('BEGIN:VEVENT', 'UID:obs-' + e.cat + '-' + Math.round(e.jd * 1440) + '-' + i + '@obs.codexmental.com', 'DTSTAMP:' + icsDate(new Date()));
      if (e.allDay) { var k = e.key.replace(/-/g, ''), nx = new Date((e.end || e.date).getTime() + 864e5); out.push('DTSTART;VALUE=DATE:' + k, 'DTEND;VALUE=DATE:' + key(nx).replace(/-/g, '')); }
      else out.push('DTSTART:' + icsDate(st), 'DTEND:' + icsDate(en));
      out.push('SUMMARY:' + icsText(e.t), 'DESCRIPTION:' + icsText(e.body.filter(Boolean).join('\n') + (e.vis ? '\n' + e.vis : '')), 'URL:https://obs.codexmental.com/#/agenda/' + e.key.slice(0, 7) + '/' + (+e.key.slice(8)), 'END:VEVENT');
    });
    out.push('END:VCALENDAR');
    var a = document.createElement('a'), url = URL.createObjectURL(new Blob([out.join('\r\n')], { type: 'text/calendar' }));
    a.href = url; a.download = list.length === 1 ? 'observatoire-' + list[0].key + '.ics' : 'observatoire-agenda.ics';
    document.body.appendChild(a); a.click(); setTimeout(function () { URL.revokeObjectURL(url); a.remove(); }, 1000);
  }

  /* ---------- page ---------- */
  OBS.pages.agenda = function (page, param, sub) {
    /* le conteneur des pages sert à toutes les pages : écouteurs et contenu vivent dans un bloc propre à cette ouverture,
       qui disparaît avec elle (sinon les écouteurs s'empilent à chaque visite et agissent sur les autres pages) */
    page.innerHTML = '<div class="ag-page"></div>'; var root = page.firstChild;
    var now = new Date(), mm = /^(\d{4})-(\d\d)$/.exec(param || '');
    var cur = mm ? new Date(+mm[1], +mm[2] - 1, 1) : new Date(now.getFullYear(), now.getMonth(), 1);
    if (cur.getFullYear() < Y0 || cur.getFullYear() > Y1) cur = new Date(now.getFullYear(), now.getMonth(), 1);
    var sel = mm && sub ? new Date(cur.getFullYear(), cur.getMonth(), +sub) : (cur.getMonth() === now.getMonth() && cur.getFullYear() === now.getFullYear() ? new Date(now.getFullYear(), now.getMonth(), now.getDate()) : null);
    var view = store('obs.agenda.vue') || 'mois', off = {};
    try { (JSON.parse(store('obs.agenda.off') || '[]') || []).forEach(function (c) { off[c] = 1; }); } catch (e) {}

    root.innerHTML = '<p class="p-kicker">Agenda du ciel</p><h1>Agenda du ciel</h1>' +
      '<p class="lead">Ce qui se passe dans le ciel, jour après jour : phases de la Lune, éclipses, planètes, étoiles filantes, saisons. Tout est calculé ici, dans votre navigateur, de 1800 à 2100 : un calendrier du passé autant que de l\'avenir.</p>' +
      '<div class="c-flags"><span class="flag f-real" title="Réel — formules de Jean Meeus (Astronomical Algorithms) : à la minute près pour la Lune et les saisons, à quelques minutes pour les éclipses"><i>Dates</i>calculées</span>' +
      '<span class="flag f-real" title="Réel — pic des pluies d\'étoiles filantes d\'après la position du Soleil (calendrier de l\'International Meteor Organization) ; le pic réel peut varier de quelques heures"><i>Étoiles filantes</i>IMO</span>' +
      '<span class="flag f-adapt" title="Adapté — visibilité calculée pour le lieu choisi (Terre supposée sphérique, sans relief ni réfraction)"><i>Visibilité</i>selon le lieu</span></div>' +
      '<section class="ag-tonight" aria-label="Ce soir"></section>' +
      '<div class="ag-bar">' +
        '<div class="ag-nav"><button type="button" data-m="-1" aria-label="Précédent">‹</button><h2 class="ag-title"></h2><button type="button" data-m="1" aria-label="Suivant">›</button>' +
        '<button type="button" class="chip" data-today>Aujourd\'hui</button><label class="ag-year"><span class="sr">Année</span><input type="number" min="' + Y0 + '" max="' + Y1 + '" step="1" aria-label="Année"></label></div>' +
        '<div class="ag-views" role="group" aria-label="Vue">' + [['mois', 'Mois'], ['trimestre', '3 mois'], ['annee', 'Année'], ['liste', 'Liste']].map(function (v) { return '<button type="button" data-view="' + v[0] + '">' + v[1] + '</button>'; }).join('') + '</div>' +
      '</div>' +
      '<div class="ag-filters" role="group" aria-label="Catégories"><button type="button" class="chip" data-all>Tout</button>' + CATS.map(function (c) { return '<button type="button" class="chip ag-cat" data-cat="' + c.id + '" style="--c:' + c.c + '"><i></i>' + c.label + '</button>'; }).join('') +
      '<button type="button" class="chip ag-swarm" title="Lots de satellites des grandes constellations (Starlink, Kuiper, Qianfan…) : plusieurs par semaine">+ constellations</button>' +
      '<label class="ag-place"><span>Lieu</span><select>' + PLACES.map(function (p) { return '<option value="' + p[0] + '">' + esc(p[1]) + '</option>'; }).join('') + '<option value="geo">Ma position…</option></select></label></div>' +
      '<div class="ag-main"><div class="ag-cal"></div></div>' +
      '<aside class="ag-drawer" role="dialog" aria-label="Détail du jour" aria-hidden="true"><div class="ag-dw-bar"><button type="button" class="ag-ib" data-dstep="-1" title="Jour précédent" aria-label="Jour précédent">‹</button><button type="button" class="ag-ib" data-dstep="1" title="Jour suivant" aria-label="Jour suivant">›</button><button type="button" class="ag-ib ag-dw-x" title="Fermer (Échap)" aria-label="Fermer">×</button></div><div class="ag-day" aria-live="polite"></div></aside>' +
      '<h2 class="ag-h">À venir</h2><div class="ag-next"></div>' +
      '<p class="note">Heures données dans le fuseau de votre appareil. Calculs : Jean Meeus, <i>Astronomical Algorithms</i> (Lune, Soleil, saisons, éclipses), éléments des planètes de E. M. Standish (JPL), ΔT d\'Espenak et Meeus (NASA), pics des étoiles filantes d\'après l\'International Meteor Organization. Précision : la minute pour les phases et les saisons, quelques minutes pour les éclipses, l\'heure pour les rapprochements ; moindre avant 1900 et après 2050. Rendez-vous (salons, festivals, nuits d\'observation) vérifiés sur le site des organisateurs.<span class="ag-src"></span></p>';
    var $ = function (s) { return root.querySelector(s); };
    var sP = $('.ag-place select'), P0 = place(); sP.value = /^geo:/.test(P0.id) ? 'geo' : P0.id;
    if (/^geo:/.test(P0.id)) sP.querySelector('[value=geo]').textContent = 'Ma position';

    function visible(e) { return !off[e.cat] && !e.month; }
    function monthOnly(y, mo) { return off.espace ? [] : yearEvents(y).filter(function (e) { return e.month && e.date.getMonth() === mo; }); }
    function evsOf(y) { return yearEvents(y).filter(visible); }
    function byDay(list) { var m = {}; list.forEach(function (e) { (m[e.key] = m[e.key] || []).push(e); }); return m; }
    function setHash() {
      var h = '#/agenda/' + cur.getFullYear() + '-' + pad(cur.getMonth() + 1) + (sel && sel.getMonth() === cur.getMonth() && sel.getFullYear() === cur.getFullYear() ? '/' + sel.getDate() : '');
      if (location.hash !== h) history.replaceState(null, '', h);
    }
    function chipsState() {
      root.querySelectorAll('.ag-cat').forEach(function (b) { b.setAttribute('aria-pressed', String(!off[b.getAttribute('data-cat')])); });
      $('[data-all]').setAttribute('aria-pressed', String(!Object.keys(off).length));
      var sw = $('.ag-swarm'); sw.setAttribute('aria-pressed', String(store('obs.agenda.constellations') === '1')); sw.hidden = !!off.espace || !OBS.AGENDA_LAUNCH;
      root.querySelectorAll('[data-view]').forEach(function (b) { b.setAttribute('aria-pressed', String(b.getAttribute('data-view') === view)); });
    }
    function moonIco(d) { return OBS.LUNE.icon(OBS.LUNE.moonAt(OBS.ephem.jdOf(new Date(d.getFullYear(), d.getMonth(), d.getDate(), 21))), 16); }

    /* grille d'un mois : full = cases détaillées, sinon petits points */
    function grid(y, mo, full) {
      var nd = new Date(y, mo + 1, 0).getDate(), first = (new Date(y, mo, 1).getDay() + 6) % 7, map = byDay(evsOf(y).filter(function (e) { return e.date.getMonth() === mo; }));
      var h = '<div class="ag-grid' + (full ? ' full' : ' mini') + '">' + (full ? '' : '<button type="button" class="ag-mh" data-goto="' + y + '-' + mo + '">' + cap(fMs.format(new Date(y, mo, 1))) + '</button>') +
        ['lun', 'mar', 'mer', 'jeu', 'ven', 'sam', 'dim'].map(function (d) { return '<span class="ag-dh">' + (full ? d : d.charAt(0)) + '</span>'; }).join('');
      for (var i = 0; i < first; i++) h += '<span class="ag-pad"></span>';
      var spans = evsOf(y).filter(function (e) { return e.end && e.end - e.date <= 21 * 864e5; });   // rendez-vous de plusieurs jours : un trait sur les jours suivants
      for (var d = 1; d <= nd; d++) {
        var dt = new Date(y, mo, d), k = key(dt), L = (map[k] || []).sort(function (a, b) { return a.prio - b.prio || a.jd - b.jd; });
        var noon = new Date(y, mo, d, 12), sp = spans.filter(function (e) { return e.date < noon && e.end >= noon; }), spH = sp.map(function (e) { return '<span class="ag-span" style="--c:' + CAT[e.cat].c + '" title="' + esc(e.t) + '">' + (full && (dt.getDay() === 1 || d === 1) ? '<b>' + esc(e.short || e.t) + '</b>' : '') + '</span>'; }).join('');
        var today = k === key(now), on = sel && k === key(sel), anims = {};
        L.forEach(function (e) { if (e.anim) anims[e.anim] = 1; });
        var cls = 'ag-d' + (today ? ' today' : '') + (on ? ' on' : '') + (L.length ? ' has' : '') + (L.some(function (e) { return e.prio === 1; }) ? ' major' : '') + Object.keys(anims).map(function (a) { return ' an-' + a; }).join('');
        if (full) {
          var ph = L.filter(function (e) { return e.cat === 'lune' && e.f !== undefined; })[0], show = L.filter(function (e) { return e !== ph; });
          h += '<button type="button" class="' + cls + '" data-day="' + k + '" aria-label="' + esc(fD.format(dt) + (L.length ? ' : ' + L.map(function (e) { return e.t; }).join(', ') : '')) + '">' +
            '<span class="ag-dn">' + d + '</span><span class="ag-moon' + (ph ? ' key' : '') + '">' + (ph ? ph.ico : moonIco(dt)) + '</span>' +
            (ph ? '<span class="ag-e e-lune' + (ph.sup ? ' sup' : '') + '">' + esc(ph.t) + '</span>' : '') +
            show.slice(0, ph ? 2 : 3).map(function (e) { return '<span class="ag-e e-' + e.cat + '" style="--c:' + CAT[e.cat].c + '">' + e.ico + '<b>' + esc(e.short || e.t) + '</b></span>'; }).join('') +
            (show.length > (ph ? 2 : 3) ? '<span class="ag-more">+ ' + (show.length - (ph ? 2 : 3)) + '</span>' : '') +
            '<span class="ag-dots">' + L.slice(0, 4).map(function (e) { return '<i style="--c:' + CAT[e.cat].c + '"></i>'; }).join('') + '</span>' + spH + '</button>';
        } else {
          h += '<button type="button" class="' + cls + '" data-day="' + k + '" title="' + esc(L.map(function (e) { return e.t; }).join(' · ')) + '"><span class="ag-dn">' + d + '</span><span class="ag-dots">' + L.slice(0, 3).map(function (e) { return '<i style="--c:' + CAT[e.cat].c + '"></i>'; }).join('') + '</span>' + spH + '</button>';
        }
      }
      return h + '</div>';
    }
    function item(e, withDate) {
      var past = e.date < now;
      return '<article class="ag-ev' + (past ? ' past' : '') + '" style="--c:' + CAT[e.cat].c + '"><div class="ag-ev-h">' + e.ico + '<div><h3>' + esc(e.t) + '</h3><p class="ag-when">' +
        (e.end ? esc(range(e.date, e.end)) + ' · ' : withDate ? esc(cap(fD.format(e.date))) + (e.allDay ? '' : ' · ') : '') + (e.allDay ? '' : hm(e.jd)) + ' <span class="ag-tag">' + CAT[e.cat].label + '</span></p></div></div>' +
        e.body.filter(Boolean).map(function (p) { return '<p>' + esc(p) + '</p>'; }).join('') + (e.vis ? '<p class="ag-vis">' + esc(e.vis) + '</p>' : '') + (e.warn ? '<p class="ag-warn">' + esc(e.warn) + '</p>' : '') +
        '<p class="ag-acts">' + srcLink(e) + '<button type="button" class="ag-ib" data-share="' + e.cat + '|' + e.jd + '" title="Partager" aria-label="Partager">' + IB.share + '</button>' +
        '<button type="button" class="ag-ib" data-ics="' + e.cat + '|' + e.jd + '" title="Ajouter à mon agenda (fichier .ics)" aria-label="Ajouter à mon agenda">' + IB.cal + '</button></p></article>';
    }
    /* source de chaque événement : site de l'organisateur, base des lancements, encyclopédie, ou la page Méthode pour ce qui est calculé ici */
    function srcLink(e) {
      var s = e.ext ? [e.ext[1], 'Source : ' + e.ext[0], true] :
        e.cat === 'espace' ? ['https://thespacedevs.com/llapi', 'Source : Launch Library 2 (The Space Devs)', true] :
        e.cat === 'histoire' ? ['https://fr.wikipedia.org/w/index.php?search=' + encodeURIComponent(e.short || e.t), 'En savoir plus (Wikipédia)', true] :
        e.cat === 'visiteurs' && e.link ? [e.link[1], e.link[0], false] :
        e.cat === 'rdv' ? ['https://www.un.org/fr/observances/list-days-weeks', 'Source : journées internationales de l\'ONU', true] :
        ['#/methode', 'Comment c\'est calculé (Méthode)', false];
      return '<a class="ag-ib" href="' + esc(s[0]) + '"' + (s[2] ? ' target="_blank" rel="noopener"' : '') + ' title="' + esc(s[1]) + '" aria-label="' + esc(s[1]) + '">' + IB.src + '</a>';
    }
    function find(v) { var p = v.split('|'), jd = +p[1]; return yearEvents(OBS.ephem.dateOf(jd).getFullYear()).filter(function (x) { return x.cat === p[0] && Math.abs(x.jd - jd) < 1e-6; })[0]; }
    function share(e, btn) {
      var url = 'https://obs.codexmental.com/#/agenda/' + e.key.slice(0, 7) + '/' + (+e.key.slice(8)), text = e.t + ' — ' + cap(fD.format(e.date)) + (e.allDay ? '' : ', ' + hm(e.jd));
      if (navigator.share) { navigator.share({ title: e.t, text: text, url: url }).catch(function () {}); return; }
      var done = function () { btn.classList.add('ok'); btn.title = 'Lien copié'; setTimeout(function () { btn.classList.remove('ok'); btn.title = 'Partager'; }, 1800); };
      if (navigator.clipboard) navigator.clipboard.writeText(text + '\n' + url).then(done, function () {}); 
    }
    function dayPanel() {
      var box = $('.ag-day');
      if (!sel) { box.innerHTML = '<p class="ag-hint">Choisissez un jour pour voir le détail.</p>'; return; }
      var k = key(sel), noon = new Date(sel.getFullYear(), sel.getMonth(), sel.getDate(), 12);
      var L = evsOf(sel.getFullYear()).filter(function (e) { return e.key === k || (e.end && e.date < noon && e.end >= noon); }).sort(function (a, b) { return (a.key === k ? 0 : 1) - (b.key === k ? 0 : 1) || a.prio - b.prio || a.jd - b.jd; });
      var m = OBS.LUNE.moonAt(OBS.ephem.jdOf(new Date(sel.getFullYear(), sel.getMonth(), sel.getDate(), 21)));
      box.innerHTML = '<div class="ag-day-h"><h2>' + esc(cap(fD.format(sel))) + '</h2><p class="ag-dmoon">' + OBS.LUNE.icon(m, 22) + '<span>' + esc(OBS.LUNE.phaseName(m)) + ', éclairée à ' + Math.round(m.frac * 100) + ' % (21 h)</span></p></div>' +
        (L.length ? '<div class="ag-evs">' + L.map(function (e) { return item(e, false); }).join('') + '</div>' : '<p class="ag-hint">Rien de particulier ce jour-là' + (Object.keys(off).length ? ' dans les catégories choisies' : '') + '.</p>');
    }
    function list(evs, withMonths) {
      var last = '', h = '';
      evs.forEach(function (e) {
        var mk = fM.format(e.date); if (withMonths && mk !== last) { h += '<h3 class="ag-lm">' + esc(cap(mk)) + '</h3>'; last = mk; }
        h += '<button type="button" class="ag-li' + (e.prio === 1 ? ' major' : '') + (e.date < now ? ' past' : '') + '" data-day="' + e.key + '" style="--c:' + CAT[e.cat].c + '"><span class="ag-lid">' + esc(fDs.format(e.date)) + (e.allDay ? '' : '<small>' + hm(e.jd) + '</small>') + '</span>' + e.ico + '<span class="ag-lit">' + esc(e.t) + '</span></button>';
      });
      return h || '<p class="ag-hint">Aucun événement dans les catégories choisies.</p>';
    }
    function render() {
      var y = cur.getFullYear(), mo = cur.getMonth(), cal = $('.ag-cal');
      $('.ag-year input').value = y;
      root.classList.toggle('ag-wide', view !== 'mois');
      if (view === 'mois') {
        $('.ag-title').textContent = cap(fM.format(cur)); var mOnly = monthOnly(y, mo);
        cal.innerHTML = grid(y, mo, true) + (mOnly.length ? '<details class="ag-monthonly"><summary>' + mOnly.length + ' lancement' + (mOnly.length > 1 ? 's' : '') + ' prévu' + (mOnly.length > 1 ? 's' : '') + ' en ' + esc(fMs.format(cur)) + ', sans jour fixé</summary>' + mOnly.map(function (e) { return item(e, false); }).join('') + '</details>' : '');
      }
      else if (view === 'trimestre') {
        var a = new Date(y, mo, 1), b = new Date(y, mo + 2, 1);
        $('.ag-title').textContent = cap(fMs.format(a)) + ' – ' + fM.format(b);
        var ms = [0, 1, 2].map(function (i) { return new Date(y, mo + i, 1); });
        var evs = [].concat.apply([], ms.map(function (d) { return evsOf(d.getFullYear()).filter(function (e) { return e.date.getMonth() === d.getMonth(); }); }));
        cal.innerHTML = '<div class="ag-months">' + ms.map(function (d) { return grid(d.getFullYear(), d.getMonth(), false); }).join('') + '</div><div class="ag-list">' + list(evs, true) + '</div>';
      } else if (view === 'annee') {
        $('.ag-title').textContent = String(y);
        cal.innerHTML = '<div class="ag-months ag-year12">' + [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11].map(function (m) { return grid(y, m, false); }).join('') + '</div>' +
          '<h3 class="ag-lm">Les temps forts de ' + y + '</h3><div class="ag-list">' + list(evsOf(y).filter(function (e) { return e.prio === 1; }), false) + '</div>';
      } else {
        $('.ag-title').textContent = String(y);
        cal.innerHTML = '<div class="ag-list">' + list(evsOf(y), true) + '</div>';
      }
      dayPanel(); chipsState(); setHash();
    }
    function next() {
      var t = OBS.ephem.jdOf(now), y = now.getFullYear(), evs = evsOf(y).concat(y < Y1 ? evsOf(y + 1) : []).filter(function (e) { return e.jd >= t - .5 && e.prio <= 2; }).slice(0, 8);
      $('.ag-next').innerHTML = '<div class="ag-list">' + list(evs, false) + '</div>';
    }
    /* ce soir : la Lune, les planètes visibles, l'événement du jour */
    function tonight() {
      var E = OBS.ephem, d = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 21, 30), jd = E.jdOf(d), m = OBS.LUNE.moonAt(jd), s = E.sun(jd), P = place();
      var vis = PLANETS.filter(function (p) { return BRIGHT[p[0]]; }).map(function (p) {
        var pp = E.planet(p[0], jd), e = E.n180(pp.lon - s.lon), a = Math.abs(e);
        if (a < 18) return null;
        return [p[1], a > 150 ? 'toute la nuit' : e > 0 ? (a > 90 ? 'en soirée' : 'au crépuscule, vers l\'ouest') : (a > 90 ? 'en seconde partie de nuit' : 'à l\'aube, vers l\'est'), p[0]];
      }).filter(Boolean), groups = {}, order = [];
      vis.forEach(function (v) { if (!groups[v[1]]) { groups[v[1]] = []; order.push(v[1]); } groups[v[1]].push('<a href="#/explorer/' + v[2] + '">' + esc(v[0]) + '</a>'); });
      var today = evsOf(now.getFullYear()).filter(function (e) { return e.key === key(now); });
      $('.ag-tonight').innerHTML = '<div class="ag-tn-moon">' + OBS.LUNE.icon(m, 44) + '</div><div class="ag-tn-txt"><p class="ag-tn-k">Ce soir · ' + esc(fDs.format(now)) + '</p>' +
        '<p><b>' + esc(OBS.LUNE.phaseName(m)) + '</b>, éclairée à ' + Math.round(m.frac * 100) + ' %. ' + (order.length ? 'Planètes à l\'œil nu : ' + order.map(function (w) { return groups[w].join(', ').replace(/, ([^,]*)$/, ' et $1') + ' ' + esc(w); }).join(' ; ') + '.' : 'Aucune planète brillante bien placée.') + '</p>' +
        (today.length ? '<p class="ag-tn-ev">Aujourd\'hui : ' + today.map(function (e) { return '<button type="button" data-day="' + e.key + '">' + esc(e.t) + '</button>'; }).join(' · ') + '</p>' : '') + '</div>';
    }

    root.addEventListener('click', function (e) {
      if (root.classList.contains('ag-open') && !e.target.closest('.ag-drawer') && window.matchMedia('(max-width: 640px)').matches) { closeDrawer(); return; }   // téléphone : toucher hors du panneau le referme
      var b = e.target.closest('button'); if (!b || !root.contains(b)) return;
      if (b.hasAttribute('data-m')) {
        var n = +b.getAttribute('data-m'), stepM = view === 'mois' ? 1 : view === 'trimestre' ? 3 : 12;
        var c2 = new Date(cur.getFullYear(), cur.getMonth() + n * stepM, 1); if (c2.getFullYear() < Y0 || c2.getFullYear() > Y1) return;
        cur = c2; render();
      } else if (b.hasAttribute('data-today')) { cur = new Date(now.getFullYear(), now.getMonth(), 1); sel = new Date(now.getFullYear(), now.getMonth(), now.getDate()); render(); }
      else if (b.hasAttribute('data-view')) { view = b.getAttribute('data-view'); store('obs.agenda.vue', view); if (view === 'annee' || view === 'liste') cur = new Date(cur.getFullYear(), view === 'annee' ? 0 : cur.getMonth(), 1); render(); }
      else if (b.hasAttribute('data-all')) { off = {}; store('obs.agenda.off', '[]'); render(); next(); }
      else if (b.hasAttribute('data-cat')) {
        var c = b.getAttribute('data-cat'); if (off[c]) delete off[c]; else off[c] = 1;
        if (Object.keys(off).length === CATS.length) delete off[c];   // au moins une catégorie reste affichée
        store('obs.agenda.off', JSON.stringify(Object.keys(off))); render(); next();
      }
      else if (b.classList.contains('ag-swarm')) { store('obs.agenda.constellations', store('obs.agenda.constellations') === '1' ? '0' : '1'); cache = {}; render(); next(); }
      else if (b.hasAttribute('data-goto')) { var g = b.getAttribute('data-goto').split('-'); cur = new Date(+g[0], +g[1], 1); view = 'mois'; store('obs.agenda.vue', view); render(); }
      else if (b.hasAttribute('data-day')) {
        var p = b.getAttribute('data-day').split('-'); sel = new Date(+p[0], +p[1] - 1, +p[2]);
        if (view === 'mois' && (sel.getMonth() !== cur.getMonth() || sel.getFullYear() !== cur.getFullYear())) cur = new Date(sel.getFullYear(), sel.getMonth(), 1);
        if (view !== 'mois' && !b.closest('.ag-grid')) { cur = new Date(sel.getFullYear(), sel.getMonth(), 1); view = 'mois'; store('obs.agenda.vue', view); }
        render();
        openDrawer();
      }
      else if (b.classList.contains('ag-dw-x')) closeDrawer();
      else if (b.hasAttribute('data-dstep')) {
        sel = new Date(sel.getFullYear(), sel.getMonth(), sel.getDate() + +b.getAttribute('data-dstep'));
        if (sel.getFullYear() < Y0 || sel.getFullYear() > Y1) { sel = new Date(sel.getFullYear(), sel.getMonth(), sel.getDate() - +b.getAttribute('data-dstep')); return; }
        if (view === 'mois' && (sel.getMonth() !== cur.getMonth() || sel.getFullYear() !== cur.getFullYear())) cur = new Date(sel.getFullYear(), sel.getMonth(), 1);
        render();
      }
      else if (b.hasAttribute('data-ics')) { var ev = find(b.getAttribute('data-ics')); if (ev) ics([ev]); }
      else if (b.hasAttribute('data-share')) { var es = find(b.getAttribute('data-share')); if (es) share(es, b); }
    });
    $('.ag-year input').addEventListener('change', function (e) { var y = Math.max(Y0, Math.min(Y1, Math.round(+e.target.value) || now.getFullYear())); cur = new Date(y, view === 'annee' ? 0 : cur.getMonth(), 1); render(); });
    sP.addEventListener('change', function () {
      function apply(v) { store('obs.agenda.lieu', v); cache = {}; acache = {}; render(); next(); tonight(); }
      if (sP.value !== 'geo') { apply(sP.value); return; }
      if (!navigator.geolocation) { sP.value = place().id; return; }
      navigator.geolocation.getCurrentPosition(function (pos) {   // arrondi au dixième de degré (≈ 10 km), gardé dans ce navigateur seulement
        sP.querySelector('[value=geo]').textContent = 'Ma position';
        apply('geo:' + pos.coords.latitude.toFixed(1) + ',' + pos.coords.longitude.toFixed(1));
      }, function () { var p = place(); sP.value = /^geo:/.test(p.id) ? 'geo' : p.id; }, { maximumAge: 864e5, timeout: 15000 });
    });
    /* panneau du jour : glisse depuis la droite (depuis le bas sur téléphone) quand on choisit un jour ; Échap le referme */
    var drawer = $('.ag-drawer');
    function openDrawer() { root.classList.add('ag-open'); drawer.setAttribute('aria-hidden', 'false'); drawer.scrollTop = 0; }
    function closeDrawer() { root.classList.remove('ag-open'); drawer.setAttribute('aria-hidden', 'true'); }
    function onKey(e) {
      if (!root.isConnected) { document.removeEventListener('keydown', onKey, true); return; }
      if (e.key === 'Escape' && root.classList.contains('ag-open')) { e.stopPropagation(); e.preventDefault(); closeDrawer(); }
    }
    document.addEventListener('keydown', onKey, true);
    /* pendant le défilement, les petites animations des cases se figent : sinon elles forcent à repeindre la page à chaque image */
    var scroller = page.closest('.page-scroll'), stillT = 0;
    function onScroll() {
      if (!root.isConnected) { scroller.removeEventListener('scroll', onScroll); return; }
      root.classList.add('ag-scrolling'); clearTimeout(stillT); stillT = setTimeout(function () { root.classList.remove('ag-scrolling'); }, 250);
    }
    if (scroller) scroller.addEventListener('scroll', onScroll, { passive: true });
    tonight(); render(); next();
    if (mm && sub && sel) openDrawer();   // lien partagé vers un jour : on l'ouvre directement
    if (!OBS.AGENDA_LAUNCH && window.fetch) {   // lancements : fichier mis à jour par une tâche GitHub (toutes les six heures)
      fetch('data/lancements.json?h=' + Math.floor(Date.now() / 36e5)).then(function (r) { return r.ok ? r.json() : null; }).then(function (d) {
        if (!d || !root.isConnected) return;
        OBS.AGENDA_LAUNCH = d; cache = {}; render(); next(); tonight();
        var n = root.querySelector('.ag-src'); if (n) n.textContent = ' Lancements : Launch Library 2 (The Space Devs), mis à jour le ' + fDs.format(new Date(d.updated)) + '.';
      }).catch(function () {});
    }
  };
  OBS.agendaEvents = yearEvents;   // pour vérification
})();

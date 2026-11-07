/* ======================================================================
   OBSERVATOIRE — Visiteurs du système solaire
   Objets qui passent : interstellaires, comètes, astéroïdes qui frôlent la Terre, pluies d'étoiles filantes.
   dates : [[AAAA-MM-JJ, ce qui se passe]] — passées ou à venir, le passé/futur est calculé à l'affichage.
   Sources : JPL Small-Body Database et CNEOS (NASA), ESA, IMO (pluies d'étoiles filantes) ; valeurs arrondies.
   obs : lien dans la scène ; hypo : fiche d'hypothèse liée ; wiki : titre de l'article Wikipédia (photos, détails).
   ====================================================================== */
(function () {
  'use strict';
  var OBS = window.OBS = window.OBS || {};

  OBS.VISITOR_CATS = [
    ['interstellaire', 'Venus d\'ailleurs', 'Des objets nés autour d\'une autre étoile, qui traversent le système solaire une seule fois.'],
    ['periodique', 'Comètes qui reviennent', 'Des comètes sur des orbites fermées, qui repassent près du Soleil à intervalles réguliers.'],
    ['grande', 'Grandes comètes', 'Des comètes spectaculaires, visibles à l\'œil nu, qui ne reviendront pas avant des siècles ou des millénaires.'],
    ['geocroiseur', 'Astéroïdes proches de la Terre', 'Des astéroïdes dont l\'orbite croise ou frôle celle de la Terre, surveillés de près.'],
    ['pluie', 'Pluies d\'étoiles filantes', 'Chaque année, la Terre traverse les poussières laissées par une comète ou un astéroïde : chaque grain qui brûle dans l\'atmosphère est une étoile filante.']
  ];

  OBS.VISITORS = [
    /* ---------- interstellaires ---------- */
    { id: 'oumuamua', cat: 'interstellaire', name: 'ʻOumuamua', des: '1I/2017 U1', kind: 'Objet interstellaire',
      dates: [['2017-09-09', 'Passage au plus près du Soleil (0,26 UA)'], ['2017-10-14', 'Passage au plus près de la Terre (24 millions de km)'], ['2017-10-19', 'Découverte par le télescope Pan-STARRS, à Hawaï']],
      text: "Le premier objet venu d'une autre étoile jamais observé. Son nom hawaïen signifie à peu près « messager venu de loin ». Il a été découvert alors qu'il repartait déjà. Il était très allongé ou très plat, rougeâtre, et a légèrement accéléré en s'éloignant, sans queue visible.",
      facts: [['Taille', '≈ 100 à 400 m de long'], ['Vitesse hors du système solaire', '≈ 26 km/s'], ['Composition', 'inconnue : roche ou glace, sans dégazage visible']],
      hypo: 'oumuamua-voile', wiki: '1I/ʻOumuamua' },
    { id: 'borisov', frise: [1], cat: 'interstellaire', name: 'Comète Borisov', des: '2I/Borisov', kind: 'Comète interstellaire',
      dates: [['2019-08-30', 'Découverte par Guennadi Borisov, astronome amateur, avec un télescope qu\'il a construit'], ['2019-12-08', 'Passage au plus près du Soleil (2 UA)']],
      text: "La deuxième visiteuse interstellaire, et la première comète venue d'ailleurs. Elle ressemblait beaucoup aux comètes de notre système, avec une queue bien visible, mais contenait une proportion inhabituelle de monoxyde de carbone.",
      facts: [['Noyau', 'moins de 1 km'], ['Vitesse hors du système solaire', '≈ 32 km/s'], ['Composition', 'glaces riches en monoxyde de carbone, poussières']],
      wiki: '2I/Borisov' },
    { id: 'atlas3i', frise: [2], cat: 'interstellaire', name: '3I/ATLAS', des: 'C/2025 N1', kind: 'Comète interstellaire',
      dates: [['2025-07-01', 'Découverte par le réseau de télescopes ATLAS, au Chili'], ['2025-10-03', 'Passage près de Mars, observée par les sondes en orbite'], ['2025-10-29', 'Passage au plus près du Soleil (≈ 1,4 UA)']],
      text: "La troisième visiteuse interstellaire, et la plus rapide. Sa trajectoire suggère qu'elle vient du disque épais de la Voie lactée, une population d'étoiles anciennes : elle pourrait être plus vieille que le système solaire. Le télescope James Webb a trouvé sa chevelure très riche en dioxyde de carbone.",
      facts: [['Vitesse hors du système solaire', '≈ 58 km/s'], ['Composition', 'glaces riches en dioxyde de carbone'], ['Âge possible', 'plus de 7 milliards d\'années (estimation)']],
      wiki: '3I/ATLAS' },

    /* ---------- comètes périodiques ---------- */
    { id: 'halley-v', frise: [0, 2], cat: 'periodique', name: 'Comète de Halley', des: '1P/Halley', kind: 'Comète périodique · tous les 76 ans environ',
      dates: [['1986-02-09', 'Dernier passage au plus près du Soleil ; la sonde Giotto photographie son noyau'], ['2023-12-09', 'Point le plus lointain de son orbite, au-delà de Neptune'], ['2061-07-28', 'Prochain passage au plus près du Soleil']],
      text: "La plus célèbre des comètes, observée depuis au moins 240 avant J.-C. Edmond Halley a compris en 1705 qu'il s'agissait d'un seul objet qui revient, et prédit son retour de 1758. Ses poussières donnent deux pluies d'étoiles filantes par an, les Êta Aquarides et les Orionides.",
      facts: [['Noyau', '≈ 15 × 8 km, très sombre'], ['Période', '≈ 76 ans'], ['Composition', 'glace d\'eau, poussières, composés carbonés']],
      obs: ['#/explorer/halley', 'Voir dans l\'espace'], wiki: 'Comète de Halley' },
    { id: 'encke', cat: 'periodique', name: 'Comète d\'Encke', des: '2P/Encke', kind: 'Comète périodique · tous les 3,3 ans',
      dates: [['2023-10-22', 'Dernier passage au plus près du Soleil']],
      text: "La comète qui revient le plus vite parmi les comètes connues depuis longtemps : un tour en 3,3 ans, sans jamais s'éloigner au-delà de Jupiter. Ses poussières donnent les Taurides, en automne.",
      facts: [['Noyau', '≈ 5 km'], ['Période', '3,3 ans'], ['Prochain passage', 'en 2027']],
      wiki: 'Comète Encke' },
    { id: 'tchouri', cat: 'periodique', name: 'Tchourioumov-Guérassimenko', des: '67P', kind: 'Comète périodique · tous les 6,4 ans',
      dates: [['2014-08-06', 'Arrivée de la sonde européenne Rosetta'], ['2014-11-12', 'Le module Philae se pose à sa surface, une première'], ['2016-09-30', 'Fin de la mission : Rosetta se pose à son tour']],
      text: "La comète la mieux connue, grâce à la sonde Rosetta qui l'a accompagnée pendant deux ans. Elle a la forme d'un canard en caoutchouc : deux lobes collés l'un à l'autre. Rosetta y a trouvé de la glycine, un acide aminé.",
      facts: [['Taille', '≈ 4 km'], ['Période', '6,4 ans'], ['Composition', 'glace, poussières, molécules organiques']],
      wiki: '67P/Tchourioumov-Guérassimenko' },
    { id: 'swifttuttle', cat: 'periodique', name: 'Comète Swift-Tuttle', des: '109P', kind: 'Comète périodique · tous les 133 ans',
      dates: [['1992-12-12', 'Dernier passage au plus près du Soleil'], ['2126-07-12', 'Prochain passage au plus près du Soleil']],
      text: "La mère des Perséides, les étoiles filantes du mois d'août. Avec un noyau d'environ 26 km, c'est le plus gros objet connu qui croise régulièrement l'orbite de la Terre ; aucun risque de collision n'est prévu pour les prochains millénaires.",
      facts: [['Noyau', '≈ 26 km'], ['Période', '≈ 133 ans']],
      wiki: '109P/Swift-Tuttle' },
    { id: 'ponsbrooks', cat: 'periodique', name: 'Comète Pons-Brooks', des: '12P', kind: 'Comète périodique · tous les 71 ans',
      dates: [['2024-04-21', 'Dernier passage au plus près du Soleil, visible aux jumelles']],
      text: "Surnommée « la comète du diable » : en 2023, ses sursauts d'activité ont donné à sa chevelure une forme évoquant deux cornes.",
      facts: [['Noyau', '≈ 17 km'], ['Période', '≈ 71 ans'], ['Prochain passage', 'vers 2095']],
      wiki: '12P/Pons-Brooks' },

    /* ---------- grandes comètes ---------- */
    { id: 'halebopp', cat: 'grande', name: 'Hale-Bopp', des: 'C/1995 O1', kind: 'Grande comète de 1997',
      dates: [['1997-04-01', 'Passage au plus près du Soleil']],
      text: "Visible à l'œil nu pendant 18 mois, un record : des centaines de millions de personnes l'ont vue. Son noyau, d'environ 60 km, est l'un des plus gros connus.",
      facts: [['Noyau', '≈ 60 km'], ['Retour', 'dans environ 2 400 ans']],
      wiki: 'C/1995 O1 (Hale-Bopp)' },
    { id: 'hyakutake', cat: 'grande', name: 'Hyakutake', des: 'C/1996 B2', kind: 'Grande comète de 1996',
      dates: [['1996-03-25', 'Passage au plus près de la Terre (15 millions de km)']],
      text: "Passée tout près de la Terre, avec une queue qui traversait une bonne partie du ciel. C'est autour d'elle qu'on a découvert, pour la première fois, qu'une comète émet des rayons X.",
      facts: [['Retour', 'dans des dizaines de milliers d\'années']],
      wiki: 'C/1996 B2 (Hyakutake)' },
    { id: 'mcnaught', cat: 'grande', name: 'McNaught', des: 'C/2006 P1', kind: 'Grande comète de 2007',
      dates: [['2007-01-12', 'Passage au plus près du Soleil, visible en plein jour']],
      text: "La comète la plus brillante depuis plus de quarante ans, visible en plein jour près du Soleil. Depuis l'hémisphère Sud, sa queue en éventail s'étendait sur une immense partie du ciel.",
      facts: [['Retour', 'ne reviendra sans doute jamais']],
      wiki: 'C/2006 P1 (McNaught)' },
    { id: 'neowise', cat: 'grande', name: 'NEOWISE', des: 'C/2020 F3', kind: 'Grande comète de 2020',
      dates: [['2020-07-03', 'Passage au plus près du Soleil ; visible à l\'œil nu en juillet']],
      text: "La comète du confinement : visible à l'œil nu dans le ciel du soir de juillet 2020, avec deux queues bien distinctes, l'une de poussières et l'autre de gaz.",
      facts: [['Noyau', '≈ 5 km'], ['Retour', 'dans environ 6 800 ans']],
      wiki: 'C/2020 F3 (NEOWISE)' },
    { id: 'tsuchinshan', frise: [1], cat: 'grande', name: 'Tsuchinshan-ATLAS', des: 'C/2023 A3', kind: 'Grande comète de 2024',
      dates: [['2024-09-27', 'Passage au plus près du Soleil'], ['2024-10-12', 'Passage au plus près de la Terre, visible à l\'œil nu']],
      text: "La belle comète d'octobre 2024, avec une longue queue et une « anti-queue », une fine traînée de poussières qui semblait pointer vers le Soleil, un effet de perspective.",
      facts: [['Retour', 'peut-être jamais']],
      wiki: 'C/2023 A3 (Tsuchinshan-ATLAS)' },
    { id: 'sl9', cat: 'grande', name: 'Shoemaker-Levy 9', des: 'D/1993 F2', kind: 'Comète disparue',
      dates: [['1994-07-16', 'Début des impacts de ses fragments sur Jupiter, jusqu\'au 22 juillet']],
      text: "Une comète capturée par Jupiter, puis brisée en une vingtaine de morceaux par sa gravité. En juillet 1994, les fragments se sont écrasés sur la planète, laissant des taches sombres plus grandes que la Terre : la première collision entre deux corps du système solaire observée en direct.",
      facts: [['Fragments', '21 observés'], ['Taches', 'visibles plusieurs mois']],
      obs: ['#/explorer/jupiter', 'Voir Jupiter'], wiki: 'Shoemaker-Levy 9' },

    /* ---------- astéroïdes proches de la Terre ---------- */
    { id: 'apophis', frise: [1], cat: 'geocroiseur', name: 'Apophis', des: '(99942) Apophis', kind: 'Astéroïde proche de la Terre',
      dates: [['2004-06-19', 'Découverte ; un temps, une collision en 2029 semblait possible'], ['2029-04-13', 'Passage à environ 32 000 km de la surface de la Terre, plus près que les satellites géostationnaires, visible à l\'œil nu']],
      text: "Un astéroïde de la taille de trois terrains de football qui frôlera la Terre le vendredi 13 avril 2029. Toute collision est exclue pour au moins un siècle (NASA, 2021). La sonde OSIRIS-APEX doit l'accompagner après son passage pour voir comment la gravité de la Terre l'aura modifié.",
      facts: [['Taille', '≈ 340 m'], ['Composition', 'roche et métal (type S)'], ['Risque', 'aucune collision pendant au moins 100 ans']],
      wiki: '(99942) Apophis' },
    { id: 'yr4', frise: [1], cat: 'geocroiseur', name: '2024 YR4', des: '2024 YR4', kind: 'Astéroïde proche de la Terre',
      dates: [['2024-12-27', 'Découverte par le réseau ATLAS'], ['2032-12-22', 'Passage près de la Terre et de la Lune']],
      text: "En février 2025, il a brièvement eu la plus forte probabilité de collision avec la Terre jamais calculée pour un objet de cette taille (environ 3 %), avant que de nouvelles mesures ne l'écartent. Il reste une petite chance, de l'ordre de 4 %, qu'il percute la Lune en décembre 2032.",
      facts: [['Taille', '≈ 60 m (mesure du télescope James Webb)'], ['Risque pour la Terre', 'écarté']],
      wiki: '2024 YR4' },
    { id: 'bennu', frise: [1], cat: 'geocroiseur', name: 'Bennu', des: '(101955) Bennu', kind: 'Astéroïde proche de la Terre',
      dates: [['2020-10-20', 'La sonde OSIRIS-REx prélève des échantillons à sa surface'], ['2023-09-24', 'Les échantillons arrivent sur Terre, dans le désert de l\'Utah']],
      text: "Un tas de gravats en forme de toupie, visité par la sonde OSIRIS-REx. Ses échantillons contiennent de l'eau piégée dans les minéraux et des acides aminés, des briques de la vie. Il a une très faible chance de percuter la Terre à la fin du XXIIe siècle (environ 1 sur 2 700).",
      facts: [['Taille', '≈ 490 m'], ['Composition', 'carbonée, riche en minéraux hydratés']],
      wiki: '(101955) Bennu' },
    { id: 'dimorphos', cat: 'geocroiseur', name: 'Dimorphos', des: 'lune de (65803) Didymos', kind: 'Astéroïde dévié par l\'humanité',
      dates: [['2022-09-26', 'La sonde DART de la NASA le percute volontairement']],
      text: "La première expérience de défense planétaire : en le percutant, la sonde DART a raccourci son orbite autour de l'astéroïde Didymos d'environ 32 minutes. La sonde européenne Hera doit arriver sur place pour mesurer précisément les effets du choc.",
      facts: [['Taille', '≈ 160 m'], ['Changement d\'orbite', '≈ 32 minutes']],
      wiki: 'Double Asteroid Redirection Test' },
    { id: 'tcheliabinsk', cat: 'geocroiseur', name: 'Météore de Tcheliabinsk', des: 'superbolide de 2013', kind: 'Petit astéroïde entré dans l\'atmosphère',
      dates: [['2013-02-15', 'Explosion dans le ciel de Russie, à une trentaine de kilomètres d\'altitude']],
      text: "Un astéroïde d'une vingtaine de mètres, passé inaperçu avant d'entrer dans l'atmosphère. Son explosion a brisé des vitres sur des kilomètres et blessé environ 1 500 personnes, surtout par des éclats de verre. Il a relancé la surveillance des petits astéroïdes.",
      facts: [['Taille', '≈ 20 m'], ['Énergie', '≈ 30 fois la bombe d\'Hiroshima']],
      wiki: 'Superbolide de Tcheliabinsk' },

    /* ---------- pluies d'étoiles filantes (maximum chaque année) ---------- */
    { id: 'quadrantides', cat: 'pluie', name: 'Quadrantides', yearly: '01-03', kind: 'Pluie annuelle · début janvier', text: "Une pluie intense mais brève, souvent gâchée par le froid et les nuages d'hiver. Elle vient de l'astéroïde 2003 EH1, peut-être un reste de comète.", facts: [['Maximum', 'nuit du 3 au 4 janvier'], ['Jusqu\'à', '≈ 100 par heure, pendant quelques heures'], ['Origine', 'astéroïde 2003 EH1']], wiki: 'Quadrantides' },
    { id: 'lyrides', cat: 'pluie', name: 'Lyrides', yearly: '04-22', kind: 'Pluie annuelle · avril', text: "L'une des plus anciennes pluies connues : des chroniques chinoises la décrivent il y a plus de 2 600 ans.", facts: [['Maximum', 'vers le 22 avril'], ['Jusqu\'à', '≈ 18 par heure'], ['Origine', 'comète Thatcher (C/1861 G1)']], wiki: 'Lyrides' },
    { id: 'etaaquarides', cat: 'pluie', name: 'Êta Aquarides', yearly: '05-06', kind: 'Pluie annuelle · mai', text: "Des poussières de la comète de Halley, mieux visibles depuis l'hémisphère Sud, juste avant l'aube.", facts: [['Maximum', 'vers le 6 mai'], ['Jusqu\'à', '≈ 50 par heure (hémisphère Sud)'], ['Origine', 'comète de Halley']], obs: ['#/explorer/halley', 'Voir la comète de Halley'], wiki: 'Êta Aquarides' },
    { id: 'perseides', cat: 'pluie', name: 'Perséides', yearly: '08-12', kind: 'Pluie annuelle · août', text: "Les étoiles filantes des nuits d'été, les « larmes de saint Laurent ». La plus suivie de l'année, rapide et riche en traînées brillantes.", facts: [['Maximum', 'nuit du 12 au 13 août'], ['Jusqu\'à', '≈ 100 par heure'], ['Origine', 'comète Swift-Tuttle']], wiki: 'Perséides' },
    { id: 'draconides', cat: 'pluie', name: 'Draconides', yearly: '10-08', kind: 'Pluie annuelle · octobre', text: "Une pluie généralement discrète, mais capable de vraies averses certaines années, comme en 1933 et 1946.", facts: [['Maximum', 'vers le 8 octobre'], ['Origine', 'comète 21P/Giacobini-Zinner']], wiki: 'Draconides' },
    { id: 'orionides', cat: 'pluie', name: 'Orionides', yearly: '10-21', kind: 'Pluie annuelle · octobre', text: "Le deuxième rendez-vous annuel avec les poussières de la comète de Halley : des météores très rapides, à 66 km/s.", facts: [['Maximum', 'vers le 21 octobre'], ['Jusqu\'à', '≈ 20 par heure'], ['Origine', 'comète de Halley']], obs: ['#/explorer/halley', 'Voir la comète de Halley'], wiki: 'Orionides' },
    { id: 'leonides', cat: 'pluie', name: 'Léonides', yearly: '11-17', kind: 'Pluie annuelle · novembre', text: "Modeste la plupart des années, mais célèbre pour ses tempêtes, quand la Terre traverse un nuage de poussières récent : des milliers de météores par heure en 1833, en 1966 et encore en 2001.", facts: [['Maximum', 'vers le 17 novembre'], ['Origine', 'comète 55P/Tempel-Tuttle']], wiki: 'Léonides' },
    { id: 'geminides', cat: 'pluie', name: 'Géminides', yearly: '12-14', kind: 'Pluie annuelle · décembre', text: "La plus riche de l'année, avec des météores lents et brillants. Elle a une origine inhabituelle : un astéroïde, 3200 Phaéton, et non une comète.", facts: [['Maximum', 'vers le 14 décembre'], ['Jusqu\'à', '≈ 120 à 150 par heure'], ['Origine', 'astéroïde 3200 Phaéton']], wiki: 'Géminides' }
  ];
})();

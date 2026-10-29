/* ======================================================================
   OBSERVATOIRE — surfaces des autres astres (complète surface.js)
   Coordonnées planétocentriques, longitude est (−180 à 180), d'après le Gazetteer of Planetary
   Nomenclature de l'IAU et les données de mission de la NASA. Diamètre ou étendue en km.
   ====================================================================== */
(function () {
  'use strict';
  var OBS = window.OBS = window.OBS || {};
  var SF = OBS.SURFACE = OBS.SURFACE || {};

  /* ---------------- Mars ---------------- */
  SF.mars = {
    hd: { map: 'mars-4k.jpg', relief: 'mars-relief-4k.jpg', reliefEco: 'mars-relief-2k.jpg' },
    src: { relief: 'altimétrie MOLA', aspect: 'mosaïque Viking' }, siteLabel: 'Site d\'atterrissage',
    res: 'Couleur : environ 5 km par pixel (mosaïque Viking MDIM 2.1). Relief : environ 5 km par pixel (altimètre laser MOLA de Mars Global Surveyor).',
    sites: [
      { id: 'olympus', type: 'montagne', name: 'Olympus Mons', lat: 18.65, lon: -133.8, d: 600, text: "Le plus haut volcan connu du système solaire : environ 22 km au-dessus du niveau de référence et 600 km de large, la taille de l'Arizona. Ses pentes sont si douces qu'un marcheur ne verrait pas le sommet, caché derrière l'horizon." },
      { id: 'ascraeus', type: 'montagne', name: 'Ascraeus Mons', lat: 11.92, lon: -104.08, d: 480, text: "Le plus septentrional des trois grands volcans de Tharsis alignés en diagonale, haut d'environ 18 km." },
      { id: 'pavonis', type: 'montagne', name: 'Pavonis Mons', lat: 1.48, lon: -112.96, d: 375, text: "Le volcan central de l'alignement de Tharsis, presque exactement sur l'équateur." },
      { id: 'arsia', type: 'montagne', name: 'Arsia Mons', lat: -8.26, lon: -120.09, d: 435, text: "Le plus méridional des volcans de Tharsis, avec une caldeira de plus de 100 km de large." },
      { id: 'elysium', type: 'montagne', name: 'Elysium Mons', lat: 24.8, lon: 146.9, d: 240, text: "Le principal volcan de la seconde grande région volcanique de Mars, de l'autre côté de la planète par rapport à Tharsis." },
      { id: 'valles', type: 'canyon', name: 'Valles Marineris', lat: -13.9, lon: -59.2, d: 2000, text: "Un système de canyons long d'environ 4 000 km et profond par endroits de 7 km : il traverserait les États-Unis d'une côte à l'autre. Ce n'est pas l'œuvre de l'eau mais une immense fracture de la croûte, élargie ensuite par l'érosion." },
      { id: 'hellas', type: 'bassin', name: 'Hellas Planitia', lat: -42.4, lon: 70.5, d: 2300, text: "Un des plus grands bassins d'impact du système solaire, profond d'environ 7 km : le point le plus bas de Mars. La pression y est assez élevée pour que l'eau pure puisse, brièvement, rester liquide." },
      { id: 'argyre', type: 'bassin', name: 'Argyre Planitia', lat: -49.7, lon: -44.0, d: 1800, text: "Un grand bassin d'impact de l'hémisphère sud, entouré de montagnes." },
      { id: 'utopia', type: 'mer', name: 'Utopia Planitia', lat: 46.7, lon: 117.5, d: 3300, text: "La plus grande plaine d'impact reconnue de Mars. Viking 2 et le rover chinois Zhurong s'y sont posés. Des radars y ont détecté de grandes quantités de glace d'eau sous la surface." },
      { id: 'gale', type: 'cratere', name: 'Cratère Gale', lat: -5.4, lon: 137.8, d: 154, text: "Un cratère de 154 km au centre duquel s'élève le mont Sharp, une montagne de sédiments haute de 5 km : les archives de l'histoire de l'eau sur Mars, que Curiosity remonte couche après couche." },
      { id: 'jezero', type: 'cratere', name: 'Cratère Jezero', lat: 18.38, lon: 77.58, d: 49, text: "Un ancien lac, avec le delta d'une rivière bien conservé. Perseverance y collecte des échantillons destinés à revenir un jour sur Terre." },
      { id: 'gusev', type: 'cratere', name: 'Cratère Gusev', lat: -14.5, lon: 175.4, d: 166, text: "Choisi pour Spirit parce qu'il semblait avoir abrité un lac ; le rover y a surtout trouvé des roches volcaniques, puis des traces de sources chaudes." },
      { id: 'cydonia', type: 'region', name: 'Cydonia', lat: 40.75, lon: -9.46, d: 300, text: "La région du « visage sur Mars » photographié par Viking 1 en 1976. Les images à haute résolution de Mars Global Surveyor (1998) et de HiRISE (2007) montrent une butte érodée : le visage était un jeu d'ombres et de basse résolution." },
      { id: 'calotte-n', type: 'calotte', name: 'Calotte polaire nord', lat: 87, lon: 0, d: 1000, text: "Une calotte de glace d'eau d'environ 3 km d'épaisseur, recouverte en hiver d'une couche de neige carbonique. Ses spirales sont creusées par les vents." },
      { id: 'calotte-s', type: 'calotte', name: 'Calotte polaire sud', lat: -86, lon: -45, d: 400, text: "La calotte résiduelle sud, couverte en permanence de glace carbonique ; sous elle, de grandes réserves de glace d'eau." },
      { id: 'viking1', type: 'site', name: 'Viking 1', lat: 22.27, lon: -47.95, date: '20 juillet 1976', text: "Le premier atterrisseur à fonctionner durablement sur Mars, dans Chryse Planitia : plus de six ans d'activité et les premières images en couleur de la surface." },
      { id: 'viking2', type: 'site', name: 'Viking 2', lat: 47.64, lon: 134.29, date: '3 septembre 1976', text: "Dans Utopia Planitia. Il a photographié du givre sur le sol en hiver." },
      { id: 'pathfinder', type: 'site', name: 'Mars Pathfinder', lat: 19.13, lon: -33.22, date: '4 juillet 1997', text: "Posé avec des airbags dans Ares Vallis, il a déployé Sojourner, le premier rover martien." },
      { id: 'spirit', type: 'site', name: 'Spirit', lat: -14.568, lon: 175.473, date: '4 janvier 2004', text: "Rover prévu pour 90 jours, actif plus de six ans dans le cratère Gusev." },
      { id: 'opportunity', type: 'site', name: 'Opportunity', lat: -1.946, lon: -5.527, date: '25 janvier 2004', text: "Rover prévu pour 90 jours, actif près de 15 ans et 45 km parcourus à Meridiani Planum. Il a trouvé les « myrtilles », de petites billes d'hématite formées dans l'eau." },
      { id: 'phoenix', type: 'site', name: 'Phoenix', lat: 68.22, lon: -125.75, date: '25 mai 2008', text: "Posé dans les plaines arctiques, il a creusé le sol et vu de la glace d'eau se sublimer en quelques jours." },
      { id: 'curiosity', type: 'site', name: 'Curiosity', lat: -4.590, lon: 137.442, date: '6 août 2012', text: "Descendu par une « grue volante » dans le cratère Gale. Il a établi que le lac de Gale aurait pu abriter une vie microbienne." },
      { id: 'insight', type: 'site', name: 'InSight', lat: 4.502, lon: 135.623, date: '26 novembre 2018', text: "Un sismomètre posé dans Elysium Planitia : plus de 1 300 séismes martiens enregistrés et la première mesure du noyau de Mars." },
      { id: 'perseverance', type: 'site', name: 'Perseverance', lat: 18.445, lon: 77.451, date: '18 février 2021', text: "Dans le cratère Jezero, avec l'hélicoptère Ingenuity, premier engin motorisé à voler sur un autre monde (72 vols)." },
      { id: 'zhurong', type: 'site', name: 'Zhurong', lat: 25.066, lon: 109.925, date: '15 mai 2021', text: "Le premier rover chinois sur Mars, dans Utopia Planitia." }
    ],
    geologie: [
      ['Deux hémisphères', "Le sud est un vieux plateau couvert de cratères ; le nord, plus bas de plusieurs kilomètres, est fait de plaines plus jeunes et plus lisses. L'origine de cette dichotomie reste débattue."],
      ['Volcans', "Le dôme de Tharsis porte les plus grands volcans du système solaire. Sans tectonique des plaques, la croûte est restée au-dessus des mêmes points chauds, et les volcans ont grandi pendant des centaines de millions d'années."],
      ['Eau', "Des vallées de rivières, des deltas et des minéraux formés dans l'eau montrent que de l'eau liquide a coulé en surface il y a plus de 3 milliards d'années. Aujourd'hui, elle est surtout gelée, aux pôles et sous le sol."],
      ['Couleur', "Le rouge vient de l'oxyde de fer, de la rouille, dans une poussière très fine que les tempêtes soulèvent parfois sur toute la planète."],
      ['Atmosphère', "Gaz carbonique à 95 %, avec une pression moyenne inférieure à 1 % de celle de la Terre. Mars a perdu l'essentiel de son atmosphère en même temps que son champ magnétique global."]
    ],
    ressources: [
      ['Glace d\'eau', "Aux pôles et sous la surface jusqu'aux latitudes moyennes, parfois à moins d'un mètre de profondeur : de quoi boire, respirer et fabriquer du carburant."],
      ['Oxygène', "L'expérience MOXIE de Perseverance a produit 122 g d'oxygène à partir du gaz carbonique de l'air martien entre 2021 et 2023 : la preuve que le principe fonctionne."],
      ['Sol', "Riche en fer, mais aussi en perchlorates, des sels toxiques qu'il faudrait éliminer avant toute culture."]
    ]
  };

  /* ---------------- Mercure ---------------- */
  SF.mercure = {
    hd: { map: 'mercure-4k.jpg' },
    src: { aspect: 'mosaïque MESSENGER' }, siteLabel: 'Site d\'impact',
    res: 'Couleur : environ 2,7 km par pixel (mosaïque MESSENGER, couleurs ramenées vers le naturel). Relief non disponible pour l\'instant.',
    sites: [
      { id: 'caloris', type: 'bassin', name: 'Caloris Planitia', lat: 31.5, lon: 162.7, d: 1550, text: "Le plus grand bassin d'impact de Mercure. Le choc a été si violent qu'il a chamboulé le terrain exactement à l'opposé de la planète, un « terrain chaotique »." },
      { id: 'rembrandt', type: 'bassin', name: 'Rembrandt', lat: -32.9, lon: 87.9, d: 716, text: "Un grand bassin d'impact découvert par MESSENGER en 2008, marqué par des fractures en rayons." },
      { id: 'beethoven', type: 'bassin', name: 'Beethoven', lat: -20.8, lon: -123.6, d: 643, text: "Un des plus grands bassins d'impact de Mercure. Sur Mercure, les cratères portent des noms d'artistes, d'écrivains et de musiciens." },
      { id: 'rachmaninoff', type: 'cratere', name: 'Rachmaninoff', lat: -27.6, lon: 57.6, d: 290, text: "Un bassin à double anneau dont le fond lisse a été rempli par des laves parmi les plus jeunes de Mercure." },
      { id: 'hokusai', type: 'cratere', name: 'Hokusai', lat: 57.7, lon: 16.8, d: 114, text: "Un cratère jeune dont les rayons clairs s'étendent sur plus de 1 000 km." },
      { id: 'kuiper', type: 'cratere', name: 'Kuiper', lat: -11.3, lon: -31.5, d: 62, text: "Un cratère jeune et brillant, entouré de rayons, nommé d'après Gerard Kuiper, membre de l'équipe de Mariner 10." },
      { id: 'chaomengfu', type: 'cratere', name: 'Chao Meng-Fu', lat: -87.3, lon: -134.0, d: 167, text: "Un cratère du pôle Sud dont le fond n'est jamais éclairé : sur la planète la plus proche du Soleil, il abrite probablement de la glace d'eau." },
      { id: 'messenger', type: 'site', name: 'Impact de MESSENGER', lat: 54.44, lon: -149.88, date: '30 avril 2015', text: "À court de carburant, la sonde MESSENGER s'est écrasée volontairement à près de 14 000 km/h après quatre ans en orbite, laissant un cratère d'une quinzaine de mètres." }
    ],
    geologie: [
      ['Noyau géant', "Le noyau de fer occupe environ 85 % du rayon de la planète. Mercure a peut-être perdu une partie de son manteau lors d'un impact géant."],
      ['Escarpements', "En refroidissant, la planète s'est contractée de plusieurs kilomètres : sa surface s'est plissée en falaises (escarpements lobés) hautes parfois de plus de 1 km."],
      ['Creux', "Des dépressions claires et peu profondes, appelées « hollows », propres à Mercure, se forment encore aujourd'hui quand des matériaux volatils s'échappent de la roche."],
      ['Champ magnétique', "Faible mais réel : avec la Terre, Mercure est la seule planète rocheuse dotée d'un champ magnétique global actif."]
    ],
    ressources: [
      ['Glace d\'eau', "Détectée par MESSENGER au fond des cratères polaires jamais éclairés, malgré la proximité du Soleil."]
    ]
  };

  /* ---------------- Terre : uniquement les points clés ---------------- */
  SF.terre = {
    src: { aspect: 'Blue Marble (NASA)' }, siteLabel: 'Événement',
    res: 'Carte de la Terre en 2k. Pour explorer la Terre en détail, les services de cartographie en ligne font bien mieux : ici, seuls quelques points liés à l\'astronomie et à l\'espace sont repérés.',
    sites: [
      { id: 'everest', type: 'extreme', name: 'Everest', lat: 27.988, lon: 86.925, d: 0, text: "Le point le plus haut au-dessus du niveau de la mer : 8 849 m. Mesuré depuis le centre de la Terre, c'est pourtant le Chimborazo, en Équateur, qui est le plus éloigné, à cause du renflement équatorial." },
      { id: 'challenger', type: 'extreme', name: 'Fosse des Mariannes', lat: 11.35, lon: 142.2, d: 0, text: "Le Challenger Deep, point le plus profond des océans, à près de 11 000 m sous la surface." },
      { id: 'chicxulub', type: 'cratere', name: 'Chicxulub', lat: 21.4, lon: -89.5, d: 180, text: "Le cratère de l'impact qui a mis fin au règne des dinosaures il y a 66 millions d'années, enfoui sous la péninsule du Yucatán." },
      { id: 'vredefort', type: 'cratere', name: 'Vredefort', lat: -27.0, lon: 27.5, d: 300, text: "La plus grande structure d'impact connue sur Terre, vieille d'environ 2 milliards d'années, en Afrique du Sud." },
      { id: 'meteorcrater', type: 'cratere', name: 'Meteor Crater', lat: 35.027, lon: -111.022, d: 1.2, text: "Un cratère de 1,2 km creusé il y a environ 50 000 ans en Arizona. Le premier cratère reconnu comme causé par un impact." },
      { id: 'tunguska', type: 'site', name: 'Toungouska', lat: 60.886, lon: 101.894, date: '30 juin 1908', text: "L'explosion d'une météorite au-dessus de la Sibérie a couché environ 80 millions d'arbres sur plus de 2 000 km², sans laisser de cratère." },
      { id: 'kourou', type: 'base', name: 'Kourou', lat: 5.236, lon: -52.769, text: "Le Centre spatial guyanais, d'où partent les fusées européennes. Proche de l'équateur, il profite au mieux de la vitesse de rotation de la Terre." },
      { id: 'canaveral', type: 'base', name: 'Cap Canaveral', lat: 28.49, lon: -80.58, text: "D'ici et du centre spatial Kennedy voisin sont parties les missions Apollo vers la Lune, et partent aujourd'hui celles d'Artemis." },
      { id: 'baikonour', type: 'base', name: 'Baïkonour', lat: 45.965, lon: 63.305, text: "Le cosmodrome d'où sont partis Spoutnik (1957) et Youri Gagarine (1961), le premier humain dans l'espace." },
      { id: 'maunakea', type: 'observatoire', name: 'Mauna Kea', lat: 19.82, lon: -155.47, text: "Au sommet d'un volcan d'Hawaï, à 4 200 m, une douzaine de grands télescopes profitent d'un ciel parmi les plus purs du monde." },
      { id: 'paranal', type: 'observatoire', name: 'Paranal', lat: -24.627, lon: -70.404, text: "Le Very Large Telescope de l'ESO, dans le désert d'Atacama ; l'Extremely Large Telescope (39 m) se construit tout près, sur le Cerro Armazones." },
      { id: 'alma', type: 'observatoire', name: 'ALMA', lat: -23.029, lon: -67.755, text: "66 antennes radio sur le plateau de Chajnantor, à 5 000 m d'altitude, qui observent la naissance des étoiles et des planètes." },
      { id: 'fast', type: 'observatoire', name: 'FAST', lat: 25.653, lon: 106.857, text: "Le plus grand radiotélescope à antenne unique du monde : 500 m de diamètre, installé dans une cuvette naturelle du Guizhou, en Chine." },
      { id: 'picdumidi', type: 'observatoire', name: 'Pic du Midi', lat: 42.936, lon: 0.142, text: "L'observatoire des Pyrénées, à 2 877 m. Ses images de la Lune ont servi à préparer les missions Apollo." }
    ],
    lien: 'La Terre vue de l\'espace',
    terre: "Environ 190 cratères d'impact sont confirmés sur Terre ; l'érosion, les océans et la tectonique des plaques ont effacé presque tous les autres, que la Lune, elle, a gardés."
  };

  /* ---------------- Lunes de Jupiter ---------------- */
  SF.io = {
    src: { aspect: 'mosaïque Galileo et Voyager' }, siteLabel: 'Site', parentWord: 'Jupiter',
    res: 'Mosaïque USGS de Galileo et Voyager, environ 1 km par pixel à l\'origine, affichée en 2k (≈ 5,6 km par pixel).',
    sites: [
      { id: 'loki', type: 'volcan', name: 'Loki Patera', lat: 13, lon: 51, d: 200, text: "Le volcan le plus puissant d'Io : un lac de lave de 200 km de large dont la croûte se renouvelle par vagues, environ tous les 500 jours." },
      { id: 'pele', type: 'volcan', name: 'Pélé', lat: -18.7, lon: 104.7, d: 1200, text: "Son panache de soufre monte à environ 300 km et retombe en un anneau rouge de 1 200 km de diamètre, bien visible sur la carte." },
      { id: 'prometheus', type: 'volcan', name: 'Prométhée', lat: -1.6, lon: -153, d: 100, text: "Un panache observé par Voyager en 1979 puis par Galileo vingt ans plus tard : le « vieux fidèle » d'Io." },
      { id: 'tvashtar', type: 'volcan', name: 'Tvashtar Paterae', lat: 62.8, lon: -122.8, d: 300, text: "Ses rideaux de lave en fusion ont été photographiés par Galileo en 1999, et son panache par New Horizons en 2007." }
    ],
    geologie: [
      ['Volcanisme', "Le monde le plus volcanique connu : plus de 400 volcans actifs. Io est sans cesse étirée par les marées de Jupiter, entretenues par sa résonance avec Europe et Ganymède : pendant qu'Io fait quatre tours, Europe en fait deux et Ganymède un."],
      ['Couleurs', "Jaunes, rouges, blancs et noirs : du soufre et du dioxyde de soufre sous diverses formes, autour de laves de silicates très chaudes."],
      ['Surface neuve', "Aucun cratère d'impact n'a été repéré : les éruptions recouvrent la surface plus vite que les météorites ne la marquent."],
      ['Montagnes', "Des montagnes isolées, sans lien avec les volcans, atteignent 17 km (Boösaule Montes), plus que l'Everest."]
    ]
  };
  SF.europe = {
    src: { aspect: 'mosaïque Galileo et Voyager' }, siteLabel: 'Site',
    res: 'Mosaïque USGS en noir et blanc (Galileo et Voyager, 500 m par pixel à l\'origine), légèrement teintée, affichée en 2k. Le sud non photographié est gris.',
    sites: [
      { id: 'pwyll', type: 'cratere', name: 'Pwyll', lat: -25.2, lon: 88.6, d: 45, text: "Un des rares cratères d'Europe, si jeune que ses rayons clairs s'étendent sur plus de 1 000 km." },
      { id: 'conamara', type: 'region', name: 'Conamara Chaos', lat: 9.7, lon: 86.7, d: 100, text: "Un « terrain chaotique » de radeaux de glace disloqués puis regelés, signe d'une glace mince ou d'eau proche de la surface." },
      { id: 'tyr', type: 'cratere', name: 'Tyr', lat: 34, lon: -146.6, d: 40, text: "Un impact entouré d'anneaux concentriques : la glace a réagi comme si elle reposait sur une couche molle ou liquide." }
    ],
    geologie: [
      ['Océan caché', "Sous une coquille de glace de quelques kilomètres à quelques dizaines de kilomètres d'épaisseur, un océan d'eau salée profond de près de 100 km : environ deux fois plus d'eau que tous les océans terrestres."],
      ['Surface jeune', "Très peu de cratères : la surface n'aurait que 40 à 90 millions d'années, renouvelée par les mouvements de la glace."],
      ['Lignes', "Les longues rayures brunes (lineae) sont des fractures de la glace, colorées par des sels et des matériaux venus d'en dessous. Du chlorure de sodium, le sel de cuisine, y a été identifié."],
      ['Habitabilité', "Eau liquide, sels, énergie des marées : Europe est l'une des meilleures cibles pour chercher la vie. Europa Clipper doit l'étudier à partir de 2030."]
    ]
  };
  SF.ganymede = {
    src: { aspect: 'mosaïque Galileo et Voyager' }, siteLabel: 'Site',
    res: 'Mosaïque USGS en couleurs (Galileo et Voyager, 1,4 km par pixel à l\'origine), affichée en 2k. Les zones polaires non photographiées sont grises.',
    sites: [
      { id: 'galileo-regio', type: 'region', name: 'Galileo Regio', lat: 35, lon: -145, d: 3200, text: "La plus grande région sombre de Ganymède : un terrain très ancien, couvert de cratères et de sillons courbes." },
      { id: 'osiris', type: 'cratere', name: 'Osiris', lat: -38, lon: -166, d: 107, text: "Un cratère jeune aux rayons clairs éclatants." },
      { id: 'tros', type: 'cratere', name: 'Tros', lat: 11, lon: -27, d: 94, text: "Un cratère brillant entouré de rayons de glace propre." }
    ],
    geologie: [
      ['La plus grande lune', "5 268 km de diamètre : plus grande que Mercure, mais deux fois moins massive, car faite en bonne partie de glace."],
      ['Champ magnétique', "La seule lune connue à produire son propre champ magnétique ; il crée des aurores au-dessus de ses pôles."],
      ['Océan', "L'oscillation de ses aurores, observée par Hubble en 2015, trahit un océan salé enfoui sous environ 150 km de glace."],
      ['Deux terrains', "Des régions sombres et anciennes, et des bandes claires sillonnées (sulci), plus jeunes, où la glace a été étirée et fracturée."]
    ]
  };
  SF.callisto = {
    src: { aspect: 'mosaïque Galileo et Voyager' }, siteLabel: 'Site',
    res: 'Mosaïque USGS en noir et blanc (Galileo et Voyager, 1 km par pixel à l\'origine), légèrement teintée, affichée en 2k. Le sud non photographié est gris.',
    sites: [
      { id: 'valhalla', type: 'bassin', name: 'Valhalla', lat: 14.7, lon: -56, d: 3800, text: "Le plus grand bassin d'impact à anneaux multiples du système solaire : une région centrale claire de 600 km, entourée d'anneaux sur 3 800 km." },
      { id: 'asgard', type: 'bassin', name: 'Asgard', lat: 32, lon: -140, d: 1600, text: "Un second grand bassin à anneaux, plus petit et plus ancien que Valhalla." }
    ],
    geologie: [
      ['Saturée de cratères', "La surface la plus cratérisée du système solaire, presque inchangée depuis 4 milliards d'années : aucun volcanisme ni tectonique ne l'a renouvelée."],
      ['Océan possible', "Les mesures magnétiques de Galileo suggèrent un océan salé en profondeur, sous une épaisse couche de glace."],
      ['Une base ?', "Loin des ceintures de radiations de Jupiter, Callisto a été étudiée par la NASA (étude HOPE, 2003) comme site possible d'une base humaine pour explorer le système jovien."]
    ]
  };

  /* ---------------- Lunes de Saturne ---------------- */
  SF.titan = {
    src: { aspect: 'mosaïque Cassini (infrarouge)' }, siteLabel: 'Site d\'atterrissage',
    res: 'Mosaïque Cassini en infrarouge proche (938 nm) : on voit le sol à travers la brume orangée, invisible ici. Teinte uniforme ajoutée, affichée en 2k.',
    sites: [
      { id: 'xanadu', type: 'region', name: 'Xanadu', lat: -10, lon: -100, d: 4000, text: "Une région claire et accidentée de la taille de l'Australie, la première structure de surface repérée sur Titan, par Hubble en 1994." },
      { id: 'shangrila', type: 'region', name: 'Shangri-La', lat: -10, lon: 165, d: 3000, text: "Une immense région sombre couverte de dunes de grains organiques, longues de centaines de kilomètres." },
      { id: 'kraken', type: 'lac', name: 'Kraken Mare', lat: 68, lon: 50, d: 1170, text: "La plus grande mer de Titan, faite de méthane et d'éthane liquides : plus vaste que la mer Caspienne." },
      { id: 'ligeia', type: 'lac', name: 'Ligeia Mare', lat: 79, lon: 112, d: 500, text: "Une mer de méthane presque pur, profonde de plus de 160 m d'après les échos radar de Cassini." },
      { id: 'huygens', type: 'site', name: 'Huygens', lat: -10.25, lon: 167.68, date: '14 janvier 2005', text: "L'atterrissage le plus lointain jamais réalisé : la sonde européenne s'est posée sur un sol humide, parsemé de galets de glace arrondis par des écoulements." },
      { id: 'selk', type: 'cratere', name: 'Selk', lat: 7, lon: 161, d: 90, text: "La destination de Dragonfly (NASA), un drone à rotors qui doit y arriver vers 2034 pour étudier une chimie organique où l'eau a pu se mêler aux matières organiques." }
    ],
    geologie: [
      ['Atmosphère', "Azote à 95 %, avec une pression au sol 1,5 fois celle de la Terre. Une brume orangée de molécules organiques cache entièrement la surface en lumière visible."],
      ['Cycle du méthane', "Il pleut du méthane, qui creuse des rivières et remplit des lacs et des mers près des pôles : le seul autre monde connu avec des liquides stables en surface."],
      ['Dunes', "Les régions équatoriales sombres sont couvertes de dunes géantes, faites de grains organiques plutôt que de sable."],
      ['Océan', "Sous la croûte de glace, un océan d'eau liquide est très probable, d'après la façon dont Titan se déforme sous les marées de Saturne."]
    ]
  };
  SF.encelade = {
    src: { aspect: 'mosaïque Cassini' }, siteLabel: 'Site',
    res: 'Mosaïque de Cassini et Voyager (Paul Schenk, LPI), couleurs atténuées, affichée en 2k.',
    sites: [
      { id: 'tigre', type: 'region', name: 'Rayures de tigre', lat: -82, lon: 0, d: 500, text: "Quatre fractures parallèles près du pôle Sud, longues de 130 km, d'où jaillissent des geysers de vapeur et de grains de glace jusqu'à des centaines de kilomètres." }
    ],
    geologie: [
      ['Geysers', "Plus d'une centaine de jets alimentent l'anneau E de Saturne. Cassini les a traversés et en a analysé le contenu."],
      ['Océan', "Un océan global d'eau salée sous la glace, en contact avec un fond rocheux."],
      ['Ingrédients de la vie', "Sels, molécules organiques, hydrogène, grains de silice signe de sources chaudes, et phosphates (2023) : tous les éléments nécessaires à la vie telle qu'on la connaît sont réunis."],
      ['Blancheur', "La surface la plus réfléchissante du système solaire : environ 80 % de la lumière reçue est renvoyée."]
    ]
  };

  /* ---------------- Pluton, Charon, Cérès ---------------- */
  SF.pluton = {
    src: { aspect: 'carte New Horizons' }, siteLabel: 'Site',
    res: 'Carte en couleurs de New Horizons, affichée en 2k. New Horizons n\'a vu de près qu\'un hémisphère : les zones grises n\'ont pas été photographiées.',
    sites: [
      { id: 'spoutnik', type: 'mer', name: 'Spoutnik Planitia', lat: 20, lon: 180, d: 1000, text: "Le lobe gauche du « cœur » de Pluton : un glacier d'azote d'environ 1 000 km, sans aucun cratère, découpé en cellules par la lente convection de la glace." },
      { id: 'wright', type: 'montagne', name: 'Wright Mons', lat: -21.6, lon: 173, d: 150, text: "Un probable cryovolcan, haut de 4 km et large de 150 km, avec une vaste dépression au sommet." }
    ],
    geologie: [
      ['Un monde actif', "Glaciers d'azote, montagnes de glace d'eau hautes de plusieurs kilomètres, cryovolcans : New Horizons a révélé en 2015 une géologie bien plus jeune et active qu'attendu."],
      ['Atmosphère', "Fine, faite d'azote, avec des couches de brume bleue. Elle gèle et retombe en partie quand Pluton s'éloigne du Soleil."],
      ['Océan possible', "La position de Spoutnik Planitia, alignée avec Charon, suggère un océan sous la glace."]
    ]
  };
  SF.charon = {
    src: { aspect: 'mosaïque New Horizons' }, siteLabel: 'Site',
    res: 'Mosaïque USGS en noir et blanc de New Horizons, affichée en 2k. Le sud non photographié est gris.',
    sites: [
      { id: 'mordor', type: 'region', name: 'Mordor Macula', lat: 85, lon: 0, d: 475, text: "La calotte rougeâtre du pôle Nord : du méthane échappé de Pluton, piégé dans le froid polaire et transformé par la lumière en composés organiques rouges (tholins)." }
    ],
    geologie: [
      ['Fractures', "Une ceinture de canyons, dont Serenity Chasma, plus de quatre fois plus long que le Grand Canyon, laisse penser qu'un ancien océan a gelé et fait éclater la croûte."]
    ]
  };
  SF.ceres = {
    src: { aspect: 'mosaïque Dawn' }, siteLabel: 'Site',
    res: 'Mosaïque USGS en noir et blanc de la sonde Dawn (400 m par pixel à l\'origine), affichée en 2k.',
    sites: [
      { id: 'occator', type: 'cratere', name: 'Occator', lat: 19.82, lon: -120.67, d: 92, text: "Ses taches brillantes, Cerealia et Vinalia Faculae, sont des dépôts de carbonate de sodium laissés par une saumure remontée des profondeurs." },
      { id: 'ahuna', type: 'montagne', name: 'Ahuna Mons', lat: -10.48, lon: -43.8, d: 17, text: "Une montagne isolée haute d'environ 4 km : un cryovolcan qui a craché de la boue salée plutôt que de la lave." },
      { id: 'kerwan', type: 'bassin', name: 'Kerwan', lat: -10.8, lon: 124.0, d: 280, text: "Le plus grand cratère de Cérès, très érodé." }
    ],
    geologie: [
      ['Un monde de glace et de sel', "Un mélange de roches, de glace et d'argiles riches en ammoniac, peut-être formé plus loin du Soleil avant de migrer dans la ceinture d'astéroïdes."],
      ['Saumure', "Des poches de saumure subsistent probablement sous la surface : Cérès est un des rares mondes « océans » de petite taille."]
    ]
  };

  /* ---------------- Planètes sans surface solide visible : structure ---------------- */
  SF.venus = {
    geoTitle: 'Sous les nuages',
    geologie: [
      ['Surface', "Cartographiée au radar par Magellan : de vastes plaines volcaniques, plus de 1 600 grands volcans et des structures uniques (coronae, « crêpes » de lave). La surface aurait été en grande partie renouvelée il y a quelques centaines de millions d'années."],
      ['Volcanisme actif', "En 2023, des images radar de Magellan réanalysées ont montré un évent volcanique qui avait changé de forme en huit mois : Vénus est probablement encore active."],
      ['Nuages', "Une couche d'acide sulfurique entre 45 et 70 km d'altitude, qui fait le tour de la planète en quatre jours alors que le sol tourne en 243."],
      ['Enfer de serre', "Pression au sol 92 fois celle de la Terre, environ 465 °C : les sondes Venera n'y ont survécu que de quelques dizaines de minutes à deux heures."]
    ]
  };
  SF.jupiter = { geoTitle: 'Structure', geologie: [
    ['Nuages', "Les bandes claires (zones) et sombres (ceintures) sont des courants d'est et d'ouest, avec des nuages d'ammoniac, d'hydrosulfure d'ammonium et d'eau à différentes altitudes."],
    ['Grande Tache rouge', "Un anticyclone plus grand que la Terre, observé depuis au moins 1830, qui rétrécit depuis un siècle. Sa longitude dérive : sa position n'est pas représentée ici."],
    ['Intérieur', "Sous les nuages, l'hydrogène devient liquide puis métallique sous la pression ; Juno a montré un cœur « dilué », mêlé à l'enveloppe plutôt que net."]] };
  SF.saturne = { geoTitle: 'Structure', geologie: [
    ['Hexagone', "Au pôle Nord, un courant-jet dessine un hexagone large d'environ 29 000 km, stable depuis sa découverte par Voyager en 1981."],
    ['Anneaux', "Des milliards de morceaux de glace presque pure, de la taille de grains à celle de maisons, sur une épaisseur de 10 m à 1 km. Ils pourraient être relativement jeunes, quelques centaines de millions d'années."],
    ['Densité', "Inférieure à celle de l'eau : 0,69 g/cm³."]] };
  SF.uranus = { geoTitle: 'Structure', geologie: [
    ['Géante de glace', "Sous une atmosphère d'hydrogène, d'hélium et de méthane, un manteau épais d'eau, d'ammoniac et de méthane à haute pression, chaud et fluide."],
    ['Couchée', "Son axe incliné de 98° vient peut-être d'un impact géant dans sa jeunesse."]] };
  SF.neptune = { geoTitle: 'Structure', geologie: [
    ['Vents', "Les plus rapides du système solaire, au-delà de 2 000 km/h, sur une planète qui reçoit pourtant 900 fois moins de lumière que la Terre."],
    ['Chaleur interne', "Neptune rayonne environ 2,6 fois plus d'énergie qu'elle n'en reçoit du Soleil."]] };

  OBS.SITE_TYPES = { mer: 'Mer ou plaine', bassin: 'Bassin d\'impact', cratere: 'Cratère', site: 'Site d\'atterrissage', extreme: 'Point remarquable',
    montagne: 'Volcan ou montagne', volcan: 'Volcan actif', canyon: 'Canyon', region: 'Région', lac: 'Lac ou mer', calotte: 'Calotte polaire',
    base: 'Base de lancement', observatoire: 'Observatoire' };
})();

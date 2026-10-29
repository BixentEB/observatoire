/* ======================================================================
   OBSERVATOIRE — surfaces détaillées
   Pour chaque astre doté de données de surface :
     hd       cartes chargées à l'approche (couleur haute définition, relief en carte de normales)
     res      résolution des données, affichée pour rester honnête sur le flou de près
     sites    lieux remarquables : coordonnées planétocentriques (latitude, longitude est),
              diamètre en km, selon le Gazetteer of Planetary Nomenclature de l'IAU et la NASA
     geologie, ressources, terre : blocs de la console
   Types de lieux : mer, cratere, bassin, site (alunissage), extreme (point le plus haut ou le plus bas)
   ====================================================================== */
(function () {
  'use strict';
  var OBS = window.OBS = window.OBS || {};
  OBS.SURFACE = {
    lune: {
      hd: { map: 'lune-4k.jpg', relief: 'lune-relief-4k.jpg', reliefEco: 'lune-relief-2k.jpg', altitude: 'lune-altitude' },
      res: 'Couleur : environ 2,7 km par pixel (mosaïque LROC). Relief : environ 1,9 km par pixel (altimètre laser LOLA).',
      sites: [
        /* mers et bassins */
        { id: 'tranquillite', type: 'mer', name: 'Mer de la Tranquillité', lat: 8.35, lon: 30.83, d: 873, text: "Une plaine de basalte sombre, née de coulées de lave il y a environ 3,6 milliards d'années. Apollo 11 s'est posé sur sa bordure sud-ouest." },
        { id: 'serenite', type: 'mer', name: 'Mer de la Sérénité', lat: 28.0, lon: 17.5, d: 674, text: "Une mer circulaire qui remplit un ancien bassin d'impact. Apollo 17 s'est posé sur sa bordure est, dans la vallée de Taurus-Littrow." },
        { id: 'pluies', type: 'mer', name: 'Mer des Pluies', lat: 32.8, lon: -15.6, d: 1146, text: "Mare Imbrium : un des plus grands bassins d'impact de la face visible, creusé il y a environ 3,9 milliards d'années puis noyé de lave. Les montagnes qui l'entourent sont les bords soulevés du cratère." },
        { id: 'tempetes', type: 'mer', name: 'Océan des Tempêtes', lat: 18.4, lon: -57.4, d: 2568, text: "La plus vaste étendue de basalte de la Lune. La région est riche en roches KREEP (potassium, terres rares, phosphore) et a connu le volcanisme le plus tardif, jusqu'à il y a environ 1 à 2 milliards d'années." },
        { id: 'crises', type: 'mer', name: 'Mer des Crises', lat: 17.0, lon: 59.1, d: 556, text: "Une mer isolée, bien visible à l'œil nu près du bord est de la Lune. La sonde soviétique Luna 24 y a prélevé des échantillons en 1976." },
        { id: 'nuees', type: 'mer', name: 'Mer des Nuées', lat: -21.3, lon: -16.6, d: 715, text: "Une mer aux bords irréguliers, au sud de la face visible, où s'étend la faille rectiligne Rupes Recta, longue d'une centaine de kilomètres." },
        { id: 'orientale', type: 'bassin', name: 'Bassin Oriental', lat: -19.9, lon: -94.7, d: 930, text: "Le bassin d'impact le mieux conservé de la Lune, avec trois anneaux de montagnes concentriques. Il se trouve au bord ouest : on ne le voit que de profil depuis la Terre." },
        { id: 'moscovie', type: 'mer', name: 'Mer de Moscovie', lat: 27.3, lon: 147.9, d: 277, text: "Une des rares mers de la face cachée, où la croûte est plus épaisse et où la lave a moins souvent atteint la surface. Elle a été découverte sur les premières photos de la face cachée, prises par Luna 3 en 1959." },
        { id: 'aitken', type: 'bassin', name: 'Bassin Pôle Sud–Aitken', lat: -53, lon: -169, d: 2500, text: "La plus grande et la plus ancienne structure d'impact connue sur la Lune : environ 2 500 km de diamètre et jusqu'à 8 km de profondeur. L'impact a peut-être exposé des roches du manteau, ce qui en fait une cible scientifique majeure." },
        /* cratères */
        { id: 'tycho', type: 'cratere', name: 'Tycho', lat: -43.31, lon: -11.36, d: 86, text: "Un cratère jeune, d'environ 108 millions d'années, profond de 4,8 km. Ses rayons d'éjecta clairs s'étendent sur plus de 1 500 km et se voient à la jumelle à la pleine Lune. Surveyor 7 s'est posé près de son rebord en 1968." },
        { id: 'copernic', type: 'cratere', name: 'Copernic', lat: 9.62, lon: -20.08, d: 96, text: "Un cratère d'environ 800 millions d'années, aux parois en terrasses et aux pics centraux, entouré d'un vaste système de rayons. On l'a surnommé « le monarque de la Lune »." },
        { id: 'kepler', type: 'cratere', name: 'Kepler', lat: 8.12, lon: -38.0, d: 29, text: "Un petit cratère jeune au milieu de l'océan des Tempêtes, entouré de rayons clairs." },
        { id: 'aristarque', type: 'cratere', name: 'Aristarque', lat: 23.73, lon: -47.49, d: 40, text: "La formation la plus brillante de la face visible, si claire qu'elle se repère même sur la partie de la Lune éclairée par la Terre. Il est voisin de la vallée sinueuse de Schröter." },
        { id: 'platon', type: 'cratere', name: 'Platon', lat: 51.62, lon: -9.38, d: 101, text: "Un cratère au fond plat et très sombre, noyé de lave, sur la rive nord de la mer des Pluies." },
        { id: 'clavius', type: 'cratere', name: 'Clavius', lat: -58.62, lon: -14.73, d: 231, text: "Un des plus grands cratères de la face visible, avec un arc de petits cratères sur son fond. En 2020, l'observatoire aéroporté SOFIA y a détecté des molécules d'eau, même à la surface éclairée." },
        { id: 'ptolemee', type: 'cratere', name: 'Ptolémée', lat: -9.16, lon: -1.84, d: 153, text: "Un vieux cratère au fond plat, près du centre de la face visible." },
        { id: 'theophile', type: 'cratere', name: 'Théophile', lat: -11.45, lon: 26.28, d: 99, text: "Un cratère profond aux pics centraux massifs, en bordure de la mer du Nectar." },
        { id: 'grimaldi', type: 'cratere', name: 'Grimaldi', lat: -5.2, lon: -68.6, d: 173, text: "Le fond le plus sombre de la face visible, près du bord ouest." },
        { id: 'tsiolkovski', type: 'cratere', name: 'Tsiolkovski', lat: -21.2, lon: 128.97, d: 185, text: "Sur la face cachée, un cratère au fond de lave sombre et au pic central brillant, un contraste rare de ce côté de la Lune." },
        { id: 'shackleton', type: 'cratere', name: 'Shackleton', lat: -89.67, lon: 129.78, d: 21, text: "Un cratère presque exactement au pôle Sud. Son intérieur ne voit jamais le Soleil et pourrait contenir de la glace d'eau, tandis que certains points de son rebord sont éclairés presque en permanence. C'est une des régions visées par Artemis." },
        /* extrêmes */
        { id: 'sommet', type: 'extreme', name: 'Point le plus haut', lat: 5.41, lon: -158.63, d: 0, text: "Environ 10,8 km au-dessus de la sphère de référence (1 737,4 km de rayon), sur la face cachée, en bordure du bassin Pôle Sud–Aitken. Mesuré par l'altimètre laser LOLA en 2010." },
        { id: 'antoniadi', type: 'extreme', name: 'Point le plus bas', lat: -69.7, lon: -172.0, d: 0, text: "Environ 9 km sous la sphère de référence, au fond du cratère Antoniadi, dans le bassin Pôle Sud–Aitken. Près de 20 km séparent ce point du sommet, à peu près la distance entre le haut de l'Everest et le fond de la fosse des Mariannes." },
        /* sites d'alunissage */
        { id: 'luna9', type: 'site', name: 'Luna 9', lat: 7.08, lon: -64.37, date: '3 février 1966', text: "Le premier atterrissage en douceur sur un autre monde, et les premières photos prises depuis la surface de la Lune." },
        { id: 'lunokhod1', type: 'site', name: 'Lunokhod 1', lat: 38.24, lon: -35.0, date: '17 novembre 1970', text: "Le premier véhicule téléguidé sur un autre monde. Il a parcouru plus de 10 km en dix mois. Son réflecteur laser sert encore aux mesures de distance Terre-Lune." },
        { id: 'apollo11', type: 'site', name: 'Apollo 11', lat: 0.674, lon: 23.473, date: '20 juillet 1969', text: "La base de la Tranquillité : Neil Armstrong et Buzz Aldrin y ont été les premiers humains à marcher sur la Lune, pendant 2 h 31. Ils ont rapporté 21,5 kg de roches." },
        { id: 'apollo12', type: 'site', name: 'Apollo 12', lat: -3.012, lon: -23.422, date: '19 novembre 1969', text: "Un atterrissage de précision à moins de 200 m de la sonde Surveyor 3, posée deux ans plus tôt, dont les astronautes ont rapporté des pièces." },
        { id: 'apollo14', type: 'site', name: 'Apollo 14', lat: -3.645, lon: -17.471, date: '5 février 1971', text: "La formation de Fra Mauro, cible prévue d'Apollo 13. Alan Shepard y a frappé deux balles de golf." },
        { id: 'apollo15', type: 'site', name: 'Apollo 15', lat: 26.132, lon: 3.634, date: '30 juillet 1971', text: "Au pied des monts Apennins, près de la vallée sinueuse de Hadley. Premier usage du rover lunaire ; les astronautes y ont trouvé la « Genesis Rock », un fragment de la croûte primitive." },
        { id: 'apollo16', type: 'site', name: 'Apollo 16', lat: -8.973, lon: 15.500, date: '21 avril 1972', text: "Le seul atterrissage Apollo sur les hauts plateaux de la face visible, dans la région de Descartes." },
        { id: 'apollo17', type: 'site', name: 'Apollo 17', lat: 20.191, lon: 30.772, date: '11 décembre 1972', text: "La vallée de Taurus-Littrow. Dernière mission habitée sur la Lune, avec le seul géologue à y avoir marché, Harrison Schmitt. Record de 110 kg d'échantillons." },
        { id: 'change4', type: 'site', name: 'Chang\'e 4', lat: -45.445, lon: 177.599, date: '3 janvier 2019', text: "Le premier atterrissage sur la face cachée, dans le cratère Von Kármán, au cœur du bassin Pôle Sud–Aitken. Son rover Yutu-2 a fonctionné pendant des années." },
        { id: 'change6', type: 'site', name: 'Chang\'e 6', lat: -41.64, lon: -153.99, date: '1er juin 2024', text: "Le premier retour d'échantillons de la face cachée : environ 1,9 kg prélevés dans le bassin Apollo et rapportés sur Terre le 25 juin 2024." },
        { id: 'chandrayaan3', type: 'site', name: 'Chandrayaan-3', lat: -69.37, lon: 32.32, date: '23 août 2023', text: "L'atterrisseur indien Vikram : le premier à se poser aussi près du pôle Sud. Son rover Pragyan y a confirmé la présence de soufre." }
      ],
      geologie: [
        ['Hauts plateaux', "Les régions claires sont faites d'anorthosite, une roche riche en feldspath qui a flotté et cristallisé à la surface d'un océan de magma, il y a environ 4,4 milliards d'années."],
        ['Mers', "Les taches sombres sont d'immenses coulées de basalte, riches en fer et parfois en titane, qui ont rempli de grands bassins d'impact il y a 3 à 3,9 milliards d'années. Elles couvrent environ 31 % de la face visible et à peine 2 % de la face cachée."],
        ['Cratères', "Plus d'un million de cratères de plus d'un kilomètre. Sans atmosphère, sans eau liquide et sans tectonique des plaques pour les effacer, ils s'accumulent depuis plus de 4 milliards d'années : la Lune garde les archives des bombardements du système solaire."],
        ['Régolithe', "Toute la surface est recouverte d'une couche de poussière et de débris broyés par les impacts : 4 à 5 m dans les mers, 10 à 15 m sur les hauts plateaux. Ses grains, anguleux faute d'érosion, s'accrochaient à tout pendant les missions Apollo."],
        ['Intérieur', "Un petit noyau de fer d'environ 330 km de rayon, en partie liquide, sous un épais manteau rocheux. La croûte est plus épaisse sur la face cachée, ce qui explique en partie la rareté des mers de ce côté."],
        ['Activité', "La Lune n'est pas tout à fait inerte : les sismomètres d'Apollo ont enregistré des milliers de séismes lunaires, et elle se contracte lentement en refroidissant, ce qui plisse sa surface."]
      ],
      ressources: [
        ['Oxygène', "Environ 40 à 45 % de la masse des roches lunaires, mais lié aux minéraux : il faudrait le libérer par des procédés chimiques ou électriques."],
        ['Glace d\'eau', "Au fond des cratères polaires jamais éclairés, où il fait moins de −230 °C. Sa présence est établie (impact de LCROSS en 2009, spectromètre de Chandrayaan-1), mais pas encore sa quantité ni sa facilité d'accès. C'est la principale raison de l'intérêt pour le pôle Sud."],
        ['Métaux', "Fer, titane (dans l'ilménite des basaltes), aluminium et silicium : des matériaux de construction possibles, difficiles à extraire."],
        ['Hélium 3', "Déposé par le vent solaire dans le régolithe, en quantité infime (de l'ordre de quelques dizaines de milliardièmes de la masse). Souvent cité comme combustible pour une future fusion nucléaire, son intérêt reste théorique."],
        ['Terres rares', "Concentrées dans les roches KREEP (potassium, terres rares, phosphore), surtout autour de l'océan des Tempêtes."]
      ],
      terre: "La Lune règle les marées, stabilise l'inclinaison de l'axe de la Terre (et donc ses saisons) et s'éloigne de nous d'environ 3,8 cm par an, une distance mesurée grâce aux réflecteurs laser laissés par Apollo et Lunokhod."
    }
  };
  OBS.SITE_TYPES = { mer: 'Mer', bassin: 'Bassin d\'impact', cratere: 'Cratère', site: 'Site d\'alunissage', extreme: 'Point remarquable' };
})();

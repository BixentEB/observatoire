/* ======================================================================
   OBSERVATOIRE — De l'atome à l'Univers
   Tailles caractéristiques, en mètres (ordre de grandeur, valeurs arrondies).
   go : lien vers un niveau de l'Observatoire ou le lexique.
   ====================================================================== */
(function () {
  'use strict';
  var OBS = window.OBS = window.OBS || {};
  OBS.SCALES = [
    { m: 1.7e-15, name: 'Proton', d: "Le cœur des noyaux d'atomes : environ un millionième de milliardième de mètre.", go: ['#/lexique/matiere/atome', 'Lexique'] },
    { m: 1e-14, name: 'Noyau d\'atome', d: "Presque toute la masse de l'atome tient dans ce noyau, cent mille fois plus petit que l'atome lui-même." },
    { m: 1.1e-10, name: 'Atome d\'hydrogène', d: "L'atome le plus simple et le plus abondant de l'Univers. L'atome est surtout fait de vide.", go: ['#/lexique/matiere/hydrogene', 'Lexique'] },
    { m: 2e-9, name: 'Molécule d\'ADN (largeur)', d: "La double hélice qui porte l'information génétique : environ 2 milliardièmes de mètre de large." },
    { m: 1e-7, name: 'Virus', d: "Un virus de la grippe mesure environ un dix-millième de millimètre." },
    { m: 5e-7, name: 'Longueur d\'onde de la lumière', d: "La lumière visible ondule sur environ un demi-millième de millimètre : c'est pour cela qu'un microscope optique ne voit pas les virus." },
    { m: 2e-6, name: 'Bactérie', d: "Une bactérie comme Escherichia coli mesure environ 2 millièmes de millimètre." },
    { m: 1e-4, name: 'Grain de poussière cosmique', d: "Les étoiles filantes sont souvent des grains de cette taille, plus petits qu'un grain de sable, qui brûlent dans l'atmosphère.", go: ['#/atlas/visiteurs', 'Visiteurs'] },
    { m: 1.7, name: 'Être humain', d: "Notre échelle : à mi-chemin, en puissances de dix, entre l'atome et une étoile géante." },
    { m: 330, name: 'Tour Eiffel', d: "Environ la taille de l'astéroïde Apophis, qui frôlera la Terre en 2029.", go: ['#/atlas/visiteurs', 'Visiteurs'] },
    { m: 8849, name: 'Mont Everest', d: "Le plus haut sommet de la Terre. Olympus Mons, sur Mars, est presque trois fois plus haut.", go: ['#/explorer/mars', 'Mars'] },
    { m: 2.6e4, name: 'Noyau d\'une comète', d: "Celui de la comète Swift-Tuttle, mère des Perséides, mesure environ 26 km." },
    { m: 9.4e5, name: 'Cérès', d: "La plus grande des planètes naines de la ceinture d'astéroïdes, presque la largeur de la France.", go: ['#/explorer/ceres', 'Cérès'] },
    { m: 3.47e6, name: 'Lune', d: "Un peu plus du quart de la Terre.", go: ['#/explorer/lune', 'Lune'] },
    { m: 1.27e7, name: 'Terre', d: "12 742 km de diamètre. La lumière en fait le tour en un septième de seconde.", go: ['#/explorer/terre', 'Terre'] },
    { m: 1.4e8, name: 'Jupiter', d: "Onze fois la Terre. Plus massive que toutes les autres planètes réunies.", go: ['#/explorer/jupiter', 'Jupiter'] },
    { m: 1.39e9, name: 'Soleil', d: "109 fois la Terre : on pourrait y loger environ un million de Terres.", go: ['#/explorer/soleil', 'Soleil'] },
    { m: 1.2e12, name: 'Bételgeuse', d: "Une supergéante rouge : à la place du Soleil, elle engloutirait les orbites jusqu'à celle de Jupiter ou presque.", go: ['#/lexique/etoiles/supergeante', 'Lexique'] },
    { m: 9e12, name: 'Orbite de Neptune', d: "Le système des planètes : environ 60 fois la distance de la Terre au Soleil d'un bord à l'autre.", go: ['#/explorer', 'Système solaire'] },
    { m: 3.6e13, name: 'Héliosphère', d: "La bulle soufflée par le vent du Soleil, dont les deux sondes Voyager sont sorties en 2012 et 2018." },
    { m: 3e16, name: 'Nuage d\'Oort', d: "La réserve de comètes qui entourerait le système solaire, jusqu'à 1,5 année-lumière du Soleil ou plus : environ 3 années-lumière d'un bord à l'autre.", go: ['#/lexique/planetes/nuage-d-oort', 'Lexique'] },
    { m: 4e16, name: 'Distance de Proxima du Centaure', d: "L'étoile la plus proche : 4,2 années-lumière.", go: ['#/voisinage', 'Voisinage'] },
    { m: 2.4e17, name: 'Voisinage stellaire', d: "La sphère de 12,5 années-lumière de rayon montrée par l'Observatoire, avec une trentaine d'étoiles.", go: ['#/voisinage', 'Voisinage'] },
    { m: 2.3e17, name: 'Amas des Pléiades', d: "Un amas d'un millier de jeunes étoiles, sur une vingtaine d'années-lumière.", go: ['#/galaxie/pleiades', 'Pléiades'] },
    { m: 9.5e20, name: 'Voie lactée', d: "Environ 100 000 années-lumière de diamètre, 100 à 400 milliards d'étoiles.", go: ['#/galaxie', 'Voie lactée'] },
    { m: 9.5e22, name: 'Groupe local', d: "Une dizaine de millions d'années-lumière : la Voie lactée, Andromède, le Triangle et plus de 80 galaxies naines.", go: ['#/groupe-local', 'Groupe local'] },
    { m: 1e24, name: 'Amas de la Vierge', d: "Plus d'un millier de galaxies, à 54 millions d'années-lumière.", go: ['#/lexique/galaxies/amas-de-galaxies', 'Lexique'] },
    { m: 4.9e24, name: 'Laniakea', d: "Notre superamas : environ 500 millions d'années-lumière et 100 000 galaxies.", go: ['#/lexique/galaxies/superamas', 'Lexique'] },
    { m: 8.8e26, name: 'Univers observable', d: "Environ 93 milliards d'années-lumière de diamètre : tout ce dont la lumière a pu nous parvenir depuis le Big Bang.", go: ['#/lexique/univers/univers-observable', 'Lexique'] }
  ];
})();

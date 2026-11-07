/* ======================================================================
   OBSERVATOIRE — Types d'objets (et de « non-objets »)
   Familles, caractéristiques typiques et exemples cliquables dans la scène.
   lex : terme du Lexique pour la définition complète. Valeurs typiques, arrondies.
   CYCLES : schémas de formation (étapes, exemples réels).
   ====================================================================== */
(function () {
  'use strict';
  var OBS = window.OBS = window.OBS || {};

  OBS.TYPE_FAMILIES = [
    ['etoiles', 'Étoiles', 'Des boules de gaz qui brillent par fusion nucléaire. Leur masse décide de presque tout : couleur, durée de vie, et la façon dont elles finissent.'],
    ['compacts', 'Restes d\'étoiles', 'Ce qui reste quand une étoile a fini de brûler : plus elle était massive, plus son reste est dense.'],
    ['planetes', 'Planètes', 'Des corps arrondis par leur propre gravité, qui tournent autour d\'une étoile.'],
    ['petits', 'Petits corps', 'Les débris de la formation des planètes : trop petits pour être des planètes, ils gardent la mémoire des débuts du système solaire.'],
    ['nuages', 'Nuages et amas', 'Le gaz et la poussière entre les étoiles, et les groupes d\'étoiles nées ensemble.'],
    ['galaxies', 'Galaxies', 'Des ensembles d\'étoiles, de gaz et de matière noire liés par la gravité, classés selon leur forme.'],
    ['non', 'Des « non-objets »', 'Des régions, des bulles ou des vides : rien qu\'on puisse toucher, mais des structures bien réelles.']
  ];

  OBS.TYPES = [
    /* étoiles */
    { fam: 'etoiles', name: 'Naine rouge', traits: [['Masse', '8 à 60 % du Soleil'], ['Surface', 'moins de 3 500 °C'], ['Durée de vie', 'des milliers de milliards d\'années']], ex: [['#/voisinage/proxima', 'Proxima du Centaure'], ['#/voisinage/barnard', 'Étoile de Barnard'], ['#/galaxie/trappist1', 'TRAPPIST-1']], lex: 'Naine rouge', note: "Trois étoiles sur quatre." },
    { fam: 'etoiles', name: 'Naine orange', traits: [['Masse', '60 à 90 % du Soleil'], ['Surface', '3 500 à 5 000 °C'], ['Durée de vie', '15 à 30 milliards d\'années']], ex: [['#/voisinage/epseri', 'Epsilon Eridani'], ['#/voisinage/alphacen', 'Alpha du Centaure B']], lex: 'Naine orange' },
    { fam: 'etoiles', name: 'Naine jaune', traits: [['Masse', 'environ celle du Soleil'], ['Surface', '≈ 5 500 °C'], ['Durée de vie', '≈ 10 milliards d\'années']], ex: [['#/explorer/soleil', 'Soleil'], ['#/voisinage/tauceti', 'Tau Ceti'], ['#/galaxie/51peg', '51 Pegasi']], lex: 'Naine jaune' },
    { fam: 'etoiles', name: 'Étoile blanche ou bleue', traits: [['Masse', '2 à plus de 50 fois le Soleil'], ['Surface', '7 500 à plus de 30 000 °C'], ['Durée de vie', 'de quelques millions à un milliard d\'années']], ex: [['#/voisinage/sirius', 'Sirius A'], ['#/galaxie/pleiades', 'Pléiades']], lex: 'Classe spectrale', note: "Rares, très lumineuses, elles vivent vite." },
    { fam: 'etoiles', name: 'Géante rouge', traits: [['Taille', '10 à 100 fois le Soleil'], ['Étape', 'fin de vie d\'une étoile comme le Soleil']], ex: [], lex: 'Géante rouge', note: "Le Soleil en sera une dans environ 5 milliards d'années." },
    { fam: 'etoiles', name: 'Supergéante', traits: [['Taille', 'jusqu\'à plus de 1 000 fois le Soleil'], ['Masse', 'plus de 8 à 10 fois le Soleil'], ['Fin', 'supernova']], ex: [['#/galaxie/etacar', 'Êta Carinae']], lex: 'Supergéante' },
    { fam: 'etoiles', name: 'Naine brune', traits: [['Masse', '13 à 75 fois Jupiter'], ['Lumière', 'surtout infrarouge']], ex: [['#/voisinage/luhman16', 'Luhman 16'], ['#/voisinage/wise0855', 'WISE 0855−0714']], lex: 'Naine brune', note: "Ni tout à fait une étoile, ni une planète." },
    /* restes */
    { fam: 'compacts', name: 'Naine blanche', traits: [['Taille', 'celle de la Terre'], ['Masse', 'jusqu\'à 1,4 fois le Soleil'], ['Densité', 'une tonne par centimètre cube']], ex: [['#/voisinage/sirius', 'Sirius B'], ['#/voisinage/procyon', 'Procyon B']], lex: 'Naine blanche' },
    { fam: 'compacts', name: 'Étoile à neutrons et pulsar', traits: [['Taille', '≈ 20 km'], ['Masse', '1,2 à 2 fois le Soleil'], ['Rotation', 'jusqu\'à plus de 700 tours par seconde']], ex: [['#/galaxie/crabe', 'Pulsar du Crabe'], ['#/galaxie/psr1257', 'PSR B1257+12']], lex: 'Étoile à neutrons' },
    { fam: 'compacts', name: 'Trou noir stellaire', traits: [['Masse', '3 à quelques dizaines de fois le Soleil'], ['Taille de l\'horizon', 'quelques dizaines de km']], ex: [['#/galaxie/cygx1', 'Cygnus X-1']], lex: 'Trou noir' },
    { fam: 'compacts', name: 'Trou noir supermassif', traits: [['Masse', 'des millions à des milliards de Soleils'], ['Où', 'au centre des galaxies']], ex: [['#/galaxie/sgra', 'Sagittarius A*']], lex: 'Trou noir supermassif' },
    /* planètes */
    { fam: 'planetes', name: 'Planète tellurique', traits: [['Surface', 'solide, rocheuse'], ['Taille', 'jusqu\'à ≈ 1,5 fois la Terre']], ex: [['#/explorer/mercure', 'Mercure'], ['#/explorer/venus', 'Vénus'], ['#/explorer/terre', 'Terre'], ['#/explorer/mars', 'Mars']], lex: 'Planète tellurique' },
    { fam: 'planetes', name: 'Super-Terre et mini-Neptune', traits: [['Masse', '2 à 10 fois la Terre'], ['Fréquence', 'parmi les exoplanètes les plus courantes']], ex: [['#/galaxie/k218', 'K2-18'], ['#/galaxie/55cnc', '55 Cancri e']], lex: 'Super-Terre', note: "Aucune dans le système solaire." },
    { fam: 'planetes', name: 'Géante de glace', traits: [['Composition', 'eau, ammoniac, méthane autour d\'un cœur rocheux'], ['Taille', '≈ 4 fois la Terre']], ex: [['#/explorer/uranus', 'Uranus'], ['#/explorer/neptune', 'Neptune']], lex: 'Géante de glace' },
    { fam: 'planetes', name: 'Géante gazeuse', traits: [['Composition', 'hydrogène et hélium'], ['Taille', '9 à 11 fois la Terre']], ex: [['#/explorer/jupiter', 'Jupiter'], ['#/explorer/saturne', 'Saturne'], ['#/galaxie/hr8799', 'HR 8799']], lex: 'Géante gazeuse' },
    { fam: 'planetes', name: 'Jupiter chaud', traits: [['Orbite', 'quelques jours'], ['Température', 'plus de 1 000 °C']], ex: [['#/galaxie/51peg', '51 Pegasi b'], ['#/galaxie/hd209458', 'HD 209458 b'], ['#/galaxie/wasp12', 'WASP-12 b']], lex: 'Jupiter chaud' },
    { fam: 'planetes', name: 'Planète naine', traits: [['Forme', 'arrondie'], ['Orbite', 'partagée avec d\'autres corps']], ex: [['#/explorer/ceres', 'Cérès'], ['#/explorer/pluton', 'Pluton'], ['#/explorer/eris', 'Éris']], lex: 'Planète naine' },
    { fam: 'planetes', name: 'Lune', traits: [['Où', 'autour d\'une planète ou d\'une planète naine'], ['Record', 'Saturne, plus de 200']], ex: [['#/explorer/lune', 'Lune'], ['#/explorer/titan', 'Titan'], ['#/explorer/europe', 'Europe']], lex: 'Lune (satellite naturel)' },
    /* petits corps */
    { fam: 'petits', name: 'Astéroïde', traits: [['Taille', 'de quelques mètres à ≈ 500 km'], ['Où', 'surtout entre Mars et Jupiter']], ex: [['#/explorer/ceinture', 'Ceinture principale'], ['#/atlas/visiteurs', 'Apophis']], lex: 'Astéroïde' },
    { fam: 'petits', name: 'Comète', traits: [['Noyau', 'de quelques centaines de mètres à quelques dizaines de km'], ['Composition', 'glace et poussière']], ex: [['#/explorer/halley', 'Halley'], ['#/atlas/visiteurs', 'Les visiteurs']], lex: 'Comète' },
    { fam: 'petits', name: 'Objet transneptunien', traits: [['Où', 'au-delà de Neptune'], ['Nombre', 'des milliers connus']], ex: [['#/explorer/arrokoth', 'Arrokoth'], ['#/explorer/eris', 'Éris']], lex: 'Objet transneptunien' },
    { fam: 'petits', name: 'Objet interstellaire', traits: [['Origine', 'un autre système stellaire'], ['Connus', 'trois']], ex: [['#/atlas/visiteurs', 'ʻOumuamua, Borisov, 3I/ATLAS']], lex: 'Objet interstellaire' },
    /* nuages et amas */
    { fam: 'nuages', name: 'Nébuleuse en émission', traits: [['Couleur', 'souvent rouge (hydrogène)'], ['Rôle', 'pouponnière d\'étoiles']], ex: [['#/galaxie/orion-m42', 'Nébuleuse d\'Orion'], ['#/galaxie/aigle', 'Nébuleuse de l\'Aigle']], lex: 'Nébuleuse' },
    { fam: 'nuages', name: 'Rémanent de supernova', traits: [['Origine', 'explosion d\'une étoile'], ['Âge', 'quelques milliers d\'années']], ex: [['#/galaxie/crabe', 'Nébuleuse du Crabe']], lex: 'Supernova' },
    { fam: 'nuages', name: 'Nébuleuse planétaire', traits: [['Origine', 'fin de vie d\'une étoile comme le Soleil'], ['Durée', 'quelques dizaines de milliers d\'années']], ex: [], lex: 'Nébuleuse planétaire' },
    { fam: 'nuages', name: 'Amas ouvert', traits: [['Étoiles', 'dizaines à milliers, jeunes'], ['Où', 'dans le disque de la galaxie']], ex: [['#/galaxie/pleiades', 'Pléiades']], lex: 'Amas ouvert' },
    { fam: 'nuages', name: 'Amas globulaire', traits: [['Étoiles', 'centaines de milliers à millions, très vieilles'], ['Où', 'dans le halo de la galaxie']], ex: [['#/galaxie/omegacen', 'Oméga du Centaure']], lex: 'Amas globulaire' },
    /* galaxies */
    { fam: 'galaxies', name: 'Spirale', traits: [['Forme', 'disque à bras, bulbe central'], ['Étoiles', 'des dizaines à des centaines de milliards']], ex: [['#/groupe-local/m31', 'Andromède'], ['#/groupe-local/m33', 'Triangle'], ['#/galaxie', 'Voie lactée']], lex: 'Galaxie spirale' },
    { fam: 'galaxies', name: 'Elliptique', traits: [['Forme', 'ballon plus ou moins aplati'], ['Étoiles', 'surtout anciennes']], ex: [['#/groupe-local/m32', 'M32'], ['#/groupe-local/lg-ngc147', 'NGC 147']], lex: 'Galaxie elliptique' },
    { fam: 'galaxies', name: 'Irrégulière', traits: [['Forme', 'sans structure définie'], ['Gaz', 'abondant, étoiles jeunes']], ex: [['#/groupe-local/lg-gnm', 'Grand Nuage de Magellan'], ['#/groupe-local/ic10', 'IC 10']], lex: 'Galaxie irrégulière' },
    { fam: 'galaxies', name: 'Sphéroïdale naine', traits: [['Étoiles', 'quelques millions, très vieilles'], ['Masse', 'surtout de la matière noire']], ex: [['#/groupe-local/lg-draco', 'Naine du Dragon'], ['#/groupe-local/sculptor', 'Naine du Sculpteur']], lex: 'Galaxie sphéroïdale naine' },
    { fam: 'galaxies', name: 'Ultra-diffuse', traits: [['Taille', 'grande'], ['Éclat', 'des centaines de fois plus pâle']], ex: [['#/groupe-local/lg-crater2', 'Coupe II'], ['#/groupe-local/lg-antlia2', 'Machine pneumatique 2']], lex: 'Galaxie ultra-diffuse' },
    /* non-objets */
    { fam: 'non', name: 'Ceinture', traits: [['Quoi', 'un anneau de petits corps'], ['Masse totale', 'faible : celle de la ceinture principale fait ≈ 3 % de la Lune']], ex: [['#/explorer/ceinture', 'Ceinture principale'], ['#/explorer/kuiper', 'Ceinture de Kuiper']], lex: 'Ceinture de Kuiper' },
    { fam: 'non', name: 'Héliosphère', traits: [['Quoi', 'la bulle du vent solaire'], ['Taille', '≈ 120 UA jusqu\'à sa frontière']], ex: [['#/explorer/voyager1', 'Voyager 1']], lex: null },
    { fam: 'non', name: 'Bras spiral', traits: [['Quoi', 'une onde de densité, pas un objet fixe'], ['Exemple', 'le Soleil est dans le bras d\'Orion']], ex: [['#/galaxie/orion', 'Bras d\'Orion']], lex: 'Bras spiral' },
    { fam: 'non', name: 'Halo', traits: [['Quoi', 'gaz chaud et matière noire autour d\'une galaxie'], ['Taille', 'jusqu\'à plus de 1 million d\'al']], ex: [['#/groupe-local', 'Halos du Groupe local']], lex: 'Halo galactique' },
    { fam: 'non', name: 'Vide cosmique', traits: [['Quoi', 'une région presque sans galaxies'], ['Taille', 'des dizaines à des centaines de millions d\'al']], ex: [], lex: 'Toile cosmique', note: "Le Groupe local est au bord du Vide local." }
  ];

  OBS.CYCLES = [
    { id: 'etoile', title: 'La vie d\'une étoile', intro: "Toutes les étoiles naissent dans un nuage de gaz. Ensuite, tout dépend de leur masse.",
      start: [['Nuage de gaz et de poussière', '#/galaxie/orion-m42', 'Nébuleuse d\'Orion'], ['Protoétoile', null, ''], ['Étoile sur la séquence principale', '#/explorer/soleil', 'Soleil']],
      branches: [
        { label: 'Étoile comme le Soleil (moins de 8 masses solaires)', steps: [['Géante rouge', null, ''], ['Nébuleuse planétaire', null, ''], ['Naine blanche', '#/voisinage/sirius', 'Sirius B']] },
        { label: 'Étoile massive (plus de 8 masses solaires)', steps: [['Supergéante', '#/galaxie/etacar', 'Êta Carinae'], ['Supernova', '#/galaxie/crabe', 'Crabe, vue en 1054'], ['Étoile à neutrons ou trou noir', '#/galaxie/cygx1', 'Cygnus X-1']] }
      ],
      note: "Les durées vont de quelques millions d'années pour les étoiles les plus massives à des milliers de milliards pour les naines rouges, qui n'ont encore jamais atteint la fin de ce schéma." },
    { id: 'planetes', title: 'La naissance des planètes', intro: "Autour d'une jeune étoile, le reste du nuage s'aplatit en disque. En quelques millions d'années, la poussière s'y assemble en planètes.",
      start: [['Disque de gaz et de poussière', '#/galaxie/betapic', 'Bêta Pictoris'], ['Grains, puis cailloux', null, ''], ['Planétésimaux (kilomètres)', '#/explorer/arrokoth', 'Arrokoth, un survivant'], ['Protoplanètes', null, ''], ['Planètes et débris', '#/explorer', 'Système solaire']],
      note: "Près de l'étoile, il fait trop chaud pour la glace : les planètes y sont rocheuses. Plus loin, la glace s'ajoute et les cœurs grossissent assez pour capter du gaz : les géantes." },
    { id: 'galaxies', title: 'La croissance des galaxies', intro: "Les galaxies ne sont pas nées grandes : elles grossissent en avalant du gaz et des galaxies plus petites.",
      start: [['Premières étoiles et petites galaxies (quelques centaines de millions d\'années après le Big Bang)', null, ''], ['Fusions et chutes de gaz', '#/groupe-local/lg-gnm', 'Les Nuages de Magellan, futurs repas'], ['Grande spirale', '#/galaxie', 'Voie lactée'], ['Collision de deux spirales', '#/groupe-local/m31', 'Andromède, dans quelques milliards d\'années ?'], ['Grande elliptique', null, '']],
      note: "La Voie lactée est en train d'avaler la naine du Sagittaire. Le télescope James Webb voit des galaxies déjà formées moins de 400 millions d'années après le Big Bang." }
  ];
})();

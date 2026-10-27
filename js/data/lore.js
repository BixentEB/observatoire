/* ======================================================================
   OBSERVATOIRE — origine des noms, projets et pistes d'avenir
   nom      : d'où vient le nom de l'objet (mythologie, découvreur, catalogue…)
   projets  : missions approuvées, études et concepts, chacun avec son statut :
              'cours'   programme en cours
              'prevu'   mission approuvée, en préparation
              'etude'   à l'étude, pas encore approuvé
              'concept' idée spéculative (terraformation, habitats…), sans mission
   Les dates de lancement sont celles annoncées : elles glissent souvent.
   ====================================================================== */
(function () {
  'use strict';
  var OBS = window.OBS = window.OBS || {};
  OBS.LORE = {
    soleil: { nom: "Du latin populaire *soliculus*, diminutif de *sol*. Les Romains vénéraient Sol, les Grecs Hélios, qui menait chaque jour le char du Soleil à travers le ciel.",
      projets: [{ s: 'prevu', t: "Vigil (ESA) : une sonde placée à côté de la Terre sur son orbite pour voir venir les tempêtes solaires, lancement prévu vers 2031." }] },
    mercure: { nom: "Mercure, dieu romain du commerce et messager des dieux (l'Hermès des Grecs) : la planète est celle qui se déplace le plus vite dans le ciel." },
    venus: { nom: "Vénus, déesse romaine de l'amour et de la beauté (l'Aphrodite des Grecs), pour l'éclat de l'astre le plus brillant du ciel après le Soleil et la Lune.",
      projets: [
        { s: 'prevu', t: "EnVision (ESA), cartographie radar et étude de l'atmosphère, lancement prévu vers 2031." },
        { s: 'prevu', t: "DAVINCI et VERITAS (NASA), une sonde de descente dans l'atmosphère et un orbiteur radar, prévus au début des années 2030 (calendrier incertain)." },
        { s: 'concept', t: "Habitats flottants : vers 50 km d'altitude, pression et température y sont proches de celles de la Terre. La NASA a étudié l'idée de dirigeables habités (étude HAVOC, 2015)." },
        { s: 'concept', t: "Terraformation : pare-soleil géant, retrait du gaz carbonique… des idées théoriques, hors de portée des technologies actuelles." }] },
    terre: { nom: "Du latin *terra*, le sol. C'est la seule planète dont le nom ne vient pas d'une divinité, même si les Romains la personnifiaient sous le nom de Tellus (Gaïa chez les Grecs)." },
    lune: { nom: "Du latin *luna*, « la lumineuse ». Les Romains l'honoraient sous le nom de Luna, les Grecs sous celui de Séléné.",
      projets: [
        { s: 'cours', t: "Artemis (NASA et partenaires) : retour d'astronautes autour puis sur la Lune, avec la station Gateway en orbite lunaire." },
        { s: 'cours', t: "Chang'e (Chine) : nouvelles missions robotiques vers le pôle sud, préparant une base de recherche internationale (ILRS) dans les années 2030." },
        { s: 'etude', t: "Exploitation de la glace d'eau des cratères polaires pour produire eau, oxygène et carburant sur place." },
        { s: 'concept', t: "Terraformation : jugée irréaliste, la Lune étant trop petite pour retenir une atmosphère. Les projets visent plutôt des habitats protégés, sous le sol ou dans des tunnels de lave." }] },
    mars: { nom: "Mars, dieu romain de la guerre (l'Arès des Grecs), pour sa couleur rouge sang.",
      projets: [
        { s: 'prevu', t: "Rover Rosalind Franklin (ESA, programme ExoMars), conçu pour forer jusqu'à 2 m de profondeur, lancement prévu vers 2028." },
        { s: 'prevu', t: "Tianwen-3 (Chine) : retour d'échantillons martiens, lancement visé vers 2028." },
        { s: 'etude', t: "Mars Sample Return (NASA, ESA) : rapporter les échantillons collectés par Perseverance. L'architecture et le calendrier sont en cours de révision." },
        { s: 'etude', t: "Missions habitées : projets à long terme de la NASA et d'entreprises privées, sans date ferme." },
        { s: 'concept', t: "Terraformation : épaissir l'atmosphère pour réchauffer la planète. Une étude financée par la NASA (2018) a conclu que Mars ne contient pas assez de gaz carbonique accessible pour y parvenir avec les technologies actuelles." }] },
    phobos: { nom: "Phobos, « la peur » en grec, fils d'Arès qui accompagnait son père au combat.",
      projets: [{ s: 'prevu', t: "MMX (JAXA) : se poser sur Phobos et en rapporter des échantillons, lancement prévu vers 2026-2027." }] },
    deimos: { nom: "Déimos, « la terreur » en grec, l'autre fils d'Arès, frère de Phobos." },
    jupiter: { nom: "Jupiter, roi des dieux romains (le Zeus des Grecs), pour la plus grande des planètes." },
    io: { nom: "Io, prêtresse aimée de Zeus, changée en génisse pour échapper à la jalousie d'Héra. Les quatre grandes lunes doivent leurs noms à Simon Marius, sur une suggestion de Kepler (1614)." },
    europe: { nom: "Europe, princesse phénicienne enlevée par Zeus changé en taureau ; elle a aussi donné son nom au continent.",
      projets: [{ s: 'prevu', t: "Europa Clipper (NASA), en route, et JUICE (ESA), en route : survols d'Europe à partir de 2030-2031 pour étudier son océan." },
        { s: 'etude', t: "Europa Lander (NASA) : un atterrisseur pour chercher des traces de vie dans la glace, à l'étude sans financement." }] },
    ganymede: { nom: "Ganymède, jeune prince troyen enlevé par Zeus pour devenir l'échanson des dieux.",
      projets: [{ s: 'prevu', t: "JUICE (ESA), en route : elle doit se mettre en orbite autour de Ganymède en 2034, une première autour d'une autre lune que la nôtre." }] },
    callisto: { nom: "Callisto, nymphe aimée de Zeus, changée en ourse puis placée dans le ciel : la Grande Ourse." },
    saturne: { nom: "Saturne, dieu romain des semailles et du temps, père de Jupiter (le Cronos des Grecs)." },
    mimas: { nom: "Mimas, un des Géants qui combattirent les dieux de l'Olympe. Les lunes de Saturne portent des noms de Titans et de Géants, une idée de John Herschel (1847)." },
    encelade: { nom: "Encelade, Géant vaincu par Athéna et enseveli, selon la légende, sous l'Etna.",
      projets: [{ s: 'etude', t: "Enceladus Orbilander (NASA) : un orbiteur puis un atterrisseur pour analyser les panaches de son océan, recommandé par les scientifiques américains, sans calendrier." }] },
    tethys: { nom: "Téthys, Titanide de la mer, épouse d'Océan." },
    dione: { nom: "Dioné, Titanide, mère d'Aphrodite selon certaines traditions." },
    rhea: { nom: "Rhéa, Titanide, épouse de Cronos et mère de Zeus." },
    titan: { nom: "D'après les Titans, frères et sœurs de Cronos. Christian Huygens l'a découverte en 1655 ; le nom a été proposé en 1847 par John Herschel.",
      projets: [{ s: 'prevu', t: "Dragonfly (NASA) : un drone à hélices qui volera de site en site à la surface de Titan, lancement prévu en 2028, arrivée en 2034." }] },
    japet: { nom: "Japet, Titan, père de Prométhée et d'Atlas." },
    uranus: { nom: "Ouranos, dieu grec du ciel, père de Cronos : la seule planète nommée d'après un dieu grec plutôt que romain. William Herschel, qui l'a découverte en 1781, voulait l'appeler « Georgium Sidus » en l'honneur du roi George III ; le nom actuel a été proposé par Johann Bode.",
      projets: [{ s: 'etude', t: "Uranus Orbiter and Probe (NASA) : un orbiteur et une sonde atmosphérique, première priorité des scientifiques américains pour les grandes missions (2022), pas encore approuvé." }] },
    miranda: { nom: "Miranda, héroïne de *La Tempête* de Shakespeare. Les lunes d'Uranus portent des noms de personnages de Shakespeare et d'Alexander Pope." },
    ariel: { nom: "Ariel, esprit de l'air dans *La Tempête* de Shakespeare (et sylphe dans *La Boucle de cheveux enlevée* de Pope)." },
    umbriel: { nom: "Umbriel, gnome mélancolique de *La Boucle de cheveux enlevée*, poème d'Alexander Pope." },
    titania: { nom: "Titania, reine des fées dans *Le Songe d'une nuit d'été* de Shakespeare." },
    oberon: { nom: "Obéron, roi des fées dans *Le Songe d'une nuit d'été*, époux de Titania." },
    neptune: { nom: "Neptune, dieu romain de la mer (le Poséidon des Grecs), un nom qui va bien à sa couleur bleue.",
      projets: [{ s: 'etude', t: "Aucune mission approuvée. Plusieurs concepts d'orbiteur sont à l'étude, souvent associés à Triton." }] },
    triton: { nom: "Triton, dieu marin, fils de Poséidon, qui soufflait dans une conque pour calmer ou soulever les vagues." },
    pluton: { nom: "Pluton, dieu romain des enfers (l'Hadès des Grecs). Le nom a été proposé en 1930 par Venetia Burney, une écolière anglaise de 11 ans ; ses deux premières lettres rappellent aussi Percival Lowell, qui avait lancé sa recherche." },
    charon: { nom: "Charon, le passeur qui faisait traverser le Styx aux âmes des morts, vers le royaume de Pluton." },
    ceres: { nom: "Cérès, déesse romaine des moissons (la Déméter des Grecs) et patronne de la Sicile, où Giuseppe Piazzi l'a découverte en 1801. Elle a aussi donné le mot « céréale »." },
    haumea: { nom: "Hauméa, déesse hawaïenne de la fertilité et de l'enfantement. Ses deux lunes portent les noms de deux de ses filles, Hiʻiaka et Namaka." },
    makemake: { nom: "Makémaké, dieu créateur du peuple Rapa Nui de l'île de Pâques, en écho à sa découverte peu après Pâques 2005." },
    eris: { nom: "Éris, déesse grecque de la discorde : un clin d'œil au débat qu'a provoqué sa découverte. Sa lune, Dysnomie, porte le nom de sa fille, l'esprit de l'anarchie." },
    halley: { nom: "Edmond Halley, astronome anglais qui, en 1705, a compris que les comètes de 1531, 1607 et 1682 étaient le même objet, et a prédit son retour pour 1758. Il est mort avant de le voir." },
    ceinture: { nom: "On parle aussi de ceinture principale, pour la distinguer des autres populations de petits corps." },
    kuiper: { nom: "D'après Gerard Kuiper, astronome néerlandais-américain qui en a envisagé l'existence en 1951 (Kenneth Edgeworth l'avait évoquée avant lui). Son premier membre après Pluton n'a été découvert qu'en 1992." },

    /* étoiles */
    proxima: { nom: "Du latin *proxima*, « la plus proche ». Son nom complet, Proxima Centauri, signifie « la plus proche du Centaure »." },
    alphacen: { nom: "Alpha : l'étoile la plus brillante de la constellation du Centaure. Elle a aussi un nom propre, Rigil Kentaurus, de l'arabe « le pied du Centaure »." },
    barnard: { nom: "D'après Edward Emerson Barnard, astronome américain qui a mesuré son mouvement record en 1916." },
    luhman16: { nom: "D'après Kevin Luhman, astronome américain qui l'a découverte en 2013 dans les données du télescope spatial WISE." },
    wise0855: { nom: "Désignation du catalogue du télescope spatial WISE, suivie de sa position dans le ciel." },
    wolf359: { nom: "Numéro 359 du catalogue de Max Wolf, astronome allemand, publié en 1919." },
    lalande21185: { nom: "Numéro 21185 du catalogue de Jérôme Lalande, astronome français du XVIIIe siècle." },
    sirius: { nom: "Du grec *seirios*, « brûlant » ou « étincelant ». Son lever avant l'aube, en été, marquait la canicule : les « jours du chien », car Sirius est dans le Grand Chien." },
    luyten7268: { nom: "Catalogue de Willem Luyten, astronome néerlandais-américain. UV Ceti est son nom d'étoile variable, dans la Baleine." },
    ross154: { nom: "Catalogue de Frank Elmore Ross, astronome américain qui a recensé les étoiles à grand mouvement propre dans les années 1920." },
    ross248: { nom: "Catalogue de Frank Elmore Ross, comme Ross 154 et Ross 128." },
    epseri: { nom: "Epsilon : la cinquième lettre grecque, dans la constellation de l'Éridan, le fleuve. Le système de Johann Bayer (1603) nomme les étoiles d'une constellation par lettres grecques." },
    lacaille9352: { nom: "Numéro 9352 du catalogue de l'abbé Nicolas-Louis de Lacaille, qui a cartographié le ciel austral depuis le cap de Bonne-Espérance vers 1750." },
    ross128: { nom: "Catalogue de Frank Elmore Ross." },
    ezaqr: { nom: "Nom d'étoile variable dans la constellation du Verseau (Aquarius)." },
    '61cyg': { nom: "Numéro 61 de la constellation du Cygne dans le catalogue de John Flamsteed, astronome royal anglais." },
    procyon: { nom: "Du grec *prokuōn*, « avant le chien » : elle se lève peu avant Sirius, l'étoile du Grand Chien." },
    struve2398: { nom: "Numéro 2398 du catalogue d'étoiles doubles de Friedrich Georg Wilhelm von Struve, astronome germano-russe." },
    groombridge34: { nom: "Numéro 34 du catalogue de Stephen Groombridge, astronome anglais du début du XIXe siècle." },
    epsind: { nom: "Epsilon de la constellation de l'Indien, selon le système de Bayer." },
    tauceti: { nom: "Tau : dix-neuvième lettre grecque, dans la constellation de la Baleine (Cetus)." }
  };
  OBS.PROJECT_STATUS = { cours: 'En cours', prevu: 'Prévu', etude: 'À l\'étude', concept: 'Concept spéculatif' };
})();

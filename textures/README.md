# Cartes de surface

Chaque fichier est chargé en arrière-plan : tant qu'il n'est pas arrivé (ou s'il manque), l'objet garde un rendu procédural, la scène n'attend jamais.

| Fichier | Objet | Source | Licence |
|---|---|---|---|
| `mercure.jpg`, `mercure-4k.jpg` | Mercure | Mosaïque MESSENGER MDIS (NASA/JHUAPL/CIW, USGS), désaturée vers le naturel (projet « solar-system-model ») | Domaine public |
| `io`, `europe`, `ganymede`, `callisto` | Lunes galiléennes | Mosaïques USGS Galileo/Voyager | Domaine public |
| `titan`, `encelade`, `mimas`, `rhea`, `dione`, `tethys`, `japet` | Lunes de Saturne | Cassini (Titan : PIA22770 ; autres : cartes de Paul Schenk, PIA18434-18439) | Domaine public (NASA) |
| `triton`, `pluton`, `charon`, `ceres`, `phobos`, `deimos` | | Voyager 2, New Horizons, Dawn (USGS), Phil Stooke (PDS) | Domaine public |
| `venus-surface.jpg` | Vénus, surface radar (non utilisée pour l'instant) | Solar System Scope, d'après Magellan | CC BY 4.0 |
| `terre.jpg` | Terre | Solar System Scope, d'après NASA Blue Marble | CC BY 4.0 |
| `terre-nuit.jpg` | Terre, lumières nocturnes | NASA Earth Observatory, Black Marble | Domaine public |
| `lune.jpg`, `lune-4k.jpg` | Lune (2k au départ, 4k à l'approche) | NASA SVS, CGI Moon Kit, mosaïque LROC WAC | Domaine public |
| `lune-relief-4k.jpg`, `lune-relief-2k.jpg` | Lune, relief en carte de pentes (est, nord, haut ; pentes réelles, sans exagération) | Calculé à partir de l'altimétrie LOLA (CGI Moon Kit, `ldem_16`) | Domaine public |
| `lune-altitude.bin` + `.json` | Lune, altitudes en mètres (720 × 360, entiers 16 bits) pour la console | Altimétrie LOLA réduite | Domaine public |
| `mars.jpg`, `mars-4k.jpg` | Mars | Mosaïque Viking MDIM 2.1 (NASA/USGS), dominante bleue des régions sombres atténuée | Domaine public |
| `mars-relief-4k.jpg`, `mars-relief-2k.jpg` | Mars, carte de pentes (est, nord, haut ; pentes réelles) | Altimètre MOLA (MEGDR 32 px/°), via le projet MIT « Rotating Mars » (F. Gourdeau) | Domaine public |
| `jupiter.jpg` | Jupiter | Solar System Scope, d'après Cassini et Hubble | CC BY 4.0 |
| `saturne.jpg` | Saturne | Solar System Scope, d'après Cassini | CC BY 4.0 |
| `saturne-anneaux.png` | Anneaux de Saturne (bande intérieur → extérieur, transparence = densité) | Solar System Scope | CC BY 4.0 |
| `uranus.jpg` | Uranus | Solar System Scope, d'après Voyager 2 | CC BY 4.0 |
| `neptune.jpg` | Neptune | Solar System Scope, d'après Voyager 2 | CC BY 4.0 |

Solar System Scope : https://www.solarsystemscope.com/textures/ — CC BY 4.0, attribution requise (faite dans la page Crédits et sous chaque carte dans les consoles).

Les fichiers ont été réencodés (JPEG progressif, 2048 × 1024). Pour plus de détail, on peut les remplacer par les versions 8k de Solar System Scope en gardant les mêmes noms.

Les fichiers de la Lune ont été préparés à partir des conversions publiées par le projet libre LUNAOPS (couleur LROC 4k, altimétrie LOLA 16 pixels par degré), elles-mêmes tirées sans modification géométrique des fichiers de la NASA. L'alignement couleur/relief a été vérifié (corrélation maximale à décalage nul).

Les cartes des lunes et des planètes naines viennent du projet « solar-system » d'A. Marcher (sources documentées une à une). Elles ont été recentrées ici sur la longitude 0 (elles commençaient à 0° au bord gauche) ; l'orientation a été vérifiée sur des repères connus : Pélé et Loki (Io), Pwyll (Europe), Valhalla (Callisto), Herschel (Mimas), Odysseus (Téthys), Cassini Regio (Japet), Xanadu (Titan), Spoutnik Planitia (Pluton), Occator (Cérès).

## Ajouter une carte
1. Format équirectangulaire (2:1), longitude 0 au centre de l'image.
2. Déposer le fichier ici et ajouter `tex: 'nom.jpg'` à l'objet dans `js/data/bodies.js`.
3. Ajouter la ligne dans ce tableau, et le crédit dans `js/ui/console.js` (`CREDITS`) et `js/ui/pages.js` (page Crédits).

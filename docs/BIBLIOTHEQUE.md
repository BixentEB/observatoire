# Bibliothèque : images et petits corps

Deux chaînes automatiques, sur le même modèle que les trajectoires des engins (`tools/missions.py`) :
un script Python précalcule tout, une tâche GitHub le relance, le site ne lit que des fichiers statiques.
Le navigateur n'appelle jamais la NASA, l'ESA, Wikimedia ou le JPL.

```
data/images-sources.json ──► tools/images.py ──► data/images.json  +  assets/img/<id>-480.webp, -1280.webp
                                 │                   data/images-report.md (à relire)
                                 └─ Wikidata (identification) → Commons (fichier, licence, auteur) → NASA (candidats)

data/smallbodies-sources.json ──► tools/smallbodies.py ──► data/smallbodies.json + data/smallbodies-report.md
                                      └─ JPL SBDB (éléments) → CAD (rapprochements) → Horizons (vérification, fenêtres)

.github/workflows/bibliotheque.yml : au changement d'une liste ou d'un script, à la demande, le 2 de chaque mois.
```

## 1. Images

**Identification.** Chaque objet a un identifiant canonique (`m31`, `halley`…) et une liste `uses` des fiches qui
réutilisent la même image. L'objet est retrouvé dans Wikidata par son nom, puis vérifié : sa nature (P31) doit contenir
le mot attendu (`galaxy`, `comet`…) et, pour les petits corps, la désignation officielle (`1P`, `99942`, `1I`) doit
figurer dans ses noms. Une fois validé, le QID est écrit dans la liste (`"wikidata": "Q…"`) et ne bouge plus.

**Choix de l'image.** L'image principale de Wikidata (P18), choisie par la communauté, sinon un fichier imposé
(`"file"`). Les images de la NASA, de l'ESA/Hubble et de l'ESA/Webb sont presque toutes reprises sur Commons avec leur
licence : Commons sert de point d'entrée unique. La photothèque NASA ne fournit que des candidats, jamais retenus sans validation.

**Licences.** Acceptées : domaine public, CC0, CC BY, CC BY-SA (avec attribution). Refusées : NC, ND, usage loyal,
licence absente. Le catalogue garde l'auteur, le crédit, la licence et son lien, et la page source, affichés sous l'image.

**Nature de l'image.** Le script repère les vues d'artiste et les images radar (titre, description, catégories) :
`photo`, `radar` ou `illustration`. Une illustration est toujours étiquetée comme telle, jamais comme une photographie.

**Poids.** Deux tailles en WebP (480 px pour les cartes, 1280 px pour l'agrandissement), qualité 78, métadonnées retirées :
environ 30 à 120 Ko par image. Budget : 200 objets ≈ 20 Mo, sans problème pour GitHub Pages (limite 1 Go).
Un fichier n'est retéléchargé que si son empreinte SHA-1 sur Commons a changé : la tâche mensuelle ne télécharge
presque rien.

**Visuel de remplacement.** Sans photographie libre (`"status": "aucune"` ou rien trouvé) : une vignette dessinée
par le site selon le type d'objet (comète, astéroïde, galaxie…), marquée « pas de photographie ».

**Validation.** Le rapport `data/images-report.md` liste, pour chaque objet, le QID, la méthode et la confiance,
le fichier, la licence, l'auteur, la nature détectée et les candidats NASA. On valide en ajoutant
`"status": "validé"` (et au besoin `"wikidata"` / `"file"`) dans `images-sources.json` ; `"rejeté"` écarte l'image.

## 2. Petits corps dans la scène

**Données.** Les éléments orbitaux osculateurs du JPL (base SBDB : écliptique J2000, héliocentriques) suffisent au
navigateur, qui sait déjà propager une orbite de Kepler elliptique ou hyperbolique (code des engins spatiaux).

**Précision.** Une orbite de Kepler ignore les perturbations des planètes. Le script la compare aux positions
Horizons (calcul complet) à plusieurs dates : le rapport donne l'écart en kilomètres et en degrés. Règle d'affichage :

| Cas | Données | Affichage |
|---|---|---|
| écart faible dans la fenêtre affichée | éléments SBDB | trajectoire pleine, « calculée (JPL) » |
| écart notable loin de l'époque | éléments SBDB | trajectoire en pointillés, « orbite approchée » |
| rapprochement d'une planète (Apophis 2029) | vecteurs Horizons à pas fin sur la fenêtre | trajectoire pleine, comme les engins |
| objet de passage (interstellaires) | éléments + fenêtre d'observation | affiché seulement dans la fenêtre, puis la ligne d'asymptote en pointillés |
| pluies d'étoiles filantes | orbite de la comète mère | jamais de « nuage » inventé : seulement l'orbite d'origine, signalée |

Aucun déplacement illustratif n'est présenté comme exact : les animations des cycles de formation restent signalées « simulé ».

## Résultats du test sur cinq objets (7 novembre 2026)

Images (rapport complet : `data/images-report.md`) :
- Andromède, Crabe, Halley : identifiés sans erreur (un jeu vidéo « Halley's Comet » écarté par la vérification de nature), vraies photographies, licences libres, 20 à 35 Ko en 480 px, 190 à 390 Ko en 1280 px.
- ʻOumuamua : seule photographie authentique, un point lumineux au télescope William Herschel (domaine public) ; les vues d'artiste de la NASA restent en candidats.
- Apophis : image radar NASA, mais licence absente des métadonnées de Commons → refusée par prudence ; à valider à la main (les images JPL sont du domaine public).
- Deuxième passage : 0 téléchargement, les fichiers n'avaient pas changé.

Petits corps (rapport complet : `data/smallbodies-report.md`) :
- Borisov, ʻOumuamua : orbite de Kepler fidèle à moins de 0,2° sur toute la fenêtre affichée → éléments SBDB suffisants.
- Hale-Bopp : fidèle à 0,01° aujourd'hui, mais 4° au périhélie de 1997 (perturbée par Jupiter en 1996) → éléments valables seulement autour de leur époque.
- Apophis : fidèle à 0,02° jusqu'au 13 avril 2029, puis 60 à 90° d'écart : le passage près de la Terre change son orbite → vecteurs Horizons obligatoires autour et après 2029. CAD confirme 38 011 km du centre de la Terre (≈ 31 600 km de la surface) le 13 avril 2029 à 21 h 46 UTC.
- Halley : éléments SBDB de 1968 ; inutilisables pour 2061 (écart de plusieurs UA) → vecteurs Horizons sur toute l'orbite. Un point incohérent (1978) est à revérifier.

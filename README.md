<div align="center">

# ATLAS°

**Globe 3D Interactif — Explorateur Mondial de Pays**

[![Next.js](https://img.shields.io/badge/Next.js-14-black?logo=next.js)](https://nextjs.org)
[![Three.js](https://img.shields.io/badge/Three.js-0.170-black?logo=three.js)](https://threejs.org)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?logo=typescript&logoColor=white)](https://typescriptlang.org)
[![GSAP](https://img.shields.io/badge/GSAP-3.12-88CE02?logo=greensock&logoColor=white)](https://gsap.com)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](./LICENSE)

</div>

![Globe 3D — Afrique et Europe](public/screenshots/globe.png)

---

## À propos

ATLAS° est un explorateur mondial de pays construit autour d'un globe 3D WebGL.  
Le périmètre est celui des 193 États souverains (filtre `independent` de mledoze/countries). Chaque territoire est coloré depuis la couleur dominante de son drapeau national, calculée au build (k-means) et figée dans le GeoJSON. L'objectif est de prouver qu'une expérience de premier rang peut reposer entièrement sur des fondations statiques, ouvertes et sans backend propriétaire.

Projet personnel de [BADAROU Mouwafic](https://github.com/mouwaficbdr). Aucune vocation commerciale.

---

## Fonctionnalités

- **Globe interactif** — rotation libre, survol avec extrusion des pays, zoom caméra GSAP animé vers le pays sélectionné
- **Couleurs générées** — chaque pays porte la palette de son drapeau, calculée au build (k-means) et figée dans le GeoJSON
- **Fiche pays complète** — panneaux : démographie, gouvernance, capitale en temps réel, langues, monnaie, indicatif, domaine TLD, frontières voisines
- **Extrait Wikipedia** — résumé encyclopédique en français (cascade FR → EN, cache Next.js 24h), récupéré au build avec repli silencieux
- **Recherche instantanée** — palette Cmd+K, filtrée côté client sur les 193 États souverains, insensible aux accents et aux noms français
- **Navigation responsive** — globe WebGL sur desktop, index mobile avec recherche et navigation par continent
- **SSG pur** — 193 pages statiques pré-générées au build, zéro appel réseau en runtime pour les données pays
- **Badge GitHub Gravity Well** — lien magnétique avec anneau typographique rotatif (desktop uniquement)

---

## Aperçu

<table>
  <tr>
    <td width="50%">
      <img src="public/screenshots/country-hero.png" alt="Page pays — Hero" />
      <p align="center"><sub>Hero pays — palette générée depuis le drapeau</sub></p>
    </td>
    <td width="50%">
      <img src="public/screenshots/demography.png" alt="Panel Démographie" />
      <p align="center"><sub>Démographie — nuage de particules + données clés</sub></p>
    </td>
  </tr>
  <tr>
    <td width="50%">
      <img src="public/screenshots/governance-capital.png" alt="Gouvernance et capitale" />
      <p align="center"><sub>Régime politique, ambiance climatique et horloge locale en temps réel</sub></p>
    </td>
    <td width="50%">
      <img src="public/screenshots/language-currency.png" alt="Langues et monnaie" />
      <p align="center"><sub>Langues officielles et monnaie — fond issu du drapeau</sub></p>
    </td>
  </tr>
  <tr>
    <td width="50%">
      <img src="public/screenshots/network.png" alt="Réseau et communications" />
      <p align="center"><sub>Indicatif téléphonique, domaine TLD et partage</sub></p>
    </td>
    <td width="50%">
      <img src="public/screenshots/borders.png" alt="Frontières terrestres" />
      <p align="center"><sub>Frontières terrestres — pays voisins cliquables</sub></p>
    </td>
  </tr>
</table>

---

## Stack technique

| Couche | Technologie | Version |
|---|---|---|
| Framework | Next.js App Router + TypeScript | 14.2 / TS 5 |
| 3D / WebGL | Three.js + react-three-fiber | 0.170 / 8.17 |
| Animation | GSAP 3 + ScrollTrigger | 3.12 |
| État global | Zustand | 5.0 |
| Smooth scroll | Lenis | 1.1 |
| Contenu éditorial | MDX + next-mdx-remote | 6.0 |
| Triangulation | earcut | 3.0 |
| Tests | Vitest + fast-check | 4.1 |

**Sources de données**

| Source | Données | Accès |
|---|---|---|
| [mledoze/countries](https://github.com/mledoze/countries) | Noms FR, gentilés, capitale, monnaies, langues, indicatif, TLD, voisins, statut souverain | Vendoré dans `scripts/vendor/`, figé au build |
| [countries-and-timezones](https://www.npmjs.com/package/countries-and-timezones) | Fuseau IANA de la capitale (gère l'heure d'été) | Dépendance npm, utilisée à la génération |
| [Wikidata (SPARQL)](https://query.wikidata.org) | Forme de gouvernement (P122), libellé français | Vendoré dans `scripts/vendor/`, figé au build |
| [Natural Earth 110m](https://www.naturalearthdata.com) | Géométrie des frontières (GeoJSON) | Fichier statique, domaine public |
| [Wikipedia REST API](https://fr.wikipedia.org/api/rest_v1/) | Extraits encyclopédiques (cascade FR puis EN) | Récupéré au build, cache Next.js 24h, repli silencieux |
| MDX local | Articles éditoriaux par pays | `/content/countries/[cca3].mdx` |

Les données pays sont figées dans le dépôt (`public/data/countries-geo.json` + `scripts/vendor/`). Aucune base de données. Aucun backend propriétaire. Aucun appel réseau au runtime.

---

## Architecture

```
atlas/
├── app/
│   ├── layout.tsx              # RootLayout, fonts, providers
│   ├── page.tsx                # Page d'accueil (globe)
│   ├── opengraph-image.tsx     # Image OG générée (site + par pays)
│   ├── not-found.tsx           # 404 dans l'univers ATLAS
│   └── pays/[code]/page.tsx    # 193 pages SSG (une par État souverain)
├── components/
│   ├── globe/                  # GlobeScene, GlobeMesh, CountryMesh, shaders
│   ├── country/                # CountryCard et ses panneaux, CountryFooter
│   ├── ui/                     # SearchPalette, LoadingScreen, OffMapScreen...
│   └── layout/                 # PersistentLayout, Navigation, LenisProvider
├── lib/                        # search-engine, geojson-loader, i18n-country,
│                               #   format-coords, mood-resolver, og...
├── content/countries/          # Fichiers MDX éditoriaux ([cca3].mdx)
├── public/data/                # countries-geo.json (géométrie + propriétés figées)
├── scripts/                    # generate-geo.js, fetch-vendor-data.js, vendor/
└── shaders/                    # GLSL : ocean, atmosphere, country
```

**Flux de données**

1. **Vendoring** (manuel, hors build) — `scripts/fetch-vendor-data.js` fige mledoze/countries et la forme de gouvernement Wikidata dans `scripts/vendor/`
2. **Génération** (manuel, hors build) — `scripts/generate-geo.js` reconstruit `public/data/countries-geo.json` : filtre aux États souverains, noms FR, fuseaux IANA, indicatif, TLD, palette k-means, centroïde, passe géométrie
3. **Build** — `generateStaticParams` lit les 193 codes du GeoJSON et pré-génère toutes les routes ; seul l'extrait Wikipédia est récupéré en ligne (repli silencieux)
4. **Runtime SSG** — les données complètes de chaque pays sont injectées statiquement dans la page ; le client ne fait aucun appel réseau de données
5. **Client** — le GeoJSON est chargé une fois au montage du Globe et mis en cache en mémoire (singleton)

---

## Installation

```bash
git clone https://github.com/mouwaficbdr/atlas.git
cd atlas
npm install
npm run dev
```

L'application tourne sur [http://localhost:3000](http://localhost:3000).

**Build de production**

```bash
npm run build
npm start
```

> **Note** — Le build génère les 193 pages statiques via `generateStaticParams`. Les données pays sont figées dans le dépôt ; seul l'extrait Wikipédia est récupéré au build, avec repli silencieux si l'API est indisponible.

**Régénérer les données pays**

```bash
node scripts/fetch-vendor-data.js   # rafraîchit scripts/vendor/ (réseau)
node scripts/generate-geo.js        # reconstruit public/data/countries-geo.json (hors ligne)
```

---

## Tests

```bash
npm test           # vitest run
npm run test:watch # vitest (mode watch)
```

Les tests couvrent les fonctions critiques : moteur de recherche (fuzzy matching, insensibilité aux accents et aux noms français), formatage des coordonnées, vérificateur de contraste WCAG 2.1, et résolution d'ambiances pays.

---

## Licence

[MIT](./LICENSE) — BADAROU Mouwafic, 2026

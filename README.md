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
Chaque territoire est coloré depuis la couleur dominante de son drapeau national, calculée programmatiquement par l'algorithme median cut. L'objectif est de prouver qu'une expérience de premier rang peut reposer entièrement sur des fondations statiques, ouvertes et sans backend propriétaire.

Projet personnel de [BADAROU Mouwafic](https://github.com/mouwaficbdr). Aucune vocation commerciale.

---

## Fonctionnalités

- **Globe interactif** — rotation libre, survol avec extrusion des pays, zoom caméra GSAP animé vers le pays sélectionné
- **Couleurs générées** — chaque pays porte la palette de son drapeau, extraite côté client et mise en cache dans localStorage
- **Fiche pays complète** — 9+ panneaux : démographie, gouvernance, capitale en temps réel, langues, monnaie, indicatif, domaine TLD, frontières voisines
- **Extrait Wikipedia** — résumé encyclopédique en français (cascade FR → EN, cache Next.js 24h)
- **Recherche instantanée** — palette Cmd+K, filtrée côté client sur les 195 pays
- **Navigation responsive** — globe WebGL sur desktop, index mobile avec recherche et navigation par continent
- **SSG pur** — 195 pages statiques pré-générées au build, zéro appel réseau en runtime pour les données pays
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
| [REST Countries v3.1](https://restcountries.com) | Nom, drapeau, capitale, population, superficie, monnaies, langues, fuseaux, voisins | API REST publique, sans clé |
| [Natural Earth 110m](https://www.naturalearthdata.com) | Frontières géographiques GeoJSON | Fichier statique, domaine public |
| [Wikipedia REST API](https://en.wikipedia.org/api/rest_v1/) | Extraits encyclopédiques (FR puis EN) | API publique, cache 24h |
| MDX local | Articles éditoriaux par pays | `/content/countries/[cca3].mdx` |

Aucune base de données. Aucun backend propriétaire. Infrastructure 100% gratuite.

---

## Architecture

```
atlas/
├── app/
│   ├── layout.tsx              # RootLayout, fonts, providers
│   ├── page.tsx                # Page d'accueil (globe)
│   └── pays/[code]/page.tsx    # 195 pages SSG dynamiques
├── components/
│   ├── globe/                  # GlobeScene, GlobeMesh, CountryMesh, shaders
│   ├── country/                # CountryCard et ses 9 panneaux
│   ├── ui/                     # SearchPalette, LoadingScreen, GithubBadge...
│   └── layout/                 # PersistentLayout, Navigation, LenisProvider
├── lib/                        # color-extractor, search-engine, geojson-loader...
├── content/countries/          # Fichiers MDX éditoriaux ([cca3].mdx)
├── public/data/                # GeoJSON Natural Earth pré-enrichi
└── shaders/                    # GLSL : ocean, atmosphere, country
```

**Flux de données**

1. **Build** — `generateStaticParams` récupère les 195 codes via REST Countries et pré-génère toutes les routes
2. **Runtime SSG** — les données complètes de chaque pays sont injectées statiquement dans la page
3. **Client** — le GeoJSON est chargé une fois au montage du Globe et mis en cache en mémoire (singleton)
4. **Palette** — l'extraction median cut du drapeau est effectuée au premier rendu et mise en cache dans `localStorage`

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

> **Note** — Le build génère les 195 pages statiques via `generateStaticParams`. Une connexion internet est nécessaire au build pour contacter REST Countries API.

---

## Tests

```bash
npm test           # vitest run
npm run test:watch # vitest (mode watch)
```

Les tests couvrent les algorithmes critiques : extraction de couleur (median cut), moteur de recherche (fuzzy matching), vérificateur de contraste WCAG 2.1, et résolution d'ambiances pays.

---

## Licence

[MIT](./LICENSE) — BADAROU Mouwafic, 2026

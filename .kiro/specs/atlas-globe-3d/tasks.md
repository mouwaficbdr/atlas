The fan triangulation is fundamentally broken for concave polygons. I need to replace it with proper Earcut triangulation from Three.js. Let me rewrite CountryMesh completely:

Error(s) while creating

CountryMesh.tsx

aborted. The agent has seen this error and will try a different approach to write the file if needed.
A network error occurred. Please check your connection and try again.# Plan d'implémentation — ATLAS° Globe 3D Interactif

## Vue d'ensemble

Ce plan décompose le design ATLAS° en étapes de code incrémentales pour un agent de génération de code. Chaque tâche s'appuie sur les précédentes et se termine par l'intégration complète des composants. Le stack est **Next.js 14 App Router + TypeScript + react-three-fiber + GSAP + Lenis**.

---

## Tâches

- [x] 1. Initialisation du projet et configuration de base
  - Configurer Next.js 14 App Router avec TypeScript strict
  - Installer et configurer les dépendances : `@react-three/fiber`, `@react-three/drei`, `three`, `gsap`, `lenis`, `next-mdx-remote`, `fast-check`
  - Configurer webpack pour l'import des shaders GLSL via `raw-loader`
  - Créer `app/globals.css` et `styles/tokens.css` avec les variables CSS design tokens (`--bg-surface`, `--text-muted`, etc.)
  - Créer `lib/gsap-config.ts` : enregistrement des plugins GSAP (ScrollTrigger, CustomEase)
  - Créer la structure de répertoires : `components/globe/`, `components/country/`, `components/ui/`, `components/layout/`, `lib/`, `shaders/`, `content/countries/`, `public/geodata/`
  - _Exigences : 11.1, 11.5, 13.1_

- [x] 2. Modèles de données et utilitaires fondamentaux
  - [x] 2.1 Définir les interfaces TypeScript centrales
    - Créer `lib/types.ts` avec : `CountryData`, `CountryPalette`, `GeoJSONFeature`, `GeoJSONCollection`, `SearchResult`, `CountryMood`, `MDXContent`, `LoadingState`
    - _Exigences : 1.2, 3.2, 5.2, 8.2_

  - [x] 2.2 Implémenter `lib/countries-api.ts`
    - Fonction `fetchAllCountries(): Promise<CountryData[]>` appelant REST Countries API v3.1
    - Gestion d'erreur : throw explicite si l'API est indisponible (pour interrompre le build)
    - _Exigences : 3.5, 13.4_

  - [x] 2.3 Implémenter `lib/geojson-loader.ts`
    - Variable de module `cachedGeoJSON` (singleton)
    - Fonction `loadGeoJSON(): Promise<GeoJSONCollection>` avec cache mémoire
    - Chargement lazy (uniquement au montage du Globe)
    - _Exigences : 3.1, 11.2_

  - [x] 2.4 Implémenter `lib/contrast-checker.ts`
    - Fonction `getContrastRatio(fg: string, bg: string): number` (calcul luminance relative WCAG)
    - Fonction `adjustForContrast(color: string, bg: string, minRatio: number): string` (ajustement HSL)
    - _Exigences : 5.4, 12.1_

  - [x]* 2.5 Écrire les tests de propriété pour `contrast-checker`
    - **Propriété 1 : Symétrie du ratio de contraste** — `getContrastRatio(a, b) === getContrastRatio(b, a)` pour toute paire de couleurs hex valides
    - **Propriété 2 : Garantie de contraste après ajustement** — `getContrastRatio(adjustForContrast(fg, bg, r), bg) >= r` pour tout ratio cible `r` entre 1 et 21
    - **Valide : Exigences 5.4, 12.1**

  - [x] 2.6 Implémenter `lib/color-extractor.ts`
    - Fonction `extractPalette(flagSvgUrl: string, cca3: string): Promise<CountryPalette>`
    - Algorithme de quantification (médiane coupée sur canvas 2D) → 4 couleurs
    - Lecture/écriture localStorage sous la clé `atlas_palette_[cca3]`
    - Palette de repli si SVG indisponible
    - Appel à `adjustForContrast` pour garantir le ratio WCAG
    - _Exigences : 3.2, 5.2, 5.3, 5.4, 5.5_

  - [x]* 2.7 Écrire les tests de propriété pour `color-extractor`
    - **Propriété 3 : Idempotence du cache** — appeler `extractPalette` deux fois pour le même `cca3` retourne un objet identique (via localStorage)
    - **Propriété 4 : Contraste garanti sur la palette retournée** — `palette.contrastRatio >= 4.5` pour toute palette non-fallback
    - **Valide : Exigences 3.2, 5.4**

  - [x] 2.8 Implémenter `lib/mood-resolver.ts`
    - Fonction `resolveMood(country: CountryData): CountryMood`
    - Règles : Île → Continental → Polaire → Tropical (selon les critères de l'Exigence 6.10)
    - _Exigence : 6.10_

  - [x]* 2.9 Écrire les tests de propriété pour `mood-resolver`
    - **Propriété 5 : Exhaustivité** — `resolveMood` retourne toujours un `MoodType` valide parmi `['Île', 'Continental', 'Polaire', 'Tropical']` pour tout `CountryData` arbitraire
    - **Propriété 6 : Déterminisme** — `resolveMood(c) === resolveMood(c)` pour tout pays `c`
    - **Valide : Exigence 6.10**

  - [x] 2.10 Implémenter `lib/search-engine.ts`
    - Fonction `filterCountries(query: string, countries: CountryData[]): SearchResult[]`
    - Scoring : exact=3, préfixe=2, sous-chaîne=1 sur nom officiel, nom courant, capitale, cca3
    - Résultats triés par score décroissant, limités à 10
    - Exécution < 100ms sur 195 pays
    - _Exigences : 8.2, 8.3, 8.4_

  - [ ]* 2.11 Écrire les tests de propriété pour `search-engine`
    - **Propriété 7 : Stabilité du classement** — si `score(a) > score(b)`, alors `a` apparaît avant `b` dans les résultats pour toute requête
    - **Propriété 8 : Borne supérieure** — `filterCountries(q, countries).length <= 10` pour toute requête `q`
    - **Propriété 9 : Inclusion de la correspondance exacte** — si un pays a `name.common === q`, il apparaît en premier dans les résultats
    - **Valide : Exigences 8.2, 8.3, 8.4**

  - [x] 2.12 Implémenter `lib/mdx-loader.ts`
    - Fonction `loadMDX(cca3: string): Promise<MDXContent>`
    - Lecture du fichier `/content/countries/[cca3].mdx`
    - Retourne `source: null` si fichier absent ou malformé (sans throw)
    - Log d'erreur build si malformé
    - _Exigences : 7.1, 7.2, 7.4, 7.6_

- [x] 3. Checkpoint — Utilitaires fondamentaux
  - Vérifier que tous les tests de propriété passent, s'assurer que les types TypeScript compilent sans erreur. Demander à l'utilisateur si des questions se posent.

- [x] 4. Shaders GLSL et configuration Three.js
  - [x] 4.1 Créer les shaders atmosphère
    - `shaders/atmosphere.vert.glsl` : vertex shader avec calcul de la normale en espace vue
    - `shaders/atmosphere.frag.glsl` : fragment shader rim lighting, couleur `#4FC3F7`, opacité max 0,35
    - _Exigence : 1.4_

  - [x] 4.2 Créer `components/globe/StarField.tsx`
    - `THREE.Points` avec 10 000 particules réparties aléatoirement dans une sphère de rayon 500 unités
    - Matériau `THREE.PointsMaterial` avec taille et couleur adaptées
    - _Exigence : 1.1_

  - [x] 4.3 Créer `components/globe/AtmosphereMesh.tsx`
    - Sphère de rayon 1,05× le Globe
    - Matériau `THREE.ShaderMaterial` utilisant les shaders GLSL (4.1), blending additif
    - _Exigence : 1.4_

  - [x] 4.4 Créer `components/globe/GlobeControls.tsx`
    - `OrbitControls` de `@react-three/drei` avec `dampingFactor={0.85}` et `enableDamping`
    - Prop `enabled` pour désactiver pendant les animations caméra
    - Support tactile via `enableTouch`
    - _Exigences : 2.1, 2.4a, 2.5a_

- [x] 5. Composants Globe 3D
  - [x] 5.1 Créer `components/globe/CountryMesh.tsx`
    - Génération de géométrie extrudée depuis les polygones GeoJSON (projection sphérique)
    - Handlers `onPointerEnter` / `onPointerLeave` : extrusion 0,02–0,05u en 150ms ease-out/ease-in
    - Handler `onClick` : déclenchement animation caméra GSAP 1,2s power2.inOut
    - Attributs ARIA : `role="button"`, `aria-label="[Nom du pays]"`
    - _Exigences : 1.2, 1.3, 2.2, 2.3, 2.4a, 12.6_

  - [x] 5.2 Créer `components/globe/Tooltip.tsx`
    - Composant `Html` de `@react-three/drei` affiché au survol
    - Contenu : `Drapeau_SVG` + nom officiel du pays
    - Visible/masqué selon l'état de survol
    - _Exigence : 2.2_

  - [x] 5.3 Créer `components/globe/GlobeMesh.tsx`
    - Sphère principale avec 64×64 segments
    - Chargement GeoJSON via `lib/geojson-loader.ts` au montage
    - Rendu de tous les `CountryMesh` avec couleur extraite par `lib/color-extractor.ts` (fallback `#4A5568`)
    - `THREE.LineSegments` pour les frontières : matériau émissif `#FFFFFF`, opacité 0,4
    - Intégration `Tooltip`
    - _Exigences : 1.1, 1.2, 1.3_

  - [x] 5.4 Créer `components/globe/GlobeScene.tsx`
    - Canvas `@react-three/fiber` avec détection WebGL2 (fallback vers `SROnlyList`)
    - `THREE.LoadingManager` avec callbacks `onProgress` et `onLoad`
    - Caméra perspective, pixel ratio adaptatif (`Math.min(dpr, 2.0)` desktop / `Math.min(dpr, 1.5)` mobile)
    - Intégration `GlobeMesh`, `AtmosphereMesh`, `StarField`, `GlobeControls`
    - Attributs ARIA sur le canvas : `role="application"`, `aria-label="Globe interactif — Explorateur de pays"`
    - _Exigences : 1.1, 1.5, 1.6, 2.5b, 11.3, 12.2, 12.6_

- [x] 6. Checkpoint — Globe 3D
  - Vérifier que le Globe se rend correctement avec les pays colorés, les frontières, l'atmosphère et les étoiles. Tester l'extrusion au survol et le tooltip. Demander à l'utilisateur si des questions se posent.

- [x] 7. Composants UI globaux
  - [x] 7.1 Créer `components/ui/LoadingScreen.tsx`
    - Affichage coordonnées GPS révélées caractère par caractère (50ms/char, JetBrains Mono)
    - Cercle orbital animé (rotation 360° en 1,5s, boucle infinie)
    - Texte "Mapping the world..." en Bebas Neue avec pulsation opacité 0,6→1,0
    - Indicateur de progression numérique 0–100 (via `LoadingState.progress`)
    - Durée minimale 1,5s avant masquage
    - Fondu de sortie 400ms puis déclenchement séquence révélation Globe (3 étapes, 2s total)
    - _Exigences : 3.3, 3.4, 4.1, 4.2, 4.3, 4.4, 4.5_

  - [x] 7.2 Créer `components/ui/CustomCursor.tsx`
    - Masquage curseur natif via `cursor: none` sur `<body>` (desktop uniquement, `pointer: fine`)
    - Cercle SVG 12px suivant le pointeur avec lag 80ms via `gsap.quickSetter` + `requestAnimationFrame`
    - Mode réticule au survol du Globe
    - Effet magnétique sur éléments interactifs (amplitude max 8px, retour 200ms power2.out)
    - Désactivé sur mobile (`navigator.maxTouchPoints > 0`)
    - _Exigences : 10.1, 10.2, 10.3, 10.4, 10.5_

  - [x] 7.3 Créer `components/ui/SearchPalette.tsx`
    - Ouverture via Cmd+K / Ctrl+K et bouton dédié
    - Champ de saisie avec focus automatique à l'ouverture
    - Filtrage via `lib/search-engine.ts` (< 100ms), affichage max 10 résultats (drapeau + nom + région)
    - Navigation clavier : Tab, flèches haut/bas, Entrée, Échap
    - Animation vol caméra 800–1500ms selon distance angulaire à la sélection
    - Fermeture : Échap, sélection, clic extérieur → reset état + retour focus
    - Message "Aucun résultat pour [saisie]" si aucun match
    - Fond semi-transparent, palette flottante centrée
    - _Exigences : 8.1, 8.2, 8.3, 8.4, 8.5, 8.6, 8.7, 8.8, 8.9, 8.10, 12.3_

  - [x] 7.4 Créer `components/ui/SROnlyList.tsx`
    - Liste HTML `role="list"` avec 195 pays triés alphabétiquement
    - Chaque item : `role="listitem"` + lien `role="link"` vers `/pays/[cca3]`
    - Classe `sr-only` (masqué visuellement, accessible aux lecteurs d'écran)
    - Visible comme contenu principal si WebGL2 non supporté
    - _Exigences : 1.6, 12.2, 12.5_

- [x] 8. Composants Country — Données structurées
  - [x] 8.1 Créer `components/country/FlagDisplay.tsx`
    - Rendu du `Drapeau_SVG` avec animation d'entrée : fondu + translation verticale 20px → 0 en 600ms
    - _Exigence : 6.1_

  - [x] 8.2 Créer `components/country/PopulationCloud.tsx`
    - Nuage de particules : `min(max(10, round(population/worldPop * 500)), 500)` particules
    - _Exigence : 6.2_

  - [ ]* 8.3 Écrire les tests de propriété pour `PopulationCloud`
    - **Propriété 10 : Borne du nombre de particules** — le nombre de particules est toujours dans `[10, 500]` pour toute population arbitraire dans `[0, 1.5e10]`
    - **Valide : Exigence 6.2**

  - [x] 8.4 Créer `components/country/AreaRect.tsx`
    - Rectangle mis à l'échelle : `max(2%, area / 17_098_242 * 100%)` de la largeur du conteneur
    - _Exigence : 6.3_

  - [ ]* 8.5 Écrire les tests de propriété pour `AreaRect`
    - **Propriété 11 : Minimum visuel garanti** — la largeur calculée est toujours ≥ 2% pour toute superficie `area >= 0`
    - **Propriété 12 : Maximum borné** — la largeur calculée est toujours ≤ 100% pour toute superficie `area <= 17_098_242`
    - **Valide : Exigence 6.3**

  - [x] 8.6 Créer `components/country/CapitalClock.tsx`
    - Horloge temps réel (mise à jour toutes les secondes) affichant l'heure locale du fuseau horaire du pays
    - Indicateur visuel jour/nuit basé sur l'heure locale
    - _Exigence : 6.4_

  - [x] 8.7 Créer `components/country/LanguageList.tsx`
    - Affichage des langues en script natif avec `font-family` adapté, taille ≥ 1,2rem
    - _Exigence : 6.5_

  - [x] 8.8 Créer `components/country/CurrencyCard.tsx`
    - Monnaie avec effet 3D CSS : `perspective(500px) rotateY(15deg)`
    - Nom complet + code ISO 4217 + symbole
    - _Exigence : 6.6_

  - [x] 8.9 Créer `components/country/NeighborCards.tsx`
    - Cartes miniatures flottantes : `Drapeau_SVG` + nom du pays voisin
    - Clic → navigation vers `/pays/[cca3]` du voisin
    - Prefetch Next.js activé (`<Link prefetch={true}>`)
    - _Exigences : 6.7, 11.4, 12.4_

  - [x] 8.10 Créer `components/country/RegionBadge.tsx`
    - Badge couleur propre au continent + barre de progression (rang alphabétique dans la région)
    - _Exigence : 6.8_

  - [x] 8.11 Créer `components/country/TerminalInfo.tsx`
    - Indicatif téléphonique et TLD en JetBrains Mono, fond `--bg-surface`, bordure 1px `--text-muted`
    - _Exigence : 6.9_

  - [x] 8.12 Créer `components/country/MoodDisplay.tsx`
    - Affichage du `CountryMood` résolu via `lib/mood-resolver.ts`
    - _Exigence : 6.10_

  - [x] 8.13 Créer `components/country/MDXSection.tsx`
    - Rendu du contenu `MDXContent.source` via `next-mdx-remote`
    - Masqué si `source === null` (sans message d'erreur ni section vide)
    - _Exigences : 7.3, 7.4, 7.5_

  - [x] 8.14 Créer `components/country/Breadcrumb.tsx`
    - Fil d'Ariane : Globe → [Continent] → [Nom du pays]
    - Liens cliquables vers la page Globe et la liste du continent
    - _Exigence : 9.4_

  - [x] 8.15 Créer `components/country/ShareButton.tsx`
    - Copie de l'URL dans le presse-papier via Clipboard API
    - Confirmation visuelle 2 secondes
    - Fallback : champ texte sélectionnable si Clipboard API indisponible
    - _Exigences : 9.5, 9.6_

- [x] 9. Composant CountryCard — Assemblage
  - [x] 9.1 Créer `components/country/CountryCard.tsx`
    - Layout principal assemblant tous les sous-composants country (8.1–8.15)
    - Application de la `Palette_Pays` via variables CSS personnalisées au montage
    - Animations ScrollTrigger : apparition progressive de chaque section (fondu + translation 30px, stagger 100ms)
    - Intégration Lenis + `ScrollTrigger.scrollerProxy`
    - Navigation clavier complète (Tab, Entrée/Espace), ordre de tabulation logique
    - _Exigences : 5.3, 6.11, 6.12, 12.1, 12.4, 14.1, 14.2_

- [x] 10. Checkpoint — Fiche pays
  - Vérifier que la CountryCard affiche correctement les 12+ dimensions de données avec la palette dynamique et les animations ScrollTrigger. Demander à l'utilisateur si des questions se posent.

- [x] 11. Pages Next.js et génération statique
  - [x] 11.1 Créer `app/layout.tsx`
    - Chargement des polices : Bebas Neue, DM Sans Variable, JetBrains Mono Variable (woff2)
    - Initialisation Lenis globale
    - Montage `CustomCursor`
    - _Exigences : 10.1, 14.1_

  - [x] 11.2 Créer `app/page.tsx` (route `/`)
    - Montage `GlobeScene` + `LoadingScreen` + `SearchPalette`
    - _Exigences : 3.3, 3.4, 4.1–4.5_

  - [x] 11.3 Créer `app/pays/[code]/page.tsx`
    - `generateStaticParams` : récupération des 195 codes via `lib/countries-api.ts`, throw si API indisponible
    - `export const dynamic = 'force-static'`
    - Chargement des données pays + MDX au build
    - Métadonnées SEO : `<title>`, `<meta name="description">`, `og:title`, `og:description`, `og:image`, `<link rel="canonical">`
    - Montage `CountryCard`
    - _Exigences : 3.5, 5.1, 7.1, 7.2, 9.1, 9.2, 9.3, 9.7, 11.5, 13.1, 13.3, 13.4_

  - [x] 11.4 Créer `components/layout/Navigation.tsx`
    - Barre de navigation globale avec bouton d'ouverture de la `SearchPalette`
    - _Exigence : 8.1_

- [x] 12. Contenu éditorial MDX
  - [x] 12.1 Créer les fichiers MDX pour ≥ 20 pays
    - Créer `/content/countries/[CCA3].mdx` pour au minimum 20 pays au lancement
    - Chaque fichier inclut frontmatter (`title`, `description`, `author`, `date`) et contenu narratif
    - _Exigences : 7.6, 7.7_

- [x] 13. Assets et optimisation
  - [x] 13.1 Préparer et optimiser les assets statiques
    - Placer le fichier GeoJSON Natural Earth 110m minifié dans `public/geodata/ne_110m_admin_0_countries.geojson` (réduction ≥ 20% vs version non minifiée)
    - Placer les polices woff2 dans `public/fonts/`
    - Configurer Next.js pour la conversion WebP des images raster (qualité ≥ 80%)
    - _Exigences : 11.1_

- [x] 14. Checkpoint final — Intégration complète
  - Vérifier que tous les tests de propriété et tests unitaires passent. Vérifier la compilation TypeScript sans erreur. Tester le flux complet : chargement → Globe → sélection pays → CountryCard → recherche → partage. Demander à l'utilisateur si des questions se posent.

---

## Notes

- Les tâches marquées `*` sont optionnelles et peuvent être ignorées pour un MVP plus rapide
- Chaque tâche référence les exigences spécifiques pour la traçabilité
- Les tests de propriété utilisent `fast-check` avec un minimum de 100 itérations par propriété
- Format de tag PBT : `// Feature: atlas-globe-3d, Property N: [texte]`
- Les tests unitaires et de propriété sont complémentaires — les tests de propriété valident les invariants universels, les tests unitaires valident les cas concrets et cas limites
- Le pixel ratio adaptatif (2.0 desktop / 1.5 mobile) est critique pour les performances GPU
- La synchronisation Lenis + ScrollTrigger via `scrollerProxy` est requise pour les animations de la CountryCard

## Task Dependency Graph

```json
{
  "waves": [
    { "id": 0, "tasks": ["2.1"] },
    { "id": 1, "tasks": ["2.2", "2.3", "2.4", "2.8", "2.10", "2.12"] },
    { "id": 2, "tasks": ["2.5", "2.6", "2.9", "2.11"] },
    { "id": 3, "tasks": ["2.7", "4.1", "4.2"] },
    { "id": 4, "tasks": ["4.3", "4.4", "5.2", "7.4"] },
    { "id": 5, "tasks": ["5.1", "7.1", "7.2", "7.3"] },
    { "id": 6, "tasks": ["5.3", "8.1", "8.2", "8.4", "8.6", "8.7", "8.8", "8.10", "8.11", "8.12", "8.13", "8.14", "8.15"] },
    { "id": 7, "tasks": ["5.4", "8.3", "8.5", "8.9"] },
    { "id": 8, "tasks": ["9.1", "11.4", "12.1", "13.1"] },
    { "id": 9, "tasks": ["11.1", "11.2"] },
    { "id": 10, "tasks": ["11.3"] }
  ]
}
```

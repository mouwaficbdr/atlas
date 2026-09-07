# Plan de correction de l'audit ATLAS°

**Objectif :** corriger l'ensemble des findings de l'audit (QA / Product Designer / Ingénieur Frontend) sur la branche `fix/audit-findings`, en commits modulaires, puis une seule PR vers `main`.

**Spec :** l'audit complet livré en session (3 rôles, ~45 findings) + la vérification visuelle.

**Contraintes globales :**
- Jamais de tiret cadratin (— / –) dans le code, les commentaires, les messages de commit, la PR.
- Commits conventionnels, atomiques, impératif. Aucune attribution IA dans les commits ni la PR (règle absolue du profil).
- Trunk-based : tout sur `fix/audit-findings`, jamais de commit direct sur `main`. Rebase sur `origin/main` avant la PR.
- Vérif à chaque jalon : `npm run build` + `npm test` verts, plus contrôle visuel navigateur aux étapes sensibles (globe, page pays, 404).
- Pas de dépendance API tierce au runtime : toute donnée statique est figée dans `public/data/countries-geo.json` à la génération.

**Stack :** Next.js 14 App Router, React 18, Three.js / react-three-fiber, GSAP + Lenis, Vitest, SSG.

---

## Sources de données validées (toutes joignables, 200)

- `mledoze/countries` (`https://raw.githubusercontent.com/mledoze/countries/master/dist/countries.json`) : `translations.fra`, `idd`, `tld`, `timezones`, `latlng`, `area`, `landlocked`, `borders`, `currencies`, `languages`, `flags`, `population`, `independent`, `unMember`, `capitalInfo`.
- `countries-and-timezones` (npm) : `getCountry(cca2).timezones` -> zones IANA, la première = principale. Utilisé à la génération pour figer `primaryTimezone` (IANA) par pays.
- Wikidata SPARQL (`query.wikidata.org/sparql`) : forme de gouvernement (P122) en libellé FR, figée par pays. Repli si indisponible : heuristique requalifiée "indicative".

La géométrie reste celle de `public/data/countries-geo.json` (Natural Earth) ; seules les `properties` sont reconstruites, plus une passe géométrie (antiméridien + densification).

---

## Phase 0 — Préparation

- **C0.1** `perf: paralléliser les chargements indépendants de la page pays`
  Diff déjà présent en working tree (`Promise.all` dans `app/pays/[code]/page.tsx`). Le committer tel quel pour ne pas le perdre.
- **C0.2** `chore: ignorer le dossier .claude`
  Ajout `.claude/` à `.gitignore`.

## Phase 1 — Nettoyage (réduit la surface avant le gros oeuvre)

- **C1.1** `chore: supprimer le code mort`
  Supprimer `components/country/AreaRect.tsx`, `RegionBadge.tsx`, `TerminalInfo.tsx`, `CountryLoader.tsx` ; `lib/gsap-config.ts`. Vérifier zéro import résiduel (`grep`). Build + tests.
- **C1.2** `refactor: retirer le préchargement Wikipédia client inutilisé`
  Retirer `prefetchWikiSummary` / `getPreferredWikiTitle` de `components/globe/GlobeMesh.tsx` et `components/ui/SearchPalette.tsx`. Supprimer `lib/wiki-summary.ts` et `app/api/wiki-summary/route.ts`. Le résumé Wikipédia des pages reste géré au build via `unstable_cache` dans `page.tsx`. Build + tests.
- **C1.3** `chore: supprimer l'extracteur de palette client mort`
  Supprimer `lib/color-extractor.ts` et `lib/__tests__/color-extractor.test.ts` (les couleurs sont figées au build par `scripts/generate-geo.js`). Corriger le commentaire "195 pays" de `components/ui/SROnlyList.tsx`. Tests (12 restants verts).

## Phase 2 — Pipeline de données (fondation, débloque P4/P5/QA0/QA7/QA13/QA11/E10)

- **C2.1** `build: reconstruire le script de génération des données pays`
  Réécrire `scripts/generate-geo.js` :
  1. Lit la géométrie de `public/data/countries-geo.json` existant (features par `cca3`).
  2. Charge `mledoze/countries` (fichier vendored dans `scripts/vendor/mledoze-countries.json`, committé, pas d'appel réseau au build).
  3. Pour chaque feature, reconstruit `properties` : `name` (`common`, `official`, plus `nameFr` = `translations.fra.common`, `officialNameFr` = `translations.fra.official`), `cca2`, `cca3`, `capital`, `capitalFr`, `region`/`regionFr`, `subregion`/`subregionFr`, `latlng`, `area`, `landlocked`, `borders`, `population`, `languages`, `currencies`, `flags`, `idd`, `tld`, `timezones`, `primaryTimezone` (IANA via `countries-and-timezones`, vendored aussi), `governmentFr` (Wikidata, vendored en `scripts/vendor/gov-forms.json`), `independent`, `unMember`, `colors` (conservées), `centroid` (recalculé en float : centroïde pondéré par aire du plus grand anneau, repli centre de bbox).
  4. Passe géométrie : découpe des anneaux à l'antiméridien (saut de longitude > 180 entre deux points consécutifs) et densification des arêtes > 5 degrés par insertion de points intermédiaires (interpolation linéaire lon/lat suffisante à cette résolution).
  5. Filtre les features à `independent === true` (yield ~195, garde Taïwan/Kosovo, exclut dépendances et territoires inhabités type HMD/ATF).
  6. Écrit `public/data/countries-geo.json`.
  Scripts de vendoring : `scripts/fetch-vendor-data.js` (lancé manuellement, documenté, pas dans le build).
- **C2.2** `feat: régénérer public/data/countries-geo.json`
  Lancer le script, committer le JSON régénéré. Vérifier : ~195 features, présence de `nameFr`, `primaryTimezone`, `idd`, `tld` sur un échantillon (FRA, DEU, BRA, JPN, USA). `git diff --stat` raisonnable.
- **C2.3** `feat: étendre le type CountryData aux champs FR et enrichis`
  `lib/types.ts` : ajouter `nameFr`, `officialNameFr`, `capitalFr`, `regionFr`, `subregionFr`, `primaryTimezone`, `governmentFr`, `independent`, `unMember`. `cca2` déjà présent. Build (tsc) vert.

## Phase 3 — Exploiter les données FR (P4, P5)

- **C3.1** `feat: afficher les noms de pays en français`
  Helper `lib/i18n-country.ts` : `frName(c)`, `frOfficialName(c)`, `frCapital(c)`, `frRegion(c)` avec repli sur l'anglais. Brancher dans : `CountryCard` (h1, sous-titre), `NeighborCards`, `Breadcrumb`, `MobileExplorer`, `SearchPalette` (résultats), `SROnlyList`, `HolographicText` (label globe), `generateMetadata` (title/description/OG), `LanguageList` (noms de langues : garder le code ISO, la localisation des langues elles-mêmes est hors périmètre, noter en phase 2). Build + visuel page pays.
- **C3.2** `feat: cascade Wikipédia en français d'abord avec le vrai nom FR`
  `page.tsx` `getCachedWikiSummary` : essais dans l'ordre FR nom FR, FR nom officiel FR, FR nom commun EN, EN nom commun EN. Clé de cache `wiki-summary-v3`. Build.
- **C3.3** `test+feat: recherche insensible aux accents et aux noms FR`
  `lib/search-engine.ts` : normaliser requête et champs via `.toLowerCase().normalize('NFD').replace(/\p{Diacritic}/gu,'')`. Indexer aussi `nameFr` et `officialNameFr`. Test RED d'abord : `filterCountries('allemagne', ...)` -> Germany ; `filterCountries('bresil', ...)` -> Brazil ; `filterCountries('cote ivoire', ...)` -> Ivory Coast. Puis implémentation. `npm test`.

## Phase 4 — Corrections de données affichées (QA0, QA3, QA4/P8, QA7, QA13)

- **C4.1** `fix: figer indicatif, TLD et fuseau au lieu d'un appel API mort`
  `page.tsx` : supprimer `fetchCountryExtraData` (REST Countries v3.1 est déprécié, renvoie une erreur). `idd`, `tld`, `timezones`, `primaryTimezone` viennent désormais du JSON. Adapter `CountryCard` panneau 5 (plus de barres "—" géantes : si `idd`/`tld` absent, masquer proprement le bloc concerné plutôt que rendre un tiret en 12rem). Build + visuel `/pays/chn` (indicatif `+86`, TLD `.cn`).
- **C4.2** `fix: dériver l'hémisphère des coordonnées et formater en FR`
  Helper `lib/format-coords.ts` : `formatLat(v)` -> `"31,2304° S"` (valeur absolue, virgule FR, suffixe N/S), `formatLon(v)` -> `.../O`. Test RED : sud + ouest. Brancher dans `CountryCard` panneau 3 (supprimer les `° N` / `° E` en dur et l'espace parasite). `npm test` + visuel `/pays/bra`.
- **C4.3** `fix: forme de gouvernement factuelle`
  `PoliticalRegime` : consommer `country.governmentFr` (Wikidata, figé). Garder l'icône dérivée par mots-clés du libellé FR (`royaume`/`monarchie` -> couronne, `fédér` -> poignée de main, sinon monument). Repli si `governmentFr` absent : "Régime non renseigné" discret, pas d'invention. Supprimer la règle `state && !republic`. Build + visuel `/pays/usa` (doit afficher "République fédérale", pas "État Souverain").
- **C4.4** `fix: horloge capitale via fuseau IANA avec DST`
  `CapitalClock` : utiliser `country.primaryTimezone` (IANA) + `new Intl.DateTimeFormat('fr-FR', { timeZone, hour, minute, second })`. Supprimer le parsing regex d'offset et le décalage manuel de timestamp. Jour/nuit calculé depuis l'heure locale réelle. Repli `'UTC'` si `primaryTimezone` absent. Build + visuel (Paris = heure de Paris, pas Papeete).
- **C4.5** `fix: ambiance climatique honnête et requalifiée`
  `lib/mood-resolver.ts` : bandes de latitude absolue (Polaire > 60, Tempéré 35 à 60, Subtropical 23 à 35, Tropical < 23) + Île si `borders` vide et `area` < 100000. `CountryCard` / `MoodDisplay` : renommer l'intitulé "02 - CLIMAT & AMBIANCE" en "02 - AMBIANCE ESTIMÉE". Ajuster le test `mood-resolver.test.ts` (nouvelles bornes). `npm test`.

## Phase 5 — Routage, remount, cycle de vie (QA2, QA9, E5)

- **C5.1** `fix: 404 réel pour les codes pays inconnus`
  `app/pays/[code]/page.tsx` : `export const dynamicParams = false`. Build + `curl -o /dev/null -w "%{http_code}" /pays/zzz` -> 404.
- **C5.2** `fix: remonter la fiche pays à chaque changement de pays`
  `page.tsx` : `<CountryCard key={params.code} ... />`. `CountryCard` : `useEffect` de reset `window.scrollTo(0,0)` au montage ; s'assurer que `ScrollTrigger.getAll().forEach(t => t.kill())` s'exécute au démontage (déjà présent, vérifier qu'il couvre `NeighborCards` et `LanguageList`). `NeighborCards` / `LanguageList` : ajouter le cleanup `ScrollTrigger` de leur propre `useEffect`. Build + visuel : naviguer voisin -> voisin, la page doit repartir du haut avec le titre plein.

## Phase 6 — Accessibilité et motion (P1, E4, E6)

- **C6.1** `feat: respecter prefers-reduced-motion`
  `app/globals.css` : `@media (prefers-reduced-motion: reduce)` global (transitions et animations ~0, `scroll-behavior: auto`). Hook `lib/hooks/useReducedMotion.ts` (`matchMedia`). Gater : `LenisProvider` (ne pas instancier Lenis), `CountryCard` / `FlagDisplay` / `LanguageList` / `NeighborCards` / `GlobeOnboarding` (pas de GSAP d'entrée, états finaux directs), boucles r3f (`useFrame` early-return dans `GlobeMesh`, `BordersMesh`, `HolographicText`, `MoodBackground`, `PopulationCloud`, `CurrencyCard` : rotation figée). Build + test manuel via DevTools "Emulate prefers-reduced-motion".
- **C6.2** `fix: focus clavier visible et cibles focusables`
  `app/globals.css` : `:focus-visible { outline: 2px solid var(--text-accent); outline-offset: 2px }` global ; retirer les `outline: none` des inputs de recherche (ou les remplacer par un ring). `SearchPalette` + `MobileExplorer` : résultats en `<button type="button">` (ou `role="option"` dans `role="listbox"` avec `aria-activedescendant`), navigables au clavier (la logique flèches/Enter existe déjà dans `SearchPalette`, la compléter et l'exposer). `GlobeScene` : `<Canvas tabIndex={0}>` + `aria-keyshortcuts`. Build + test clavier (Tab, flèches).
- **C6.3** `refactor: unifier les easings et la hiérarchie du motion`
  `styles/tokens.css` : `--ease-signature: cubic-bezier(0.16,1,0.3,1)` ; `--ease-ui: cubic-bezier(0.25,0.46,0.45,0.94)`. Remplacer les easings ad hoc (`back.out(1.7)`, `power3.out`, etc.) par ces deux courbes dans les composants pays. Réduire les entrées : garder l'entrée du hero (titre pays) comme unique moment fort, passer `FlagDisplay` / `LanguageList` / `NeighborCards` en simple fade + translate 12px / 200ms. Build + visuel.

## Phase 7 — Diète WebGL (E1, E2, P9)

- **C7.1** `perf: charger la stack 3D en import dynamique`
  `next/dynamic` `{ ssr: false }` pour `GlobeScene` (dans `PersistentLayout`), `MoodBackground`, `PopulationCloud`, `CurrencyCard` (dans `CountryCard`). Monter `GlobeScene` uniquement si `!isMobile && countries.length > 0`. Build + vérifier le premier bundle (moins de three dans le chunk d'entrée).
- **C7.2** `perf: geler le globe hors du mode globe`
  `GlobeScene` `<Canvas frameloop={cameraMode === 'globe' ? 'always' : 'demand'}>`. Vérifier qu'aucun `useFrame` ne casse en `demand`. Build + visuel : sur une fiche pays, le GPU du globe retombe.
- **C7.3** `perf: ne monter les canvas de section que visibles + pièce en CSS`
  `PopulationCloud` : `<Canvas frameloop="demand">` + monter via `IntersectionObserver` (composant `lib/hooks/useInView.ts`). `CurrencyCard` : remplacer la pièce `<Canvas>` par un disque CSS 3D (`transform: rotateY` en boucle CSS, coupé par `prefers-reduced-motion`) + symbole. Build + visuel panneau 4 (pièce nette, pas de disque brun).
- **C7.4** `fix: libérer les ressources GPU restantes`
  Cleanup `.dispose()` (geometry, material, texture) dans `MoodBackground`, `PopulationCloud`, `BordersMesh`, `CountryMesh`. Build.

## Phase 8 — Univers, 404, partages, pied de page (P7, QA1, QA14, P14, E16, QA8, P12)

- **C8.1** `feat: pages 404 et erreur dans l'univers ATLAS`
  `app/not-found.tsx`, `app/pays/[code]/not-found.tsx`, `app/error.tsx` (`'use client'`), `app/global-error.tsx`. Fond `#0a0a14`, mono, un mot fort, lien "Retour au globe". `prefers-reduced-motion` respecté. Le `LoadingScreen` de `PersistentLayout` ne doit pas rester bloqué sur une route not-found : ajouter une garde (si `notFound`, forcer `phase: 'complete'`). Build + visuel `/pays/zzz`.
- **C8.2** `feat: images Open Graph generées`
  `app/opengraph-image.tsx` + `app/twitter-image.tsx` (1200x630, `next/og ImageResponse`, fond ATLAS + titre). `app/pays/[code]/opengraph-image.tsx` (drapeau + nom FR + 2-3 données clés). Retirer `/og-image.png` de `app/layout.tsx` (`metadata.openGraph.images` / `twitter.images`) et des pages pays (retirer les `width/height` mensongers du drapeau). Build + `curl -I /opengraph-image` -> 200 image/png.
- **C8.3** `feat: pied de page des fiches pays`
  Composant `components/country/CountryFooter.tsx` : "Retour au globe" (grand), un pays au hasard "Continuer l'exploration ->", signature "ATLAS° - BADAROU Mouwafic - MIT". Monté en fin de `CountryCard`. Archétype large-type. Build + visuel bas de `/pays/chn`.
- **C8.4** `fix: styliser le contenu éditorial MDX`
  `MDXSection` : composants MDX custom (`p` avec `margin-bottom`, `h2`/`h3` rythmés, lettrine sur le premier `p` via `::first-letter`), `max-width: 68ch`, interligne 1.7, plus de `text-align: justify`. Build + visuel `/pays/chn`.
- **C8.5** `fix: masquer les sections et métriques vides`
  `CountryCard` : ne rendre le bloc "08 / ARCHIVES" (titre inclus) que si `mdxContent.source`. Retirer la 4e colonne "TENDANCE GLOBALE / CROISSANCE" du panneau 2 (passage 4 -> 3 colonnes, ajuster `.panel-2-stats` en CSS). Build + visuel (page sans MDX, ex. `/pays/nga` si NGA garde son MDX ; sinon un pays sans MDX).
- **C8.6** `feat: partage natif sur mobile`
  `ShareButton` : `navigator.share({ title, url })` si disponible, repli `navigator.clipboard`, repli input. Build.

## Phase 9 — Onboarding, curseur, audio, chargement, fil d'Ariane (P2, P3, P6, QA5, P13, QA6)

- **C9.1** `fix: onboarding du globe déclenché par l'inactivité et rejouable une fois`
  `GlobeOnboarding` : afficher le premier hint après 2s SANS interaction (écoute `pointerdown` / `wheel` / `keydown` sur le canvas) ; masquer dès la première interaction ; `localStorage` (`atlas_onboarding_seen`) au lieu de `sessionStorage` ; hint unique combiné, dismissable (petit `x`). Build.
- **C9.2** `fix: remplacer la modale "revenez sur desktop" par un bandeau discret`
  `DesktopExperienceSuggestion` : bandeau bas non bloquant, une seule fois (`localStorage`), dismissable ; pas de `backdrop-filter` animé. Ou suppression si le globe mobile allégé (phase 2) le rend inutile ; pour l'instant : bandeau. Build.
- **C9.3** `fix: retirer le curseur custom`
  Supprimer `components/ui/CustomCursor.tsx` et son montage dans `app/layout.tsx`. Garder le `cursor: grab/grabbing` du `<Canvas>` du globe. Nettoyer la règle `@media (pointer: coarse)` devenue inutile dans `globals.css`. Build + visuel (plus de carré pointillé parasite).
- **C9.4** `fix: retirer l'audio d'ambiance`
  Supprimer `components/country/MoodAudio.tsx` et son montage dans `CountryCard`. Retirer `howler` de `package.json` si plus utilisé. (Ré-intégration propre prévue en phase 2 : fichiers locaux + toggle son + `localStorage`, jamais d'autoplay.) Build.
- **C9.5** `fix: durée minimale de chargement une seule fois`
  `PersistentLayout` : n'appliquer le `minDuration` de 1500ms qu'à la première visite (`sessionStorage` `atlas_loaded_once`) ; sinon révéler dès `assetsLoaded`. Build.
- **C9.6** `fix: fil d'Ariane sans lien continent inopérant`
  `Breadcrumb` : le continent devient du texte simple (le lien `/?continent=` ne filtrait rien). Garder le lien "Globe". (Filtre par région réel prévu en phase 2.) Build.

## Phase 10 — Sécurité, périmètre, finitions (E12, QA11, E13, E14, E15)

- **C10.1** `fix: CSP resserrée cohérente avec le SSG pur`
  `next.config.mjs` : plus aucun `fetch` client vers un tiers, donc `connect-src 'self'` suffit ; garder `img-src 'self' data: https://flagcdn.com` ; retirer `media-src` non nécessaire (audio supprimé). Vérifier en prod (`next build && next start`) que rien n'est bloqué (console navigateur propre).
- **C10.2** `fix: périmètre aux États souverains`
  Déjà appliqué au JSON en C2.1 (filtre `independent === true`). Ici : vérifier que `generateStaticParams`, le globe, la recherche et les voisins sont tous cohérents (~195), et que le README + les métadonnées "195 pays" collent. Corriger le README (section "Fonctionnalités" et "Architecture") : préciser "États souverains", retirer la mention d'extraction de palette client (fausse), documenter la régénération des données (`scripts/fetch-vendor-data.js` puis `scripts/generate-geo.js`).
- **C10.3** `fix: divers r3f et cleanup`
  `PopulationCloud` / `CurrencyCard` : retirer les `<perspectiveCamera>` enfants inertes (ou `makeDefault`). `CameraTransition` / `HolographicText` : commenter l'ordre `centroid` = `[lon,lat]` vs `latlng` = `[lat,lng]` ou aligner. `LoadingScreen` : `const t = gsap.to(...); return () => t.kill()`. `GlobeControls` : corriger le commentaire `dampingFactor` (0.05) ; ne traiter les flèches que si `cameraMode === 'globe'`. `useIsMobile` + `LenisProvider` : breakpoint unique partagé (`lib/constants.ts` `MOBILE_BREAKPOINT = 768`). Build + tests.

## Phase 11 — Vérification finale et PR

- **C11.1** `test: garde anti-régression sur les correctifs de données`
  Tests légers : `format-coords` (sud/ouest), `search-engine` (accents + FR), `i18n-country` (repli), `mood-resolver` (nouvelles bandes). `npm test` vert.
- **Vérif build prod** : `npm run build` vert, 195 pages générées, pas d'erreur de fetch au build.
- **Vérif visuelle** (navigateur, dev + `next start`) : home + globe, une fiche pays complète (scroll des 5 panneaux + pied de page), `/pays/zzz` (404 brandé), recherche "allemagne", `prefers-reduced-motion`, focus clavier.
- **Rebase** sur `origin/main`, résoudre les éventuels conflits.
- **PR unique** `fix/audit-findings` -> `main` : titre `fix: corriger l'ensemble des findings de l'audit QA / design / frontend`, corps = liste des lots par phase, aucune mention d'IA. Laisser Vercel déployer.

---

## Reporté explicitement en "phase 2" (améliorations, pas des correctifs)

Traité dans un second temps, après cette PR : globe photoréaliste (textures, relief, jour/nuit, nuages, shaders atmosphériques physiques), expérience mobile 3D allégée réelle, son d'interaction propre (toggle + fichiers locaux), curseur signature refait, filtre par région réel, localisation des noms de langues, transitions de page `startViewTransition`, direction artistique du hero (typo de fonderie, kinetic type), palette drapeau harmonisée (rampe maîtrisée plutôt que couleur brute). Voir la section dédiée du rapport d'audit.

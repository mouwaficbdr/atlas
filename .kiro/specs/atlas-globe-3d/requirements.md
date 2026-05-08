# Document de Spécifications — ATLAS° Globe 3D Interactif

## Introduction

ATLAS° est un explorateur mondial de pays sous forme de globe 3D interactif, développé par BADAROU Mouwafic en tant que projet de portfolio personnel. L'application combine une expérience visuelle premium (Three.js, WebGL2, GSAP) avec des données géographiques riches (REST Countries API v3.1, Natural Earth GeoJSON) pour offrir une interface de découverte culturelle et géographique à destination du grand public, des recruteurs tech et de la communauté design/dev.

L'application est construite avec Next.js 14 (App Router, TypeScript), déployée sur Vercel, et vise des distinctions Awwwards/CSS Design Awards.

---

## Glossaire

- **Globe** : La sphère WebGL interactive rendue via Three.js, représentant la Terre.
- **Renderer** : Le moteur de rendu WebGL2 Three.js responsable de l'affichage du Globe.
- **GeoJSON_Loader** : Le module responsable du chargement et de la mise en cache des données Natural Earth GeoJSON.
- **Color_Extractor** : Le module d'extraction de la palette de couleurs dominantes depuis le drapeau SVG d'un pays via canvas 2D.
- **Country_Card** : La fiche pays affichant les données détaillées d'un pays sélectionné.
- **Search_Palette** : La palette de recherche flottante de type command palette.
- **MDX_Renderer** : Le module de rendu des articles éditoriaux au format MDX via next-mdx-remote.
- **Loading_Screen** : La séquence d'animation de chargement initiale.
- **Camera** : La caméra Three.js contrôlant le point de vue sur le Globe.
- **OrbitControls** : Le contrôleur de rotation/zoom de la caméra Three.js.
- **Cursor** : Le curseur personnalisé animé via GSAP.
- **Breadcrumb** : Le fil d'Ariane de navigation (Globe → Continent → Pays).
- **REST_Countries_API** : L'API externe REST Countries v3.1 fournissant les données des 195 pays.
- **Static_Generator** : Le module Next.js responsable de la génération statique des 195 pages pays via `generateStaticParams`.
- **ScrollTrigger** : Le plugin GSAP gérant les animations déclenchées au défilement.
- **Lenis** : La bibliothèque de défilement fluide.
- **Pays** : L'une des 195 entités géographiques reconnues par REST Countries API v3.1.
- **Code_Alpha3** : Le code ISO 3166-1 alpha-3 identifiant un pays (ex : `BEN` pour le Bénin).
- **Drapeau_SVG** : L'image vectorielle du drapeau d'un pays, fournie par REST Countries API.
- **Palette_Pays** : L'ensemble de 4 couleurs (primaire, secondaire, accent, fond) générées depuis le Drapeau_SVG d'un pays.
- **Tooltip** : L'infobulle affichée au survol d'un pays sur le Globe.
- **TTI** : Time To Interactive — délai entre la requête initiale et l'interactivité complète de la page.
- **FPS** : Frames Per Second — nombre d'images rendues par seconde.
- **WCAG** : Web Content Accessibility Guidelines — référentiel d'accessibilité web.
- **og:tags** : Balises Open Graph pour le partage sur les réseaux sociaux.
- **MDX** : Format Markdown étendu avec composants JSX, utilisé pour les articles éditoriaux.

---

## Exigences

### Exigence 1 — Globe 3D interactif : rendu et apparence

**User Story :** En tant que visiteur, je veux voir un globe terrestre 3D visuellement immersif, afin de vivre une expérience de découverte géographique premium dès l'arrivée sur le site.

#### Critères d'acceptation

1. THE Renderer SHALL afficher le Globe sous forme de sphère WebGL2 avec un minimum de 64 segments de latitude et 64 segments de longitude, accompagnée d'un fond spatial composé exactement de 10 000 particules étoiles (THREE.Points) réparties aléatoirement dans une sphère de rayon 500 unités.
2. THE Renderer SHALL appliquer à chaque pays une couleur de remplissage correspondant à la couleur dominante extraite de son Drapeau_SVG via le Color_Extractor ; si l'extraction échoue pour un pays donné, THE Renderer SHALL appliquer la couleur de repli `#4A5568`.
3. THE Renderer SHALL afficher les frontières géographiques issues du GeoJSON Natural Earth 110m sous forme d'arêtes lumineuses (THREE.LineSegments) avec un matériau émissif de couleur `#FFFFFF` et une opacité de 0,4.
4. THE Renderer SHALL afficher une atmosphère autour du Globe via un shader GLSL rim lighting appliqué à une sphère secondaire de rayon 1,05 fois celui du Globe, avec un matériau additif semi-transparent produisant un halo de couleur `#4FC3F7` et d'opacité maximale 0,35.
5. WHILE le Globe est affiché sur un navigateur Chrome desktop de gamme intermédiaire (GPU intégré Intel UHD 620 ou équivalent), THE Renderer SHALL maintenir un taux de rendu moyen supérieur ou égal à 55 FPS mesuré sur une fenêtre glissante de 60 images.
6. WHERE le navigateur ne supporte pas WebGL2 au chargement de la page, THE Renderer SHALL masquer le canvas WebGL et afficher à la place une liste HTML des 195 pays triés alphabétiquement, chacun étant un lien vers sa Country_Card.

---

### Exigence 2 — Globe 3D interactif : interaction utilisateur

**User Story :** En tant que visiteur, je veux interagir librement avec le globe (rotation, survol, sélection), afin d'explorer les pays de manière intuitive et engageante.

#### Critères d'acceptation

1. WHEN l'utilisateur clique et fait glisser sur le Globe, THE OrbitControls SHALL faire pivoter le Globe librement avec un facteur d'amortissement (damping) de 0,85, produisant une décélération progressive après relâchement du pointeur.
2. WHEN l'utilisateur survole un pays sur le Globe, THE Globe SHALL extruder la géométrie du pays survolé d'une hauteur comprise entre 0,02 et 0,05 unités Three.js en 150 ms (easing ease-out), et afficher un Tooltip contenant le Drapeau_SVG et le nom officiel du pays.
3. WHEN l'utilisateur cesse de survoler un pays, THE Globe SHALL rétracter la géométrie extrudée à sa position d'origine en 150 ms (easing ease-in) et masquer le Tooltip.
4a. WHEN l'utilisateur sélectionne un pays sur le Globe, THE Camera SHALL effectuer une animation GSAP de déplacement vers le pays sélectionné en 1,2 secondes (easing power2.inOut), et THE OrbitControls SHALL être désactivés pendant toute la durée de cette animation.
4b. WHEN l'animation de la Camera vers le pays sélectionné est terminée, THE Globe SHALL déclencher la transition vers la Country_Card du pays.
5a. WHILE l'application s'exécute sur un appareil mobile (détecté via `navigator.maxTouchPoints > 0`), THE OrbitControls SHALL supporter la rotation tactile via les événements `touchstart`, `touchmove` et `touchend`.
5b. WHILE l'application s'exécute sur un appareil mobile, THE Renderer SHALL adapter le pixel ratio de rendu à `Math.min(window.devicePixelRatio, 2.0)` avec un minimum de 1,0, afin de limiter la charge GPU.

---

### Exigence 3 — Chargement des données géographiques

**User Story :** En tant que visiteur, je veux que le globe se charge rapidement et de manière fiable, afin de ne pas attendre et de profiter immédiatement de l'expérience.

#### Critères d'acceptation

1. THE GeoJSON_Loader SHALL charger les données Natural Earth GeoJSON depuis `/public/geodata/ne_110m_admin_0_countries.geojson` une seule fois au montage du composant Globe et les conserver dans une variable de module (cache mémoire) pour toute la durée de la session ; les appels suivants au GeoJSON_Loader SHALL retourner les données en cache sans déclencher de nouvelle requête réseau.
2. THE Color_Extractor SHALL stocker chaque Palette_Pays calculée dans le localStorage du navigateur sous la clé `atlas_palette_[Code_Alpha3]` (ex : `atlas_palette_BEN`) ; WHEN le Color_Extractor est invoqué pour un pays dont la clé existe déjà dans le localStorage, THE Color_Extractor SHALL retourner la palette stockée sans recalcul.
3. WHILE le chargement des assets Three.js est en cours, THE Loading_Screen SHALL afficher un indicateur de progression numérique (pourcentage entier de 0 à 100) mis à jour à chaque événement `onProgress` du THREE.LoadingManager.
4. WHEN l'événement `onLoad` du THREE.LoadingManager est déclenché, THE Loading_Screen SHALL démarrer une séquence de révélation du Globe composée de trois étapes séquentielles : (a) apparition du fond spatial en fondu sur 500 ms, (b) apparition des étoiles en fondu sur 500 ms, (c) apparition du Globe en rotation depuis une opacité 0 vers 1 sur 1 000 ms — durée totale de la séquence : 2 000 ms.
5. THE Static_Generator SHALL pré-générer les 195 pages pays au build via `generateStaticParams` en récupérant la liste des codes pays depuis REST Countries API, de sorte que le TTI mesuré par Lighthouse sur une connexion 4G simulée (10 Mbps, 40 ms RTT) soit inférieur ou égal à 4 secondes.

---

### Exigence 4 — Séquence de chargement premium

**User Story :** En tant que visiteur, je veux voir une animation de chargement soignée, afin que l'attente initiale soit elle-même une expérience visuelle mémorable.

#### Critères d'acceptation

1. WHILE le chargement initial est en cours, THE Loading_Screen SHALL afficher des coordonnées GPS au format `±DD.DDDD°, ±DDD.DDDD°` en les révélant caractère par caractère à raison d'un caractère toutes les 50 ms, en police JetBrains Mono.
2. WHILE le chargement initial est en cours, THE Loading_Screen SHALL afficher un cercle orbital animé effectuant une rotation complète de 360° en 1,5 seconde, en boucle infinie.
3. WHILE le chargement initial est en cours, THE Loading_Screen SHALL afficher le texte "Mapping the world..." en police Bebas Neue avec une animation de pulsation (opacité oscillant entre 0,6 et 1,0).
4. THE Loading_Screen SHALL rester visible pendant une durée minimale de 1,5 seconde, même si le chargement des assets se termine avant ce délai, afin de garantir la perception de l'animation.
5. WHEN le chargement est terminé ET que la durée minimale de 1,5 seconde est écoulée, THE Loading_Screen SHALL se masquer via un fondu sur l'opacité de 1 vers 0 en 400 ms, puis déclencher la séquence de révélation du Globe définie en Exigence 3, critère 4.

---

### Exigence 5 — Fiche pays : transition et palette

**User Story :** En tant que visiteur, je veux accéder à une fiche pays détaillée avec une transition fluide depuis le globe, afin de ne pas ressentir de rupture dans l'expérience.

#### Critères d'acceptation

1. WHEN la transition vers une Country_Card est déclenchée, THE Camera SHALL effectuer une animation GSAP de zoom vers le pays sélectionné en 600 ms (easing power2.inOut), la navigation vers la route `/pays/[Code_Alpha3]` SHALL être effectuée via le router Next.js sans rechargement de page, et l'URL SHALL être mise à jour dans la barre d'adresse du navigateur.
2. WHEN un pays est sélectionné, THE Color_Extractor SHALL générer une Palette_Pays composée de 4 couleurs (primaire, secondaire, accent, fond) depuis le Drapeau_SVG du pays en utilisant un algorithme de quantification des couleurs dominantes (ex : médiane coupée ou k-means sur les pixels du canvas 2D).
3. WHEN la Palette_Pays est disponible, THE Country_Card SHALL appliquer les couleurs de la Palette_Pays aux arrière-plans, couleurs de texte, bordures et accents de tous ses éléments visuels via des variables CSS personnalisées.
4. IF la Palette_Pays générée produit un ratio de contraste inférieur à 4,5:1 entre la couleur de texte et l'arrière-plan pour le texte normal (< 18px non gras ou < 14px gras), THEN THE Color_Extractor SHALL ajuster automatiquement la luminosité de la couleur de texte jusqu'à atteindre un ratio de contraste d'au moins 4,5:1 ; pour le texte large (≥ 18px non gras ou ≥ 14px gras), le ratio minimal est de 3:1.
5. IF le Drapeau_SVG d'un pays est indisponible au moment de la génération de la Palette_Pays, THEN THE Color_Extractor SHALL utiliser la palette de repli suivante : primaire `#1E3A5F`, secondaire `#2D5986`, accent `#4A90D9`, fond `#0A0A14`.

---

### Exigence 6 — Fiche pays : données affichées

**User Story :** En tant que visiteur, je veux consulter au moins 12 dimensions de données sur un pays, afin d'en avoir une compréhension riche et multidimensionnelle.

#### Critères d'acceptation

1. WHEN la Country_Card est montée, THE Country_Card SHALL afficher le Drapeau_SVG du pays avec une animation d'entrée en fondu et translation verticale de 20px vers sa position finale, d'une durée de 600 ms.
2. THE Country_Card SHALL afficher la population du pays sous forme de nuage de particules dont le nombre de particules est proportionnel à la population relative du pays par rapport à la population mondiale totale, avec un minimum de 10 particules et un maximum de 500 particules.
3. THE Country_Card SHALL afficher la superficie du pays sous forme d'un rectangle mis à l'échelle par rapport à la superficie de la Russie (17 098 242 km² = 100% de la largeur maximale du conteneur), avec un minimum visuel de 2% de la largeur pour les pays de très petite superficie.
4. THE Country_Card SHALL afficher la capitale et le fuseau horaire du pays accompagnés d'une horloge analogique ou numérique affichant l'heure locale en temps réel (mise à jour toutes les secondes) avec un indicateur visuel du cycle jour/nuit basé sur l'heure locale.
5. THE Country_Card SHALL afficher les langues officielles du pays avec leur nom dans leur script natif (ex : "العربية" pour l'arabe, "中文" pour le chinois) en utilisant la propriété CSS `font-family` adaptée à chaque script, avec une taille de police d'au moins 1,2rem.
6. THE Country_Card SHALL afficher la monnaie du pays avec son symbole rendu via une transformation CSS `perspective(500px) rotateY(15deg)` produisant un effet 3D, accompagné du nom complet et du code ISO 4217.
7. WHEN l'utilisateur clique sur une carte miniature de pays voisin, THE Country_Card SHALL afficher les pays voisins sous forme de cartes miniatures flottantes contenant le Drapeau_SVG et le nom du pays voisin, et déclencher la navigation vers la Country_Card du pays voisin cliqué.
8. THE Country_Card SHALL afficher la région et la sous-région du pays sous forme d'un badge de couleur propre au continent, accompagné d'une barre de progression dont la valeur représente le rang alphabétique du pays parmi les pays de sa région (ex : 3ème sur 54 pays d'Afrique = 5,6%).
9. THE Country_Card SHALL afficher l'indicatif téléphonique international (préfixe `+`) et le domaine internet de premier niveau (TLD) du pays en police JetBrains Mono avec un fond de couleur `--bg-surface` et une bordure de 1px de couleur `--text-muted`, évoquant un style terminal.
10. THE Country_Card SHALL afficher une ambiance visuelle "Mood" dérivée des données REST Countries API selon les règles suivantes : insulaire (si `borders` est vide et `area` < 100 000 km²) → ambiance "Île", enclavé (si `borders` contient ≥ 3 voisins et pas d'accès mer) → ambiance "Continental", région "Polar" (si `latlng[0]` > 60 ou < -60) → ambiance "Polaire", sinon → ambiance "Tropical" par défaut.
11. WHEN l'utilisateur fait défiler la Country_Card, THE ScrollTrigger SHALL déclencher l'apparition progressive de chaque section de données avec un délai de 100 ms entre chaque section, en utilisant une animation de fondu et translation verticale de 30px.
12. THE Country_Card SHALL afficher au minimum 12 dimensions de données distinctes issues des critères 1 à 10 ci-dessus.

---

### Exigence 7 — Articles éditoriaux MDX

**User Story :** En tant que visiteur, je veux lire des articles éditoriaux sur certains pays, afin d'obtenir un contenu subjectif et narratif complémentaire aux données brutes.

#### Critères d'acceptation

1. THE MDX_Renderer SHALL lire les fichiers MDX situés dans `/content/countries/[Code_Alpha3].mdx` (ex : `/content/countries/BEN.mdx`) et les rendre côté serveur via next-mdx-remote lors de la génération statique de la page pays.
2. THE MDX_Renderer SHALL rendre les articles MDX de manière entièrement statique au build, sans appel réseau en runtime pour le contenu éditorial.
3. WHEN un article MDX existe pour un pays, THE Country_Card SHALL afficher le contenu éditorial rendu après les blocs de données structurées, dans une section visuellement distincte.
4. WHEN aucun article MDX n'existe pour un pays, THE Country_Card SHALL afficher uniquement les données structurées sans message d'erreur, sans section vide et sans indication d'absence de contenu éditorial.
5. THE MDX_Renderer SHALL rendre les éléments MDX suivants : titres (`#`, `##`, `###`), paragraphes, emphase (`*`, `**`), listes (`-`, `1.`), et composants React personnalisés importés dans le fichier MDX.
6. IF un fichier MDX est malformé ou ne peut pas être parsé au build, THEN THE Static_Generator SHALL générer la page pays sans le contenu éditorial (équivalent au comportement du critère 4) et SHALL consigner une erreur dans les logs de build sans interrompre la génération des autres pages.
7. THE Static_Generator SHALL générer les pages des pays disposant d'un article MDX avec le contenu éditorial intégré au build, pour un minimum de 20 pays au lancement.

---

### Exigence 8 — Recherche pays

**User Story :** En tant que visiteur, je veux rechercher un pays rapidement depuis n'importe quel état de l'application, afin de naviguer directement vers le pays qui m'intéresse sans explorer manuellement le globe.

#### Critères d'acceptation

1. THE Search_Palette SHALL être accessible depuis n'importe quel état de l'application via le raccourci clavier Cmd+K (macOS) ou Ctrl+K (Windows/Linux) ainsi que via un bouton dédié dans l'interface.
2. WHEN l'utilisateur saisit du texte dans la Search_Palette, THE Search_Palette SHALL filtrer les 195 pays préchargés côté client sur les champs : nom officiel, nom courant, capitale et Code_Alpha3, et afficher les résultats mis à jour en moins de 100 ms après chaque frappe.
3. WHEN la Search_Palette contient des résultats, THE Search_Palette SHALL les classer par pertinence décroissante selon la règle suivante : correspondance exacte (priorité 1) > correspondance en début de chaîne / préfixe (priorité 2) > correspondance partielle en sous-chaîne (priorité 3).
4. WHEN la Search_Palette contient des résultats, THE Search_Palette SHALL afficher au maximum 10 résultats, chacun contenant : le Drapeau_SVG, le nom courant et la région du pays.
5. WHEN l'utilisateur sélectionne un résultat dans la Search_Palette, THE Camera SHALL déclencher une animation de vol vers le pays sélectionné sur le Globe d'une durée comprise entre 800 ms et 1 500 ms selon la distance angulaire à parcourir.
6. WHILE la Search_Palette est ouverte, THE Search_Palette SHALL s'afficher sous forme de palette flottante centrée superposée au contenu actuel avec un fond semi-transparent.
7. WHEN la Search_Palette est ouverte, THE Search_Palette SHALL recevoir le focus clavier automatiquement sur le champ de saisie.
8. WHEN l'utilisateur appuie sur la touche Échap, THE Search_Palette SHALL se fermer et le focus SHALL retourner à l'élément qui avait le focus avant l'ouverture.
9. WHEN l'utilisateur saisit du texte dans la Search_Palette et qu'aucun pays ne correspond à la saisie, THE Search_Palette SHALL afficher un message "Aucun résultat pour [saisie]" sans afficher d'entrée de pays.
10. WHEN la Search_Palette est fermée (par Échap, sélection ou clic extérieur), THE Search_Palette SHALL réinitialiser le champ de saisie à vide et vider la liste des résultats.

---

### Exigence 9 — Navigation, URL et partage

**User Story :** En tant que visiteur, je veux partager un pays directement via son URL et naviguer avec un fil d'Ariane clair, afin de retrouver et diffuser facilement les fiches pays.

#### Critères d'acceptation

1. THE Static_Generator SHALL générer une URL permanente pour chacun des 195 pays au format `/pays/[code_alpha3]` en minuscules (ex : `/pays/ben` pour le Bénin).
2. THE Static_Generator SHALL générer pour chaque page pays les balises Open Graph suivantes : `og:title` (nom du pays), `og:description` (description du pays en 160 caractères maximum), `og:image` (URL du Drapeau_SVG du pays).
3. THE Static_Generator SHALL générer pour chaque page pays un élément `<title>` au format `[Nom du pays] — ATLAS°` (ex : `Bénin — ATLAS°`).
4. WHEN l'utilisateur consulte une Country_Card, THE Breadcrumb SHALL afficher le chemin de navigation Globe → [Continent] → [Nom du pays] avec des liens cliquables permettant de naviguer vers la page Globe et vers la liste des pays du continent.
5. WHEN l'utilisateur clique sur le bouton de partage d'une Country_Card, THE Country_Card SHALL copier l'URL directe du pays dans le presse-papier de l'utilisateur et afficher une confirmation visuelle (ex : icône de validation ou texte "Lien copié !") pendant 2 secondes.
6. IF l'API Clipboard n'est pas disponible dans le navigateur, THEN THE Country_Card SHALL afficher l'URL directe du pays dans un champ texte sélectionnable permettant à l'utilisateur de la copier manuellement.
7. THE Static_Generator SHALL générer les 195 pages pays avec au minimum les métadonnées SEO suivantes : `<title>`, `<meta name="description">` (≤ 160 caractères), `og:title`, `og:description`, `og:image`, et balise `<link rel="canonical">`.

---

### Exigence 10 — Curseur personnalisé et micro-interactions

**User Story :** En tant que visiteur sur desktop, je veux un curseur personnalisé et des micro-interactions soignées, afin de ressentir le niveau de finition premium de l'application.

#### Critères d'acceptation

1. WHILE l'application s'exécute sur un appareil desktop (détecté via media query `(pointer: fine)`), THE Cursor SHALL masquer le curseur natif du navigateur via `cursor: none` sur l'élément `<body>` et afficher à la place un cercle SVG de 12px de diamètre suivant le pointeur avec un délai de lag de 80 ms animé via GSAP `quickSetter`.
2. WHILE le pointeur survole le Globe, THE Cursor SHALL adopter une forme de réticule (deux lignes perpendiculaires de 20px de longueur) en remplacement du cercle par défaut.
3. WHILE le pointeur survole un élément interactif clé (boutons, liens, cartes de pays voisins), THE Cursor SHALL se déplacer magnétiquement vers le centre de l'élément avec une amplitude maximale de 8px.
4. WHEN le pointeur quitte un élément interactif clé, THE Cursor SHALL retourner à sa position réelle en 200 ms (easing power2.out).
5. WHILE l'application s'exécute sur un appareil mobile ou tactile (détecté via `navigator.maxTouchPoints > 0` ou media query `(pointer: coarse)`), THE Cursor SHALL être désactivé et le curseur natif du système SHALL être utilisé.

---

### Exigence 11 — Performance et optimisation des assets

**User Story :** En tant que visiteur, je veux que l'application se charge et réponde rapidement, afin de ne pas être pénalisé par des temps d'attente excessifs.

#### Critères d'acceptation

1. THE Static_Generator SHALL convertir toutes les images raster (PNG, JPEG) au format WebP avec une qualité de 80% minimum au build, et SHALL minifier le fichier GeoJSON en supprimant les espaces et retours à la ligne superflus, réduisant sa taille d'au moins 20% par rapport à la version non minifiée.
2. THE GeoJSON_Loader SHALL ne déclencher le chargement du fichier GeoJSON que lorsque le composant Globe est monté dans le DOM, et non au chargement initial de l'application.
3. THE Renderer SHALL mesurer les capacités GPU au démarrage via `renderer.getPixelRatio()` et SHALL limiter le pixel ratio à `Math.min(window.devicePixelRatio, 2.0)` sur desktop et à `Math.min(window.devicePixelRatio, 1.5)` sur mobile.
4. THE Static_Generator SHALL activer le prefetch automatique de Next.js (`<Link prefetch={true}>`) pour les liens vers les pages pays affichés dans la liste des pays voisins et dans les résultats de la Search_Palette.
5. THE Static_Generator SHALL générer les 195 pages pays de manière entièrement statique (SSG) sans ISR ni SSR, de sorte que le TTI mesuré par Lighthouse sur une connexion 4G simulée (10 Mbps, 40 ms RTT) soit inférieur ou égal à 4 secondes.
6. THE Renderer SHALL ne charger les données détaillées d'un pays (population, superficie, langues, monnaie, voisins) que lorsque ce pays est sélectionné par l'utilisateur, et non au chargement initial du Globe.

---

### Exigence 12 — Accessibilité

**User Story :** En tant que visiteur utilisant des technologies d'assistance ou la navigation clavier, je veux pouvoir accéder aux contenus et fonctionnalités de l'application, afin de ne pas être exclu de l'expérience.

#### Critères d'acceptation

1. THE Country_Card SHALL respecter un ratio de contraste d'au moins 4,5:1 entre la couleur de texte et l'arrière-plan pour le texte normal, et d'au moins 3:1 pour le texte large (≥ 18px non gras ou ≥ 14px gras), y compris lorsque la Palette_Pays dynamique est appliquée.
2. THE Globe SHALL exposer une liste HTML masquée visuellement (classe `sr-only`) avec `role="list"` contenant les 195 pays, chacun étant un élément `role="listitem"` avec un lien `role="link"` vers sa Country_Card, accessible aux lecteurs d'écran.
3. WHEN la Search_Palette est ouverte, THE Search_Palette SHALL supporter la navigation clavier suivante : Tab pour déplacer le focus entre le champ de saisie et les résultats, flèches directionnelles haut/bas pour naviguer entre les résultats, Entrée pour sélectionner le résultat focalisé, Échap pour fermer la palette.
4. THE Country_Card SHALL supporter la navigation clavier complète : Tab pour déplacer le focus entre les éléments interactifs (pays voisins, bouton de partage, liens), Entrée ou Espace pour activer l'élément focalisé, et SHALL maintenir un ordre de tabulation logique correspondant à l'ordre visuel de lecture.
5. WHERE le navigateur ne supporte pas WebGL2, THE Renderer SHALL afficher la liste HTML des 195 pays (définie au critère 2) comme contenu principal visible, sans message d'erreur exposé à l'utilisateur.
6. THE Renderer SHALL ajouter les attributs ARIA suivants sur le canvas WebGL : `role="application"`, `aria-label="Globe interactif — Explorateur de pays"`, et sur chaque zone de pays interactive : `role="button"`, `aria-label="[Nom du pays]"`.
7. WHILE l'application est en cours d'utilisation, tout élément interactif recevant le focus clavier SHALL afficher un indicateur de focus visible avec un ratio de contraste d'au moins 3:1 entre l'indicateur et l'arrière-plan adjacent.

---

### Exigence 13 — Déploiement et disponibilité

**User Story :** En tant que visiteur, je veux que l'application soit disponible en permanence et déployée de manière fiable, afin de pouvoir y accéder à tout moment.

#### Critères d'acceptation

1. THE Static_Generator SHALL produire un build Next.js exportable (`next build`) déployable sur Vercel (plan Hobby) via un dépôt GitHub public configuré avec un déploiement automatique sur push vers la branche `main`.
2. WHILE l'application est déployée sur Vercel, THE Static_Generator SHALL maintenir une disponibilité (uptime) supérieure ou égale à 99% mesurée sur une période mensuelle glissante, en s'appuyant sur l'infrastructure CDN de Vercel.
3. THE Static_Generator SHALL générer toutes les pages pays de manière statique au build afin que l'application reste entièrement fonctionnelle en production même si REST Countries API est indisponible après le déploiement.
4. IF REST Countries API est indisponible lors du build, THEN THE Static_Generator SHALL interrompre le build et consigner une erreur explicite dans les logs de build indiquant que les données pays n'ont pas pu être récupérées, sans déployer un build partiel.

---

### Exigence 14 — Défilement fluide

**User Story :** En tant que visiteur, je veux un défilement fluide et naturel sur les fiches pays, afin que la navigation dans le contenu soit agréable et cohérente avec l'esthétique premium de l'application.

#### Critères d'acceptation

1. WHILE l'utilisateur fait défiler une Country_Card, THE Lenis SHALL intercepter les événements de défilement natifs (`wheel`, `touchmove`) et produire un défilement fluide avec une durée d'inertie de 1,2 secondes après relâchement (paramètre `duration: 1.2` de Lenis).
2. THE ScrollTrigger SHALL s'intégrer avec Lenis en utilisant `ScrollTrigger.scrollerProxy` pour synchroniser les animations de révélation des sections de la Country_Card avec la position de défilement Lenis, de sorte que les animations se déclenchent à la même position de scroll que sans Lenis.

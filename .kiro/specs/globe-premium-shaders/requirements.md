# Exigences — Globe Premium Shaders & Interactions

## Vue d'ensemble

Améliorer le rendu du globe 3D avec des shaders WebGL custom, des interactions premium au survol, et une caméra réactive pour atteindre le niveau Awwwards.

---

## Exigences fonctionnelles

### 1. Shader custom pour les pays

**1.1** Implémenter un shader GLSL custom pour les pays qui :
- Applique la couleur extraite du drapeau avec une profondeur visuelle
- Ajoute un effet de relief subtil (normal mapping ou bump mapping)
- Supporte l'émission légère pour les pays survolés
- Utilise `THREE.ShaderMaterial` au lieu de `MeshStandardMaterial`

**1.2** Le shader doit supporter :
- Uniforms : `uColor` (couleur du pays), `uEmission` (intensité émission), `uTime` (pour animations)
- Varyings : `vNormal`, `vPosition` pour calculs en fragment shader
- Éclairage Phong ou PBR simplifié

### 2. Élévation au survol

**2.1** Au survol d'un pays (`onPointerEnter`) :
- Extrusion progressive : 0 → 0,05 unités en 150ms ease-out
- Glow émissif : 0 → 0,8 en 150ms
- Effet de "pop" visuel sans déformation de géométrie

**2.2** À la sortie du survol (`onPointerLeave`) :
- Rétraction : 0,05 → 0 unités en 150ms ease-in
- Glow : 0,8 → 0 en 150ms

**2.3** L'élévation doit être smooth et ne pas causer de clipping avec les pays voisins

### 3. Pulsation des frontières

**3.1** Les frontières (BordersMesh) doivent pulser :
- Opacité : 0,4 → 1,0 → 0,4 en 2 secondes (boucle infinie)
- Couleur : doré `#D4AF37` avec blending additif
- Effet "veines lumineuses" chirurgical

**3.2** La pulsation doit être synchronisée globalement (pas de décalage par pays)

### 4. Inclinaison caméra subtile au survol

**4.1** Au survol d'un pays :
- La caméra s'incline légèrement vers le pays (rotation max 2-3°)
- Animation smooth : 200ms ease-out
- Retour à la position neutre à la sortie du survol

**4.2** L'inclinaison ne doit pas interférer avec les contrôles OrbitControls

### 5. Tooltip amélioré

**5.1** Le tooltip au survol doit afficher :
- Drapeau SVG du pays
- Nom officiel du pays
- Région/continent
- Population (format lisible : "1.2M", "45K", etc.)

**5.2** Animation d'apparition : fondu + translation 10px en 200ms

---

## Exigences non-fonctionnelles

### 6. Performance

**6.1** Le shader custom ne doit pas réduire les FPS en dessous de 55 FPS sur GPU intégré Intel UHD 620

**6.2** Les animations GSAP (élévation, glow, caméra) doivent être GPU-accelerated (transform, opacity)

**6.3** Pas de re-compilation de shaders à chaque frame

### 7. Accessibilité

**7.1** Les interactions au survol doivent avoir des équivalents clavier :
- Tab pour naviguer entre les pays
- Entrée pour sélectionner
- Les pays survolés doivent avoir `aria-pressed="true"`

**7.2** Les animations ne doivent pas causer de motion sickness (durée ≥ 150ms, easing smooth)

### 8. Compatibilité

**8.1** Les shaders doivent être compatibles WebGL2 (GLSL ES 3.0)

**8.2** Fallback gracieux si WebGL2 non supporté (affichage liste HTML)

---

## Critères d'acceptation

- ✅ Shader custom appliqué à tous les pays avec couleur dynamique
- ✅ Élévation au survol smooth et sans clipping
- ✅ Frontières pulsent en synchrone
- ✅ Caméra s'incline subtilement au survol
- ✅ Tooltip enrichi avec population et région
- ✅ Performances ≥ 55 FPS sur GPU intégré
- ✅ Accessibilité clavier complète
- ✅ Tests de propriété pour les animations (timing, easing)

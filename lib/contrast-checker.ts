/**
 * ATLAS° Globe 3D : Vérificateur de contraste WCAG
 * Exigences : 5.4, 12.1
 *
 * Implémente le calcul de luminance relative WCAG 2.1 et l'ajustement
 * automatique de la luminosité HSL pour garantir un ratio de contraste minimal.
 */

// ---------------------------------------------------------------------------
// Helpers internes
// ---------------------------------------------------------------------------

/**
 * Normalise un canal de couleur (0-255) en luminance linéaire
 * selon la formule WCAG 2.1.
 */
function linearize(channel: number): number {
  const c = channel / 255;
  return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
}

/**
 * Convertit une chaîne hexadécimale (3 ou 6 chiffres, avec ou sans `#`)
 * en un tableau [r, g, b] de valeurs 0-255.
 *
 * @throws {Error} si le format hex est invalide
 */
function hexToRgb(hex: string): [number, number, number] {
  const cleaned = hex.startsWith("#") ? hex.slice(1) : hex;

  let r: number, g: number, b: number;

  if (cleaned.length === 3) {
    r = parseInt(cleaned[0] + cleaned[0], 16);
    g = parseInt(cleaned[1] + cleaned[1], 16);
    b = parseInt(cleaned[2] + cleaned[2], 16);
  } else if (cleaned.length === 6) {
    r = parseInt(cleaned.slice(0, 2), 16);
    g = parseInt(cleaned.slice(2, 4), 16);
    b = parseInt(cleaned.slice(4, 6), 16);
  } else {
    throw new Error(`Format hex invalide : "${hex}"`);
  }

  return [r, g, b];
}

/**
 * Calcule la luminance relative d'une couleur hex selon WCAG 2.1.
 * Résultat dans [0, 1] : 0 = noir absolu, 1 = blanc absolu.
 */
function relativeLuminance(hex: string): number {
  const [r, g, b] = hexToRgb(hex);
  const R = linearize(r);
  const G = linearize(g);
  const B = linearize(b);
  return 0.2126 * R + 0.7152 * G + 0.0722 * B;
}

// ---------------------------------------------------------------------------
// Conversion HSL ↔ Hex
// ---------------------------------------------------------------------------

/**
 * Convertit une couleur hex en composantes HSL.
 * H ∈ [0, 360), S ∈ [0, 100], L ∈ [0, 100]
 */
function hexToHsl(hex: string): [number, number, number] {
  const [r, g, b] = hexToRgb(hex);
  const rn = r / 255;
  const gn = g / 255;
  const bn = b / 255;

  const max = Math.max(rn, gn, bn);
  const min = Math.min(rn, gn, bn);
  const delta = max - min;

  let h = 0;
  let s = 0;
  const l = (max + min) / 2;

  if (delta !== 0) {
    s = delta / (1 - Math.abs(2 * l - 1));

    if (max === rn) {
      h = ((gn - bn) / delta) % 6;
    } else if (max === gn) {
      h = (bn - rn) / delta + 2;
    } else {
      h = (rn - gn) / delta + 4;
    }

    h = h * 60;
    if (h < 0) h += 360;
  }

  return [h, s * 100, l * 100];
}

/**
 * Convertit des composantes HSL en chaîne hex (#rrggbb).
 * H ∈ [0, 360), S ∈ [0, 100], L ∈ [0, 100]
 */
function hslToHex(h: number, s: number, l: number): string {
  const sn = s / 100;
  const ln = l / 100;

  const c = (1 - Math.abs(2 * ln - 1)) * sn;
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
  const m = ln - c / 2;

  let r = 0, g = 0, b = 0;

  if (h < 60)       { r = c; g = x; b = 0; }
  else if (h < 120) { r = x; g = c; b = 0; }
  else if (h < 180) { r = 0; g = c; b = x; }
  else if (h < 240) { r = 0; g = x; b = c; }
  else if (h < 300) { r = x; g = 0; b = c; }
  else              { r = c; g = 0; b = x; }

  const toHex = (v: number) =>
    Math.round((v + m) * 255)
      .toString(16)
      .padStart(2, "0");

  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}

// ---------------------------------------------------------------------------
// API publique
// ---------------------------------------------------------------------------

/**
 * Calcule le ratio de contraste WCAG 2.1 entre deux couleurs hex.
 *
 * Le ratio est symétrique : `getContrastRatio(a, b) === getContrastRatio(b, a)`.
 * Plage de résultat : 1 (aucun contraste) à 21 (noir sur blanc).
 *
 * Accepte les formats hex 3 chiffres (#RGB) et 6 chiffres (#RRGGBB),
 * avec ou sans le `#` initial.
 *
 * @param fg - Couleur de premier plan (hex)
 * @param bg - Couleur d'arrière-plan (hex)
 * @returns Ratio de contraste dans [1, 21]
 *
 * @example
 * getContrastRatio('#000000', '#ffffff') // 21
 * getContrastRatio('#ffffff', '#ffffff') // 1
 */
export function getContrastRatio(fg: string, bg: string): number {
  const L1 = relativeLuminance(fg);
  const L2 = relativeLuminance(bg);

  const lighter = Math.max(L1, L2);
  const darker = Math.min(L1, L2);

  return (lighter + 0.05) / (darker + 0.05);
}

/**
 * Ajuste la luminosité HSL de `color` jusqu'à ce que le ratio de contraste
 * avec `bg` atteigne au moins `minRatio`.
 *
 * L'algorithme détermine d'abord si la couleur doit être éclaircie ou
 * assombrie (selon la luminosité relative de `bg`), puis effectue une
 * recherche binaire sur la composante L de HSL pour trouver la valeur
 * minimale satisfaisant le ratio cible.
 *
 * Si le ratio cible est impossible à atteindre (ex : minRatio > 21),
 * la fonction retourne la couleur la plus contrastée possible (noir ou blanc).
 *
 * @param color - Couleur à ajuster (hex)
 * @param bg    - Couleur d'arrière-plan de référence (hex)
 * @param minRatio - Ratio de contraste minimal requis (ex : 4.5 pour WCAG AA)
 * @returns Couleur ajustée en hex (#rrggbb)
 *
 * @example
 * adjustForContrast('#888888', '#ffffff', 4.5) // couleur plus sombre
 * adjustForContrast('#888888', '#000000', 4.5) // couleur plus claire
 */
export function adjustForContrast(
  color: string,
  bg: string,
  minRatio: number
): string {
  // Si le contraste est déjà suffisant, retourner la couleur inchangée
  if (getContrastRatio(color, bg) >= minRatio) {
    return color.startsWith("#") ? color : `#${color}`;
  }

  const [h, s, currentL] = hexToHsl(color);
  const bgLuminance = relativeLuminance(bg);

  // Décider si on doit éclaircir ou assombrir :
  // On choisit la direction qui maximise le contraste atteignable.
  // Le contraste avec le noir (L=0) est (bgLum + 0.05) / 0.05
  // Le contraste avec le blanc (L=1) est 1.05 / (bgLum + 0.05)
  // On assombrit si le noir donne un meilleur contraste que le blanc,
  // c'est-à-dire si (bgLum + 0.05)² > 1.05 × 0.05 = 0.0525
  const bgLumShifted = bgLuminance + 0.05;
  const shouldDarken = bgLumShifted * bgLumShifted > 0.0525;

  // Recherche binaire sur la composante L
  let low = shouldDarken ? 0 : currentL;
  let high = shouldDarken ? currentL : 100;

  // Vérifier si la valeur extrême atteint le ratio requis
  const extremeL = shouldDarken ? 0 : 100;
  const extremeColor = hslToHex(h, s, extremeL);
  if (getContrastRatio(extremeColor, bg) < minRatio) {
    // Impossible d'atteindre le ratio : retourner noir ou blanc
    return shouldDarken ? "#000000" : "#ffffff";
  }

  // 20 itérations de recherche binaire donnent une précision de ~0.0001 sur L
  for (let i = 0; i < 20; i++) {
    const mid = (low + high) / 2;
    const candidate = hslToHex(h, s, mid);
    const ratio = getContrastRatio(candidate, bg);

    if (ratio >= minRatio) {
      // Ce candidat satisfait le ratio : on peut aller vers la couleur d'origine
      if (shouldDarken) {
        low = mid; // essayer une valeur L plus haute (moins sombre)
      } else {
        high = mid; // essayer une valeur L plus basse (moins claire)
      }
    } else {
      // Pas assez de contraste : aller vers l'extrême
      if (shouldDarken) {
        high = mid; // aller vers L plus basse (plus sombre)
      } else {
        low = mid; // aller vers L plus haute (plus claire)
      }
    }
  }

  // Retourner la valeur satisfaisant le ratio (côté original de la recherche)
  // shouldDarken=true  : low = valeur L la plus haute satisfaisant le ratio
  // shouldDarken=false : high = valeur L la plus basse satisfaisant le ratio
  const finalL = shouldDarken ? low : high;
  const result = hslToHex(h, s, finalL);

  // Vérification post-arrondi : la conversion HSL→hex arrondit les canaux RGB
  // à des entiers, ce qui peut faire chuter le ratio juste en dessous de la cible.
  // Si c'est le cas, on utilise la valeur extrême garantie.
  if (getContrastRatio(result, bg) < minRatio) {
    return shouldDarken ? "#000000" : "#ffffff";
  }

  return result;
}

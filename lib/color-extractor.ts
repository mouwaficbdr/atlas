/**
 * ATLAS° Globe 3D — Extracteur de palette de couleurs
 * Exigences : 3.2, 5.2, 5.3, 5.4, 5.5
 *
 * Extrait une palette de 4 couleurs dominantes depuis le drapeau SVG d'un pays
 * via un algorithme de quantification par médiane coupée (median cut) sur canvas 2D.
 * Les palettes sont mises en cache dans le localStorage pour éviter les recalculs.
 */

import type { CountryPalette } from "./types";
import { adjustForContrast, getContrastRatio } from "./contrast-checker";

// ---------------------------------------------------------------------------
// Constantes
// ---------------------------------------------------------------------------

const CANVAS_SIZE = 64; // Résolution de rendu pour l'extraction (64×64 px)
const NUM_COLORS = 4; // Nombre de couleurs à extraire
const STORAGE_PREFIX = "atlas_palette_"; // Préfixe de clé localStorage

/** Palette de repli si le SVG est indisponible (Exigence 5.5) */
const FALLBACK_PALETTE: Omit<CountryPalette, "cca3"> = {
  primary: "#1E3A5F",
  secondary: "#2D5986",
  accent: "#4A90D9",
  background: "#0A0A14",
  source: "fallback",
  contrastRatio: 0,
};

// ---------------------------------------------------------------------------
// Types internes
// ---------------------------------------------------------------------------

/** Représentation d'un pixel RGB */
interface Pixel {
  r: number;
  g: number;
  b: number;
}

/** Boîte de couleurs pour l'algorithme médiane coupée */
interface ColorBox {
  pixels: Pixel[];
  rMin: number;
  rMax: number;
  gMin: number;
  gMax: number;
  bMin: number;
  bMax: number;
}

// ---------------------------------------------------------------------------
// Algorithme de quantification — Médiane coupée (Median Cut)
// ---------------------------------------------------------------------------

/**
 * Calcule les bornes RGB d'un ensemble de pixels.
 */
function computeBox(pixels: Pixel[]): ColorBox {
  let rMin = 255, rMax = 0;
  let gMin = 255, gMax = 0;
  let bMin = 255, bMax = 0;

  for (const p of pixels) {
    if (p.r < rMin) rMin = p.r;
    if (p.r > rMax) rMax = p.r;
    if (p.g < gMin) gMin = p.g;
    if (p.g > gMax) gMax = p.g;
    if (p.b < bMin) bMin = p.b;
    if (p.b > bMax) bMax = p.b;
  }

  return { pixels, rMin, rMax, gMin, gMax, bMin, bMax };
}

/**
 * Coupe une boîte en deux selon le canal de plus grande amplitude.
 */
function splitBox(box: ColorBox): [ColorBox, ColorBox] {
  const rRange = box.rMax - box.rMin;
  const gRange = box.gMax - box.gMin;
  const bRange = box.bMax - box.bMin;

  // Trier selon le canal dominant
  let channel: "r" | "g" | "b";
  if (rRange >= gRange && rRange >= bRange) {
    channel = "r";
  } else if (gRange >= rRange && gRange >= bRange) {
    channel = "g";
  } else {
    channel = "b";
  }

  // Trier les pixels selon ce canal
  const sorted = [...box.pixels].sort((a, b) => a[channel] - b[channel]);
  const mid = Math.floor(sorted.length / 2);

  return [
    computeBox(sorted.slice(0, mid)),
    computeBox(sorted.slice(mid)),
  ];
}

/**
 * Calcule la couleur moyenne d'une boîte (représentant la couleur dominante).
 */
function averageColor(box: ColorBox): Pixel {
  if (box.pixels.length === 0) return { r: 0, g: 0, b: 0 };

  let rSum = 0, gSum = 0, bSum = 0;
  for (const p of box.pixels) {
    rSum += p.r;
    gSum += p.g;
    bSum += p.b;
  }

  const n = box.pixels.length;
  return {
    r: Math.round(rSum / n),
    g: Math.round(gSum / n),
    b: Math.round(bSum / n),
  };
}

/**
 * Convertit un pixel RGB en chaîne hexadécimale (#rrggbb).
 */
function pixelToHex(p: Pixel): string {
  const toHex = (v: number) => v.toString(16).padStart(2, "0");
  return `#${toHex(p.r)}${toHex(p.g)}${toHex(p.b)}`;
}

/**
 * Applique l'algorithme de quantification par médiane coupée sur un tableau
 * de pixels pour extraire `numColors` couleurs dominantes.
 *
 * @param pixels - Tableau de pixels RGB
 * @param numColors - Nombre de couleurs à extraire
 * @returns Tableau de couleurs hex
 */
function medianCut(pixels: Pixel[], numColors: number): string[] {
  if (pixels.length === 0) return [];

  const boxes: ColorBox[] = [computeBox(pixels)];

  // Diviser les boîtes jusqu'à obtenir le nombre de couleurs souhaité
  while (boxes.length < numColors) {
    // Choisir la boîte avec la plus grande amplitude (volume)
    let maxRange = -1;
    let maxIndex = 0;

    for (let i = 0; i < boxes.length; i++) {
      const box = boxes[i];
      const range =
        (box.rMax - box.rMin) +
        (box.gMax - box.gMin) +
        (box.bMax - box.bMin);
      if (range > maxRange) {
        maxRange = range;
        maxIndex = i;
      }
    }

    // Si toutes les boîtes ont une amplitude nulle, on ne peut plus diviser
    if (maxRange === 0) break;

    const [left, right] = splitBox(boxes[maxIndex]);
    boxes.splice(maxIndex, 1, left, right);
  }

  // Calculer la couleur moyenne de chaque boîte
  return boxes.map((box) => pixelToHex(averageColor(box)));
}

// ---------------------------------------------------------------------------
// Chargement du SVG et extraction des pixels
// ---------------------------------------------------------------------------

/**
 * Charge une image SVG dans un canvas 2D et retourne les données de pixels.
 * Retourne null si le chargement échoue.
 */
function loadImagePixels(
  svgUrl: string,
  size: number
): Promise<Pixel[] | null> {
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = "anonymous";

    img.onload = () => {
      try {
        const canvas = document.createElement("canvas");
        canvas.width = size;
        canvas.height = size;

        const ctx = canvas.getContext("2d");
        if (!ctx) {
          resolve(null);
          return;
        }

        ctx.drawImage(img, 0, 0, size, size);

        const imageData = ctx.getImageData(0, 0, size, size);
        const data = imageData.data;
        const pixels: Pixel[] = [];

        // Échantillonner les pixels (ignorer les pixels transparents)
        for (let i = 0; i < data.length; i += 4) {
          const alpha = data[i + 3];
          if (alpha > 128) {
            pixels.push({
              r: data[i],
              g: data[i + 1],
              b: data[i + 2],
            });
          }
        }

        resolve(pixels.length > 0 ? pixels : null);
      } catch {
        resolve(null);
      }
    };

    img.onerror = () => resolve(null);

    img.src = svgUrl;
  });
}

// ---------------------------------------------------------------------------
// API publique
// ---------------------------------------------------------------------------

/**
 * Extrait une palette de 4 couleurs dominantes depuis le drapeau SVG d'un pays.
 *
 * Comportement :
 * 1. Si une palette est déjà en cache dans le localStorage (`atlas_palette_[cca3]`),
 *    elle est retournée immédiatement sans recalcul.
 * 2. Sinon, le SVG est chargé dans un canvas 2D, les pixels sont échantillonnés,
 *    et l'algorithme de médiane coupée extrait 4 couleurs dominantes.
 * 3. La couleur primaire est ajustée via `adjustForContrast` pour garantir
 *    un ratio WCAG AA (≥ 4.5:1) avec la couleur de fond.
 * 4. Si le SVG est indisponible, la palette de repli est utilisée.
 * 5. La palette résultante est stockée dans le localStorage.
 *
 * @param flagSvgUrl - URL du drapeau SVG du pays
 * @param cca3 - Code Alpha-3 du pays (ex: "BEN")
 * @returns Promesse résolue avec la CountryPalette
 *
 * @example
 * const palette = await extractPalette('https://flagcdn.com/bj.svg', 'BEN');
 * // { primary: '#...', secondary: '#...', accent: '#...', background: '#...', ... }
 */
export async function extractPalette(
  flagSvgUrl: string,
  cca3: string
): Promise<CountryPalette> {
  const storageKey = `${STORAGE_PREFIX}${cca3}`;

  // 1. Vérifier le cache localStorage (Exigence 3.2)
  try {
    const cached = localStorage.getItem(storageKey);
    if (cached) {
      const parsed = JSON.parse(cached) as CountryPalette;
      return parsed;
    }
  } catch {
    // localStorage indisponible ou JSON invalide — continuer l'extraction
  }

  // 2. Tenter le chargement du SVG et l'extraction des pixels
  const pixels = await loadImagePixels(flagSvgUrl, CANVAS_SIZE);

  let palette: CountryPalette;

  if (!pixels || pixels.length === 0) {
    // 3. Palette de repli si SVG indisponible (Exigence 5.5)
    const fallback: CountryPalette = {
      ...FALLBACK_PALETTE,
      cca3,
      contrastRatio: getContrastRatio(
        FALLBACK_PALETTE.primary,
        FALLBACK_PALETTE.background
      ),
    };
    palette = fallback;
  } else {
    // 4. Quantification par médiane coupée → 4 couleurs (Exigence 5.2)
    const colors = medianCut(pixels, NUM_COLORS);

    // Compléter avec des couleurs de repli si l'extraction retourne moins de 4 couleurs
    while (colors.length < NUM_COLORS) {
      colors.push(FALLBACK_PALETTE.primary);
    }

    const [primary, secondary, accent, background] = colors;

    // 5. Ajustement du contraste WCAG AA (Exigence 5.4)
    const adjustedPrimary = adjustForContrast(primary, background, 4.5);
    const contrastRatio = getContrastRatio(adjustedPrimary, background);

    palette = {
      primary: adjustedPrimary,
      secondary,
      accent,
      background,
      cca3,
      source: "extracted",
      contrastRatio,
    };
  }

  // 6. Stocker dans le localStorage (Exigence 3.2)
  try {
    localStorage.setItem(storageKey, JSON.stringify(palette));
  } catch {
    // localStorage plein ou indisponible — continuer sans mise en cache
  }

  return palette;
}

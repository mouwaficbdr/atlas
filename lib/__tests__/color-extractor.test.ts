// @vitest-environment jsdom
/**
 * ATLAS° Globe 3D — Tests de propriété pour `color-extractor`
 * Valide : Exigences 3.2, 5.4
 *
 * Propriété 3 : Idempotence du cache
 * Propriété 4 : Contraste garanti sur la palette retournée
 *
 * // Feature: atlas-globe-3d, Property 3: Idempotence du cache
 * // Feature: atlas-globe-3d, Property 4: Contraste garanti sur la palette retournée
 */

import { describe, it, expect, beforeEach, vi, afterEach } from "vitest";
import * as fc from "fast-check";
import { getContrastRatio } from "../contrast-checker";

// ---------------------------------------------------------------------------
// Helpers — Mocks des APIs navigateur
// ---------------------------------------------------------------------------

/**
 * Génère un tableau de pixels RGBA à partir de couleurs RGB.
 * Chaque couleur est répétée pour remplir un canvas 64×64.
 */
function makePixelData(
  colors: Array<[number, number, number]>
): Uint8ClampedArray {
  const size = 64 * 64;
  const data = new Uint8ClampedArray(size * 4);
  for (let i = 0; i < size; i++) {
    const color = colors[i % colors.length];
    data[i * 4] = color[0]; // R
    data[i * 4 + 1] = color[1]; // G
    data[i * 4 + 2] = color[2]; // B
    data[i * 4 + 3] = 255; // Alpha (opaque)
  }
  return data;
}

/**
 * Configure les mocks globaux pour Image et canvas.
 * L'image se charge immédiatement (onload via microtask).
 */
function setupBrowserMocks(pixels: Uint8ClampedArray) {
  // Mock canvas context
  const mockCtx = {
    drawImage: vi.fn(),
    getImageData: vi.fn().mockReturnValue({ data: pixels }),
  };

  // Mock canvas element
  const mockCanvas = {
    width: 0,
    height: 0,
    getContext: vi.fn().mockReturnValue(mockCtx),
  };

  // Mock document.createElement to return our canvas mock
  vi.spyOn(document, "createElement").mockImplementation((tag: string) => {
    if (tag === "canvas") {
      return mockCanvas as unknown as HTMLCanvasElement;
    }
    // Fall through to real implementation for other elements
    return document.createElement.call(document, tag);
  });

  // Mock Image as a proper class that triggers onload immediately
  class MockImage {
    crossOrigin = "";
    private _src = "";
    onload: (() => void) | null = null;
    onerror: (() => void) | null = null;

    get src() {
      return this._src;
    }

    set src(value: string) {
      this._src = value;
      // Trigger onload asynchronously (microtask)
      Promise.resolve().then(() => {
        if (this.onload) {
          this.onload();
        }
      });
    }
  }

  vi.stubGlobal("Image", MockImage);

  return { mockCanvas, mockCtx };
}

// ---------------------------------------------------------------------------
// Arbitraires fast-check
// ---------------------------------------------------------------------------

/** Génère un code cca3 valide (3 lettres majuscules) */
const cca3Arbitrary = fc.stringMatching(/^[A-Z]{3}$/);

/** Génère une couleur RGB valide */
const rgbChannelArbitrary = fc.integer({ min: 0, max: 255 });
const rgbColorArbitrary: fc.Arbitrary<[number, number, number]> = fc.tuple(
  rgbChannelArbitrary,
  rgbChannelArbitrary,
  rgbChannelArbitrary
);

/** Génère un ensemble de 4+ couleurs RGB pour simuler un drapeau */
const flagColorsArbitrary = fc.array(rgbColorArbitrary, {
  minLength: 4,
  maxLength: 16,
});

// ---------------------------------------------------------------------------
// Setup / Teardown
// ---------------------------------------------------------------------------

beforeEach(() => {
  localStorage.clear();
  vi.restoreAllMocks();
});

afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

// ---------------------------------------------------------------------------
// Propriété 3 : Idempotence du cache
// Valide : Exigence 3.2
// ---------------------------------------------------------------------------

describe("Propriété 3 : Idempotence du cache", () => {
  // Feature: atlas-globe-3d, Property 3: Idempotence du cache

  it(
    "retourne un objet identique au second appel pour le même cca3 (via localStorage)",
    async () => {
      const { extractPalette } = await import("../color-extractor");

      await fc.assert(
        fc.asyncProperty(
          cca3Arbitrary,
          flagColorsArbitrary,
          async (cca3, colors) => {
            // Réinitialiser l'état pour chaque itération
            localStorage.clear();
            vi.restoreAllMocks();
            vi.unstubAllGlobals();

            const pixels = makePixelData(colors);
            setupBrowserMocks(pixels);

            const flagUrl = `https://flagcdn.com/${cca3.toLowerCase()}.svg`;

            // Premier appel — extraction réelle + mise en cache
            const palette1 = await extractPalette(flagUrl, cca3);

            // Réinitialiser les mocks (le second appel doit utiliser le cache)
            vi.restoreAllMocks();
            vi.unstubAllGlobals();

            // Second appel — doit retourner depuis le cache localStorage
            const palette2 = await extractPalette(flagUrl, cca3);

            // Les deux palettes doivent être identiques
            expect(palette1).toEqual(palette2);

            // Vérifier que la palette est bien en cache
            const cached = localStorage.getItem(`atlas_palette_${cca3}`);
            expect(cached).not.toBeNull();
            expect(JSON.parse(cached!)).toEqual(palette1);
          }
        ),
        {
          numRuns: 100,
          verbose: false,
        }
      );
    },
    60000
  );

  it(
    "retourne la palette depuis le cache sans recalcul si déjà présente",
    async () => {
      const { extractPalette } = await import("../color-extractor");

      await fc.assert(
        fc.asyncProperty(cca3Arbitrary, async (cca3) => {
          localStorage.clear();
          vi.restoreAllMocks();
          vi.unstubAllGlobals();

          // Pré-remplir le cache avec une palette connue
          const cachedPalette = {
            primary: "#1a2b3c",
            secondary: "#4d5e6f",
            accent: "#7a8b9c",
            background: "#0d0e0f",
            cca3,
            source: "extracted" as const,
            contrastRatio: 5.2,
          };
          localStorage.setItem(
            `atlas_palette_${cca3}`,
            JSON.stringify(cachedPalette)
          );

          // Espionner document.createElement pour vérifier qu'aucun canvas n'est créé
          const createElementSpy = vi.spyOn(document, "createElement");

          const result = await extractPalette(
            "https://example.com/flag.svg",
            cca3
          );

          // La palette retournée doit être identique à celle en cache
          expect(result).toEqual(cachedPalette);

          // Aucun canvas ne doit avoir été créé (pas de recalcul)
          const canvasCalls = createElementSpy.mock.calls.filter(
            (call) => call[0] === "canvas"
          );
          expect(canvasCalls.length).toBe(0);
        }),
        {
          numRuns: 100,
          verbose: false,
        }
      );
    },
    30000
  );
});

// ---------------------------------------------------------------------------
// Propriété 4 : Contraste garanti sur la palette retournée
// Valide : Exigence 5.4
// ---------------------------------------------------------------------------

describe("Propriété 4 : Contraste garanti sur la palette retournée", () => {
  // Feature: atlas-globe-3d, Property 4: Contraste garanti sur la palette retournée

  it(
    "palette.contrastRatio >= 4.5 pour toute palette non-fallback extraite",
    async () => {
      const { extractPalette } = await import("../color-extractor");

      await fc.assert(
        fc.asyncProperty(
          cca3Arbitrary,
          flagColorsArbitrary,
          async (cca3, colors) => {
            localStorage.clear();
            vi.restoreAllMocks();
            vi.unstubAllGlobals();

            const pixels = makePixelData(colors);
            setupBrowserMocks(pixels);

            const flagUrl = `https://flagcdn.com/${cca3.toLowerCase()}.svg`;
            const palette = await extractPalette(flagUrl, cca3);

            // Seules les palettes non-fallback sont concernées par cette propriété
            if (palette.source === "extracted") {
              expect(palette.contrastRatio).toBeGreaterThanOrEqual(4.5);

              // Vérifier aussi que le ratio calculé est cohérent avec les couleurs
              const actualRatio = getContrastRatio(
                palette.primary,
                palette.background
              );
              expect(actualRatio).toBeGreaterThanOrEqual(4.5);
            }
          }
        ),
        {
          numRuns: 100,
          verbose: false,
        }
      );
    },
    60000
  );

  it(
    "le contrastRatio stocké correspond au ratio réel entre primary et background",
    async () => {
      const { extractPalette } = await import("../color-extractor");

      await fc.assert(
        fc.asyncProperty(
          cca3Arbitrary,
          flagColorsArbitrary,
          async (cca3, colors) => {
            localStorage.clear();
            vi.restoreAllMocks();
            vi.unstubAllGlobals();

            const pixels = makePixelData(colors);
            setupBrowserMocks(pixels);

            const flagUrl = `https://flagcdn.com/${cca3.toLowerCase()}.svg`;
            const palette = await extractPalette(flagUrl, cca3);

            if (palette.source === "extracted") {
              const computedRatio = getContrastRatio(
                palette.primary,
                palette.background
              );
              // Le ratio stocké doit correspondre au ratio calculé (tolérance flottante)
              expect(palette.contrastRatio).toBeCloseTo(computedRatio, 5);
            }
          }
        ),
        {
          numRuns: 100,
          verbose: false,
        }
      );
    },
    60000
  );
});

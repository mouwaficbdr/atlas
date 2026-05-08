/**
 * Tests de propriété — contrast-checker
 * Feature: atlas-globe-3d
 * Valide : Exigences 5.4, 12.1
 *
 * Utilise fast-check pour valider les invariants universels des fonctions
 * `getContrastRatio` et `adjustForContrast`.
 */

import { describe, it, expect } from "vitest";
import * as fc from "fast-check";
import { getContrastRatio, adjustForContrast } from "../contrast-checker";

// ---------------------------------------------------------------------------
// Générateur de couleurs hex valides (#RRGGBB)
// ---------------------------------------------------------------------------

/**
 * Génère une chaîne hex 6 chiffres au format #RRGGBB.
 */
const hexColor = fc
  .hexaString({ minLength: 6, maxLength: 6 })
  .map((s) => "#" + s);

// ---------------------------------------------------------------------------
// Propriété 1 : Symétrie du ratio de contraste
// ---------------------------------------------------------------------------

describe("contrast-checker — tests de propriété", () => {
  // Feature: atlas-globe-3d, Property 1: Symétrie du ratio de contraste
  it("Propriété 1 : getContrastRatio(a, b) === getContrastRatio(b, a) pour toute paire de couleurs hex valides", () => {
    // Valide : Exigences 5.4, 12.1
    fc.assert(
      fc.property(hexColor, hexColor, (a, b) => {
        const ratioAB = getContrastRatio(a, b);
        const ratioBA = getContrastRatio(b, a);

        // Le ratio doit être symétrique (tolérance flottante négligeable)
        expect(ratioAB).toBeCloseTo(ratioBA, 10);
      }),
      { numRuns: 100 }
    );
  });

  // ---------------------------------------------------------------------------
  // Propriété 2 : Garantie de contraste après ajustement
  // ---------------------------------------------------------------------------

  // Feature: atlas-globe-3d, Property 2: Garantie de contraste après ajustement
  it("Propriété 2 : getContrastRatio(adjustForContrast(fg, bg, r), bg) >= r pour tout ratio cible r entre 1 et 21", () => {
    // Valide : Exigences 5.4, 12.1
    fc.assert(
      fc.property(
        hexColor,
        hexColor,
        fc.float({ min: 1, max: 21, noNaN: true }),
        (fg, bg, r) => {
          // Le ratio maximum physiquement atteignable pour ce fond
          const maxAchievable = Math.max(
            getContrastRatio("#ffffff", bg),
            getContrastRatio("#000000", bg)
          );

          // On ne teste la propriété que lorsque le ratio est strictement atteignable
          // (avec une marge pour les arrondis flottants)
          if (r <= maxAchievable - 0.001) {
            const adjusted = adjustForContrast(fg, bg, r);
            const actualRatio = getContrastRatio(adjusted, bg);

            // Le ratio après ajustement doit atteindre la cible (epsilon pour flottants)
            expect(actualRatio).toBeGreaterThanOrEqual(r - 0.001);
          }
        }
      ),
      { numRuns: 100 }
    );
  });
});

/**
 * ATLAS° Globe 3D : Tests de propriété pour `search-engine`
 * Exigences : 8.2, 8.3, 8.4
 *
 * Validates: Requirements 8.2, 8.3, 8.4
 */

import { describe, it } from "vitest";
import * as fc from "fast-check";
import { filterCountries } from "../search-engine";
import type { CountryData } from "../types";

// ---------------------------------------------------------------------------
// Générateurs arbitraires
// ---------------------------------------------------------------------------

/**
 * Génère un CountryData minimal valide pour les tests.
 * Seuls les champs utilisés par filterCountries sont requis.
 */
const arbitraryCountryData = (): fc.Arbitrary<CountryData> =>
  fc
    .record({
      cca3: fc.stringMatching(/^[A-Z]{3}$/),
      cca2: fc.stringMatching(/^[A-Z]{2}$/),
      name: fc.record({
        common: fc.string({ minLength: 1, maxLength: 50 }),
        official: fc.string({ minLength: 1, maxLength: 80 }),
        nativeName: fc.constant({}),
      }),
      demonymFr: fc.string({ minLength: 0, maxLength: 30 }),
      capitalFr: fc.string({ minLength: 0, maxLength: 40 }),
      regionFr: fc.string({ minLength: 1, maxLength: 30 }),
      subregionFr: fc.string({ minLength: 1, maxLength: 40 }),
      primaryTimezone: fc.constant('UTC'),
      governmentFr: fc.option(fc.string({ minLength: 1, maxLength: 40 }), {
        nil: null,
      }),
      independent: fc.constant(true),
      capital: fc.oneof(
        fc.constant([]),
        fc.array(fc.string({ minLength: 1, maxLength: 40 }), {
          minLength: 1,
          maxLength: 3,
        })
      ),
      region: fc.string({ minLength: 1, maxLength: 30 }),
      subregion: fc.string({ minLength: 1, maxLength: 40 }),
      latlng: fc.tuple(
        fc.float({ min: -90, max: 90, noNaN: true }),
        fc.float({ min: -180, max: 180, noNaN: true })
      ) as fc.Arbitrary<[number, number]>,
      area: fc.float({ min: 0, max: 20_000_000, noNaN: true }),
      landlocked: fc.boolean(),
      borders: fc.array(fc.stringMatching(/^[A-Z]{3}$/), {
        minLength: 0,
        maxLength: 10,
      }),
      population: fc.integer({ min: 0, max: 2_000_000_000 }),
      languages: fc.constant({}),
      currencies: fc.constant({}),
      idd: fc.record({
        root: fc.string({ minLength: 0, maxLength: 4 }),
        suffixes: fc.array(fc.string({ minLength: 1, maxLength: 4 }), {
          minLength: 0,
          maxLength: 5,
        }),
      }),
      tld: fc.array(fc.string({ minLength: 2, maxLength: 6 }), {
        minLength: 0,
        maxLength: 3,
      }),
      flags: fc.record({
        svg: fc.webUrl(),
        png: fc.webUrl(),
        alt: fc.string({ minLength: 0, maxLength: 100 }),
      }),
      timezones: fc.array(fc.string({ minLength: 3, maxLength: 15 }), {
        minLength: 1,
        maxLength: 5,
      }),
    })
    // Les tests de propriété raisonnent sur name.common ; on aligne nameFr
    // dessus (l'insensibilité aux accents et la recherche FR sont couvertes
    // séparément dans search-fr.test.ts).
    .map(
      (c) =>
        ({
          ...c,
          nameFr: c.name.common,
          officialNameFr: c.name.official,
        }) as CountryData,
    );

/** Génère un tableau de CountryData (0 à 30 pays). */
const arbitraryCountries = (): fc.Arbitrary<CountryData[]> =>
  fc.array(arbitraryCountryData(), { minLength: 0, maxLength: 30 });

/** Génère une requête de recherche non vide. */
const arbitraryNonEmptyQuery = (): fc.Arbitrary<string> =>
  fc.string({ minLength: 1, maxLength: 30 });

// ---------------------------------------------------------------------------
// Propriété 7 : Stabilité du classement
// ---------------------------------------------------------------------------

describe("Propriété 7 : Stabilité du classement", () => {
  // Feature: atlas-globe-3d, Property 7: si score(a) > score(b), alors a apparaît avant b dans les résultats pour toute requête
  it("si score(a) > score(b), alors a apparaît avant b dans les résultats", () => {
    fc.assert(
      fc.property(
        arbitraryNonEmptyQuery(),
        arbitraryCountries(),
        (query, countries) => {
          const results = filterCountries(query, countries);

          // Vérifier que pour tout couple (i, j) avec i < j, score[i] >= score[j]
          for (let i = 0; i < results.length; i++) {
            for (let j = i + 1; j < results.length; j++) {
              if (results[i].score < results[j].score) {
                return false;
              }
            }
          }
          return true;
        }
      ),
      { numRuns: 100 }
    );
  });
});

// ---------------------------------------------------------------------------
// Propriété 8 : Borne supérieure
// ---------------------------------------------------------------------------

describe("Propriété 8 : Borne supérieure", () => {
  // Feature: atlas-globe-3d, Property 8: filterCountries(q, countries).length <= 10 pour toute requête q
  it("filterCountries retourne au plus 10 résultats pour toute requête et tout tableau de pays", () => {
    fc.assert(
      fc.property(
        arbitraryNonEmptyQuery(),
        arbitraryCountries(),
        (query, countries) => {
          const results = filterCountries(query, countries);
          return results.length <= 10;
        }
      ),
      { numRuns: 100 }
    );
  });

  it("la borne supérieure tient aussi pour une requête vide (retourne 0 résultats)", () => {
    fc.assert(
      fc.property(arbitraryCountries(), (countries) => {
        const results = filterCountries("", countries);
        return results.length === 0;
      }),
      { numRuns: 100 }
    );
  });
});

// ---------------------------------------------------------------------------
// Propriété 9 : Inclusion de la correspondance exacte
// ---------------------------------------------------------------------------

describe("Propriété 9 : Inclusion de la correspondance exacte", () => {
  // Feature: atlas-globe-3d, Property 9: si un pays a name.common === q, il apparaît en premier dans les résultats
  it("si un pays a name.common === query, il apparaît en premier dans les résultats", () => {
    fc.assert(
      fc.property(
        // Générer un pays dont le nom courant sera la requête exacte
        arbitraryCountryData(),
        // Générer d'autres pays qui ne correspondent pas exactement
        fc.array(arbitraryCountryData(), { minLength: 0, maxLength: 20 }),
        (exactCountry, otherCountries) => {
          // filterCountries applique trim() sur la requête avant de comparer.
          // Pour que la correspondance exacte fonctionne, name.common doit
          // correspondre à la version trimée de la requête.
          // On utilise donc name.common directement comme requête (déjà trimée).
          const query = exactCountry.name.common.trim();

          // Ignorer les requêtes vides après trim
          if (!query) return true;

          // Pour que la propriété soit valide, name.common doit être égal à query
          // (i.e. name.common ne doit pas avoir d'espaces en début/fin)
          // Si name.common !== query (espaces), on ignore ce cas
          if (exactCountry.name.common !== query) return true;

          // Construire le tableau avec le pays exact inclus
          const countries = [exactCountry, ...otherCountries];

          const results = filterCountries(query, countries);

          // Il doit y avoir au moins un résultat (le pays exact)
          if (results.length === 0) return false;

          // Le premier résultat doit avoir un score de 3 (correspondance exacte)
          return results[0].score === 3;
        }
      ),
      { numRuns: 100 }
    );
  });

  it("le pays avec correspondance exacte sur name.common a un score de 3", () => {
    fc.assert(
      fc.property(
        arbitraryCountryData(),
        fc.array(arbitraryCountryData(), { minLength: 0, maxLength: 10 }),
        (exactCountry, otherCountries) => {
          // filterCountries applique trim() sur la requête.
          // La correspondance exacte (score 3) se produit quand
          // name.common.toLowerCase() === query.trim().toLowerCase()
          const query = exactCountry.name.common.trim();
          if (!query) return true;

          // Ignorer les cas où name.common a des espaces en début/fin
          // (trim de la requête ne correspondrait pas à name.common brut)
          if (exactCountry.name.common !== query) return true;

          const countries = [exactCountry, ...otherCountries];
          const results = filterCountries(query, countries);

          // Trouver le résultat correspondant au pays exact (par nom)
          const exactResult = results.find(
            (r) => r.name.toLowerCase() === query.toLowerCase()
          );

          // S'il est trouvé, son score doit être 3
          if (exactResult) {
            return exactResult.score === 3;
          }

          // Ne devrait pas arriver si le pays est dans la liste
          return false;
        }
      ),
      { numRuns: 100 }
    );
  });
});

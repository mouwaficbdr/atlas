/**
 * ATLAS° Globe 3D — Tests de propriété pour `mood-resolver`
 * Exigence : 6.10
 *
 * Validates: Requirements 6.10
 */

import { describe, it, expect } from "vitest";
import * as fc from "fast-check";
import { resolveMood } from "../mood-resolver";
import type { CountryData, MoodType } from "../types";

// ---------------------------------------------------------------------------
// Arbitraire CountryData
// ---------------------------------------------------------------------------

/**
 * Génère un objet CountryData arbitraire avec des valeurs cohérentes.
 * Les champs non utilisés par resolveMood sont remplis avec des valeurs minimales.
 */
const arbitraryCountryData: fc.Arbitrary<CountryData> = fc.record({
  // Identifiants
  cca3: fc.stringMatching(/^[A-Z]{3}$/),
  cca2: fc.stringMatching(/^[A-Z]{2}$/),
  name: fc.record({
    common: fc.string({ minLength: 1, maxLength: 50 }),
    official: fc.string({ minLength: 1, maxLength: 100 }),
    nativeName: fc.constant({}),
  }),

  // Géographie — champs utilisés par resolveMood
  capital: fc.array(fc.string({ minLength: 1, maxLength: 50 }), {
    minLength: 0,
    maxLength: 3,
  }),
  region: fc.constantFrom(
    "Africa",
    "Americas",
    "Asia",
    "Europe",
    "Oceania",
    "Antarctic"
  ),
  subregion: fc.string({ minLength: 1, maxLength: 50 }),
  latlng: fc.tuple(
    fc.float({ min: -90, max: 90, noNaN: true }),
    fc.float({ min: -180, max: 180, noNaN: true })
  ) as fc.Arbitrary<[number, number]>,
  area: fc.float({ min: 0, max: 20_000_000, noNaN: true }),
  landlocked: fc.boolean(),
  borders: fc.array(fc.stringMatching(/^[A-Z]{3}$/), {
    minLength: 0,
    maxLength: 20,
  }),

  // Démographie et culture
  population: fc.integer({ min: 0, max: 2_000_000_000 }),
  languages: fc.constant({}),
  currencies: fc.constant({}),

  // Identifiants numériques
  idd: fc.record({
    root: fc.constant("+1"),
    suffixes: fc.constant([]),
  }),
  tld: fc.array(fc.string({ minLength: 2, maxLength: 10 }), {
    minLength: 0,
    maxLength: 3,
  }),

  // Médias
  flags: fc.record({
    svg: fc.constant("https://example.com/flag.svg"),
    png: fc.constant("https://example.com/flag.png"),
    alt: fc.constant("Flag"),
  }),

  // Fuseaux horaires
  timezones: fc.array(fc.string({ minLength: 3, maxLength: 20 }), {
    minLength: 1,
    maxLength: 5,
  }),
});

// ---------------------------------------------------------------------------
// Propriété 5 : Exhaustivité
// ---------------------------------------------------------------------------

describe("mood-resolver — Propriété 5 : Exhaustivité", () => {
  // Feature: atlas-globe-3d, Property 5: resolveMood retourne toujours un MoodType valide parmi ['Île', 'Continental', 'Polaire', 'Tropical'] pour tout CountryData arbitraire

  const VALID_MOOD_TYPES: MoodType[] = [
    "Île",
    "Continental",
    "Polaire",
    "Tropical",
  ];

  it("retourne toujours un MoodType valide pour tout CountryData arbitraire", () => {
    fc.assert(
      fc.property(arbitraryCountryData, (country) => {
        const mood = resolveMood(country);

        // Le résultat doit être un objet non-null
        expect(mood).toBeDefined();
        expect(mood).not.toBeNull();

        // Le type doit être l'un des 4 MoodType valides
        expect(VALID_MOOD_TYPES).toContain(mood.type);

        // Le label doit être une chaîne non vide
        expect(typeof mood.label).toBe("string");
        expect(mood.label.length).toBeGreaterThan(0);

        // L'icône doit être une chaîne non vide
        expect(typeof mood.icon).toBe("string");
        expect(mood.icon.length).toBeGreaterThan(0);

        // Le colorScheme doit être une chaîne non vide
        expect(typeof mood.colorScheme).toBe("string");
        expect(mood.colorScheme.length).toBeGreaterThan(0);
      }),
      { numRuns: 100 }
    );
  });
});

// ---------------------------------------------------------------------------
// Propriété 6 : Déterminisme
// ---------------------------------------------------------------------------

describe("mood-resolver — Propriété 6 : Déterminisme", () => {
  // Feature: atlas-globe-3d, Property 6: resolveMood(c) === resolveMood(c) pour tout pays c

  it("retourne le même résultat pour le même CountryData (appels successifs)", () => {
    fc.assert(
      fc.property(arbitraryCountryData, (country) => {
        const mood1 = resolveMood(country);
        const mood2 = resolveMood(country);

        // Les deux appels doivent retourner le même type
        expect(mood1.type).toBe(mood2.type);

        // Les deux appels doivent retourner le même label
        expect(mood1.label).toBe(mood2.label);

        // Les deux appels doivent retourner la même icône
        expect(mood1.icon).toBe(mood2.icon);

        // Les deux appels doivent retourner le même colorScheme
        expect(mood1.colorScheme).toBe(mood2.colorScheme);
      }),
      { numRuns: 100 }
    );
  });
});

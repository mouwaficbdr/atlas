import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import type { CountryData, GeoJSONFeature } from '../types';
import { findCountryAtLonLat } from '../globe/pick-country';

// Garde-fou de régénération (scripts/generate-geo.js) : aucun champ clé
// vide ni repli silencieux sur l'anglais pour les 193 États.
const geo = JSON.parse(readFileSync(join(process.cwd(), 'public/data/countries-geo.json'), 'utf8')) as {
  features: Array<GeoJSONFeature & { properties: CountryData & { idd?: { root?: string }; tld?: string[] } }>;
};
const countries = geo.features.map((f) => f.properties);

const REQUIRED: Record<string, (c: (typeof countries)[number]) => boolean> = {
  nameFr: (c) => !!c.nameFr,
  capitalFr: (c) => !!c.capitalFr,
  regionFr: (c) => !!c.regionFr,
  subregionFr: (c) => !!c.subregionFr,
  demonymFr: (c) => !!c.demonymFr,
  governmentFr: (c) => !!c.governmentFr,
  idd: (c) => !!c.idd?.root,
  tld: (c) => (c.tld ?? []).length > 0,
  primaryTimezone: (c) => !!c.primaryTimezone && c.primaryTimezone !== 'UTC',
  languages: (c) => Object.keys(c.languages ?? {}).length > 0,
  currencies: (c) => Object.keys(c.currencies ?? {}).length > 0,
  population: (c) => c.population > 0 && !!c.populationYear,
  area: (c) => c.area > 0,
};

describe('couverture des données pays', () => {
  it('compte exactement les 193 États souverains', () => {
    expect(countries).toHaveLength(193);
    expect(new Set(countries.map((c) => c.cca3)).size).toBe(193);
  });

  for (const [field, isPresent] of Object.entries(REQUIRED)) {
    it(`renseigne ${field} pour tous les pays`, () => {
      expect(countries.filter((c) => !isPresent(c)).map((c) => c.cca3)).toEqual([]);
    });
  }

  it('nomme langues et monnaies en français', () => {
    // Mots anglais qu'Intl ou le dictionnaire du générateur auraient dû traduire
    // (sensible à la casse : « Dollar des Kiribati » passe, « Kiribati dollar » non).
    const english = /\b(Language|Sign|Creole|dollar|pound|rupee|franc|dinar|Chinese|English|Spanish|Arabic|French|Portuguese)\b/;
    const names = countries.flatMap((c) => [
      ...Object.values(c.languages ?? {}),
      ...Object.values(c.currencies ?? {}).map((cur) => cur.name),
    ]);
    expect(names.filter((name) => english.test(name))).toEqual([]);
  });

  it('donne des noms affichables en titre, sans parenthèse ni abréviation', () => {
    expect(countries.filter((c) => /[().]/.test(c.nameFr)).map((c) => c.nameFr)).toEqual([]);
  });

  it('couvre le Soudan du Sud sur le globe, distinct du Soudan', () => {
    expect(findCountryAtLonLat(31.58, 4.85, geo.features)).toBe('SSD'); // Djouba
    expect(findCountryAtLonLat(32.53, 15.5, geo.features)).toBe('SDN'); // Khartoum
  });

  it('ne référence que des voisins présents dans le jeu de données', () => {
    const codes = new Set(countries.map((c) => c.cca3));
    const dangling = countries.flatMap((c) => c.borders.filter((b) => !codes.has(b)).map((b) => `${c.cca3}->${b}`));
    expect(dangling).toEqual([]);
  });
});

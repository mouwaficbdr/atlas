/**
 * Recherche : correspondance sur les noms français et insensibilité aux
 * accents (findings d'audit P5).
 */

import { describe, it, expect } from 'vitest';
import { filterCountries } from '../search-engine';
import type { CountryData } from '../types';

function country(partial: Partial<CountryData>): CountryData {
  return {
    cca3: 'XXX',
    cca2: 'XX',
    name: { common: 'X', official: 'X', nativeName: {} },
    nameFr: 'X',
    officialNameFr: 'X',
    demonymFr: '',
    capital: [],
    capitalFr: '',
    region: 'X',
    regionFr: 'X',
    subregion: 'X',
    subregionFr: 'X',
    latlng: [0, 0],
    area: 0,
    landlocked: false,
    borders: [],
    population: 0,
    populationYear: null,
    languages: {},
    currencies: {},
    idd: null,
    tld: [],
    flags: { svg: '', png: '', alt: '' },
    timezones: [],
    primaryTimezone: 'UTC',
    governmentFr: null,
    independent: true,
    centroid: [0, 0],
    ...partial,
  };
}

const DE = country({
  cca3: 'DEU',
  name: { common: 'Germany', official: 'Federal Republic of Germany', nativeName: {} },
  nameFr: 'Allemagne',
  officialNameFr: "République fédérale d'Allemagne",
});
const BR = country({
  cca3: 'BRA',
  name: { common: 'Brazil', official: 'Federative Republic of Brazil', nativeName: {} },
  nameFr: 'Brésil',
  officialNameFr: 'République fédérative du Brésil',
});
const CI = country({
  cca3: 'CIV',
  name: { common: 'Ivory Coast', official: "Republic of Côte d'Ivoire", nativeName: {} },
  nameFr: "Côte d'Ivoire",
  officialNameFr: "République de Côte d'Ivoire",
});

const ALL = [DE, BR, CI];

describe('recherche en français', () => {
  it('trouve un pays par son nom français', () => {
    expect(filterCountries('Allemagne', ALL)[0]?.cca3).toBe('DEU');
  });

  it('ignore les accents dans la requête', () => {
    expect(filterCountries('bresil', ALL)[0]?.cca3).toBe('BRA');
  });

  it('ignore les accents dans les données indexées', () => {
    expect(filterCountries('cote d', ALL)[0]?.cca3).toBe('CIV');
  });

  it('trouve toujours par le nom anglais', () => {
    expect(filterCountries('germany', ALL)[0]?.cca3).toBe('DEU');
  });

  it("expose le nom français dans le résultat", () => {
    expect(filterCountries('Allemagne', ALL)[0]?.name).toBe('Allemagne');
  });
});

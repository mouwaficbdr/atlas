import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { countryDescription } from '../og';
import type { CountryData } from '../types';

const countries = (
  JSON.parse(readFileSync(join(process.cwd(), 'public/data/countries-geo.json'), 'utf8')) as {
    features: Array<{ properties: CountryData }>;
  }
).features.map((f) => f.properties);
const byCode = (cca3: string) => countries.find((c) => c.cca3 === cca3)!;

describe('countryDescription', () => {
  it('résume le pays sans article à accorder', () => {
    expect(countryDescription(byCode('JPN'))).toBe(
      'Japon · capitale Tokyo · 123,4 millions d’habitants · japonais · yen japonais. Sa fiche complète sur le globe 3D atlas.',
    );
  });

  it('donne le nombre exact sous le million', () => {
    expect(countryDescription(byCode('TUV'))).toMatch(/^Tuvalu · capitale Funafuti · \d[\d  ]* habitants · /);
  });

  it('tient en 160 caractères pour les 193 pays', () => {
    const tooLong = countries.map(countryDescription).filter((d) => d.length > 160);
    expect(tooLong).toEqual([]);
  });
});

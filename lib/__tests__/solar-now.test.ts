import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { nightCount, phaseOf, sunriseCountry } from '../solar-now';
import type { CountryData } from '../types';

const all = (
  JSON.parse(readFileSync(join(process.cwd(), 'public/data/countries-geo.json'), 'utf8')) as {
    features: Array<{ properties: CountryData }>;
  }
).features.map((f) => f.properties);
const byCode = (cca3: string) => all.find((c) => c.cca3 === cca3)!;

describe('solar-now', () => {
  // Équinoxe, midi UTC : soleil au zénith près du méridien de Greenwich.
  const noon = new Date('2026-03-20T12:00:00Z');

  it('jour à Accra, nuit à Tokyo à midi UTC', () => {
    expect(phaseOf(byCode('GHA'), noon)).toBe('jour');
    expect(phaseOf(byCode('JPN'), noon)).toBe('nuit');
  });

  it('trouve un lever de soleil côté matin, au ras de l’horizon', () => {
    const c = sunriseCountry(all, noon)!;
    expect(['aube', 'jour']).toContain(phaseOf(c, noon));
    // À midi UTC le matin est à l'ouest : Amériques.
    expect(c.capitalLonLat![0]).toBeLessThan(-40);
  });

  it('compte une part plausible des pays dans la nuit', () => {
    const n = nightCount(all, noon);
    expect(n).toBeGreaterThan(30);
    expect(n).toBeLessThan(120);
  });
});

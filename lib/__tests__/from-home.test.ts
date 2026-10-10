import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { areaFromHome, ofName, timeFromHome } from '../from-home';
import { countryOfTimeZone } from '../home-country';
import type { CountryData } from '../types';

const all = (
  JSON.parse(readFileSync(join(process.cwd(), 'public/data/countries-geo.json'), 'utf8')) as {
    features: Array<{ properties: CountryData }>;
  }
).features.map((f) => f.properties);
const byCode = (cca3: string) => all.find((c) => c.cca3 === cca3)!;

describe('pays de l’utilisateur', () => {
  it('déduit le pays du fuseau, alias compris', () => {
    expect(countryOfTimeZone('Africa/Porto-Novo')).toBe('BEN');
    expect(countryOfTimeZone('America/Chicago')).toBe('USA');
    expect(countryOfTimeZone('Etc/UTC')).toBeNull();
  });

  it('contracte « de » avec l’article', () => {
    expect(ofName('Bénin')).toBe('du Bénin');
    expect(ofName('France')).toBe('de la France');
    expect(ofName('États-Unis')).toBe('des États-Unis');
    expect(ofName('Cuba')).toBe('de Cuba');
  });

  it('rapporte l’heure et la superficie au pays de l’utilisateur', () => {
    const winter = new Date('2026-01-15T12:00:00Z');
    expect(timeFromHome(byCode('JPN'), byCode('BEN'), winter)).toBe('8 h de plus qu’à Porto-Novo');
    expect(timeFromHome(byCode('IND'), byCode('FRA'), winter)).toBe('4 h 30 de plus qu’à Paris');
    expect(timeFromHome(byCode('NGA'), byCode('BEN'), winter)).toBe('Même heure qu’à Porto-Novo');
    expect(areaFromHome(byCode('FRA'), byCode('BEN'))).toMatch(/^\d+,?\d* fois la superficie du Bénin$/);
    expect(areaFromHome(byCode('BEN'), byCode('RUS'))).toBe('0,7 % de la superficie de la Russie');
  });
});

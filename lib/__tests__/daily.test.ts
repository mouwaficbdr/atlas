import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { clue, dailyCountry, matchGuess, shareText } from '../daily';
import type { CountryData } from '../types';

const all = (
  JSON.parse(readFileSync(join(process.cwd(), 'public/data/countries-geo.json'), 'utf8')) as {
    features: Array<{ properties: CountryData }>;
  }
).features.map((f) => f.properties);
const byCode = (cca3: string) => all.find((c) => c.cca3 === cca3)!;

describe('défi du jour', () => {
  it('tire le même pays pour une date, quel que soit l’ordre de la liste', () => {
    const a = dailyCountry(all, '2026-10-10');
    expect(dailyCountry([...all].reverse(), '2026-10-10').cca3).toBe(a.cca3);
    expect(a.area).toBeGreaterThanOrEqual(20_000);
  });

  it('varie d’un jour à l’autre', () => {
    const days = Array.from({ length: 30 }, (_, i) => dailyCountry(all, `2026-11-${String(i + 1).padStart(2, '0')}`).cca3);
    expect(new Set(days).size).toBeGreaterThan(20);
  });

  it('reconnaît une saisie sans accents ni casse', () => {
    expect(matchGuess('benin', all)?.cca3).toBe('BEN');
    expect(matchGuess('Cote d’Ivoire', all)?.cca3).toBe('CIV');
    expect(matchGuess('Germany', all)?.cca3).toBe('DEU');
    expect(matchGuess('Atlantide', all)).toBeNull();
  });

  it('indique la direction depuis la réponse donnée et partage sans révéler', () => {
    expect(clue(byCode('FRA'), byCode('BEN')).direction).toBe('Sud');
    const text = shareText('2026-10-10', [byCode('FRA'), byCode('BEN')], byCode('BEN'), 'https://atlas.mouwaficbdr.me/defi');
    expect(text).toContain('2/3');
    expect(text).not.toMatch(/Bénin|BEN/);
  });
});

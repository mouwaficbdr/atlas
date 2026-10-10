import { describe, it, expect } from 'vitest';
import { compareUrl, defiUrl, logbookUrl, parseCompare, parseDefi, parseLogbook } from '../share-urls';

const known = new Set(['FRA', 'BRA', 'BEN', 'JPN']);

describe('liens de partage', () => {
  it('aller-retour de la comparaison, refus du reste', () => {
    expect(compareUrl('FRA', 'BRA')).toMatch(/\/comparer\/fra-bra$/);
    expect(parseCompare('fra-bra', known)).toEqual(['FRA', 'BRA']);
    expect(parseCompare('fra-fra', known)).toBeNull();
    expect(parseCompare('fra-xyz', known)).toBeNull();
    expect(parseCompare('fra-bra-ben', known)).toBeNull();
    expect(parseCompare('<script>', known)).toBeNull();
  });

  it('carnet : codes connus, sans doublon', () => {
    expect(logbookUrl(['BEN', 'FRA'])).toMatch(/\/carnet\/ben-fra$/);
    expect(parseLogbook('ben-fra-ben-xyz-../etc', known)).toEqual(['BEN', 'FRA']);
  });

  it('défi : grille valide seulement', () => {
    const url = defiUrl('2026-10-10', [{ bearing: 45.4, km: 6050 }, 'ok']);
    expect(url).toMatch(/\/defi\/2026-10-10\/45\.6050_ok$/);
    expect(parseDefi('2026-10-10', '45.6050_ok')).toEqual({ day: '2026-10-10', rows: [{ bearing: 45, km: 6050 }, 'ok'] });
    expect(parseDefi('2026-10-10', 'ok_45.6050')).toBeNull();
    expect(parseDefi('2026-10-10', '400.10')).toBeNull();
    expect(parseDefi('2026-13-45', 'ok')).toBeNull();
    expect(parseDefi('2026-10-10', '1.1_2.2_3.3_ok')).toBeNull();
  });
});

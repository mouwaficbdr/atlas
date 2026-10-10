import { describe, it, expect } from 'vitest';
import { formatShare } from '../format-share';

const nb = (s: string) => s.replace(/\s/g, ' ');

describe('formatShare', () => {
  it('garde deux décimales pour les grandes parts', () => {
    expect(nb(formatShare(0.1762))).toBe('17,62 %');
    expect(nb(formatShare(0.0084))).toBe('0,84 %');
  });

  it('ne tombe jamais à « 0 % » pour un petit pays', () => {
    expect(nb(formatShare(0.0000123))).toBe('0,0012 %');
    expect(nb(formatShare(0.0000012))).toBe('0,00012 %');
  });
});

import { describe, it, expect } from 'vitest';
import { formatLat, formatLon, utcOffset } from '../format-coords';

describe('formatLat', () => {
  it('nord : valeur positive, suffixe N', () => {
    expect(formatLat(46.6201)).toBe('46,6201° N');
  });
  it('sud : valeur absolue, suffixe S', () => {
    expect(formatLat(-35.18)).toBe('35,1800° S');
  });
  it('équateur : N', () => {
    expect(formatLat(0)).toBe('0,0000° N');
  });
});

describe('formatLon', () => {
  it('est : valeur positive, suffixe E', () => {
    expect(formatLon(2.4528)).toBe('2,4528° E');
  });
  it('ouest : valeur absolue, suffixe O', () => {
    expect(formatLon(-99.1439)).toBe('99,1439° O');
  });
});

describe('utcOffset', () => {
  it('renvoie un décalage au format UTC±HH:MM pour un fuseau IANA', () => {
    expect(utcOffset('Europe/Paris')).toMatch(/^UTC[+-]\d{2}:\d{2}$/);
  });
  it('renvoie UTC+00:00 pour un fuseau inconnu', () => {
    expect(utcOffset('Pas/Un/Fuseau')).toBe('UTC+00:00');
  });
});

import { describe, it, expect } from 'vitest';
import { initialBearing, cardinalDirection } from '../bearing';

describe('initialBearing', () => {
  it('donne les quatre caps principaux', () => {
    expect(initialBearing([0, 0], [0, 10])).toBeCloseTo(0, 6);
    expect(initialBearing([0, 0], [10, 0])).toBeCloseTo(90, 6);
    expect(initialBearing([0, 0], [0, -10])).toBeCloseTo(180, 6);
    expect(initialBearing([0, 0], [-10, 0])).toBeCloseTo(270, 6);
  });

  it('place l’Espagne au sud-ouest de la France', () => {
    // Centroïdes approximatifs [lon, lat].
    const bearing = initialBearing([2.5, 46.5], [-3.6, 40.3]);
    expect(cardinalDirection(bearing)).toBe('Sud-Ouest');
  });
});

describe('cardinalDirection', () => {
  it('arrondit à l’aire de vent la plus proche, nord compris des deux côtés', () => {
    expect(cardinalDirection(0)).toBe('Nord');
    expect(cardinalDirection(350)).toBe('Nord');
    expect(cardinalDirection(44)).toBe('Nord-Est');
    expect(cardinalDirection(200)).toBe('Sud');
    expect(cardinalDirection(300)).toBe('Nord-Ouest');
  });
});

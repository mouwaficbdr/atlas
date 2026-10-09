import { describe, it, expect } from 'vitest';
import { homeLongitude } from '../globe/sun';

describe('homeLongitude', () => {
  it('garde le soleil légèrement à l’est du centre de la vue', () => {
    // Soleil au-dessus de l'Inde (midi local) : vue centrée sur l'Afrique de l'Est.
    expect(homeLongitude(78)).toBe(50);
    // Soleil au-dessus du Mexique (soir en Europe) : vue sur les Amériques, pas le Pacifique.
    expect(homeLongitude(-96)).toBe(-100);
  });
});

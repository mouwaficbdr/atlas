import { describe, it, expect } from 'vitest';
import { controlsEnabled, globeDistance, sphereScreenDiameter } from '../globe/intro';

describe('globeDistance', () => {
  it('garde la distance de 3 en paysage', () => {
    expect(globeDistance(16 / 9)).toBe(3);
  });

  it('recule en portrait pour que le globe tienne en largeur', () => {
    const aspect = 390 / 844;
    const d = globeDistance(aspect);
    // Diamètre apparent rapporté à la largeur d'écran : moins de 100 %.
    const diameterPx = sphereScreenDiameter(d, 844);
    expect(diameterPx).toBeLessThan(390);
    expect(diameterPx).toBeGreaterThan(390 * 0.8);
  });
});

describe('controlsEnabled', () => {
  it('ne rend la main à l’utilisateur qu’en vue globe, après l’intro', () => {
    expect(controlsEnabled('done', 'globe')).toBe(true);
    expect(controlsEnabled('flying', 'globe')).toBe(false);
    // Régression : actifs sur une fiche, ils déplaçaient la caméra et
    // contrariaient ses vols (globe mal positionné aux frontières).
    expect(controlsEnabled('done', 'country')).toBe(false);
  });
});

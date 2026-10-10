import { describe, it, expect } from 'vitest';
import { flagColors } from '../../scripts/compute-flag-colors.mjs';

// Drapeau à bandes horizontales, avec une ligne de bord mélangée entre deux
// bandes (anticrénelage) : ce que le k-means confondait en violet pour la Russie.
function bands(colors: number[][], rowsPerBand = 20, width = 30) {
  const rows: number[][] = [];
  colors.forEach((c, i) => {
    if (i > 0) rows.push(colors[i - 1].map((v, k) => Math.round((v + c[k]) / 2)));
    for (let r = 0; r < rowsPerBand; r++) rows.push(c);
  });
  const data = new Uint8ClampedArray(rows.length * width * 4);
  rows.forEach((c, r) => {
    for (let x = 0; x < width; x++) data.set([...c, 255], (r * width + x) * 4);
  });
  return data;
}

describe('flagColors', () => {
  it('retient les couleurs réelles, jamais leur mélange', () => {
    const { palette } = flagColors(bands([[255, 255, 255], [0, 57, 166], [213, 43, 30]]));
    expect([...palette].sort()).toEqual(['#0039a6', '#d52b1e', '#ffffff']);
  });

  it('préfère une couleur franche au blanc comme primaire', () => {
    expect(flagColors(bands([[255, 255, 255], [255, 255, 255], [188, 0, 45]])).primary).toBe('#bc002d');
  });

  it('garde deux couleurs pour un drapeau à deux couleurs', () => {
    expect(flagColors(bands([[255, 255, 255], [188, 0, 45]])).palette).toEqual(['#bc002d', '#ffffff']);
  });
});

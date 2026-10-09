import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import { cartesianToLonLat, findCountryAtLonLat } from '../globe/pick-country';
import type { GeoJSONFeature } from '../types';

// Même projection que BordersMesh / HoverHighlight.
function project(lon: number, lat: number): [number, number, number] {
  const phi = (90 - lat) * (Math.PI / 180);
  const theta = (lon + 180) * (Math.PI / 180);
  return [Math.sin(phi) * Math.cos(theta), Math.cos(phi), -Math.sin(phi) * Math.sin(theta)];
}

const square = (lon0: number, lat0: number, size: number) => [
  [lon0, lat0],
  [lon0 + size, lat0],
  [lon0 + size, lat0 + size],
  [lon0, lat0 + size],
  [lon0, lat0],
];

const features = [
  {
    properties: { cca3: 'AAA' },
    geometry: { type: 'Polygon', coordinates: [square(0, 0, 10), square(4, 4, 2)] },
  },
  {
    properties: { cca3: 'BBB' },
    geometry: { type: 'MultiPolygon', coordinates: [[square(-120, -40, 5)], [square(150, 60, 5)]] },
  },
] as unknown as GeoJSONFeature[];

describe('cartesianToLonLat', () => {
  it('inverse exactement la projection des frontières', () => {
    fc.assert(
      fc.property(
        fc.double({ min: -179.9, max: 179.9, noNaN: true }),
        fc.double({ min: -89, max: 89, noNaN: true }),
        (lon, lat) => {
          const [x, y, z] = project(lon, lat);
          const back = cartesianToLonLat(x, y, z);
          expect(back.lat).toBeCloseTo(lat, 6);
          expect(back.lon).toBeCloseTo(lon, 6);
        },
      ),
    );
  });
});

describe('findCountryAtLonLat', () => {
  it('trouve le pays contenant le point', () => {
    expect(findCountryAtLonLat(1, 1, features)).toBe('AAA');
  });

  it("exclut les trous d'un polygone", () => {
    expect(findCountryAtLonLat(5, 5, features)).toBeNull();
  });

  it('cherche dans chaque partie d’un MultiPolygon', () => {
    expect(findCountryAtLonLat(-118, -38, features)).toBe('BBB');
    expect(findCountryAtLonLat(152, 62, features)).toBe('BBB');
  });

  it("renvoie null sur l'océan", () => {
    expect(findCountryAtLonLat(60, -50, features)).toBeNull();
  });
});

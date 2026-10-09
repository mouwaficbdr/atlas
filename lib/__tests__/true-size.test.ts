import { describe, it, expect } from 'vitest';
import { lambertProject, ringAreaKm2, mainPolygons } from '../true-size';

const square = (lon0: number, lat0: number): number[][] => [
  [lon0, lat0],
  [lon0 + 1, lat0],
  [lon0 + 1, lat0 + 1],
  [lon0, lat0 + 1],
  [lon0, lat0],
];

const projectedArea = (ring: number[][], center: [number, number]) =>
  ringAreaKm2(ring.map(([lon, lat]) => lambertProject(lon, lat, center)));

describe('lambertProject', () => {
  it('conserve les surfaces à l’équateur comme aux hautes latitudes', () => {
    // Surfaces exactes d'un carré de 1° sur 1° sur la sphère de rayon 6 371 km.
    expect(projectedArea(square(10, -0.5), [10.5, 0]) / 12364).toBeCloseTo(1, 2);
    expect(projectedArea(square(10, 59.5), [10.5, 60]) / 6182).toBeCloseTo(1, 2);
  });
});

describe('mainPolygons', () => {
  it('écarte un territoire lointain mais garde une île proche', () => {
    const geometry = {
      type: 'MultiPolygon' as const,
      coordinates: [
        [[[0, 44], [6, 44], [6, 50], [0, 50], [0, 44]]], // métropole
        [[[8.5, 41.5], [9.5, 41.5], [9.5, 43], [8.5, 43], [8.5, 41.5]]], // île proche
        [[[-54, 3], [-52, 3], [-52, 5], [-54, 5], [-54, 3]]], // à 7 000 km
      ],
    };
    const { polygons, dropped } = mainPolygons(geometry);
    expect(polygons).toHaveLength(2);
    expect(dropped).toBe(true);
  });
});

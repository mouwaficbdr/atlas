import type { GeoJSONFeature } from '@/lib/types';

/**
 * Convertit un point 3D sur la sphère unité (repère local du globe) en
 * longitude/latitude. Inverse exact de la projection des frontières
 * (BordersMesh, HoverHighlight).
 */
export function cartesianToLonLat(x: number, y: number, z: number): { lon: number; lat: number } {
  const phi = Math.acos(Math.max(-1, Math.min(1, y)));
  const lat = 90 - (phi * 180) / Math.PI;

  const thetaDeg = (Math.atan2(-z, x) * 180) / Math.PI;
  let lon = thetaDeg - 180;
  if (lon < -180) lon += 360;

  return { lon, lat };
}

/**
 * Point (lon, lat) en degrés vers la sphère unité, dans le repère du globe :
 * même projection que les frontières, le survol et la caméra ; inverse exact
 * de cartesianToLonLat.
 */
export function lonLatToCartesian(lon: number, lat: number): [number, number, number] {
  const phi = (90 - lat) * (Math.PI / 180);
  const theta = (lon + 180) * (Math.PI / 180);
  return [Math.sin(phi) * Math.cos(theta), Math.cos(phi), -Math.sin(phi) * Math.sin(theta)];
}

function pointInRing(lon: number, lat: number, ring: number[][]): boolean {
  let inside = false;
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const [xi, yi] = ring[i];
    const [xj, yj] = ring[j];
    const intersects = yi > lat !== yj > lat && lon < ((xj - xi) * (lat - yi)) / (yj - yi) + xi;
    if (intersects) inside = !inside;
  }
  return inside;
}

function pointInPolygon(lon: number, lat: number, polygon: number[][][]): boolean {
  if (!polygon || polygon.length === 0) return false;
  if (!pointInRing(lon, lat, polygon[0])) return false;
  for (let i = 1; i < polygon.length; i++) {
    if (pointInRing(lon, lat, polygon[i])) return false; // dans un trou
  }
  return true;
}

/**
 * Pays contenant le point (lon, lat), ou null si aucun (océan). Recherche
 * côté CPU (point-in-polygon) : aucun maillage par pays n'est nécessaire, la
 * sphère Terre sert de cible de raycast.
 */
export function findCountryAtLonLat(lon: number, lat: number, features: GeoJSONFeature[]): string | null {
  for (const feature of features) {
    const coords = feature.geometry.coordinates;
    const polygons = feature.geometry.type === 'MultiPolygon' ? (coords as number[][][][]) : [coords as number[][][]];
    for (const polygon of polygons) {
      if (pointInPolygon(lon, lat, polygon)) return feature.properties.cca3;
    }
  }
  return null;
}

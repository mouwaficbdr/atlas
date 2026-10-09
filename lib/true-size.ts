/**
 * Comparaison « à taille réelle » : chaque pays est projeté dans une
 * projection azimutale équivalente de Lambert centrée sur lui-même (surfaces
 * exactes, formes peu déformées), en kilomètres, pour superposer deux pays à
 * la même échelle sans la dilatation de Mercator.
 */

const R = 6371;
const RAD = Math.PI / 180;
// Au-delà, une île ou un territoire (Guyane, Alaska, île de Pâques) étirerait
// le dessin au point de rendre la comparaison illisible.
const MAX_ISLAND_KM = 3000;

type Ring = number[][];
type Polygon = Ring[];
type Geometry = { type: 'Polygon' | 'MultiPolygon'; coordinates: number[][][] | number[][][][] };

/** (lon, lat) en degrés vers [x, y] en km, plan tangent en `center` [lon, lat]. */
export function lambertProject(lon: number, lat: number, [lon0, lat0]: [number, number]): [number, number] {
  const φ = lat * RAD;
  const φ0 = lat0 * RAD;
  const dλ = (lon - lon0) * RAD;
  const k = Math.sqrt(2 / (1 + Math.sin(φ0) * Math.sin(φ) + Math.cos(φ0) * Math.cos(φ) * Math.cos(dλ)));
  return [R * k * Math.cos(φ) * Math.sin(dλ), R * k * (Math.cos(φ0) * Math.sin(φ) - Math.sin(φ0) * Math.cos(φ) * Math.cos(dλ))];
}

/** Aire d'un anneau plan (km²), formule du lacet. */
export function ringAreaKm2(ring: number[][]): number {
  let sum = 0;
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    sum += ring[j][0] * ring[i][1] - ring[i][0] * ring[j][1];
  }
  return Math.abs(sum) / 2;
}

function ringCenter(ring: Ring): [number, number] {
  const xs = ring.map((p) => p[0]);
  const ys = ring.map((p) => p[1]);
  return [(Math.min(...xs) + Math.max(...xs)) / 2, (Math.min(...ys) + Math.max(...ys)) / 2];
}

function distanceKm([lon1, lat1]: [number, number], [lon2, lat2]: [number, number]) {
  const a = Math.sin(((lat2 - lat1) * RAD) / 2) ** 2 + Math.cos(lat1 * RAD) * Math.cos(lat2 * RAD) * Math.sin(((lon2 - lon1) * RAD) / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(a));
}

/**
 * Polygones du territoire principal : le plus grand, et ceux à moins de
 * 3 000 km de lui. `dropped` signale qu'un territoire lointain a été écarté.
 */
export function mainPolygons(geometry: Geometry): { polygons: Polygon[]; center: [number, number]; dropped: boolean } {
  const all = (geometry.type === 'Polygon' ? [geometry.coordinates] : geometry.coordinates) as Polygon[];
  const largest = all.reduce((best, poly) => (ringAreaKm2(poly[0]) > ringAreaKm2(best[0]) ? poly : best));
  const center = ringCenter(largest[0]);
  const polygons = all.filter((poly) => distanceKm(center, ringCenter(poly[0])) <= MAX_ISLAND_KM);
  return { polygons, center, dropped: polygons.length < all.length };
}

/** Tracé SVG (km, axe y vers le bas) des anneaux extérieurs, centré sur `center`. */
export function projectedPath(polygons: Polygon[], center: [number, number]): { d: string; extent: number } {
  let extent = 0;
  const d = polygons
    .map((poly) =>
      poly
        .map((ring) => {
          const pts = ring.map(([lon, lat]) => lambertProject(lon, lat, center));
          for (const [x, y] of pts) extent = Math.max(extent, Math.abs(x), Math.abs(y));
          return `M${pts.map(([x, y]) => `${x.toFixed(1)},${(-y).toFixed(1)}`).join('L')}Z`;
        })
        .join(''),
    )
    .join('');
  return { d, extent };
}

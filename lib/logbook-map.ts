import type { GeoJSONFeature } from './types';

/**
 * Planisphère du carnet (projection équirectangulaire) : pays explorés en or,
 * les autres en filigrane. Sert à l'aperçu du carnet et à l'image partagée.
 */
export function drawLogbookMap(
  ctx: CanvasRenderingContext2D,
  features: GeoJSONFeature[],
  explored: Set<string>,
  x: number,
  y: number,
  w: number,
  h: number,
) {
  const px = (lon: number) => x + ((lon + 180) / 360) * w;
  const py = (lat: number) => y + ((90 - lat) / 180) * h;
  ctx.save();
  ctx.beginPath();
  ctx.rect(x, y, w, h);
  ctx.clip();
  for (const f of features) {
    const on = explored.has(f.properties.cca3);
    const polygons =
      f.geometry.type === 'MultiPolygon'
        ? (f.geometry.coordinates as number[][][][])
        : [f.geometry.coordinates as number[][][]];
    // Géométrie déroulée à l'antiméridien (longitudes au-delà de 180) : on la
    // trace aussi décalée d'un tour, la découpe garde ce qui tombe dans la carte.
    const wraps = polygons.some((poly) => poly.some((ring) => ring.some(([lon]) => lon > 180)));
    ctx.beginPath();
    for (const shift of wraps ? [0, -360] : [0]) {
      for (const poly of polygons) {
        for (const ring of poly) {
          ring.forEach(([lon, lat], i) => (i ? ctx.lineTo : ctx.moveTo).call(ctx, px(lon + shift), py(lat)));
          ctx.closePath();
        }
      }
    }
    ctx.fillStyle = on ? '#e2b84a' : 'rgba(255, 255, 255, 0.07)';
    ctx.fill('evenodd');
    if (on) {
      ctx.strokeStyle = '#ffd27a';
      ctx.lineWidth = 0.6;
      ctx.stroke();
    }
  }
  ctx.restore();
}

/**
 * Même planisphère en tracés SVG (image de partage, rendue sans canvas) :
 * un tracé pour les pays explorés, un pour les autres. Un point sur `step`
 * suffit à cette échelle et allège le rendu.
 */
export function logbookMapPaths(
  features: GeoJSONFeature[],
  explored: Set<string>,
  w: number,
  h: number,
  step = 3,
): { on: string; off: string } {
  const px = (lon: number) => (((lon + 180) / 360) * w).toFixed(1);
  const py = (lat: number) => (((90 - lat) / 180) * h).toFixed(1);
  let on = '';
  let off = '';
  for (const f of features) {
    const polygons =
      f.geometry.type === 'MultiPolygon'
        ? (f.geometry.coordinates as number[][][][])
        : [f.geometry.coordinates as number[][][]];
    const wraps = polygons.some((poly) => poly.some((ring) => ring.some(([lon]) => lon > 180)));
    let d = '';
    for (const shift of wraps ? [0, -360] : [0]) {
      for (const poly of polygons) {
        for (const ring of poly) {
          const pts = ring.filter((_, i) => i % step === 0);
          if (pts.length < 3) continue;
          d += `M${pts.map(([lon, lat]) => `${px(lon + shift)},${py(lat)}`).join('L')}Z`;
        }
      }
    }
    if (explored.has(f.properties.cca3)) on += d;
    else off += d;
  }
  return { on, off };
}

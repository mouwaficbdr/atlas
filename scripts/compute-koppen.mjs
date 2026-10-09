/**
 * Trois classes climatiques de Köppen-Geiger principales de chaque pays (part
 * du territoire), figées dans
 * scripts/vendor/koppen.json (lu par generate-geo.js).
 *
 * Source : Beck et al. (2023), Scientific Data 10, 724, carte 1991-2020 à
 * 0,1° (koppen_geiger_tif.zip, figshare 21789074). L'archive pèse 130 Mo et
 * n'est pas versionnée : la télécharger, en extraire
 * 1991_2020/koppen_geiger_0p1.tif, puis :
 *
 *   node scripts/compute-koppen.mjs <chemin/vers/koppen_geiger_0p1.tif>
 *
 * Méthode : cellules dont le centre tombe dans le pays, pondérées par leur
 * surface (cos de la latitude). Un micro-État sans cellule prend la cellule
 * terrestre la plus proche de son centroïde.
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { fromFile } from 'geotiff';

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const CODES = [null, 'Af', 'Am', 'Aw', 'BWh', 'BWk', 'BSh', 'BSk', 'Csa', 'Csb', 'Csc', 'Cwa', 'Cwb', 'Cwc', 'Cfa', 'Cfb', 'Cfc', 'Dsa', 'Dsb', 'Dsc', 'Dsd', 'Dwa', 'Dwb', 'Dwc', 'Dwd', 'Dfa', 'Dfb', 'Dfc', 'Dfd', 'ET', 'EF'];

// Abscisses où les anneaux d'un polygone (trous compris) coupent la latitude
// `y`, triées : les cellules à l'intérieur sont entre les paires (pair-impair).
function crossings(y, poly) {
  const xs = [];
  for (const ring of poly) {
    for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
      const [xi, yi] = ring[i];
      const [xj, yj] = ring[j];
      if (yi > y !== yj > y) xs.push(((xj - xi) * (y - yi)) / (yj - yi) + xi);
    }
  }
  return xs.sort((a, b) => a - b);
}

const tifPath = process.argv[2];
if (!tifPath) throw new Error('Chemin du GeoTIFF 0,1° manquant (voir en-tête).');

const tiff = await fromFile(tifPath);
try {
  const image = await tiff.getImage();
  const [west, , , north] = image.getBoundingBox();
  const [resX, resY] = image.getResolution();
  const width = image.getWidth();
  const height = image.getHeight();
  const [raster] = await image.readRasters();
  const cell = (col, row) => raster[row * width + col];
  const lonOf = (col) => west + (col + 0.5) * resX;
  const latOf = (row) => north + (row + 0.5) * resY;
  const colOf = (lon) => Math.floor((lon - west) / resX);
  const rowOf = (lat) => Math.floor((lat - north) / resY);

  const geo = JSON.parse(fs.readFileSync(path.join(ROOT, 'public/data/countries-geo.json'), 'utf8'));
  const out = {};

  for (const feature of geo.features) {
    const { cca3, centroid } = feature.properties;
    const polygons = feature.geometry.type === 'Polygon' ? [feature.geometry.coordinates] : feature.geometry.coordinates;
    const weights = new Map();
    let total = 0;

    // Balayage par rangée : O(rangées × sommets) au lieu d'un test par cellule.
    for (const poly of polygons) {
      const ys = poly[0].map((p) => p[1]);
      for (let row = Math.max(0, rowOf(Math.max(...ys))); row <= Math.min(height - 1, rowOf(Math.min(...ys))); row++) {
        const lat = latOf(row);
        const xs = crossings(lat, poly);
        const w = Math.cos((lat * Math.PI) / 180);
        for (let k = 0; k + 1 < xs.length; k += 2) {
          // Les anneaux peuvent être déroulés au-delà de 180° (antiméridien).
          for (let col = Math.ceil((xs[k] - west) / resX - 0.5); lonOf(col) < xs[k + 1]; col++) {
            const value = cell(((col % width) + width) % width, row);
            if (!CODES[value]) continue;
            weights.set(value, (weights.get(value) ?? 0) + w);
            total += w;
          }
        }
      }
    }

    if (total === 0) {
      // Micro-État : cellule terrestre la plus proche du centroïde.
      const [lon0, lat0] = centroid;
      let best = null;
      for (let r = 0; r < 30 && !best; r++) {
        for (let dr = -r; dr <= r && !best; dr++) {
          for (let dc = -r; dc <= r; dc++) {
            const row = rowOf(lat0) + dr;
            const col = (((colOf(lon0) + dc) % width) + width) % width;
            if (row < 0 || row >= height) continue;
            if (CODES[cell(col, row)]) { best = cell(col, row); break; }
          }
        }
      }
      if (best) out[cca3] = [{ code: CODES[best], share: null }];
      continue;
    }

    out[cca3] = [...weights]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([value, w]) => ({ code: CODES[value], share: Math.round((w / total) * 100) / 100 }));
  }

  fs.writeFileSync(path.join(ROOT, 'scripts/vendor/koppen.json'), JSON.stringify(out));
  const missing = geo.features.map((f) => f.properties.cca3).filter((c) => !out[c]);
  console.log(`Köppen : ${Object.keys(out).length} pays, manquants : ${missing.join(' ') || 'aucun'}`);
} finally {
  tiff.close();
}

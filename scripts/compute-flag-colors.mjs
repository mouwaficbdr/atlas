/**
 * Couleurs de chaque drapeau (primaire + palette de trois), figées dans
 * scripts/vendor/flag-colors.json (lu par generate-geo.js).
 *
 *   node scripts/compute-flag-colors.mjs
 *
 * Source : les PNG déjà référencés par le GeoJSON (flags.png : flagcdn, sauf
 * l'Afghanistan sur Wikimedia).
 *
 * Méthode : on compte les pixels par couleur exacte, puis on rattache chaque
 * couleur, de la plus fréquente à la plus rare, au premier groupe proche.
 * Un groupe garde sa couleur la plus fréquente, une couleur réellement
 * présente dans le drapeau : jamais une moyenne (l'ancien k-means mélangeait
 * le bleu et le rouge de la Russie en violet). Les pixels d'anticrénelage
 * (bord entre deux aplats) tombent sur le segment qui relie deux couleurs plus
 * étendues : ils sont écartés, comme les groupes infimes. Un drapeau à deux
 * couleurs garde donc une palette de deux.
 * La primaire est la couleur franche la plus étendue (le blanc ou le noir
 * font un accent illisible), à défaut la plus étendue tout court.
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const MERGE_DISTANCE = 48;
const MIN_CHROMA = 0.2;
const MIN_PRIMARY_SHARE = 0.05;
const MIN_SHARE = 0.005;
const BLEND_DISTANCE = 24;

const hex = ([r, g, b]) => '#' + [r, g, b].map((v) => v.toString(16).padStart(2, '0')).join('');
const chroma = ([r, g, b]) => (Math.max(r, g, b) - Math.min(r, g, b)) / 255;
const distance = (a, b) => Math.hypot(a[0] - b[0], a[1] - b[1], a[2] - b[2]);

// Distance de `c` au segment [a, b] dans l'espace RGB.
function segmentDistance(c, a, b) {
  const ab = [0, 1, 2].map((i) => b[i] - a[i]);
  const len2 = ab.reduce((s, v) => s + v * v, 0);
  const t = Math.max(0, Math.min(1, [0, 1, 2].reduce((s, i) => s + (c[i] - a[i]) * ab[i], 0) / len2));
  return distance(c, [0, 1, 2].map((i) => a[i] + t * ab[i]));
}

const isBlend = (g, kept) =>
  kept.some((a, i) => kept.slice(i + 1).some((b) => segmentDistance(g.rgb, a.rgb, b.rgb) < BLEND_DISTANCE));

/** `data` : pixels RGBA (ImageData.data). */
export function flagColors(data) {
  const counts = new Map();
  for (let i = 0; i < data.length; i += 4) {
    if (data[i + 3] < 128) continue;
    const key = (data[i] << 16) | (data[i + 1] << 8) | data[i + 2];
    counts.set(key, (counts.get(key) || 0) + 1);
  }

  const groups = [];
  for (const [key, n] of [...counts].sort((a, b) => b[1] - a[1])) {
    const rgb = [key >> 16, (key >> 8) & 255, key & 255];
    const group = groups.find((g) => distance(g.rgb, rgb) < MERGE_DISTANCE);
    if (group) group.n += n;
    else groups.push({ rgb, n });
  }
  groups.sort((a, b) => b.n - a.n);

  const total = groups.reduce((s, g) => s + g.n, 0);
  const real = [];
  for (const g of groups) {
    if (g.n / total < MIN_SHARE) break;
    if (!isBlend(g, real)) real.push(g);
  }
  const primary =
    real.find((g) => g.n / total >= MIN_PRIMARY_SHARE && chroma(g.rgb) >= MIN_CHROMA) || real[0];
  const palette = [primary, ...real.filter((g) => g !== primary)].slice(0, 3);
  return { primary: hex(primary.rgb), palette: palette.map((g) => hex(g.rgb)) };
}

async function main() {
  const { createCanvas, loadImage } = await import('canvas');
  const geo = JSON.parse(fs.readFileSync(path.join(ROOT, 'public/data/countries-geo.json'), 'utf-8'));
  const out = {};

  for (const { properties: p } of geo.features) {
    // Wikimedia (Afghanistan) n'accepte que ses largeurs de vignette standard
    // et un User-Agent.
    const url = p.flags.png.replace('/320px-', '/330px-');
    const res = await fetch(url, { headers: { 'User-Agent': 'atlas-build (https://atlas.mouwaficbdr.me)' } });
    if (!res.ok) throw new Error(`${p.cca3} : ${res.status} sur ${url}`);
    const img = await loadImage(Buffer.from(await res.arrayBuffer()));
    const ctx = createCanvas(img.width, img.height).getContext('2d');
    ctx.drawImage(img, 0, 0);
    out[p.cca3] = flagColors(ctx.getImageData(0, 0, img.width, img.height).data);
  }

  fs.writeFileSync(path.join(ROOT, 'scripts/vendor/flag-colors.json'), JSON.stringify(out));
  console.log('\nÉcrit scripts/vendor/flag-colors.json. Lancer ensuite : node scripts/generate-geo.js');
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  main().catch((err) => {
    console.error(err);
    process.exit(1);
  });
}

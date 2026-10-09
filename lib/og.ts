/**
 * Ressources partagées pour la génération des images Open Graph (next/og).
 * Les polices sont vendorées dans public/fonts (aucun fetch réseau au build).
 */

import { readFileSync } from 'fs';
import { join } from 'path';

const fontsDir = join(process.cwd(), 'public', 'fonts');

export const OG_SIZE = { width: 1200, height: 630 } as const;
export const OG_CONTENT_TYPE = 'image/png' as const;

/** Palette ATLAS, alignée sur styles/tokens.css. */
export const OG_COLORS = {
  bg: '#0a0a14',
  ink: '#f0f0f0',
  accent: '#4fc3f7',
  gold: '#d4af37',
  muted: 'rgba(240, 240, 240, 0.55)',
  hairline: 'rgba(255, 255, 255, 0.14)',
} as const;

type OgFont = {
  name: string;
  data: Buffer;
  weight: 400 | 700;
  style: 'normal';
};

let cached: OgFont[] | null = null;

export function ogFonts(): OgFont[] {
  if (cached) return cached;
  cached = [
    {
      name: 'Bebas Neue',
      data: readFileSync(join(fontsDir, 'BebasNeue-Regular.ttf')),
      weight: 400,
      style: 'normal',
    },
    {
      name: 'JetBrains Mono',
      data: readFileSync(join(fontsDir, 'JetBrainsMono-Regular.ttf')),
      weight: 400,
      style: 'normal',
    },
    {
      name: 'JetBrains Mono',
      data: readFileSync(join(fontsDir, 'JetBrainsMono-Bold.ttf')),
      weight: 700,
      style: 'normal',
    },
  ];
  return cached;
}

/**
 * Télécharge un drapeau et le renvoie en data URI base64, ou null si
 * indisponible : la génération d'image ne doit jamais faire échouer le build.
 */
export async function flagDataUri(cca2: string): Promise<string | null> {
  const code = cca2.toLowerCase();
  const urls = [
    `https://flagcdn.com/w1280/${code}.png`,
    `https://flagcdn.com/w640/${code}.png`,
  ];
  for (const url of urls) {
    try {
      const res = await fetch(url);
      if (!res.ok) continue;
      const buf = Buffer.from(await res.arrayBuffer());
      return `data:image/png;base64,${buf.toString('base64')}`;
    } catch {
      // essai suivant
    }
  }
  return null;
}

/** "66 351 959" : espace fine insécable, format FR. */
export function frInt(n: number): string {
  return new Intl.NumberFormat('fr-FR').format(n);
}

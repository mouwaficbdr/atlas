/**
 * Charge la source MDX d'un pays depuis `/content/countries/[cca3].mdx` au
 * build. Retourne `raw: null` sans throw si le fichier est absent ou illisible.
 *
 * Le rendu se fait côté serveur (next-mdx-remote/rsc dans MDXSection) : on ne
 * transporte que la source brute, jamais un bundle compilé à évaluer côté
 * client (interdit par le CSP de production).
 */

import fs from 'fs';
import path from 'path';
import type { MDXContent } from './types';

function parseFrontmatter(raw: string): MDXContent['frontmatter'] {
  const block = raw.match(/^---\r?\n([\s\S]*?)\r?\n---/);
  if (!block) return {};

  const fm: Record<string, string> = {};
  for (const line of block[1].split(/\r?\n/)) {
    const kv = line.match(/^(\w+):\s*(.*)$/);
    if (!kv) continue;
    fm[kv[1]] = kv[2].trim().replace(/^["']|["']$/g, '');
  }

  return {
    title: fm.title || undefined,
    description: fm.description || undefined,
    author: fm.author || undefined,
    date: fm.date || undefined,
  };
}

/**
 * @param cca3 - Code Alpha-3 du pays (ex: "BEN", "FRA")
 * @returns Promise<MDXContent> : source brute + frontmatter, ou `raw: null`.
 */
export async function loadMDX(cca3: string): Promise<MDXContent> {
  const filePath = path.join(
    process.cwd(),
    'content',
    'countries',
    `${cca3}.mdx`,
  );

  if (!fs.existsSync(filePath)) {
    return { cca3, raw: null, frontmatter: {} };
  }

  try {
    const raw = fs.readFileSync(filePath, 'utf-8');
    return { cca3, raw, frontmatter: parseFrontmatter(raw) };
  } catch (readError) {
    console.error(
      `[ATLAS] Erreur de lecture du fichier MDX pour ${cca3} (${filePath}):`,
      readError,
    );
    return { cca3, raw: null, frontmatter: {} };
  }
}

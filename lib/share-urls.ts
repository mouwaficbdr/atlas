import { SITE_URL } from './site-config';

/**
 * Liens de partage illustrés (#34) : comparaison, carnet, résultat du défi.
 * Chaque lien porte ses données dans le chemin (le site est statique, sans
 * base) ; à la lecture, tout est validé : c'est une entrée non fiable.
 */

const CODE = /^[a-z]{3}$/;

/** /comparer/fra-bra */
export const compareUrl = (a: string, b: string) => `${SITE_URL}/comparer/${a.toLowerCase()}-${b.toLowerCase()}`;

export function parseCompare(pair: string, known: Set<string>): [string, string] | null {
  const [a, b, ...rest] = pair.toLowerCase().split('-');
  if (rest.length || !CODE.test(a ?? '') || !CODE.test(b ?? '') || a === b) return null;
  const A = a.toUpperCase();
  const B = b.toUpperCase();
  return known.has(A) && known.has(B) ? [A, B] : null;
}

/** /carnet/ben-fra-jpn */
export const logbookUrl = (codes: string[]) => `${SITE_URL}/carnet/${codes.map((c) => c.toLowerCase()).join('-')}`;

export function parseLogbook(path: string, known: Set<string>): string[] {
  const codes = path
    .toLowerCase()
    .split('-')
    .filter((c) => CODE.test(c))
    .map((c) => c.toUpperCase())
    .filter((c) => known.has(c));
  return codes.filter((c, i) => codes.indexOf(c) === i);
}

/** Essai du défi tel qu'il se partage : cap et distance, ou trouvé. Jamais le pays. */
export type DefiRow = { bearing: number; km: number } | 'ok';

const DAY = /^\d{4}-\d{2}-\d{2}$/;

/** /defi/2026-10-10/45.6050_ok */
export const defiUrl = (day: string, rows: DefiRow[]) =>
  `${SITE_URL}/defi/${day}/${rows.map((r) => (r === 'ok' ? 'ok' : `${Math.round(r.bearing) % 360}.${Math.round(r.km)}`)).join('_')}`;

export function parseDefi(day: string, grid: string): { day: string; rows: DefiRow[] } | null {
  if (!DAY.test(day) || Number.isNaN(Date.parse(`${day}T00:00:00Z`))) return null;
  const parts = grid.split('_');
  if (parts.length < 1 || parts.length > 3) return null;
  const rows: DefiRow[] = [];
  for (let i = 0; i < parts.length; i++) {
    const p = parts[i];
    if (p === 'ok') {
      // « trouvé » ne peut être que le dernier essai.
      if (i !== parts.length - 1) return null;
      rows.push('ok');
      continue;
    }
    const m = p.match(/^(\d{1,3})\.(\d{1,5})$/);
    if (!m || Number(m[1]) >= 360 || Number(m[2]) > 20_100) return null;
    rows.push({ bearing: Number(m[1]), km: Number(m[2]) });
  }
  return { day, rows };
}

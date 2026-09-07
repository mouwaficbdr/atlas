/**
 * ATLAS° : moteur de recherche pays côté client.
 * Exigences : 8.2, 8.3, 8.4
 *
 * Algorithme de scoring :
 *   3 = correspondance exacte (insensible à la casse et aux accents)
 *   2 = correspondance préfixe
 *   1 = correspondance sous-chaîne
 *
 * Le score d'un pays est le maximum sur tous ses champs interrogeables
 * (nom FR, nom officiel FR, nom EN, nom officiel EN, capitale, code cca3).
 * Résultats triés par score décroissant, limités à 10.
 */

import type { CountryData, SearchResult } from './types';

/** Minuscule + suppression des diacritiques, pour comparer "Brésil" et "bresil". */
function normalize(value: string): string {
  // NFD décompose "é" en "e" + U+0301 ; on retire la plage des accents
  // combinatoires (U+0300 à U+036F).
  return value
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
}

function scoreField(field: string | undefined | null, query: string): number {
  if (!field) return 0;
  const f = normalize(field);
  if (f === query) return 3;
  if (f.startsWith(query)) return 2;
  if (f.includes(query)) return 1;
  return 0;
}

export function filterCountries(
  query: string,
  countries: CountryData[],
): SearchResult[] {
  const trimmed = query.trim();
  if (!trimmed) return [];

  const q = normalize(trimmed);
  const results: SearchResult[] = [];

  for (const country of countries) {
    const score = Math.max(
      scoreField(country.nameFr, q),
      scoreField(country.officialNameFr, q),
      scoreField(country.name.official, q),
      scoreField(country.name.common, q),
      scoreField(country.capitalFr, q),
      scoreField(country.capital?.[0], q),
      scoreField(country.cca3, q),
    );

    if (score > 0) {
      results.push({
        cca3: country.cca3,
        name: country.nameFr ?? country.name.common,
        officialName: country.officialNameFr ?? country.name.official,
        capital: country.capitalFr || country.capital?.[0] || '',
        region: country.regionFr ?? country.region,
        flagSvg: country.flags.svg,
        score,
      });
    }
  }

  results.sort((a, b) => {
    if (b.score !== a.score) return b.score - a.score;
    return a.name.localeCompare(b.name, 'fr');
  });

  return results.slice(0, 10);
}

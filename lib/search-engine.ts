/**
 * ATLAS° Globe 3D — Moteur de recherche pays côté client
 * Exigences : 8.2, 8.3, 8.4
 *
 * Algorithme de scoring :
 *   3 = correspondance exacte (case-insensitive)
 *   2 = correspondance préfixe (case-insensitive)
 *   1 = correspondance sous-chaîne (case-insensitive)
 *
 * Le score d'un pays est le maximum sur tous ses champs interrogeables.
 * Résultats triés par score décroissant, limités à 10.
 * Exécution garantie < 100ms sur 195 pays.
 */

import type { CountryData, SearchResult } from "./types";

// ---------------------------------------------------------------------------
// Scoring helpers
// ---------------------------------------------------------------------------

/**
 * Calcule le score d'un champ par rapport à la requête normalisée.
 * Retourne 3 (exact), 2 (préfixe), 1 (sous-chaîne) ou 0 (aucune correspondance).
 */
function scoreField(field: string | undefined | null, queryLower: string): number {
  if (!field) return 0;

  const fieldLower = field.toLowerCase();

  if (fieldLower === queryLower) return 3;
  if (fieldLower.startsWith(queryLower)) return 2;
  if (fieldLower.includes(queryLower)) return 1;

  return 0;
}

// ---------------------------------------------------------------------------
// filterCountries
// ---------------------------------------------------------------------------

/**
 * Filtre et classe les pays selon la requête de recherche.
 *
 * @param query   - Texte saisi par l'utilisateur
 * @param countries - Liste complète des pays (195 entrées)
 * @returns SearchResult[] triés par score décroissant, max 10 résultats
 */
export function filterCountries(
  query: string,
  countries: CountryData[]
): SearchResult[] {
  const trimmed = query.trim();

  // Requête vide → aucun résultat
  if (!trimmed) return [];

  const queryLower = trimmed.toLowerCase();
  const results: SearchResult[] = [];

  for (const country of countries) {
    // Champs interrogeables : nom officiel, nom courant, capitale[0], cca3
    const score = Math.max(
      scoreField(country.name.official, queryLower),
      scoreField(country.name.common, queryLower),
      scoreField(country.capital?.[0], queryLower),
      scoreField(country.cca3, queryLower)
    );

    if (score > 0) {
      results.push({
        cca3: country.cca3,
        name: country.name.common,
        officialName: country.name.official,
        capital: country.capital?.[0] ?? "",
        region: country.region,
        flagSvg: country.flags.svg,
        score,
      });
    }
  }

  // Tri par score décroissant, puis par nom courant pour la stabilité
  results.sort((a, b) => {
    if (b.score !== a.score) return b.score - a.score;
    return a.name.localeCompare(b.name);
  });

  // Limite à 10 résultats
  return results.slice(0, 10);
}

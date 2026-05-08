/**
 * ATLAS° Globe 3D — Client REST Countries API v3.1
 * Exigences : 3.5, 13.4
 *
 * Utilisé au build time par generateStaticParams pour pré-générer les 195 pages pays.
 * En cas d'indisponibilité de l'API, une erreur explicite est levée pour interrompre le build.
 */

import type { CountryData } from "./types";

// Champs requis par l'interface CountryData — divisés en deux lots de ≤10 champs
// car l'API REST Countries limite à 10 champs par requête.
const FIELDS_BATCH_1 = [
  "cca3",
  "cca2",
  "name",
  "capital",
  "region",
  "subregion",
  "latlng",
  "area",
  "landlocked",
  "borders",
].join(",");

const FIELDS_BATCH_2 = [
  "cca3", // clé de jointure
  "population",
  "languages",
  "currencies",
  "idd",
  "tld",
  "flags",
  "timezones",
].join(",");

const BASE_URL = "https://restcountries.com/v3.1/all";
const API_URL_1 = `${BASE_URL}?fields=${FIELDS_BATCH_1}`;
const API_URL_2 = `${BASE_URL}?fields=${FIELDS_BATCH_2}`;

/**
 * Récupère la liste complète des pays depuis REST Countries API v3.1.
 *
 * Effectue deux requêtes parallèles (limite de 10 champs par requête)
 * et fusionne les résultats par code cca3.
 *
 * @throws {Error} Si l'API est indisponible ou retourne une réponse non-OK,
 *                 afin d'interrompre le build Next.js (generateStaticParams).
 */
export async function fetchAllCountries(): Promise<CountryData[]> {
  async function fetchBatch(url: string): Promise<Record<string, unknown>[]> {
    let response: Response;

    try {
      response = await fetch(url, { cache: "no-store" });
    } catch (cause) {
      throw new Error(
        `[ATLAS] Impossible de contacter REST Countries API (${url}). ` +
          `Vérifiez votre connexion réseau. Cause : ${cause instanceof Error ? cause.message : String(cause)}`
      );
    }

    if (!response.ok) {
      throw new Error(
        `[ATLAS] REST Countries API a retourné une erreur HTTP ${response.status} ${response.statusText}. ` +
          `URL : ${url}`
      );
    }

    let data: unknown;

    try {
      data = await response.json();
    } catch (cause) {
      throw new Error(
        `[ATLAS] Impossible de parser la réponse JSON de REST Countries API. ` +
          `Cause : ${cause instanceof Error ? cause.message : String(cause)}`
      );
    }

    if (!Array.isArray(data)) {
      throw new Error(
        `[ATLAS] La réponse de REST Countries API n'est pas un tableau. ` +
          `Type reçu : ${typeof data}`
      );
    }

    return data as Record<string, unknown>[];
  }

  // Deux requêtes parallèles pour contourner la limite de 10 champs
  const [batch1, batch2] = await Promise.all([
    fetchBatch(API_URL_1),
    fetchBatch(API_URL_2),
  ]);

  // Indexer le second lot par cca3 pour la fusion
  const batch2Map = new Map<string, Record<string, unknown>>();
  for (const country of batch2) {
    const cca3 = country.cca3 as string;
    if (cca3) batch2Map.set(cca3, country);
  }

  // Fusionner les deux lots
  const merged = batch1.map((country) => {
    const cca3 = country.cca3 as string;
    const extra = batch2Map.get(cca3) ?? {};
    return { ...country, ...extra };
  });

  return merged as unknown as CountryData[];
}

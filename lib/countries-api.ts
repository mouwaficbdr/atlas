/**
 * ATLAS° Globe 3D — Client REST Countries API v3.1
 * Exigences : 3.5, 13.4
 *
 * Utilisé au build time par generateStaticParams pour pré-générer les 195 pages pays.
 * En cas d'indisponibilité de l'API, une erreur explicite est levée pour interrompre le build.
 */

import { loadGeoJSON } from "./geojson-loader";
import type { CountryData } from "./types";

export async function fetchAllCountries(): Promise<CountryData[]> {
  try {
    const geojson = await loadGeoJSON();
    const countries: CountryData[] = geojson.features.map((feature: any) => {
      // Map the new properties structure to CountryData
      return feature.properties as CountryData;
    });
    return countries;
  } catch (error) {
    console.error("[ATLAS] Impossible de charger les données pays:", error);
    throw error;
  }
}

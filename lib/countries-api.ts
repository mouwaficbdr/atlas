/**
 * Client REST Countries API v3.1.
 * Utilisé au build time (generateStaticParams) pour pré-générer les 195 pages pays.
 * Lève une erreur explicite si le GeoJSON est indisponible pour interrompre le build.
 */

import { loadGeoJSON } from "./geojson-loader";
import type { CountryData } from "./types";

export async function fetchAllCountries(): Promise<CountryData[]> {
  try {
    const geojson = await loadGeoJSON();
    const countries: CountryData[] = geojson.features.map((feature: any) => {
      // NOTE: L'objet GeoJSON enrichi stocke les CountryData directement dans .properties
      return feature.properties as CountryData;
    });
    return countries;
  } catch (error) {
    console.error("[ATLAS] Impossible de charger les données pays:", error);
    throw error;
  }
}

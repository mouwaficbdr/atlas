/**
 * Accès aux données pays, lues depuis public/data/countries-geo.json (figé au
 * build par scripts/generate-geo.js, aucun appel réseau).
 * Utilisé au build (generateStaticParams) pour pré-générer une page par État
 * souverain. Lève une erreur explicite si le GeoJSON est indisponible, pour
 * interrompre le build plutôt que produire un site incomplet.
 */

import { loadGeoJSON } from "./geojson-loader";
import type { CountryData } from "./types";

export async function fetchAllCountries(): Promise<CountryData[]> {
  try {
    const geojson = await loadGeoJSON();
    const countries: CountryData[] = geojson.features.map((feature: { properties: CountryData }) => {
      // NOTE: L'objet GeoJSON enrichi stocke les CountryData directement dans .properties
      return feature.properties as CountryData;
    });
    return countries;
  } catch (error) {
    console.error("[ATLAS] Impossible de charger les données pays:", error);
    throw error;
  }
}

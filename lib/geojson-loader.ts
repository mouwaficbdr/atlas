/**
 * GeoJSON Loader avec cache mémoire (singleton).
 *
 * Le GeoJSON Natural Earth 110m est chargé une seule fois au montage du Globe
 * et conservé dans une variable de module pour toute la session.
 * Les appels suivants retournent les données en cache sans requête réseau.
 */

import type { GeoJSONCollection } from "./types";

// NOTE: Singleton : les appels concurrents réutilisent le même cache mémoire.
let cachedGeoJSON: GeoJSONCollection | null = null;

/**
 * Charge les données GeoJSON depuis le dossier public avec mise en cache mémoire.
 *
 * @returns Promise<GeoJSONCollection>
 * @throws Error si le chargement réseau échoue
 */
export async function loadGeoJSON(): Promise<GeoJSONCollection> {
  if (cachedGeoJSON !== null) {
    return cachedGeoJSON;
  }

  let data: GeoJSONCollection;

  if (typeof window === 'undefined') {
    const fs = await import('fs');
    const path = await import('path');
    const filePath = path.join(process.cwd(), 'public', 'data', 'countries-geo.json');
    const fileContent = await fs.promises.readFile(filePath, 'utf-8');
    data = JSON.parse(fileContent) as GeoJSONCollection;
  } else {
    // Exécution côté client
    const response = await fetch('/data/countries-geo.json');
    if (!response.ok) {
      throw new Error(
        `[ATLAS] Impossible de charger le GeoJSON : ${response.status} ${response.statusText}`
      );
    }
    data = (await response.json()) as GeoJSONCollection;
  }

  cachedGeoJSON = data;
  return cachedGeoJSON;
}

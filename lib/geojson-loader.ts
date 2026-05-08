/**
 * ATLAS° Globe 3D — GeoJSON Loader avec cache mémoire
 * Exigences : 3.1, 11.2
 *
 * Le GeoJSON Natural Earth 110m est chargé une seule fois au montage du Globe
 * et conservé dans une variable de module (singleton) pour toute la session.
 * Les appels suivants retournent les données en cache sans requête réseau.
 */

import type { GeoJSONCollection } from "./types";

/**
 * Cache module — singleton pour toute la durée de la session.
 * Exigence 3.1 : chargement unique, conservation en mémoire.
 */
let cachedGeoJSON: GeoJSONCollection | null = null;

/**
 * Charge les données GeoJSON Natural Earth 110m depuis le dossier public.
 * Si les données sont déjà en cache, elles sont retournées immédiatement
 * sans déclencher de nouvelle requête réseau.
 *
 * Exigence 3.1 : chargement unique au montage du Globe.
 * Exigence 11.2 : chargement lazy, uniquement au montage du composant Globe.
 *
 * @returns Promise<GeoJSONCollection> — la collection de features GeoJSON
 * @throws Error si le chargement réseau échoue
 */
export async function loadGeoJSON(): Promise<GeoJSONCollection> {
  // Retourner le cache immédiatement si disponible
  if (cachedGeoJSON !== null) {
    return cachedGeoJSON;
  }

  const response = await fetch(
    "/geodata/ne_110m_admin_0_countries.geojson"
  );

  if (!response.ok) {
    throw new Error(
      `[ATLAS] Impossible de charger le GeoJSON : ${response.status} ${response.statusText}`
    );
  }

  const data = (await response.json()) as GeoJSONCollection;

  // Stocker dans le cache module pour les appels suivants
  cachedGeoJSON = data;

  return cachedGeoJSON;
}

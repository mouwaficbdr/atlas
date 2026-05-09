/**
 * ATLAS° Globe 3D — Résolveur d'ambiance visuelle pays
 * Exigence : 6.10
 *
 * Règles de résolution (ordre de priorité) :
 *  1. Île        — borders vide ET area < 100 000 km²
 *  2. Continental — borders ≥ 3 voisins ET landlocked === true
 *  3. Polaire    — latlng[0] > 60 OU latlng[0] < -60
 *  4. Tropical   — défaut
 */

import type { CountryData, CountryMood, MoodType } from "./types";

// ---------------------------------------------------------------------------
// Constantes de seuil
// ---------------------------------------------------------------------------

const ISLAND_MAX_AREA_KM2 = 100_000;
const LANDLOCKED_MIN_BORDERS = 3;
const POLAR_LAT_THRESHOLD = 60;

// ---------------------------------------------------------------------------
// Définitions des moods
// ---------------------------------------------------------------------------

const MOODS: Record<MoodType, CountryMood> = {
  Île: {
    type: "Île",
    label: "Île",
    icon: "Palmtree",
    colorScheme: "mood-island",
  },
  Continental: {
    type: "Continental",
    label: "Continental",
    icon: "Mountain",
    colorScheme: "mood-continental",
  },
  Polaire: {
    type: "Polaire",
    label: "Polaire",
    icon: "Snowflake",
    colorScheme: "mood-polar",
  },
  Tropical: {
    type: "Tropical",
    label: "Tropical",
    icon: "Sun",
    colorScheme: "mood-tropical",
  },
};

// ---------------------------------------------------------------------------
// Fonction principale
// ---------------------------------------------------------------------------

/**
 * Résout l'ambiance visuelle d'un pays à partir de ses données REST Countries.
 *
 * @param country - Les données du pays (CountryData)
 * @returns CountryMood — l'ambiance résolue avec type, label, icône et classe CSS
 */
export function resolveMood(country: CountryData): CountryMood {
  const borders = country.borders || [];
  const area = country.area || 0;
  const landlocked = country.landlocked || false;
  const latitude = country.latlng?.[0] || 0;

  // Règle 1 : Insulaire — pas de frontières terrestres ET superficie < 100 000 km²
  if (borders.length === 0 && area < ISLAND_MAX_AREA_KM2) {
    return MOODS["Île"];
  }

  // Règle 2 : Enclavé — au moins 3 voisins ET pays sans accès à la mer
  if (borders.length >= LANDLOCKED_MIN_BORDERS && landlocked === true) {
    return MOODS["Continental"];
  }

  // Règle 3 : Polaire — latitude au-delà de ±60°
  if (latitude > POLAR_LAT_THRESHOLD || latitude < -POLAR_LAT_THRESHOLD) {
    return MOODS["Polaire"];
  }

  // Règle 4 : Tropical — ambiance par défaut
  return MOODS["Tropical"];
}

/**
 * ATLAS° : ambiance estimée d'un pays.
 *
 * Estimation indicative (pas une classification climatique officielle),
 * dérivée de la latitude du centroïde et de l'insularité :
 *  1. Insulaire  : aucune frontière terrestre ET superficie < 100 000 km²
 *  2. Polaire    : |latitude| > 60
 *  3. Tempéré    : 40 < |latitude| <= 60
 *  4. Subtropical: 23.5 < |latitude| <= 40
 *  5. Tropical   : |latitude| <= 23.5
 */

import type { CountryData, CountryMood, MoodType } from './types';

const ISLAND_MAX_AREA_KM2 = 100_000;
const POLAR = 60;
const TEMPERATE = 40;
const SUBTROPICAL = 23.5;

const MOODS: Record<MoodType, CountryMood> = {
  Insulaire: { type: 'Insulaire', label: 'Insulaire', icon: 'Palmtree', colorScheme: 'mood-island' },
  Polaire: { type: 'Polaire', label: 'Polaire', icon: 'Snowflake', colorScheme: 'mood-polar' },
  Tempéré: { type: 'Tempéré', label: 'Tempéré', icon: 'Mountain', colorScheme: 'mood-temperate' },
  Subtropical: { type: 'Subtropical', label: 'Subtropical', icon: 'Sun', colorScheme: 'mood-subtropical' },
  Tropical: { type: 'Tropical', label: 'Tropical', icon: 'Palmtree', colorScheme: 'mood-tropical' },
};

export function resolveMood(country: CountryData): CountryMood {
  const borders = country.borders || [];
  const area = country.area || 0;
  const lat = Math.abs(country.latlng?.[0] ?? 0);

  if (borders.length === 0 && area < ISLAND_MAX_AREA_KM2) return MOODS.Insulaire;
  if (lat > POLAR) return MOODS.Polaire;
  if (lat > TEMPERATE) return MOODS.Tempéré;
  if (lat > SUBTROPICAL) return MOODS.Subtropical;
  return MOODS.Tropical;
}

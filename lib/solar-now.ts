import type { CountryData } from './types';
import { daylightPhase, solarElevation, solarSide, type DaylightPhase } from './solar';

/** Point de référence d'un pays : sa capitale, à défaut son centre. */
const anchor = (c: CountryData) => c.capitalLonLat ?? c.centroid;

/** Moment de la journée dans le pays, au soleil réel. */
export function phaseOf(country: CountryData, date: Date): DaylightPhase {
  const [lon, lat] = anchor(country);
  return daylightPhase(solarElevation(date, lon, lat), solarSide(date, lon));
}

/** Nombre de pays où le soleil est sous l'horizon (nuit, aube ou crépuscule). */
export function nightCount(countries: CountryData[], date: Date): number {
  return countries.filter((c) => phaseOf(c, date) !== 'jour').length;
}

/** Pays où le soleil se lève en ce moment : côté matin, le plus près de l'horizon. */
export function sunriseCountry(countries: CountryData[], date: Date): CountryData | null {
  let best: CountryData | null = null;
  let bestGap = Infinity;
  for (const c of countries) {
    const [lon, lat] = anchor(c);
    if (solarSide(date, lon) !== 'morning') continue;
    const gap = Math.abs(solarElevation(date, lon, lat));
    if (gap < bestGap) {
      best = c;
      bestGap = gap;
    }
  }
  return best;
}

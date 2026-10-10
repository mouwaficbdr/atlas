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

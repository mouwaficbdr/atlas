/**
 * Position du soleil (précision de l'ordre de la minute) :
 * point subsolaire pour éclairer le globe comme en ce moment, élévation et
 * heures de lever et de coucher pour la capitale d'une fiche.
 */

const RAD = Math.PI / 180;
const DAY_MS = 86_400_000;
// Lever et coucher : centre du disque à -0,833° (réfraction et demi-diamètre).
const HORIZON = -0.833;
const CIVIL_TWILIGHT = -6;

const wrapLon = (lon: number) => ((((lon + 180) % 360) + 360) % 360) - 180;

// Algorithme basse précision de l'Astronomical Almanac (0,01° entre 1950 et 2050).
function equation(date: Date): { declination: number; rightAscension: number; eqTimeMin: number; n: number } {
  const n = date.getTime() / DAY_MS + 2440587.5 - 2451545.0;
  const L = (280.46 + 0.9856474 * n) % 360;
  const g = ((357.528 + 0.9856003 * n) % 360) * RAD;
  const lambda = (L + 1.915 * Math.sin(g) + 0.02 * Math.sin(2 * g)) * RAD;
  const epsilon = (23.439 - 0.0000004 * n) * RAD;
  const rightAscension = Math.atan2(Math.cos(epsilon) * Math.sin(lambda), Math.cos(lambda)) / RAD;
  const declination = Math.asin(Math.sin(epsilon) * Math.sin(lambda)) / RAD;
  const eqTimeMin = 4 * wrapLon(L - rightAscension);
  return { declination, rightAscension, eqTimeMin, n };
}

/** Point de la Terre où le soleil est au zénith (degrés). */
export function solarPosition(date: Date): { declination: number; subsolarLon: number } {
  const { declination, rightAscension, n } = equation(date);
  // Temps sidéral de Greenwich : le soleil est au zénith là où l'angle horaire est nul.
  const gmst = 280.46061837 + 360.98564736629 * n;
  return { declination, subsolarLon: wrapLon(rightAscension - gmst) };
}

/** Hauteur du soleil au-dessus de l'horizon en (lon, lat), en degrés. */
export function solarElevation(date: Date, lon: number, lat: number): number {
  const { declination, subsolarLon } = solarPosition(date);
  const h = (lon - subsolarLon) * RAD;
  const sin =
    Math.sin(lat * RAD) * Math.sin(declination * RAD) + Math.cos(lat * RAD) * Math.cos(declination * RAD) * Math.cos(h);
  return Math.asin(Math.max(-1, Math.min(1, sin))) / RAD;
}

/** Matin si le soleil n'a pas encore passé le méridien du lieu. */
export function solarSide(date: Date, lon: number): 'morning' | 'evening' {
  return wrapLon(lon - solarPosition(date).subsolarLon) < 0 ? 'morning' : 'evening';
}

/**
 * Lever et coucher (UTC) du jour UTC de `date`, ou jour/nuit polaire.
 */
export function sunTimes(
  date: Date,
  lon: number,
  lat: number,
): { sunrise: Date | null; sunset: Date | null; polar: 'day' | 'night' | null } {
  const midnight = Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate());
  const noonGuess = new Date(midnight + DAY_MS / 2 - lon * 4 * 60_000);
  const { declination, eqTimeMin } = equation(noonGuess);
  const cosH =
    (Math.sin(HORIZON * RAD) - Math.sin(lat * RAD) * Math.sin(declination * RAD)) /
    (Math.cos(lat * RAD) * Math.cos(declination * RAD));
  if (cosH < -1) return { sunrise: null, sunset: null, polar: 'day' };
  if (cosH > 1) return { sunrise: null, sunset: null, polar: 'night' };
  const halfDayMin = (Math.acos(cosH) / RAD) * 4;
  const noonMin = 720 - 4 * lon - eqTimeMin;
  return {
    sunrise: new Date(midnight + (noonMin - halfDayMin) * 60_000),
    sunset: new Date(midnight + (noonMin + halfDayMin) * 60_000),
    polar: null,
  };
}

export type DaylightPhase = 'jour' | 'aube' | 'crépuscule' | 'nuit';

export function daylightPhase(elevation: number, side: 'morning' | 'evening'): DaylightPhase {
  if (elevation > HORIZON) return 'jour';
  if (elevation > CIVIL_TWILIGHT) return side === 'morning' ? 'aube' : 'crépuscule';
  return 'nuit';
}

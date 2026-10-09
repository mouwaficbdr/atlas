/**
 * Formatage des coordonnées et fuseaux pour l'affichage FR (finding QA3 :
 * les suffixes "° N" / "° E" étaient codés en dur, donc faux pour tout
 * l'hémisphère sud/ouest).
 */

// Deux décimales, soit environ un kilomètre : au-delà, la précision affichée
// dépasserait celle de la géométrie 1:50m d'où vient le centroïde.
function frDecimal(n: number): string {
  return Math.abs(n).toFixed(2).replace('.', ',');
}

export function formatLat(lat: number): string {
  return `${frDecimal(lat)}° ${lat < 0 ? 'S' : 'N'}`;
}

export function formatLon(lon: number): string {
  return `${frDecimal(lon)}° ${lon < 0 ? 'O' : 'E'}`;
}

/**
 * Décalage UTC courant d'un fuseau IANA, au format "UTC+02:00".
 * Prend en compte l'heure d'été puisque calculé à l'instant présent.
 */
export function utcOffset(timeZone: string): string {
  try {
    const parts = new Intl.DateTimeFormat('en-US', {
      timeZone,
      timeZoneName: 'longOffset',
    }).formatToParts(new Date());
    const raw =
      parts.find((p) => p.type === 'timeZoneName')?.value ?? 'GMT+00:00';
    const match = raw.match(/([+-])(\d{1,2})(?::?(\d{2}))?/);
    if (!match) return 'UTC+00:00';
    const sign = match[1];
    const hh = match[2].padStart(2, '0');
    const mm = (match[3] ?? '00').padStart(2, '0');
    return `UTC${sign}${hh}:${mm}`;
  } catch {
    return 'UTC+00:00';
  }
}

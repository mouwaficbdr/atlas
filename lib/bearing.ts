/**
 * Cap initial (orthodromie) de A vers B, en degrés depuis le nord, sens
 * horaire, dans [0, 360). Points en ordre GeoJSON [lon, lat].
 */
export function initialBearing([lon1, lat1]: [number, number], [lon2, lat2]: [number, number]): number {
  const toRad = Math.PI / 180;
  const φ1 = lat1 * toRad;
  const φ2 = lat2 * toRad;
  const Δλ = (lon2 - lon1) * toRad;
  const y = Math.sin(Δλ) * Math.cos(φ2);
  const x = Math.cos(φ1) * Math.sin(φ2) - Math.sin(φ1) * Math.cos(φ2) * Math.cos(Δλ);
  return ((Math.atan2(y, x) * 180) / Math.PI + 360) % 360;
}

const WINDS = ['Nord', 'Nord-Est', 'Est', 'Sud-Est', 'Sud', 'Sud-Ouest', 'Ouest', 'Nord-Ouest'];

/** Direction cardinale (rose des vents à 8 aires) d'un cap en degrés. */
export function cardinalDirection(bearing: number): string {
  return WINDS[Math.round(bearing / 45) % 8];
}

/** Distance orthodromique entre deux points [lon, lat], en km. */
export function distanceKm([lon1, lat1]: [number, number], [lon2, lat2]: [number, number]): number {
  const toRad = Math.PI / 180;
  const a =
    Math.sin(((lat2 - lat1) * toRad) / 2) ** 2 +
    Math.cos(lat1 * toRad) * Math.cos(lat2 * toRad) * Math.sin(((lon2 - lon1) * toRad) / 2) ** 2;
  return 2 * 6371 * Math.asin(Math.sqrt(a));
}

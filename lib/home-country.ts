import tzCountry from './data/timezone-country.json';

/**
 * Pays de l'utilisateur (#29), sans géolocalisation ni envoi de données :
 * un choix mémorisé sur l'appareil, sinon le fuseau horaire de l'appareil.
 */

const KEY = 'atlas.home';
/** Valeur mémorisée quand l'utilisateur a retiré tout pays. */
const NONE = 'aucun';

export type Home = { cca3: string; source: 'fuseau' | 'choix' } | null;

export function countryOfTimeZone(timeZone: string | undefined): string | null {
  return (timeZone && (tzCountry as Record<string, string>)[timeZone]) || null;
}

export function resolveHome(): Home {
  try {
    const saved = localStorage.getItem(KEY);
    if (saved === NONE) return null;
    if (saved) return { cca3: saved, source: 'choix' };
  } catch {
    // Stockage indisponible (navigation privée) : on se rabat sur le fuseau.
  }
  const cca3 = countryOfTimeZone(Intl.DateTimeFormat().resolvedOptions().timeZone);
  return cca3 ? { cca3, source: 'fuseau' } : null;
}

export function saveHome(cca3: string | null) {
  try {
    localStorage.setItem(KEY, cca3 ?? NONE);
  } catch {
    // Le choix vaut alors pour la session seulement.
  }
}

import type { CountryData } from './types';
import { cardinalDirection, distanceKm, initialBearing } from './bearing';

/**
 * Défi du jour (#31) : le même pays pour tous ce jour-là (UTC), tiré de la
 * date ; trois essais, un indice de plus à chaque erreur. Jouable sans
 * compte ; rater un jour ne coûte rien (aucune série).
 */

export const MAX_GUESSES = 3;
// Assez grand pour être vu sur le globe.
const MIN_AREA_KM2 = 20_000;
const STORAGE_KEY = 'atlas.defi';

export const dayKey = (date: Date) => date.toISOString().slice(0, 10);

/** FNV-1a 32 bits : même tirage partout, sans dépendance. */
function hash(text: string): number {
  let h = 0x811c9dc5;
  for (let i = 0; i < text.length; i++) h = Math.imul(h ^ text.charCodeAt(i), 0x01000193);
  return h >>> 0;
}

export function dailyCountry(countries: CountryData[], day: string): CountryData {
  const pool = countries.filter((c) => c.area >= MIN_AREA_KM2).sort((a, b) => a.cca3.localeCompare(b.cca3));
  return pool[hash(`atlas-defi-${day}`) % pool.length];
}

const normalize = (s: string) =>
  s
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[’'\-\s]+/g, ' ')
    .trim()
    .toLowerCase();

/** Pays désigné par une saisie : nom français, nom anglais ou code. */
export function matchGuess(input: string, countries: CountryData[]): CountryData | null {
  const q = normalize(input);
  if (!q) return null;
  return (
    countries.find((c) => normalize(c.nameFr) === q || normalize(c.name.common) === q || c.cca3.toLowerCase() === q) ??
    null
  );
}

export interface Clue {
  km: number;
  bearing: number;
  direction: string;
}

/** Où se trouve le pays mystère depuis la réponse donnée. */
export function clue(guess: CountryData, answer: CountryData): Clue {
  const bearing = initialBearing(guess.centroid, answer.centroid);
  return { km: distanceKm(guess.centroid, answer.centroid), bearing, direction: cardinalDirection(bearing) };
}

const ARROWS = ['↑', '↗', '→', '↘', '↓', '↙', '←', '↖'];
const fr = new Intl.NumberFormat('fr-FR');
export const roundKm = (km: number) => fr.format(Math.round(km / 50) * 50);
const frDay = new Intl.DateTimeFormat('fr-FR', { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC' });

/** Résultat partageable sans révéler la réponse. */
export function shareText(day: string, guesses: CountryData[], answer: CountryData, url: string): string {
  const won = guesses.some((g) => g.cca3 === answer.cca3);
  const lines = guesses.map((g) => {
    if (g.cca3 === answer.cca3) return '✓ trouvé';
    const c = clue(g, answer);
    return `${ARROWS[Math.round(c.bearing / 45) % 8]} ${roundKm(c.km)} km`;
  });
  const score = won ? `${guesses.length}/${MAX_GUESSES}` : `X/${MAX_GUESSES}`;
  return [`atlas · défi du ${frDay.format(new Date(`${day}T12:00:00Z`))} · ${score}`, ...lines, url].join('\n');
}

export function readGuesses(day: string): string[] {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? 'null');
    return saved?.day === day && Array.isArray(saved.guesses) ? saved.guesses : [];
  } catch {
    return [];
  }
}

export function saveGuesses(day: string, guesses: string[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ day, guesses }));
  } catch {
    // Partie gardée pour la session seulement.
  }
}

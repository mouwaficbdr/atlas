/**
 * Carnet de vol (#30) : une escale par pays dont on a atteint la fin de la
 * fiche, stockée sur l'appareil seulement (aucun compte, aucun envoi).
 * Pas de série de jours ni de rappel : effaçable à tout moment.
 */

const KEY = 'atlas.carnet';

export interface Stamp {
  cca3: string;
  /** Date de la première escale, ISO. */
  at: string;
}

export function readLogbook(): Stamp[] {
  try {
    const raw = JSON.parse(localStorage.getItem(KEY) ?? '[]');
    return Array.isArray(raw) ? raw.filter((s) => typeof s?.cca3 === 'string' && typeof s?.at === 'string') : [];
  } catch {
    return [];
  }
}

function write(stamps: Stamp[]) {
  try {
    localStorage.setItem(KEY, JSON.stringify(stamps));
  } catch {
    // Stockage indisponible : le carnet vaut pour la session.
  }
}

/** Ajoute l'escale si elle est nouvelle ; renvoie le carnet à jour. */
export function stamp(stamps: Stamp[], cca3: string, now = new Date()): Stamp[] {
  if (stamps.some((s) => s.cca3 === cca3)) return stamps;
  const next = [...stamps, { cca3, at: now.toISOString() }];
  write(next);
  return next;
}

export function clearLogbook(): Stamp[] {
  write([]);
  return [];
}

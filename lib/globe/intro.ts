/**
 * Intro « Pale Blue Dot » : au chargement, la caméra est loin, la Terre
 * n'est qu'un point ; à la révélation elle s'approche jusqu'à la vue globe.
 */
export const INTRO_DISTANCE = 60;
export const GLOBE_DISTANCE = 3;
export const CAMERA_FOV_DEG = 45;

/** Diamètre à l'écran (px) d'une sphère de rayon 1 vue à `distance`. */
export function sphereScreenDiameter(distance: number, viewportHeight: number): number {
  const halfFov = (CAMERA_FOV_DEG / 2) * (Math.PI / 180);
  return viewportHeight * (Math.tan(Math.asin(1 / distance)) / Math.tan(halfFov));
}

/**
 * Distance de caméra à l'instant t ∈ [0, 1] du vol d'approche. Interpolée en
 * échelle logarithmique : la taille apparente (∝ 1/distance) croît alors de
 * façon régulière, au lieu de rester un point puis d'exploser à la fin.
 */
export function introDistanceAt(t: number): number {
  return INTRO_DISTANCE * Math.pow(GLOBE_DISTANCE / INTRO_DISTANCE, t);
}

export function prefersReducedMotion(): boolean {
  return typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

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
export function introDistanceAt(t: number, end = GLOBE_DISTANCE): number {
  return INTRO_DISTANCE * Math.pow(end / INTRO_DISTANCE, t);
}

/**
 * Distance de la vue globe pour un écran de rapport `aspect` (largeur sur
 * hauteur) : 3 en paysage ; en portrait, le champ horizontal est étroit et
 * il faut reculer pour que la sphère tienne en largeur, avec une marge.
 */
export function globeDistance(aspect: number): number {
  const halfV = (CAMERA_FOV_DEG / 2) * (Math.PI / 180);
  const halfH = Math.atan(Math.tan(halfV) * aspect);
  return Math.max(GLOBE_DISTANCE, 1.12 / Math.sin(Math.min(halfV, halfH)));
}

/** Distance de la vue globe pour la fenêtre courante. */
export function currentGlobeDistance(): number {
  return typeof window === 'undefined' ? GLOBE_DISTANCE : globeDistance(window.innerWidth / window.innerHeight);
}

export function prefersReducedMotion(): boolean {
  return typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

/**
 * Contrôles d'orbite actifs seulement en vue globe, une fois l'intro jouée.
 * Seule source de vérité : actifs sur une fiche, leurs mises à jour (inertie,
 * distance minimale) déplaçaient la caméra et contrariaient ses vols.
 */
export function controlsEnabled(introPhase: 'waiting' | 'flying' | 'done', cameraMode: 'globe' | 'country'): boolean {
  return introPhase === 'done' && cameraMode === 'globe';
}

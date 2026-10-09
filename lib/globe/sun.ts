import * as THREE from 'three';
import { solarPosition } from '@/lib/solar';
import { cartesianToLonLat, lonLatToCartesian } from './pick-country';

/**
 * Direction du vrai soleil, dans le repère du globe : le jour et la nuit
 * affichés sont ceux de l'instant présent. Objet unique partagé par
 * référence avec les uniforms de la Terre, des nuages et de l'atmosphère :
 * le muter (updateSunDirection) les met tous à jour.
 */
export const SUN_DIRECTION = new THREE.Vector3();

export function updateSunDirection(date = new Date()): THREE.Vector3 {
  const { declination, subsolarLon } = solarPosition(date);
  return SUN_DIRECTION.set(...lonLatToCartesian(subsolarLon, declination));
}

updateSunDirection();

// Composition d'accueil : le soleil un peu à droite (à l'est) du centre, le
// terminateur sur le limbe gauche. Parmi des méridiens riches en terres, on
// retient celui qui s'en approche le plus à cet instant : l'accueil montre des
// continents éclairés plutôt qu'un océan, à toute heure.
const HOME_SUN_OFFSET_DEG = 37.6;
const LAND_MERIDIANS = [-100, -60, 20, 50, 80, 115, 135];
const HOME_LATITUDE = 15;

const wrap = (deg: number) => ((((deg + 180) % 360) + 360) % 360) - 180;

/** Longitude visée par la caméra d'accueil quand le soleil est au zénith en `subsolarLon`. */
export function homeLongitude(subsolarLon: number): number {
  return LAND_MERIDIANS.reduce((best, lon) =>
    Math.abs(wrap(subsolarLon - lon) - HOME_SUN_OFFSET_DEG) < Math.abs(wrap(subsolarLon - best) - HOME_SUN_OFFSET_DEG)
      ? lon
      : best,
  );
}

/** Direction de la caméra d'accueil. */
export function homeViewDirection(sun: THREE.Vector3 = SUN_DIRECTION): THREE.Vector3 {
  const { lon: subsolarLon } = cartesianToLonLat(sun.x, sun.y, sun.z);
  return new THREE.Vector3(...lonLatToCartesian(homeLongitude(subsolarLon), HOME_LATITUDE));
}

import * as THREE from 'three';

/**
 * Direction du soleil partagée par la lumière de la scène (GlobeScene), la
 * Terre, les nuages et l'atmosphère pour un terminateur jour/nuit cohérent
 * entre toutes les couches. Fixe en espace monde, orientée vers la caméra
 * initiale : la face visible au chargement est de jour, le terminateur
 * passe sur le limbe gauche.
 */
export const SUN_DIRECTION = new THREE.Vector3(2, 1, 2.6).normalize();

export const SUN_POSITION = SUN_DIRECTION.clone().multiplyScalar(5).toArray() as [number, number, number];

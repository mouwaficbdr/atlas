import * as THREE from 'three';

/**
 * Textures Terre (jour/nuit/nuages/relief) : NASA Blue Marble,
 * redistribuées par le dépôt three.js (threejs.org/examples/textures/planets,
 * licence MIT du dépôt), copiées dans public/textures/earth.
 */
const PATHS = {
  day: '/textures/earth/day.jpg',
  night: '/textures/earth/night.png',
  clouds: '/textures/earth/clouds.png',
  normal: '/textures/earth/normal.jpg',
} as const;

type TextureKey = keyof typeof PATHS;

// Le normal map est une donnée, pas de la couleur :
// ils restent en espace linéaire, seuls jour/nuit/nuages sont sRGB.
const COLOR_KEYS: ReadonlySet<TextureKey> = new Set<TextureKey>(['day', 'night', 'clouds']);

const loader = new THREE.TextureLoader();
const cache = new Map<TextureKey, Promise<THREE.Texture>>();

export function loadEarthTexture(key: TextureKey): Promise<THREE.Texture> {
  let pending = cache.get(key);
  if (!pending) {
    pending = loader.loadAsync(PATHS[key]).then((texture) => {
      texture.colorSpace = COLOR_KEYS.has(key) ? THREE.SRGBColorSpace : THREE.NoColorSpace;
      texture.anisotropy = 4;
      return texture;
    });
    cache.set(key, pending);
  }
  return pending;
}

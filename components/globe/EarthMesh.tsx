'use client';

import { useEffect, useMemo, useState } from 'react';
import * as THREE from 'three';
import type { ThreeEvent } from '@react-three/fiber';
import { loadEarthTexture } from '@/lib/globe/textures';
import { SUN_DIRECTION } from '@/lib/globe/sun';

const EARTH_RADIUS = 1.0;
const SPHERE_SEGMENTS = 96;

interface EarthMeshProps {
  onPointerMove?: (e: ThreeEvent<PointerEvent>) => void;
  onPointerLeave?: (e: ThreeEvent<PointerEvent>) => void;
  onClick?: (e: ThreeEvent<MouseEvent>) => void;
}

/**
 * EarthMesh : sphère texturée Terre réaliste (jour, lumières des villes côté
 * nuit, relief), NASA Blue Marble, matériau standard de Three.js. Sert aussi
 * de cible de raycast pour la sélection de pays (voir GlobeMesh et
 * lib/globe/pick-country.ts).
 */
export default function EarthMesh({ onPointerMove, onPointerLeave, onClick }: EarthMeshProps) {
  const [textures, setTextures] = useState<{
    day: THREE.Texture;
    night: THREE.Texture;
    normal: THREE.Texture;
  } | null>(null);

  useEffect(() => {
    let cancelled = false;
    Promise.all([
      loadEarthTexture('day'),
      loadEarthTexture('night'),
      loadEarthTexture('normal'),
    ]).then(([day, night, normal]) => {
      if (!cancelled) setTextures({ day, night, normal });
    });
    return () => {
      cancelled = true;
    };
  }, []);

  const geometry = useMemo(() => new THREE.SphereGeometry(EARTH_RADIUS, SPHERE_SEGMENTS, SPHERE_SEGMENTS), []);
  useEffect(() => () => geometry.dispose(), [geometry]);

  const material = useMemo(() => {
    if (!textures) return null;
    const mat = new THREE.MeshStandardMaterial({
      map: textures.day,
      normalMap: textures.normal,
      normalScale: new THREE.Vector2(0.7, 0.7),
      // ponytail: rugosité uniforme, pas de reflet marin (il faudrait un
      // masque terre/mer inversé en roughnessMap). À ajouter si l'océan
      // manque de brillance.
      roughness: 0.85,
      metalness: 0.1,
      emissiveMap: textures.night,
      emissive: new THREE.Color(0xffd9a0),
      emissiveIntensity: 1.4,
    });

    // L'émissif d'un matériau standard ignore l'éclairage : sans ce patch,
    // les lumières des villes brillent aussi en plein jour. On les éteint
    // côté soleil, avec le même terminateur que nuages et atmosphère.
    mat.onBeforeCompile = (shader) => {
      shader.uniforms.uSunDirection = { value: SUN_DIRECTION };
      shader.vertexShader = shader.vertexShader
        .replace('#include <common>', '#include <common>\nvarying vec3 vEarthWorldNormal;')
        .replace(
          '#include <beginnormal_vertex>',
          '#include <beginnormal_vertex>\nvEarthWorldNormal = normalize(mat3(modelMatrix) * objectNormal);',
        );
      shader.fragmentShader = shader.fragmentShader
        .replace(
          '#include <common>',
          '#include <common>\nuniform vec3 uSunDirection;\nvarying vec3 vEarthWorldNormal;',
        )
        .replace(
          '#include <emissivemap_fragment>',
          '#include <emissivemap_fragment>\ntotalEmissiveRadiance *= 1.0 - smoothstep(-0.12, 0.2, dot(normalize(vEarthWorldNormal), uSunDirection));',
        );
    };
    return mat;
  }, [textures]);

  useEffect(() => () => material?.dispose(), [material]);

  if (!material) return null;

  return (
    <mesh
      geometry={geometry}
      material={material}
      // Les UV par défaut de SphereGeometry placent la longitude 0 de la
      // texture 180° plus loin que la projection lon/lat des frontières et
      // du picking (voir pick-country.ts) : demi-tour pour les aligner.
      rotation-y={Math.PI}
      onPointerMove={onPointerMove}
      onPointerLeave={onPointerLeave}
      onClick={onClick}
    />
  );
}

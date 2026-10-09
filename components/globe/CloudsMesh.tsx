'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';
import { loadEarthTexture } from '@/lib/globe/textures';
import { SUN_DIRECTION } from '@/lib/globe/sun';
import { useReducedMotion } from '@/lib/hooks/useReducedMotion';

import vertexShaderRaw from '../../shaders/clouds.vert.glsl';
import fragmentShaderRaw from '../../shaders/clouds.frag.glsl';

const vertexShader =
  typeof vertexShaderRaw === 'string' ? vertexShaderRaw : (vertexShaderRaw as { default: string }).default;
const fragmentShader =
  typeof fragmentShaderRaw === 'string' ? fragmentShaderRaw : (fragmentShaderRaw as { default: string }).default;

const CLOUDS_RADIUS = 1.012;
const SPHERE_SEGMENTS = 64;
const ROTATION_SPEED = 0.004; // Dérive indépendante de la Terre, lente et discrète

export default function CloudsMesh() {
  const [cloudsMap, setCloudsMap] = useState<THREE.Texture | null>(null);
  const meshRef = useRef<THREE.Mesh>(null);
  const reducedMotion = useReducedMotion();

  useEffect(() => {
    let cancelled = false;
    loadEarthTexture('clouds').then((texture) => {
      if (!cancelled) setCloudsMap(texture);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  const geometry = useMemo(
    () => new THREE.SphereGeometry(CLOUDS_RADIUS, SPHERE_SEGMENTS, SPHERE_SEGMENTS),
    [],
  );
  useEffect(() => () => geometry.dispose(), [geometry]);

  const material = useMemo(() => {
    if (!cloudsMap) return null;
    return new THREE.ShaderMaterial({
      vertexShader,
      fragmentShader,
      uniforms: {
        uCloudsMap: { value: cloudsMap },
        uSunDirection: { value: SUN_DIRECTION },
      },
      transparent: true,
      depthWrite: false,
    });
  }, [cloudsMap]);
  useEffect(() => () => material?.dispose(), [material]);

  useFrame((_, delta) => {
    if (reducedMotion || !meshRef.current) return;
    meshRef.current.rotation.y += delta * ROTATION_SPEED;
  });

  if (!material) return null;

  // Même demi-tour que EarthMesh, pour rester calé sur la géographie.
  return <mesh ref={meshRef} geometry={geometry} material={material} renderOrder={1} rotation-y={Math.PI} />;
}

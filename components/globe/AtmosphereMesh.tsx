/**
 * AtmosphereMesh — Halo atmosphérique autour du Globe
 * Sphère de rayon 1,05× le Globe avec shader GLSL rim lighting
 * Matériau additif semi-transparent produisant un halo #4FC3F7, opacité max 0,35
 * Exigence : 1.4
 */

import { useMemo } from "react";
// Import from @react-three/fiber to load the JSX namespace augmentation
import "@react-three/fiber";
import * as THREE from "three";
import vertexShader from "../../shaders/atmosphere.vert.glsl";
import fragmentShader from "../../shaders/atmosphere.frag.glsl";

// Globe radius is 1.0 (standard unit sphere), atmosphere is 1.05×
const GLOBE_RADIUS = 1.0;
const ATMOSPHERE_RADIUS = GLOBE_RADIUS * 1.05;
const SPHERE_SEGMENTS = 64;

export default function AtmosphereMesh() {
  const shaderMaterial = useMemo(
    () =>
      new THREE.ShaderMaterial({
        vertexShader,
        fragmentShader,
        side: THREE.BackSide,
        blending: THREE.AdditiveBlending,
        transparent: true,
        depthWrite: false,
      }),
    []
  );

  return (
    <mesh material={shaderMaterial}>
      <sphereGeometry
        args={[ATMOSPHERE_RADIUS, SPHERE_SEGMENTS, SPHERE_SEGMENTS]}
      />
    </mesh>
  );
}

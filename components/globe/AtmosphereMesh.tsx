/**
 * AtmosphereMesh — Halo atmosphérique autour du Globe
 * Sphère de rayon 1,15× le Globe avec shader GLSL rim lighting
 * Matériau additif semi-transparent produisant un halo bleu
 * Exigence : 1.4
 */

import { useMemo } from "react";
import "@react-three/fiber";
import * as THREE from "three";
// Webpack 5 raw-loader often returns an ES module with a .default string
import vertexShaderRaw from "../../shaders/atmosphere.vert.glsl";
import fragmentShaderRaw from "../../shaders/atmosphere.frag.glsl";

const vertexShader = typeof vertexShaderRaw === 'string' ? vertexShaderRaw : (vertexShaderRaw as { default: string }).default;
const fragmentShader = typeof fragmentShaderRaw === 'string' ? fragmentShaderRaw : (fragmentShaderRaw as { default: string }).default;

const GLOBE_RADIUS = 1.0;
const ATMOSPHERE_RADIUS = GLOBE_RADIUS * 1.15; // Plus large pour un halo visible
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
        depthTest: true,
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

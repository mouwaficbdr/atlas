/**
 * AtmosphereMesh : coquille d'atmosphère, rendue en diffusion de Rayleigh
 * intégrée le long du rayon de vue (atmosphere.frag.glsl). Couvre le disque
 * terrestre et un fin anneau autour ; matériau additif.
 */

import { useMemo } from "react";
import "@react-three/fiber";
import * as THREE from "three";
import { SUN_DIRECTION } from "@/lib/globe/sun";
// Webpack 5 raw-loader often returns an ES module with a .default string
import vertexShaderRaw from "../../shaders/atmosphere.vert.glsl";
import fragmentShaderRaw from "../../shaders/atmosphere.frag.glsl";

const vertexShader = typeof vertexShaderRaw === 'string' ? vertexShaderRaw : (vertexShaderRaw as { default: string }).default;
const fragmentShader = typeof fragmentShaderRaw === 'string' ? fragmentShaderRaw : (fragmentShaderRaw as { default: string }).default;

const GLOBE_RADIUS = 1.0;
// Doit rester égal à ATMOSPHERE_RADIUS de atmosphere.frag.glsl.
const ATMOSPHERE_RADIUS = GLOBE_RADIUS * 1.045;
const SPHERE_SEGMENTS = 96;

export default function AtmosphereMesh() {
  const shaderMaterial = useMemo(
    () =>
      new THREE.ShaderMaterial({
        vertexShader,
        fragmentShader,
        uniforms: {
          uSunDirection: { value: SUN_DIRECTION },
        },
        side: THREE.FrontSide,
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

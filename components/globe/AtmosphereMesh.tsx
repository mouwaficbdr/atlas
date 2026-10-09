/**
 * AtmosphereMesh : halo atmosphérique autour du globe. Sphère de rayon
 * 1,1× rendue par ses faces arrière, matériau additif ; le dégradé (fort au
 * ras du limbe, nul vers l'espace) est calculé dans atmosphere.frag.glsl.
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
// Couplé au seuil 0.42 de atmosphere.frag.glsl (sqrt(1.1² - 1) / 1.1).
const ATMOSPHERE_RADIUS = GLOBE_RADIUS * 1.1;
const SPHERE_SEGMENTS = 64;

export default function AtmosphereMesh() {
  const shaderMaterial = useMemo(
    () =>
      new THREE.ShaderMaterial({
        vertexShader,
        fragmentShader,
        uniforms: {
          uSunDirection: { value: SUN_DIRECTION },
        },
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

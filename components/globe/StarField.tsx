'use client';

import { useEffect, useMemo, useRef } from 'react';
import * as THREE from 'three';
import { useFrame, useThree } from '@react-three/fiber';
import { useReducedMotion } from '@/lib/hooks/useReducedMotion';

import skyVertRaw from '../../shaders/sky.vert.glsl';
import skyFragRaw from '../../shaders/sky.frag.glsl';
import starsVertRaw from '../../shaders/stars.vert.glsl';
import starsFragRaw from '../../shaders/stars.frag.glsl';

const glsl = (raw: unknown) => (typeof raw === 'string' ? raw : (raw as { default: string }).default);

const STAR_COUNT = 7000;
const STAR_RADIUS = 500;
const SKY_RADIUS = 800;
const DRIFT_SPEED = 0.0035; // rad/s : un tour complet en une demi-heure

// Plan galactique incliné en diagonale derrière le globe ; bulbe en bas à droite.
const BAND_NORMAL = new THREE.Vector3(0.48, 0.877, 0).normalize();
const GALACTIC_CORE = new THREE.Vector3(0.7, -0.38, -0.6).normalize();

// Couleurs stellaires (types spectraux O/B à M) et leur fréquence relative.
const STELLAR_PALETTE: Array<[number, [number, number, number]]> = [
  [0.14, [0.72, 0.82, 1.0]],
  [0.36, [1.0, 1.0, 1.0]],
  [0.24, [1.0, 0.96, 0.88]],
  [0.13, [1.0, 0.89, 0.72]],
  [0.09, [1.0, 0.78, 0.56]],
  [0.04, [1.0, 0.66, 0.46]],
];

// Générateur pseudo-aléatoire déterministe : le même ciel à chaque visite.
function mulberry32(seed: number) {
  return () => {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function pickColor(r: number): [number, number, number] {
  let acc = 0;
  for (const [weight, color] of STELLAR_PALETTE) {
    acc += weight;
    if (r <= acc) return color;
  }
  return STELLAR_PALETTE[1][1];
}

/**
 * Ciel profond : Voie lactée et nébulosités (sphère de fond) + étoiles aux
 * couleurs et magnitudes réalistes, plus denses le long du plan galactique.
 * Le tout dérive imperceptiblement (figé si prefers-reduced-motion).
 */
export default function StarField() {
  const reducedMotion = useReducedMotion();
  const groupRef = useRef<THREE.Group>(null);
  const dpr = useThree((state) => state.viewport.dpr);

  const stars = useMemo(() => {
    const random = mulberry32(1969);
    const positions = new Float32Array(STAR_COUNT * 3);
    const colors = new Float32Array(STAR_COUNT * 3);
    const sizes = new Float32Array(STAR_COUNT);
    const brightness = new Float32Array(STAR_COUNT);
    const phases = new Float32Array(STAR_COUNT);
    const dir = new THREE.Vector3();

    for (let i = 0; i < STAR_COUNT; i++) {
      // Direction uniforme sur la sphère ; un tiers ramené vers le plan galactique.
      const z = random() * 2 - 1;
      const theta = random() * Math.PI * 2;
      const s = Math.sqrt(1 - z * z);
      dir.set(s * Math.cos(theta), z, s * Math.sin(theta));
      if (i % 3 === 0) {
        const lat = dir.dot(BAND_NORMAL);
        dir.addScaledVector(BAND_NORMAL, -lat * 0.85).normalize();
      }
      positions.set([dir.x * STAR_RADIUS, dir.y * STAR_RADIUS, dir.z * STAR_RADIUS], i * 3);

      // Magnitude : une écrasante majorité d'étoiles faibles, quelques brillantes.
      const mag = Math.pow(random(), 5);
      sizes[i] = 2.2 + mag * 7.5;
      brightness[i] = 0.28 + mag * 0.72;
      colors.set(pickColor(random()), i * 3);
      phases[i] = random();
    }

    const geom = new THREE.BufferGeometry();
    geom.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geom.setAttribute('aColor', new THREE.BufferAttribute(colors, 3));
    geom.setAttribute('aSize', new THREE.BufferAttribute(sizes, 1));
    geom.setAttribute('aBrightness', new THREE.BufferAttribute(brightness, 1));
    geom.setAttribute('aPhase', new THREE.BufferAttribute(phases, 1));
    return geom;
  }, []);

  const starsMaterial = useMemo(
    () =>
      new THREE.ShaderMaterial({
        vertexShader: glsl(starsVertRaw),
        fragmentShader: glsl(starsFragRaw),
        uniforms: { uTime: { value: 0 }, uPixelRatio: { value: 1 } },
        transparent: true,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
      }),
    [],
  );

  const sky = useMemo(() => new THREE.SphereGeometry(SKY_RADIUS, 160, 80), []);
  const skyMaterial = useMemo(
    () =>
      new THREE.ShaderMaterial({
        vertexShader: glsl(skyVertRaw),
        fragmentShader: glsl(skyFragRaw),
        uniforms: { uBandNormal: { value: BAND_NORMAL }, uCore: { value: GALACTIC_CORE } },
        side: THREE.BackSide,
        transparent: true,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
      }),
    [],
  );

  useEffect(
    () => () => {
      stars.dispose();
      starsMaterial.dispose();
      sky.dispose();
      skyMaterial.dispose();
    },
    [stars, starsMaterial, sky, skyMaterial],
  );

  useFrame(({ clock }, delta) => {
    starsMaterial.uniforms.uPixelRatio.value = dpr;
    if (reducedMotion) return;
    starsMaterial.uniforms.uTime.value = clock.elapsedTime;
    if (groupRef.current) groupRef.current.rotation.y += delta * DRIFT_SPEED;
  });

  return (
    <group ref={groupRef}>
      <mesh geometry={sky} material={skyMaterial} renderOrder={-2} />
      <points geometry={stars} material={starsMaterial} renderOrder={-1} />
    </group>
  );
}

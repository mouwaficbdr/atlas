'use client';

import { useEffect, useMemo, useRef } from 'react';
import { Canvas } from '@react-three/fiber';
import { useInView } from '@/lib/hooks/useInView';

import * as THREE from 'three';

interface PopulationCloudProps {
  population: number;
  worldPopulation?: number;
}

const WORLD_POPULATION = 8_000_000_000;

function generateGlowTexture() {
  const canvas = document.createElement('canvas');
  canvas.width = 64;
  canvas.height = 64;
  const context = canvas.getContext('2d');
  if (context) {
    const gradient = context.createRadialGradient(32, 32, 0, 32, 32, 32);
    gradient.addColorStop(0, 'rgba(255, 255, 255, 1)');
    gradient.addColorStop(0.2, 'rgba(255, 255, 255, 0.8)');
    gradient.addColorStop(0.5, 'rgba(255, 255, 255, 0.2)');
    gradient.addColorStop(1, 'rgba(0, 0, 0, 0)');
    context.fillStyle = gradient;
    context.fillRect(0, 0, 64, 64);
  }
  const texture = new THREE.Texture(canvas);
  texture.needsUpdate = true;
  return texture;
}

function Particles({ count }: { count: number }) {
  const pointsRef = useRef<THREE.Points>(null);

  const geometry = useMemo(() => {
    const arr = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      // Sphere distribution
      const r = 2 * Math.cbrt(Math.random());
      const theta = Math.random() * 2 * Math.PI;
      const phi = Math.acos(2 * Math.random() - 1);
      
      arr[i * 3] = r * Math.sin(phi) * Math.cos(theta);
      arr[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
      arr[i * 3 + 2] = r * Math.cos(phi);
    }

    const geom = new THREE.BufferGeometry();
    geom.setAttribute('position', new THREE.BufferAttribute(arr, 3));
    return geom;
  }, [count]);

  const glowTexture = useMemo(() => generateGlowTexture(), []);

  const material = useMemo(
    () =>
      new THREE.PointsMaterial({
        size: 0.25,
        color: '#ffffff',
        map: glowTexture,
        transparent: true,
        opacity: 0.9,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
      }),
    [glowTexture]
  );

  // Géométrie, matériau et texture sont créés à la main : les libérer au
  // démontage du panneau (finding E1).
  useEffect(
    () => () => {
      geometry.dispose();
      material.dispose();
      glowTexture.dispose();
    },
    [geometry, material, glowTexture]
  );

  return <points ref={pointsRef} geometry={geometry} material={material} />;
}

export default function PopulationCloud({ population, worldPopulation = WORLD_POPULATION }: PopulationCloudProps) {
  const count = useMemo(() => {
    const raw = Math.round((population / worldPopulation) * 100000);
    return Math.min(Math.max(1000, raw), 100000);
  }, [population, worldPopulation]);

  // Ne monter le contexte WebGL qu'à l'approche du viewport, et le rendre une
  // seule fois (frameloop "demand") : le nuage est un décor statique, il n'a
  // pas besoin d'une boucle de rendu continue.
  const { ref, inView } = useInView<HTMLDivElement>();

  return (
    <div ref={ref} style={{ position: 'relative', width: '100%', height: '100%' }}>
      {inView && (
        <Canvas
          frameloop="demand"
          camera={{ position: [0, 0, 5] }}
          style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%' }}
        >
          <ambientLight intensity={0.5} />
          <Particles count={count} />
        </Canvas>
      )}
    </div>
  );
}

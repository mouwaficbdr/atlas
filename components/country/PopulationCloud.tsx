'use client';

import { useMemo, useRef } from 'react';
import { View } from '@react-three/drei';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

interface PopulationCloudProps {
  population: number;
  worldPopulation?: number;
}

const WORLD_POPULATION = 8_000_000_000;

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

  const material = useMemo(
    () =>
      new THREE.PointsMaterial({
        size: 0.05,
        color: 'var(--country-accent, #4A90D9)', // Uses CSS variable context but in WebGL we need to pass hex. Let's use white for now and tint it via CSS or pass it.
        // Actually, CSS variables aren't directly supported in WebGL color.
        // We'll use a hardcoded color or retrieve it if passed.
        // But let's just use white with AdditiveBlending for a wow effect!
        transparent: true,
        opacity: 0.8,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
      }),
    []
  );

  useFrame(({ clock }) => {
    if (pointsRef.current) {
      pointsRef.current.rotation.y = clock.getElapsedTime() * 0.1;
      pointsRef.current.rotation.x = clock.getElapsedTime() * 0.05;
    }
  });

  return <points ref={pointsRef} geometry={geometry} material={material} />;
}

export default function PopulationCloud({ population, worldPopulation = WORLD_POPULATION }: PopulationCloudProps) {
  const count = useMemo(() => {
    // 1000 to 100,000 particles based on population relative to world
    const raw = Math.round((population / worldPopulation) * 100000);
    return Math.min(Math.max(1000, raw), 100000);
  }, [population, worldPopulation]);

  return (
    <div style={{ position: 'relative', width: '100%', height: '200px' }}>
      <View style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%' }}>
        <ambientLight intensity={0.5} />
        <Particles count={count} />
        <perspectiveCamera position={[0, 0, 5]} />
      </View>
      <div
        style={{
          position: 'absolute',
          bottom: 0,
          width: '100%',
          textAlign: 'center',
          color: 'var(--text-primary)',
          fontSize: '1.4rem',
          fontFamily: 'Bebas Neue, Impact, sans-serif',
          letterSpacing: '0.05em',
          pointerEvents: 'none',
          textShadow: '0 2px 4px rgba(0,0,0,0.5)',
        }}
      >
        {population.toLocaleString()} habitants
      </div>
    </div>
  );
}

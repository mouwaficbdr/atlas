'use client';

import { useMemo, useRef, useEffect } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';
import type { GeoJSONFeature } from '@/lib/types';
import { useReducedMotion } from '@/lib/hooks/useReducedMotion';

interface BordersMeshProps {
  features: GeoJSONFeature[];
}

export default function BordersMesh({ features }: BordersMeshProps) {
  const materialRef = useRef<THREE.LineBasicMaterial>(null);
  const reducedMotion = useReducedMotion();

  const geometry = useMemo(() => {
    const vertices: number[] = [];
    const R = 1.0025; // Slightly above country mesh to avoid Z-fighting

    const projectPoint = (lon: number, lat: number): [number, number, number] => {
      const phi = (90 - lat) * (Math.PI / 180);
      const theta = (lon + 180) * (Math.PI / 180);
      return [
        R * Math.sin(phi) * Math.cos(theta),
        R * Math.cos(phi),
        -R * Math.sin(phi) * Math.sin(theta),
      ];
    };

    const addLineSegment = (p1: number[], p2: number[]) => {
      const v1 = projectPoint(p1[0], p1[1]);
      const v2 = projectPoint(p2[0], p2[1]);
      vertices.push(...v1, ...v2);
    };

    const processPolygon = (polygon: number[][][]) => {
      for (const ring of polygon) {
        for (let i = 0; i < ring.length - 1; i++) {
          addLineSegment(ring[i], ring[i + 1]);
        }
      }
    };

    for (const feature of features) {
      const coords = feature.geometry.coordinates;
      if (feature.geometry.type === 'MultiPolygon') {
        for (const polygon of coords as number[][][][]) {
          processPolygon(polygon);
        }
      } else {
        processPolygon(coords as number[][][]);
      }
    }

    const geom = new THREE.BufferGeometry();
    geom.setAttribute('position', new THREE.BufferAttribute(new Float32Array(vertices), 3));
    return geom;
  }, [features]);

  // Géométrie construite hors JSX : r3f ne la dispose pas, on s'en charge au
  // démontage et à chaque recalcul (finding E1).
  useEffect(() => () => geometry.dispose(), [geometry]);

  // Animation de pulsation légère
  useFrame(({ clock }) => {
    if (!materialRef.current) return;
    if (reducedMotion) {
      materialRef.current.opacity = 0.8;
      return;
    }
    // Oscille entre 0.5 et 1.0
    materialRef.current.opacity = 0.75 + Math.sin(clock.elapsedTime * 2) * 0.25;
  });

  return (
    <lineSegments geometry={geometry}>
      <lineBasicMaterial
        ref={materialRef}
        color="#D4AF37" // Doré chirurgical
        transparent={true}
        opacity={0.8}
        blending={THREE.AdditiveBlending}
        depthWrite={false}
      />
    </lineSegments>
  );
}

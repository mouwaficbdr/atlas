'use client';

import { useMemo, useEffect } from 'react';
import * as THREE from 'three';
import type { GeoJSONFeature } from '@/lib/types';

interface BordersMeshProps {
  features: GeoJSONFeature[];
  color?: string;
  opacity?: number;
  /** Rayon du tracé (Terre = 1). */
  radius?: number;
}

export default function BordersMesh({ features, color = '#D4AF37', opacity = 0.55, radius = 1.006 }: BordersMeshProps) {
  const geometry = useMemo(() => {
    const vertices: number[] = [];
    // Au-dessus de la sphère Terre (r=1) et sans maillage pays entre les
    // deux : le depth test cache les frontières de la face arrière sans
    // z-fighting. (L'ancien bug venait d'un R=1.0025 placé SOUS les pays.)
    const R = radius;

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
  }, [features, radius]);

  // Géométrie construite hors JSX : r3f ne la dispose pas, on s'en charge au
  // démontage et à chaque recalcul (finding E1).
  useEffect(() => () => geometry.dispose(), [geometry]);

  return (
    <lineSegments geometry={geometry} renderOrder={10}>
      <lineBasicMaterial
        color={color} // Doré chirurgical par défaut
        transparent={true}
        opacity={opacity}
        blending={THREE.AdditiveBlending}
        depthWrite={false}
      />
    </lineSegments>
  );
}

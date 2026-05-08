import { useRef, useMemo } from 'react';
import * as THREE from 'three';
import { gsap } from 'gsap';
import type { GeoJSONFeature } from '@/lib/types';

interface CountryMeshProps {
  feature: GeoJSONFeature;
  color: string;
  onSelect: (cca3: string) => void;
  onHover: (cca3: string | null) => void;
}

export default function CountryMesh({ feature, color, onSelect, onHover }: CountryMeshProps) {
  const meshRef = useRef<THREE.Group>(null);

  const geometry = useMemo(() => {
    const geom = new THREE.BufferGeometry();
    const vertices: number[] = [];
    const indices: number[] = [];

    const coords = feature.geometry.coordinates;
    const rings = Array.isArray(coords[0]?.[0]?.[0]) ? coords : [coords];

    let vertexIndex = 0;

    for (const ring of rings as number[][][]) {
      const ringVertices: number[] = [];

      for (const [lon, lat] of ring) {
        const phi = (90 - lat) * (Math.PI / 180);
        const theta = (lon + 180) * (Math.PI / 180);

        const x = Math.cos(phi) * Math.cos(theta);
        const y = Math.sin(phi);
        const z = -Math.cos(phi) * Math.sin(theta);

        ringVertices.push(x, y, z);
      }

      vertices.push(...ringVertices);

      // Triangulation simple (fan)
      for (let i = 1; i < ringVertices.length / 3 - 1; i++) {
        indices.push(vertexIndex, vertexIndex + i, vertexIndex + i + 1);
      }

      vertexIndex += ringVertices.length / 3;
    }

    geom.setAttribute('position', new THREE.BufferAttribute(new Float32Array(vertices), 3));
    geom.setIndex(new THREE.BufferAttribute(new Uint32Array(indices), 1));
    geom.computeVertexNormals();

    return geom;
  }, [feature]);

  const material = useMemo(
    () =>
      new THREE.MeshPhongMaterial({
        color,
        emissive: 0x000000,
        shininess: 30,
      }),
    [color]
  );

  const handlePointerEnter = () => {
    onHover(feature.properties.ISO_A3);
    if (meshRef.current) {
      gsap.to(meshRef.current.scale, {
        x: 1.03,
        y: 1.03,
        z: 1.03,
        duration: 0.15,
        ease: 'power2.out',
      });
    }
  };

  const handlePointerLeave = () => {
    onHover(null);
    if (meshRef.current) {
      gsap.to(meshRef.current.scale, {
        x: 1,
        y: 1,
        z: 1,
        duration: 0.15,
        ease: 'power2.in',
      });
    }
  };

  const handleClick = () => {
    onSelect(feature.properties.ISO_A3);
  };

  return (
    <group
      ref={meshRef}
      onPointerEnter={handlePointerEnter}
      onPointerLeave={handlePointerLeave}
      onClick={handleClick}
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore — ARIA attributes on r3f group for accessibility (req 12.6)
      role="button"
      aria-label={feature.properties.NAME}
    >
      <mesh geometry={geometry} material={material} />
    </group>
  );
}

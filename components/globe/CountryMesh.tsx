import { useRef, useMemo } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';
import { gsap } from 'gsap';
import earcut from 'earcut';
import type { GeoJSONFeature } from '@/lib/types';

// Webpack 5 raw-loader often returns an ES module with a .default string
import vertexShaderRaw from '../../shaders/country.vert.glsl';
import fragmentShaderRaw from '../../shaders/country.frag.glsl';

const vertexShader = typeof vertexShaderRaw === 'string' ? vertexShaderRaw : (vertexShaderRaw as any).default;
const fragmentShader = typeof fragmentShaderRaw === 'string' ? fragmentShaderRaw : (fragmentShaderRaw as any).default;


interface CountryMeshProps {
  feature: GeoJSONFeature;
  color: string;
  onSelect: (cca3: string) => void;
  onHover: (cca3: string | null) => void;
}

export default function CountryMesh({ feature, color, onSelect, onHover }: CountryMeshProps) {
  const meshRef = useRef<THREE.Mesh>(null);

  const geometry = useMemo(() => {
    if (!feature || !feature.geometry || !feature.geometry.coordinates) {
      console.warn('Invalid geometry for feature:', feature);
      return new THREE.BufferGeometry();
    }

    const geom = new THREE.BufferGeometry();
    const vertices: number[] = [];
    const indices: number[] = [];

    const projectPoint = (lon: number, lat: number): [number, number, number] => {
      const phi = (90 - lat) * (Math.PI / 180);
      const theta = (lon + 180) * (Math.PI / 180);
      const r = 1.005; // Augmenté de 1.002 à 1.005 pour éviter z-fighting
      return [
        r * Math.sin(phi) * Math.cos(theta),
        r * Math.cos(phi),
        -r * Math.sin(phi) * Math.sin(theta),
      ];
    };

    const coords = feature.geometry.coordinates;
    let vertexIndex = 0;

    const processPolygon = (polygon: number[][][]) => {
      if (!polygon || polygon.length === 0) return;
      const exterior = polygon[0];
      const holes = polygon.slice(1);

      const flat2D: number[] = [];
      const holeIndices: number[] = [];

      for (const [lon, lat] of exterior) {
        flat2D.push(lon, lat);
      }

      for (const hole of holes) {
        holeIndices.push(flat2D.length / 2);
        for (const [lon, lat] of hole) {
          flat2D.push(lon, lat);
        }
      }

      const triangles = earcut(flat2D, holeIndices.length > 0 ? holeIndices : undefined, 2);

      const exteriorStart = vertexIndex;
      for (let i = 0; i < flat2D.length; i += 2) {
        const [x, y, z] = projectPoint(flat2D[i], flat2D[i + 1]);
        vertices.push(x, y, z);
        vertexIndex++;
      }

      for (let i = 0; i < triangles.length; i += 3) {
        indices.push(
          exteriorStart + triangles[i],
          exteriorStart + triangles[i + 1],
          exteriorStart + triangles[i + 2]
        );
      }
    };

    if (feature.geometry.type === 'MultiPolygon') {
      for (const polygon of coords as number[][][][]) {
        processPolygon(polygon);
      }
    } else {
      processPolygon(coords as number[][][]);
    }

    geom.setAttribute('position', new THREE.BufferAttribute(new Float32Array(vertices), 3));
    if (indices.length > 0) {
      geom.setIndex(new THREE.BufferAttribute(new Uint32Array(indices), 1));
    }
    geom.computeVertexNormals();
    geom.computeBoundingSphere();

    return geom;
  }, [feature]);

  const materialRef = useRef<THREE.ShaderMaterial>(null);

  const uniforms = useMemo(() => ({
    uColor: { value: new THREE.Color(color) },
    uHover: { value: 0.0 },
    uTime: { value: 0.0 },
    uExtrude: { value: 0.0 }
  }), [color]);

  useFrame(({ clock }) => {
    if (materialRef.current) {
      materialRef.current.uniforms.uTime.value = clock.elapsedTime;
    }
  });

  const handlePointerEnter = (e: any) => {
    e.stopPropagation();
    onHover(feature.properties.cca3);
    if (materialRef.current) {
      gsap.to(materialRef.current.uniforms.uHover, {
        value: 1.0,
        duration: 0.4,
        ease: 'power2.out',
      });
      gsap.to(materialRef.current.uniforms.uExtrude, {
        value: 1.0,
        duration: 0.4,
        ease: 'back.out(1.7)',
      });
    }
    if (meshRef.current) {
      gsap.to(meshRef.current.scale, {
        x: 1.02,
        y: 1.02,
        z: 1.02,
        duration: 0.3,
        ease: 'power2.out',
      });
    }
  };

  const handlePointerLeave = () => {
    onHover(null);
    if (materialRef.current) {
      gsap.to(materialRef.current.uniforms.uHover, {
        value: 0.0,
        duration: 0.4,
        ease: 'power2.inOut',
      });
      gsap.to(materialRef.current.uniforms.uExtrude, {
        value: 0.0,
        duration: 0.4,
        ease: 'power2.inOut',
      });
    }
    if (meshRef.current) {
      gsap.to(meshRef.current.scale, {
        x: 1,
        y: 1,
        z: 1,
        duration: 0.3,
        ease: 'power2.inOut',
      });
    }
  };

  const handleClick = (e: any) => {
    e.stopPropagation();
    onSelect(feature.properties.cca3);
  };

  return (
    <mesh
      ref={meshRef}
      geometry={geometry}
      onPointerEnter={handlePointerEnter}
      onPointerLeave={handlePointerLeave}
      onClick={handleClick}
    >
      <shaderMaterial
        ref={materialRef}
        vertexShader={vertexShader}
        fragmentShader={fragmentShader}
        uniforms={uniforms}
        transparent={false}
        depthWrite={true}
        depthTest={true}
        side={THREE.FrontSide}
        polygonOffset={true}
        polygonOffsetFactor={-1}
        polygonOffsetUnits={-1}
      />
    </mesh>
  );
}

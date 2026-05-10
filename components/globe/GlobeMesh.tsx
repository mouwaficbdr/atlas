'use client';

import { useEffect, useState, useMemo, useRef } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';
import { loadGeoJSON } from '@/lib/geojson-loader';
import type { GeoJSONFeature, CountryData } from '@/lib/types';
import { useAppStore } from '@/lib/store';
import { prefetchWikiSummary, getPreferredWikiTitle } from '@/lib/wiki-summary';
import CountryMesh from './CountryMesh';
import BordersMesh from './BordersMesh';
import HolographicText from './HolographicText';

import oceanVert from '../../shaders/ocean.vert.glsl';
import oceanFrag from '../../shaders/ocean.frag.glsl';

interface GlobeMeshProps {
  countries: CountryData[];
  onSelect: (cca3: string) => void;
  onLoad?: () => void;
}

export default function GlobeMesh({
  countries,
  onSelect,
  onLoad,
}: GlobeMeshProps) {
  const [features, setFeatures] = useState<GeoJSONFeature[]>([]);
  const [hoveredCca3, setHoveredCca3] = useState<string | null>(null);
  const setHoveredCountry = useAppStore((state) => state.setHoveredCountry);
  const cameraMode = useAppStore((state) => state.cameraMode);

  useEffect(() => {
    loadGeoJSON()
      .then((data) => {
        setFeatures(data.features);
        onLoad?.();
      })
      .catch(console.error);
  }, [onLoad]);

  const hoveredFeature = hoveredCca3
    ? features.find((f) => f.properties.cca3 === hoveredCca3)
    : null;

  const hoveredCountry = hoveredCca3
    ? countries.find((c) => c.cca3 === hoveredCca3)
    : null;

  useEffect(() => {
    setHoveredCountry(hoveredCca3);
  }, [hoveredCca3, setHoveredCountry]);

  useEffect(() => {
    if (cameraMode !== 'country') return;
    setHoveredCca3(null);
    setHoveredCountry(null);
  }, [cameraMode, setHoveredCountry]);

  useEffect(() => {
    if (!hoveredCountry) return;

    const title = getPreferredWikiTitle(hoveredCountry);
    if (!title) return;

    const t = setTimeout(() => {
      prefetchWikiSummary(title);
    }, 150);

    return () => clearTimeout(t);
  }, [hoveredCountry]);

  const oceanMaterial = useMemo(() => {
    return new THREE.ShaderMaterial({
      vertexShader:
        typeof oceanVert === 'string' ? oceanVert : (oceanVert as any).default,
      fragmentShader:
        typeof oceanFrag === 'string' ? oceanFrag : (oceanFrag as any).default,
      uniforms: {
        uTime: { value: 0 },
      },
    });
  }, []);

  const groupRef = useRef<THREE.Group>(null);

  useFrame(({ clock, mouse }) => {
    if (oceanMaterial) {
      oceanMaterial.uniforms.uTime.value = clock.elapsedTime;
    }

    // Tilt effect on hover
    if (groupRef.current) {
      const tiltFactor = hoveredCca3 ? 0.15 : 0.05;
      const targetRotationX = mouse.y * tiltFactor;
      const targetRotationY = mouse.x * tiltFactor;

      groupRef.current.rotation.x = THREE.MathUtils.lerp(
        groupRef.current.rotation.x,
        targetRotationX,
        0.05,
      );
      groupRef.current.rotation.z = THREE.MathUtils.lerp(
        groupRef.current.rotation.z,
        -targetRotationY,
        0.05,
      );
    }
  });

  return (
    <group ref={groupRef}>
      {/* Océan — techy grid shader */}
      <mesh material={oceanMaterial}>
        <sphereGeometry args={[1, 64, 64]} />
      </mesh>

      {/* Pays */}
      {features.map((feature) => (
        <CountryMesh
          key={feature.properties.cca3}
          feature={feature}
          color={feature.properties.colors?.primary ?? '#4A5568'}
          onSelect={onSelect}
          onHover={setHoveredCca3}
        />
      ))}

      <BordersMesh features={features} />

      {/* Holographic Text au survol */}
      {cameraMode === 'globe' &&
        hoveredFeature &&
        hoveredCountry &&
        hoveredCountry.latlng && (
          <HolographicText
            text={hoveredCountry.name.official}
            latlng={hoveredCountry.latlng}
            color={hoveredFeature.properties.colors?.primary ?? '#ffffff'}
          />
        )}
    </group>
  );
}

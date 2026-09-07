'use client';

import { useEffect, useRef, useState } from 'react';
import { Canvas } from '@react-three/fiber';
import type { CountryData } from '@/lib/types';
import GlobeMesh from './GlobeMesh';
import AtmosphereMesh from './AtmosphereMesh';
import StarField from './StarField';
import GlobeControls from './GlobeControls';
import CameraTransition from './CameraTransition';
import SROnlyList from '@/components/ui/SROnlyList';

interface GlobeSceneProps {
  countries: CountryData[];
  onCountrySelect: (cca3: string) => void;
  onProgress?: (progress: number) => void;
  onLoad?: () => void;
  cameraMode: 'globe' | 'country';
  selectedCountryCca3: string | null;
}

export default function GlobeScene({ countries, onCountrySelect, onProgress, onLoad, cameraMode, selectedCountryCca3 }: GlobeSceneProps) {
  const [webGLSupported, setWebGLSupported] = useState(true);
  const [isDragging, setIsDragging] = useState(false);
  const onLoadCalledRef = useRef(false);

  useEffect(() => {
    const canvas = document.createElement('canvas');
    const gl = canvas.getContext('webgl2');
    if (!gl) setWebGLSupported(false);
  }, []);

  // Fallback: if onLoad hasn't fired after 3s, call it anyway
  useEffect(() => {
    const timer = setTimeout(() => {
      if (!onLoadCalledRef.current) {
        onLoadCalledRef.current = true;
        onProgress?.(100);
        onLoad?.();
      }
    }, 3000);
    return () => clearTimeout(timer);
  }, [onLoad, onProgress]);

  if (!webGLSupported) {
    return <SROnlyList countries={countries} visible={true} />;
  }

  const dpr = typeof window !== 'undefined'
    ? Math.min(window.devicePixelRatio, navigator.maxTouchPoints > 0 ? 1.5 : 2.0)
    : 1;

  const handleCreated = () => {
    // Canvas is ready — signal loading complete
    if (!onLoadCalledRef.current) {
      onLoadCalledRef.current = true;
      onProgress?.(100);
      onLoad?.();
    }
  };

  const handlePointerDown = () => {
    setIsDragging(true);
  };

  const handlePointerUp = () => {
    setIsDragging(false);
  };

  return (
    <>
      <Canvas
        dpr={dpr}
        camera={{ position: [0, 0, 3], fov: 45 }}
        role="application"
        tabIndex={0}
        aria-label="Globe interactif, explorateur de pays. Flèches pour pivoter."
        aria-keyshortcuts="ArrowUp ArrowDown ArrowLeft ArrowRight"
        style={{
          width: '100%',
          height: '100%',
          cursor: isDragging ? 'grabbing' : 'grab'
        }}
        onCreated={handleCreated}
        onPointerDown={handlePointerDown}
        onPointerUp={handlePointerUp}
        onPointerLeave={handlePointerUp}
      >
        <ambientLight intensity={1.2} />
        <directionalLight position={[0, 0, 5]} intensity={1.5} />
        <directionalLight position={[5, 3, 2]} intensity={0.8} />

        <StarField />
        <GlobeMesh
          countries={countries}
          onSelect={onCountrySelect}
          onLoad={handleCreated}
          cameraMode={cameraMode}
        />
        <AtmosphereMesh />
        <GlobeControls enabled={true} />
        <CameraTransition
          countries={countries}
          cameraMode={cameraMode}
          selectedCountryCca3={selectedCountryCca3}
        />
      </Canvas>

      <SROnlyList countries={countries} visible={false} />
    </>
  );
}

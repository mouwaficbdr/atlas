'use client';

import { useEffect, useRef, useState } from 'react';
import { Canvas } from '@react-three/fiber';
import type { CountryData } from '@/lib/types';
import GlobeMesh from './GlobeMesh';
import AtmosphereMesh from './AtmosphereMesh';
import StarField from './StarField';
import GlobeControls from './GlobeControls';
import SROnlyList from '@/components/ui/SROnlyList';

interface GlobeSceneProps {
  countries: CountryData[];
  onCountrySelect: (cca3: string) => void;
  onProgress?: (progress: number) => void;
  onLoad?: () => void;
}

export default function GlobeScene({ countries, onCountrySelect, onProgress, onLoad }: GlobeSceneProps) {
  const [webGLSupported, setWebGLSupported] = useState(true);
  const [controlsEnabled, setControlsEnabled] = useState(true);

  useEffect(() => {
    const canvas = document.createElement('canvas');
    const gl = canvas.getContext('webgl2');
    if (!gl) setWebGLSupported(false);
  }, []);

  if (!webGLSupported) {
    return <SROnlyList countries={countries} visible={true} />;
  }

  const dpr = typeof window !== 'undefined'
    ? Math.min(window.devicePixelRatio, navigator.maxTouchPoints > 0 ? 1.5 : 2.0)
    : 1;

  return (
    <>
      <Canvas
        dpr={dpr}
        camera={{ position: [0, 0, 3], fov: 45 }}
        role="application"
        aria-label="Globe interactif — Explorateur de pays"
        style={{ width: '100%', height: '100%' }}
      >
        <ambientLight intensity={0.4} />
        <directionalLight position={[5, 3, 5]} intensity={1} />

        <StarField />
        <GlobeMesh countries={countries} onSelect={onCountrySelect} />
        <AtmosphereMesh />
        <GlobeControls enabled={controlsEnabled} />
      </Canvas>

      <SROnlyList countries={countries} visible={false} />
    </>
  );
}

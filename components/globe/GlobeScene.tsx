'use client';

import { useEffect, useRef, useState } from 'react';
import { Canvas } from '@react-three/fiber';
import type { CountryData } from '@/lib/types';
import { SUN_POSITION } from '@/lib/globe/sun';
import { GLOBE_DISTANCE, INTRO_DISTANCE, prefersReducedMotion } from '@/lib/globe/intro';
import { useAppStore } from '@/lib/store';
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
  const introPhase = useAppStore((state) => state.introPhase);
  // La caméra démarre loin (la Terre n'est qu'un point sous le loader), sauf
  // si l'intro a déjà eu lieu ou si l'utilisateur refuse les animations.
  const [initialCameraZ] = useState(() =>
    useAppStore.getState().introPhase === 'done' || prefersReducedMotion() ? GLOBE_DISTANCE : INTRO_DISTANCE,
  );

  useEffect(() => {
    const canvas = document.createElement('canvas');
    const gl = canvas.getContext('webgl2');
    if (!gl) setWebGLSupported(false);
  }, []);

  // Filet de sécurité : si la Terre ne signale jamais qu'elle est prête
  // (texture introuvable, réseau coupé), on révèle quand même la scène
  // plutôt que de laisser l'utilisateur bloqué derrière le loader.
  useEffect(() => {
    const timer = setTimeout(() => {
      if (!onLoadCalledRef.current) {
        onLoadCalledRef.current = true;
        onProgress?.(100);
        onLoad?.();
      }
    }, 12000);
    return () => clearTimeout(timer);
  }, [onLoad, onProgress]);

  if (!webGLSupported) {
    return <SROnlyList countries={countries} visible={true} />;
  }

  const dpr = typeof window !== 'undefined'
    ? Math.min(window.devicePixelRatio, navigator.maxTouchPoints > 0 ? 1.5 : 2.0)
    : 1;

  // Canvas prêt ne veut pas dire Terre prête : on n'annonce 100 % que
  // lorsque ses textures (nuages compris) sont chargées, sinon le loader
  // s'efface sur un globe encore vide qui se remplit sous les yeux.
  const handleCreated = () => {
    if (!onLoadCalledRef.current) onProgress?.(70);
  };

  const handleEarthReady = () => {
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
        camera={{ position: [0, 0, initialCameraZ], fov: 45 }}
        // Hors du mode globe (fiche pays), le globe est masque par la
        // CountryCard : on passe la boucle de rendu en "demand" pour rendre la
        // main au GPU. CameraTransition force un rendu via invalidate() pendant
        // ses tweens GSAP pour que le vol de camera reste fluide.
        frameloop={cameraMode === 'globe' ? 'always' : 'demand'}
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
        {/* Un seul soleil, faible ambiance : le terminateur jour/nuit doit
            rester lisible (même direction que les shaders, lib/globe/sun.ts). */}
        {/* Fond opaque (même teinte que la page) : sur un canvas transparent,
            un shader additif qui écrit un alpha rend ses pixels opaques et
            masque le fond de page, d'où un anneau sombre autour du globe. */}
        <color attach="background" args={['#0a0a14']} />
        <ambientLight intensity={0.12} />
        <directionalLight position={SUN_POSITION} intensity={2.6} />

        <StarField />
        <GlobeMesh
          countries={countries}
          onSelect={onCountrySelect}
          onLoad={handleEarthReady}
          cameraMode={cameraMode}
        />
        <AtmosphereMesh />
        {/* Verrouillés pendant l'intro : OrbitControls ramènerait la caméra à
            maxDistance au premier update. */}
        <GlobeControls enabled={introPhase === 'done'} cameraMode={cameraMode} />
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

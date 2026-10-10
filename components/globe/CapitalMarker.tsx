'use client';

import { useEffect, useMemo } from 'react';
import * as THREE from 'three';
import { projectPoint } from './HolographicText';

/**
 * Repère de la capitale pendant le survol rasant de la descente (#21) : un
 * point d'or et son halo, toujours face à la caméra.
 */
export default function CapitalMarker({ lonLat: [lon, lat] }: { lonLat: [number, number] }) {
  const position = useMemo(() => projectPoint(lat, lon, 1.004), [lat, lon]);
  const material = useMemo(() => {
    const canvas = document.createElement('canvas');
    canvas.width = canvas.height = 64;
    const ctx = canvas.getContext('2d')!;
    const halo = ctx.createRadialGradient(32, 32, 0, 32, 32, 32);
    halo.addColorStop(0, 'rgba(255, 236, 170, 1)');
    halo.addColorStop(0.16, 'rgba(255, 184, 28, 1)');
    halo.addColorStop(0.32, 'rgba(255, 184, 28, 0.45)');
    halo.addColorStop(1, 'rgba(255, 184, 28, 0)');
    ctx.fillStyle = halo;
    ctx.fillRect(0, 0, 64, 64);
    return new THREE.SpriteMaterial({ map: new THREE.CanvasTexture(canvas), transparent: true, depthWrite: false });
  }, []);

  useEffect(
    () => () => {
      material.map?.dispose();
      material.dispose();
    },
    [material],
  );

  return <sprite position={position} scale={[0.05, 0.05, 1]} material={material} renderOrder={20} />;
}

'use client';

import { useEffect } from 'react';
import { useThree } from '@react-three/fiber';
import { gsap } from 'gsap';
import type { CountryData } from '@/lib/types';
import * as THREE from 'three';

interface CameraTransitionProps {
  countries: CountryData[];
  cameraMode: 'globe' | 'country';
  selectedCountryCca3: string | null;
}

export default function CameraTransition({ countries, cameraMode, selectedCountryCca3 }: CameraTransitionProps) {
  const { camera, controls } = useThree();

  useEffect(() => {
    // NOTE: controls n'est disponible qu'après le premier rendu du Canvas
    if (!controls) return;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const orbitControls = controls as any;

    if (cameraMode === 'globe' || !selectedCountryCca3) {
      // Return to globe view
      gsap.to(camera.position, {
        x: 0,
        y: 0,
        z: 3,
        duration: 1.5,
        ease: 'power3.inOut',
      });
      gsap.to(orbitControls.target, {
        x: 0,
        y: 0,
        z: 0,
        duration: 1.5,
        ease: 'power3.inOut',
      });
      orbitControls.enabled = true;
      return;
    }

    if (cameraMode === 'country' && selectedCountryCca3) {
      const country = countries.find(c => c.cca3 === selectedCountryCca3);
      if (!country) return;

      const [lon, lat] = country.centroid;

      // Conversion lon/lat → coordonnées sphériques Three.js
      const phi = (90 - lat) * (Math.PI / 180);
      const theta = (lon + 180) * (Math.PI / 180);

      const surfaceX = Math.sin(phi) * Math.cos(theta);
      const surfaceY = Math.cos(phi);
      const surfaceZ = -Math.sin(phi) * Math.sin(theta);

      const targetPos = new THREE.Vector3(surfaceX, surfaceY, surfaceZ);

      // Facteur de zoom : 1.3 = 0.3 unités au-dessus de la surface du globe (rayon=1)
      const camDist = 1.3;
      const camPos = targetPos.clone().multiplyScalar(camDist);

      // Les OrbitControls sont désactivés en mode pays pour figer la vue
      orbitControls.enabled = false;

      gsap.to(camera.position, {
        x: camPos.x,
        y: camPos.y,
        z: camPos.z,
        duration: 1.5,
        ease: 'power3.inOut',
      });

      // Point controls target exactly at the country centroid
      gsap.to(orbitControls.target, {
        x: targetPos.x,
        y: targetPos.y,
        z: targetPos.z,
        duration: 1.5,
        ease: 'power3.inOut',
      });
    }
  }, [selectedCountryCca3, cameraMode, camera, controls, countries]);

  return null;
}

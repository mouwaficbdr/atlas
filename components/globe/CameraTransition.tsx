'use client';

import { useEffect } from 'react';
import { useThree } from '@react-three/fiber';
import { gsap } from 'gsap';
import { useAppStore } from '@/lib/store';
import type { CountryData } from '@/lib/types';
import * as THREE from 'three';

interface CameraTransitionProps {
  countries: CountryData[];
}

export default function CameraTransition({ countries }: CameraTransitionProps) {
  const { camera, controls } = useThree();
  const selectedCountryCca3 = useAppStore(state => state.selectedCountryCca3);
  const cameraMode = useAppStore(state => state.cameraMode);

  useEffect(() => {
    // If no controls yet, skip
    if (!controls) return;
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

      // Extract centroid [lon, lat] from JSON
      const [lon, lat] = country.centroid; 
      
      // Convert to spherical coordinates
      const phi = (90 - lat) * (Math.PI / 180);
      const theta = (lon + 180) * (Math.PI / 180);
      
      // Calculate position on sphere surface
      const surfaceX = Math.sin(phi) * Math.cos(theta);
      const surfaceY = Math.cos(phi);
      const surfaceZ = -Math.sin(phi) * Math.sin(theta);
      
      // Target is slightly offset so country isn't in center, to leave room for UI
      // But let's start with centering it
      const targetPos = new THREE.Vector3(surfaceX, surfaceY, surfaceZ);
      
      // Camera position zooms in (distance 1.5 from center = 0.5 from surface)
      const camDist = 1.3;
      const camPos = targetPos.clone().multiplyScalar(camDist);

      // Disable orbit controls while animating, and keep disabled if we don't want user spinning the globe in country mode
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

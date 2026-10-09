'use client';

import { useEffect } from 'react';
import { useThree } from '@react-three/fiber';
import { gsap } from 'gsap';
import type { CountryData } from '@/lib/types';
import * as THREE from 'three';
import { useAppStore } from '@/lib/store';
import { GLOBE_DISTANCE, introDistanceAt } from '@/lib/globe/intro';
import { homeViewDirection } from '@/lib/globe/sun';
import { lonLatToCartesian } from '@/lib/globe/pick-country';

interface CameraTransitionProps {
  countries: CountryData[];
  cameraMode: 'globe' | 'country';
  selectedCountryCca3: string | null;
}

export default function CameraTransition({ countries, cameraMode, selectedCountryCca3 }: CameraTransitionProps) {
  const { camera, controls, invalidate } = useThree();
  const introPhase = useAppStore((state) => state.introPhase);
  const setIntroPhase = useAppStore((state) => state.setIntroPhase);

  useEffect(() => {
    // NOTE: controls n'est disponible qu'après le premier rendu du Canvas
    if (!controls) return;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const orbitControls = controls as any;

    // En mode pays, le Canvas tourne en frameloop "demand" : sans invalidate()
    // à chaque frame du tween, le vol de caméra GSAP muterait la position sans
    // être rendu à l'écran (navigation voisin -> voisin notamment).
    const render = () => invalidate();

    if (cameraMode === 'globe' || !selectedCountryCca3) {
      // Sous le loader, la caméra reste au loin : la Terre n'est qu'un point.
      if (introPhase === 'waiting') return;

      if (introPhase === 'flying') {
        // Approche depuis le point bleu pâle jusqu'à la vue globe.
        orbitControls.enabled = false;
        const home = homeViewDirection();
        const flight = { t: 0 };
        const tween = gsap.to(flight, {
          t: 1,
          duration: 2.8,
          ease: 'power2.inOut',
          onUpdate: () => {
            camera.position.copy(home).multiplyScalar(introDistanceAt(flight.t));
            render();
          },
          onComplete: () => setIntroPhase('done'),
        });
        return () => {
          tween.kill();
        };
      }

      // Retour à la vue globe : on recule dans l'axe actuel, le pays quitté
      // reste face à l'utilisateur.
      const back = camera.position.clone().normalize().multiplyScalar(GLOBE_DISTANCE);
      gsap.to(camera.position, {
        x: back.x,
        y: back.y,
        z: back.z,
        duration: 1.5,
        ease: 'power3.inOut',
        onUpdate: render,
      });
      gsap.to(orbitControls.target, {
        x: 0,
        y: 0,
        z: 0,
        duration: 1.5,
        ease: 'power3.inOut',
        onUpdate: render,
      });
      orbitControls.enabled = true;
      return;
    }

    if (cameraMode === 'country' && selectedCountryCca3) {
      const country = countries.find(c => c.cca3 === selectedCountryCca3);
      if (!country) return;

      // Attention aux conventions divergentes : centroid est en ordre GeoJSON
      // [lon, lat] (calculé par generate-geo.js), alors que country.latlng est
      // en ordre REST Countries [lat, lon].
      const [lon, lat] = country.centroid;

      const targetPos = new THREE.Vector3(...lonLatToCartesian(lon, lat));

      // Facteur de zoom : 1.3 = 0.3 unités au-dessus de la surface du globe (rayon=1)
      const camDist = 1.3;
      const camPos = targetPos.clone().multiplyScalar(camDist);

      // Les OrbitControls sont désactivés en mode pays pour figer la vue
      orbitControls.enabled = false;

      gsap.to(camera.position, {
        x: camPos.x,
        y: camPos.y,
        z: camPos.z,
        duration: introPhase === 'flying' ? 2.6 : 1.5,
        ease: 'power3.inOut',
        onUpdate: render,
        // Arrivée directe sur une fiche pays : ce vol tient lieu d'intro.
        onComplete: () => {
          if (introPhase === 'flying') setIntroPhase('done');
        },
      });

      // Point controls target exactly at the country centroid
      gsap.to(orbitControls.target, {
        x: targetPos.x,
        y: targetPos.y,
        z: targetPos.z,
        duration: 1.5,
        ease: 'power3.inOut',
        onUpdate: render,
      });
    }
  }, [selectedCountryCca3, cameraMode, camera, controls, countries, invalidate, introPhase, setIntroPhase]);

  return null;
}

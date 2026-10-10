'use client';

import { useEffect, useState, useRef, useMemo } from 'react';
import * as THREE from 'three';
import { useFrame, useThree, type ThreeEvent } from '@react-three/fiber';
import { loadGeoJSON } from '@/lib/geojson-loader';
import type { GeoJSONFeature, CountryData } from '@/lib/types';
import { useAppStore } from '@/lib/store';
import { useReducedMotion } from '@/lib/hooks/useReducedMotion';
import { cartesianToLonLat, findCountryAtLonLat } from '@/lib/globe/pick-country';
import { tilt } from '@/lib/device-tilt';
import BordersMesh from './BordersMesh';
import HolographicText, { projectPoint } from './HolographicText';
import HoverHighlight from './HoverHighlight';
import CapitalMarker from './CapitalMarker';
import EarthMesh from './EarthMesh';
import CloudsMesh from './CloudsMesh';

const CLICK_MAX_MOVE_PX = 4;
const CLICK_MAX_PRESS_MS = 350;

interface GlobeMeshProps {
  countries: CountryData[];
  onSelect: (cca3: string) => void;
  onLoad?: () => void;
  cameraMode: 'globe' | 'country';
  /** Pays de la fiche ouverte, mis en évidence en mode pays. */
  selectedCca3?: string | null;
}

export default function GlobeMesh({
  countries,
  onSelect,
  onLoad,
  cameraMode,
  selectedCca3 = null,
}: GlobeMeshProps) {
  const focusCca3 = useAppStore((state) => state.focusCca3);
  const previewCca3 = useAppStore((state) => state.previewCca3);
  const [features, setFeatures] = useState<GeoJSONFeature[]>([]);
  const [hoveredCca3, setHoveredCca3] = useState<string | null>(null);
  const { camera, gl } = useThree();
  const setTitleOrigin = useAppStore((state) => state.setTitleOrigin);
  // Retour d'une fiche (#22) : l'étiquette du pays quitté réapparaît puis s'efface.
  const returnCca3 = useAppStore((state) => state.returnCca3);
  const setReturnCca3 = useAppStore((state) => state.setReturnCca3);
  useEffect(() => {
    if (!returnCca3) return;
    if (cameraMode !== 'globe') {
      setReturnCca3(null);
      return;
    }
    const id = setTimeout(() => setReturnCca3(null), 2600);
    return () => clearTimeout(id);
  }, [returnCca3, cameraMode, setReturnCca3]);
  const returning = returnCca3 && cameraMode === 'globe' ? countries.find((c) => c.cca3 === returnCca3) : undefined;
  const descentStage = useAppStore((state) => state.descentStage);
  const selectedCapital = countries.find((c) => c.cca3 === selectedCca3)?.capitalLonLat ?? null;
  const setHoveredCountry = useAppStore((state) => state.setHoveredCountry);
  const reducedMotion = useReducedMotion();

  useEffect(() => {
    loadGeoJSON()
      .then((data) => setFeatures(data.features))
      .catch(console.error);
  }, []);

  // Survolé à la souris, ou en aperçu sur l'accueil mobile.
  const highlightedCca3 = hoveredCca3 ?? previewCca3;
  const logbook = useAppStore((state) => state.logbook);
  const isChallenge = useAppStore((state) => state.isChallenge);
  const exploredFeatures = useMemo(() => {
    const explored = new Set(logbook.map((s) => s.cca3));
    return features.filter((f) => explored.has(f.properties.cca3));
  }, [features, logbook]);
  const hoveredFeature = highlightedCca3
    ? features.find((f) => f.properties.cca3 === highlightedCca3)
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

  const groupRef = useRef<THREE.Group>(null);
  const lastHoveredRef = useRef<string | null>(null);

  const handleEarthPointerMove = (e: ThreeEvent<PointerEvent>) => {
    e.stopPropagation();
    // Au doigt, un « survol » n'est qu'un glisser : l'aperçu passe par le toucher.
    if (e.pointerType === 'touch') return;
    // Repère du groupe (celui des frontières), pas celui de la sphère Terre
    // qui est tournée de 180° pour aligner sa texture.
    const local = (groupRef.current ?? e.object).worldToLocal(e.point.clone());
    const { lon, lat } = cartesianToLonLat(local.x, local.y, local.z);
    const cca3 = findCountryAtLonLat(lon, lat, features);
    if (cca3 !== lastHoveredRef.current) {
      lastHoveredRef.current = cca3;
      setHoveredCca3(cca3);
    }
  };

  const handleEarthPointerLeave = () => {
    lastHoveredRef.current = null;
    setHoveredCca3(null);
  };

  // Un clic ne sélectionne que s'il est franc : ni glisser (rotation du
  // globe), ni appui prolongé (saisie). Sinon, tourner le globe ouvrait la
  // fiche du pays sous le curseur au relâchement.
  const pressStartRef = useRef(0);
  const handleEarthPointerDown = () => {
    pressStartRef.current = performance.now();
  };

  const handleEarthClick = (e: ThreeEvent<MouseEvent>) => {
    e.stopPropagation();
    if (e.delta > CLICK_MAX_MOVE_PX) return;
    if (performance.now() - pressStartRef.current > CLICK_MAX_PRESS_MS) return;
    // Repère du groupe (celui des frontières), pas celui de la sphère Terre
    // qui est tournée de 180° pour aligner sa texture.
    const local = (groupRef.current ?? e.object).worldToLocal(e.point.clone());
    const { lon, lat } = cartesianToLonLat(local.x, local.y, local.z);
    const cca3 = findCountryAtLonLat(lon, lat, features);
    if (!cca3) return;
    // Transition vers la fiche (#22) : le titre partira de l'étiquette 3D,
    // à l'endroit exact où elle est affichée.
    const country = countries.find((c) => c.cca3 === cca3);
    if (country?.latlng && groupRef.current) {
      const p = new THREE.Vector3(...projectPoint(country.latlng[0], country.latlng[1], 1.12));
      groupRef.current.localToWorld(p).project(camera);
      const box = gl.domElement.getBoundingClientRect();
      setTitleOrigin({
        cca3,
        x: box.left + ((p.x + 1) / 2) * box.width,
        y: box.top + ((1 - p.y) / 2) * box.height,
        at: performance.now(),
      });
    }
    onSelect(cca3);
  };

  useFrame(({ mouse }) => {
    if (reducedMotion) return;

    // Parallaxe de léger tilt en fonction de la position de la souris, ou de
    // l'inclinaison du téléphone quand elle est activée (#28).
    if (groupRef.current) {
      const tiltFactor = tilt.active ? 0.15 : hoveredCca3 ? 0.15 : 0.05;
      const targetRotationX = (tilt.active ? -tilt.y : mouse.y) * tiltFactor;
      const targetRotationY = (tilt.active ? tilt.x : mouse.x) * tiltFactor;

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
      <EarthMesh
        onReady={onLoad}
        onPointerMove={handleEarthPointerMove}
        onPointerLeave={handleEarthPointerLeave}
        onPointerDown={handleEarthPointerDown}
        onClick={handleEarthClick}
      />
      <CloudsMesh />

      <BordersMesh features={features} />
      {/* Carnet de vol : les pays explorés gardent un liseré d'or plus vif. */}
      {cameraMode === 'globe' && exploredFeatures.length > 0 && (
        <BordersMesh features={exploredFeatures} color="#FFE29A" opacity={1} radius={1.0065} />
      )}

      {cameraMode === 'globe' && hoveredFeature && (
        <HoverHighlight
          key={hoveredFeature.properties.cca3}
          feature={hoveredFeature}
          color={hoveredFeature.properties.colors?.primary ?? '#4fc3f7'}
        />
      )}

      {/* Fiche pays : le pays ouvert, et le voisin survolé dans la liste. */}
      {cameraMode === 'country' &&
        [selectedCca3, focusCca3].map((cca3) => {
          const feature = cca3 ? features.find((f) => f.properties.cca3 === cca3) : null;
          return feature ? (
            <HoverHighlight
              key={`focus-${feature.properties.cca3}`}
              feature={feature}
              color={feature.properties.colors?.primary ?? '#4fc3f7'}
            />
          ) : null;
        })}

      {!hoveredFeature && returning?.latlng && (
        <HolographicText
          key={`return-${returning.cca3}`}
          text={returning.nameFr}
          latlng={returning.latlng}
          color={returning.colors?.primary ?? '#ffffff'}
          fadeOutAfter={1600}
        />
      )}

      {/* Descente (#21) : repère de la capitale pendant son survol rasant. */}
      {cameraMode === 'country' && descentStage === 'capitale' && selectedCapital && (
        <CapitalMarker lonLat={selectedCapital} />
      )}

      {/* Holographic Text : visible uniquement au survol en mode globe */}
      {cameraMode === 'globe' &&
        !isChallenge &&
        hoveredFeature &&
        hoveredCountry &&
        hoveredCountry.latlng && (
          <HolographicText
            text={hoveredCountry.nameFr}
            latlng={hoveredCountry.latlng}
            color={hoveredFeature.properties.colors?.primary ?? '#ffffff'}
          />
        )}
    </group>
  );
}

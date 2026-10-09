/**
 * GlobeControls : contrôleur de rotation/zoom de la caméra Three.js
 * OrbitControls avec amortissement (damping) et support tactile
 * Exigences : 2.1, 2.4a, 2.5a
 */

import { useEffect, useRef } from "react";
import { OrbitControls } from "@react-three/drei";
import { currentGlobeDistance } from "@/lib/globe/intro";
import type { OrbitControls as OrbitControlsImpl } from "three-stdlib";

interface GlobeControlsProps {
  /** Désactive les contrôles pendant les animations caméra (ex: GSAP fly-to) */
  enabled?: boolean;
  /** Hors du mode globe (fiche pays), la rotation clavier est neutralisée. */
  cameraMode?: 'globe' | 'country';
}

const ROTATE_STEP = 0.06; // radians par pression de flèche
const MIN_POLAR = 0.1;
const MAX_POLAR = Math.PI - 0.1;

/**
 * GlobeControls encapsule OrbitControls de @react-three/drei avec :
 * - Amortissement activé (dampingFactor=0.05) pour une décélération progressive
 *   après relâchement du pointeur (Exigence 2.1)
 * - Prop `enabled` pour désactiver pendant les animations caméra GSAP (Exigence 2.4a)
 * - Support tactile natif via enableRotate (Exigence 2.5a)
 * - Rotation au clavier (flèches) pour les utilisateurs qui n'utilisent pas
 *   la souris ou le tactile ; jusque-là, le globe n'avait aucun équivalent clavier.
 *   Neutralisée hors du mode globe (le globe est alors masqué par la fiche pays).
 */
export default function GlobeControls({
  enabled = true,
  cameraMode = 'globe',
}: GlobeControlsProps) {
  const controlsRef = useRef<OrbitControlsImpl>(null);

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      const controls = controlsRef.current;
      if (!controls || !enabled || cameraMode !== 'globe') return;

      // Ne pas intercepter les flèches utilisées pour naviguer dans un champ
      // de saisie (ex: la palette de recherche).
      const activeTag = (e.target as HTMLElement | null)?.tagName;
      if (activeTag === "INPUT" || activeTag === "TEXTAREA") return;

      switch (e.key) {
        case "ArrowLeft":
          controls.setAzimuthalAngle(controls.getAzimuthalAngle() - ROTATE_STEP);
          break;
        case "ArrowRight":
          controls.setAzimuthalAngle(controls.getAzimuthalAngle() + ROTATE_STEP);
          break;
        case "ArrowUp":
          controls.setPolarAngle(
            Math.max(MIN_POLAR, controls.getPolarAngle() - ROTATE_STEP)
          );
          break;
        case "ArrowDown":
          controls.setPolarAngle(
            Math.min(MAX_POLAR, controls.getPolarAngle() + ROTATE_STEP)
          );
          break;
        default:
          return;
      }
      e.preventDefault();
      controls.update();
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [enabled, cameraMode]);

  return (
    <OrbitControls
      ref={controlsRef}
      // Indispensable : CameraTransition lit les contrôles via useThree() ;
      // sans makeDefault ils y valent null et aucun vol de caméra (intro,
      // zoom vers un pays) ne se déclenchait.
      makeDefault
      enableDamping={true}
      dampingFactor={0.05}
      enabled={enabled}
      enableRotate={true}
      rotateSpeed={0.8}
      minDistance={1.5}
      maxDistance={Math.max(5, currentGlobeDistance() * 1.35)}
      minPolarAngle={MIN_POLAR}
      maxPolarAngle={MAX_POLAR}
    />
  );
}

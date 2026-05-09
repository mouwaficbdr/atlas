/**
 * GlobeControls — Contrôleur de rotation/zoom de la caméra Three.js
 * OrbitControls avec amortissement (damping) et support tactile
 * Exigences : 2.1, 2.4a, 2.5a
 */

import { OrbitControls } from "@react-three/drei";

interface GlobeControlsProps {
  /** Désactive les contrôles pendant les animations caméra (ex: GSAP fly-to) */
  enabled?: boolean;
}

/**
 * GlobeControls encapsule OrbitControls de @react-three/drei avec :
 * - Amortissement activé (dampingFactor=0.85) pour une décélération progressive
 *   après relâchement du pointeur (Exigence 2.1)
 * - Prop `enabled` pour désactiver pendant les animations caméra GSAP (Exigence 2.4a)
 * - Support tactile natif via enableRotate (Exigence 2.5a)
 */
export default function GlobeControls({ enabled = true }: GlobeControlsProps) {
  return (
    <OrbitControls
      enableDamping={true}
      dampingFactor={0.05}
      enabled={enabled}
      enableRotate={true}
      rotateSpeed={0.8}
      minDistance={1.5}
      maxDistance={5}
    />
  );
}

/**
 * StarField — Fond spatial composé de 10 000 particules étoiles
 * THREE.Points réparties aléatoirement dans une sphère de rayon 500 unités
 * Exigence : 1.1
 */

import { useRef, useMemo } from "react";
// Import from @react-three/fiber to load the JSX namespace augmentation
// that types Three.js primitives as JSX intrinsic elements (points, bufferGeometry, etc.)
import "@react-three/fiber";
import * as THREE from "three";

const STAR_COUNT = 10_000;
const SPHERE_RADIUS = 500;

export default function StarField() {
  const pointsRef = useRef<THREE.Points>(null);

  /**
   * Génère les positions des étoiles une seule fois via useMemo.
   * Distribution sphérique uniforme via la méthode de rejet :
   * on tire des points dans un cube [-1, 1]³ et on ne conserve
   * que ceux dont la norme est ≤ 1, garantissant une répartition
   * homogène dans la sphère (pas de concentration aux pôles).
   */
  const positions = useMemo(() => {
    const arr = new Float32Array(STAR_COUNT * 3);
    let count = 0;

    while (count < STAR_COUNT) {
      const x = (Math.random() * 2 - 1) * SPHERE_RADIUS;
      const y = (Math.random() * 2 - 1) * SPHERE_RADIUS;
      const z = (Math.random() * 2 - 1) * SPHERE_RADIUS;

      // Rejet des points hors de la sphère
      if (x * x + y * y + z * z <= SPHERE_RADIUS * SPHERE_RADIUS) {
        arr[count * 3] = x;
        arr[count * 3 + 1] = y;
        arr[count * 3 + 2] = z;
        count++;
      }
    }

    return arr;
  }, []);

  return (
    <points ref={pointsRef}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          args={[positions, 3]}
        />
      </bufferGeometry>
      <pointsMaterial
        size={0.5}
        color="#ffffff"
        sizeAttenuation={true}
        transparent={false}
      />
    </points>
  );
}

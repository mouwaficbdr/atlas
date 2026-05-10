
import { useRef, useMemo } from "react";
import * as THREE from "three";

const STAR_COUNT = 10_000;
const SPHERE_RADIUS = 500;

export default function StarField() {
  const pointsRef = useRef<THREE.Points>(null);

  /**
   * Génère la géométrie des étoiles une seule fois via useMemo.
   * Distribution sphérique uniforme via la méthode de rejet :
   * on tire des points dans un cube [-1, 1]³ et on ne conserve
   * que ceux dont la norme est ≤ 1, garantissant une répartition
   * homogène dans la sphère (pas de concentration aux pôles).
   */
  const geometry = useMemo(() => {
    const arr = new Float32Array(STAR_COUNT * 3);
    let count = 0;

    while (count < STAR_COUNT) {
      const x = (Math.random() * 2 - 1) * SPHERE_RADIUS;
      const y = (Math.random() * 2 - 1) * SPHERE_RADIUS;
      const z = (Math.random() * 2 - 1) * SPHERE_RADIUS;

      if (x * x + y * y + z * z <= SPHERE_RADIUS * SPHERE_RADIUS) {
        arr[count * 3] = x;
        arr[count * 3 + 1] = y;
        arr[count * 3 + 2] = z;
        count++;
      }
    }

    const geom = new THREE.BufferGeometry();
    geom.setAttribute('position', new THREE.BufferAttribute(arr, 3));
    return geom;
  }, []);

  const material = useMemo(
    () =>
      new THREE.PointsMaterial({
        size: 0.5,
        color: '#ffffff',
        sizeAttenuation: true,
      }),
    []
  );

  return <points ref={pointsRef} geometry={geometry} material={material} />;
}

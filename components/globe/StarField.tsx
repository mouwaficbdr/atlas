'use client';

import { Stars } from '@react-three/drei';
import { useReducedMotion } from '@/lib/hooks/useReducedMotion';

/**
 * Champ d'étoiles : délégué à drei (déjà une dépendance installée) plutôt
 * qu'un nuage de points fait main. Donne profondeur (rayon/depth variables),
 * scintillement et une légère dérive, désactivée si prefers-reduced-motion.
 */
export default function StarField() {
  const reducedMotion = useReducedMotion();

  return (
    <Stars
      radius={300}
      depth={80}
      count={9000}
      factor={3}
      saturation={0.05}
      fade
      speed={reducedMotion ? 0 : 0.4}
    />
  );
}

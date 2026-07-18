import { useState, useLayoutEffect, useEffect } from 'react';

// Le SSR n'a pas de useLayoutEffect (avertissement React) ; la détection du
// viewport n'a de sens que côté client, donc on retombe sur useEffect côté
// serveur (no-op en pratique, jamais exécuté pendant le rendu SSR).
const useIsomorphicLayoutEffect =
  typeof window !== 'undefined' ? useLayoutEffect : useEffect;

const RESIZE_DEBOUNCE_MS = 150;

export function useIsMobile(breakpoint = 768) {
  const [isMobile, setIsMobile] = useState(false);

  // useLayoutEffect (plutôt que useEffect) : la valeur correcte est appliquée
  // avant la peinture du premier frame, donc avant que les effets enfants
  // (montage du <Canvas> WebGL, fetch du GeoJSON) ne se déclenchent — évite
  // un montage/démontage gaspillé du globe au chargement sur mobile.
  useIsomorphicLayoutEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < breakpoint);
    checkMobile();

    let timeoutId: ReturnType<typeof setTimeout>;
    const handleResize = () => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(checkMobile, RESIZE_DEBOUNCE_MS);
    };

    window.addEventListener('resize', handleResize);
    return () => {
      clearTimeout(timeoutId);
      window.removeEventListener('resize', handleResize);
    };
  }, [breakpoint]);

  return isMobile;
}

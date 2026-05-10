import { useState, useEffect } from 'react';

export function useIsMobile(breakpoint = 768) {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    // Vérifie côté client
    const checkMobile = () => {
      setIsMobile(window.innerWidth < breakpoint);
    };
    
    // Initialisation
    checkMobile();
    
    // Écouteur de redimensionnement
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, [breakpoint]);

  return isMobile;
}

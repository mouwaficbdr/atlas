'use client';

import { useEffect, useRef } from 'react';
import { gsap } from 'gsap';

interface FlagDisplayProps {
  flagSvg: string;
  countryName: string;
}

export default function FlagDisplay({ flagSvg, countryName }: FlagDisplayProps) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (ref.current) {
      gsap.fromTo(
        ref.current,
        { opacity: 0, y: 20 },
        { opacity: 1, y: 0, duration: 0.6, ease: 'power2.out' }
      );
    }
  }, []);

  return (
    <div ref={ref} style={{ opacity: 0 }}>
      <img
        src={flagSvg}
        alt={`Drapeau de ${countryName}`}
        style={{ width: '100%', maxWidth: '320px', borderRadius: '8px', boxShadow: '0 4px 20px rgba(0,0,0,0.4)' }}
      />
    </div>
  );
}

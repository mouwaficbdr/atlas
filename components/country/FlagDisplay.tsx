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
    <div 
      ref={ref} 
      style={{ 
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100vw',
        height: '100vh',
        opacity: 0,
        zIndex: 0,
        pointerEvents: 'none',
        overflow: 'hidden'
      }}
    >
      <div 
        style={{
          position: 'absolute',
          top: '-20%',
          left: '-20%',
          width: '140%',
          height: '140%',
          backgroundImage: `url(${flagSvg})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          filter: 'blur(100px) saturate(2) brightness(0.5)',
          opacity: 0.6,
          mixBlendMode: 'screen',
        }}
      />
    </div>
  );
}

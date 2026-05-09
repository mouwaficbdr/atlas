'use client';

import { useEffect, useRef } from 'react';
import gsap from 'gsap';

interface LanguageListProps {
  languages: Record<string, string>;
}

export default function LanguageList({ languages }: LanguageListProps) {
  const entries = Object.entries(languages);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current) return;
    const items = containerRef.current.querySelectorAll('.lang-item');
    
    gsap.fromTo(items, 
      { opacity: 0, x: -20 },
      { 
        opacity: 1, 
        x: 0, 
        stagger: 0.1, 
        duration: 1, 
        ease: 'power3.out',
        scrollTrigger: {
          trigger: containerRef.current,
          start: 'top 90%',
        }
      }
    );
  }, []);

  if (!entries.length) return null;

  return (
    <div 
      ref={containerRef}
      style={{ 
        display: 'flex', 
        flexDirection: 'column', 
        gap: '1rem',
        overflow: 'hidden'
      }}
    >
      {entries.map(([code, name]) => (
        <div
          key={code}
          className="lang-item"
          style={{
            fontSize: 'clamp(3rem, 6vw, 8rem)',
            lineHeight: 0.9,
            fontFamily: 'var(--font-bebas-neue), sans-serif',
            color: 'rgba(0,0,0,0.85)',
            whiteSpace: 'nowrap',
            textTransform: 'uppercase',
            letterSpacing: '0.02em',
            display: 'flex',
            alignItems: 'baseline',
            gap: '2rem'
          }}
        >
          <span>{name}</span>
          <span style={{ fontSize: '1rem', color: 'rgba(0,0,0,0.4)', fontFamily: 'var(--font-jetbrains-mono), monospace' }}>
            [{code.toUpperCase()}]
          </span>
        </div>
      ))}
    </div>
  );
}

'use client';

import { useEffect, useRef } from 'react';
import gsap from 'gsap';
import { prefersReducedMotion } from '@/lib/hooks/useReducedMotion';

interface LanguageListProps {
  languages: Record<string, string>;
}

export default function LanguageList({ languages }: LanguageListProps) {
  const entries = Object.entries(languages);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current) return;
    const items = containerRef.current.querySelectorAll('.lang-item');

    if (prefersReducedMotion()) {
      gsap.set(items, { opacity: 1, x: 0 });
      return;
    }

    const tween = gsap.fromTo(
      items,
      { opacity: 0, x: -12 },
      {
        opacity: 1,
        x: 0,
        stagger: 0.06,
        duration: 0.25,
        ease: 'power2.out',
        scrollTrigger: {
          trigger: containerRef.current,
          start: 'top 90%',
        },
      },
    );

    return () => {
      tween.scrollTrigger?.kill();
      tween.kill();
    };
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
          // Taille adaptative : moins de langues = plus grand, plus = plus petit
          fontSize: entries.length <= 2
            ? 'clamp(2.5rem, 5vw, 7rem)'
            : entries.length <= 4
            ? 'clamp(1.8rem, 3.5vw, 5rem)'
            : 'clamp(1.2rem, 2.5vw, 3.5rem)',
          lineHeight: 0.95,
          fontFamily: 'var(--font-bebas-neue), sans-serif',
          color: 'rgba(0,0,0,0.85)',
          // Pas de nowrap : les noms peuvent être longs
          wordBreak: 'break-word',
          textTransform: 'uppercase',
          letterSpacing: '0.02em',
          display: 'flex',
          alignItems: 'baseline',
          gap: '1.5rem',
          flexWrap: 'wrap',
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

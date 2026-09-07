'use client';

import { useEffect, useRef } from 'react';
import Link from 'next/link';
import gsap from 'gsap';
import type { CountryData } from '@/lib/types';
import { prefersReducedMotion } from '@/lib/hooks/useReducedMotion';

interface NeighborCardsProps {
  borders: string[];
  allCountries: CountryData[];
}

export default function NeighborCards({ borders, allCountries }: NeighborCardsProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current) return;
    const cards = containerRef.current.querySelectorAll('.neighbor-card');

    if (prefersReducedMotion()) {
      gsap.set(cards, { opacity: 1, y: 0 });
      return;
    }

    const tween = gsap.fromTo(
      cards,
      { opacity: 0, y: 16 },
      {
        opacity: 1,
        y: 0,
        stagger: 0.05,
        duration: 0.25,
        ease: 'power2.out',
        scrollTrigger: {
          trigger: containerRef.current,
          start: 'top 95%',
        },
      },
    );

    return () => {
      tween.scrollTrigger?.kill();
      tween.kill();
    };
  }, [borders]);

  if (!borders.length) return <p style={{ color: 'var(--text-muted)' }}>Aucun pays voisin</p>;

  const neighbors = borders
    .map((cca3) => allCountries.find((c) => c.cca3 === cca3))
    .filter(Boolean) as CountryData[];

  return (
    <div 
      ref={containerRef}
      style={{ 
        display: 'flex', 
        flexDirection: 'column',
        gap: '0',
        width: '100%',
      }}
    >
      {neighbors.map((country) => (
        <Link
          key={country.cca3}
          href={`/pays/${country.cca3.toLowerCase()}`}
          className="neighbor-card"
          style={{
            display: 'block',
            padding: '2rem 0',
            borderBottom: '1px solid rgba(255,255,255,0.1)',
            color: 'var(--text-primary)',
            textDecoration: 'none',
            transition: 'all 0.4s cubic-bezier(0.16, 1, 0.3, 1)',
            position: 'relative',
          }}
          onMouseEnter={(e) => {
             e.currentTarget.style.paddingLeft = '3rem';
             e.currentTarget.style.color = 'var(--country-accent, #fff)';
          }}
          onMouseLeave={(e) => {
             e.currentTarget.style.paddingLeft = '0';
             e.currentTarget.style.color = 'var(--text-primary)';
          }}
        >
          <span style={{ 
            fontFamily: 'var(--font-bebas-neue), sans-serif', 
            fontSize: 'clamp(3rem, 6vw, 8rem)', 
            lineHeight: 0.9,
            textTransform: 'uppercase',
            letterSpacing: '0.02em',
          }}>
            {country.nameFr}
          </span>
        </Link>
      ))}
    </div>
  );
}

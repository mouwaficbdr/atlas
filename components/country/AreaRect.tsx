'use client';

import { useEffect, useRef } from 'react';
import { gsap } from 'gsap';

interface AreaRectProps {
  area: number;
  countryName: string;
}

const FRANCE_AREA = 551695;
const RUSSIA_AREA = 17_098_242;

export default function AreaRect({ area, countryName }: AreaRectProps) {
  const countryBarRef = useRef<HTMLDivElement>(null);
  const russiaBarRef = useRef<HTMLDivElement>(null);

  const countryPercent = Math.max(0.5, (area / RUSSIA_AREA) * 100);
  const timesFrance = (area / FRANCE_AREA).toFixed(1);

  useEffect(() => {
    if (countryBarRef.current && russiaBarRef.current) {
      gsap.fromTo(
        russiaBarRef.current,
        { scaleX: 0 },
        { scaleX: 1, duration: 0.8, ease: 'power2.out', transformOrigin: 'left' }
      );

      gsap.fromTo(
        countryBarRef.current,
        { scaleX: 0 },
        { scaleX: 1, duration: 0.8, ease: 'power2.out', delay: 0.2, transformOrigin: 'left' }
      );
    }
  }, []);

  return (
    <div style={{ width: '100%' }}>
      {/* Référentiel — Russie */}
      <div style={{ marginBottom: '1.5rem' }}>
        <div
          style={{
            fontSize: '0.9rem',
            color: 'var(--text-muted)',
            marginBottom: '0.5rem',
            fontFamily: 'JetBrains Mono, monospace',
          }}
        >
          Russie (référentiel maximum)
        </div>
        <div
          ref={russiaBarRef}
          style={{
            height: '48px',
            width: '100%',
            backgroundColor: 'rgba(100, 100, 120, 0.3)',
            borderRadius: '4px',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            display: 'flex',
            alignItems: 'center',
            paddingLeft: '1rem',
            fontFamily: 'Bebas Neue, Impact, sans-serif',
            fontSize: '1.2rem',
            color: 'var(--text-muted)',
          }}
        >
          {RUSSIA_AREA.toLocaleString()} km²
        </div>
      </div>

      {/* Pays actuel */}
      <div>
        <div
          style={{
            fontSize: '0.9rem',
            color: 'var(--country-primary, var(--text-primary))',
            marginBottom: '0.5rem',
            fontFamily: 'JetBrains Mono, monospace',
            fontWeight: 600,
          }}
        >
          {countryName}
        </div>
        <div
          ref={countryBarRef}
          style={{
            height: '48px',
            width: `${countryPercent}%`,
            backgroundColor: 'var(--country-primary, var(--color-accent))',
            borderRadius: '4px',
            border: '1px solid var(--country-accent, rgba(255, 255, 255, 0.2))',
            display: 'flex',
            alignItems: 'center',
            paddingLeft: '1rem',
            fontFamily: 'Bebas Neue, Impact, sans-serif',
            fontSize: '1.2rem',
            color: '#ffffff',
            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.3)',
          }}
        >
          {area.toLocaleString()} km²
        </div>
        <div
          style={{
            color: 'var(--text-muted)',
            fontSize: '0.85rem',
            marginTop: '0.5rem',
            fontFamily: 'JetBrains Mono, monospace',
          }}
        >
          {countryPercent.toFixed(2)}% de la Russie • {timesFrance}x la France
        </div>
      </div>
    </div>
  );
}

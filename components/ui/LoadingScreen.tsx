/**
 * LoadingScreen — Séquence d'animation de chargement premium
 * Exigences : 3.3, 3.4, 4.1, 4.2, 4.3, 4.4, 4.5
 */

'use client';

import { useEffect, useState, useRef } from 'react';
import { gsap } from 'gsap';
import type { LoadingState } from '@/lib/types';

interface LoadingScreenProps {
  loadingState: LoadingState;
  onRevealComplete: () => void;
}

export default function LoadingScreen({ loadingState, onRevealComplete }: LoadingScreenProps) {
  const [gpsText, setGpsText] = useState('');
  const containerRef = useRef<HTMLDivElement>(null);
  const textRef = useRef<HTMLDivElement>(null);

  const fullGPS = '48.8566°N, 2.3522°E';

  // Animation GPS caractère par caractère
  useEffect(() => {
    let index = 0;
    const interval = setInterval(() => {
      if (index < fullGPS.length) {
        setGpsText(fullGPS.slice(0, index + 1));
        index++;
      } else {
        clearInterval(interval);
      }
    }, 50);

    return () => clearInterval(interval);
  }, []);

  // Animation pulsation texte
  useEffect(() => {
    if (textRef.current) {
      gsap.to(textRef.current, {
        opacity: 1,
        duration: 1,
        repeat: -1,
        yoyo: true,
        ease: 'power1.inOut',
      });
    }
  }, []);

  // Fondu de sortie
  useEffect(() => {
    if (loadingState.phase === 'revealing' && loadingState.minDurationElapsed) {
      if (containerRef.current) {
        gsap.to(containerRef.current, {
          opacity: 0,
          duration: 0.4,
          onComplete: onRevealComplete,
        });
      }
    }
  }, [loadingState.phase, loadingState.minDurationElapsed, onRevealComplete]);

  if (loadingState.phase === 'complete') return null;

  return (
    <div
      ref={containerRef}
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'var(--bg-surface)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 10000,
        gap: '2rem',
      }}
    >
      <div
        style={{
          fontFamily: 'JetBrains Mono, monospace',
          fontSize: '1.2rem',
          color: 'var(--text-accent)',
          letterSpacing: '0.1em',
        }}
      >
        {gpsText}
      </div>

      <div
        style={{
          width: '60px',
          height: '60px',
          border: '3px solid var(--text-accent)',
          borderRadius: '50%',
          borderTopColor: 'transparent',
          animation: 'spin 1.5s linear infinite',
        }}
      />

      <div
        ref={textRef}
        style={{
          fontFamily: 'Bebas Neue, sans-serif',
          fontSize: '2rem',
          color: 'var(--text-primary)',
          opacity: 0.6,
        }}
      >
        Mapping the world...
      </div>

      <div
        style={{
          fontFamily: 'DM Sans, sans-serif',
          fontSize: '1rem',
          color: 'var(--text-muted)',
        }}
      >
        {loadingState.progress}%
      </div>

      <style jsx>{`
        @keyframes spin {
          to {
            transform: rotate(360deg);
          }
        }
      `}</style>
    </div>
  );
}

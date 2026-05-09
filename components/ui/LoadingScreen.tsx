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

  // Fondu de sortie — déclenché quand les deux conditions sont réunies
  useEffect(() => {
    const shouldDismiss =
      loadingState.phase === 'revealing' && loadingState.minDurationElapsed;

    if (shouldDismiss && containerRef.current) {
      gsap.to(containerRef.current, {
        opacity: 0,
        duration: 0.4,
        onComplete: onRevealComplete,
      });
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
      {/* Arrière-plan techy */}
      <div 
        style={{
          position: 'absolute',
          inset: 0,
          backgroundImage: 'linear-gradient(var(--border-subtle) 1px, transparent 1px), linear-gradient(90deg, var(--border-subtle) 1px, transparent 1px)',
          backgroundSize: '40px 40px',
          opacity: 0.1,
          zIndex: -1
        }}
      />
      <div 
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '2px',
          background: 'linear-gradient(90deg, transparent, var(--text-accent), transparent)',
          animation: 'scan 3s linear infinite',
          zIndex: -1
        }}
      />

      <div
        style={{
          fontFamily: 'var(--font-jetbrains-mono), monospace',
          fontSize: '1rem',
          color: 'var(--text-accent)',
          letterSpacing: '0.2em',
          marginBottom: '-1rem'
        }}
      >
        {gpsText}
      </div>

      <div
        ref={textRef}
        style={{
          fontFamily: 'var(--font-bebas-neue), sans-serif',
          fontSize: '4rem',
          color: 'var(--text-primary)',
          opacity: 1,
          letterSpacing: '0.05em'
        }}
      >
        ATLAS°
      </div>

      <div
        style={{
          width: '200px',
          height: '2px',
          backgroundColor: 'rgba(255,255,255,0.1)',
          position: 'relative',
          overflow: 'hidden'
        }}
      >
        <div 
          style={{
            position: 'absolute',
            left: 0,
            top: 0,
            height: '100%',
            width: `${loadingState.progress}%`,
            backgroundColor: 'var(--text-accent)',
            transition: 'width 0.3s ease-out'
          }}
        />
      </div>

      <div
        style={{
          fontFamily: 'var(--font-jetbrains-mono), monospace',
          fontSize: '0.8rem',
          color: 'var(--text-muted)',
          textTransform: 'uppercase'
        }}
      >
        MAPPING THE WORLD {loadingState.progress}%
      </div>

      <style jsx>{`
        @keyframes scan {
          from { top: 0%; }
          to { top: 100%; }
        }
      `}</style>
    </div>
  );
}

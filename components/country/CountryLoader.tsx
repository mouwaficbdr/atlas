'use client';

import { useEffect, useRef, useState } from 'react';

interface CountryLoaderProps {
  countryName?: string;
  cca3?: string;
}

export default function CountryLoader({ countryName = '...', cca3 = '---' }: CountryLoaderProps) {
  const [progress, setProgress] = useState(0);
  const [phase, setPhase] = useState(0);
  const rafRef = useRef<number>(0);
  const startRef = useRef<number>(Date.now());

  const phases = [
    'INITIALISATION ATLAS°',
    'CHARGEMENT DONNÉES GÉOPOLITIQUES',
    'SYNCHRONISATION TEMPORELLE',
    'RÉSOLUTION IDENTITÉ NATIONALE',
    'RENDU ÉDITORIAL EN COURS',
  ];

  useEffect(() => {
    const DURATION = 2800;

    const tick = () => {
      const elapsed = Date.now() - startRef.current;
      const raw = Math.min(elapsed / DURATION, 0.98);
      // Easing exponentiel — accélère au début, ralentit à la fin
      const eased = 1 - Math.pow(1 - raw, 3);
      setProgress(Math.round(eased * 100));
      setPhase(Math.floor(eased * phases.length));
      if (raw < 1) rafRef.current = requestAnimationFrame(tick);
    };

    rafRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafRef.current);
  }, []);

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: '#05050A',
        zIndex: 9999,
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        padding: '4vh 5vw',
        fontFamily: 'var(--font-jetbrains-mono), monospace',
        color: '#fff',
        overflow: 'hidden',
      }}
    >
      {/* Grain texture overlay */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          backgroundImage:
            'url("data:image/svg+xml,%3Csvg viewBox=\'0 0 256 256\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cfilter id=\'noise\'%3E%3CfeTurbulence type=\'fractalNoise\' baseFrequency=\'0.9\' numOctaves=\'4\' stitchTiles=\'stitch\'/%3E%3C/filter%3E%3Crect width=\'100%25\' height=\'100%25\' filter=\'url(%23noise)\' opacity=\'0.04\'/%3E%3C/svg%3E")',
          pointerEvents: 'none',
          opacity: 0.6,
        }}
      />

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', position: 'relative' }}>
        <div>
          <div style={{ fontSize: '0.6rem', letterSpacing: '0.3em', opacity: 0.4, marginBottom: '0.5rem' }}>
            ATLAS° GLOBE — SYSTÈME DE CHARGEMENT
          </div>
          <div style={{ fontSize: '0.6rem', letterSpacing: '0.2em', opacity: 0.25 }}>
            v2026.1 / ÉDITION ENCYCLOPÉDIQUE
          </div>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontSize: '0.6rem', letterSpacing: '0.2em', opacity: 0.4 }}>
            {cca3.toUpperCase()}
          </div>
        </div>
      </div>

      {/* Centre : Nom du pays massif */}
      <div style={{ position: 'relative', flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
        {/* Filigrane */}
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            fontSize: 'clamp(8rem, 20vw, 25rem)',
            fontFamily: 'var(--font-bebas-neue), sans-serif',
            color: 'rgba(255,255,255,0.03)',
            whiteSpace: 'nowrap',
            pointerEvents: 'none',
            userSelect: 'none',
            letterSpacing: '-0.03em',
          }}
        >
          {cca3.toUpperCase()}
        </div>

        {/* Nom pays */}
        <h1
          style={{
            fontSize: 'clamp(3rem, 8vw, 10rem)',
            fontFamily: 'var(--font-bebas-neue), sans-serif',
            lineHeight: 0.85,
            letterSpacing: '-0.02em',
            textTransform: 'uppercase',
            opacity: 0.08 + (progress / 100) * 0.9,
            transform: `translateY(${(1 - progress / 100) * 20}px)`,
            transition: 'opacity 0.1s linear, transform 0.1s linear',
            marginBottom: '3rem',
          }}
        >
          {countryName}
        </h1>

        {/* Phase texte */}
        <div
          style={{
            fontSize: '0.65rem',
            letterSpacing: '0.3em',
            color: 'rgba(255,255,255,0.35)',
            height: '1rem',
            overflow: 'hidden',
          }}
        >
          {phases[Math.min(phase, phases.length - 1)]}
          <span
            style={{
              display: 'inline-block',
              animation: 'blink 0.8s step-end infinite',
            }}
          >
            _
          </span>
        </div>
      </div>

      {/* Footer : Barre de progression */}
      <div style={{ position: 'relative' }}>
        {/* Labels */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            marginBottom: '1rem',
            fontSize: '0.6rem',
            letterSpacing: '0.15em',
            opacity: 0.4,
          }}
        >
          <span>PROGRESSION</span>
          <span>{progress.toString().padStart(3, '0')} %</span>
        </div>

        {/* Track */}
        <div
          style={{
            width: '100%',
            height: '1px',
            backgroundColor: 'rgba(255,255,255,0.08)',
            position: 'relative',
          }}
        >
          {/* Fill avec scanner glow */}
          <div
            style={{
              position: 'absolute',
              left: 0,
              top: 0,
              height: '100%',
              width: `${progress}%`,
              backgroundColor: 'rgba(255,255,255,0.9)',
              transition: 'width 0.1s linear',
              boxShadow: '0 0 8px rgba(255,255,255,0.6), 0 0 20px rgba(255,255,255,0.2)',
            }}
          />

          {/* Scanner pulse au bout de la barre */}
          <div
            style={{
              position: 'absolute',
              top: '-2px',
              left: `${progress}%`,
              transform: 'translateX(-50%)',
              width: '4px',
              height: '5px',
              backgroundColor: '#fff',
              boxShadow: '0 0 10px rgba(255,255,255,1)',
            }}
          />
        </div>

        {/* Bas : indicateurs techniques */}
        <div
          style={{
            display: 'flex',
            gap: '3rem',
            marginTop: '2rem',
            fontSize: '0.55rem',
            letterSpacing: '0.15em',
            opacity: 0.2,
          }}
        >
          <span>LATENCE API — WIKIPEDIA REST V1</span>
          <span>CACHE — NEXT.JS DATA CACHE</span>
          <span>TTL — 86400s</span>
        </div>
      </div>

      <style>{`
        @keyframes blink {
          0%, 100% { opacity: 1; }
          50% { opacity: 0; }
        }
      `}</style>
    </div>
  );
}

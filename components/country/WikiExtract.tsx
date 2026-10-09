'use client';

import { useState } from 'react';

interface WikiExtractProps {
  wikiSummary: string;
}

export default function WikiExtract({ wikiSummary }: WikiExtractProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const isLong = wikiSummary.length > 350;

  return (
    <div
      style={{
        position: 'absolute',
        bottom: '5vh',
        // En % du panneau et non en vw : vw inclut la barre de défilement, ce
        // qui faisait déborder l'extrait à gauche sur mobile.
        right: 'clamp(1rem, 5%, 4rem)',
        width: 'min(calc(100% - 2rem), 400px)',
        zIndex: 30,
        borderTop: '1px solid var(--country-accent)',
        paddingTop: '1.5rem',
        mixBlendMode: 'difference',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <h4
          style={{
            fontSize: '0.6rem',
            fontFamily: 'var(--font-jetbrains-mono), monospace',
            color: 'var(--country-accent)',
            letterSpacing: '0.2em',
            margin: 0,
          }}
        >
          WIKIPEDIA EXTRACT
        </h4>
        {isLong && (
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            style={{
              background: 'transparent',
              border: 'none',
              color: 'var(--country-accent)',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              padding: '0.5rem',
              margin: '-0.5rem',
              transition: 'transform 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
              transform: isExpanded ? 'rotate(45deg)' : 'rotate(0deg)',
            }}
            aria-label={isExpanded ? 'Réduire' : 'Lire la suite'}
          >
            {/* SVG inline Plus/X, sans dépendance externe */}
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="12" y1="5" x2="12" y2="19" />
              <line x1="5" y1="12" x2="19" y2="12" />
            </svg>
          </button>
        )}
      </div>

      <div
        style={{
          position: 'relative',
          overflow: 'hidden',
          transition: 'max-height 0.8s cubic-bezier(0.16, 1, 0.3, 1)',
          maxHeight: isExpanded ? '800px' : '150px',
        }}
      >
        <p
          style={{
            fontSize: '0.85rem',
            lineHeight: 1.8,
            color: '#fff',
            textAlign: 'left',
            margin: 0,
            opacity: isExpanded ? 1 : 0.8,
            transition: 'opacity 0.8s ease',
          }}
        >
          {wikiSummary}
        </p>

        {/* Gradient fade when collapsed */}
        {!isExpanded && isLong && (
          <div
            style={{
              position: 'absolute',
              bottom: 0,
              left: 0,
              width: '100%',
              height: '80px',
              background: 'linear-gradient(to bottom, rgba(0,0,0,0) 0%, rgba(0,0,0,1) 100%)',
              pointerEvents: 'none',
            }}
          />
        )}
      </div>

      {!isExpanded && isLong && (
        <button
          onClick={() => setIsExpanded(true)}
          style={{
            background: 'transparent',
            border: 'none',
            color: '#fff',
            fontFamily: 'var(--font-jetbrains-mono), monospace',
            fontSize: '0.65rem',
            letterSpacing: '0.1em',
            textAlign: 'left',
            cursor: 'pointer',
            padding: '1rem 0 0 0',
            opacity: 0.5,
            transition: 'opacity 0.3s ease',
            textDecoration: 'underline',
            textUnderlineOffset: '4px',
          }}
          onMouseEnter={(e) => (e.currentTarget.style.opacity = '1')}
          onMouseLeave={(e) => (e.currentTarget.style.opacity = '0.5')}
        >
          LIRE LA SUITE
        </button>
      )}
    </div>
  );
}

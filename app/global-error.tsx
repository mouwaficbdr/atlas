'use client';

import { useEffect } from 'react';

/**
 * Filet de sécurité ultime : une erreur dans le layout racine lui-même.
 * global-error remplace <html>/<body>, sans accès aux polices ni au CSS
 * global de l'app : tout est donc en styles inline autoportants, avec des
 * polices système en repli.
 */
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('[ATLAS] Erreur fatale (layout racine) :', error);
  }, [error]);

  return (
    <html lang="fr">
      <body
        style={{
          margin: 0,
          minHeight: '100vh',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          gap: '3rem',
          padding: 'clamp(1.5rem, 5vw, 4rem)',
          backgroundColor: '#0a0a14',
          color: '#f0f0f0',
          fontFamily:
            'ui-monospace, SFMono-Regular, "JetBrains Mono", Menlo, Consolas, monospace',
        }}
      >
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            fontSize: '0.72rem',
            letterSpacing: '0.22em',
            textTransform: 'uppercase',
          }}
        >
          <span style={{ color: 'rgba(240,240,240,0.85)' }}>ATLAS&#176;</span>
          <span style={{ color: '#4fc3f7' }}>[ FATAL ]</span>
        </div>

        <div style={{ maxWidth: '46ch' }}>
          <p
            style={{
              fontSize: '0.72rem',
              letterSpacing: '0.3em',
              textTransform: 'uppercase',
              color: 'rgba(240,240,240,0.6)',
              margin: '0 0 1.25rem',
            }}
          >
            Panne du système
          </p>
          <h1
            style={{
              fontSize: 'clamp(3rem, 12vw, 7rem)',
              lineHeight: 0.9,
              letterSpacing: '0.02em',
              textTransform: 'uppercase',
              margin: 0,
              fontFamily:
                '"Bebas Neue", Impact, ui-sans-serif, system-ui, sans-serif',
            }}
          >
            Atlas hors ligne
          </h1>
          <div
            style={{
              width: '3rem',
              height: '1px',
              background: '#4fc3f7',
              margin: '1.75rem 0',
            }}
          />
          <p
            style={{
              fontSize: '0.85rem',
              lineHeight: 1.7,
              color: 'rgba(240,240,240,0.72)',
              margin: 0,
            }}
          >
            Une erreur a empêché l&apos;atlas de se charger. Rechargez la page
            pour réessayer.
          </p>
          <button
            type="button"
            onClick={reset}
            style={{
              marginTop: '2.5rem',
              fontFamily: 'inherit',
              fontSize: '0.78rem',
              letterSpacing: '0.16em',
              textTransform: 'uppercase',
              color: 'rgba(240,240,240,0.92)',
              background: 'none',
              border: 'none',
              borderBottom: '1px solid rgba(255,255,255,0.25)',
              padding: '0.25rem 0',
              cursor: 'pointer',
            }}
          >
            Recharger
          </button>
        </div>

        <div
          style={{
            fontSize: '0.66rem',
            letterSpacing: '0.22em',
            textTransform: 'uppercase',
            color: 'rgba(240,240,240,0.4)',
          }}
        >
          ATLAS&#176; &middot; BADAROU Mouwafic
        </div>
      </body>
    </html>
  );
}

'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { useAppStore } from '@/lib/store';

interface OffMapScreenProps {
  /** Jeton de statut affiché en haut à droite (ex. "404", "ERR"). */
  status: string;
  /** Intitulé court en capitales sous le kicker (ex. "COORDONNÉES SANS TERRITOIRE"). */
  kicker: string;
  /** Le mot fort, en display (ex. "HORS-CARTE"). */
  headline: string;
  /** Une phrase, sobre, qui explique. */
  message: string;
  /** Coordonnée brouillée affichée en pied, clin d'oeil au relevé GPS de l'app. */
  lostCoordinates?: string;
  /** Action secondaire optionnelle (page d'erreur : relancer le rendu). */
  onRetry?: () => void;
}

/**
 * Écran plein cadre pour les routes qui sortent de l'univers ATLAS : 404 et
 * erreurs de rendu. Reprend le langage visuel de l'app (fond #0a0a14, grille
 * fine, ligne de scan, mono JetBrains, display Bebas) sans réutiliser le
 * chrome du globe.
 */
export default function OffMapScreen({
  status,
  kicker,
  headline,
  message,
  lostCoordinates = '--°--′ -- · --°--′ --',
  onRetry,
}: OffMapScreenProps) {
  const setOffMap = useAppStore((s) => s.setOffMap);

  useEffect(() => {
    setOffMap(true);
    return () => setOffMap(false);
  }, [setOffMap]);

  return (
    <main className="offmap">
      <div className="offmap__grid" aria-hidden="true" />
      <div className="offmap__scan" aria-hidden="true" />

      <div className="offmap__row">
        <span className="offmap__mark">ATLAS&#176;</span>
        <span className="offmap__status">[ {status} ]</span>
      </div>

      <div className="offmap__core">
        <p className="offmap__kicker">{kicker}</p>
        <h1 className="offmap__headline">{headline}</h1>
        <div className="offmap__rule" aria-hidden="true" />
        <p className="offmap__message">{message}</p>

        <div className="offmap__actions">
          <Link href="/" className="offmap__link">
            <span aria-hidden="true">&larr;</span> Retour au globe
          </Link>
          {onRetry && (
            <button type="button" onClick={onRetry} className="offmap__retry">
              Relancer
            </button>
          )}
        </div>
      </div>

      <div className="offmap__row offmap__row--foot">
        <span>ATLAS&#176; &middot; BADAROU Mouwafic</span>
        <span className="offmap__coords">{lostCoordinates}</span>
      </div>

      <style jsx>{`
        .offmap {
          position: fixed;
          inset: 0;
          z-index: 100001;
          display: flex;
          flex-direction: column;
          justify-content: space-between;
          gap: clamp(2rem, 8vh, 5rem);
          padding: clamp(1.5rem, 5vw, 4rem);
          background-color: var(--bg-surface, #0a0a14);
          color: var(--text-primary, #f0f0f0);
          overflow: hidden;
        }
        .offmap__grid {
          position: absolute;
          inset: 0;
          background-image: linear-gradient(
              var(--border-subtle, rgba(255, 255, 255, 0.1)) 1px,
              transparent 1px
            ),
            linear-gradient(
              90deg,
              var(--border-subtle, rgba(255, 255, 255, 0.1)) 1px,
              transparent 1px
            );
          background-size: 40px 40px;
          opacity: 0.06;
          pointer-events: none;
        }
        .offmap__scan {
          position: absolute;
          left: 0;
          right: 0;
          top: 0;
          height: 1px;
          background: linear-gradient(
            90deg,
            transparent,
            var(--text-accent, #4fc3f7),
            transparent
          );
          opacity: 0.5;
          animation: offmap-scan 6s linear infinite;
          pointer-events: none;
        }
        .offmap__row {
          position: relative;
          display: flex;
          justify-content: space-between;
          align-items: baseline;
          gap: 1rem;
          flex-wrap: wrap;
          font-family: var(--font-jetbrains-mono), monospace;
          font-size: 0.72rem;
          letter-spacing: 0.22em;
          text-transform: uppercase;
        }
        .offmap__mark {
          color: rgba(240, 240, 240, 0.85);
        }
        .offmap__status {
          color: var(--text-accent, #4fc3f7);
        }
        .offmap__row--foot {
          color: rgba(240, 240, 240, 0.4);
          font-size: 0.66rem;
        }
        .offmap__coords {
          font-variant-numeric: tabular-nums;
        }
        .offmap__core {
          position: relative;
          max-width: 46ch;
          animation: offmap-enter 0.5s var(--ease-signature, cubic-bezier(0.16, 1, 0.3, 1)) both;
        }
        .offmap__kicker {
          font-family: var(--font-jetbrains-mono), monospace;
          font-size: 0.72rem;
          letter-spacing: 0.3em;
          text-transform: uppercase;
          color: rgba(240, 240, 240, 0.6);
          margin-bottom: 1.25rem;
        }
        .offmap__headline {
          font-family: var(--font-bebas-neue), 'Impact', sans-serif;
          font-weight: 400;
          font-size: clamp(4rem, 16vw, 11rem);
          line-height: 0.88;
          letter-spacing: 0.02em;
          margin: 0;
        }
        .offmap__rule {
          width: 3rem;
          height: 1px;
          background: var(--text-accent, #4fc3f7);
          margin: 1.75rem 0;
        }
        .offmap__message {
          font-family: var(--font-jetbrains-mono), monospace;
          font-size: 0.85rem;
          line-height: 1.7;
          color: rgba(240, 240, 240, 0.72);
        }
        .offmap__actions {
          display: flex;
          flex-wrap: wrap;
          gap: 1.5rem 2.5rem;
          margin-top: 2.5rem;
        }
        .offmap__link,
        .offmap__retry {
          font-family: var(--font-jetbrains-mono), monospace;
          font-size: 0.78rem;
          letter-spacing: 0.16em;
          text-transform: uppercase;
          color: rgba(240, 240, 240, 0.92);
          background: none;
          border: none;
          padding: 0.25rem 0;
          border-bottom: 1px solid rgba(255, 255, 255, 0.25);
          cursor: pointer;
          transition:
            color 0.2s var(--ease-ui, ease),
            border-color 0.2s var(--ease-ui, ease);
        }
        .offmap__link:hover,
        .offmap__retry:hover,
        .offmap__link:focus-visible,
        .offmap__retry:focus-visible {
          color: var(--text-accent, #4fc3f7);
          border-color: var(--text-accent, #4fc3f7);
        }
        @keyframes offmap-scan {
          from {
            transform: translateY(0);
          }
          to {
            transform: translateY(100vh);
          }
        }
        @keyframes offmap-enter {
          from {
            opacity: 0;
            transform: translateY(8px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </main>
  );
}

'use client';

import { useEffect, useState } from 'react';
import { useIsMobile } from '@/lib/hooks/useIsMobile';

const STORAGE_KEY = 'atlas_desktop_hint_seen';

/**
 * Suggestion discrète, sur mobile, d'ouvrir ATLAS° sur grand écran. Bandeau bas
 * non bloquant (ni voile, ni backdrop-filter), affiché une fois pour toutes
 * (localStorage), fermable.
 */
export default function DesktopExperienceSuggestion() {
  const isMobile = useIsMobile();
  const [show, setShow] = useState(false);

  useEffect(() => {
    if (!isMobile) return;
    try {
      if (localStorage.getItem(STORAGE_KEY) === '1') return;
    } catch {
      // localStorage indisponible : on affiche quand même.
    }
    const timer = setTimeout(() => setShow(true), 2500);
    return () => clearTimeout(timer);
  }, [isMobile]);

  const dismiss = () => {
    setShow(false);
    try {
      localStorage.setItem(STORAGE_KEY, '1');
    } catch {
      /* pas de persistance */
    }
  };

  if (!show) return null;

  return (
    <div className="deskhint" role="note">
      <span className="deskhint__text">
        ATLAS&#176; donne le meilleur sur grand écran : globe 3D et interactions
        complètes.
      </span>
      <button
        type="button"
        onClick={dismiss}
        className="deskhint__close"
        aria-label="Fermer"
      >
        &times;
      </button>

      <style jsx>{`
        .deskhint {
          position: fixed;
          left: 0.75rem;
          right: 0.75rem;
          bottom: 0.75rem;
          z-index: 9000;
          display: flex;
          align-items: center;
          gap: 0.75rem;
          padding: 0.85rem 0.85rem 0.85rem 1.1rem;
          background: rgba(10, 10, 20, 0.94);
          border: 1px solid rgba(255, 255, 255, 0.12);
          border-radius: 0.75rem;
          color: rgba(240, 240, 240, 0.82);
          font-family: var(--font-jetbrains-mono), monospace;
          font-size: 0.68rem;
          line-height: 1.55;
          letter-spacing: 0.04em;
          box-shadow: 0 16px 32px rgba(0, 0, 0, 0.4);
          animation: deskhint-in 0.24s var(--ease-ui, ease) both;
        }
        .deskhint__text {
          flex: 1;
        }
        .deskhint__close {
          flex-shrink: 0;
          display: flex;
          align-items: center;
          justify-content: center;
          width: 1.9rem;
          height: 1.9rem;
          border: none;
          border-radius: 50%;
          background: rgba(255, 255, 255, 0.06);
          color: rgba(240, 240, 240, 0.7);
          font-size: 1.15rem;
          line-height: 1;
          cursor: pointer;
        }
        .deskhint__close:hover,
        .deskhint__close:focus-visible {
          background: rgba(255, 255, 255, 0.14);
          color: #fff;
        }
        @keyframes deskhint-in {
          from {
            opacity: 0;
            transform: translateY(12px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </div>
  );
}

'use client';

import { useEffect, useState } from 'react';
import { useIsMobile } from '@/lib/hooks/useIsMobile';

const STORAGE_KEY = 'atlas_onboarding_seen';
const IDLE_DELAY_MS = 2000;

/**
 * Indice d'interaction sur le globe (desktop). Déclenché après 2s sans aucune
 * interaction, masqué dès la première ; vu une fois pour toutes (localStorage).
 * Hint unique, combiné, avec une croix pour le fermer.
 */
export default function GlobeOnboarding() {
  const isMobile = useIsMobile();
  const [show, setShow] = useState(false);

  useEffect(() => {
    if (isMobile) return;

    try {
      if (localStorage.getItem(STORAGE_KEY) === '1') return;
    } catch {
      // localStorage indisponible : on affiche quand même l'indice.
    }

    const markSeen = () => {
      try {
        localStorage.setItem(STORAGE_KEY, '1');
      } catch {
        // sans persistance : réapparaîtra à la prochaine visite, acceptable.
      }
    };

    const events: Array<keyof WindowEventMap> = [
      'pointerdown',
      'wheel',
      'keydown',
    ];
    const controller = new AbortController();
    let shown = false;

    const timer = setTimeout(() => {
      shown = true;
      setShow(true);
    }, IDLE_DELAY_MS);

    const onInteract = () => {
      clearTimeout(timer);
      if (shown) setShow(false);
      markSeen();
      controller.abort();
    };

    events.forEach((e) =>
      window.addEventListener(e, onInteract, {
        passive: true,
        signal: controller.signal,
      }),
    );

    return () => {
      clearTimeout(timer);
      controller.abort();
    };
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
    <div className="onb" role="status">
      <span className="onb__hint">
        <svg
          width="18"
          height="18"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <path d="M8 9l-4 3 4 3" />
          <path d="M16 9l4 3-4 3" />
          <path d="M4 12h16" />
        </svg>
        Glissez pour pivoter
      </span>
      <span className="onb__sep" aria-hidden="true" />
      <span className="onb__hint">
        <svg
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <circle cx="12" cy="12" r="4" />
          <path d="M12 3v2M12 19v2M3 12h2M19 12h2" />
        </svg>
        Cliquez un pays pour l&apos;explorer
      </span>
      <button
        type="button"
        onClick={dismiss}
        className="onb__close"
        aria-label="Masquer l'indice"
      >
        &times;
      </button>

      <style jsx>{`
        .onb {
          position: fixed;
          left: 50%;
          bottom: 10vh;
          transform: translateX(-50%);
          z-index: 50;
          display: flex;
          align-items: center;
          gap: 1rem;
          padding: 0.75rem 0.75rem 0.75rem 1.5rem;
          background: rgba(10, 10, 20, 0.72);
          border: 1px solid rgba(255, 255, 255, 0.12);
          border-radius: 999px;
          color: rgba(240, 240, 240, 0.9);
          font-family: var(--font-jetbrains-mono), monospace;
          font-size: 0.68rem;
          letter-spacing: 0.18em;
          text-transform: uppercase;
          white-space: nowrap;
          box-shadow: 0 20px 40px rgba(0, 0, 0, 0.45);
          animation: onb-in 0.24s var(--ease-ui, ease) both;
        }
        .onb__hint {
          display: flex;
          align-items: center;
          gap: 0.6rem;
        }
        .onb__hint svg {
          color: var(--text-accent, #4fc3f7);
          flex-shrink: 0;
        }
        .onb__sep {
          width: 1px;
          height: 1.1rem;
          background: rgba(255, 255, 255, 0.18);
        }
        .onb__close {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 1.6rem;
          height: 1.6rem;
          border: none;
          border-radius: 50%;
          background: rgba(255, 255, 255, 0.06);
          color: rgba(240, 240, 240, 0.7);
          font-size: 1rem;
          line-height: 1;
          cursor: pointer;
          transition: background 0.2s var(--ease-ui, ease), color 0.2s var(--ease-ui, ease);
        }
        .onb__close:hover,
        .onb__close:focus-visible {
          background: rgba(255, 255, 255, 0.14);
          color: #fff;
        }
        @keyframes onb-in {
          from {
            opacity: 0;
            transform: translate(-50%, 8px);
          }
          to {
            opacity: 1;
            transform: translate(-50%, 0);
          }
        }
        @media (max-width: 640px) {
          .onb {
            flex-wrap: wrap;
            white-space: normal;
            max-width: calc(100vw - 2rem);
          }
        }
      `}</style>
    </div>
  );
}

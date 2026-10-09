'use client';

import Link from 'next/link';

interface NavigationProps {
  onSearchOpen: () => void;
}

/**
 * Montée uniquement sur l'écran de départ (voir PersistentLayout) : pas de
 * barre de navigation, juste le logo flottant au-dessus du globe et une
 * balise de recherche (étoile du ciel) à la place d'un bouton/barre classique.
 */
export default function Navigation({ onSearchOpen }: NavigationProps) {
  return (
    <>
      <Link href="/" className="atlas-wordmark">
        ATLAS°
      </Link>

      <button
        type="button"
        onClick={onSearchOpen}
        className="atlas-beacon"
        aria-label="Localiser un pays (raccourci Cmd+K)"
      >
        <span className="atlas-beacon__rings" aria-hidden="true">
          <span className="atlas-beacon__ring" />
          <span className="atlas-beacon__ring atlas-beacon__ring--delayed" />
        </span>
        <span className="atlas-beacon__core" aria-hidden="true" />
        <span className="atlas-beacon__tag" aria-hidden="true">
          <span className="atlas-beacon__leader" />
          Localiser
        </span>
      </button>

      <style>{`
        .atlas-wordmark {
          position: fixed;
          top: 24px;
          left: 24px;
          z-index: 1000;
          font-size: 1.4rem;
          font-weight: 700;
          color: var(--text-primary);
          text-decoration: none;
          letter-spacing: 0.02em;
          opacity: 0.92;
          transition: opacity 0.2s var(--ease-ui, ease);
        }
        .atlas-wordmark:hover,
        .atlas-wordmark:focus-visible {
          opacity: 1;
        }

        .atlas-beacon {
          position: fixed;
          top: 34px;
          right: 36px;
          z-index: 1000;
          width: 28px;
          height: 28px;
          display: flex;
          align-items: center;
          justify-content: center;
          background: none;
          border: none;
          padding: 0;
          cursor: pointer;
        }
        .atlas-beacon:focus-visible {
          outline: 2px solid rgba(79, 195, 247, 0.8);
          outline-offset: 8px;
          border-radius: 50%;
        }
        .atlas-beacon__core {
          width: 7px;
          height: 7px;
          border-radius: 50%;
          background: #eaf6ff;
          box-shadow:
            0 0 6px 2px rgba(79, 195, 247, 0.85),
            0 0 18px 6px rgba(79, 195, 247, 0.35);
          animation: beacon-breathe 3.2s ease-in-out infinite;
        }
        .atlas-beacon__rings {
          position: absolute;
          inset: 0;
          pointer-events: none;
        }
        .atlas-beacon__ring {
          position: absolute;
          inset: 0;
          margin: auto;
          width: 7px;
          height: 7px;
          border-radius: 50%;
          border: 1px solid rgba(79, 195, 247, 0.55);
          animation: beacon-ping 3.2s ease-out infinite;
        }
        .atlas-beacon__ring--delayed {
          animation-delay: 1.6s;
        }
        .atlas-beacon__tag {
          position: absolute;
          top: 50%;
          right: calc(100% + 10px);
          transform: translateY(-50%);
          display: flex;
          align-items: center;
          gap: 8px;
          white-space: nowrap;
          font-family: var(--font-jetbrains-mono), monospace;
          font-size: 0.68rem;
          letter-spacing: 0.18em;
          text-transform: uppercase;
          color: var(--text-accent, #4fc3f7);
          opacity: 0;
          transform-origin: right center;
          transition: opacity 0.25s var(--ease-ui, ease);
        }
        .atlas-beacon__leader {
          width: 20px;
          height: 1px;
          background: rgba(79, 195, 247, 0.55);
        }
        .atlas-beacon:hover .atlas-beacon__tag,
        .atlas-beacon:focus-visible .atlas-beacon__tag {
          opacity: 1;
        }
        .atlas-beacon:hover .atlas-beacon__core,
        .atlas-beacon:focus-visible .atlas-beacon__core {
          animation-duration: 1.2s;
        }

        @keyframes beacon-breathe {
          0%, 100% { opacity: 0.75; transform: scale(1); }
          50% { opacity: 1; transform: scale(1.25); }
        }
        @keyframes beacon-ping {
          0% { opacity: 0.6; transform: scale(1); }
          100% { opacity: 0; transform: scale(5); }
        }
        @media (prefers-reduced-motion: reduce) {
          .atlas-beacon__core,
          .atlas-beacon__ring {
            animation: none;
          }
        }
        @media (max-width: 640px) {
          .atlas-beacon__tag {
            display: none;
          }
        }
      `}</style>
    </>
  );
}

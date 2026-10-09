'use client';

interface NavigationProps {
  onSearchOpen: () => void;
}

/**
 * Montée uniquement sur l'écran de départ (voir PersistentLayout). Ni barre
 * ni logo : la recherche est une étoile du ciel, avec ses aigrettes de
 * diffraction et son scintillement, qui se nomme au survol.
 */
export default function Navigation({ onSearchOpen }: NavigationProps) {
  return (
    <>
      <button
        type="button"
        onClick={onSearchOpen}
        className="star"
        aria-label="Localiser un pays (raccourci Cmd+K)"
      >
        <span className="star__body" aria-hidden="true">
          <span className="star__halo" />
          <span className="star__spike star__spike--h" />
          <span className="star__spike star__spike--v" />
          <span className="star__spike star__spike--d1" />
          <span className="star__spike star__spike--d2" />
          <span className="star__core" />
        </span>
        <span className="star__tag" aria-hidden="true">
          <span className="star__leader" />
          Localiser un pays
        </span>
      </button>

      <style dangerouslySetInnerHTML={{ __html: `
        .star {
          position: fixed;
          top: 30px;
          right: 34px;
          z-index: 1000;
          width: 44px;
          height: 44px;
          display: grid;
          place-items: center;
          background: none;
          border: none;
          padding: 0;
          cursor: pointer;
        }
        .star:focus-visible {
          outline: 1px solid rgba(79, 195, 247, 0.7);
          outline-offset: 6px;
          border-radius: 50%;
        }
        .star__body {
          position: relative;
          width: 44px;
          height: 44px;
          display: grid;
          place-items: center;
          transition: transform 0.6s var(--ease-signature, ease);
        }
        .star__body > * {
          grid-area: 1 / 1;
        }
        .star__halo {
          width: 26px;
          height: 26px;
          border-radius: 50%;
          background: radial-gradient(circle, rgba(200, 228, 255, 0.45) 0%, rgba(120, 180, 255, 0.12) 40%, transparent 70%);
          animation: star-twinkle-a 4.3s ease-in-out infinite;
        }
        .star__core {
          width: 3px;
          height: 3px;
          border-radius: 50%;
          background: #fff;
          box-shadow: 0 0 2px 1px rgba(255, 255, 255, 0.95), 0 0 6px 2px rgba(190, 225, 255, 0.7);
        }
        /* Aigrettes de diffraction : fines, plus vives au centre, teintées
           d'un léger bleu aux extrémités comme sur une photo de télescope. */
        .star__spike {
          width: 40px;
          height: 1px;
          background: linear-gradient(90deg, transparent 0%, rgba(150, 200, 255, 0.35) 22%, rgba(255, 255, 255, 0.95) 50%, rgba(150, 200, 255, 0.35) 78%, transparent 100%);
          animation: star-twinkle-b 3.1s ease-in-out infinite;
        }
        .star__spike--v {
          transform: rotate(90deg);
          animation-duration: 3.7s;
        }
        .star__spike--d1,
        .star__spike--d2 {
          width: 18px;
          opacity: 0.35;
          animation: none;
        }
        .star__spike--d1 { transform: rotate(45deg); }
        .star__spike--d2 { transform: rotate(-45deg); }
        .star:hover .star__body,
        .star:focus-visible .star__body {
          transform: scale(1.35);
        }
        .star__tag {
          position: absolute;
          top: 50%;
          right: calc(100% + 4px);
          transform: translate(6px, -50%);
          display: flex;
          align-items: center;
          gap: 10px;
          white-space: nowrap;
          font-family: var(--font-jetbrains-mono), monospace;
          font-size: 0.64rem;
          letter-spacing: 0.22em;
          text-transform: uppercase;
          color: rgba(220, 238, 255, 0.85);
          opacity: 0;
          pointer-events: none;
          transition: opacity 0.35s var(--ease-ui, ease), transform 0.45s var(--ease-signature, ease);
        }
        .star__leader {
          width: 28px;
          height: 1px;
          background: linear-gradient(90deg, transparent, rgba(220, 238, 255, 0.6));
        }
        .star:hover .star__tag,
        .star:focus-visible .star__tag {
          opacity: 1;
          transform: translate(0, -50%);
        }
        /* Scintillement : deux périodes non multiples l'une de l'autre, pour
           un rythme irrégulier, jamais mécanique. */
        @keyframes star-twinkle-a {
          0%, 100% { opacity: 0.75; transform: scale(1); }
          38% { opacity: 1; transform: scale(1.12); }
          61% { opacity: 0.6; transform: scale(0.94); }
        }
        @keyframes star-twinkle-b {
          0%, 100% { opacity: 0.85; }
          27% { opacity: 0.45; }
          54% { opacity: 1; }
          79% { opacity: 0.6; }
        }
        @media (prefers-reduced-motion: reduce) {
          .star__halo, .star__spike { animation: none; }
          .star__body, .star__tag { transition: none; }
        }
        @media (max-width: 640px) {
          .star__tag { display: none; }
        }
      ` }} />
    </>
  );
}

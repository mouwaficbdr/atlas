/**
 * Chargement d'une fiche pays (Suspense de la route). Volontairement sans
 * fond : la caméra vole déjà vers le pays et ce vol EST la transition ; un
 * overlay opaque le masquait. Un réticule se verrouille au centre de l'écran,
 * là où la caméra amène le pays.
 */
export default function CountryLoading() {
  return (
    <div className="lock" role="status" aria-label="Chargement de la fiche pays">
      <div className="lock__frame" aria-hidden="true">
        <span className="lock__corner lock__corner--tl" />
        <span className="lock__corner lock__corner--tr" />
        <span className="lock__corner lock__corner--bl" />
        <span className="lock__corner lock__corner--br" />
      </div>
      <span className="lock__label" aria-hidden="true">
        Acquisition
      </span>

      <style dangerouslySetInnerHTML={{ __html: `
        .lock {
          position: fixed;
          inset: 0;
          z-index: 5000;
          display: grid;
          place-items: center;
          pointer-events: none;
        }
        .lock > * {
          grid-area: 1 / 1;
        }
        .lock__frame {
          position: relative;
          width: 72px;
          height: 72px;
          animation: lock-in 1.1s var(--ease-signature, ease) both;
        }
        .lock__corner {
          position: absolute;
          width: 14px;
          height: 14px;
          border-color: var(--text-accent, #4fc3f7);
          border-style: solid;
          border-width: 0;
          filter: drop-shadow(0 0 4px rgba(79, 195, 247, 0.6));
        }
        .lock__corner--tl { top: 0; left: 0; border-top-width: 1.5px; border-left-width: 1.5px; }
        .lock__corner--tr { top: 0; right: 0; border-top-width: 1.5px; border-right-width: 1.5px; }
        .lock__corner--bl { bottom: 0; left: 0; border-bottom-width: 1.5px; border-left-width: 1.5px; }
        .lock__corner--br { bottom: 0; right: 0; border-bottom-width: 1.5px; border-right-width: 1.5px; }
        .lock__label {
          margin-top: 120px;
          font-family: var(--font-jetbrains-mono), monospace;
          font-size: 0.7rem;
          letter-spacing: 0.3em;
          margin-right: -0.3em;
          text-transform: uppercase;
          color: var(--text-accent, #4fc3f7);
          opacity: 0;
          animation: lock-label 0.4s 0.5s ease forwards, lock-blink 1.2s 0.9s steps(2) infinite;
        }
        @keyframes lock-in {
          0% { transform: scale(1.9) rotate(45deg); opacity: 0; }
          60% { opacity: 1; }
          100% { transform: scale(1) rotate(0deg); opacity: 1; }
        }
        @keyframes lock-label {
          to { opacity: 0.85; }
        }
        @keyframes lock-blink {
          50% { opacity: 0.35; }
        }
        @media (prefers-reduced-motion: reduce) {
          .lock__frame { animation: none; }
          .lock__label { animation: none; opacity: 0.85; }
        }
      ` }} />
    </div>
  );
}

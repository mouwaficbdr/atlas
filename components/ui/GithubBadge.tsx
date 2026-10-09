'use client';

const REPO_URL = 'https://github.com/mouwaficbdr/atlas';

/**
 * Lien vers le code source, dans le même langage d'annotation que l'étoile
 * de recherche : un symbole discret dans un fin anneau doré (la teinte des
 * frontières), parcouru par un satellite, qui ne se nomme qu'au survol.
 * Zone d'interaction de 44 px, curseur normal : rien d'envahissant.
 */
export default function GithubBadge() {
  return (
    <>
      <a
        className="source"
        href={REPO_URL}
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Code source d'atlas sur GitHub (nouvel onglet)"
      >
        <span className="source__mark" aria-hidden="true">
          <svg className="source__ring" viewBox="0 0 36 36" width="36" height="36">
            <circle cx="18" cy="18" r="16" />
            <g className="source__orbit">
              <circle cx="18" cy="2" r="1.4" />
            </g>
          </svg>
          <svg className="source__logo" viewBox="0 0 16 16" width="14" height="14" fill="currentColor">
            <path d="M8 0c4.42 0 8 3.58 8 8a8.013 8.013 0 0 1-5.45 7.59c-.4.08-.55-.17-.55-.38 0-.27-.01-1.13-.01-2.2 0-.75-.25-1.23-.54-1.48 1.78-.2 3.65-.88 3.65-3.95 0-.88-.31-1.59-.82-2.15.08-.2.36-1.02-.08-2.12 0 0-.67-.22-2.2.82-.64-.18-1.32-.27-2-.27-.68 0-1.36.09-2 .27-1.53-1.03-2.2-.82-2.2-.82-.44 1.1-.16 1.92-.08 2.12-.51.56-.82 1.28-.82 2.15 0 3.06 1.86 3.75 3.64 3.95-.23.2-.44.55-.51 1.07-.46.21-1.61.55-2.33-.66-.15-.24-.6-.83-1.23-.82-.67.01-.27.38.01.53.34.19.73.9.82 1.13.16.45.68 1.31 2.69.94 0 .67.01 1.3.01 1.49 0 .21-.15.45-.55.38A7.995 7.995 0 0 1 0 8c0-4.42 3.58-8 8-8Z" />
          </svg>
        </span>
        <span className="source__tag" aria-hidden="true">
          <span className="source__leader" />
          Code source
        </span>
      </a>

      <style dangerouslySetInnerHTML={{ __html: `
        .source {
          position: fixed;
          left: 26px;
          bottom: 26px;
          z-index: 1000;
          display: flex;
          align-items: center;
          text-decoration: none;
          color: rgba(225, 233, 255, 0.55);
          transition: color 0.3s var(--ease-ui, ease);
        }
        .source:hover,
        .source:focus-visible {
          color: rgba(240, 245, 255, 0.95);
          outline: none;
        }
        .source:focus-visible .source__mark {
          outline: 1px solid rgba(79, 195, 247, 0.7);
          outline-offset: 4px;
          border-radius: 50%;
        }
        .source__mark {
          width: 44px;
          height: 44px;
          display: grid;
          place-items: center;
        }
        .source__mark > svg {
          grid-area: 1 / 1;
        }
        .source__ring circle:first-child {
          fill: none;
          stroke: rgba(212, 175, 55, 0.32);
          stroke-width: 0.75;
          transition: stroke 0.3s var(--ease-ui, ease);
        }
        .source:hover .source__ring circle:first-child,
        .source:focus-visible .source__ring circle:first-child {
          stroke: rgba(212, 175, 55, 0.7);
        }
        .source__orbit {
          transform-origin: 18px 18px;
          animation: source-orbit 38s linear infinite;
        }
        .source__orbit circle {
          fill: #e8d08a;
        }
        .source:hover .source__orbit,
        .source:focus-visible .source__orbit {
          animation-duration: 6s;
        }
        .source__tag {
          display: flex;
          align-items: center;
          gap: 10px;
          margin-left: 2px;
          white-space: nowrap;
          font-family: var(--font-jetbrains-mono), monospace;
          font-size: 0.64rem;
          letter-spacing: 0.22em;
          text-transform: uppercase;
          opacity: 0;
          transform: translateX(-6px);
          pointer-events: none;
          transition: opacity 0.35s var(--ease-ui, ease), transform 0.45s var(--ease-signature, ease);
        }
        .source__leader {
          width: 22px;
          height: 1px;
          background: linear-gradient(90deg, rgba(225, 233, 255, 0.6), transparent);
        }
        .source:hover .source__tag,
        .source:focus-visible .source__tag {
          opacity: 1;
          transform: translateX(0);
        }
        @keyframes source-orbit {
          to { transform: rotate(360deg); }
        }
        @media (prefers-reduced-motion: reduce) {
          .source__orbit { animation: none; }
          .source__tag { transition: opacity 0.2s ease; transform: none; }
        }
      ` }} />
    </>
  );
}

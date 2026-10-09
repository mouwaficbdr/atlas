'use client';

import { useId, useState } from 'react';

interface WikiExtractProps {
  wikiSummary: string;
}

const COLLAPSED_CHARS = 420;

/** Chapô encyclopédique du relevé : résumé Wikipédia, dépliable s'il est long. */
export default function WikiExtract({ wikiSummary }: WikiExtractProps) {
  const [expanded, setExpanded] = useState(false);
  const id = useId();
  const isLong = wikiSummary.length > COLLAPSED_CHARS;

  return (
    <div className="wiki">
      <span className="cp-label">Extrait · Wikipédia</span>
      <p id={id} className="wiki__text" data-collapsed={isLong && !expanded}>
        {wikiSummary}
      </p>
      {isLong && (
        <button type="button" className="wiki__toggle" aria-expanded={expanded} aria-controls={id} onClick={() => setExpanded((v) => !v)}>
          {expanded ? 'Réduire' : 'Lire la suite'}
        </button>
      )}
      <style dangerouslySetInnerHTML={{ __html: `
        .wiki__text {
          font-size: clamp(1rem, 1.25vw, 1.12rem);
          line-height: 1.75;
          color: rgba(240, 240, 240, 0.88);
          max-width: 38rem;
        }
        .wiki__text[data-collapsed='true'] {
          max-height: 11.5em;
          overflow: hidden;
          -webkit-mask-image: linear-gradient(to bottom, #000 55%, transparent);
          mask-image: linear-gradient(to bottom, #000 55%, transparent);
        }
        .wiki__toggle {
          margin-top: 0.8rem;
          min-height: 44px;
          background: none;
          border: none;
          padding: 0;
          color: var(--text-primary);
          font-family: var(--font-jetbrains-mono), monospace;
          font-size: 0.68rem;
          letter-spacing: 0.14em;
          text-transform: uppercase;
          text-decoration: underline;
          text-underline-offset: 5px;
          text-decoration-color: var(--country-primary, #4fc3f7);
          cursor: pointer;
        }
      ` }} />
    </div>
  );
}

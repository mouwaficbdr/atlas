'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import type { CountryData } from '@/lib/types';
import { useInView } from '@/lib/hooks/useInView';

interface CountryFooterProps {
  current: CountryData;
  allCountries: CountryData[];
}

/**
 * Fin de fiche pays : archétype large-type. Le retour au globe est le geste
 * principal, en display ; un pays au hasard prolonge l'exploration ; la
 * signature ferme la page.
 */
export default function CountryFooter({ current, allCountries }: CountryFooterProps) {
  const { ref, inView } = useInView<HTMLElement>({ rootMargin: '-12%' });
  const [random, setRandom] = useState<CountryData | null>(null);

  useEffect(() => {
    const pool = allCountries.filter((c) => c.cca3 !== current.cca3);
    if (pool.length === 0) return;
    setRandom(pool[Math.floor(Math.random() * pool.length)]);
  }, [allCountries, current.cca3]);

  return (
    <footer
      ref={ref}
      className={`country-footer${inView ? ' country-footer--in' : ''}`}
    >
      <span className="country-footer__kicker">
        {current.cca3} &middot; fin de fiche
      </span>

      <Link href="/" className="country-footer__home">
        <span className="country-footer__arrow" aria-hidden="true">
          &larr;
        </span>
        <span>Retour au globe</span>
      </Link>

      <Link
        href={random ? `/pays/${random.cca3.toLowerCase()}` : '/'}
        className="country-footer__next"
      >
        Continuer l&apos;exploration
        <span className="country-footer__next-name">
          {random ? ` · ${random.nameFr}` : ''}
        </span>
        <span aria-hidden="true"> &rarr;</span>
      </Link>

      <span className="country-footer__sign">
        ATLAS&#176; &middot; BADAROU Mouwafic &middot; Licence MIT
      </span>

      <style jsx>{`
        .country-footer {
          border-top: 1px solid rgba(255, 255, 255, 0.1);
          background-color: var(--country-background, #05050a);
          min-height: 80vh;
          display: flex;
          flex-direction: column;
          justify-content: space-between;
          gap: clamp(2.5rem, 9vh, 6rem);
          padding: clamp(3rem, 10vh, 8rem) clamp(1.5rem, 5vw, 5vw);
          opacity: 0;
          transform: translateY(16px);
          transition:
            opacity 0.6s var(--ease-signature, cubic-bezier(0.16, 1, 0.3, 1)),
            transform 0.6s var(--ease-signature, cubic-bezier(0.16, 1, 0.3, 1));
        }
        .country-footer--in {
          opacity: 1;
          transform: translateY(0);
        }
        .country-footer__kicker {
          font-family: var(--font-jetbrains-mono), monospace;
          font-size: 0.75rem;
          letter-spacing: 0.25em;
          text-transform: uppercase;
          color: rgba(240, 240, 240, 0.45);
        }
        .country-footer__home {
          display: flex;
          align-items: baseline;
          gap: clamp(0.75rem, 2vw, 2rem);
          font-family: var(--font-bebas-neue), 'Impact', sans-serif;
          font-size: clamp(3rem, 13vw, 9.5rem);
          line-height: 0.86;
          letter-spacing: 0.02em;
          text-transform: uppercase;
          color: var(--text-primary, #f0f0f0);
          transition: color 0.4s var(--ease-signature, cubic-bezier(0.16, 1, 0.3, 1));
        }
        .country-footer__arrow {
          display: inline-block;
          transition: transform 0.4s var(--ease-signature, cubic-bezier(0.16, 1, 0.3, 1));
        }
        .country-footer__home:hover,
        .country-footer__home:focus-visible {
          color: var(--country-accent, #4fc3f7);
        }
        .country-footer__home:hover .country-footer__arrow,
        .country-footer__home:focus-visible .country-footer__arrow {
          transform: translateX(-0.4em);
        }
        .country-footer__next {
          font-family: var(--font-jetbrains-mono), monospace;
          font-size: clamp(0.85rem, 1.4vw, 1.05rem);
          letter-spacing: 0.12em;
          text-transform: uppercase;
          color: rgba(240, 240, 240, 0.6);
          transition: color 0.3s var(--ease-ui, ease);
        }
        .country-footer__next:hover,
        .country-footer__next:focus-visible {
          color: var(--text-primary, #f0f0f0);
        }
        .country-footer__next-name {
          color: var(--country-accent, #4fc3f7);
        }
        .country-footer__sign {
          font-family: var(--font-jetbrains-mono), monospace;
          font-size: 0.7rem;
          letter-spacing: 0.2em;
          text-transform: uppercase;
          color: rgba(240, 240, 240, 0.4);
        }
        @media (prefers-reduced-motion: reduce) {
          .country-footer {
            opacity: 1;
            transform: none;
          }
        }
      `}</style>
    </footer>
  );
}

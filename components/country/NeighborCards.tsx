'use client';

import { useEffect, useRef } from 'react';
import Link from 'next/link';
import gsap from 'gsap';
import type { CountryData } from '@/lib/types';
import { prefersReducedMotion } from '@/lib/hooks/useReducedMotion';
import { cardinalDirection, initialBearing } from '@/lib/bearing';

interface NeighborCardsProps {
  /** Centroïde du pays consulté, en ordre GeoJSON [lon, lat]. */
  origin: [number, number];
  borders: string[];
  allCountries: CountryData[];
}

/**
 * Grille compacte des voisins : drapeau, nom, et une boussole qui pointe
 * vers le voisin depuis le pays consulté (cap orthodromique entre
 * centroïdes). Reste lisible même pour la Chine et ses 14 voisins.
 */
export default function NeighborCards({ origin, borders, allCountries }: NeighborCardsProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current) return;
    const cards = containerRef.current.querySelectorAll('.nb');

    if (prefersReducedMotion()) {
      gsap.set(cards, { opacity: 1, y: 0 });
      return;
    }

    const tween = gsap.fromTo(
      cards,
      { opacity: 0, y: 12 },
      {
        opacity: 1,
        y: 0,
        stagger: 0.035,
        duration: 0.4,
        ease: 'power2.out',
        scrollTrigger: { trigger: containerRef.current, start: 'top 92%' },
      },
    );

    return () => {
      tween.scrollTrigger?.kill();
      tween.kill();
    };
  }, [borders]);

  if (!borders.length) return <p style={{ color: 'var(--text-muted)' }}>Aucun pays voisin</p>;

  const neighbors = borders
    .map((cca3) => allCountries.find((c) => c.cca3 === cca3))
    .filter(Boolean) as CountryData[];

  return (
    <div ref={containerRef} className="nbs">
      {neighbors.map((country) => {
        const bearing = initialBearing(origin, country.centroid);
        const direction = cardinalDirection(bearing);
        return (
          <Link
            key={country.cca3}
            href={`/pays/${country.cca3.toLowerCase()}`}
            className="nb"
            aria-label={`${country.nameFr}, au ${direction.toLowerCase()}`}
          >
            <span className="nb__heading" aria-hidden="true">
              <svg className="nb__compass" viewBox="0 0 24 24" width="22" height="22">
                <circle cx="12" cy="12" r="10.5" />
                <g style={{ transform: `rotate(${bearing}deg)` }}>
                  <path d="M12 3.5 L14.6 12 L12 10.6 L9.4 12 Z" />
                </g>
              </svg>
              {direction}
            </span>
            <span className="nb__name">{country.nameFr}</span>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img className="nb__flag" src={country.flags.svg} alt="" width={28} height={19} loading="lazy" />
          </Link>
        );
      })}

      <style dangerouslySetInnerHTML={{ __html: `
        .nbs {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(min(100%, 230px), 1fr));
          gap: 1px;
          width: 100%;
          background: rgba(255, 255, 255, 0.08);
          border: 1px solid rgba(255, 255, 255, 0.08);
        }
        .nb {
          position: relative;
          display: flex;
          flex-direction: column;
          gap: 1.1rem;
          min-height: 9.5rem;
          padding: 1.25rem 1.4rem;
          background: var(--bg-surface, #0a0a14);
          color: var(--text-primary);
          text-decoration: none;
          transition: background 0.35s var(--ease-ui, ease), color 0.35s var(--ease-ui, ease);
        }
        .nb:hover,
        .nb:focus-visible {
          background: rgba(255, 255, 255, 0.04);
          color: var(--country-accent, #fff);
          outline: none;
        }
        .nb:focus-visible {
          box-shadow: inset 0 0 0 1px var(--country-accent, #4fc3f7);
        }
        .nb__heading {
          display: flex;
          align-items: center;
          gap: 0.55rem;
          font-family: var(--font-jetbrains-mono), monospace;
          font-size: 0.62rem;
          letter-spacing: 0.2em;
          text-transform: uppercase;
          color: var(--text-muted);
        }
        .nb__compass circle {
          fill: none;
          stroke: rgba(255, 255, 255, 0.18);
          stroke-width: 1;
        }
        .nb__compass g {
          transform-origin: 12px 12px;
          transition: transform 0.6s var(--ease-signature, ease);
        }
        .nb__compass path {
          fill: var(--country-accent, #4fc3f7);
        }
        .nb__name {
          margin-top: auto;
          font-family: var(--font-bebas-neue), sans-serif;
          font-size: clamp(1.7rem, 2.4vw, 2.5rem);
          line-height: 0.95;
          letter-spacing: 0.02em;
          text-transform: uppercase;
        }
        .nb__flag {
          position: absolute;
          top: 1.2rem;
          right: 1.4rem;
          width: 28px;
          height: auto;
          border-radius: 2px;
          opacity: 0.8;
          box-shadow: 0 0 0 1px rgba(255, 255, 255, 0.12);
          transition: opacity 0.35s var(--ease-ui, ease);
        }
        .nb:hover .nb__flag { opacity: 1; }
      ` }} />
    </div>
  );
}

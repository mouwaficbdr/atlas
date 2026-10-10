'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import type { CountryData } from '@/lib/types';
import { useAppStore } from '@/lib/store';
import { disableTilt, enableTilt } from '@/lib/device-tilt';
import { prefersReducedMotion } from '@/lib/hooks/useReducedMotion';

interface MobileHomeDockProps {
  countries: CountryData[];
  onOpenExplorer: (region: string | null) => void;
}

const REGIONS = ['Afrique', 'Amériques', 'Asie', 'Europe', 'Océanie'];
const frCompact = new Intl.NumberFormat('fr-FR', { notation: 'compact', compactDisplay: 'long', maximumFractionDigits: 1 });

/**
 * Tiroir de l'accueil mobile, à portée du pouce. Au repos : localiser un
 * pays, en tirer un au hasard, parcourir un continent. Quand un pays est
 * touché sur le globe (ou choisi dans l'index), son aperçu prend la place :
 * le survol n'existe pas au doigt, l'aperçu en tient lieu avant d'ouvrir la fiche.
 */
export default function MobileHomeDock({ countries, onOpenExplorer }: MobileHomeDockProps) {
  const previewCca3 = useAppStore((state) => state.previewCca3);
  const setPreview = useAppStore((state) => state.setPreviewCca3);
  const setLogbookOpen = useAppStore((state) => state.setLogbookOpen);
  const logbookCount = useAppStore((state) => state.logbook.length);
  const preview = previewCca3 ? countries.find((c) => c.cca3 === previewCca3) : null;

  // Inclinaison du téléphone (#28), en option : iOS demande une autorisation.
  const [tiltSupported, setTiltSupported] = useState(false);
  const [tiltOn, setTiltOn] = useState(false);
  useEffect(() => {
    setTiltSupported(typeof DeviceOrientationEvent !== 'undefined' && !prefersReducedMotion());
    return () => disableTilt();
  }, []);

  const random = () => setPreview(countries[Math.floor(Math.random() * countries.length)].cca3);

  // Hauteur réelle du tiroir (dock ou aperçu), publiée pour que le globe se
  // centre dans l'espace qui reste visible au-dessus (PersistentLayout).
  const rootRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = rootRef.current;
    if (!el) return;
    const root = document.documentElement.style;
    const observer = new ResizeObserver(() => root.setProperty('--dock-h', `${el.offsetHeight}px`));
    observer.observe(el);
    return () => {
      observer.disconnect();
      root.removeProperty('--dock-h');
    };
  }, []);

  return (
    <div ref={rootRef} className="dock" role="region" aria-label={preview ? `Aperçu : ${preview.nameFr}` : 'Explorer'}>
      {preview ? (
        <div className="dock__preview" aria-live="polite">
          <div className="dock__row">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={preview.flags.svg} alt="" width={40} height={27} className="dock__flag" />
            <div className="dock__id">
              <span className="dock__kicker">{preview.subregionFr}</span>
              <span className="dock__name">{preview.nameFr}</span>
            </div>
            <button type="button" className="dock__close" onClick={() => setPreview(null)} aria-label="Fermer l’aperçu">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true">
                <path d="M6 6l12 12M18 6L6 18" />
              </svg>
            </button>
          </div>
          <dl className="dock__facts">
            <div>
              <dt>Capitale</dt>
              <dd>{preview.capitalFr}</dd>
            </div>
            <div>
              <dt>Population</dt>
              <dd>{preview.population < 1e6 ? new Intl.NumberFormat('fr-FR').format(preview.population) : frCompact.format(preview.population)}</dd>
            </div>
          </dl>
          <Link href={`/pays/${preview.cca3.toLowerCase()}`} className="dock__open">
            Ouvrir la fiche
            <span aria-hidden="true">→</span>
          </Link>
        </div>
      ) : (
        <div className="dock__rest">
          <span className="dock__handle" aria-hidden="true" />
          {tiltSupported && (
            <button
              type="button"
              className="dock__tilt"
              aria-pressed={tiltOn}
              onClick={async () => {
                if (tiltOn) {
                  disableTilt();
                  setTiltOn(false);
                } else {
                  setTiltOn(await enableTilt());
                }
              }}
            >
              Inclinaison {tiltOn ? 'activée' : 'désactivée'}
            </button>
          )}
          <button type="button" className="dock__search" onClick={() => onOpenExplorer(null)}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true">
              <circle cx="11" cy="11" r="7" />
              <path d="m20 20-3.5-3.5" />
            </svg>
            Localiser un pays
          </button>
          <div className="dock__chips">
            <Link href="/defi" className="dock__chip dock__chip--accent">
              Défi du jour
            </Link>
            <button type="button" className="dock__chip" onClick={random}>
              Au hasard
            </button>
            {REGIONS.map((region) => (
              <button key={region} type="button" className="dock__chip" onClick={() => onOpenExplorer(region)}>
                {region}
              </button>
            ))}
          </div>
          <div className="dock__foot">
            <button type="button" className="dock__logbook" onClick={() => setLogbookOpen(true)}>
              Carnet · <strong>{logbookCount}</strong> sur {countries.length}
            </button>
            <a href="https://github.com/mouwaficbdr/atlas" target="_blank" rel="noopener noreferrer">
              Code source
            </a>
          </div>
        </div>
      )}

      <style dangerouslySetInnerHTML={{ __html: `
        .dock {
          position: fixed;
          left: 0;
          right: 0;
          bottom: 0;
          z-index: 40;
          padding: 0.7rem 1rem calc(env(safe-area-inset-bottom) + 1rem);
          background: linear-gradient(to bottom, rgba(10, 10, 20, 0.86), rgba(10, 10, 20, 0.97));
          backdrop-filter: blur(14px);
          border-top: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 18px 18px 0 0;
          color: var(--text-primary);
          animation: dock-in 0.5s var(--ease-signature);
        }
        @keyframes dock-in { from { transform: translateY(100%); } }
        .dock__handle { display: block; width: 36px; height: 4px; margin: 0 auto 0.8rem; border-radius: 2px; background: rgba(255, 255, 255, 0.2); }
        .dock__tilt { position: absolute; top: 0.55rem; right: 1rem; padding: 0.3rem 0; font-family: var(--font-jetbrains-mono), monospace; font-size: 0.62rem; letter-spacing: 0.1em; text-transform: uppercase; color: #8d95a3; background: none; border: 0; }
        .dock__tilt[aria-pressed='true'] { color: var(--text-accent); }
        .dock__search {
          display: flex;
          align-items: center;
          gap: 0.7rem;
          width: 100%;
          min-height: 48px;
          padding: 0 1rem;
          background: rgba(255, 255, 255, 0.06);
          border: 1px solid rgba(255, 255, 255, 0.12);
          border-radius: 12px;
          color: rgba(240, 240, 240, 0.75);
          font: inherit;
          font-size: 1rem;
          text-align: left;
        }
        .dock__chips {
          display: flex;
          gap: 0.5rem;
          margin: 0.8rem -1rem 0;
          padding: 0 1rem;
          overflow-x: auto;
          scrollbar-width: none;
        }
        .dock__chips::-webkit-scrollbar { display: none; }
        .dock__chip {
          flex-shrink: 0;
          min-height: 40px;
          padding: 0 1rem;
          background: none;
          border: 1px solid rgba(255, 255, 255, 0.14);
          border-radius: 99px;
          color: var(--text-primary);
          font-family: var(--font-jetbrains-mono), monospace;
          font-size: 0.68rem;
          letter-spacing: 0.1em;
          text-transform: uppercase;
        }
        a.dock__chip { display: inline-flex; align-items: center; text-decoration: none; }
        .dock__chip--accent { border-color: var(--text-accent); color: var(--text-accent); }
        .dock__foot {
          display: flex;
          justify-content: space-between;
          margin-top: 0.9rem;
          font-family: var(--font-jetbrains-mono), monospace;
          font-size: 0.68rem;
          letter-spacing: 0.1em;
          text-transform: uppercase;
          color: #8d95a3;
        }
        .dock__foot a { text-decoration: underline; text-underline-offset: 3px; }
        .dock__logbook { padding: 0; background: none; border: 0; font: inherit; letter-spacing: inherit; color: inherit; text-transform: inherit; cursor: pointer; }
        .dock__logbook strong { font-weight: 400; color: #ffd27a; }
        .dock__row { display: flex; align-items: center; gap: 0.9rem; }
        .dock__flag { border-radius: 3px; box-shadow: 0 0 0 1px rgba(255, 255, 255, 0.15); }
        .dock__id { display: flex; flex-direction: column; flex: 1; min-width: 0; }
        .dock__kicker { font-family: var(--font-jetbrains-mono), monospace; font-size: 0.68rem; letter-spacing: 0.14em; text-transform: uppercase; color: #8d95a3; }
        .dock__name { font-family: var(--font-bebas-neue), sans-serif; font-size: 2rem; line-height: 1; letter-spacing: 0.02em; overflow-wrap: anywhere; }
        .dock__close { width: 44px; height: 44px; display: grid; place-items: center; background: none; border: 1px solid rgba(255, 255, 255, 0.14); border-radius: 50%; color: var(--text-primary); }
        .dock__facts { display: grid; grid-template-columns: 1fr 1fr; gap: 0.8rem; margin: 1rem 0; }
        .dock__facts dt { font-family: var(--font-jetbrains-mono), monospace; font-size: 0.66rem; letter-spacing: 0.14em; text-transform: uppercase; color: #8d95a3; }
        .dock__facts dd { margin: 0.25rem 0 0; font-size: 1.05rem; }
        .dock__open {
          display: flex;
          justify-content: space-between;
          align-items: center;
          min-height: 52px;
          padding: 0 1.2rem;
          border-radius: 12px;
          background: var(--text-primary);
          color: #0a0a14;
          font-family: var(--font-jetbrains-mono), monospace;
          font-size: 0.75rem;
          letter-spacing: 0.14em;
          text-transform: uppercase;
        }
        @media (prefers-reduced-motion: reduce) { .dock { animation: none; } }
      ` }} />
    </div>
  );
}

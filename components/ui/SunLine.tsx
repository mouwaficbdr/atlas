'use client';

import { useEffect, useState } from 'react';
import type { CountryData } from '@/lib/types';
import { useAppStore } from '@/lib/store';
import { useRouter } from 'next/navigation';
import { nightCount, phaseOf, sunriseCountry } from '@/lib/solar-now';

const utcClock = new Intl.DateTimeFormat('fr-FR', { hour: '2-digit', minute: '2-digit', timeZone: 'UTC' });
const hm = (s: string) => s.replace(':', ' h ');

/**
 * Le vrai soleil, dit en une ligne : l'heure UTC et le nombre de pays dans
 * la nuit. Au survol d'un pays posé sur le terminateur (aube, crépuscule),
 * la ligne s'allume et le nomme avec son heure locale. Dessous, le pays où
 * le soleil se lève en ce moment : un clic y tourne le globe, un second
 * ouvre sa fiche.
 */
export default function SunLine({ countries }: { countries: CountryData[] }) {
  const introDone = useAppStore((s) => s.introPhase === 'done');
  const hovered = useAppStore((s) => s.hoveredCountryCca3);
  const previewCca3 = useAppStore((s) => s.previewCca3);
  const setPreviewCca3 = useAppStore((s) => s.setPreviewCca3);
  const router = useRouter();
  const [now, setNow] = useState<Date | null>(null);

  useEffect(() => {
    setNow(new Date());
    const id = setInterval(() => setNow(new Date()), 30_000);
    return () => clearInterval(id);
  }, []);

  if (!now || !introDone) return null;

  const country = hovered ? countries.find((c) => c.cca3 === hovered) : undefined;
  const phase = country && phaseOf(country, now);
  const onTerminator = phase === 'aube' || phase === 'crépuscule';
  const night = nightCount(countries, now);
  const sunrise = sunriseCountry(countries, now);

  return (
    <div className="sunline">
      <p className="sunline__now" data-lit={onTerminator} aria-live="polite">
        {onTerminator && country ? (
          <>
            {country.nameFr} · {phase} ·{' '}
            {hm(
              new Intl.DateTimeFormat('fr-FR', { hour: '2-digit', minute: '2-digit', timeZone: country.primaryTimezone }).format(now),
            )}{' '}
            heure locale
          </>
        ) : (
          <>
            {hm(utcClock.format(now))} UTC · il fait nuit dans {night} des {countries.length} pays
          </>
        )}
      </p>
      {sunrise && (
        <button
          type="button"
          className="sunline__rise"
          onClick={() =>
            previewCca3 === sunrise.cca3
              ? router.push(`/pays/${sunrise.cca3.toLowerCase()}`)
              : setPreviewCca3(sunrise.cca3)
          }
        >
          Lever du soleil en ce moment · <strong>{sunrise.nameFr}</strong>{' '}
          <span aria-hidden="true">{previewCca3 === sunrise.cca3 ? '↗' : '→'}</span>
        </button>
      )}
      <style dangerouslySetInnerHTML={{ __html: `
        .sunline {
          position: fixed;
          left: 2.2rem;
          top: 2.2rem;
          z-index: 20;
          margin: 0;
          font-family: var(--font-jetbrains-mono), monospace;
          font-size: 0.72rem;
          letter-spacing: 0.12em;
          white-space: nowrap;
          color: var(--text-muted, #8d95a3);
          display: grid;
          justify-items: start;
          gap: 0.5rem;
          animation: sunline-in 1.2s var(--ease-ui, ease) both;
                  }
        .sunline__now { margin: 0; pointer-events: none; transition: color 0.4s; }
        .sunline__now[data-lit='true'] { color: #ffd27a; }
        .sunline__rise {
          padding: 0;
          background: none;
          border: 0;
          font: inherit;
          letter-spacing: inherit;
          color: inherit;
          cursor: pointer;
          transition: color 0.3s;
        }
        .sunline__rise strong { font-weight: 400; color: #ffd27a; }
        .sunline__rise:hover, .sunline__rise:focus-visible { color: var(--text-primary, #f0f0f0); outline: none; }
        .sunline__rise:focus-visible strong { text-decoration: underline; }
        @keyframes sunline-in { from { opacity: 0; transform: translateY(-6px); } }
        @media (prefers-reduced-motion: reduce) { .sunline { animation: none; } }
      ` }} />
    </div>
  );
}

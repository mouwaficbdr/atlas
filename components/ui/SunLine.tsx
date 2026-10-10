'use client';

import { useEffect, useState } from 'react';
import type { CountryData } from '@/lib/types';
import { useAppStore } from '@/lib/store';
import { nightCount, phaseOf } from '@/lib/solar-now';

const utcClock = new Intl.DateTimeFormat('fr-FR', { hour: '2-digit', minute: '2-digit', timeZone: 'UTC' });
const hm = (s: string) => s.replace(':', ' h ');

/**
 * Le vrai soleil, dit en une ligne : l'heure UTC et le nombre de pays dans
 * la nuit. Au survol d'un pays posé sur le terminateur (aube, crépuscule),
 * la ligne s'allume et le nomme avec son heure locale.
 */
export default function SunLine({ countries }: { countries: CountryData[] }) {
  const introDone = useAppStore((s) => s.introPhase === 'done');
  const hovered = useAppStore((s) => s.hoveredCountryCca3);
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

  return (
    <p className="sunline" data-lit={onTerminator} aria-live="polite">
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
          opacity: 0.7;
          pointer-events: none;
          animation: sunline-in 1.2s var(--ease-ui, ease) both;
          transition: color 0.4s, opacity 0.4s;
        }
        .sunline[data-lit='true'] { color: #ffd27a; opacity: 1; }
        @keyframes sunline-in { from { opacity: 0; transform: translateY(-6px); } }
        @media (prefers-reduced-motion: reduce) { .sunline { animation: none; } }
      ` }} />
    </p>
  );
}

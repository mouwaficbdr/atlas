'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import type { CountryData } from '@/lib/types';
import type { DaylightPhase } from '@/lib/solar';
import { useAppStore } from '@/lib/store';
import { nightCount, phaseOf, sunriseCountry } from '@/lib/solar-now';
import { saveHome } from '@/lib/home-country';

const utcClock = new Intl.DateTimeFormat('fr-FR', { hour: '2-digit', minute: '2-digit', timeZone: 'UTC' });
const hm = (s: string) => s.replace(':', ' h ');
const localTime = (date: Date, timeZone: string) =>
  hm(new Intl.DateTimeFormat('fr-FR', { hour: '2-digit', minute: '2-digit', timeZone }).format(date));
const PHASE_TEXT: Record<DaylightPhase, string> = {
  jour: 'il fait jour',
  aube: 'le jour se lève',
  crépuscule: 'le soleil se couche',
  nuit: 'il fait nuit',
};

/**
 * Le vrai soleil, dit en quelques lignes : l'heure UTC et le nombre de pays
 * dans la nuit (au survol d'un pays posé sur le terminateur, la ligne
 * s'allume et le nomme avec son heure locale) ; le pays de l'utilisateur,
 * d'où vient cette déduction et de quoi la changer ; le pays où le soleil se
 * lève en ce moment, qu'un clic amène face à soi et qu'un second ouvre.
 */
export default function SunLine({ countries }: { countries: CountryData[] }) {
  const router = useRouter();
  const introDone = useAppStore((s) => s.introPhase === 'done');
  const hovered = useAppStore((s) => s.hoveredCountryCca3);
  const previewCca3 = useAppStore((s) => s.previewCca3);
  const setPreviewCca3 = useAppStore((s) => s.setPreviewCca3);
  const home = useAppStore((s) => s.home);
  const setHome = useAppStore((s) => s.setHome);
  const [picking, setPicking] = useState(false);
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
  const sunrise = sunriseCountry(countries, now);
  const mine = home ? countries.find((c) => c.cca3 === home.cca3) : undefined;

  const pick = (cca3: string) => {
    saveHome(cca3 || null);
    setHome(cca3 ? { cca3, source: 'choix' } : null);
    setPicking(false);
    if (cca3) setPreviewCca3(cca3);
  };

  return (
    <div className="sunline">
      <p className="sunline__now" data-lit={onTerminator} aria-live="polite">
        {onTerminator && country
          ? `${country.nameFr} · ${phase} · ${localTime(now, country.primaryTimezone)} heure locale`
          : `${hm(utcClock.format(now))} UTC · il fait nuit dans ${nightCount(countries, now)} des ${countries.length} pays`}
      </p>

      {mine && (
        <p className="sunline__home">
          Vous êtes ici · <strong>{mine.nameFr}</strong> · {localTime(now, mine.primaryTimezone)} ·{' '}
          {PHASE_TEXT[phaseOf(mine, now)]}
        </p>
      )}
      <p className="sunline__source">
        {mine ? (home?.source === 'fuseau' ? 'D’après le fuseau horaire de votre appareil' : 'Pays choisi') : 'Aucun pays de départ'}
        {' · '}
        {picking ? (
          <select
            className="sunline__select"
            autoFocus
            aria-label="Votre pays"
            defaultValue={mine?.cca3 ?? ''}
            onChange={(e) => pick(e.target.value)}
            onBlur={() => setPicking(false)}
          >
            <option value="">Aucun pays</option>
            {[...countries]
              .sort((a, b) => a.nameFr.localeCompare(b.nameFr, 'fr'))
              .map((c) => (
                <option key={c.cca3} value={c.cca3}>
                  {c.nameFr}
                </option>
              ))}
          </select>
        ) : (
          <button type="button" className="sunline__link" onClick={() => setPicking(true)}>
            {mine ? 'changer' : 'choisir'}
          </button>
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
          display: grid;
          justify-items: start;
          gap: 0.4rem;
          font-family: var(--font-jetbrains-mono), monospace;
          font-size: 0.72rem;
          letter-spacing: 0.12em;
          white-space: nowrap;
          color: var(--text-muted, #8d95a3);
          animation: sunline-in 1.2s var(--ease-ui, ease) both;
        }
        .sunline p { margin: 0; }
        .sunline__now { pointer-events: none; transition: color 0.4s; }
        .sunline__now[data-lit='true'] { color: #ffd27a; }
        .sunline strong { font-weight: 400; color: #ffd27a; }
        .sunline__home { margin-top: 0.5rem !important; color: var(--text-primary, #f0f0f0); }
        .sunline__source { font-size: 0.66rem; opacity: 0.8; }
        .sunline button { padding: 0; background: none; border: 0; font: inherit; letter-spacing: inherit; color: inherit; cursor: pointer; transition: color 0.3s; }
        .sunline__link { text-decoration: underline; text-underline-offset: 0.2em; }
        .sunline button:hover, .sunline button:focus-visible { color: var(--text-primary, #f0f0f0); }
        .sunline__rise { margin-top: 0.5rem; }
        .sunline__select { font: inherit; letter-spacing: 0; color: var(--text-primary, #f0f0f0); background: #0a0a14; border: 1px solid rgba(255, 255, 255, 0.2); padding: 0.15rem 0.3rem; }
        @keyframes sunline-in { from { opacity: 0; transform: translateY(-6px); } }
        @media (prefers-reduced-motion: reduce) { .sunline { animation: none; } }
      ` }} />
    </div>
  );
}

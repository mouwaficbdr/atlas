'use client';

import { useEffect, useState } from 'react';
import { daylightPhase, solarElevation, solarSide, sunTimes } from '@/lib/solar';

interface CapitalSkyProps {
  timezone: string;
  /** Capitale, ordre GeoJSON [lon, lat]. */
  lonLat: [number, number];
}

const PHASE_COLOR = { jour: '#ffd36e', aube: '#f6a96b', crépuscule: '#e98b6d', nuit: '#8fa8ff' } as const;

function clock(date: Date, timeZone: string, seconds = false) {
  return new Intl.DateTimeFormat('fr-FR', {
    timeZone,
    hour: '2-digit',
    minute: '2-digit',
    ...(seconds ? { second: '2-digit' } : {}),
    hourCycle: 'h23',
  }).format(date);
}

/** Minutes écoulées depuis minuit, à l'heure locale de `timeZone`. */
function localMinutes(date: Date, timeZone: string) {
  const [h, m] = clock(date, timeZone).split(':').map(Number);
  return h * 60 + m;
}

function zoneName(date: Date, timeZone: string) {
  const part = new Intl.DateTimeFormat('fr-FR', { timeZone, timeZoneName: 'long' })
    .formatToParts(date)
    .find((p) => p.type === 'timeZoneName');
  return part?.value ?? timeZone;
}

/**
 * Heure de la capitale et vrai ciel au-dessus d'elle : jour, aube,
 * crépuscule ou nuit selon la hauteur réelle du soleil, lever et coucher du
 * jour, sur une règle de 24 h. Même soleil que celui qui éclaire le globe.
 */
export default function CapitalSky({ timezone, lonLat }: CapitalSkyProps) {
  const [now, setNow] = useState<Date | null>(null);

  useEffect(() => {
    setNow(new Date());
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);

  // Rendu serveur et premier rendu client identiques : l'heure arrive au montage.
  if (!now) {
    return <p className="cp-display cp-big" aria-hidden="true">--:--:--</p>;
  }

  const [lon, lat] = lonLat;
  const phase = daylightPhase(solarElevation(now, lon, lat), solarSide(now, lon));
  const { sunrise, sunset, polar } = sunTimes(now, lon, lat);
  const rise = sunrise ? localMinutes(sunrise, timezone) : 0;
  const set = sunset ? localMinutes(sunset, timezone) : 0;
  const pct = (min: number) => `${(min / 1440) * 100}%`;

  return (
    <div>
      <p className="cp-display cp-big" style={{ fontVariantNumeric: 'tabular-nums' }}>
        <time dateTime={now.toISOString()}>{clock(now, timezone, true)}</time>
      </p>
      <p style={{ marginTop: '1rem', display: 'flex', flexWrap: 'wrap', gap: '0.8rem', alignItems: 'center' }}>
        <span className="cp-phase" style={{ color: PHASE_COLOR[phase] }}>
          <i aria-hidden="true" />
          {phase.charAt(0).toUpperCase() + phase.slice(1)}
        </span>
        <span className="cp-note">
          {polar === 'day' && 'Jour polaire : le soleil ne se couche pas.'}
          {polar === 'night' && 'Nuit polaire : le soleil ne se lève pas.'}
          {!polar && sunrise && sunset && `Lever ${clock(sunrise, timezone)} · coucher ${clock(sunset, timezone)}`}
        </span>
      </p>

      <div className="cp-day" aria-hidden="true">
        {polar === 'day' && <span className="cp-day__light" style={{ left: 0, right: 0 }} />}
        {!polar && sunrise && sunset && (
          set > rise ? (
            <span className="cp-day__light" style={{ left: pct(rise), width: pct(set - rise) }} />
          ) : (
            <>
              <span className="cp-day__light" style={{ left: 0, width: pct(set) }} />
              <span className="cp-day__light" style={{ left: pct(rise), right: 0 }} />
            </>
          )
        )}
        <span className="cp-day__now" style={{ left: pct(localMinutes(now, timezone)) }} />
      </div>
      <div className="cp-day__scale cp-note" aria-hidden="true">
        <span>00 h</span>
        <span>06 h</span>
        <span>12 h</span>
        <span>18 h</span>
        <span>24 h</span>
      </div>
      <p className="cp-note" style={{ marginTop: '1rem' }}>{zoneName(now, timezone)}</p>
    </div>
  );
}

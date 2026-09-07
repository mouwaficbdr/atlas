'use client';

import { useEffect, useState } from 'react';

const SunIcon = ({ size = '1em', strokeWidth = 1 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="4" />
    <path d="M12 2v2" /><path d="M12 20v2" />
    <path d="m4.93 4.93 1.41 1.41" /><path d="m17.66 17.66 1.41 1.41" />
    <path d="M2 12h2" /><path d="M20 12h2" />
    <path d="m6.34 17.66-1.41 1.41" /><path d="m19.07 4.93-1.41 1.41" />
  </svg>
);

const MoonIcon = ({ size = '1em', strokeWidth = 1 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z" />
  </svg>
);

interface CapitalClockProps {
  /** Nom de la capitale, déjà en français. */
  capital: string;
  /** Fuseau IANA, ex. "Europe/Paris". Gère l'heure d'été via Intl. */
  timezone: string;
}

function partsFor(timezone: string) {
  try {
    const fmt = new Intl.DateTimeFormat('fr-FR', {
      timeZone: timezone || 'UTC',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false,
    });
    const parts = fmt.formatToParts(new Date());
    const get = (t: string) => parts.find((p) => p.type === t)?.value ?? '00';
    const hh = get('hour');
    return { text: `${hh}:${get('minute')}:${get('second')}`, hour: parseInt(hh, 10) };
  } catch {
    return { text: '--:--:--', hour: 12 };
  }
}

export default function CapitalClock({ capital, timezone }: CapitalClockProps) {
  const [mounted, setMounted] = useState(false);
  const [clock, setClock] = useState(() => partsFor(timezone));

  useEffect(() => {
    setMounted(true);
    const update = () => setClock(partsFor(timezone));
    update();
    const interval = setInterval(update, 1000);
    return () => clearInterval(interval);
  }, [timezone]);

  const isDay = clock.hour >= 6 && clock.hour < 20;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: '0' }}>
      <div style={{ color: 'var(--text-primary)', fontFamily: 'var(--font-bebas-neue), sans-serif', fontSize: 'clamp(3rem, 5vw, 6rem)', lineHeight: 0.9, textTransform: 'uppercase', letterSpacing: '0.02em' }}>
        {capital || '—'}
      </div>
      <div style={{ fontFamily: 'var(--font-jetbrains-mono), monospace', color: 'var(--country-accent, #fff)', fontSize: 'clamp(2rem, 3vw, 4rem)', fontWeight: 100, display: 'flex', alignItems: 'center', gap: '1.5rem', marginTop: '1rem' }}>
        <span style={{ opacity: 0.5, display: 'flex', alignItems: 'center' }}>
          {isDay ? <SunIcon size="1em" strokeWidth={1} /> : <MoonIcon size="1em" strokeWidth={1} />}
        </span>
        {mounted ? clock.text : '--:--:--'}
      </div>
      <div style={{ color: 'var(--text-muted)', fontSize: '1rem', textTransform: 'uppercase', letterSpacing: '0.2em', marginTop: '0.5rem' }}>{timezone}</div>
    </div>
  );
}

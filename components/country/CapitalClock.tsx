'use client';

import { useEffect, useState } from 'react';

interface CapitalClockProps {
  capital: string[];
  timezones: string[];
}

function getLocalTime(timezone: string): Date {
  try {
    const str = new Date().toLocaleString('en-US', { timeZone: timezone });
    return new Date(str);
  } catch {
    return new Date();
  }
}

export default function CapitalClock({ capital, timezones }: CapitalClockProps) {
  const timezone = timezones?.[0] ?? 'UTC';
  const [time, setTime] = useState<Date>(() => getLocalTime(timezone));

  useEffect(() => {
    const update = () => setTime(getLocalTime(timezone));
    update();
    const interval = setInterval(update, 1000);
    return () => clearInterval(interval);
  }, [timezone]);

  const hours = time.getHours();
  const isDay = hours >= 6 && hours < 20;

  const timeStr = time.toLocaleTimeString('fr-FR', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: '0' }}>
      <div style={{ color: 'var(--text-primary)', fontFamily: 'var(--font-bebas-neue), sans-serif', fontSize: 'clamp(3rem, 5vw, 6rem)', lineHeight: 0.9, textTransform: 'uppercase', letterSpacing: '0.02em' }}>
        {capital?.[0] ?? '—'}
      </div>
      <div style={{ fontFamily: 'var(--font-jetbrains-mono), monospace', color: 'var(--country-accent, #fff)', fontSize: 'clamp(2rem, 3vw, 4rem)', fontWeight: 100, display: 'flex', alignItems: 'center', gap: '1rem', marginTop: '1rem' }}>
        <span style={{ opacity: 0.5 }}>{isDay ? '☀️' : '🌙'}</span> {timeStr}
      </div>
      <div style={{ color: 'var(--text-muted)', fontSize: '1rem', textTransform: 'uppercase', letterSpacing: '0.2em', marginTop: '0.5rem' }}>{timezone}</div>
    </div>
  );
}

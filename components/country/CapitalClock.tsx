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
  const timezone = timezones[0] ?? 'UTC';
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
    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
      <span style={{ fontSize: '1.5rem' }}>{isDay ? '☀️' : '🌙'}</span>
      <div>
        <div style={{ color: 'var(--text-primary)', fontWeight: 600 }}>
          {capital[0] ?? '—'}
        </div>
        <div style={{ fontFamily: 'JetBrains Mono, monospace', color: 'var(--text-accent)', fontSize: '1.1rem' }}>
          {timeStr}
        </div>
        <div style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>{timezone}</div>
      </div>
    </div>
  );
}

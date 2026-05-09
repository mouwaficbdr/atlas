'use client';

import { useEffect, useState } from 'react';
import { Sun, Moon } from 'lucide-react';

interface CapitalClockProps {
  capital: string[];
  timezones: string[];
}

function getLocalTime(timezone: string): Date {
  const now = new Date();
  
  // Format standard REST Countries : UTC+01:00 ou UTC-04:00
  const match = timezone.match(/UTC([+-])(\d{2}):(\d{2})/);
  if (match) {
    const sign = match[1] === '+' ? 1 : -1;
    const hours = parseInt(match[2], 10);
    const minutes = parseInt(match[3], 10);
    const offsetMinutes = sign * (hours * 60 + minutes);
    
    // On décale le timestamp réel pour que sa lecture en UTC corresponde à l'heure locale visée
    return new Date(now.getTime() + offsetMinutes * 60000);
  }
  
  return now;
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

  // Comme on a shifté le timestamp pour qu'il soit lu en UTC, on utilise getUTCHours
  const hours = time.getUTCHours();
  const isDay = hours >= 6 && hours < 20;

  const timeStr = time.toLocaleTimeString('fr-FR', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    timeZone: 'UTC',
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: '0' }}>
      <div style={{ color: 'var(--text-primary)', fontFamily: 'var(--font-bebas-neue), sans-serif', fontSize: 'clamp(3rem, 5vw, 6rem)', lineHeight: 0.9, textTransform: 'uppercase', letterSpacing: '0.02em' }}>
        {capital?.[0] ?? '—'}
      </div>
      <div style={{ fontFamily: 'var(--font-jetbrains-mono), monospace', color: 'var(--country-accent, #fff)', fontSize: 'clamp(2rem, 3vw, 4rem)', fontWeight: 100, display: 'flex', alignItems: 'center', gap: '1.5rem', marginTop: '1rem' }}>
        <span style={{ opacity: 0.5, display: 'flex', alignItems: 'center' }}>
          {isDay ? <Sun size="1em" strokeWidth={1} /> : <Moon size="1em" strokeWidth={1} />}
        </span> 
        {timeStr}
      </div>
      <div style={{ color: 'var(--text-muted)', fontSize: '1rem', textTransform: 'uppercase', letterSpacing: '0.2em', marginTop: '0.5rem' }}>{timezone}</div>
    </div>
  );
}

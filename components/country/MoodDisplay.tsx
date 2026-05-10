'use client';

import { resolveMood } from '@/lib/mood-resolver';
import type { CountryData } from '@/lib/types';

const SunIcon = ({ size = 200, strokeWidth = 1 }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth={strokeWidth}
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <circle cx="12" cy="12" r="4" />
    <path d="M12 2v2" />
    <path d="M12 20v2" />
    <path d="m4.93 4.93 1.41 1.41" />
    <path d="m17.66 17.66 1.41 1.41" />
    <path d="M2 12h2" />
    <path d="M20 12h2" />
    <path d="m6.34 17.66-1.41 1.41" />
    <path d="m19.07 4.93-1.41 1.41" />
  </svg>
);

const SnowflakeIcon = ({ size = 200, strokeWidth = 1 }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth={strokeWidth}
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <line x1="2" x2="22" y1="12" y2="12" />
    <line x1="12" x2="12" y1="2" y2="22" />
    <path d="m20 16-4-4 4-4" />
    <path d="m4 8 4 4-4 4" />
    <path d="m16 4-4 4-4-4" />
    <path d="m8 20 4-4 4 4" />
  </svg>
);

const MountainIcon = ({ size = 200, strokeWidth = 1 }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth={strokeWidth}
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="m8 3 4 8 5-5 5 15H2L8 3z" />
  </svg>
);

const PalmtreeIcon = ({ size = 200, strokeWidth = 1 }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth={strokeWidth}
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M13 8c0-2.76-2.46-5-5.5-5S2 5.24 2 8h2l1-1c1.11-1.11 2.91-1.11 4.02 0l1 1h3Z" />
    <path d="M13 7.14A5.82 5.82 0 0 1 16.5 6c3.04 0 5.5 2.24 5.5 5h-3l-1-1c-1.11-1.11-2.91-1.11-4.02 0l-1 1h-2v-3.86Z" />
    <path d="M5.8 11.25v.01" />
    <path d="M9.2 14.5v.01" />
    <path d="M15.2 16.5v.01" />
    <path d="M18.8 11.25v.01" />
    <path d="M12 10v12" />
  </svg>
);

interface MoodDisplayProps {
  country: CountryData;
}

export default function MoodDisplay({ country }: MoodDisplayProps) {
  const mood = resolveMood(country);

  let IconComponent = SunIcon;
  if (mood.icon === 'Palmtree') IconComponent = PalmtreeIcon;
  else if (mood.icon === 'Mountain') IconComponent = MountainIcon;
  else if (mood.icon === 'Snowflake') IconComponent = SnowflakeIcon;

  return (
    <div
      className={mood.colorScheme}
      style={{
        position: 'relative',
        display: 'flex',
        alignItems: 'center',
        minHeight: '150px',
      }}
    >
      <div
        style={{
          position: 'absolute',
          opacity: 0.1,
          zIndex: 0,
          transform: 'translate(-5%, -10%)',
          filter: 'grayscale(1)',
        }}
      >
        <IconComponent size={200} strokeWidth={1} />
      </div>
      <div
        style={{
          zIndex: 1,
          color: 'var(--text-primary)',
          fontFamily: 'var(--font-bebas-neue), sans-serif',
          fontSize: 'clamp(4rem, 6vw, 8rem)',
          letterSpacing: '0.05em',
          textTransform: 'uppercase',
          textShadow: '0 10px 30px rgba(0,0,0,0.5)',
          lineHeight: 0.9,
        }}
      >
        {mood.label}
      </div>
    </div>
  );
}

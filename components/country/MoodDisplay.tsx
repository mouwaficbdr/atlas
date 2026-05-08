import { resolveMood } from '@/lib/mood-resolver';
import type { CountryData } from '@/lib/types';

interface MoodDisplayProps {
  country: CountryData;
}

export default function MoodDisplay({ country }: MoodDisplayProps) {
  const mood = resolveMood(country);

  return (
    <div
      className={mood.colorScheme}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        padding: '12px 16px',
        backgroundColor: 'var(--bg-elevated)',
        borderRadius: '12px',
        border: '1px solid var(--border-subtle)',
      }}
    >
      <span style={{ fontSize: '2rem' }}>{mood.icon}</span>
      <div>
        <div style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>AMBIANCE</div>
        <div style={{ color: 'var(--text-primary)', fontWeight: 600, fontSize: '1.1rem' }}>{mood.label}</div>
      </div>
    </div>
  );
}

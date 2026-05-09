import { resolveMood } from '@/lib/mood-resolver';
import type { CountryData } from '@/lib/types';
import { Palmtree, Mountain, Snowflake, Sun } from 'lucide-react';

interface MoodDisplayProps {
  country: CountryData;
}

export default function MoodDisplay({ country }: MoodDisplayProps) {
  const mood = resolveMood(country);

  let IconComponent = Sun;
  if (mood.icon === 'Palmtree') IconComponent = Palmtree;
  else if (mood.icon === 'Mountain') IconComponent = Mountain;
  else if (mood.icon === 'Snowflake') IconComponent = Snowflake;

  return (
    <div className={mood.colorScheme} style={{ position: 'relative', display: 'flex', alignItems: 'center', minHeight: '150px' }}>
      <div style={{ position: 'absolute', opacity: 0.1, zIndex: 0, transform: 'translate(-5%, -10%)', filter: 'grayscale(1)' }}>
        <IconComponent size={200} strokeWidth={1} />
      </div>
      <div style={{ zIndex: 1, color: 'var(--text-primary)', fontFamily: 'var(--font-bebas-neue), sans-serif', fontSize: 'clamp(4rem, 6vw, 8rem)', letterSpacing: '0.05em', textTransform: 'uppercase', textShadow: '0 10px 30px rgba(0,0,0,0.5)', lineHeight: 0.9 }}>
        {mood.label}
      </div>
    </div>
  );
}

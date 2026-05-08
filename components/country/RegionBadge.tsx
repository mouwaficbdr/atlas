import type { CountryData } from '@/lib/types';

interface RegionBadgeProps {
  country: CountryData;
  allCountries: CountryData[];
}

const CONTINENT_COLORS: Record<string, string> = {
  Africa: '#e67e22',
  Americas: '#27ae60',
  Asia: '#e74c3c',
  Europe: '#3498db',
  Oceania: '#9b59b6',
  Antarctic: '#95a5a6',
};

export default function RegionBadge({ country, allCountries }: RegionBadgeProps) {
  const color = CONTINENT_COLORS[country.region] ?? '#7f8c8d';

  const regionCountries = allCountries
    .filter((c) => c.region === country.region)
    .sort((a, b) => a.name.common.localeCompare(b.name.common));

  const rank = regionCountries.findIndex((c) => c.cca3 === country.cca3) + 1;
  const total = regionCountries.length;
  const progress = total > 0 ? (rank / total) * 100 : 0;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
      <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
        <span
          style={{
            padding: '4px 12px',
            borderRadius: '20px',
            backgroundColor: color,
            color: '#fff',
            fontSize: '0.85rem',
            fontWeight: 600,
          }}
        >
          {country.region}
        </span>
        {country.subregion && (
          <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>{country.subregion}</span>
        )}
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <div style={{ flex: 1, height: '6px', backgroundColor: 'var(--bg-elevated)', borderRadius: '3px' }}>
          <div
            style={{
              width: `${progress}%`,
              height: '100%',
              backgroundColor: color,
              borderRadius: '3px',
              transition: 'width 0.8s ease-out',
            }}
          />
        </div>
        <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem', whiteSpace: 'nowrap' }}>
          {rank}/{total}
        </span>
      </div>
    </div>
  );
}

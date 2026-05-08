import Link from 'next/link';
import type { CountryData } from '@/lib/types';

interface NeighborCardsProps {
  borders: string[];
  allCountries: CountryData[];
}

export default function NeighborCards({ borders, allCountries }: NeighborCardsProps) {
  if (!borders.length) return <p style={{ color: 'var(--text-muted)' }}>Aucun pays voisin</p>;

  const neighbors = borders
    .map((cca3) => allCountries.find((c) => c.cca3 === cca3))
    .filter(Boolean) as CountryData[];

  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
      {neighbors.map((country) => (
        <Link
          key={country.cca3}
          href={`/pays/${country.cca3.toLowerCase()}`}
          prefetch={true}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '8px 12px',
            backgroundColor: 'var(--bg-elevated)',
            borderRadius: '8px',
            border: '1px solid var(--border-subtle)',
            color: 'var(--text-primary)',
            textDecoration: 'none',
            fontSize: '0.9rem',
          }}
        >
          <img src={country.flags.svg} alt={country.name.common} width={24} height={16} />
          <span>{country.name.common}</span>
        </Link>
      ))}
    </div>
  );
}

import Link from 'next/link';

interface BreadcrumbProps {
  continent: string;
  countryName: string;
}

export default function Breadcrumb({ continent, countryName }: BreadcrumbProps) {
  return (
    <nav aria-label="Fil d'Ariane" style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-muted)', fontSize: '0.9rem' }}>
      <Link href="/" style={{ color: 'var(--text-accent)', textDecoration: 'none' }}>Globe</Link>
      <span>›</span>
      <Link href={`/?continent=${encodeURIComponent(continent)}`} style={{ color: 'var(--text-accent)', textDecoration: 'none' }}>
        {continent}
      </Link>
      <span>›</span>
      <span style={{ color: 'var(--text-primary)' }}>{countryName}</span>
    </nav>
  );
}

'use client';

import Link from 'next/link';

interface BreadcrumbProps {
  continent: string;
  countryName: string;
}

export default function Breadcrumb({
  continent,
  countryName,
}: BreadcrumbProps) {
  return (
    <nav
      aria-label="Fil d'Ariane"
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        color: 'var(--text-muted)',
        fontSize: '0.9rem',
      }}
    >
      <Link
        href="/"
        style={{ color: 'var(--text-accent)', textDecoration: 'none' }}
      >
        Globe
      </Link>
      <span>›</span>
      {/* Le continent reste un repère, pas un lien : /?continent= ne filtre
          rien pour l'instant (finding QA6). */}
      <span>{continent}</span>
      <span>›</span>
      <span style={{ color: 'var(--text-primary)' }}>{countryName}</span>
    </nav>
  );
}

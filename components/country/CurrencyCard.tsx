interface CurrencyCardProps {
  currencies: Record<string, { name: string; symbol: string }>;
}

export default function CurrencyCard({ currencies }: CurrencyCardProps) {
  const entries = Object.entries(currencies);
  if (!entries.length) return null;

  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px' }}>
      {entries.map(([code, { name, symbol }]) => (
        <div
          key={code}
          style={{
            padding: '16px 24px',
            backgroundColor: 'var(--bg-elevated)',
            borderRadius: '12px',
            border: '1px solid var(--border-subtle)',
            transform: 'perspective(500px) rotateY(15deg)',
            transformStyle: 'preserve-3d',
          }}
        >
          <div style={{ fontSize: '2rem', fontWeight: 700, color: 'var(--color-accent)' }}>{symbol}</div>
          <div style={{ color: 'var(--text-primary)', fontWeight: 600 }}>{name}</div>
          <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem', fontFamily: 'JetBrains Mono, monospace' }}>{code}</div>
        </div>
      ))}
    </div>
  );
}

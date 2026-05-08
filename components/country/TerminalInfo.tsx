interface TerminalInfoProps {
  idd: { root: string; suffixes: string[] };
  tld: string[];
}

export default function TerminalInfo({ idd, tld }: TerminalInfoProps) {
  const dialCode = idd.root + (idd.suffixes[0] ?? '');

  return (
    <div
      style={{
        fontFamily: 'JetBrains Mono, monospace',
        backgroundColor: 'var(--bg-surface)',
        border: '1px solid var(--text-muted)',
        borderRadius: '8px',
        padding: '12px 16px',
        display: 'flex',
        gap: '24px',
      }}
    >
      <div>
        <div style={{ color: 'var(--text-muted)', fontSize: '0.75rem', marginBottom: '4px' }}>INDICATIF</div>
        <div style={{ color: 'var(--text-accent)', fontSize: '1.1rem' }}>{dialCode || '—'}</div>
      </div>
      <div>
        <div style={{ color: 'var(--text-muted)', fontSize: '0.75rem', marginBottom: '4px' }}>TLD</div>
        <div style={{ color: 'var(--text-accent)', fontSize: '1.1rem' }}>{tld[0] ?? '—'}</div>
      </div>
    </div>
  );
}

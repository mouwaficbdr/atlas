interface TerminalInfoProps {
  idd: { root: string; suffixes: string[] };
  tld: string[];
}

export default function TerminalInfo({ idd, tld }: TerminalInfoProps) {
  const dialCode = (idd?.root || '') + (idd?.suffixes?.[0] || '');

  return (
    <div style={{ fontFamily: 'var(--font-jetbrains-mono), monospace', display: 'flex', gap: '4rem', opacity: 0.8 }}>
      <div>
        <div style={{ color: 'var(--text-muted)', fontSize: '0.8rem', letterSpacing: '0.2em', marginBottom: '0.5rem' }}>INDICATIF</div>
        <div style={{ fontSize: '2rem', fontWeight: 100 }}>{dialCode || '—'}</div>
      </div>
      <div>
        <div style={{ color: 'var(--text-muted)', fontSize: '0.8rem', letterSpacing: '0.2em', marginBottom: '0.5rem' }}>TLD</div>
        <div style={{ fontSize: '2rem', fontWeight: 100 }}>{tld?.[0] ?? '—'}</div>
      </div>
    </div>
  );
}

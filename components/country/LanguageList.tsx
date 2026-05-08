interface LanguageListProps {
  languages: Record<string, string>;
}

export default function LanguageList({ languages }: LanguageListProps) {
  const entries = Object.entries(languages);

  if (!entries.length) return null;

  return (
    <ul style={{ listStyle: 'none', padding: 0, display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
      {entries.map(([code, name]) => (
        <li
          key={code}
          style={{
            fontSize: '1.2rem',
            padding: '4px 12px',
            backgroundColor: 'var(--bg-elevated)',
            borderRadius: '20px',
            color: 'var(--text-primary)',
            border: '1px solid var(--border-subtle)',
          }}
        >
          {name}
        </li>
      ))}
    </ul>
  );
}

'use client';

const CrownIcon = ({ size = 140, strokeWidth = 1, color = "currentColor" }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round">
    <path d="M11.562 3.266a.5.5 0 0 1 .876 0L15.39 8.87a1 1 0 0 0 1.516.294L21.183 5.5a.5.5 0 0 1 .798.519l-2.834 10.246a1 1 0 0 1-.956.734H5.81a1 1 0 0 1-.956-.734L2.02 6.02a.5.5 0 0 1 .798-.518l4.276 3.664a1 1 0 0 0 1.516-.294z"/>
    <path d="M5 21h14"/>
  </svg>
);

const CastleIcon = ({ size = 140, strokeWidth = 1, color = "currentColor" }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round">
    <path d="M22 20v-9H2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2Z"/>
    <path d="M18 11V4H6v7"/>
    <path d="M15 22v-4a3 3 0 0 0-3-3v0a3 3 0 0 0-3 3v4"/>
    <path d="M22 11V9"/>
    <path d="M2 11V9"/>
    <path d="M6 4V2"/>
    <path d="M18 4V2"/>
    <path d="M10 4V2"/>
    <path d="M14 4V2"/>
  </svg>
);

const HandshakeIcon = ({ size = 140, strokeWidth = 1, color = "currentColor" }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round">
    <path d="m11 17 2 2a1 1 0 1 0 3-3"/>
    <path d="m14 14 2.5 2.5a1 1 0 1 0 3-3l-3.88-3.88a3 3 0 0 0-4.24 0l-.88.88a1 1 0 1 1-3-3l2.81-2.81a5.79 5.79 0 0 1 7.06-.87l.47.28a2 2 0 0 0 1.42.25L21 4"/>
    <path d="m21 3-6 6"/>
    <path d="M21 14v.4a4.8 4.8 0 0 1-1 3.07l-1.15 1.51a2 2 0 0 1-3.22.11l-5.6-6.6-3.28-3.28a3 3 0 0 0-4.24 0l-1.06 1.06a1.5 1.5 0 0 0 0 2.12l8.83 8.83a2 2 0 0 0 2.83 0l1.17-1.17"/>
  </svg>
);

const ShieldIcon = ({ size = 140, strokeWidth = 1, color = "currentColor" }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round">
    <path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2-1 4-2 7-2 2.82 0 5.04.5 7.2 1.34a1 1 0 0 1 .8.96z"/>
  </svg>
);

const LandmarkIcon = ({ size = 140, strokeWidth = 1, color = "currentColor" }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round">
    <line x1="3" x2="21" y1="22" y2="22"/>
    <line x1="6" x2="6" y1="18" y2="11"/>
    <line x1="10" x2="10" y1="18" y2="11"/>
    <line x1="14" x2="14" y1="18" y2="11"/>
    <line x1="18" x2="18" y1="18" y2="11"/>
    <polygon points="12 2 20 7 4 7"/>
  </svg>
);

interface PoliticalRegimeProps {
  /** Libellé FR de la forme de gouvernement (Wikidata P122), ou null. */
  government: string | null;
}

export default function PoliticalRegime({ government }: PoliticalRegimeProps) {
  if (!government) {
    return (
      <div
        style={{
          color: 'var(--text-muted)',
          fontSize: 'clamp(1.5rem, 2.5vw, 3rem)',
          fontFamily: 'var(--font-bebas-neue), sans-serif',
          textTransform: 'uppercase',
          letterSpacing: '0.05em',
          opacity: 0.5,
        }}
      >
        Non renseigné
      </div>
    );
  }

  // Icône dérivée de mots-clés du libellé, jamais du nom du pays.
  const g = government.toLowerCase();
  let IconComponent = LandmarkIcon;
  let color = '#4A90D9';
  if (g.includes('monarchie') || g.includes('royaume') || g.includes('émirat')) {
    IconComponent = CrownIcon;
    color = '#D4AF37';
  } else if (g.includes('principauté')) {
    IconComponent = CastleIcon;
    color = '#9B59B6';
  } else if (g.includes('fédér')) {
    IconComponent = HandshakeIcon;
    color = '#2ECC71';
  } else if (g.includes('socialiste') || g.includes('parti unique')) {
    IconComponent = ShieldIcon;
    color = '#E67E22';
  }
  const type = government;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0' }}>
      <div style={{ opacity: 0.15, mixBlendMode: 'screen', marginBottom: '-2rem' }}>
        <IconComponent size={140} strokeWidth={1} color={color} />
      </div>
      <div
        style={{
          color,
          fontSize:
            type.length <= 12
              ? 'clamp(3rem, 5vw, 6rem)'
              : type.length <= 24
                ? 'clamp(2rem, 3.5vw, 4rem)'
                : 'clamp(1.5rem, 2.6vw, 3rem)',
          fontWeight: 400,
          fontFamily: 'var(--font-bebas-neue), sans-serif',
          textTransform: 'uppercase',
          letterSpacing: '0.02em',
          mixBlendMode: 'screen',
          lineHeight: 0.95,
        }}
      >
        {type}
      </div>
    </div>
  );
}

'use client';

interface PoliticalRegimeProps {
  officialName: string;
}

export default function PoliticalRegime({ officialName }: PoliticalRegimeProps) {
  // Heuristique simple basée sur le nom officiel
  let type = 'République';
  let icon = '🏛️';
  let color = '#4A90D9';

  const nameLower = officialName.toLowerCase();

  if (nameLower.includes('kingdom') || nameLower.includes('monarchy') || nameLower.includes('sultanate') || nameLower.includes('emirate')) {
    type = 'Monarchie / Royaume';
    icon = '👑';
    color = '#D4AF37'; // Or
  } else if (nameLower.includes('principality')) {
    type = 'Principauté';
    icon = '🏰';
    color = '#9B59B6'; // Violet
  } else if (nameLower.includes('federation') || nameLower.includes('federal')) {
    type = 'Fédération';
    icon = '🤝';
    color = '#2ECC71'; // Vert
  } else if (nameLower.includes('state') && !nameLower.includes('republic')) {
    type = 'État Souverain';
    icon = '🛡️';
    color = '#E67E22'; // Orange
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0' }}>
      <div style={{ fontSize: '8rem', lineHeight: 0.8, opacity: 0.15, filter: 'grayscale(1)', mixBlendMode: 'screen' }}>{icon}</div>
      <div style={{ color, fontSize: 'clamp(3rem, 5vw, 6rem)', fontWeight: 400, fontFamily: 'var(--font-bebas-neue), sans-serif', textTransform: 'uppercase', letterSpacing: '0.02em', mixBlendMode: 'screen', lineHeight: 0.9 }}>{type}</div>
    </div>
  );
}

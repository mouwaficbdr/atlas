'use client';

import { Crown, Castle, Handshake, Shield, Landmark } from 'lucide-react';

interface PoliticalRegimeProps {
  officialName: string;
}

export default function PoliticalRegime({ officialName }: PoliticalRegimeProps) {
  let type = 'République';
  let IconComponent = Landmark;
  let color = '#4A90D9';

  const nameLower = officialName.toLowerCase();

  if (nameLower.includes('kingdom') || nameLower.includes('monarchy') || nameLower.includes('sultanate') || nameLower.includes('emirate')) {
    type = 'Monarchie / Royaume';
    IconComponent = Crown;
    color = '#D4AF37'; // Or
  } else if (nameLower.includes('principality')) {
    type = 'Principauté';
    IconComponent = Castle;
    color = '#9B59B6'; // Violet
  } else if (nameLower.includes('federation') || nameLower.includes('federal')) {
    type = 'Fédération';
    IconComponent = Handshake;
    color = '#2ECC71'; // Vert
  } else if (nameLower.includes('state') && !nameLower.includes('republic')) {
    type = 'État Souverain';
    IconComponent = Shield;
    color = '#E67E22'; // Orange
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0' }}>
      <div style={{ opacity: 0.15, mixBlendMode: 'screen', marginBottom: '-2rem' }}>
        <IconComponent size={140} strokeWidth={1} color={color} />
      </div>
      <div style={{ color, fontSize: 'clamp(3rem, 5vw, 6rem)', fontWeight: 400, fontFamily: 'var(--font-bebas-neue), sans-serif', textTransform: 'uppercase', letterSpacing: '0.02em', mixBlendMode: 'screen', lineHeight: 0.9 }}>{type}</div>
    </div>
  );
}

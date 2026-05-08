'use client';

import { useMemo } from 'react';

interface AreaRectProps {
  area: number;
  countryName: string;
}

const RUSSIA_AREA = 17_098_242;

export default function AreaRect({ area, countryName }: AreaRectProps) {
  const widthPercent = useMemo(() => {
    const raw = (area / RUSSIA_AREA) * 100;
    return Math.max(2, Math.min(100, raw));
  }, [area]);

  return (
    <div style={{ width: '100%' }}>
      <div
        style={{
          height: '32px',
          width: `${widthPercent}%`,
          backgroundColor: 'var(--color-accent)',
          borderRadius: '4px',
          transition: 'width 0.8s ease-out',
          position: 'relative',
        }}
        title={`${area.toLocaleString()} km²`}
      />
      <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginTop: '4px' }}>
        {area.toLocaleString()} km² ({widthPercent.toFixed(1)}% de la Russie)
      </div>
    </div>
  );
}

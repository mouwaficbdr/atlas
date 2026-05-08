'use client';

import { useMemo } from 'react';

interface PopulationCloudProps {
  population: number;
  worldPopulation?: number;
}

const WORLD_POPULATION = 8_000_000_000;

export default function PopulationCloud({ population, worldPopulation = WORLD_POPULATION }: PopulationCloudProps) {
  const count = useMemo(() => {
    const raw = Math.round((population / worldPopulation) * 500);
    return Math.min(Math.max(10, raw), 500);
  }, [population, worldPopulation]);

  const dots = useMemo(() => {
    return Array.from({ length: count }, (_, i) => ({
      id: i,
      x: Math.random() * 100,
      y: Math.random() * 100,
      size: Math.random() * 3 + 1,
      opacity: Math.random() * 0.5 + 0.5,
    }));
  }, [count]);

  return (
    <div style={{ position: 'relative', width: '100%', height: '120px' }}>
      <svg width="100%" height="100%" viewBox="0 0 100 100" preserveAspectRatio="none">
        {dots.map((dot) => (
          <circle
            key={dot.id}
            cx={dot.x}
            cy={dot.y}
            r={dot.size * 0.5}
            fill="var(--color-accent)"
            opacity={dot.opacity}
          />
        ))}
      </svg>
      <div style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.85rem', marginTop: '4px' }}>
        {population.toLocaleString()} habitants
      </div>
    </div>
  );
}

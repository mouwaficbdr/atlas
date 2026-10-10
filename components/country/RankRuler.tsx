'use client';

import { useState, type MouseEvent } from 'react';
import { useRouter } from 'next/navigation';
import type { CountryData } from '@/lib/types';

const fr = new Intl.NumberFormat('fr-FR');
const ordinal = (n: number) => (n === 1 ? '1er' : `${fr.format(n)}e`);

interface RankRulerProps {
  /** Rang (1 = premier). */
  rank: number;
  /** Tous les pays, du premier au dernier de ce classement. */
  ranked: CountryData[];
  /** Ce qui est classé, pour le texte : « pays le plus peuplé ». */
  what: string;
}

/**
 * Règle de 193 graduations : le pays à sa place parmi tous les autres,
 * du premier (à gauche) au dernier. Au survol, chaque graduation nomme le
 * pays à ce rang ; un clic y mène. Exploration à la souris seulement : le
 * rang du pays reste annoncé en texte, sans 193 arrêts de tabulation.
 */
export default function RankRuler({ rank, ranked, what }: RankRulerProps) {
  const router = useRouter();
  const [hover, setHover] = useState<number | null>(null);
  const total = ranked.length;
  const step = 1000 / total;

  const indexAt = (e: MouseEvent<HTMLDivElement>) => {
    const box = e.currentTarget.getBoundingClientRect();
    return Math.min(total - 1, Math.max(0, Math.floor(((e.clientX - box.left) / box.width) * total)));
  };
  const target = hover === null ? null : ranked[hover];

  return (
    <div className="cp-rank">
      <span className="cp-label">
        {ordinal(rank)} {what} sur {total}
      </span>
      <div
        className="cp-rank__track"
        data-active={hover !== null}
        onPointerMove={(e) => e.pointerType === 'mouse' && setHover(indexAt(e))}
        onPointerLeave={() => setHover(null)}
        onClick={(e) => router.push(`/pays/${ranked[indexAt(e)].cca3.toLowerCase()}`)}
        aria-hidden="true"
      >
        <svg viewBox="0 0 1000 22" preserveAspectRatio="none">
          {ranked.map((c, i) => (
            <rect
              key={c.cca3}
              x={i * step + step * 0.2}
              width={Math.max(step * 0.6, 1)}
              y={i === rank - 1 || i === hover ? 0 : 9}
              height={i === rank - 1 || i === hover ? 22 : 13}
              fill={
                i === rank - 1 ? 'var(--cp-accent)' : i === hover ? 'var(--text-primary)' : 'rgba(255,255,255,0.16)'
              }
            />
          ))}
        </svg>
        {target && (
          // Décalage proportionnel à la position : l'étiquette reste dans la règle aux deux bouts.
          <span
            className="cp-rank__tip cp-note"
            style={{ left: `${((hover! + 0.5) / total) * 100}%`, transform: `translateX(-${((hover! + 0.5) / total) * 100}%)` }}
          >
            {ordinal(hover! + 1)} : {target.nameFr}
          </span>
        )}
      </div>
      <div className="cp-rank__legend cp-note" aria-hidden="true">
        <span>1er</span>
        <span>{total}e</span>
      </div>
    </div>
  );
}

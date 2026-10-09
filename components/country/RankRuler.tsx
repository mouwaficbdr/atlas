const fr = new Intl.NumberFormat('fr-FR');

interface RankRulerProps {
  /** Rang (1 = premier). */
  rank: number;
  total: number;
  /** Ce qui est classé, pour le texte : « pays le plus peuplé ». */
  what: string;
}

/**
 * Règle de 193 graduations : le pays à sa place parmi tous les autres,
 * du premier (à gauche) au dernier.
 */
export default function RankRuler({ rank, total, what }: RankRulerProps) {
  const step = 1000 / total;
  return (
    <div className="cp-rank">
      <span className="cp-label">
        {rank === 1 ? `1er ${what}` : `${fr.format(rank)}e ${what}`} sur {total}
      </span>
      <svg viewBox="0 0 1000 22" preserveAspectRatio="none" aria-hidden="true">
        {Array.from({ length: total }, (_, i) => (
          <rect
            key={i}
            x={i * step + step * 0.2}
            width={Math.max(step * 0.6, 1)}
            y={i === rank - 1 ? 0 : 9}
            height={i === rank - 1 ? 22 : 13}
            fill={i === rank - 1 ? 'var(--cp-accent)' : 'rgba(255,255,255,0.16)'}
          />
        ))}
      </svg>
      <div className="cp-rank__legend cp-note" aria-hidden="true">
        <span>1er</span>
        <span>{total}e</span>
      </div>
    </div>
  );
}

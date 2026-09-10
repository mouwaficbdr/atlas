'use client';

interface CurrencyCardProps {
  currencies: Record<string, { name: string; symbol: string }>;
}

export default function CurrencyCard({ currencies }: CurrencyCardProps) {
  const entries = Object.entries(currencies);

  if (!entries.length) return null;

  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '2rem' }}>
      {entries.map(([code, { name, symbol }]) => (
        <div key={code} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          {/* Piece : disque metallique CSS en rotation Y (coupee par
              prefers-reduced-motion via la regle globale), symbole en overlay. */}
          <div className="currency-coin-stage">
            <div className="currency-coin" />
            <div className="currency-coin-symbol">{symbol || code}</div>
          </div>
          <div
            style={{
              color: 'rgba(0,0,0,0.85)',
              fontFamily: 'var(--font-bebas-neue), sans-serif',
              fontSize: 'clamp(2rem, 4vw, 5rem)',
              marginTop: '2rem',
              textAlign: 'center',
              textTransform: 'uppercase',
              lineHeight: 0.9,
            }}
          >
            {name}
          </div>
          <div
            style={{
              color: 'rgba(0,0,0,0.5)',
              fontSize: '1.5rem',
              fontFamily: 'var(--font-jetbrains-mono), monospace',
              marginTop: '0.5rem',
              letterSpacing: '0.1em',
            }}
          >
            {code}
          </div>
        </div>
      ))}

      <style jsx>{`
        .currency-coin-stage {
          position: relative;
          width: 200px;
          height: 200px;
          perspective: 800px;
          filter: drop-shadow(0 20px 40px rgba(0, 0, 0, 0.5));
        }
        .currency-coin {
          position: absolute;
          inset: 15%;
          border-radius: 50%;
          background: linear-gradient(
            135deg,
            #f9e29c 0%,
            #e6c157 28%,
            #b8860b 50%,
            #e6c157 72%,
            #f9e29c 100%
          );
          box-shadow:
            inset 0 0 0 6px rgba(139, 101, 8, 0.35),
            inset 0 8px 18px rgba(255, 255, 255, 0.45),
            inset 0 -10px 18px rgba(90, 61, 0, 0.4);
          transform-style: preserve-3d;
          animation: currency-coin-spin 7s linear infinite;
        }
        .currency-coin-symbol {
          position: absolute;
          inset: 0;
          display: flex;
          align-items: center;
          justify-content: center;
          pointer-events: none;
          font-size: 3rem;
          font-family: var(--font-bebas-neue), sans-serif;
          color: #6b4e0f;
          text-shadow: 0 1px 2px rgba(255, 255, 255, 0.35), 0 2px 8px rgba(0, 0, 0, 0.35);
        }
        @keyframes currency-coin-spin {
          from {
            transform: rotateY(0deg);
          }
          to {
            transform: rotateY(360deg);
          }
        }
      `}</style>
    </div>
  );
}

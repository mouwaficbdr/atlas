'use client';

interface CurrencyCardProps {
  currencies: Record<string, { name: string; symbol: string }>;
}

const EDGE_LAYERS = 12;
const THICKNESS_PX = 12;

/**
 * Pièce en vraie 3D CSS : symbole gravé au droit, code ISO au revers, qui
 * tournent avec le disque et disparaissent de profil ; tranche épaisse faite
 * de couches empilées. La rotation ralentit sur chaque face au lieu d'un
 * tour linéaire. Figée de trois quarts si prefers-reduced-motion.
 */
export default function CurrencyCard({ currencies }: CurrencyCardProps) {
  const entries = Object.entries(currencies);

  if (!entries.length) return null;

  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '2rem' }}>
      {entries.map(([code, { name, symbol }]) => {
        const face = symbol || code;
        return (
          <div key={code} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <div className="coin-stage" aria-hidden="true">
              <div className="coin">
                {Array.from({ length: EDGE_LAYERS }, (_, i) => (
                  <span
                    key={i}
                    className="coin__layer"
                    style={{ transform: `translateZ(${-THICKNESS_PX / 2 + (i * THICKNESS_PX) / (EDGE_LAYERS - 1)}px)` }}
                  />
                ))}
                <span className="coin__face coin__face--front">
                  <span className={face.length > 2 ? 'coin__glyph coin__glyph--long' : 'coin__glyph'}>{face}</span>
                </span>
                <span className="coin__face coin__face--back">
                  <span className="coin__glyph coin__glyph--code">{code}</span>
                </span>
              </div>
            </div>
            <div
              style={{
                color: 'var(--text-primary)',
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
                color: 'var(--text-muted)',
                fontSize: '1.5rem',
                fontFamily: 'var(--font-jetbrains-mono), monospace',
                marginTop: '0.5rem',
                letterSpacing: '0.1em',
              }}
            >
              {code}
            </div>
          </div>
        );
      })}

      <style dangerouslySetInnerHTML={{ __html: `
        .coin-stage {
          width: 200px;
          height: 200px;
          display: grid;
          place-items: center;
          perspective: 900px;
          filter: drop-shadow(0 22px 30px rgba(0, 0, 0, 0.35));
        }
        .coin {
          position: relative;
          width: 140px;
          height: 140px;
          transform-style: preserve-3d;
          animation: coin-turn 9s infinite;
        }
        .coin > * {
          position: absolute;
          inset: 0;
          border-radius: 50%;
        }
        .coin__layer {
          background: linear-gradient(90deg, #7a560c, #c49a2c 45%, #8a6411);
        }
        .coin__face {
          display: grid;
          place-items: center;
          backface-visibility: hidden;
          -webkit-backface-visibility: hidden;
          /* Champ doré éclairé en haut à gauche, filet intérieur gravé. */
          background:
            radial-gradient(circle, transparent 74%, rgba(110, 76, 8, 0.45) 75%, rgba(255, 236, 170, 0.35) 76.5%, transparent 78%),
            radial-gradient(circle at 38% 32%, #fbe7a6 0%, #e9c45c 34%, #c3922a 70%, #9d7015 100%);
          box-shadow:
            inset 0 10px 18px rgba(255, 248, 220, 0.4),
            inset 0 -12px 18px rgba(80, 52, 0, 0.45);
        }
        /* Listel cannelé, limité à l'anneau extérieur. */
        .coin__face::before {
          content: '';
          position: absolute;
          inset: 0;
          border-radius: 50%;
          background: repeating-conic-gradient(rgba(96, 66, 6, 0.55) 0deg 2.2deg, rgba(255, 240, 190, 0.25) 2.2deg 4.5deg);
          -webkit-mask: radial-gradient(circle, transparent 84%, #000 85.5%);
          mask: radial-gradient(circle, transparent 84%, #000 85.5%);
        }
        .coin__face::after {
          content: '';
          position: absolute;
          inset: 0;
          border-radius: 50%;
          background: linear-gradient(115deg, transparent 30%, rgba(255, 252, 235, 0.55) 48%, transparent 62%);
          background-size: 250% 100%;
          mix-blend-mode: soft-light;
          animation: coin-sheen 9s infinite;
        }
        .coin__face--front { transform: translateZ(${THICKNESS_PX / 2 + 0.5}px); }
        .coin__face--back { transform: rotateY(180deg) translateZ(${THICKNESS_PX / 2 + 0.5}px); }
        .coin__glyph {
          position: relative;
          z-index: 1;
          font-family: var(--font-bebas-neue), sans-serif;
          font-size: 3.4rem;
          line-height: 1;
          color: #8a6210;
          /* Gravure : arête claire en bas à droite, ombre portée en haut à gauche. */
          text-shadow: 1px 1px 0 rgba(255, 244, 205, 0.75), -1px -1px 1px rgba(70, 45, 0, 0.55);
        }
        .coin__glyph--long { font-size: 2rem; letter-spacing: 0.04em; }
        .coin__glyph--code { font-size: 1.9rem; letter-spacing: 0.12em; }
        /* Ralentit face au regard, accélère de profil : rythme d'une vraie pièce. */
        @keyframes coin-turn {
          0% { transform: rotateX(12deg) rotateY(-28deg); animation-timing-function: cubic-bezier(0.45, 0, 0.25, 1); }
          50% { transform: rotateX(12deg) rotateY(152deg); animation-timing-function: cubic-bezier(0.45, 0, 0.25, 1); }
          100% { transform: rotateX(12deg) rotateY(332deg); }
        }
        @keyframes coin-sheen {
          0%, 50%, 100% { background-position: 120% 0; }
          25%, 75% { background-position: -20% 0; }
        }
        @media (prefers-reduced-motion: reduce) {
          .coin { animation: none; transform: rotateX(12deg) rotateY(-28deg); }
          .coin__face::after { animation: none; }
        }
      ` }} />
    </div>
  );
}

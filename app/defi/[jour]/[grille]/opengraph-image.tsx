import { ImageResponse } from 'next/og';
import { MAX_GUESSES } from '@/lib/daily';
import { parseDefi } from '@/lib/share-urls';
import { OG_COLORS, OG_CONTENT_TYPE, OG_DISPLAY, OG_SIZE, ogFonts } from '@/lib/og';

export const alt = 'Résultat du défi du jour sur atlas, sans la réponse';
export const size = OG_SIZE;
export const contentType = OG_CONTENT_TYPE;

const fr = new Intl.NumberFormat('fr-FR');
const frDay = new Intl.DateTimeFormat('fr-FR', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' });

/** Image de partage d'un résultat du défi (#34) : la grille des essais, jamais le pays. */
export default function Image({ params }: { params: { jour: string; grille: string } }) {
  const r = parseDefi(params.jour, params.grille);
  const rows = r?.rows ?? [];
  const won = rows[rows.length - 1] === 'ok';
  const slots = Array.from({ length: MAX_GUESSES }, (_, i) => rows[i] ?? null);

  return new ImageResponse(
    (
      <div style={{ width: '100%', height: '100%', display: 'flex', padding: '64px 72px', backgroundColor: OG_COLORS.bg, color: OG_COLORS.ink }}>
        <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', width: 520 }}>
          <span style={{ fontFamily: 'JetBrains Mono', fontSize: 22, letterSpacing: 6 }}>atlas</span>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <span style={{ fontFamily: 'JetBrains Mono', fontSize: 22, letterSpacing: 4, textTransform: 'uppercase', color: '#ffd27a' }}>
              Défi du jour
            </span>
            <span style={{ fontFamily: OG_DISPLAY, textTransform: 'uppercase', fontSize: 84, lineHeight: 0.95, marginTop: 10 }}>
              {r ? frDay.format(new Date(`${r.day}T12:00:00Z`)) : 'atlas'}
            </span>
          </div>
          <span style={{ fontFamily: OG_DISPLAY, fontSize: 124, lineHeight: 0.9, color: won ? '#7ee2a8' : OG_COLORS.muted }}>
            {won ? rows.length : 'X'}/{MAX_GUESSES}
          </span>
        </div>
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: 18 }}>
          {slots.map((row, i) => (
            <div
              key={i}
              style={{
                display: 'flex',
                alignItems: 'center',
                height: 120,
                padding: '0 36px',
                border: `1px solid ${row ? (row === 'ok' ? '#7ee2a8' : 'rgba(255,210,122,0.6)') : OG_COLORS.hairline}`,
                fontFamily: 'JetBrains Mono',
                fontSize: 40,
                color: row === 'ok' ? '#7ee2a8' : '#ffd27a',
              }}
            >
              {row === 'ok' ? (
                <>
                  {/* La police n'a pas de coche : on la dessine. */}
                  <svg width={64} height={64} viewBox="0 0 24 24" style={{ marginRight: 28 }}>
                    <path d="M4 12.5 L9.5 18 L20 6" fill="none" stroke="#7ee2a8" strokeWidth={2.4} />
                  </svg>
                  <span>trouvé</span>
                </>
              ) : row ? (
                <>
                  <svg width={64} height={64} viewBox="0 0 24 24" style={{ transform: `rotate(${row.bearing}deg)`, marginRight: 28 }}>
                    <path d="M12 2 L16 12 L12 10 L8 12 Z" fill="#ffd27a" />
                    <path d="M12 22 L16 12 L12 14 L8 12 Z" fill="rgba(255,255,255,0.25)" />
                  </svg>
                  <span>{fr.format(row.km)} km</span>
                </>
              ) : null}
            </div>
          ))}
        </div>
      </div>
    ),
    { ...size, fonts: ogFonts() },
  );
}

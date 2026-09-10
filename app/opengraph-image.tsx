import { ImageResponse } from 'next/og';
import { OG_COLORS, OG_CONTENT_TYPE, OG_SIZE, ogFonts } from '@/lib/og';

export const alt = 'ATLAS° — explorateur mondial de pays';
export const size = OG_SIZE;
export const contentType = OG_CONTENT_TYPE;

export default function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          padding: 80,
          backgroundColor: OG_COLORS.bg,
          color: OG_COLORS.ink,
        }}
      >
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            fontFamily: 'JetBrains Mono',
            fontSize: 24,
            letterSpacing: 6,
            textTransform: 'uppercase',
            color: OG_COLORS.muted,
          }}
        >
          <span style={{ color: OG_COLORS.ink }}>ATLAS&#176;</span>
          <span>Explorateur mondial</span>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <div
            style={{
              fontFamily: 'JetBrains Mono',
              fontSize: 26,
              letterSpacing: 8,
              textTransform: 'uppercase',
              color: OG_COLORS.accent,
              marginBottom: 20,
            }}
          >
            Le monde en 3D
          </div>
          <div
            style={{
              fontFamily: 'Bebas Neue',
              fontSize: 150,
              lineHeight: 0.92,
              letterSpacing: 2,
            }}
          >
            193 ÉTATS SOUVERAINS
          </div>
          <div style={{ display: 'flex', width: 96, height: 3, backgroundColor: OG_COLORS.accent, marginTop: 32 }} />
        </div>

        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            fontFamily: 'JetBrains Mono',
            fontSize: 20,
            letterSpacing: 4,
            textTransform: 'uppercase',
            color: OG_COLORS.muted,
          }}
        >
          <span>Géographie &middot; Culture &middot; Économie</span>
          <span>BADAROU Mouwafic</span>
        </div>
      </div>
    ),
    { ...size, fonts: ogFonts() },
  );
}

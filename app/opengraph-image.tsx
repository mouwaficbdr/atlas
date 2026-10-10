import { readFileSync } from 'fs';
import { join } from 'path';
import { ImageResponse } from 'next/og';
import { OG_COLORS, OG_CONTENT_TYPE, OG_SIZE, ogFonts } from '@/lib/og';

export const alt = 'atlas : le globe 3D des 193 États membres de l’ONU, l’Afrique et l’Europe éclairées par le vrai soleil';
export const size = OG_SIZE;
export const contentType = OG_CONTENT_TYPE;

// Le vrai globe d'atlas (capture du site), plutôt qu'une composition purement typographique.
const globe = `data:image/jpeg;base64,${readFileSync(join(process.cwd(), 'public', 'og', 'globe.jpg')).toString('base64')}`;

export default function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          position: 'relative',
          backgroundColor: OG_COLORS.bg,
          color: OG_COLORS.ink,
        }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={globe} alt="" width={760} height={760} style={{ position: 'absolute', left: 520, top: -65 }} />
        {/* Fondu vers la gauche pour la lisibilité du texte. */}
        <div
          style={{
            position: 'absolute',
            // Satori ne gère pas `inset` : dimensions explicites.
            top: 0,
            left: 0,
            width: 1200,
            height: 630,
            // Opaque jusqu'au bord gauche de la photo (520 px) pour qu'il ne fasse pas d'arête.
            backgroundImage: 'linear-gradient(90deg, #0a0a14 0%, #0a0a14 47%, rgba(10,10,20,0.55) 60%, rgba(10,10,20,0) 74%)',
          }}
        />

        <div
          style={{
            position: 'relative',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            width: 640,
            padding: '72px 0 72px 80px',
          }}
        >
          <span style={{ fontFamily: 'JetBrains Mono', fontSize: 26, letterSpacing: 8 }}>atlas</span>

          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <div style={{ fontFamily: 'Bebas Neue', fontSize: 132, lineHeight: 0.9, letterSpacing: 1 }}>Le monde</div>
            <div style={{ fontFamily: 'Bebas Neue', fontSize: 132, lineHeight: 0.9, letterSpacing: 1 }}>en 3D</div>
            <div style={{ display: 'flex', width: 96, height: 3, backgroundColor: OG_COLORS.accent, margin: '30px 0 26px' }} />
            <div style={{ fontFamily: 'JetBrains Mono', fontSize: 22, lineHeight: 1.5, color: OG_COLORS.muted, maxWidth: 430 }}>
              Les 193 États membres de l’ONU, éclairés par le vrai soleil.
            </div>
          </div>

          <span style={{ fontFamily: 'JetBrains Mono', fontSize: 20, letterSpacing: 3, color: OG_COLORS.muted }}>
            atlas.mouwaficbdr.me
          </span>
        </div>
      </div>
    ),
    { ...size, fonts: ogFonts() },
  );
}

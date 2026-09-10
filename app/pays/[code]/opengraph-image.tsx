import { ImageResponse } from 'next/og';
import { fetchAllCountries } from '@/lib/countries-api';
import {
  OG_COLORS,
  OG_CONTENT_TYPE,
  OG_SIZE,
  flagDataUri,
  frInt,
  ogFonts,
} from '@/lib/og';

export const alt = 'Fiche pays ATLAS°';
export const size = OG_SIZE;
export const contentType = OG_CONTENT_TYPE;

// Pré-générées au build pour les 193 pays, comme les pages : tout autre code
// est un vrai 404, pas une image servie à la demande.
export const dynamicParams = false;

export async function generateStaticParams() {
  const countries = await fetchAllCountries();
  return countries.map((c) => ({ code: c.cca3.toLowerCase() }));
}

export default async function Image({
  params,
}: {
  params: { code: string };
}) {
  const countries = await fetchAllCountries();
  const country = countries.find(
    (c) => c.cca3.toLowerCase() === params.code.toLowerCase(),
  );

  if (!country) {
    return new ImageResponse(
      (
        <div
          style={{
            width: '100%',
            height: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: OG_COLORS.bg,
            color: OG_COLORS.ink,
            fontFamily: 'Bebas Neue',
            fontSize: 120,
          }}
        >
          ATLAS&#176;
        </div>
      ),
      { ...size, fonts: ogFonts() },
    );
  }

  const flag = await flagDataUri(country.cca2);

  const facts: Array<[string, string]> = [
    ['Capitale', country.capitalFr || '—'],
    ['Population', frInt(country.population)],
    ['Région', country.regionFr || country.region || '—'],
  ];

  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          backgroundColor: OG_COLORS.bg,
          color: OG_COLORS.ink,
        }}
      >
        {/* Panneau drapeau, pleine hauteur */}
        <div style={{ display: 'flex', width: 460, height: '100%', position: 'relative' }}>
          {flag ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={flag}
              alt=""
              width={460}
              height={630}
              style={{ objectFit: 'cover', width: 460, height: 630 }}
            />
          ) : (
            <div style={{ display: 'flex', width: 460, height: 630, backgroundColor: '#11111f' }} />
          )}
          <div
            style={{
              position: 'absolute',
              inset: 0,
              backgroundColor: 'rgba(10, 10, 20, 0.28)',
              borderRight: `1px solid ${OG_COLORS.hairline}`,
            }}
          />
        </div>

        {/* Contenu */}
        <div
          style={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            padding: 72,
          }}
        >
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              fontFamily: 'JetBrains Mono',
              fontSize: 22,
              letterSpacing: 5,
              textTransform: 'uppercase',
              color: OG_COLORS.muted,
            }}
          >
            <span style={{ color: OG_COLORS.ink }}>ATLAS&#176;</span>
            <span>{country.cca3}</span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <div
              style={{
                fontFamily: 'Bebas Neue',
                fontSize: country.nameFr.length > 18 ? 96 : 128,
                lineHeight: 0.92,
                letterSpacing: 1,
              }}
            >
              {country.nameFr}
            </div>
            <div style={{ display: 'flex', width: 80, height: 3, backgroundColor: OG_COLORS.accent, marginTop: 24 }} />
          </div>

          <div style={{ display: 'flex', gap: 48 }}>
            {facts.map(([label, value]) => (
              <div key={label} style={{ display: 'flex', flexDirection: 'column', maxWidth: 240 }}>
                <span
                  style={{
                    fontFamily: 'JetBrains Mono',
                    fontSize: 16,
                    letterSpacing: 3,
                    textTransform: 'uppercase',
                    color: OG_COLORS.muted,
                    marginBottom: 8,
                  }}
                >
                  {label}
                </span>
                <span style={{ fontFamily: 'Bebas Neue', fontSize: 40, lineHeight: 1 }}>
                  {value}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    ),
    { ...size, fonts: ogFonts() },
  );
}

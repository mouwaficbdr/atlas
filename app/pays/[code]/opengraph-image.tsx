import { ImageResponse } from 'next/og';
import { fetchAllCountries } from '@/lib/countries-api';
import { loadGeoJSON } from '@/lib/geojson-loader';
import { adjustForContrast } from '@/lib/contrast-checker';
import { mainPolygons, projectedPath } from '@/lib/true-size';
import { KOPPEN } from '@/lib/koppen';
import { OG_COLORS, OG_CONTENT_TYPE, OG_DISPLAY, OG_SIZE, flagDataUri, ogDisplayFor, ogFonts, populationLabel } from '@/lib/og';

export const alt = 'Fiche pays sur atlas : silhouette du pays, capitale, population et climat';
export const size = OG_SIZE;
export const contentType = OG_CONTENT_TYPE;

// Pré-générées au build pour les 193 pays, comme les pages : tout autre code
// est un vrai 404, pas une image servie à la demande.
export const dynamicParams = false;

export async function generateStaticParams() {
  const countries = await fetchAllCountries();
  return countries.map((c) => ({ code: c.cca3.toLowerCase() }));
}

const STAGE = 520;
const DRAW = STAGE - 80;

/** Longueur ronde (1, 2 ou 5 × 10^n km) qui occupe environ 90 à 220 px de la silhouette. */
function scaleBar(extentKm: number): { km: number; px: number } {
  const kmPerPx = (extentKm * 2) / DRAW;
  const target = 140 * kmPerPx;
  const pow = 10 ** Math.floor(Math.log10(target));
  const km = [1, 2, 5, 10].map((m) => m * pow).reduce((a, b) => (Math.abs(b - target) < Math.abs(a - target) ? b : a));
  return { km, px: km / kmPerPx };
}

/**
 * Image de partage d'une fiche : la silhouette du pays (projection
 * équivalente de Lambert, comme le comparateur à taille réelle), aux couleurs
 * de son drapeau, dans l'anneau orbital du chargement ; à droite, l'essentiel.
 */
export default async function Image({ params }: { params: { code: string } }) {
  const countries = await fetchAllCountries();
  const country = countries.find((c) => c.cca3.toLowerCase() === params.code.toLowerCase());
  if (!country) {
    return new ImageResponse(
      (
        <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: OG_COLORS.bg, color: OG_COLORS.ink, fontFamily: 'JetBrains Mono', fontSize: 48 }}>
          atlas
        </div>
      ),
      { ...size, fonts: ogFonts() },
    );
  }

  const geo = await loadGeoJSON();
  const feature = geo.features.find((f) => f.properties.cca3 === country.cca3);
  const shape = feature ? (() => {
    const { polygons, center } = mainPolygons(feature.geometry);
    return projectedPath(polygons, center);
  })() : null;
  const color = adjustForContrast(country.colors?.primary ?? OG_COLORS.accent, OG_COLORS.bg, 3);
  const flag = await flagDataUri(country.cca2);
  const climate = country.climate[0] ? KOPPEN[country.climate[0].code].label : null;

  const facts: Array<[string, string]> = [
    ['Capitale', country.capitalFr],
    ['Population', populationLabel(country.population).replace(/ d’habitants| habitants/, '')],
    ...(climate ? ([['Climat', climate]] as Array<[string, string]>) : []),
  ];

  // Silhouette centrée dans un carré, avec une marge pour l'anneau ; une
  // échelle dit la vraie taille (Tuvalu agrandi au cadre resterait trompeur).
  const extent = shape ? shape.extent * 1.18 : 1;
  const scale = scaleBar(extent);
  const fr = new Intl.NumberFormat('fr-FR');

  return new ImageResponse(
    (
      <div style={{ width: '100%', height: '100%', display: 'flex', backgroundColor: OG_COLORS.bg, color: OG_COLORS.ink }}>
        <div style={{ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center', width: 560, height: 630 }}>
          <div
            style={{
              position: 'absolute',
              left: 20,
              top: 55,
              width: STAGE,
              height: STAGE,
              borderRadius: STAGE,
              border: `1px solid ${OG_COLORS.hairline}`,
              backgroundImage: 'radial-gradient(circle at 50% 50%, rgba(79,195,247,0.07), rgba(10,10,20,0) 70%)',
            }}
          />
          {shape && (
            <svg width={DRAW} height={DRAW} viewBox={`${-extent} ${-extent} ${extent * 2} ${extent * 2}`}>
              <path d={shape.d} fill={color} fillOpacity={0.88} fillRule="evenodd" stroke="#fff4d6" strokeOpacity={0.55} strokeWidth={extent / 260} />
            </svg>
          )}
          {shape && (
            <div style={{ position: 'absolute', left: 280 - scale.px / 2, bottom: 40, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              <div style={{ display: 'flex', width: scale.px, height: 6, borderLeft: '1px solid #8d95a3', borderRight: '1px solid #8d95a3', borderBottom: '1px solid #8d95a3' }} />
              <span style={{ marginTop: 6, fontFamily: 'JetBrains Mono', fontSize: 15, color: '#8d95a3' }}>{fr.format(scale.km)} km</span>
            </div>
          )}
        </div>

        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-between', padding: '64px 72px 64px 24px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontFamily: 'JetBrains Mono', fontSize: 22, letterSpacing: 4, color: OG_COLORS.muted }}>
            <span style={{ color: OG_COLORS.ink, letterSpacing: 6 }}>atlas</span>
            <span>{country.cca3} · {country.subregionFr}</span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <div style={{ fontFamily: ogDisplayFor(country.nameFr), textTransform: 'uppercase', fontSize: country.nameFr.length > 22 ? 64 : country.nameFr.length > 14 ? 80 : country.nameFr.length > 8 ? 96 : 112, lineHeight: 0.92 }}>
              {country.nameFr}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', marginTop: 22, fontFamily: 'JetBrains Mono', fontSize: 20, color: OG_COLORS.muted }}>
              {flag && (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={flag} alt="" width={54} height={36} style={{ marginRight: 18, borderRadius: 3, objectFit: 'cover' }} />
              )}
              {country.officialNameFr !== country.nameFr && <span style={{ maxWidth: 480 }}>{country.officialNameFr}</span>}
            </div>
          </div>

          <div style={{ display: 'flex', gap: 44 }}>
            {facts.map(([label, value]) => (
              <div key={label} style={{ display: 'flex', flexDirection: 'column', maxWidth: 230 }}>
                <span style={{ fontFamily: 'JetBrains Mono', fontSize: 16, letterSpacing: 3, textTransform: 'uppercase', color: OG_COLORS.muted, marginBottom: 8 }}>
                  {label}
                </span>
                <span style={{ fontFamily: OG_DISPLAY, textTransform: 'uppercase', fontSize: 34, lineHeight: 1 }}>{value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    ),
    { ...size, fonts: ogFonts() },
  );
}

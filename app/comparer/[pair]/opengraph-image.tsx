import { ImageResponse } from 'next/og';
import { fetchAllCountries } from '@/lib/countries-api';
import { loadGeoJSON } from '@/lib/geojson-loader';
import { adjustForContrast } from '@/lib/contrast-checker';
import { mainPolygons, projectedPath } from '@/lib/true-size';
import { parseCompare } from '@/lib/share-urls';
import { OG_COLORS, OG_CONTENT_TYPE, OG_DISPLAY, OG_SIZE, ogDisplayFor, ogFonts } from '@/lib/og';

export const alt = 'Deux pays superposés à taille réelle sur atlas';
export const size = OG_SIZE;
export const contentType = OG_CONTENT_TYPE;

const DRAW = 500;
const fr = new Intl.NumberFormat('fr-FR');
const fr1 = new Intl.NumberFormat('fr-FR', { maximumFractionDigits: 1 });
const fr0 = new Intl.NumberFormat('fr-FR', { maximumFractionDigits: 0 });

/**
 * Image de partage d'une comparaison (#34) : les deux silhouettes, chacune
 * centrée sur son propre centre, à la même échelle (projection équivalente,
 * comme le comparateur de la fiche).
 */
export default async function Image({ params }: { params: { pair: string } }) {
  const countries = await fetchAllCountries();
  const codes = parseCompare(params.pair, new Set(countries.map((c) => c.cca3)));
  const geo = codes ? await loadGeoJSON() : null;
  const pair = codes?.map((code) => {
    const country = countries.find((c) => c.cca3 === code)!;
    const feature = geo!.features.find((f) => f.properties.cca3 === code);
    const shape = feature ? (() => { const { polygons, center } = mainPolygons(feature.geometry); return projectedPath(polygons, center); })() : null;
    return { country, shape };
  });

  if (!pair || pair.some((p) => !p.shape)) {
    return new ImageResponse(
      <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: OG_COLORS.bg, color: OG_COLORS.ink, fontFamily: 'JetBrains Mono', fontSize: 48 }}>atlas</div>,
      { ...size, fonts: ogFonts() },
    );
  }

  const [a, b] = pair;
  const extent = Math.max(a.shape!.extent, b.shape!.extent) * 1.08;
  const colorA = adjustForContrast(a.country.colors?.primary ?? OG_COLORS.accent, OG_COLORS.bg, 3);
  const colorB = '#f0f0f0';
  const ratio = b.country.area / a.country.area;
  const big = ratio >= 1 ? ratio : 1 / ratio;
  const ratioText = `${ratio >= 1 ? '×' : '÷'} ${(big < 10 ? fr1 : fr0).format(big)}`;

  return new ImageResponse(
    (
      <div style={{ width: '100%', height: '100%', display: 'flex', backgroundColor: OG_COLORS.bg, color: OG_COLORS.ink }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: 600, height: 630 }}>
          <svg width={DRAW} height={DRAW} viewBox={`${-extent} ${-extent} ${extent * 2} ${extent * 2}`}>
            <path d={b.shape!.d} fill={colorB} fillOpacity={0.12} fillRule="evenodd" stroke={colorB} strokeOpacity={0.8} strokeWidth={extent / 220} />
            <path d={a.shape!.d} fill={colorA} fillOpacity={0.75} fillRule="evenodd" stroke="#fff4d6" strokeOpacity={0.5} strokeWidth={extent / 300} />
          </svg>
        </div>
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-between', padding: '64px 72px 64px 8px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontFamily: 'JetBrains Mono', fontSize: 22, letterSpacing: 4, color: OG_COLORS.muted }}>
            <span style={{ color: OG_COLORS.ink, letterSpacing: 6 }}>atlas</span>
            <span>À taille réelle</span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
            {[{ p: a, color: colorA, solid: true }, { p: b, color: colorB, solid: false }].map(({ p, color, solid }) => (
              <div key={p.country.cca3} style={{ display: 'flex', alignItems: 'center' }}>
                <div style={{ width: 28, height: 28, marginRight: 22, backgroundColor: solid ? color : 'transparent', border: `2px solid ${color}` }} />
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                  <span style={{ fontFamily: ogDisplayFor(p.country.nameFr), textTransform: 'uppercase', fontSize: p.country.nameFr.length > 16 ? 52 : 72, lineHeight: 0.95 }}>{p.country.nameFr}</span>
                  <span style={{ fontFamily: 'JetBrains Mono', fontSize: 18, color: OG_COLORS.muted }}>{fr.format(p.country.area)} km²</span>
                </div>
              </div>
            ))}
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', fontFamily: 'JetBrains Mono', fontSize: 20, color: OG_COLORS.muted }}>
            <div style={{ display: 'flex', alignItems: 'baseline', color: '#ffd27a' }}>
              <span style={{ fontSize: 40, marginRight: 8 }}>{ratioText.slice(0, 1)}</span>
              <span style={{ fontFamily: OG_DISPLAY, fontSize: 64, lineHeight: 1 }}>{ratioText.slice(2)}</span>
            </div>
            <span>en superficie, à la même échelle</span>
          </div>
        </div>
      </div>
    ),
    { ...size, fonts: ogFonts() },
  );
}

import { ImageResponse } from 'next/og';
import { fetchAllCountries } from '@/lib/countries-api';
import { loadGeoJSON } from '@/lib/geojson-loader';
import { parseLogbook } from '@/lib/share-urls';
import { logbookMapPaths } from '@/lib/logbook-map';
import { OG_COLORS, OG_CONTENT_TYPE, OG_DISPLAY, OG_SIZE, ogFonts } from '@/lib/og';

export const alt = 'Carnet de vol sur atlas : planisphère des pays explorés';
export const size = OG_SIZE;
export const contentType = OG_CONTENT_TYPE;

const MAP_W = 1080;
const MAP_H = 440;

/** Image de partage d'un carnet (#34) : planisphère des escales en or. */
export default async function Image({ params }: { params: { codes: string } }) {
  const countries = await fetchAllCountries();
  const codes = parseLogbook(params.codes, new Set(countries.map((c) => c.cca3)));
  const geo = await loadGeoJSON();
  // Bande utile du planisphère : de 60° S à 84° N (l'Antarctique n'est pas un État).
  const { on, off } = logbookMapPaths(geo.features, new Set(codes), MAP_W, MAP_H * (180 / 144));
  const n = codes.length;

  return new ImageResponse(
    (
      <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', padding: '56px 60px 40px', backgroundColor: OG_COLORS.bg, color: OG_COLORS.ink }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <span style={{ fontFamily: OG_DISPLAY, textTransform: 'uppercase', fontSize: 64, lineHeight: 0.95 }}>Carnet de vol</span>
            <span style={{ fontFamily: 'JetBrains Mono', fontSize: 24, color: '#ffd27a' }}>
              {n} escale{n > 1 ? 's' : ''} sur {countries.length} pays
            </span>
          </div>
          <span style={{ fontFamily: 'JetBrains Mono', fontSize: 22, letterSpacing: 6 }}>atlas</span>
        </div>
        <svg width={MAP_W} height={MAP_H} viewBox={`0 ${MAP_H * (180 / 144) * (6 / 180)} ${MAP_W} ${MAP_H}`} style={{ marginTop: 34 }}>
          <path d={off} fill="rgba(255,255,255,0.08)" fillRule="evenodd" />
          <path d={on} fill="#e2b84a" stroke="#ffd27a" strokeWidth={0.6} fillRule="evenodd" />
        </svg>
      </div>
    ),
    { ...size, fonts: ogFonts() },
  );
}

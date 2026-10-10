'use client';

import { useEffect, useId, useMemo, useState } from 'react';
import { useAppStore } from '@/lib/store';
import type { CountryData, GeoJSONFeature } from '@/lib/types';
import { loadGeoJSON } from '@/lib/geojson-loader';
import { mainPolygons, projectedPath } from '@/lib/true-size';
import ShareButton from './ShareButton';

interface TrueSizeCompareProps {
  country: CountryData;
  allCountries: CountryData[];
  canonicalUrl: string;
}

const fr1 = new Intl.NumberFormat('fr-FR', { maximumFractionDigits: 1 });

const fr = new Intl.NumberFormat('fr-FR');

/** « 15,6 : 1 » quand le pays de la fiche est le plus étendu, « 1 : 15,6 » sinon. */
function ratioLabel(a: CountryData, b: CountryData) {
  const r = a.area / b.area;
  if (r >= 0.95 && r <= 1.05) return '≈ 1 : 1';
  return r > 1 ? `${fr1.format(r)} : 1` : `1 : ${fr1.format(1 / r)}`;
}

/**
 * Deux pays superposés à la même échelle, chacun dans sa projection
 * équivalente de Lambert : la taille réelle, sans la dilatation de Mercator.
 * Le choix se partage par l'URL (?comparer=bra).
 */
export default function TrueSizeCompare({ country, allCountries, canonicalUrl }: TrueSizeCompareProps) {
  const selectId = useId();
  const [features, setFeatures] = useState<GeoJSONFeature[] | null>(null);
  const [other, setOther] = useState(country.cca3 === 'FRA' ? 'ESP' : 'FRA');

  // Sans choix dans l'URL, le comparateur se règle sur le pays de l'utilisateur.
  const homeCca3 = useAppStore((state) => state.home?.cca3);
  useEffect(() => {
    const wanted = new URLSearchParams(window.location.search).get('comparer');
    if (!wanted && homeCca3 && homeCca3 !== country.cca3) setOther(homeCca3);
  }, [homeCca3, country.cca3]);

  useEffect(() => {
    const wanted = new URLSearchParams(window.location.search).get('comparer')?.toUpperCase();
    if (wanted && wanted !== country.cca3 && allCountries.some((c) => c.cca3 === wanted)) setOther(wanted);
    loadGeoJSON()
      .then((geo) => setFeatures(geo.features))
      .catch(() => setFeatures([]));
  }, [country.cca3, allCountries]);

  const choose = (cca3: string) => {
    setOther(cca3);
    window.history.replaceState(null, '', `?comparer=${cca3.toLowerCase()}`);
  };

  const options = useMemo(
    () => allCountries.filter((c) => c.cca3 !== country.cca3).sort((a, b) => a.nameFr.localeCompare(b.nameFr, 'fr')),
    [allCountries, country.cca3],
  );
  const otherCountry = allCountries.find((c) => c.cca3 === other);

  const shapes = useMemo(() => {
    if (!features) return null;
    const draw = (cca3: string) => {
      const feature = features.find((f) => f.properties.cca3 === cca3);
      if (!feature) return null;
      const { polygons, center, dropped } = mainPolygons(feature.geometry);
      return { ...projectedPath(polygons, center), dropped };
    };
    const a = draw(country.cca3);
    const b = draw(other);
    return a && b ? { a, b, extent: Math.max(a.extent, b.extent) * 1.06 } : null;
  }, [features, country.cca3, other]);

  if (!otherCountry) return null;

  return (
    <div className="ts">
      <div className="ts__text">
        <span className="cp-label">À taille réelle · rapport des superficies</span>
        <p className="cp-display cp-big">{ratioLabel(country, otherCountry)}</p>
        <label htmlFor={selectId} className="cp-label" style={{ marginTop: '1.6rem' }}>
          Comparer avec
        </label>
        <select id={selectId} className="ts__select" value={other} onChange={(e) => choose(e.target.value)}>
          {options.map((c) => (
            <option key={c.cca3} value={c.cca3}>
              {c.nameFr}
            </option>
          ))}
        </select>
        <ul className="ts__legend">
          <li>
            <i className="ts__swatch ts__swatch--a" aria-hidden="true" />
            {country.nameFr}
            <span className="cp-note">{fr.format(Math.round(country.area))} km²</span>
          </li>
          <li>
            <i className="ts__swatch ts__swatch--b" aria-hidden="true" />
            {otherCountry.nameFr}
            <span className="cp-note">{fr.format(Math.round(otherCountry.area))} km²</span>
          </li>
        </ul>
        {shapes && (shapes.a.dropped || shapes.b.dropped) && (
          <p className="cp-note">Territoires situés à plus de 3 000 km du territoire principal non dessinés.</p>
        )}
        <div style={{ marginTop: '1.4rem' }}>
          <ShareButton url={`${canonicalUrl}?comparer=${other.toLowerCase()}`} title={`${country.nameFr} et ${otherCountry.nameFr} à taille réelle · atlas`} />
        </div>
      </div>

      <div className="ts__canvas">
        {shapes ? (
          <svg
            viewBox={`${-shapes.extent} ${-shapes.extent} ${shapes.extent * 2} ${shapes.extent * 2}`}
            role="img"
            aria-label={`Silhouettes superposées à la même échelle : ${country.nameFr} et ${otherCountry.nameFr}`}
          >
            <path d={shapes.a.d} className="ts__a" fillRule="evenodd" />
            <path d={shapes.b.d} className="ts__b" fillRule="evenodd" />
          </svg>
        ) : (
          <p className="cp-note">Chargement des silhouettes…</p>
        )}
      </div>

      <style dangerouslySetInnerHTML={{ __html: `
        .ts {
          display: grid;
          gap: 2rem;
          margin-top: clamp(3rem, 8vh, 5rem);
          padding-top: clamp(2rem, 5vh, 3rem);
          border-top: 1px solid var(--cp-line);
        }
        @media (min-width: 900px) { .ts { grid-template-columns: 1fr minmax(0, 30rem); align-items: center; } }
        .ts__select {
          width: 100%;
          max-width: 22rem;
          min-height: 44px;
          padding: 0.6rem 0.9rem;
          background: rgba(255, 255, 255, 0.04);
          color: var(--text-primary);
          border: 1px solid var(--cp-line);
          border-radius: 4px;
          font: inherit;
        }
        .ts__select option { background: #111122; }
        .ts__legend { list-style: none; margin: 1.4rem 0 1rem; padding: 0; display: flex; gap: 1.4rem; flex-wrap: wrap; }
        .ts__legend li { display: inline-flex; align-items: center; gap: 0.6rem; }
        .ts__swatch { width: 14px; height: 14px; border-radius: 2px; }
        .ts__swatch--a { background: color-mix(in srgb, var(--cp-accent) 60%, transparent); }
        .ts__swatch--b { border: 1.5px solid #f0f0f0; }
        .ts__canvas svg { display: block; width: 100%; aspect-ratio: 1; overflow: visible; }
        .ts__a { fill: color-mix(in srgb, var(--cp-accent) 55%, transparent); stroke: var(--cp-accent); stroke-width: 1; vector-effect: non-scaling-stroke; }
        .ts__b { fill: rgba(240, 240, 240, 0.06); stroke: #f0f0f0; stroke-width: 1.5; vector-effect: non-scaling-stroke; }
      ` }} />
    </div>
  );
}

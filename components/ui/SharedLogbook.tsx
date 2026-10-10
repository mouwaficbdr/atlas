'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import type { CountryData, GeoJSONFeature } from '@/lib/types';
import { fetchAllCountries } from '@/lib/countries-api';
import { loadGeoJSON } from '@/lib/geojson-loader';
import { drawLogbookMap } from '@/lib/logbook-map';
import { useAppStore } from '@/lib/store';

/** Carnet reçu par lien (#34) : ses escales, en lecture seule, par-dessus le globe. */
export default function SharedLogbook({ codes }: { codes: string[] }) {
  const setLogbookOpen = useAppStore((s) => s.setLogbookOpen);
  const [countries, setCountries] = useState<CountryData[]>([]);
  const [features, setFeatures] = useState<GeoJSONFeature[] | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    fetchAllCountries().then(setCountries).catch(() => setCountries([]));
    loadGeoJSON()
      .then((geo) => setFeatures(geo.features))
      .catch(() => setFeatures([]));
  }, []);

  useEffect(() => {
    const ctx = canvasRef.current?.getContext('2d');
    if (ctx && features) drawLogbookMap(ctx, features, new Set(codes), 0, 0, 720, 360);
  }, [features, codes]);

  const stamps = codes.map((code) => countries.find((c) => c.cca3 === code)).filter(Boolean) as CountryData[];

  return (
    <section className="shared-log" aria-labelledby="shared-log-title">
      <p className="shared-log__kicker">Carnet de vol partagé</p>
      <h1 id="shared-log-title" className="shared-log__title">
        {codes.length} escale{codes.length > 1 ? 's' : ''} sur 193
      </h1>
      <canvas ref={canvasRef} className="shared-log__map" width={720} height={360} aria-hidden="true" />
      <ul className="shared-log__list">
        {stamps.map((c) => (
          <li key={c.cca3}>
            <Link href={`/pays/${c.cca3.toLowerCase()}`}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={c.flags.svg} alt="" width={20} height={14} />
              {c.nameFr}
            </Link>
          </li>
        ))}
      </ul>
      <div className="shared-log__actions">
        <button type="button" onClick={() => setLogbookOpen(true)}>
          Ouvrir mon carnet
        </button>
        <Link href="/">
          <span aria-hidden="true">←</span> Retour au globe
        </Link>
      </div>
      <style dangerouslySetInnerHTML={{ __html: `
        .shared-log {
          position: fixed;
          z-index: 30;
          left: clamp(1rem, 4vw, 3rem);
          top: 50%;
          transform: translateY(-50%);
          width: min(30rem, calc(100vw - 2rem));
          max-height: calc(100dvh - 2rem);
          overflow: auto;
          padding: clamp(1.2rem, 3vw, 1.8rem);
          background: rgba(10, 10, 20, 0.88);
          border: 1px solid rgba(255, 255, 255, 0.1);
          backdrop-filter: blur(8px);
          color: var(--text-primary, #f0f0f0);
        }
        .shared-log__kicker { margin: 0; font-family: var(--font-jetbrains-mono), monospace; font-size: 0.72rem; letter-spacing: 0.14em; text-transform: uppercase; color: #ffd27a; }
        .shared-log__title { margin: 0.5rem 0 1rem; font-family: var(--font-display), sans-serif; font-weight: 700; font-stretch: 70%; text-transform: uppercase; font-size: 2.6rem; line-height: 1; }
        .shared-log__map { display: block; width: 100%; height: auto; margin-bottom: 1rem; }
        .shared-log__list { list-style: none; margin: 0 0 1.2rem; padding: 0; display: flex; flex-wrap: wrap; gap: 0.4rem; }
        .shared-log__list a { display: inline-flex; align-items: center; gap: 0.45rem; padding: 0.35rem 0.6rem; font-size: 0.85rem; color: inherit; text-decoration: none; border: 1px solid rgba(255, 255, 255, 0.12); }
        .shared-log__list a:hover, .shared-log__list a:focus-visible { border-color: #ffd27a; }
        .shared-log__actions { display: flex; flex-wrap: wrap; align-items: center; gap: 1rem; font-family: var(--font-jetbrains-mono), monospace; font-size: 0.72rem; letter-spacing: 0.1em; }
        .shared-log__actions button { padding: 0.65rem 1rem; font: inherit; letter-spacing: inherit; text-transform: uppercase; color: #0a0a14; background: #ffd27a; border: 0; cursor: pointer; }
        .shared-log__actions a { color: var(--text-muted, #8d95a3); text-decoration: none; }
        @media (max-width: 767px) {
          .shared-log { top: auto; bottom: 0; left: 0; right: 0; transform: none; width: auto; max-height: 70dvh; border-width: 1px 0 0; }
        }
      ` }} />
    </section>
  );
}

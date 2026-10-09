'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import type { CountryData } from '@/lib/types';
import { cardinalDirection, initialBearing } from '@/lib/bearing';
import ShareButton from './ShareButton';

interface CountryFooterProps {
  current: CountryData;
  allCountries: CountryData[];
  shareUrl: string;
}

const RAD = Math.PI / 180;
const EARTH_KM = 6371;
const fr = new Intl.NumberFormat('fr-FR');

/** Distance orthodromique entre deux points [lon, lat], en km. */
function distanceKm([lon1, lat1]: [number, number], [lon2, lat2]: [number, number]) {
  const a =
    Math.sin(((lat2 - lat1) * RAD) / 2) ** 2 +
    Math.cos(lat1 * RAD) * Math.cos(lat2 * RAD) * Math.sin(((lon2 - lon1) * RAD) / 2) ** 2;
  return 2 * EARTH_KM * Math.asin(Math.sqrt(a));
}

/**
 * Fin de descente, « au sol » : trois destinations proches (voisins, ou pays
 * les plus proches pour une île), un pays au hasard, le partage, le retour
 * au globe, puis les sources des données affichées.
 */
export default function CountryFooter({ current, allCountries, shareUrl }: CountryFooterProps) {
  const [random, setRandom] = useState<CountryData | null>(null);

  useEffect(() => {
    const pool = allCountries.filter((c) => c.cca3 !== current.cca3);
    if (pool.length) setRandom(pool[Math.floor(Math.random() * pool.length)]);
  }, [allCountries, current.cca3]);

  const next = useMemo(() => {
    const others = allCountries.filter((c) => c.cca3 !== current.cca3);
    const pool = current.borders.length ? others.filter((c) => current.borders.includes(c.cca3)) : others;
    return pool
      .map((c) => ({ country: c, km: distanceKm(current.centroid, c.centroid) }))
      .sort((a, b) => a.km - b.km)
      .slice(0, 3);
  }, [current, allCountries]);

  return (
    <footer id="fin" className="cp-end">
      <p className="cp-kicker">{current.cca3} · au sol</p>
      <h2 className="cp-display cp-end__title">Continuer l’exploration</h2>

      <ol className="cp-end__next">
        {next.map(({ country, km }) => (
          <li key={country.cca3}>
            <Link href={`/pays/${country.cca3.toLowerCase()}`} className="cp-end__dest">
              <span className="cp-note">
                {cardinalDirection(initialBearing(current.centroid, country.centroid))} · {fr.format(Math.round(km / 10) * 10)} km
              </span>
              <span className="cp-display">{country.nameFr}</span>
            </Link>
          </li>
        ))}
      </ol>

      <div className="cp-end__actions">
        <Link href={random ? `/pays/${random.cca3.toLowerCase()}` : '/'} className="cp-end__chip">
          Pays au hasard{random ? ` · ${random.nameFr}` : ''}
        </Link>
        <ShareButton url={shareUrl} title={`${current.nameFr} · atlas`} />
        <Link href="/" className="cp-end__chip">
          <span aria-hidden="true">←</span> Retour au globe
        </Link>
      </div>

      <p className="cp-note cp-end__sources">
        Sources : Natural Earth, Banque mondiale, Wikidata, mledoze/countries, Köppen-Geiger (Beck et al. 2023), Wikipédia.
        <br />
        atlas · Mouwafic Badarou · licence MIT
      </p>
    </footer>
  );
}

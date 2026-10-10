'use client';

import { useEffect, useMemo, type CSSProperties, type ReactNode } from 'react';
import type { CountryData, CountryPalette } from '@/lib/types';
import { formatLat, formatLon, utcOffset } from '@/lib/format-coords';
import { useAppStore } from '@/lib/store';

import Breadcrumb from './Breadcrumb';
import WikiExtract from './WikiExtract';
import CapitalSky from './CapitalSky';
import RankRuler from './RankRuler';
import ClimateDisplay from './ClimateDisplay';
import TrueSizeCompare from './TrueSizeCompare';
import CurrencyCard from './CurrencyCard';
import NeighborCards from './NeighborCards';
import CountryFooter from './CountryFooter';
import DescentRail, { type DescentStage } from './DescentRail';
import './country-page.css';

interface CountryCardProps {
  country: CountryData;
  allCountries: CountryData[];
  /** Contenu éditorial MDX rendu côté serveur (null si le pays n'en a pas). */
  mdxSlot?: ReactNode;
  palette: CountryPalette;
  canonicalUrl: string;
  wikiSummary?: string | null;
}

const fr = new Intl.NumberFormat('fr-FR');
const frCompact = new Intl.NumberFormat('fr-FR', { notation: 'compact', compactDisplay: 'long', maximumFractionDigits: 1 });
/** « 68,7 millions », mais le nombre exact sous le million (« 11 396 », pas « 11,4 mille »). */
const shortCount = (n: number) => (n < 1_000_000 ? fr.format(n) : frCompact.format(n));
const frPct = new Intl.NumberFormat('fr-FR', { style: 'percent', maximumFractionDigits: 2 });

/** Rang (1 = plus grand) de `value` parmi `values`. */
const rankOf = (value: number, values: number[]) => values.filter((v) => v > value).length + 1;

/**
 * Fiche pays en « descente orbitale » : on arrive au-dessus du pays (le globe,
 * visible derrière le titre), puis chaque section descend d'un cran : relevé,
 * capitale, habitants, territoire, institutions, frontières, archives.
 */
export default function CountryCard({
  country,
  allCountries,
  mdxSlot,
  palette,
  canonicalUrl,
  wikiSummary,
}: CountryCardProps) {
  useEffect(() => {
    const root = document.documentElement.style;
    root.setProperty('--country-primary', palette.primary);
    root.setProperty('--country-accent', palette.accent);
    return () => {
      root.removeProperty('--country-primary');
      root.removeProperty('--country-accent');
    };
  }, [palette]);

  useEffect(() => {
    // La page est remontée par pays (key={cca3}) : on repart du haut.
    window.scrollTo(0, 0);
  }, []);

  // Arrivé aux frontières, la caméra recule pour montrer les voisins.
  const setCountryView = useAppStore((state) => state.setCountryView);
  useEffect(() => {
    const target = document.getElementById('frontieres');
    if (!target) return;
    const observer = new IntersectionObserver(([entry]) => setCountryView(entry.isIntersecting ? 'wide' : 'close'), {
      rootMargin: '-35% 0px -35% 0px',
    });
    observer.observe(target);
    return () => {
      observer.disconnect();
      setCountryView('close');
    };
  }, [setCountryView]);

  const stats = useMemo(() => {
    const densities = allCountries.map((c) => c.population / (c.area || 1));
    const density = country.population / (country.area || 1);
    const humanity = allCountries.reduce((sum, c) => sum + c.population, 0);
    return {
      total: allCountries.length,
      popRank: rankOf(country.population, allCountries.map((c) => c.population)),
      areaRank: rankOf(country.area, allCountries.map((c) => c.area)),
      densityRank: rankOf(density, densities),
      density,
      share: country.population / humanity,
      byPop: [...allCountries].sort((a, b) => b.population - a.population),
      byArea: [...allCountries].sort((a, b) => b.area - a.area),
    };
  }, [country, allCountries]);

  const languages = Object.values(country.languages ?? {});
  const [currencyCode, currency] = Object.entries(country.currencies ?? {})[0] ?? [];
  const idd = country.idd?.root
    ? `${country.idd.root}${country.idd.suffixes?.length === 1 ? country.idd.suffixes[0] : ''}`
    : 'N/A';

  const stages: DescentStage[] = [
    { id: 'orbite', label: 'Orbite' },
    { id: 'releve', label: 'Relevé' },
    { id: 'capitale', label: 'Capitale' },
    { id: 'habitants', label: 'Habitants' },
    { id: 'territoire', label: 'Territoire' },
    { id: 'institutions', label: 'Institutions' },
    { id: 'frontieres', label: 'Frontières' },
    ...(mdxSlot ? [{ id: 'archives', label: 'Archives' }] : []),
  ];
  const indexOf = (id: string) => String(stages.findIndex((s) => s.id === id) + 1).padStart(2, '0');

  return (
    <article className="cp" style={{ '--cp-accent': palette.primary } as CSSProperties}>
      <DescentRail stages={stages} countryName={country.nameFr} shareUrl={canonicalUrl} />

      {/* 01 · Orbite : le globe, centré sur le pays, reste visible. */}
      <header id="orbite" className="cp-hero">
        <Breadcrumb continent={country.regionFr} countryName={country.nameFr} />
        <div className="cp-hero__id">
          <p className="cp-kicker">
            {country.cca3} · {country.subregionFr}
          </p>
          <h1 className="cp-hero__name cp-display" style={{ '--len': country.nameFr.length } as CSSProperties}>
            {country.nameFr}
          </h1>
          <p className="cp-hero__official">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img className="cp-hero__flag" src={country.flags.svg} alt={`Drapeau : ${country.nameFr}`} width={38} height={26} />
            {country.officialNameFr}
          </p>
        </div>
        <div className="cp-hero__foot">
          <span className="cp-note">
            {formatLat(country.centroid[1])} · {formatLon(country.centroid[0])}
          </span>
          <a href="#releve" className="cp-descend cp-kicker">
            Descendre
            <svg width="12" height="16" viewBox="0 0 12 16" fill="none" stroke="currentColor" strokeWidth="1.4" aria-hidden="true">
              <path d="M6 1v13M1 9l5 5 5-5" />
            </svg>
          </a>
        </div>
      </header>

      {/* 02 · Relevé : l'essentiel d'un coup d'œil, puis le chapô. */}
      <section id="releve" className="cp-section cp-section--glass" aria-labelledby="releve-h">
        <div className="cp-head">
          <span className="cp-index">{indexOf('releve')}</span>
          <h2 id="releve-h">Relevé</h2>
        </div>
        <div className="cp-grid cp-grid--2">
          <dl className="cp-facts">
            <div className="cp-fact">
              <dt className="cp-label">Capitale</dt>
              <dd>
                <a href="#capitale">{country.capitalFr}</a>
              </dd>
              <small>{utcOffset(country.primaryTimezone)}</small>
            </div>
            <div className="cp-fact">
              <dt className="cp-label">Population</dt>
              <dd>{shortCount(country.population)}</dd>
              <small>
                {stats.popRank}e sur {stats.total}
              </small>
            </div>
            <div className="cp-fact">
              <dt className="cp-label">Superficie</dt>
              <dd>
                {fr.format(Math.round(country.area))} <span style={{ textTransform: 'none' }}>km²</span>
              </dd>
              <small>
                {stats.areaRank}e sur {stats.total}
              </small>
            </div>
            <div className="cp-fact">
              <dt className="cp-label">{languages.length > 1 ? 'Langues' : 'Langue'}</dt>
              <dd>{languages[0] ?? 'N/A'}</dd>
              <small>
                {languages.length > 1
                  ? `et ${languages.length - 1} autre${languages.length > 2 ? 's' : ''}`
                  : 'officielle'}
              </small>
            </div>
            <div className="cp-fact">
              <dt className="cp-label">Monnaie</dt>
              <dd>{currency?.name ?? 'N/A'}</dd>
              <small>
                {currencyCode}
                {currency?.symbol ? ` · ${currency.symbol}` : ''}
              </small>
            </div>
            <div className="cp-fact">
              <dt className="cp-label">Régime</dt>
              <dd style={{ fontSize: 'clamp(1.1rem, 1.7vw, 1.45rem)' }}>{country.governmentFr ?? 'N/A'}</dd>
            </div>
          </dl>
          {wikiSummary ? (
            <WikiExtract wikiSummary={wikiSummary} />
          ) : (
            <p className="cp-note">Résumé encyclopédique indisponible pour le moment.</p>
          )}
        </div>
      </section>

      {/* 03 · Capitale : heure et vrai ciel au-dessus d'elle. */}
      <section id="capitale" className="cp-section" aria-labelledby="capitale-h">
        <div className="cp-head">
          <span className="cp-index">{indexOf('capitale')}</span>
          <h2 id="capitale-h">Capitale</h2>
        </div>
        <div className="cp-grid cp-grid--2">
          <div>
            <p className="cp-display cp-big">{country.capitalFr}</p>
            {country.capitalLonLat && (
              <p className="cp-note" style={{ marginTop: '1rem' }}>
                {formatLat(country.capitalLonLat[1])} · {formatLon(country.capitalLonLat[0])}
              </p>
            )}
          </div>
          {country.capitalLonLat && <CapitalSky timezone={country.primaryTimezone} lonLat={country.capitalLonLat} />}
        </div>
      </section>

      {/* 04 · Habitants */}
      <section id="habitants" className="cp-section" aria-labelledby="habitants-h">
        <div className="cp-head">
          <span className="cp-index">{indexOf('habitants')}</span>
          <h2 id="habitants-h">Habitants</h2>
        </div>
        <div className="cp-grid cp-grid--2">
          <div>
            <span className="cp-label">
              Population{country.populationYear ? ` · Banque mondiale ${country.populationYear}` : ''}
            </span>
            <p className="cp-display cp-big" style={{ fontVariantNumeric: 'tabular-nums' }}>
              {fr.format(country.population)}
            </p>
            <RankRuler rank={stats.popRank} ranked={stats.byPop} what="pays le plus peuplé" />
            <p className="cp-value" style={{ marginTop: '1.6rem' }}>
              {frPct.format(stats.share)} des habitants des {stats.total} États membres de l’ONU.
            </p>
          </div>
          <div>
            <div className="cp-stat">
              <span className="cp-label">Densité</span>
              <p className="cp-display cp-mid">{fr.format(Math.round(stats.density))} hab./km²</p>
              <p className="cp-note">
                {stats.densityRank}e plus dense sur {stats.total}
              </p>
            </div>
            <div className="cp-stat">
              <span className="cp-label">Gentilé</span>
              <p className="cp-value">{country.demonymFr}</p>
            </div>
            <div className="cp-stat">
              <span className="cp-label">{languages.length > 1 ? 'Langues officielles' : 'Langue officielle'}</span>
              <ul className="cp-chips">
                {Object.entries(country.languages ?? {}).map(([code, name]) => (
                  <li key={code}>
                    {name}
                    <span>{code}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* 05 · Territoire */}
      <section id="territoire" className="cp-section" aria-labelledby="territoire-h">
        <div className="cp-head">
          <span className="cp-index">{indexOf('territoire')}</span>
          <h2 id="territoire-h">Territoire</h2>
        </div>
        <div className="cp-grid cp-grid--2">
          <div>
            <span className="cp-label">Superficie</span>
            <p className="cp-display cp-big" style={{ fontVariantNumeric: 'tabular-nums' }}>
              {fr.format(country.area)} <span style={{ fontSize: '0.4em', textTransform: 'none' }}>km²</span>
            </p>
            <RankRuler rank={stats.areaRank} ranked={stats.byArea} what="pays le plus étendu" />
            <div className="cp-pair">
              <div>
                <span className="cp-label">Accès à la mer</span>
                <p className="cp-value">{country.landlocked ? 'Enclavé' : 'Côtier'}</p>
              </div>
              <div>
                <span className="cp-label">Centre géographique</span>
                <p className="cp-value">
                  {formatLat(country.centroid[1])}
                  <br />
                  {formatLon(country.centroid[0])}
                </p>
              </div>
            </div>
          </div>
          <div>
            <span className="cp-label">Climat</span>
            <ClimateDisplay climate={country.climate} />
          </div>
        </div>
        <TrueSizeCompare country={country} allCountries={allCountries} canonicalUrl={canonicalUrl} />
      </section>

      {/* 06 · Institutions et économie : la seule section aux couleurs du drapeau. */}
      <section id="institutions" className="cp-section cp-section--accent" aria-labelledby="institutions-h">
        <div className="cp-head">
          <span className="cp-index">{indexOf('institutions')}</span>
          <h2 id="institutions-h">Institutions et économie</h2>
        </div>
        <div className="cp-grid cp-grid--2-even">
          <div>
            <span className="cp-label">Régime politique</span>
            <p className="cp-display cp-mid">{country.governmentFr ?? 'N/A'}</p>
            <div className="cp-ids">
              <div>
                <span className="cp-label">Indicatif</span>
                <p className="cp-display cp-mid">{idd}</p>
              </div>
              <div>
                <span className="cp-label">Domaine internet</span>
                <p className="cp-display cp-mid">{country.tld?.[0] ?? 'N/A'}</p>
              </div>
              <div>
                <span className="cp-label">Codes ISO</span>
                <p className="cp-display cp-mid">
                  {country.cca2} · {country.cca3}
                </p>
              </div>
            </div>
          </div>
          <div>
            <span className="cp-label">Monnaie</span>
            <CurrencyCard currencies={country.currencies} />
          </div>
        </div>
      </section>

      {/* 07 · Frontières : le globe transparaît, chaque voisin s'y allume. */}
      <section id="frontieres" className="cp-section cp-section--glass cp-borders" aria-labelledby="frontieres-h">
        <div className="cp-head">
          <span className="cp-index">{indexOf('frontieres')}</span>
          <h2 id="frontieres-h">Frontières</h2>
        </div>
        {country.borders.length > 0 ? (
          <div className="cp-borders__list">
            <NeighborCards origin={country.centroid} borders={country.borders} allCountries={allCountries} />
          </div>
        ) : (
          <p className="cp-value" style={{ maxWidth: '34rem' }}>
            Aucune frontière terrestre avec un autre État : {country.nameFr} n’est bordé que par la mer.
          </p>
        )}
      </section>

      {mdxSlot && (
        <section id="archives" className="cp-section" aria-labelledby="archives-h">
          <div className="cp-head">
            <span className="cp-index">{indexOf('archives')}</span>
            <h2 id="archives-h">Archives</h2>
          </div>
          <div className="cp-archive">{mdxSlot}</div>
        </section>
      )}

      <CountryFooter current={country} allCountries={allCountries} shareUrl={canonicalUrl} />
    </article>
  );
}

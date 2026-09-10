'use client';

import { useEffect, useRef } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import type { CountryData, MDXContent, CountryPalette } from '@/lib/types';
import { formatLat, formatLon, utcOffset } from '@/lib/format-coords';
import { prefersReducedMotion } from '@/lib/hooks/useReducedMotion';

import FlagDisplay from './FlagDisplay';
import CapitalClock from './CapitalClock';
import LanguageList from './LanguageList';
import NeighborCards from './NeighborCards';
import MoodDisplay from './MoodDisplay';
import PoliticalRegime from './PoliticalRegime';
import WikiExtract from './WikiExtract';
import CurrencyCard from './CurrencyCard';
import Breadcrumb from './Breadcrumb';
import ShareButton from './ShareButton';
import CountryFooter from './CountryFooter';
import dynamic from 'next/dynamic';

const MDXSection = dynamic(() => import('./MDXSection'), { ssr: false });

// Canvas WebGL de section (three + react-three-fiber) : chargés en import
// dynamique client pour ne pas alourdir le bundle de la fiche pays. Ce sont des
// décors, leur rendu différé n'a aucun impact fonctionnel.
const MoodBackground = dynamic(() => import('./MoodBackground'), { ssr: false });
const PopulationCloud = dynamic(() => import('./PopulationCloud'), {
  ssr: false,
});

gsap.registerPlugin(ScrollTrigger);

interface CountryCardProps {
  country: CountryData;
  allCountries: CountryData[];
  mdxContent: MDXContent;
  palette: CountryPalette;
  canonicalUrl: string;
  wikiSummary?: string | null;
}

export default function CountryCard({
  country,
  allCountries,
  mdxContent,
  palette,
  canonicalUrl,
  wikiSummary,
}: CountryCardProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const titleRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    document.documentElement.style.setProperty(
      '--country-primary',
      palette.primary,
    );
    document.documentElement.style.setProperty(
      '--country-secondary',
      palette.secondary,
    );
    document.documentElement.style.setProperty(
      '--country-accent',
      palette.accent,
    );
    document.documentElement.style.setProperty(
      '--country-background',
      palette.background,
    );

    return () => {
      document.documentElement.style.removeProperty('--country-primary');
      document.documentElement.style.removeProperty('--country-secondary');
      document.documentElement.style.removeProperty('--country-accent');
      document.documentElement.style.removeProperty('--country-background');
    };
  }, [palette]);

  useEffect(() => {
    // La page est remontée par pays (key={cca3}) : on repart du haut plutôt
    // que de rester à la position de scroll du pays précédent (finding QA9).
    window.scrollTo(0, 0);

    // Parallaxe GSAP complexe retirée au profit du sticky wipe CSS ; on garde
    // une entrée simple sur le titre, sauf en motion réduit.
    if (titleRef.current && !prefersReducedMotion()) {
      gsap.to(titleRef.current, {
        yPercent: -20,
        opacity: 0,
        ease: 'none',
        scrollTrigger: {
          trigger: containerRef.current,
          start: 'top top',
          end: '+=100%',
          scrub: true,
        },
      });
    }

    return () => ScrollTrigger.getAll().forEach((t) => t.kill());
  }, []);

  return (
    <>
      <MoodBackground palette={palette} />

      <div
        ref={containerRef}
        style={{
          color: 'var(--text-primary)',
          position: 'relative',
          width: '100%',
          minHeight: '100vh',
          animation: 'fadeIn 1.5s ease-in-out',
        }}
      >
        {/* Massive Fixed Title — taille adaptative selon longueur */}
        <div
          ref={titleRef}
          style={{
            position: 'fixed',
            top: '10vh',
            left: 0,
            width: '100%',
            zIndex: 10,
            pointerEvents: 'none',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '1rem',
            padding: '0 5vw',
          }}
        >
          <h1
            style={{
              // Taille dynamique inversement proportionnelle à la longueur du nom
              // < 8 chars (Chad, Cuba) → énorme / > 20 chars → raisonnable
              fontSize:
                country.nameFr.length <= 6
                  ? 'clamp(4rem, 18vw, 22rem)'
                  : country.nameFr.length <= 10
                    ? 'clamp(3rem, 13vw, 17rem)'
                    : country.nameFr.length <= 15
                      ? 'clamp(2.5rem, 10vw, 13rem)'
                      : country.nameFr.length <= 20
                        ? 'clamp(2rem, 7.5vw, 10rem)'
                        : 'clamp(1.5rem, 5.5vw, 7rem)',
              fontWeight: 400,
              fontFamily: 'var(--font-bebas-neue), Impact, sans-serif',
              color: 'var(--country-primary)',
              lineHeight: 0.85,
              textAlign: 'center',
              mixBlendMode: 'screen',
              opacity: 0.9,
              wordBreak: 'keep-all',
              overflowWrap: 'break-word',
              hyphens: 'auto',
              textTransform: 'uppercase',
              textShadow: '0 10px 30px rgba(0,0,0,0.5)',
              maxWidth: '90vw',
            }}
          >
            {country.nameFr}
          </h1>
          {/* Nom officiel en sous-titre technique, toujours lisible quelle que soit la longueur */}
          {country.officialNameFr !== country.nameFr && (
            <div
              style={{
                fontSize: '0.6rem',
                fontFamily: 'var(--font-jetbrains-mono), monospace',
                color: 'var(--country-primary)',
                letterSpacing: '0.2em',
                opacity: 0.5,
                textAlign: 'center',
                textTransform: 'uppercase',
                maxWidth: '80vw',
                lineHeight: 1.5,
                mixBlendMode: 'screen',
              }}
            >
              {country.officialNameFr}
            </div>
          )}
        </div>

        {/* Panel 1: Hero & Flag */}
        <section
          className="editorial-panel"
          style={{
            height: '100vh',
            width: '100%',
            position: 'sticky',
            top: 0,
            zIndex: 1,
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'flex-end',
            padding: 'clamp(1rem, 5vw, 4rem)',
            background: 'linear-gradient(to bottom, rgba(0,0,0,0.1) 0%, rgba(0,0,0,0.3) 100%)',
            overflow: 'hidden',
          }}
        >
          <div
            style={{
              position: 'absolute',
              top: '2rem',
              left: '2rem',
              zIndex: 20,
            }}
          >
            <Breadcrumb
              continent={country.regionFr}
              countryName={country.nameFr}
            />
          </div>
          <FlagDisplay
            flagSvg={country.flags.svg}
            countryName={country.nameFr}
          />

          {/* Fallback élégant si pas de résumé Wikipedia */}
          {wikiSummary === null && (
            <div
              style={{
                position: 'absolute',
                bottom: '5vh',
                right: '5vw',
                width: 'min(90vw, 400px)',
                zIndex: 30,
                borderTop: '1px solid rgba(255,255,255,0.2)',
                paddingTop: '1.5rem',
              }}
            >
              <h4
                style={{
                  fontSize: '0.6rem',
                  fontFamily: 'var(--font-jetbrains-mono), monospace',
                  color: 'rgba(255,255,255,0.3)',
                  letterSpacing: '0.2em',
                }}
              >
                WIKIPEDIA — DONNÉES NON DISPONIBLES
              </h4>
            </div>
          )}

          {typeof wikiSummary === 'string' && (
            <WikiExtract wikiSummary={wikiSummary} />
          )}
        </section>

        {/* Panel 2: Population as Art */}
        <section
          className="editorial-panel"
          style={{
            height: '100vh',
            width: '100%',
            position: 'sticky',
            top: 0,
            zIndex: 2,
            backgroundColor: 'var(--country-background, #05050A)',
            overflow: 'hidden',
          }}
        >
          <div
            style={{
              position: 'absolute',
              top: '0',
              left: '0',
              width: '100%',
              height: '100%',
              opacity: 0.3,
              zIndex: 1,
              filter: 'blur(1px)',
            }}
          >
            <PopulationCloud population={country.population} />
          </div>

          <div
            style={{
              position: 'absolute',
              top: '10%',
              right: '10%',
              zIndex: 10,
              textAlign: 'right',
            }}
          >
            <h2
              style={{
                fontSize: '1rem',
                fontFamily: 'var(--font-jetbrains-mono), monospace',
                textTransform: 'uppercase',
                letterSpacing: '0.3em',
                opacity: 0.5,
              }}
            >
              Démographie
            </h2>
          </div>

          {/* Chiffre géant centré */}
          <div
            style={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              zIndex: 20,
              width: '100%',
              textAlign: 'center',
              padding: '0 3vw',
            }}
          >
            <div
              style={{
                fontSize:
                  country.population >= 1_000_000_000
                    ? 'clamp(2.5rem, 10vw, 16rem)'
                    : country.population >= 100_000_000
                      ? 'clamp(3rem, 12vw, 19rem)'
                      : country.population >= 10_000_000
                        ? 'clamp(3.5rem, 14vw, 22rem)'
                        : 'clamp(4rem, 16vw, 26rem)',
                fontFamily: 'var(--font-bebas-neue), sans-serif',
                color: '#fff',
                lineHeight: 0.85,
                letterSpacing: '-0.03em',
              }}
            >
              {new Intl.NumberFormat('fr-FR').format(country.population)}
            </div>
            <div
              style={{
                fontSize: '0.65rem',
                fontFamily: 'var(--font-jetbrains-mono), monospace',
                color: 'rgba(255,255,255,0.4)',
                letterSpacing: '0.3em',
                marginTop: '1.5rem',
                textTransform: 'uppercase',
              }}
            >
              Habitants recensés
            </div>
          </div>

          <div
            className="panel-2-stats"
            style={{
              position: 'absolute',
              bottom: '0',
              left: '0',
              width: '100%',
              zIndex: 10,
              borderTop: '1px solid rgba(255,255,255,0.1)',
            }}
          >
            {/* Colonne 1 : Région géographique */}
            <div
              style={{
                padding: '2vw',
                borderRight: '1px solid rgba(255,255,255,0.1)',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'flex-end',
              }}
            >
              <div
                style={{
                  fontSize: '0.65rem',
                  fontFamily: 'var(--font-jetbrains-mono), monospace',
                  color: 'rgba(255,255,255,0.4)',
                  marginBottom: '0.75rem',
                  letterSpacing: '0.2em',
                }}
              >
                RÉGION
              </div>
              <div
                style={{
                  fontSize: '1.1rem',
                  fontFamily: 'var(--font-dm-sans), sans-serif',
                  fontWeight: 300,
                  opacity: 0.9,
                  lineHeight: 1.2,
                }}
              >
                {country.regionFr}
              </div>
              {country.subregionFr && (
                <div
                  style={{
                    fontSize: '0.7rem',
                    fontFamily: 'var(--font-jetbrains-mono), monospace',
                    color: 'rgba(255,255,255,0.4)',
                    marginTop: '0.4rem',
                    letterSpacing: '0.05em',
                  }}
                >
                  {country.subregionFr}
                </div>
              )}
            </div>

            {/* Colonne 2 : Superficie */}
            <div
              style={{
                padding: '3vw',
                borderRight: '1px solid rgba(255,255,255,0.1)',
              }}
            >
              <div
                style={{
                  fontSize: '0.7rem',
                  fontFamily: 'var(--font-jetbrains-mono), monospace',
                  color: 'var(--text-muted)',
                  marginBottom: '1rem',
                  letterSpacing: '0.1em',
                }}
              >
                SUPERFICIE
              </div>
              <div
                style={{
                  fontSize: '1.5rem',
                  fontFamily: 'var(--font-dm-sans), sans-serif',
                  fontWeight: 300,
                  opacity: 0.9,
                }}
              >
                {new Intl.NumberFormat('fr-FR').format(country.area)}{' '}
                <span style={{ fontSize: '0.9rem', opacity: 0.5 }}>km²</span>
              </div>
            </div>

            {/* Colonne 3 : Densité */}
            <div style={{ padding: '3vw' }}>
              <div
                style={{
                  fontSize: '0.7rem',
                  fontFamily: 'var(--font-jetbrains-mono), monospace',
                  color: 'var(--text-muted)',
                  marginBottom: '1rem',
                  letterSpacing: '0.1em',
                }}
              >
                DENSITÉ
              </div>
              <div
                style={{
                  fontSize: '1.5rem',
                  fontFamily: 'var(--font-dm-sans), sans-serif',
                  fontWeight: 300,
                  opacity: 0.9,
                }}
              >
                {country.area
                  ? Math.round(country.population / country.area)
                  : 'N/A'}{' '}
                <span style={{ fontSize: '0.9rem', opacity: 0.5 }}>
                  hab/km²
                </span>
              </div>
            </div>

          </div>
        </section>

        {/* Panel 3: Régime / Ambiance / Capitale */}
        <section
          className="editorial-panel panel-3-grid"
          style={{
            height: '100vh',
            width: '100%',
            position: 'sticky',
            top: 0,
            zIndex: 3,
            backgroundColor: 'var(--country-background, #05050A)',
            overflow: 'hidden',
          }}
        >
          {/* Colonne gauche : Régime + Ambiance */}
          <div className="panel-3-col">
            {/* Header de colonne */}
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                borderBottom: '1px solid rgba(255,255,255,0.1)',
                paddingBottom: '1.5rem',
                marginBottom: '5vh',
              }}
            >
              <span
                style={{
                  fontSize: '0.65rem',
                  fontFamily: 'var(--font-jetbrains-mono), monospace',
                  color: 'var(--text-muted)',
                  letterSpacing: '0.25em',
                }}
              >
                GOUVERNANCE & AMBIANCE
              </span>
            </div>

            {/* Bloc 01 : Régime */}
            <div
              style={{
                flex: 1,
                borderBottom: '1px solid rgba(255,255,255,0.08)',
                paddingBottom: '5vh',
                marginBottom: '5vh',
              }}
            >
              <div
                style={{
                  fontSize: '0.6rem',
                  fontFamily: 'var(--font-jetbrains-mono), monospace',
                  color: 'var(--text-muted)',
                  letterSpacing: '0.3em',
                  marginBottom: '2.5rem',
                }}
              >
                01 / RÉGIME POLITIQUE
              </div>
              <PoliticalRegime government={country.governmentFr} />
              <p
                style={{
                  marginTop: '2.5rem',
                  fontSize: '0.85rem',
                  lineHeight: 1.8,
                  opacity: 0.55,
                }}
              >
                La structure gouvernementale définit le cadre légal et
                administratif du territoire. Ce régime encadre l&apos;organisation
                des pouvoirs constitutionnels, la représentation citoyenne et la
                délégation des compétences administratives à l&apos;échelle
                nationale.
              </p>
            </div>

            {/* Bloc 02 : Ambiance / Climat */}
            <div style={{ flex: 1 }}>
              <div
                style={{
                  fontSize: '0.6rem',
                  fontFamily: 'var(--font-jetbrains-mono), monospace',
                  color: 'var(--text-muted)',
                  letterSpacing: '0.3em',
                  marginBottom: '2.5rem',
                }}
              >
                02 / AMBIANCE ESTIMÉE
              </div>
              <MoodDisplay country={country} />
            </div>
          </div>

          {/* Séparateur */}
          <div className="panel-3-divider" />

          {/* Colonne droite : Capitale + Coordonnées */}
          <div className="panel-3-col">
            {/* Header de colonne */}
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                borderBottom: '1px solid rgba(255,255,255,0.1)',
                paddingBottom: '1.5rem',
                marginBottom: '5vh',
              }}
            >
              <span
                style={{
                  fontSize: '0.65rem',
                  fontFamily: 'var(--font-jetbrains-mono), monospace',
                  color: 'var(--text-muted)',
                  letterSpacing: '0.25em',
                }}
              >
                CAPITALE & GÉOLOCALISATION
              </span>
            </div>

            {/* Bloc 03 : Horloge capitale */}
            <div
              style={{
                flex: 1,
                borderBottom: '1px solid rgba(255,255,255,0.08)',
                paddingBottom: '5vh',
                marginBottom: '5vh',
              }}
            >
              <div
                style={{
                  fontSize: '0.6rem',
                  fontFamily: 'var(--font-jetbrains-mono), monospace',
                  color: 'var(--text-muted)',
                  letterSpacing: '0.3em',
                  marginBottom: '2.5rem',
                }}
              >
                03 / TEMPS LOCAL
              </div>
              <CapitalClock
                capital={country.capitalFr || country.capital?.[0] || '—'}
                timezone={country.primaryTimezone}
              />
            </div>

            {/* Bloc 04 : Données techniques géo */}
            <div style={{ flex: 1 }}>
              <div
                style={{
                  fontSize: '0.6rem',
                  fontFamily: 'var(--font-jetbrains-mono), monospace',
                  color: 'var(--text-muted)',
                  letterSpacing: '0.3em',
                  marginBottom: '2.5rem',
                }}
              >
                04 / COORDONNÉES GLOBALES
              </div>
              <div className="coord-grid">
                <div>
                  <div
                    style={{
                      fontSize: '0.6rem',
                      fontFamily: 'var(--font-jetbrains-mono), monospace',
                      color: 'var(--text-muted)',
                      letterSpacing: '0.2em',
                      marginBottom: '0.75rem',
                    }}
                  >
                    LATITUDE / LONGITUDE
                  </div>
                  <div
                    style={{
                      fontSize: '1.8rem',
                      fontFamily: 'var(--font-dm-sans), sans-serif',
                      fontWeight: 200,
                      lineHeight: 1.2,
                    }}
                  >
                    {country.latlng && country.latlng.length >= 2 ? (
                      <>
                        {formatLat(country.latlng[0])}
                        <br />
                        {formatLon(country.latlng[1])}
                      </>
                    ) : (
                      'N/A'
                    )}
                  </div>
                </div>
                <div>
                  <div
                    style={{
                      fontSize: '0.6rem',
                      fontFamily: 'var(--font-jetbrains-mono), monospace',
                      color: 'var(--text-muted)',
                      letterSpacing: '0.2em',
                      marginBottom: '0.75rem',
                    }}
                  >
                    DÉCALAGE UTC
                  </div>
                  <div
                    style={{
                      fontSize: '1.8rem',
                      fontFamily: 'var(--font-dm-sans), sans-serif',
                      fontWeight: 200,
                      lineHeight: 1.2,
                    }}
                  >
                    {utcOffset(country.primaryTimezone)}
                  </div>
                  <div
                    style={{
                      marginTop: '0.5rem',
                      fontSize: '0.75rem',
                      fontFamily: 'var(--font-jetbrains-mono), monospace',
                      color: 'var(--text-muted)',
                    }}
                  >
                    {country.primaryTimezone}
                  </div>
                </div>
                <div>
                  <div
                    style={{
                      fontSize: '0.6rem',
                      fontFamily: 'var(--font-jetbrains-mono), monospace',
                      color: 'var(--text-muted)',
                      letterSpacing: '0.2em',
                      marginBottom: '0.75rem',
                    }}
                  >
                    ENCLAVÉ
                  </div>
                  <div
                    style={{
                      fontSize: '1.8rem',
                      fontFamily: 'var(--font-bebas-neue), sans-serif',
                      lineHeight: 1,
                      color: country.landlocked
                        ? 'var(--country-accent)'
                        : '#fff',
                    }}
                  >
                    {country.landlocked ? 'OUI' : 'NON'}
                  </div>
                  <div
                    style={{
                      fontSize: '0.65rem',
                      fontFamily: 'var(--font-jetbrains-mono), monospace',
                      color: 'var(--text-muted)',
                      marginTop: '0.4rem',
                    }}
                  >
                    {country.landlocked
                      ? 'Aucun accès maritime'
                      : 'Accès côtier'}
                  </div>
                </div>
                <div>
                  <div
                    style={{
                      fontSize: '0.6rem',
                      fontFamily: 'var(--font-jetbrains-mono), monospace',
                      color: 'var(--text-muted)',
                      letterSpacing: '0.2em',
                      marginBottom: '0.75rem',
                    }}
                  >
                    FRONTIÈRES
                  </div>
                  <div
                    style={{
                      fontSize: '1.8rem',
                      fontFamily: 'var(--font-bebas-neue), sans-serif',
                      lineHeight: 1,
                      color: '#fff',
                    }}
                  >
                    {country.borders?.length ?? 0}
                  </div>
                  <div
                    style={{
                      fontSize: '0.65rem',
                      fontFamily: 'var(--font-jetbrains-mono), monospace',
                      color: 'var(--text-muted)',
                      marginTop: '0.4rem',
                    }}
                  >
                    {country.borders?.length === 1
                      ? 'pays voisin'
                      : 'pays voisins'}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
        {/* Panel 4: Langues + Monnaie */}
        <section
          className="editorial-panel"
          style={{
            height: '100vh',
            width: '100%',
            position: 'sticky',
            top: 0,
            zIndex: 4,
            background: 'var(--country-primary)',
            color: 'rgba(0,0,0,0.85)',
            display: 'grid',
            gridTemplateColumns: '1fr 1px 1fr',
            overflow: 'hidden',
          }}
        >
          {/* Colonne gauche : Langues */}
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              padding: '8vh 5vw',
            }}
          >
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                borderBottom: '1px solid rgba(0,0,0,0.1)',
                paddingBottom: '1.5rem',
                marginBottom: '5vh',
              }}
            >
              <span
                style={{
                  fontSize: '0.65rem',
                  fontFamily: 'var(--font-jetbrains-mono), monospace',
                  color: 'rgba(0,0,0,0.5)',
                  letterSpacing: '0.25em',
                }}
              >
                LANGUES OFFICIELLES
              </span>
              <span
                style={{
                  fontSize: '0.65rem',
                  fontFamily: 'var(--font-jetbrains-mono), monospace',
                  color: 'rgba(0,0,0,0.35)',
                  letterSpacing: '0.1em',
                }}
              >
                ISO_639
              </span>
            </div>
            <div
              style={{
                flex: 1,
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center',
              }}
            >
              <LanguageList languages={country.languages} />
            </div>
            <p
              style={{
                fontSize: '0.75rem',
                fontFamily: 'var(--font-jetbrains-mono), monospace',
                color: 'rgba(0,0,0,0.4)',
                lineHeight: 1.6,
                borderTop: '1px solid rgba(0,0,0,0.1)',
                paddingTop: '2rem',
              }}
            >
              La diversité linguistique reflète les strates historiques d&apos;un
              territoire et ses influences géopolitiques séculaires.
            </p>
          </div>

          {/* Séparateur */}
          <div style={{ backgroundColor: 'rgba(0,0,0,0.1)', height: '100%' }} />

          {/* Colonne droite : Monnaie */}
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              padding: '8vh 5vw',
              position: 'relative',
              overflow: 'hidden',
            }}
          >
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                borderBottom: '1px solid rgba(0,0,0,0.1)',
                paddingBottom: '1.5rem',
                marginBottom: '5vh',
              }}
            >
              <span
                style={{
                  fontSize: '0.65rem',
                  fontFamily: 'var(--font-jetbrains-mono), monospace',
                  color: 'rgba(0,0,0,0.5)',
                  letterSpacing: '0.25em',
                }}
              >
                ÉCONOMIE & MONNAIE
              </span>
              <span
                style={{
                  fontSize: '0.65rem',
                  fontFamily: 'var(--font-jetbrains-mono), monospace',
                  color: 'rgba(0,0,0,0.35)',
                  letterSpacing: '0.1em',
                }}
              >
                ISO_4217
              </span>
            </div>

            {/* Filigrane symbole monnaie */}
            {country.currencies && Object.keys(country.currencies)[0] && (
              <div
                style={{
                  position: 'absolute',
                  bottom: '-5vh',
                  right: '-2vw',
                  fontSize: '50vw',
                  fontWeight: 900,
                  color: 'rgba(0,0,0,0.04)',
                  lineHeight: 1,
                  pointerEvents: 'none',
                  userSelect: 'none',
                }}
              >
                {country.currencies[Object.keys(country.currencies)[0]]
                  .symbol || Object.keys(country.currencies)[0]}
              </div>
            )}

            <div
              style={{
                flex: 1,
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center',
                position: 'relative',
                zIndex: 2,
              }}
            >
              <CurrencyCard currencies={country.currencies} />
            </div>
          </div>
        </section>
        {/* Panel 5 : Réseau, Partage & Voisins */}
        <section
          className="editorial-panel"
          style={{
            minHeight: '100vh',
            width: '100%',
            position: 'relative',
            zIndex: 5,
            backgroundColor: 'var(--country-background, #05050A)',
            display: 'flex',
            flexDirection: 'column',
          }}
        >
          {/* Barre header pleine largeur */}
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              borderBottom: '1px solid rgba(255,255,255,0.1)',
              padding: '4vh 5vw',
            }}
          >
            <span
              style={{
                fontSize: '0.65rem',
                fontFamily: 'var(--font-jetbrains-mono), monospace',
                color: 'var(--text-muted)',
                letterSpacing: '0.25em',
              }}
            >
              RÉSEAU & COMMUNICATIONS
            </span>
            <span
              style={{
                fontSize: '0.65rem',
                fontFamily: 'var(--font-jetbrains-mono), monospace',
                color: 'var(--country-accent)',
                letterSpacing: '0.1em',
              }}
            >
              TLD & IDD
            </span>
          </div>

          {/* Grille de données réseau : 3 colonnes */}
          <div className="panel-5-grid">
            {/* Col 1 : Indicatif téléphonique */}
            <div
              style={{
                padding: '5vh 5vw',
                display: 'flex',
                flexDirection: 'column',
              }}
            >
              <div
                style={{
                  fontSize: '0.6rem',
                  fontFamily: 'var(--font-jetbrains-mono), monospace',
                  color: 'var(--text-muted)',
                  letterSpacing: '0.3em',
                  marginBottom: '3rem',
                }}
              >
                05 / INDICATIF TÉLÉPHONIQUE
              </div>
              <div
                style={{
                  flex: 1,
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'center',
                }}
              >
                <div
                  style={{
                    fontSize: 'clamp(4rem, 10vw, 12rem)',
                    fontFamily: 'var(--font-bebas-neue), sans-serif',
                    lineHeight: 0.9,
                    color: 'var(--country-accent)',
                  }}
                >
                  {(country.idd?.root || '') +
                    (country.idd?.suffixes?.[0] || '') || '—'}
                </div>
                <div
                  style={{
                    marginTop: '2rem',
                    fontSize: '0.75rem',
                    fontFamily: 'var(--font-jetbrains-mono), monospace',
                    color: 'var(--text-muted)',
                    lineHeight: 1.6,
                  }}
                >
                  Code d&apos;appel international alloué par l&apos;UIT (Union
                  Internationale des Télécommunications).
                </div>
              </div>
            </div>

            {/* Col 2 : TLD Internet */}
            <div
              style={{
                padding: '5vh 5vw',
                display: 'flex',
                flexDirection: 'column',
              }}
            >
              <div
                style={{
                  fontSize: '0.6rem',
                  fontFamily: 'var(--font-jetbrains-mono), monospace',
                  color: 'var(--text-muted)',
                  letterSpacing: '0.3em',
                  marginBottom: '3rem',
                }}
              >
                06 / DOMAINE INTERNET (TLD)
              </div>
              <div
                style={{
                  flex: 1,
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'center',
                }}
              >
                <div
                  style={{
                    fontSize: 'clamp(4rem, 10vw, 12rem)',
                    fontFamily: 'var(--font-bebas-neue), sans-serif',
                    lineHeight: 0.9,
                    color: '#fff',
                  }}
                >
                  {country.tld?.[0] ?? '—'}
                </div>
                {country.tld && country.tld.length > 1 && (
                  <div
                    style={{
                      marginTop: '1rem',
                      display: 'flex',
                      gap: '1rem',
                      flexWrap: 'wrap',
                    }}
                  >
                    {country.tld.slice(1).map((t: string) => (
                      <span
                        key={t}
                        style={{
                          fontSize: '1rem',
                          fontFamily: 'var(--font-jetbrains-mono), monospace',
                          color: 'var(--text-muted)',
                          borderBottom: '1px solid rgba(255,255,255,0.2)',
                          paddingBottom: '2px',
                        }}
                      >
                        {t}
                      </span>
                    ))}
                  </div>
                )}
                <div
                  style={{
                    marginTop: '2rem',
                    fontSize: '0.75rem',
                    fontFamily: 'var(--font-jetbrains-mono), monospace',
                    color: 'var(--text-muted)',
                    lineHeight: 1.6,
                  }}
                >
                  Domaine de premier niveau géographique géré par l&apos;ICANN pour
                  l&apos;espace numérique souverain.
                </div>
              </div>
            </div>

            {/* Col 3 : Partager */}
            <div
              style={{
                padding: '5vh 5vw',
                display: 'flex',
                flexDirection: 'column',
              }}
            >
              <div
                style={{
                  fontSize: '0.6rem',
                  fontFamily: 'var(--font-jetbrains-mono), monospace',
                  color: 'var(--text-muted)',
                  letterSpacing: '0.3em',
                  marginBottom: '3rem',
                }}
              >
                07 / PARTAGER
              </div>
              <div
                style={{
                  flex: 1,
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'center',
                }}
              >
                <p
                  style={{
                    fontSize: '0.85rem',
                    fontFamily: 'var(--font-jetbrains-mono), monospace',
                    lineHeight: 1.8,
                    opacity: 0.5,
                    marginBottom: '4rem',
                  }}
                >
                  Diffusez cet atlas numérique. Chaque lien partagé étend la
                  connaissance géopolitique du monde.
                </p>
                <ShareButton
                  url={canonicalUrl}
                  title={`${country.nameFr} · ATLAS°`}
                />
              </div>
            </div>
          </div>

          {mdxContent.source && (
            <div
              style={{
                maxWidth: '800px',
                margin: '0 auto',
                marginBottom: '20vh',
                padding: '0 5vw',
              }}
            >
              <h3
                style={{
                  fontSize: '0.8rem',
                  fontFamily: 'var(--font-jetbrains-mono), monospace',
                  color: 'var(--text-muted)',
                  marginBottom: '4rem',
                  letterSpacing: '0.2em',
                  textAlign: 'center',
                }}
              >
                08 / ARCHIVES
              </h3>
              <MDXSection content={mdxContent} />
            </div>
          )}

          {country.borders.length > 0 && (
            <div
              style={{
                borderTop: '1px solid rgba(255,255,255,0.1)',
                paddingTop: '10vh',
                paddingBottom: '15vh',
                paddingLeft: '5vw',
                paddingRight: '5vw',
              }}
            >
              <h3
                style={{
                  fontSize: '0.8rem',
                  fontFamily: 'var(--font-jetbrains-mono), monospace',
                  color: 'var(--text-muted)',
                  marginBottom: '5vh',
                  letterSpacing: '0.2em',
                }}
              >
                09 / FRONTIÈRES TERRESTRES
              </h3>
              <NeighborCards
                borders={country.borders}
                allCountries={allCountries}
              />
            </div>
          )}
        </section>

        <CountryFooter current={country} allCountries={allCountries} />
      </div>

      <style jsx>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }
      `}</style>
    </>
  );
}

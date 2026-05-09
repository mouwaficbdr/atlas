'use client';

import { useEffect, useRef } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import Lenis from 'lenis';
import type { CountryData, MDXContent, CountryPalette } from '@/lib/types';
import dynamic from 'next/dynamic';

import FlagDisplay from './FlagDisplay';
import CapitalClock from './CapitalClock';
import LanguageList from './LanguageList';
import NeighborCards from './NeighborCards';
import TerminalInfo from './TerminalInfo';
import MoodDisplay from './MoodDisplay';
import PoliticalRegime from './PoliticalRegime';
import MDXSection from './MDXSection';

const PopulationCloud = dynamic(() => import('./PopulationCloud'), {
  ssr: false,
});
const CurrencyCard = dynamic(() => import('./CurrencyCard'), { ssr: false });
const MoodBackground = dynamic(() => import('./MoodBackground'), {
  ssr: false,
});
import Breadcrumb from './Breadcrumb';
import ShareButton from './ShareButton';
import { resolveMood } from '@/lib/mood-resolver';
import MoodAudio from './MoodAudio';

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
  const mood = resolveMood(country);


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
    const lenis = new Lenis({
      duration: 1.2,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      smoothWheel: true,
      syncTouch: false,
    });

    ScrollTrigger.scrollerProxy(window, {
      scrollTop(value) {
        if (arguments.length)
          lenis.scrollTo(value as number, { immediate: true });
        return lenis.actualScroll;
      },
      getBoundingClientRect() {
        return {
          top: 0,
          left: 0,
          width: window.innerWidth,
          height: window.innerHeight,
        };
      },
      pinType: 'transform',
    });

    lenis.on('scroll', ScrollTrigger.update);
    gsap.ticker.add((time) => lenis.raf(time * 1000));

    return () => {
      lenis.destroy();
      gsap.ticker.remove((time) => lenis.raf(time * 1000));
    };
  }, []);

  useEffect(() => {
    // We remove the complex GSAP parallax to let the pure CSS sticky wipe shine,
    // but we keep a simple entrance animation for the title.
    if (titleRef.current) {
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
      <MoodAudio mood={mood.type} />

      <div
        ref={containerRef}
        style={{
          color: 'var(--text-primary)',
          position: 'relative',
          width: '100%',
          minHeight: '100vh',
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
              fontSize: country.name.common.length <= 6
                ? 'clamp(7rem, 18vw, 22rem)'
                : country.name.common.length <= 10
                ? 'clamp(5rem, 13vw, 17rem)'
                : country.name.common.length <= 15
                ? 'clamp(4rem, 10vw, 13rem)'
                : country.name.common.length <= 20
                ? 'clamp(3rem, 7.5vw, 10rem)'
                : 'clamp(2.5rem, 5.5vw, 7rem)',
              fontWeight: 400,
              fontFamily: 'var(--font-bebas-neue), Impact, sans-serif',
              color: 'var(--country-primary)',
              lineHeight: 0.85,
              textAlign: 'center',
              mixBlendMode: 'screen',
              opacity: 0.9,
              // Pas de nowrap : on autorise le retour à la ligne sur noms très longs
              wordBreak: 'break-word',
              hyphens: 'auto',
              textTransform: 'uppercase',
              textShadow: '0 10px 30px rgba(0,0,0,0.5)',
              maxWidth: '90vw',
            }}
          >
            {country.name.common}
          </h1>
          {/* Nom officiel en sous-titre technique — toujours lisible quelle que soit la longueur */}
          {country.name.official !== country.name.common && (
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
              {country.name.official}
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
            padding: '4rem',
            background: 'transparent',
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
              continent={country.region}
              countryName={country.name.common}
            />
          </div>
          <FlagDisplay
            flagSvg={country.flags.svg}
            countryName={country.name.common}
          />

          {/* Fallback élégant si pas de résumé Wikipedia */}
          {wikiSummary === null && (
            <div
              style={{
                position: 'absolute',
                bottom: '10vh',
                right: '5vw',
                width: '400px',
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
            <div
              style={{
                position: 'absolute',
                bottom: '10vh',
                right: '5vw',
                width: '400px',
                zIndex: 30,
                borderTop: '1px solid var(--country-accent)',
                paddingTop: '1.5rem',
                mixBlendMode: 'difference',
              }}
            >
              <h4
                style={{
                  fontSize: '0.6rem',
                  fontFamily: 'var(--font-jetbrains-mono), monospace',
                  color: 'var(--country-accent)',
                  marginBottom: '1.5rem',
                  letterSpacing: '0.2em',
                }}
              >
                WIKIPEDIA EXTRACT
              </h4>
              <p
                style={{
                  fontSize: '0.85rem',
                  lineHeight: 1.8,
                  color: '#fff',
                  textAlign: 'justify',
                }}
              >
                {wikiSummary.slice(0, 350)}...
              </p>
            </div>
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
              opacity: 0.5,
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

          {/* Chiffre géant centré — taille adaptative selon nombre de chiffres */}
          <div
            style={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              zIndex: 10,
              mixBlendMode: 'difference',
              width: '100%',
              textAlign: 'center',
              padding: '0 3vw',
            }}
          >
            <div
              style={{
                // Population mondiale max ~10 chiffres (8 000 000 000)
                // On adapte la taille selon le nombre de chiffres du nombre formaté (avec espaces)
                fontSize: country.population >= 1_000_000_000
                  ? 'clamp(5rem, 12vw, 16rem)'   // ≥ 1 milliard — très long
                  : country.population >= 100_000_000
                  ? 'clamp(6rem, 14vw, 19rem)'   // ≥ 100 millions
                  : country.population >= 10_000_000
                  ? 'clamp(7rem, 17vw, 22rem)'   // ≥ 10 millions
                  : 'clamp(8rem, 20vw, 26rem)',   // < 10 millions — court, on peut y aller fort
                fontFamily: 'var(--font-bebas-neue), sans-serif',
                color: '#fff',
                lineHeight: 0.85,
                letterSpacing: '-0.03em',
                // Pas de nowrap — le Intl.NumberFormat avec fr-FR insère des espaces insécables
                // qui servent de points de coupure naturels si nécessaire
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
            style={{
              position: 'absolute',
              bottom: '0',
              left: '0',
              width: '100%',
              zIndex: 10,
              display: 'grid',
              gridTemplateColumns: 'repeat(4, 1fr)',
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
                {country.region}
              </div>
              {country.subregion && (
                <div
                  style={{
                    fontSize: '0.7rem',
                    fontFamily: 'var(--font-jetbrains-mono), monospace',
                    color: 'rgba(255,255,255,0.4)',
                    marginTop: '0.4rem',
                    letterSpacing: '0.05em',
                  }}
                >
                  {country.subregion}
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

            {/* Colonne 4 : Croissance (Abstract) */}
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
                TENDANCE GLOBALE
              </div>
              <div
                style={{
                  fontSize: '1.5rem',
                  fontFamily: 'var(--font-dm-sans), sans-serif',
                  fontWeight: 300,
                  color: 'var(--country-accent)',
                }}
              >
                CROISSANCE
              </div>
            </div>
          </div>
        </section>

        {/* Panel 3: Régime / Ambiance / Capitale */}
        <section
          className="editorial-panel"
          style={{
            height: '100vh',
            width: '100%',
            position: 'sticky',
            top: 0,
            zIndex: 3,
            backgroundColor: 'var(--country-background, #05050A)',
            display: 'grid',
            gridTemplateColumns: '1fr 1px 1fr',
            overflow: 'hidden',
          }}
        >
          {/* Colonne gauche : Régime + Ambiance */}
          <div style={{ display: 'flex', flexDirection: 'column', padding: '8vh 5vw' }}>
            {/* Header de colonne */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '1.5rem', marginBottom: '5vh' }}>
              <span style={{ fontSize: '0.65rem', fontFamily: 'var(--font-jetbrains-mono), monospace', color: 'var(--text-muted)', letterSpacing: '0.25em' }}>GOUVERNANCE & CLIMAT</span>
            </div>

            {/* Bloc 01 : Régime */}
            <div style={{ flex: 1, borderBottom: '1px solid rgba(255,255,255,0.08)', paddingBottom: '5vh', marginBottom: '5vh' }}>
              <div style={{ fontSize: '0.6rem', fontFamily: 'var(--font-jetbrains-mono), monospace', color: 'var(--text-muted)', letterSpacing: '0.3em', marginBottom: '2.5rem' }}>01 — RÉGIME POLITIQUE</div>
              <PoliticalRegime officialName={country.name.official} />
              <p style={{ marginTop: '2.5rem', fontSize: '0.85rem', lineHeight: 1.8, opacity: 0.55, textAlign: 'justify' }}>
                La structure gouvernementale définit le cadre légal et administratif du territoire. Ce régime encadre l'organisation des pouvoirs constitutionnels, la représentation citoyenne et la délégation des compétences administratives à l'échelle nationale.
              </p>
            </div>

            {/* Bloc 02 : Ambiance / Climat */}
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: '0.6rem', fontFamily: 'var(--font-jetbrains-mono), monospace', color: 'var(--text-muted)', letterSpacing: '0.3em', marginBottom: '2.5rem' }}>02 — CLIMAT & AMBIANCE</div>
              <MoodDisplay country={country} />
            </div>
          </div>

          {/* Séparateur vertical */}
          <div style={{ backgroundColor: 'rgba(255,255,255,0.1)', height: '100%' }} />

          {/* Colonne droite : Capitale + Coordonnées */}
          <div style={{ display: 'flex', flexDirection: 'column', padding: '8vh 5vw' }}>
            {/* Header de colonne */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '1.5rem', marginBottom: '5vh' }}>
              <span style={{ fontSize: '0.65rem', fontFamily: 'var(--font-jetbrains-mono), monospace', color: 'var(--text-muted)', letterSpacing: '0.25em' }}>CAPITALE & GÉOLOCALISATION</span>
            </div>

            {/* Bloc 03 : Horloge capitale */}
            <div style={{ flex: 1, borderBottom: '1px solid rgba(255,255,255,0.08)', paddingBottom: '5vh', marginBottom: '5vh' }}>
              <div style={{ fontSize: '0.6rem', fontFamily: 'var(--font-jetbrains-mono), monospace', color: 'var(--text-muted)', letterSpacing: '0.3em', marginBottom: '2.5rem' }}>03 — TEMPS LOCAL</div>
              <CapitalClock capital={country.capital} timezones={country.timezones} />
            </div>

            {/* Bloc 04 : Données techniques géo */}
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: '0.6rem', fontFamily: 'var(--font-jetbrains-mono), monospace', color: 'var(--text-muted)', letterSpacing: '0.3em', marginBottom: '2.5rem' }}>04 — COORDONNÉES GLOBALES</div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '3rem' }}>
                <div>
                  <div style={{ fontSize: '0.6rem', fontFamily: 'var(--font-jetbrains-mono), monospace', color: 'var(--text-muted)', letterSpacing: '0.2em', marginBottom: '0.75rem' }}>LATITUDE / LONGITUDE</div>
                  <div style={{ fontSize: '1.8rem', fontFamily: 'var(--font-dm-sans), sans-serif', fontWeight: 200, lineHeight: 1.2 }}>
                    {country.latlng && country.latlng.length >= 2 ? (
                      <>
                        {country.latlng[0].toFixed(4)}<span style={{ fontSize: '1rem', opacity: 0.4 }}>° N</span><br />
                        {country.latlng[1].toFixed(4)}<span style={{ fontSize: '1rem', opacity: 0.4 }}>° E</span>
                      </>
                    ) : 'N/A'}
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: '0.6rem', fontFamily: 'var(--font-jetbrains-mono), monospace', color: 'var(--text-muted)', letterSpacing: '0.2em', marginBottom: '0.75rem' }}>DÉCALAGE UTC</div>
                  <div style={{ fontSize: '1.8rem', fontFamily: 'var(--font-dm-sans), sans-serif', fontWeight: 200, lineHeight: 1.2 }}>
                    {country.timezones && country.timezones.length > 0 ? country.timezones[0] : 'N/A'}
                  </div>
                  {country.timezones && country.timezones.length > 1 && (
                    <div style={{ marginTop: '0.5rem', fontSize: '0.75rem', fontFamily: 'var(--font-jetbrains-mono), monospace', color: 'var(--text-muted)' }}>
                      +{country.timezones.length - 1} zone{country.timezones.length > 2 ? 's' : ''}
                    </div>
                  )}
                </div>
                <div>
                  <div style={{ fontSize: '0.6rem', fontFamily: 'var(--font-jetbrains-mono), monospace', color: 'var(--text-muted)', letterSpacing: '0.2em', marginBottom: '0.75rem' }}>ENCLAVÉ</div>
                  <div style={{ fontSize: '1.8rem', fontFamily: 'var(--font-bebas-neue), sans-serif', lineHeight: 1, color: country.landlocked ? 'var(--country-accent)' : '#fff' }}>
                    {country.landlocked ? 'OUI' : 'NON'}
                  </div>
                  <div style={{ fontSize: '0.65rem', fontFamily: 'var(--font-jetbrains-mono), monospace', color: 'var(--text-muted)', marginTop: '0.4rem' }}>
                    {country.landlocked ? 'Aucun accès maritime' : 'Accès côtier'}
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: '0.6rem', fontFamily: 'var(--font-jetbrains-mono), monospace', color: 'var(--text-muted)', letterSpacing: '0.2em', marginBottom: '0.75rem' }}>FRONTIÈRES</div>
                  <div style={{ fontSize: '1.8rem', fontFamily: 'var(--font-bebas-neue), sans-serif', lineHeight: 1, color: '#fff' }}>
                    {country.borders?.length ?? 0}
                  </div>
                  <div style={{ fontSize: '0.65rem', fontFamily: 'var(--font-jetbrains-mono), monospace', color: 'var(--text-muted)', marginTop: '0.4rem' }}>
                    {country.borders?.length === 1 ? 'pays voisin' : 'pays voisins'}
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
          <div style={{ display: 'flex', flexDirection: 'column', padding: '8vh 5vw' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid rgba(0,0,0,0.1)', paddingBottom: '1.5rem', marginBottom: '5vh' }}>
              <span style={{ fontSize: '0.65rem', fontFamily: 'var(--font-jetbrains-mono), monospace', color: 'rgba(0,0,0,0.5)', letterSpacing: '0.25em' }}>LANGUES OFFICIELLES</span>
              <span style={{ fontSize: '0.65rem', fontFamily: 'var(--font-jetbrains-mono), monospace', color: 'rgba(0,0,0,0.35)', letterSpacing: '0.1em' }}>ISO_639</span>
            </div>
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
              <LanguageList languages={country.languages} />
            </div>
            <p style={{ fontSize: '0.75rem', fontFamily: 'var(--font-jetbrains-mono), monospace', color: 'rgba(0,0,0,0.4)', lineHeight: 1.6, borderTop: '1px solid rgba(0,0,0,0.1)', paddingTop: '2rem' }}>
              La diversité linguistique reflète les strates historiques d'un territoire et ses influences géopolitiques séculaires.
            </p>
          </div>

          {/* Séparateur */}
          <div style={{ backgroundColor: 'rgba(0,0,0,0.1)', height: '100%' }} />

          {/* Colonne droite : Monnaie */}
          <div style={{ display: 'flex', flexDirection: 'column', padding: '8vh 5vw', position: 'relative', overflow: 'hidden' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid rgba(0,0,0,0.1)', paddingBottom: '1.5rem', marginBottom: '5vh' }}>
              <span style={{ fontSize: '0.65rem', fontFamily: 'var(--font-jetbrains-mono), monospace', color: 'rgba(0,0,0,0.5)', letterSpacing: '0.25em' }}>ÉCONOMIE & MONNAIE</span>
              <span style={{ fontSize: '0.65rem', fontFamily: 'var(--font-jetbrains-mono), monospace', color: 'rgba(0,0,0,0.35)', letterSpacing: '0.1em' }}>ISO_4217</span>
            </div>

            {/* Filigrane symbole monnaie */}
            {country.currencies && Object.keys(country.currencies)[0] && (
              <div style={{
                position: 'absolute',
                bottom: '-5vh',
                right: '-2vw',
                fontSize: '50vw',
                fontWeight: 900,
                color: 'rgba(0,0,0,0.04)',
                lineHeight: 1,
                pointerEvents: 'none',
                userSelect: 'none',
              }}>
                {country.currencies[Object.keys(country.currencies)[0]].symbol || Object.keys(country.currencies)[0]}
              </div>
            )}

            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', position: 'relative', zIndex: 2 }}>
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
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid rgba(255,255,255,0.1)', padding: '4vh 5vw' }}>
            <span style={{ fontSize: '0.65rem', fontFamily: 'var(--font-jetbrains-mono), monospace', color: 'var(--text-muted)', letterSpacing: '0.25em' }}>RÉSEAU & COMMUNICATIONS</span>
            <span style={{ fontSize: '0.65rem', fontFamily: 'var(--font-jetbrains-mono), monospace', color: 'var(--country-accent)', letterSpacing: '0.1em' }}>TLD & IDD</span>
          </div>

          {/* Grille de données réseau : 3 colonnes */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', flex: 1 }}>
            {/* Col 1 : Indicatif téléphonique */}
            <div style={{ padding: '5vh 5vw', borderRight: '1px solid rgba(255,255,255,0.08)', display: 'flex', flexDirection: 'column' }}>
              <div style={{ fontSize: '0.6rem', fontFamily: 'var(--font-jetbrains-mono), monospace', color: 'var(--text-muted)', letterSpacing: '0.3em', marginBottom: '3rem' }}>05 / INDICATIF TÉLÉPHONIQUE</div>
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                <div style={{ fontSize: 'clamp(4rem, 10vw, 12rem)', fontFamily: 'var(--font-bebas-neue), sans-serif', lineHeight: 0.9, color: 'var(--country-accent)' }}>
                  {(country.idd?.root || '') + (country.idd?.suffixes?.[0] || '') || '—'}
                </div>
                <div style={{ marginTop: '2rem', fontSize: '0.75rem', fontFamily: 'var(--font-jetbrains-mono), monospace', color: 'var(--text-muted)', lineHeight: 1.6 }}>
                  Code d'appel international alloué par l'UIT (Union Internationale des Télécommunications).
                </div>
              </div>
            </div>

            {/* Col 2 : TLD Internet */}
            <div style={{ padding: '5vh 5vw', borderRight: '1px solid rgba(255,255,255,0.08)', display: 'flex', flexDirection: 'column' }}>
              <div style={{ fontSize: '0.6rem', fontFamily: 'var(--font-jetbrains-mono), monospace', color: 'var(--text-muted)', letterSpacing: '0.3em', marginBottom: '3rem' }}>06 / DOMAINE INTERNET (TLD)</div>
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                <div style={{ fontSize: 'clamp(4rem, 10vw, 12rem)', fontFamily: 'var(--font-bebas-neue), sans-serif', lineHeight: 0.9, color: '#fff' }}>
                  {country.tld?.[0] ?? '—'}
                </div>
                {country.tld && country.tld.length > 1 && (
                  <div style={{ marginTop: '1rem', display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
                    {country.tld.slice(1).map((t: string) => (
                      <span key={t} style={{ fontSize: '1rem', fontFamily: 'var(--font-jetbrains-mono), monospace', color: 'var(--text-muted)', borderBottom: '1px solid rgba(255,255,255,0.2)', paddingBottom: '2px' }}>{t}</span>
                    ))}
                  </div>
                )}
                <div style={{ marginTop: '2rem', fontSize: '0.75rem', fontFamily: 'var(--font-jetbrains-mono), monospace', color: 'var(--text-muted)', lineHeight: 1.6 }}>
                  Domaine de premier niveau géographique géré par l'ICANN pour l'espace numérique souverain.
                </div>
              </div>
            </div>

            {/* Col 3 : Partager */}
            <div style={{ padding: '5vh 5vw', display: 'flex', flexDirection: 'column' }}>
              <div style={{ fontSize: '0.6rem', fontFamily: 'var(--font-jetbrains-mono), monospace', color: 'var(--text-muted)', letterSpacing: '0.3em', marginBottom: '3rem' }}>07 / PARTAGER</div>
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                <p style={{ fontSize: '0.85rem', fontFamily: 'var(--font-jetbrains-mono), monospace', lineHeight: 1.8, opacity: 0.5, marginBottom: '4rem' }}>
                  Diffusez cet atlas numérique. Chaque lien partagé étend la connaissance géopolitique du monde.
                </p>
                <ShareButton url={canonicalUrl} />
              </div>
            </div>
          </div>

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
      </div>
    </>
  );
}

'use client';

import { useEffect, useRef } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import Lenis from 'lenis';
import type { CountryData, MDXContent, CountryPalette } from '@/lib/types';
import FlagDisplay from './FlagDisplay';
import PopulationCloud from './PopulationCloud';
import AreaRect from './AreaRect';
import CapitalClock from './CapitalClock';
import LanguageList from './LanguageList';
import CurrencyCard from './CurrencyCard';
import NeighborCards from './NeighborCards';
import RegionBadge from './RegionBadge';
import TerminalInfo from './TerminalInfo';
import MoodDisplay from './MoodDisplay';
import MDXSection from './MDXSection';
import Breadcrumb from './Breadcrumb';
import ShareButton from './ShareButton';

gsap.registerPlugin(ScrollTrigger);

interface CountryCardProps {
  country: CountryData;
  allCountries: CountryData[];
  mdxContent: MDXContent;
  palette: CountryPalette;
  canonicalUrl: string;
}


export default function CountryCard({
  country,
  allCountries,
  mdxContent,
  palette,
  canonicalUrl,
}: CountryCardProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const lenisRef = useRef<Lenis | null>(null);

  useEffect(() => {
    // Apply palette as CSS variables
    if (containerRef.current) {
      containerRef.current.style.setProperty('--palette-primary', palette.primary);
      containerRef.current.style.setProperty('--palette-secondary', palette.secondary);
      containerRef.current.style.setProperty('--palette-accent', palette.accent);
      containerRef.current.style.setProperty('--palette-background', palette.background);
    }
  }, [palette]);

  useEffect(() => {
    // Initialize Lenis for smooth scrolling
    const lenis = new Lenis({
      duration: 1.2,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      smoothWheel: true,
      syncTouch: false,
    });

    lenisRef.current = lenis;

    // Integrate Lenis with ScrollTrigger
    ScrollTrigger.scrollerProxy(window, {
      scrollTop(value) {
        if (arguments.length) {
          lenis.scrollTo(value as number, { immediate: true });
        }
        return lenis.actualScroll;
      },
      getBoundingClientRect() {
        return {
          top: 0,
          left: 0,
          width: window.innerWidth,
          height: window.innerHeight,
          right: window.innerWidth,
          bottom: window.innerHeight,
        };
      },
      pinType: 'transform',
    });

    // Update ScrollTrigger on Lenis scroll
    lenis.on('scroll', ScrollTrigger.update);

    // Sync GSAP animations with Lenis
    gsap.ticker.add((time) => {
      lenis.raf(time * 1000);
    });

    return () => {
      lenis.destroy();
      gsap.ticker.remove((time) => {
        lenis.raf(time * 1000);
      });
    };
  }, []);

  useEffect(() => {
    // ScrollTrigger animations with stagger
    const sections = containerRef.current?.querySelectorAll('[data-animate]');
    if (!sections) return;

    sections.forEach((section, idx) => {
      gsap.fromTo(
        section,
        { opacity: 0, y: 30 },
        {
          opacity: 1,
          y: 0,
          duration: 0.8,
          ease: 'power2.out',
          scrollTrigger: {
            trigger: section,
            start: 'top 80%',
            end: 'top 50%',
            scrub: false,
          },
          delay: idx * 0.1,
        }
      );
    });

    return () => {
      ScrollTrigger.getAll().forEach((trigger) => trigger.kill());
    };
  }, []);

  // Handle keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Tab navigation is handled natively by the browser
      // We just need to ensure proper focus management

      // Enter/Space on focused interactive elements
      if ((e.key === 'Enter' || e.key === ' ') && document.activeElement) {
        const activeElement = document.activeElement as HTMLElement;

        // Check if it's a button or link
        if (activeElement.tagName === 'BUTTON' || activeElement.tagName === 'A') {
          if (e.key === ' ') {
            e.preventDefault();
            activeElement.click();
          }
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  return (
    <div
      ref={containerRef}
      style={{
        backgroundColor: 'var(--bg-surface)',
        color: 'var(--text-primary)',
        minHeight: '100vh',
        padding: '2rem',
      }}
    >
      <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
        <div tabIndex={0} style={{ outline: 'none' }}>
          <Breadcrumb continent={country.region} countryName={country.name.common} />
        </div>

        <div data-animate style={{ marginTop: '2rem' }} tabIndex={0}>
          <h1 style={{ fontSize: '3rem', fontWeight: 700, marginBottom: '1rem' }}>
            {country.name.official}
          </h1>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem', marginTop: '2rem' }}>
          <div data-animate tabIndex={0}>
            <FlagDisplay flagSvg={country.flags.svg} countryName={country.name.common} />
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
            <div data-animate tabIndex={0}>
              <h2 style={{ fontSize: '1.2rem', marginBottom: '1rem' }}>Population</h2>
              <PopulationCloud population={country.population} />
            </div>

            <div data-animate tabIndex={0}>
              <h2 style={{ fontSize: '1.2rem', marginBottom: '1rem' }}>Superficie</h2>
              <AreaRect area={country.area} countryName={country.name.common} />
            </div>
          </div>
        </div>

        <div style={{ marginTop: '3rem', display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '2rem' }}>
          <div data-animate tabIndex={0}>
            <h2 style={{ fontSize: '1.2rem', marginBottom: '1rem' }}>Capitale</h2>
            <CapitalClock capital={country.capital} timezones={country.timezones} />
          </div>

          <div data-animate tabIndex={0}>
            <h2 style={{ fontSize: '1.2rem', marginBottom: '1rem' }}>Langues</h2>
            <LanguageList languages={country.languages} />
          </div>

          <div data-animate tabIndex={0}>
            <h2 style={{ fontSize: '1.2rem', marginBottom: '1rem' }}>Monnaie</h2>
            <CurrencyCard currencies={country.currencies} />
          </div>

          <div data-animate tabIndex={0}>
            <h2 style={{ fontSize: '1.2rem', marginBottom: '1rem' }}>Région</h2>
            <RegionBadge country={country} allCountries={allCountries} />
          </div>

          <div data-animate tabIndex={0}>
            <h2 style={{ fontSize: '1.2rem', marginBottom: '1rem' }}>Ambiance</h2>
            <MoodDisplay country={country} />
          </div>

          <div data-animate tabIndex={0}>
            <h2 style={{ fontSize: '1.2rem', marginBottom: '1rem' }}>Infos</h2>
            <TerminalInfo idd={country.idd} tld={country.tld} />
          </div>
        </div>

        {country.borders.length > 0 && (
          <div data-animate style={{ marginTop: '3rem' }} tabIndex={0}>
            <h2 style={{ fontSize: '1.2rem', marginBottom: '1rem' }}>Pays voisins</h2>
            <NeighborCards borders={country.borders} allCountries={allCountries} />
          </div>
        )}

        <div data-animate style={{ marginTop: '3rem' }} tabIndex={0}>
          <h2 style={{ fontSize: '1.2rem', marginBottom: '1rem' }}>Partager</h2>
          <ShareButton url={canonicalUrl} />
        </div>

        <div data-animate tabIndex={0}>
          <MDXSection content={mdxContent} />
        </div>
      </div>
    </div>
  );
}

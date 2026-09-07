'use client';

import { useEffect, useRef, useState, useMemo } from 'react';
import Image from 'next/image';
import { gsap } from 'gsap';
import { filterCountries } from '@/lib/search-engine';
import type { CountryData } from '@/lib/types';

interface MobileExplorerProps {
  countries: CountryData[];
  isOpen: boolean;
  onClose: () => void;
  onSelect: (cca3: string) => void;
}

export default function MobileExplorer({ countries, isOpen, onClose, onSelect }: MobileExplorerProps) {
  const [query, setQuery] = useState('');
  const overlayRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Derive grouped countries for default index view
  const groupedCountries = useMemo(() => {
    const groups: Record<string, CountryData[]> = {};
    countries.forEach(c => {
      const region = c.regionFr || c.region || 'Autres';
      if (!groups[region]) groups[region] = [];
      groups[region].push(c);
    });

    const sortedRegions = Object.keys(groups).sort((a, b) =>
      a.localeCompare(b, 'fr'),
    );

    sortedRegions.forEach(region => {
      groups[region].sort((a, b) => a.nameFr.localeCompare(b.nameFr, 'fr'));
    });

    return { regions: sortedRegions, groups };
  }, [countries]);

  // Derived search results
  const searchResults = useMemo(() => {
    if (!query.trim()) return null;
    return filterCountries(query, countries);
  }, [query, countries]);

  // Animations
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      if (overlayRef.current && contentRef.current) {
        gsap.fromTo(overlayRef.current,
          { opacity: 0 },
          { opacity: 1, duration: 0.4, ease: 'power2.out' }
        );
        gsap.fromTo(contentRef.current,
          { y: '100%' },
          { y: '0%', duration: 0.6, ease: 'power3.out' }
        );
      }
      setTimeout(() => inputRef.current?.focus(), 100);
    } else {
      document.body.style.overflow = '';
      setQuery(''); // Reset query when closed
    }
  }, [isOpen]);

  const handleClose = () => {
    if (overlayRef.current && contentRef.current) {
      gsap.to(contentRef.current, { y: '100%', duration: 0.5, ease: 'power3.in' });
      gsap.to(overlayRef.current, { opacity: 0, duration: 0.4, delay: 0.1, ease: 'power2.in', onComplete: onClose });
    } else {
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div
      ref={overlayRef}
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(0,0,0,0.8)',
        backdropFilter: 'blur(20px)',
        zIndex: 9999,
        display: 'flex',
        flexDirection: 'column',
        opacity: 0, // for gsap
      }}
    >
      <div
        ref={contentRef}
        style={{
          display: 'flex',
          flexDirection: 'column',
          height: '100%',
          width: '100%',
          backgroundColor: 'var(--bg-surface, #05050A)',
          transform: 'translateY(100%)', // for gsap
        }}
      >
        {/* Header / Search Bar */}
        <div style={{
          padding: '1.5rem',
          borderBottom: '1px solid rgba(255,255,255,0.1)',
          display: 'flex',
          alignItems: 'center',
          gap: '1rem',
          backgroundColor: 'var(--bg-surface, #05050A)',
          zIndex: 10,
        }}>
          <div style={{ color: 'rgba(255,255,255,0.5)' }}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="11" cy="11" r="8"></circle>
              <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
            </svg>
          </div>
          <input
            ref={inputRef}
            type="text"
            placeholder="Où souhaitez-vous aller ?"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            style={{
              flex: 1,
              background: 'transparent',
              border: 'none',
              outline: 'none',
              color: '#fff',
              fontSize: '1.2rem',
              fontFamily: 'var(--font-dm-sans), sans-serif',
            }}
          />
          {query && (
            <button
              onClick={() => setQuery('')}
              style={{
                background: 'transparent',
                border: 'none',
                color: 'rgba(255,255,255,0.5)',
                fontSize: '1.5rem',
                cursor: 'pointer',
              }}
            >
              ×
            </button>
          )}
          <button
            onClick={handleClose}
            style={{
              background: 'transparent',
              border: 'none',
              color: 'var(--country-accent, #fff)',
              fontFamily: 'var(--font-jetbrains-mono), monospace',
              textTransform: 'uppercase',
              fontSize: '0.8rem',
              letterSpacing: '0.1em',
              cursor: 'pointer',
            }}
          >
            Fermer
          </button>
        </div>

        {/* Content Area */}
        <div style={{ flex: 1, overflowY: 'auto' }}>
          {searchResults ? (
            // Render Search Results
            <div style={{ padding: '0 1.5rem' }}>
              {searchResults.length > 0 ? (
                searchResults.map(result => (
                  <div
                    key={result.cca3}
                    onClick={() => {
                      onSelect(result.cca3);
                      handleClose();
                    }}
                    style={{
                      padding: '1.25rem 0',
                      borderBottom: '1px solid rgba(255,255,255,0.05)',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '1.25rem',
                      cursor: 'pointer',
                    }}
                  >
                    <Image src={result.flagSvg} alt={result.name} width={40} height={26} style={{ borderRadius: '4px', objectFit: 'cover' }} unoptimized />
                    <div>
                      <div style={{ fontSize: '1.2rem', fontFamily: 'var(--font-dm-sans), sans-serif', color: '#fff' }}>{result.name}</div>
                      <div style={{ fontSize: '0.75rem', fontFamily: 'var(--font-jetbrains-mono), monospace', color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', marginTop: '0.2rem' }}>{result.region}</div>
                    </div>
                  </div>
                ))
              ) : (
                <div style={{ padding: '4rem 0', textAlign: 'center', color: 'rgba(255,255,255,0.5)', fontFamily: 'var(--font-jetbrains-mono), monospace' }}>
                  Aucun résultat pour &quot;{query}&quot;
                </div>
              )}
            </div>
          ) : (
            // Render Index Grouped by Continent
            <div>
              {groupedCountries.regions.map(region => (
                <div key={region} style={{ marginBottom: '0' }}>
                  <h2 style={{
                    position: 'sticky',
                    top: 0,
                    backgroundColor: 'rgba(5, 5, 10, 0.95)',
                    backdropFilter: 'blur(10px)',
                    margin: 0,
                    padding: '1.5rem',
                    fontFamily: 'var(--font-bebas-neue), sans-serif',
                    fontSize: '2.5rem',
                    lineHeight: 1,
                    letterSpacing: '0.05em',
                    color: 'var(--country-accent, #fff)',
                    zIndex: 5,
                    borderBottom: '1px solid rgba(255,255,255,0.05)',
                    borderTop: '1px solid rgba(255,255,255,0.05)',
                  }}>
                    {region}
                  </h2>
                  <div style={{ padding: '0 1.5rem' }}>
                    {groupedCountries.groups[region].map(c => (
                      <div
                        key={c.cca3}
                        onClick={() => {
                          onSelect(c.cca3);
                          handleClose();
                        }}
                        style={{
                          padding: '1.25rem 0',
                          borderBottom: '1px solid rgba(255,255,255,0.05)',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '1rem',
                          cursor: 'pointer',
                        }}
                      >
                        <div style={{ flex: 1, fontSize: '1.4rem', fontFamily: 'var(--font-dm-sans), sans-serif', color: '#fff', fontWeight: 300 }}>
                          {c.nameFr}
                        </div>
                        <div style={{ fontSize: '0.7rem', fontFamily: 'var(--font-jetbrains-mono), monospace', color: 'rgba(255,255,255,0.3)', letterSpacing: '0.1em' }}>
                          {c.cca3}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

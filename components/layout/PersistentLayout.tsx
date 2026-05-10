'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import GlobeScene from '@/components/globe/GlobeScene';
import LoadingScreen from '@/components/ui/LoadingScreen';
import SearchPalette from '@/components/ui/SearchPalette';
import DesktopExperienceSuggestion from '@/components/ui/DesktopExperienceSuggestion';
import MobileExplorer from '@/components/ui/MobileExplorer';
import type { CountryData, LoadingState } from '@/lib/types';
import { fetchAllCountries } from '@/lib/countries-api';
import { useAppStore } from '@/lib/store';
import { useIsMobile } from '@/lib/hooks/useIsMobile';
// Note: do not use View.Port outside the Canvas context

export default function PersistentLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const isMobile = useIsMobile();
  const [isMobileExplorerOpen, setIsMobileExplorerOpen] = useState(false);
  const [countries, setCountries] = useState<CountryData[]>([]);
  const [loadingState, setLoadingState] = useState<LoadingState>({
    progress: 0,
    phase: 'loading',
    minDurationElapsed: false,
    assetsLoaded: false,
  });

  const setSelectedCountry = useAppStore((state) => state.setSelectedCountry);
  const setCameraMode = useAppStore((state) => state.setCameraMode);

  const minDurationRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    // If we're on a country page, set mode
    if (pathname.startsWith('/pays/')) {
      const cca3 = pathname.split('/').pop()?.toUpperCase();
      if (cca3) {
        setSelectedCountry(cca3);
        setCameraMode('country');
      }
    } else {
      setSelectedCountry(null);
      setCameraMode('globe');
    }
  }, [pathname, setSelectedCountry, setCameraMode]);

  useEffect(() => {
    const loadCountries = async () => {
      try {
        const data = await fetchAllCountries();
        setCountries(data);
        setLoadingState((prev) => ({ ...prev, progress: 50 }));
      } catch (error) {
        console.error('Failed to fetch countries:', error);
        setLoadingState((prev) => ({
          ...prev,
          assetsLoaded: true,
          phase: 'revealing',
        }));
      }
    };

    loadCountries();

    minDurationRef.current = setTimeout(() => {
      setLoadingState((prev) => ({
        ...prev,
        minDurationElapsed: true,
      }));
    }, 1500);

    return () => {
      if (minDurationRef.current) clearTimeout(minDurationRef.current);
    };
  }, []);

  const handleProgress = (progress: number) => {
    setLoadingState((prev) => ({
      ...prev,
      progress: Math.round(progress),
    }));
  };

  const handleLoad = () => {
    setLoadingState((prev) => ({
      ...prev,
      assetsLoaded: true,
      phase: 'revealing',
    }));
  };

  const handleRevealComplete = () => {
    setLoadingState((prev) => ({ ...prev, phase: 'complete' }));
  };

  const handleCountrySelect = (cca3: string) => {
    router.push(`/pays/${cca3.toLowerCase()}`);
  };

  return (
    <>
      {/* Background fixed Canvas layer */}
      <div
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100vw',
          height: '100vh',
          zIndex: 0,
          backgroundColor: 'var(--bg-surface)',
        }}
      >
        {countries.length > 0 && !isMobile && (
          <GlobeScene
            countries={countries}
            onCountrySelect={handleCountrySelect}
            onProgress={handleProgress}
            onLoad={handleLoad}
          />
        )}
        {countries.length > 0 && isMobile && (
          <div style={{
            width: '100%',
            height: '100%',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            alignItems: 'center',
            background: 'radial-gradient(circle at center, #1a1a2e 0%, #0a0a14 100%)',
            color: 'var(--text-muted)'
          }}>
            {/* Fallback statique pour mobile : Cercle lumineux symbolisant le globe */}
            <div style={{
              width: '60vw',
              height: '60vw',
              borderRadius: '50%',
              background: 'radial-gradient(circle at 30% 30%, rgba(74, 144, 217, 0.4) 0%, rgba(0,0,0,0) 70%)',
              border: '1px solid rgba(255,255,255,0.05)',
              boxShadow: '0 0 50px rgba(74, 144, 217, 0.1), inset 0 0 20px rgba(255,255,255,0.05)',
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              marginBottom: '2rem'
            }}>
              <span style={{ 
                fontFamily: 'var(--font-jetbrains-mono)', 
                fontSize: '0.7rem', 
                letterSpacing: '0.3em',
                opacity: 0.5 
              }}>
                ATLAS°
              </span>
            </div>
            
            <button
              onClick={() => setIsMobileExplorerOpen(true)}
              style={{
                marginTop: '1rem',
                background: 'transparent',
                border: '1px solid rgba(255,255,255,0.2)',
                color: '#fff',
                padding: '1rem 2.5rem',
                borderRadius: '2rem',
                fontFamily: 'var(--font-jetbrains-mono), monospace',
                fontSize: '0.8rem',
                letterSpacing: '0.15em',
                textTransform: 'uppercase',
                cursor: 'pointer',
                transition: 'all 0.3s ease',
                boxShadow: '0 4px 20px rgba(0,0,0,0.5)',
              }}
            >
              Explorer l'Index
            </button>

            {/* Forcer le chargement pour enlever le LoadingScreen */}
            <div style={{ display: 'none' }}>
              {setTimeout(() => {
                if(loadingState.progress < 100) {
                  handleProgress(100);
                  handleLoad();
                }
              }, 100)}
            </div>
          </div>
        )}
      </div>

      {/* Children pages overlay (Country page, etc.) */}
      <div
        style={{
          position: 'relative',
          zIndex: 1,
          minHeight: '100vh',
          pointerEvents: 'none',
          transition: 'opacity 0.5s ease-in-out',
        }}
      >
        {/* We enable pointer events inside children components if needed */}
        <div style={{ pointerEvents: 'auto' }}>{children}</div>
      </div>

      <LoadingScreen
        loadingState={loadingState}
        onRevealComplete={handleRevealComplete}
      />

      {/* Search Palette (only show on globe mode maybe, or always) */}
      {countries.length > 0 && pathname === '/' && !isMobile && (
        <SearchPalette countries={countries} onSelect={handleCountrySelect} />
      )}

      {/* Suggestion Desktop pour Mobile */}
      <DesktopExperienceSuggestion />

      {/* Mobile Navigation Index */}
      {countries.length > 0 && isMobile && (
        <MobileExplorer
          countries={countries}
          isOpen={isMobileExplorerOpen}
          onClose={() => setIsMobileExplorerOpen(false)}
          onSelect={handleCountrySelect}
        />
      )}
    </>
  );
}

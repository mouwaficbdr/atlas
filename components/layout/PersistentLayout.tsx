'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import GlobeScene from '@/components/globe/GlobeScene';
import LoadingScreen from '@/components/ui/LoadingScreen';
import SearchPalette from '@/components/ui/SearchPalette';
import CustomCursor from '@/components/ui/CustomCursor';
import type { CountryData, LoadingState } from '@/lib/types';
import { fetchAllCountries } from '@/lib/countries-api';
import { useAppStore } from '@/lib/store';
// Note: do not use View.Port outside the Canvas context

export default function PersistentLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
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
          zIndex: 0, // keep the canvas behind overlays but above page background
          backgroundColor: 'var(--bg-surface)',
        }}
      >
        {countries.length > 0 && (
          <GlobeScene
            countries={countries}
            onCountrySelect={handleCountrySelect}
            onProgress={handleProgress}
            onLoad={handleLoad}
          />
        )}
      </div>

      {/* Children pages overlay (Country page, etc.) */}
      <div
        style={{
          position: 'relative',
          zIndex: 1,
          minHeight: '100vh',
          pointerEvents: 'none',
        }}
      >
        {/* We enable pointer events inside children components if needed */}
        <div style={{ pointerEvents: 'auto' }}>{children}</div>
      </div>

      <LoadingScreen
        loadingState={loadingState}
        onRevealComplete={handleRevealComplete}
      />

      <CustomCursor />

      {/* Search Palette (only show on globe mode maybe, or always) */}
      {countries.length > 0 && pathname === '/' && (
        <SearchPalette countries={countries} onSelect={handleCountrySelect} />
      )}
    </>
  );
}

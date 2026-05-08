'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { gsap } from 'gsap';
import GlobeScene from '@/components/globe/GlobeScene';
import LoadingScreen from '@/components/ui/LoadingScreen';
import SearchPalette from '@/components/ui/SearchPalette';
import type { CountryData, LoadingState } from '@/lib/types';
import { fetchAllCountries } from '@/lib/countries-api';

export default function HomePage() {
  const router = useRouter();
  const [countries, setCountries] = useState<CountryData[]>([]);
  const [loadingState, setLoadingState] = useState<LoadingState>({
    progress: 0,
    phase: 'loading',
    minDurationElapsed: false,
    assetsLoaded: false,
  });
  const [isRevealing, setIsRevealing] = useState(false);
  const minDurationRef = useRef<NodeJS.Timeout | null>(null);

  // Fetch countries data
  useEffect(() => {
    const loadCountries = async () => {
      try {
        const data = await fetchAllCountries();
        setCountries(data);
      } catch (error) {
        console.error('Failed to fetch countries:', error);
      }
    };

    loadCountries();

    // Minimum loading duration: 1.5 seconds
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

  // Handle progress updates from LoadingManager
  const handleProgress = (progress: number) => {
    setLoadingState((prev) => ({
      ...prev,
      progress: Math.round(progress),
    }));
  };

  // Handle assets loaded
  const handleLoad = () => {
    setLoadingState((prev) => ({
      ...prev,
      assetsLoaded: true,
      phase: 'revealing',
    }));
  };

  // Handle reveal complete (LoadingScreen fade out)
  const handleRevealComplete = () => {
    setLoadingState((prev) => ({
      ...prev,
      phase: 'complete',
    }));
    setIsRevealing(false);
  };

  // Handle country selection
  const handleCountrySelect = (cca3: string) => {
    // Navigate to country page
    router.push(`/pays/${cca3.toLowerCase()}`);
  };

  return (
    <main
      style={{
        width: '100%',
        height: '100vh',
        overflow: 'hidden',
        backgroundColor: 'var(--bg-surface)',
      }}
    >
      {/* Globe Scene */}
      <div style={{ width: '100%', height: '100%' }}>
        {countries.length > 0 && (
          <GlobeScene
            countries={countries}
            onCountrySelect={handleCountrySelect}
            onProgress={handleProgress}
            onLoad={handleLoad}
          />
        )}
      </div>

      {/* Loading Screen */}
      <LoadingScreen loadingState={loadingState} onRevealComplete={handleRevealComplete} />

      {/* Search Palette */}
      {countries.length > 0 && (
        <SearchPalette countries={countries} onSelect={handleCountrySelect} />
      )}
    </main>
  );
}

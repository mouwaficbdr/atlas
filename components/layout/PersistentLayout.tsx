'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import dynamic from 'next/dynamic';
import LoadingScreen from '@/components/ui/LoadingScreen';
import SearchPalette from '@/components/ui/SearchPalette';
import Navigation from '@/components/layout/Navigation';
import DesktopExperienceSuggestion from '@/components/ui/DesktopExperienceSuggestion';
import MobileExplorer from '@/components/ui/MobileExplorer';
import GlobeOnboarding from '@/components/ui/GlobeOnboarding';
import GithubBadge from '@/components/ui/GithubBadge';
import type { CountryData, LoadingState } from '@/lib/types';
import { fetchAllCountries } from '@/lib/countries-api';
import { useAppStore } from '@/lib/store';
import { useIsMobile } from '@/lib/hooks/useIsMobile';

// Le globe embarque toute la stack WebGL (three + react-three-fiber). On le
// charge en import dynamique client (ssr: false) pour le sortir du bundle
// d'entrée ; il n'est de toute façon monté que sur desktop, une fois les pays
// chargés (voir la condition plus bas).
const GlobeScene = dynamic(() => import('@/components/globe/GlobeScene'), {
  ssr: false,
});

function MobileFallbackLoader({ loadingProgress, onComplete }: { loadingProgress: number; onComplete: () => void }) {
  useEffect(() => {
    if (loadingProgress < 100) {
      const timer = setTimeout(onComplete, 100);
      return () => clearTimeout(timer);
    }
  }, [loadingProgress, onComplete]);
  return null;
}

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

  const setSearchOpen = useAppStore((state) => state.setSearchOpen);
  const isOffMap = useAppStore((state) => state.isOffMap);

  // Dérivés directement de l'URL à chaque rendu plutôt que synchronisés dans
  // le store via un useEffect : évite le décalage d'une frame (le globe
  // affichait encore le mode précédent le temps que l'effet se déclenche).
  const cameraMode: 'globe' | 'country' = pathname.startsWith('/pays/')
    ? 'country'
    : 'globe';
  const selectedCountryCca3 =
    cameraMode === 'country' ? pathname.split('/').pop()?.toUpperCase() ?? null : null;

  const minDurationRef = useRef<NodeJS.Timeout | null>(null);

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

    // La durée minimale de 1500ms met en scène l'arrivée sur le globe : elle
    // n'a de sens qu'à la première visite de la session. Ensuite, on révèle dès
    // que les assets sont prêts (finding QA5).
    let alreadyLoaded = false;
    try {
      alreadyLoaded = sessionStorage.getItem('atlas_loaded_once') === '1';
    } catch {
      // sessionStorage indisponible : on garde le comportement première visite.
    }

    if (alreadyLoaded) {
      setLoadingState((prev) => ({ ...prev, minDurationElapsed: true }));
    } else {
      minDurationRef.current = setTimeout(() => {
        setLoadingState((prev) => ({
          ...prev,
          minDurationElapsed: true,
        }));
      }, 1500);
    }

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
    try {
      sessionStorage.setItem('atlas_loaded_once', '1');
    } catch {
      // sessionStorage indisponible : la prochaine visite rejouera la mise en scène.
    }
    setLoadingState((prev) => ({ ...prev, phase: 'complete' }));
  };

  const handleCountrySelect = (cca3: string) => {
    router.push(`/pays/${cca3.toLowerCase()}`);
  };

  // Routes hors univers (404, erreur) : OffMapScreen se suffit à lui-même, on
  // ne monte ni le globe, ni l'écran de chargement, ni la navigation.
  if (isOffMap) {
    return <>{children}</>;
  }

  return (
    <>
      {/* Globe 3D — couche fixe en fond de page */}
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
            cameraMode={cameraMode}
            selectedCountryCca3={selectedCountryCca3}
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
            {/* Orbe lumineux — substitut statique du globe sur mobile */}
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

            {/* CTA Explorer + GitHub — page d'accueil uniquement */}
            {pathname === '/' && (
              <>
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
                  Explorer l&apos;Index
                </button>

                {/* Lien GitHub — discret, contextuel */}
                <a
                  href="https://github.com/mouwaficbdr/atlas"
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    marginTop: '1.5rem',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    color: 'rgba(255,255,255,0.3)',
                    textDecoration: 'none',
                    fontFamily: 'var(--font-jetbrains-mono), monospace',
                    fontSize: '0.65rem',
                    letterSpacing: '0.2em',
                    textTransform: 'uppercase',
                    transition: 'color 0.2s ease',
                  }}
                >
                  <svg height="14" viewBox="0 0 16 16" fill="currentColor" width="14">
                    <path d="M8 0c4.42 0 8 3.58 8 8a8.013 8.013 0 0 1-5.45 7.59c-.4.08-.55-.17-.55-.38 0-.27-.01-1.13-.01-2.2 0-.75-.25-1.23-.54-1.48 1.78-.2 3.65-.88 3.65-3.95 0-.88-.31-1.59-.82-2.15.08-.2.36-1.02-.08-2.12 0 0-.67-.22-2.2.82-.64-.18-1.32-.27-2-.27-.68 0-1.36.09-2 .27-1.53-1.03-2.2-.82-2.2-.82-.44 1.1-.16 1.92-.08 2.12-.51.56-.82 1.28-.82 2.15 0 3.06 1.86 3.75 3.64 3.95-.23.2-.44.55-.51 1.07-.46.21-1.61.55-2.33-.66-.15-.24-.6-.83-1.23-.82-.67.01-.27.38.01.53.34.19.73.9.82 1.13.16.45.68 1.31 2.69.94 0 .67.01 1.3.01 1.49 0 .21-.15.45-.55.38A7.995 7.995 0 0 1 0 8c0-4.42 3.58-8 8-8Z"></path>
                  </svg>
                  Open Source
                </a>
              </>
            )}

            {/* NOTE: Force le LoadingScreen à se terminer sur mobile où le GlobeScene n'est pas monté */}
            <MobileFallbackLoader
              loadingProgress={loadingState.progress}
              onComplete={() => {
                handleProgress(100);
                handleLoad();
              }}
            />
          </div>
        )}
      </div>

      {/* Overlay des pages enfants (ex: CountryCard) */}
      <div
        style={{
          position: 'relative',
          zIndex: 1,
          minHeight: '100vh',
          pointerEvents: 'none',
          transition: 'opacity 0.5s ease-in-out',
        }}
      >
        <div style={{ pointerEvents: 'auto' }}>{children}</div>
      </div>

      <LoadingScreen
        loadingState={loadingState}
        onRevealComplete={handleRevealComplete}
      />

      {/* Navigation (desktop) — disponible sur toutes les pages, y compris les
          pages pays, pour offrir un chemin clavier/visible vers la recherche. */}
      {!isMobile && <Navigation onSearchOpen={() => setSearchOpen(true)} />}

      {/* Search Palette — disponible sur toutes les pages desktop (Cmd+K ou
          bouton de la Navigation), pas seulement sur le globe. */}
      {countries.length > 0 && !isMobile && (
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

      {/* Globe Micro-interactions (Desktop only) */}
      {countries.length > 0 && pathname === '/' && !isMobile && (
        <GlobeOnboarding />
      )}

      {/* GitHub Badge - Floating Magnetic Link (page globe, desktop uniquement) */}
      {pathname === '/' && !isMobile && <GithubBadge />}
    </>
  );
}

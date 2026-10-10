'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import dynamic from 'next/dynamic';
import LoadingScreen from '@/components/ui/LoadingScreen';
import SearchPalette from '@/components/ui/SearchPalette';
import SunLine from '@/components/ui/SunLine';
import { resolveHome } from '@/lib/home-country';
import Navigation from '@/components/layout/Navigation';
import MobileExplorer from '@/components/ui/MobileExplorer';
import MobileHomeDock from '@/components/ui/MobileHomeDock';
import GlobeOnboarding from '@/components/ui/GlobeOnboarding';
import GithubBadge from '@/components/ui/GithubBadge';
import type { CountryData, LoadingState } from '@/lib/types';
import { fetchAllCountries } from '@/lib/countries-api';
import { useAppStore } from '@/lib/store';
import { useIsMobile } from '@/lib/hooks/useIsMobile';
import { prefersReducedMotion } from '@/lib/hooks/useReducedMotion';

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
  const [explorerRegion, setExplorerRegion] = useState<string | null>(null);
  // Appareil à ménager (économie de données, peu de mémoire) : orbe statique
  // au lieu du globe 3D. Partout ailleurs, mobile compris, le vrai globe.
  const [lowPower, setLowPower] = useState(false);
  useEffect(() => {
    const nav = navigator as Navigator & { connection?: { saveData?: boolean }; deviceMemory?: number };
    setLowPower(!!nav.connection?.saveData || (nav.deviceMemory !== undefined && nav.deviceMemory < 3));
  }, []);
  const [countries, setCountries] = useState<CountryData[]>([]);
  const [loadingState, setLoadingState] = useState<LoadingState>({
    progress: 0,
    phase: 'loading',
    minDurationElapsed: false,
    assetsLoaded: false,
  });

  const setSearchOpen = useAppStore((state) => state.setSearchOpen);
  const isOffMap = useAppStore((state) => state.isOffMap);
  const countryView = useAppStore((state) => state.countryView);

  // Dérivés directement de l'URL à chaque rendu plutôt que synchronisés dans
  // le store via un useEffect : évite le décalage d'une frame (le globe
  // affichait encore le mode précédent le temps que l'effet se déclenche).
  const cameraMode: 'globe' | 'country' = pathname.startsWith('/pays/')
    ? 'country'
    : 'globe';
  const selectedCountryCca3 =
    cameraMode === 'country' ? pathname.split('/').pop()?.toUpperCase() ?? null : null;

  const globeShifted = cameraMode === 'country' && countryView === 'wide' && !isMobile;

  const minDurationRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    const loadCountries = async () => {
      try {
        const data = await fetchAllCountries();
        setCountries(data);
        setLoadingState((prev) => ({ ...prev, progress: 45 }));
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

  // Sur une fiche pays, le contenu (statique) s'affiche tout de suite : pas
  // d'écran de chargement. Le globe apparaît derrière quand il est prêt et le
  // vol de caméra vers le pays tient lieu d'intro (CameraTransition).
  const onGlobeScreen = pathname === '/';
  const setIntroPhase = useAppStore((state) => state.setIntroPhase);
  useEffect(() => {
    if (onGlobeScreen || loadingState.phase !== 'revealing') return;
    setIntroPhase(prefersReducedMotion() ? 'done' : 'flying');
    handleRevealComplete();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [onGlobeScreen, loadingState.phase, setIntroPhase]);

  // Sur l'accueil mobile, toucher un pays (ou le choisir dans l'index) ouvre
  // son aperçu dans le tiroir : le survol n'existe pas au doigt.
  const setPreviewCca3 = useAppStore((state) => state.setPreviewCca3);
  // « Vous êtes ici » : pays de l'utilisateur, résolu une fois sur l'appareil.
  const setHome = useAppStore((state) => state.setHome);
  useEffect(() => {
    setHome(resolveHome());
  }, [setHome]);
  const handleCountrySelect = (cca3: string) => {
    if (isMobile && pathname === '/') setPreviewCca3(cca3);
    else router.push(`/pays/${cca3.toLowerCase()}`);
  };
  useEffect(() => {
    setPreviewCca3(null);
  }, [pathname, setPreviewCca3]);

  // Routes hors univers (404, erreur) : OffMapScreen se suffit à lui-même, on
  // ne monte ni le globe, ni l'écran de chargement, ni la navigation.
  if (isOffMap) {
    return <>{children}</>;
  }

  return (
    <>
      {/* Globe 3D : couche fixe en fond de page. Sur une fiche, aux
          frontières, il glisse vers la droite pour se montrer à côté de la
          liste des voisins. */}
      <div
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100vw',
          height: '100vh',
          zIndex: 0,
          backgroundColor: 'var(--bg-surface)',
          // Sur l'accueil mobile, le globe se centre au-dessus du tiroir
          // (hauteur publiée par MobileHomeDock) au lieu d'être en partie caché.
          transform: globeShifted
            ? 'translateX(22vw)'
            : isMobile && pathname === '/'
              ? 'translateY(calc(var(--dock-h, 0px) / -2))'
              : 'none',
          transition: 'transform 1.2s var(--ease-signature)',
        }}
      >
        {countries.length > 0 && !lowPower && (
          <GlobeScene
            countries={countries}
            onCountrySelect={handleCountrySelect}
            onProgress={handleProgress}
            onLoad={handleLoad}
            cameraMode={cameraMode}
            selectedCountryCca3={selectedCountryCca3}
          />
        )}
        {countries.length > 0 && lowPower && (
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
            {/* Orbe lumineux : substitut statique du globe sur appareil à ménager */}
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

            {/* Repli sans globe : rien ne signalera la fin du chargement, on la force. */}
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

      {onGlobeScreen && (
        <LoadingScreen
          loadingState={loadingState}
          onRevealComplete={handleRevealComplete}
        />
      )}

      {/* Navigation (desktop) : réservée à l'écran de départ (le globe). Sur
          une fiche pays, le fil d'Ariane (lien "Globe") assure déjà le retour,
          superposer la marque ATLAS° y ferait doublon dans le même coin. */}
      {!isMobile && pathname === '/' && (
        <Navigation onSearchOpen={() => setSearchOpen(true)} />
      )}

      {/* Search Palette : réservée à l'écran de départ, comme son déclencheur. */}
      {countries.length > 0 && !isMobile && pathname === '/' && (
        <SearchPalette countries={countries} onSelect={handleCountrySelect} />
      )}


      {/* Mobile Navigation Index */}
      {countries.length > 0 && isMobile && (
        <MobileExplorer
          countries={countries}
          isOpen={isMobileExplorerOpen}
          onClose={() => setIsMobileExplorerOpen(false)}
          onSelect={handleCountrySelect}
          initialRegion={explorerRegion}
        />
      )}

      {/* Tiroir de l'accueil mobile, une fois l'arrivée sur le globe jouée. */}
      {countries.length > 0 && isMobile && pathname === '/' && loadingState.phase === 'complete' && (
        <MobileHomeDock
          countries={countries}
          onOpenExplorer={(region) => {
            setExplorerRegion(region);
            setIsMobileExplorerOpen(true);
          }}
        />
      )}

      {/* Globe Micro-interactions (Desktop only) */}
      {countries.length > 0 && pathname === '/' && !isMobile && (
        <GlobeOnboarding />
      )}

      {/* Le vrai soleil, dit en une ligne (desktop : le tiroir occupe le bas sur mobile). */}
      {countries.length > 0 && pathname === '/' && !isMobile && <SunLine countries={countries} />}

      {/* GitHub Badge - Floating Magnetic Link (page globe, desktop uniquement) */}
      {pathname === '/' && !isMobile && <GithubBadge />}
    </>
  );
}

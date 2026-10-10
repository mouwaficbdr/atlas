import { create } from 'zustand';
import type { Stamp } from './logbook';

interface AppState {
  hoveredCountryCca3: string | null;
  isSearchOpen: boolean;
  /**
   * Route hors de l'univers cartographique (404, page d'erreur) : PersistentLayout
   * n'y monte ni le globe ni l'écran de chargement. Positionné par OffMapScreen.
   */
  isOffMap: boolean;
  /**
   * Intro du globe (voir lib/globe/intro.ts) : caméra au loin tant que le
   * loader est affiché ('waiting'), approche pendant la révélation
   * ('flying'), puis contrôles rendus à l'utilisateur ('done').
   */
  introPhase: 'waiting' | 'flying' | 'done';
  /** Accueil mobile : pays touché sur le globe, montré en aperçu. */
  previewCca3: string | null;
  setPreviewCca3: (cca3: string | null) => void;
  /** Fiche pays : voisin survolé, allumé sur le globe. */
  focusCca3: string | null;
  /** Fiche pays : cadrage serré sur le pays, ou large sur ses voisins. */
  countryView: 'close' | 'wide';
  /**
   * « Vous êtes ici » (#29) : pays de l'utilisateur, déduit du fuseau de
   * l'appareil ou choisi (voir lib/home-country.ts). undefined tant que non
   * résolu, null si aucun.
   */
  home: { cca3: string; source: 'fuseau' | 'choix' } | null | undefined;
  setHome: (home: { cca3: string; source: 'fuseau' | 'choix' } | null) => void;
  /** Carnet de vol (#30) : escales lues sur l'appareil, et son panneau. */
  logbook: Stamp[];
  setLogbook: (logbook: Stamp[]) => void;
  isLogbookOpen: boolean;
  /** Défi du jour en cours : le globe ne nomme plus les pays au survol. */
  isChallenge: boolean;
  setChallenge: (value: boolean) => void;
  setLogbookOpen: (open: boolean) => void;
  setHoveredCountry: (cca3: string | null) => void;
  setFocusCca3: (cca3: string | null) => void;
  setCountryView: (view: 'close' | 'wide') => void;
  setSearchOpen: (open: boolean) => void;
  setOffMap: (value: boolean) => void;
  setIntroPhase: (phase: 'waiting' | 'flying' | 'done') => void;
}

export const useAppStore = create<AppState>((set) => ({
  hoveredCountryCca3: null,
  isSearchOpen: false,
  isOffMap: false,
  introPhase: 'waiting',
  previewCca3: null,
  setPreviewCca3: (cca3) => set({ previewCca3: cca3 }),
  focusCca3: null,
  countryView: 'close',
  home: undefined,
  setHome: (home) => set({ home }),
  logbook: [],
  setLogbook: (logbook) => set({ logbook }),
  isLogbookOpen: false,
  isChallenge: false,
  setChallenge: (value) => set({ isChallenge: value }),
  setLogbookOpen: (open) => set({ isLogbookOpen: open }),
  setHoveredCountry: (cca3) => set({ hoveredCountryCca3: cca3 }),
  setFocusCca3: (cca3) => set({ focusCca3: cca3 }),
  setCountryView: (view) => set({ countryView: view }),
  setSearchOpen: (open) => set({ isSearchOpen: open }),
  setOffMap: (value) => set({ isOffMap: value }),
  setIntroPhase: (phase) => set({ introPhase: phase }),
}));

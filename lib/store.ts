import { create } from 'zustand';

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
  /** Fiche pays : voisin survolé, allumé sur le globe. */
  focusCca3: string | null;
  /** Fiche pays : cadrage serré sur le pays, ou large sur ses voisins. */
  countryView: 'close' | 'wide';
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
  focusCca3: null,
  countryView: 'close',
  setHoveredCountry: (cca3) => set({ hoveredCountryCca3: cca3 }),
  setFocusCca3: (cca3) => set({ focusCca3: cca3 }),
  setCountryView: (view) => set({ countryView: view }),
  setSearchOpen: (open) => set({ isSearchOpen: open }),
  setOffMap: (value) => set({ isOffMap: value }),
  setIntroPhase: (phase) => set({ introPhase: phase }),
}));

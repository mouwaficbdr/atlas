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
  setHoveredCountry: (cca3: string | null) => void;
  setSearchOpen: (open: boolean) => void;
  setOffMap: (value: boolean) => void;
  setIntroPhase: (phase: 'waiting' | 'flying' | 'done') => void;
}

export const useAppStore = create<AppState>((set) => ({
  hoveredCountryCca3: null,
  isSearchOpen: false,
  isOffMap: false,
  introPhase: 'waiting',
  setHoveredCountry: (cca3) => set({ hoveredCountryCca3: cca3 }),
  setSearchOpen: (open) => set({ isSearchOpen: open }),
  setOffMap: (value) => set({ isOffMap: value }),
  setIntroPhase: (phase) => set({ introPhase: phase }),
}));

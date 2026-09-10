import { create } from 'zustand';

interface AppState {
  hoveredCountryCca3: string | null;
  isSearchOpen: boolean;
  /**
   * Route hors de l'univers cartographique (404, page d'erreur) : PersistentLayout
   * n'y monte ni le globe ni l'écran de chargement. Positionné par OffMapScreen.
   */
  isOffMap: boolean;
  setHoveredCountry: (cca3: string | null) => void;
  setSearchOpen: (open: boolean) => void;
  setOffMap: (value: boolean) => void;
}

export const useAppStore = create<AppState>((set) => ({
  hoveredCountryCca3: null,
  isSearchOpen: false,
  isOffMap: false,
  setHoveredCountry: (cca3) => set({ hoveredCountryCca3: cca3 }),
  setSearchOpen: (open) => set({ isSearchOpen: open }),
  setOffMap: (value) => set({ isOffMap: value }),
}));

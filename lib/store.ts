import { create } from 'zustand';

interface AppState {
  hoveredCountryCca3: string | null;
  isSearchOpen: boolean;
  setHoveredCountry: (cca3: string | null) => void;
  setSearchOpen: (open: boolean) => void;
}

export const useAppStore = create<AppState>((set) => ({
  hoveredCountryCca3: null,
  isSearchOpen: false,
  setHoveredCountry: (cca3) => set({ hoveredCountryCca3: cca3 }),
  setSearchOpen: (open) => set({ isSearchOpen: open }),
}));

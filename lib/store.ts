import { create } from 'zustand';

interface AppState {
  selectedCountryCca3: string | null;
  hoveredCountryCca3: string | null;
  cameraMode: 'globe' | 'country';
  setSelectedCountry: (cca3: string | null) => void;
  setHoveredCountry: (cca3: string | null) => void;
  setCameraMode: (mode: 'globe' | 'country') => void;
}

export const useAppStore = create<AppState>((set) => ({
  selectedCountryCca3: null,
  hoveredCountryCca3: null,
  cameraMode: 'globe',
  setSelectedCountry: (cca3) => set({ selectedCountryCca3: cca3 }),
  setHoveredCountry: (cca3) => set({ hoveredCountryCca3: cca3 }),
  setCameraMode: (mode) => set({ cameraMode: mode }),
}));

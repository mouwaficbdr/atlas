/**
 * ATLAS° Globe 3D — Interfaces TypeScript centrales
 * Exigences : 1.2, 3.2, 5.2, 8.2
 */

import type { MDXRemoteSerializeResult } from 'next-mdx-remote';

// ---------------------------------------------------------------------------
// CountryData — Données REST Countries API v3.1
// ---------------------------------------------------------------------------

export interface CountryData {
  // Identifiants
  cca3: string; // Code Alpha-3 (ex: "BEN")
  cca2: string; // Code Alpha-2 (ex: "BJ")
  name: {
    common: string; // Nom courant (ex: "Benin")
    official: string; // Nom officiel
    nativeName: Record<
      string,
      {
        common: string;
        official: string;
      }
    >;
  };

  // Géographie
  capital: string[]; // Capitales
  region: string; // Région (ex: "Africa")
  subregion: string; // Sous-région
  latlng: [number, number]; // [latitude, longitude]
  area: number; // Superficie en km²
  landlocked: boolean; // Enclavé
  borders: string[]; // Codes Alpha-3 des voisins

  // Démographie et culture
  population: number;
  languages: Record<string, string>; // { code: nom natif }
  currencies: Record<
    string,
    {
      name: string;
      symbol: string;
    }
  >;

  // Identifiants numériques
  idd: {
    root: string; // Ex: "+2"
    suffixes: string[]; // Ex: ["29"]
  };
  tld: string[]; // Ex: [".bj"]

  // Médias
  flags: {
    svg: string; // URL drapeau SVG
    png: string;
    alt: string;
  };

  // Fuseaux horaires
  timezones: string[]; // Ex: ["UTC+01:00"]
  
  // Custom Atlas Fields
  centroid: [number, number];
  colors?: {
    primary: string;
    palette: string[];
  };
}

// ---------------------------------------------------------------------------
// CountryPalette — Palette de couleurs extraite du drapeau
// Exigence : 3.2, 5.2
// ---------------------------------------------------------------------------

export interface CountryPalette {
  primary: string; // Couleur dominante (hex)
  secondary: string; // Deuxième couleur dominante
  accent: string; // Couleur d'accent
  background: string; // Couleur de fond dérivée

  // Métadonnées
  cca3: string; // Code pays source
  source: "extracted" | "fallback"; // Origine de la palette
  contrastRatio: number; // Ratio texte/fond calculé
}

// Clé localStorage : atlas_palette_[cca3]
// Valeur : JSON.stringify(CountryPalette)

// ---------------------------------------------------------------------------
// GeoJSONFeature / GeoJSONCollection — Données géographiques Natural Earth
// Exigence : 1.2
// ---------------------------------------------------------------------------

export interface GeoJSONFeature {
  type: "Feature";
  properties: CountryData;
  geometry: {
    type: "Polygon" | "MultiPolygon";
    coordinates: number[][][] | number[][][][];
  };
}

export interface GeoJSONCollection {
  type: "FeatureCollection";
  features: GeoJSONFeature[];
}

// ---------------------------------------------------------------------------
// SearchResult — Résultat de recherche pays
// Exigence : 8.2
// ---------------------------------------------------------------------------

export interface SearchResult {
  cca3: string;
  name: string; // Nom courant
  officialName: string; // Nom officiel
  capital: string;
  region: string;
  flagSvg: string;
  score: number; // 3 = exact, 2 = préfixe, 1 = sous-chaîne
}

// ---------------------------------------------------------------------------
// CountryMood — Ambiance visuelle pays
// ---------------------------------------------------------------------------

export type MoodType = "Île" | "Continental" | "Polaire" | "Tropical";

export interface CountryMood {
  type: MoodType;
  label: string;
  icon: string; // Emoji ou icône SVG
  colorScheme: string; // Classe CSS associée
}

// ---------------------------------------------------------------------------
// MDXContent — Contenu éditorial
// ---------------------------------------------------------------------------

/**
 * MDXRemoteSerializeResult est importé depuis next-mdx-remote.
 * On utilise un type structurel minimal pour éviter une dépendance directe
 * dans ce fichier de types fondamentaux.
 */
export interface MDXRemoteSerializeResult {
  compiledSource: string;
  scope?: Record<string, unknown>;
  frontmatter?: Record<string, unknown>;
}

export interface MDXContent {
  cca3: string;
  source: MDXRemoteSerializeResult | null; // null si absent ou malformé
  frontmatter: {
    title?: string;
    description?: string;
    author?: string;
    date?: string;
  };
}

// ---------------------------------------------------------------------------
// LoadingState — État du chargement initial
// ---------------------------------------------------------------------------

export interface LoadingState {
  progress: number; // 0-100
  phase: "loading" | "revealing" | "complete";
  minDurationElapsed: boolean; // true après 1.5s
  assetsLoaded: boolean;
}

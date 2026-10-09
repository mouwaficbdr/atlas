import type { ClimateShare } from './koppen';

// ---------------------------------------------------------------------------
// CountryData : figé au build dans public/data/countries-geo.json
// (géométrie Natural Earth + propriétés issues de mledoze/countries et
// countries-and-timezones, voir scripts/generate-geo.js).
// ---------------------------------------------------------------------------

export interface CountryData {
  cca3: string;
  cca2: string;
  name: {
    common: string;
    official: string;
    nativeName: Record<string, { common: string; official: string }>;
  };
  /** Nom courant en français (repli sur name.common). */
  nameFr: string;
  /** Nom officiel en français (repli sur name.official). */
  officialNameFr: string;
  /** Gentilé masculin en français, chaîne vide si inconnu. */
  demonymFr: string;

  capital: string[];
  /** Nom de la capitale en français (repli sur l'anglais). */
  capitalFr: string;
  /** Coordonnées de la capitale, ordre GeoJSON [lon, lat] (Wikidata). */
  capitalLonLat: [number, number] | null;
  region: string;
  /** Région en français. */
  regionFr: string;
  subregion: string;
  /** Sous-région en français. */
  subregionFr: string;
  latlng: [number, number];
  area: number;
  landlocked: boolean;
  borders: string[];

  population: number;
  /** Climats de Köppen-Geiger principaux (trois au plus), du plus étendu au moins étendu. */
  climate: ClimateShare[];
  /** Année de l'estimation de population (Banque mondiale). */
  populationYear: number | null;
  languages: Record<string, string>;
  currencies: Record<string, { name: string; symbol: string }>;

  idd: {
    root: string;
    suffixes: string[];
  } | null;
  tld: string[];

  flags: {
    svg: string;
    png: string;
    alt: string;
  };

  /** Décalages UTC bruts (souvent vide, l'horloge utilise primaryTimezone). */
  timezones: string[];
  /** Fuseau IANA de la capitale, ex. "Europe/Paris". "UTC" si inconnu. */
  primaryTimezone: string;

  /** Forme de gouvernement en français (Wikidata P122), null si non renseigné. */
  governmentFr: string | null;
  /** État souverain (toujours true : le jeu de données livré se limite aux membres de l'ONU). */
  independent: boolean;

  centroid: [number, number];
  colors?: {
    primary: string;
    palette: string[];
  };
}

// ---------------------------------------------------------------------------
// CountryPalette : Palette extraite du drapeau par median cut
// NOTE: Mise en cache dans localStorage sous la clé atlas_palette_[cca3]
// ---------------------------------------------------------------------------

export interface CountryPalette {
  primary: string;
  secondary: string;
  accent: string;
  background: string;
  cca3: string;
  source: 'extracted' | 'fallback';
  contrastRatio: number;
}

// ---------------------------------------------------------------------------
// GeoJSON : Natural Earth 1:50m
// ---------------------------------------------------------------------------

export interface GeoJSONFeature {
  type: 'Feature';
  properties: CountryData;
  geometry: {
    type: 'Polygon' | 'MultiPolygon';
    coordinates: number[][][] | number[][][][];
  };
}

export interface GeoJSONCollection {
  type: 'FeatureCollection';
  features: GeoJSONFeature[];
}

// ---------------------------------------------------------------------------
// SearchResult : Résultat du moteur de recherche client
// ---------------------------------------------------------------------------

export interface SearchResult {
  cca3: string;
  name: string;
  officialName: string;
  capital: string;
  region: string;
  flagSvg: string;
  score: number; // 3 = exact, 2 = préfixe, 1 = sous-chaîne
}

// ---------------------------------------------------------------------------
// MDXContent : Contenu éditorial
// Le MDX est rendu côté serveur (next-mdx-remote/rsc) au build : on transporte
// la source brute, pas un bundle compilé à évaluer côté client (ce que le CSP
// de production interdit, faute de 'unsafe-eval').
// ---------------------------------------------------------------------------

export interface MDXContent {
  cca3: string;
  /** Source MDX brute, ou null si le fichier est absent / malformé. */
  raw: string | null;
  frontmatter: {
    title?: string;
    description?: string;
    author?: string;
    date?: string;
  };
}

// ---------------------------------------------------------------------------
// LoadingState : État du chargement initial du globe
// ---------------------------------------------------------------------------

export interface LoadingState {
  progress: number; // 0-100
  phase: 'loading' | 'revealing' | 'complete';
  minDurationElapsed: boolean;
  assetsLoaded: boolean;
}

/**
 * Route : /pays/[code]
 *
 * Génération statique (SSG) de 195 pages via generateStaticParams.
 * Charge les données pays + MDX au build et monte CountryCard.
 */

import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { unstable_cache } from 'next/cache';
import CountryCard from '@/components/country/CountryCard';
import { fetchAllCountries } from '@/lib/countries-api';
import { loadMDX } from '@/lib/mdx-loader';
import type { CountryData, CountryPalette, MDXContent } from '@/lib/types';

// SSG pur : les données sont figées au build, pas de revalidation.
export const dynamic = 'force-static';
export const revalidate = false;

// ---------------------------------------------------------------------------
// generateStaticParams
// ---------------------------------------------------------------------------

export async function generateStaticParams() {
  try {
    const countries = await fetchAllCountries();
    return countries.map((country) => ({
      code: country.cca3.toLowerCase(),
    }));
  } catch (error) {
    throw new Error(
      `[ATLAS] Impossible de générer les pages pays. Cause : ${error instanceof Error ? error.message : String(error)
      }`,
    );
  }
}

// ---------------------------------------------------------------------------
// Métadonnées SEO
// ---------------------------------------------------------------------------

export async function generateMetadata({
  params,
}: {
  params: { code: string };
}): Promise<Metadata> {
  const country = await getCountryData(params.code);

  if (!country) {
    return {
      title: 'Pays non trouvé - ATLAS°',
    };
  }

  const canonicalUrl = `https://atlas.example.com/pays/${params.code}`;
  const description =
    `Découvrez ${country.name.official} sur ATLAS° : population, superficie, capitale, langues, monnaie, et bien plus.`.slice(
      0,
      160,
    );

  return {
    title: `${country.name.common} - ATLAS°`,
    description,
    openGraph: {
      title: country.name.common,
      description,
      type: 'website',
      url: canonicalUrl,
      images: [
        {
          url: country.flags.svg,
          width: 1200,
          height: 630,
          alt: `Drapeau de ${country.name.common}`,
        },
      ],
    },
    alternates: {
      canonical: canonicalUrl,
    },
  };
}

// ---------------------------------------------------------------------------
// Utilitaires de chargement de données
// ---------------------------------------------------------------------------

/**
 * Récupère les données d'un pays par son code Alpha-3 (minuscules).
 *
 * @param code - Code Alpha-3 en minuscules (ex: "ben")
 * @returns CountryData ou null si non trouvé
 */
async function getCountryData(code: string): Promise<CountryData | null> {
  try {
    const countries = await fetchAllCountries();
    const country = countries.find(
      (c) => c.cca3.toLowerCase() === code.toLowerCase(),
    );
    return country || null;
  } catch {
    return null;
  }
}

/**
 * Récupère tous les pays pour les références (pays voisins, etc.).
 *
 * @returns Tableau de tous les pays
 */
async function getAllCountries(
  preloaded?: CountryData[],
): Promise<CountryData[]> {
  try {
    if (preloaded) return preloaded;
    return await fetchAllCountries();
  } catch {
    return [];
  }
}

async function getCountryPalette(
  country: CountryData,
): Promise<CountryPalette> {
  const c = country.colors;
  if (c && c.primary) {
    return {
      primary: c.primary,
      secondary: c.palette?.[1] || '#2D5986',
      accent: c.palette?.[2] || '#4A90D9',
      background: '#0A0A14',
      cca3: country.cca3,
      source: 'extracted',
      contrastRatio: 4.5,
    };
  }
  return {
    primary: '#1E3A5F',
    secondary: '#2D5986',
    accent: '#4A90D9',
    background: '#0A0A14',
    cca3: country.cca3,
    source: 'fallback',
    contrastRatio: 4.5,
  };
}

/**
 * Charge le contenu MDX pour un pays.
 * Retourne `source: null` silencieusement si absent.
 */
async function getCountryMDX(cca3: string): Promise<MDXContent> {
  try {
    return await loadMDX(cca3);
  } catch {
    return {
      cca3,
      source: null,
      frontmatter: {},
    };
  }
}

// ---------------------------------------------------------------------------
// Wikipedia — Fetch avec cascade de fallbacks et cache 24h
// ---------------------------------------------------------------------------

/**
 * Tente de récupérer un extrait Wikipedia pour un titre donné sur une langue.
 * Retourne null si la page n'existe pas ou si la réponse est invalide.
 *
 * Wikipedia REST API retourne 404 si la page n'existe pas exactement.
 * Elle gère aussi les redirections automatiquement (ex: "Benin" → "Bénin").
 */
async function fetchWikiExtract(
  title: string,
  lang: 'fr' | 'en',
): Promise<string | null> {
  try {
    const url = `https://${lang}.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(title)}`;
    const res = await fetch(url, {
      headers: {
        'User-Agent': 'AtlasGlobe/1.0 (contact@atlasglobe.example.com)',
        Accept: 'application/json',
      },
      next: { revalidate: 60 * 60 * 24 },
    });
    if (!res.ok) return null;
    const data = (await res.json()) as {
      extract?: string;
      type?: string;
    };
    // On ignore les pages de désambiguïsation
    if (data.type === 'disambiguation') return null;
    return typeof data.extract === 'string' && data.extract.length > 50
      ? data.extract
      : null;
  } catch {
    return null;
  }
}

/**
 * NOTE: Cascade de tentatives Wikipedia pour maximiser les hits :
 * 1. FR + nom commun  2. FR + nom officiel  3. EN + nom commun  4. EN + nom officiel
 * Résultat mis en cache 24h par Next.js Data Cache.
 */
const getCachedWikiSummary = unstable_cache(
  async (
    nameCommon: string,
    nameOfficial: string,
  ): Promise<string | null> => {
    const attempt1 = await fetchWikiExtract(nameCommon, 'fr');
    if (attempt1) return attempt1;

    const attempt2 = await fetchWikiExtract(nameOfficial, 'fr');
    if (attempt2) return attempt2;

    const attempt3 = await fetchWikiExtract(nameCommon, 'en');
    if (attempt3) return attempt3;

    const attempt4 = await fetchWikiExtract(nameOfficial, 'en');
    return attempt4;
  },
  ['wiki-summary-v2'],
  { revalidate: 60 * 60 * 24, tags: ['wiki-summary'] },
);

// ---------------------------------------------------------------------------
// Composant Page
// ---------------------------------------------------------------------------

interface PageProps {
  params: { code: string };
}

async function fetchCountryExtraData(code: string) {
  try {
    const res = await fetch(`https://restcountries.com/v3.1/alpha/${code}?fields=timezones,tld,idd`, {
      next: { revalidate: 86400 }
    });
    if (!res.ok) return {};
    const data = await res.json();
    return data || {};
  } catch {
    return {};
  }
}

export default async function CountryPage({ params }: PageProps) {
  const countries = await fetchAllCountries();
  const country = countries.find(
    (c) => c.cca3.toLowerCase() === params.code.toLowerCase(),
  );

  if (!country) {
    notFound();
  }

  // NOTE: Le GeoJSON local ne contient pas timezones, tld, ni idd.
  // Ces champs sont complétés via REST Countries API au moment du rendu.
  const extraData = await fetchCountryExtraData(country.cca3);
  const enrichedCountry = { ...country, ...extraData };

  const allCountries = await getAllCountries(countries);
  const palette = await getCountryPalette(enrichedCountry);
  const mdxContent = await getCountryMDX(enrichedCountry.cca3);
  const canonicalUrl = `https://atlas.example.com/pays/${params.code}`;

  const wikiSummary = await getCachedWikiSummary(
    enrichedCountry.name.common,
    enrichedCountry.name.official,
  );

  return (
    <CountryCard
      country={enrichedCountry}
      allCountries={allCountries}
      mdxContent={mdxContent}
      palette={palette}
      canonicalUrl={canonicalUrl}
      wikiSummary={wikiSummary}
    />
  );
}

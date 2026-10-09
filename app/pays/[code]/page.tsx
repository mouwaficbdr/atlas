/**
 * Route : /pays/[code]
 *
 * Génération statique (SSG) d'une page par État souverain (193) via
 * generateStaticParams. Charge les données pays + MDX au build et monte
 * CountryCard.
 */

import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { unstable_cache } from 'next/cache';
import CountryCard from '@/components/country/CountryCard';
import MDXSection from '@/components/country/MDXSection';
import { fetchAllCountries } from '@/lib/countries-api';
import { loadMDX } from '@/lib/mdx-loader';
import { SITE_URL } from '@/lib/site-config';
import { adjustForContrast, getContrastRatio } from '@/lib/contrast-checker';
import type { CountryData, CountryPalette, MDXContent } from '@/lib/types';

// SSG pur : les données sont figées au build, pas de revalidation.
export const dynamic = 'force-static';
export const revalidate = false;
// Les 193 codes sont tous connus au build : tout autre code renvoie un vrai
// 404 au lieu d'une page "Pays non trouvé" servie en 200 (soft 404, finding QA2).
export const dynamicParams = false;

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
      title: 'Pays introuvable',
    };
  }

  const canonicalUrl = `${SITE_URL}/pays/${params.code}`;
  const description =
    `Découvrez ${country.officialNameFr} sur atlas : population, superficie, capitale, langues, monnaie, et bien plus.`.slice(
      0,
      160,
    );

  // L'image Open Graph par pays est générée par opengraph-image.tsx (ratio
  // 1200x630 réel), Next.js la référence automatiquement.
  return {
    // Le gabarit du layout ajoute « · atlas » : ne pas le répéter ici.
    title: country.nameFr,
    description,
    openGraph: {
      title: `${country.nameFr} · atlas`,
      description,
      type: 'website',
      url: canonicalUrl,
    },
    twitter: {
      card: 'summary_large_image',
      title: `${country.nameFr} · atlas`,
      description,
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

const PALETTE_BACKGROUND = '#0A0A14';
const MIN_CONTRAST_RATIO = 4.5; // WCAG AA pour texte normal

async function getCountryPalette(
  country: CountryData,
): Promise<CountryPalette> {
  const c = country.colors;
  const rawPrimary = c?.primary || '#1E3A5F';
  const secondary = c?.palette?.[1] || '#2D5986';
  const accent = c?.palette?.[2] || '#4A90D9';

  // Le ratio annoncé est réellement calculé (et la couleur primaire ajustée
  // si besoin) via lib/contrast-checker.ts, plutôt que déclaré en dur.
  const primary = adjustForContrast(
    rawPrimary,
    PALETTE_BACKGROUND,
    MIN_CONTRAST_RATIO,
  );
  const contrastRatio = getContrastRatio(primary, PALETTE_BACKGROUND);

  return {
    primary,
    secondary,
    accent,
    background: PALETTE_BACKGROUND,
    cca3: country.cca3,
    source: c?.primary ? 'extracted' : 'fallback',
    contrastRatio,
  };
}

/**
 * Charge le contenu MDX pour un pays.
 * Retourne `raw: null` silencieusement si absent.
 */
async function getCountryMDX(cca3: string): Promise<MDXContent> {
  try {
    return await loadMDX(cca3);
  } catch {
    return {
      cca3,
      raw: null,
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
 * Cascade de tentatives Wikipedia, du plus pertinent pour un lecteur
 * francophone au plus permissif : FR avec le nom français, FR avec le nom
 * officiel français, puis repli sur l'anglais. Résultat mis en cache 24h.
 */
const getCachedWikiSummary = unstable_cache(
  async (
    nameFr: string,
    officialNameFr: string,
    nameEn: string,
    officialNameEn: string,
  ): Promise<string | null> => {
    const titles: Array<[string, 'fr' | 'en']> = [
      [nameFr, 'fr'],
      [officialNameFr, 'fr'],
      [nameEn, 'fr'],
      [nameEn, 'en'],
      [officialNameEn, 'en'],
    ];
    for (const [title, lang] of titles) {
      if (!title) continue;
      const extract = await fetchWikiExtract(title, lang);
      if (extract) return extract;
    }
    return null;
  },
  ['wiki-summary-v3'],
  { revalidate: 60 * 60 * 24, tags: ['wiki-summary'] },
);

// ---------------------------------------------------------------------------
// Composant Page
// ---------------------------------------------------------------------------

interface PageProps {
  params: { code: string };
}

export default async function CountryPage({ params }: PageProps) {
  const countries = await fetchAllCountries();
  const country = countries.find(
    (c) => c.cca3.toLowerCase() === params.code.toLowerCase(),
  );

  if (!country) {
    notFound();
  }

  const canonicalUrl = `${SITE_URL}/pays/${params.code}`;

  // Tout est figé dans countries-geo.json au build (timezones, tld, idd
  // inclus). Les tâches restantes sont indépendantes : Promise.all.
  const [allCountries, palette, mdxContent, wikiSummary] = await Promise.all([
    getAllCountries(countries),
    getCountryPalette(country),
    getCountryMDX(country.cca3),
    getCachedWikiSummary(
      country.nameFr,
      country.officialNameFr,
      country.name.common,
      country.name.official,
    ),
  ]);

  // Le MDX est rendu ici (composant serveur) et passé en slot à CountryCard,
  // qui est un composant client : il ne peut pas monter MDXSection lui-même.
  const mdxSlot = mdxContent.raw ? <MDXSection raw={mdxContent.raw} /> : null;

  return (
    <CountryCard
      key={country.cca3}
      country={country}
      allCountries={allCountries}
      mdxSlot={mdxSlot}
      palette={palette}
      canonicalUrl={canonicalUrl}
      wikiSummary={wikiSummary}
    />
  );
}

/**
 * ATLAS° Globe 3D — Page pays dynamique
 * Exigences : 3.5, 5.1, 7.1, 7.2, 9.1, 9.2, 9.3, 9.7, 11.5, 13.1, 13.3, 13.4
 *
 * Route : /pays/[code]
 * - Génération statique (SSG) de 195 pages via generateStaticParams
 * - Chargement des données pays + MDX au build
 * - Métadonnées SEO : title, description, og:tags, canonical
 * - Montage CountryCard avec palette dynamique
 */

import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { unstable_cache } from 'next/cache';
import CountryCard from '@/components/country/CountryCard';
import { fetchAllCountries } from '@/lib/countries-api';
import { loadMDX } from '@/lib/mdx-loader';
import type { CountryData, CountryPalette, MDXContent } from '@/lib/types';

// ---------------------------------------------------------------------------
// Configuration Next.js
// ---------------------------------------------------------------------------

/**
 * Force la génération statique complète (SSG) sans ISR ni SSR.
 * Exigence 11.5 : Génération statique pure pour les 195 pages pays.
 */
export const dynamic = 'force-static';

/**
 * Revalidation : pas de revalidation (SSG pur).
 * Les données sont figées au build.
 */
export const revalidate = false;

// ---------------------------------------------------------------------------
// generateStaticParams — Génération des 195 pages
// ---------------------------------------------------------------------------

/**
 * Génère les paramètres statiques pour les 195 pages pays.
 *
 * Exigence 3.5 : Récupération des 195 codes via REST Countries API.
 * Exigence 13.4 : Throw si API indisponible (interrompt le build).
 * Exigence 13.3 : Génération statique au build, pas de déploiement partiel.
 *
 * @returns Tableau de { code: string } pour chaque pays
 * @throws {Error} Si REST Countries API est indisponible
 */
export async function generateStaticParams() {
  try {
    const countries = await fetchAllCountries();
    return countries.map((country) => ({
      code: country.cca3.toLowerCase(),
    }));
  } catch (error) {
    // Exigence 13.4 : Throw explicite pour interrompre le build
    throw new Error(
      `[ATLAS] Impossible de générer les pages pays. Cause : ${
        error instanceof Error ? error.message : String(error)
      }`,
    );
  }
}

// ---------------------------------------------------------------------------
// Métadonnées SEO
// ---------------------------------------------------------------------------

/**
 * Génère les métadonnées SEO pour chaque page pays.
 *
 * Exigence 9.1 : URL permanente `/pays/[code_alpha3]` en minuscules
 * Exigence 9.2 : Balises Open Graph (og:title, og:description, og:image)
 * Exigence 9.3 : Élément <title> au format "[Nom du pays] — ATLAS°"
 * Exigence 9.7 : Balise <link rel="canonical">
 * Exigence 13.1 : Métadonnées SEO minimales (title, description, og:*, canonical)
 */
export async function generateMetadata({
  params,
}: {
  params: { code: string };
}): Promise<Metadata> {
  const country = await getCountryData(params.code);

  if (!country) {
    return {
      title: 'Pays non trouvé — ATLAS°',
    };
  }

  const canonicalUrl = `https://atlas.example.com/pays/${params.code}`;
  const description =
    `Découvrez ${country.name.official} sur ATLAS° : population, superficie, capitale, langues, monnaie, et bien plus.`.slice(
      0,
      160,
    );

  return {
    title: `${country.name.common} — ATLAS°`,
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
 *
 * Exigence 7.1 : Lecture depuis `/content/countries/[cca3].mdx`
 * Exigence 7.2 : Rendu entièrement statique au build
 *
 * @param cca3 - Code Alpha-3 du pays
 * @returns MDXContent
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
 * Cascade de tentatives Wikipedia pour maximiser les hits :
 *  1. FR + nom commun anglais (Wikipedia FR redirige souvent)
 *  2. FR + nom officiel (ex: "République du Bénin")
 *  3. EN + nom commun (fallback fiable)
 *  4. EN + nom officiel (dernier recours)
 *
 * Résultat mis en cache 24h par Next.js Data Cache (clé = cca3).
 */
const getCachedWikiSummary = unstable_cache(
  async (
    nameCommon: string,
    nameOfficial: string,
    cca3: string,
  ): Promise<string | null> => {
    // Tentative 1 : Wikipedia FR avec le nom commun anglais
    // (Wikipedia FR gère les redirections depuis les noms anglais)
    const attempt1 = await fetchWikiExtract(nameCommon, 'fr');
    if (attempt1) return attempt1;

    // Tentative 2 : Wikipedia FR avec le nom officiel
    // (utile pour "Micronesia" → "Federated States of Micronesia")
    const attempt2 = await fetchWikiExtract(nameOfficial, 'fr');
    if (attempt2) return attempt2;

    // Tentative 3 : Wikipedia EN avec le nom commun (très fiable)
    const attempt3 = await fetchWikiExtract(nameCommon, 'en');
    if (attempt3) return attempt3;

    // Tentative 4 : Wikipedia EN avec le nom officiel (dernier recours fiable)
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

/**
 * Page pays dynamique.
 *
 * Charge les données du pays, la palette de couleurs et le contenu MDX,
 * puis affiche la CountryCard avec toutes les dimensions de données.
 */
export default async function CountryPage({ params }: PageProps) {
  const countries = await fetchAllCountries();
  const country = countries.find(
    (c) => c.cca3.toLowerCase() === params.code.toLowerCase(),
  );

  if (!country) {
    notFound();
  }

  const allCountries = await getAllCountries(countries);
  const palette = await getCountryPalette(country);
  const mdxContent = await getCountryMDX(country.cca3);
  const canonicalUrl = `https://atlas.example.com/pays/${params.code}`;

  // Récupération Wikipedia avec cascade de fallbacks (FR → EN) et cache 24h.
  // La clé de cache est unique par pays (cca3) — au plus 4 requêtes HTTP par
  // pays par 24h (FR common, FR official, EN common, EN official).
  const wikiSummary = await getCachedWikiSummary(
    country.name.common,
    country.name.official,
    country.cca3,
  );

  return (
    <CountryCard
      country={country}
      allCountries={allCountries}
      mdxContent={mdxContent}
      palette={palette}
      canonicalUrl={canonicalUrl}
      wikiSummary={wikiSummary}
    />
  );
}

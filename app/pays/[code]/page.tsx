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
import CountryCard from '@/components/country/CountryCard';
import { fetchAllCountries } from '@/lib/countries-api';
import { loadMDX } from '@/lib/mdx-loader';
import { extractPalette } from '@/lib/color-extractor';
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
      `[ATLAS] Impossible de générer les pages pays. Cause : ${error instanceof Error ? error.message : String(error)
      }`
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
  const description = `Découvrez ${country.name.official} sur ATLAS° : population, superficie, capitale, langues, monnaie, et bien plus.`.slice(
    0,
    160
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
      (c) => c.cca3.toLowerCase() === code.toLowerCase()
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
async function getAllCountries(): Promise<CountryData[]> {
  try {
    return await fetchAllCountries();
  } catch {
    return [];
  }
}

/**
 * Extrait la palette de couleurs pour un pays.
 *
 * Exigence 5.1 : Extraction de palette au build.
 * Exigence 5.2 : Palette composée de 4 couleurs depuis le drapeau SVG.
 * Exigence 5.3 : Application de la palette via variables CSS.
 * Exigence 5.4 : Garantie de contraste WCAG AA.
 * Exigence 5.5 : Palette de repli si SVG indisponible.
 *
 * @param country - Données du pays
 * @returns CountryPalette
 */
async function getCountryPalette(country: CountryData): Promise<CountryPalette> {
  try {
    return await extractPalette(country.flags.svg, country.cca3);
  } catch {
    // Retourner une palette de repli en cas d'erreur
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
  // Récupérer les données du pays
  const country = await getCountryData(params.code);

  if (!country) {
    notFound();
  }

  // Récupérer tous les pays (pour les références)
  const allCountries = await getAllCountries();

  // Extraire la palette de couleurs
  const palette = await getCountryPalette(country);

  // Charger le contenu MDX
  const mdxContent = await getCountryMDX(country.cca3);

  // Construire l'URL canonique
  const canonicalUrl = `https://atlas.example.com/pays/${params.code}`;

  return (
    <CountryCard
      country={country}
      allCountries={allCountries}
      mdxContent={mdxContent}
      palette={palette}
      canonicalUrl={canonicalUrl}
    />
  );
}

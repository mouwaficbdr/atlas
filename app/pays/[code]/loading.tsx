/**
 * ATLAS° — Loading UI pour la route /pays/[code]
 *
 * Next.js 14 App Router : ce fichier s'affiche automatiquement
 * pendant le chargement SSR de la page pays (Suspense boundary).
 */

import CountryLoader from '@/components/country/CountryLoader';

export default function CountryLoading() {
  return <CountryLoader />;
}

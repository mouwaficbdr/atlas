import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { MAX_GUESSES } from '@/lib/daily';
import { defiUrl, parseDefi } from '@/lib/share-urls';
import ClientRedirect from '@/components/ui/ClientRedirect';

type Params = { params: { jour: string; grille: string } };

const frDay = new Intl.DateTimeFormat('fr-FR', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' });

export function generateMetadata({ params }: Params): Metadata {
  const r = parseDefi(params.jour, params.grille);
  if (!r) return {};
  const won = r.rows[r.rows.length - 1] === 'ok';
  const title = `Défi du ${frDay.format(new Date(`${r.day}T12:00:00Z`))} · ${won ? r.rows.length : 'X'}/${MAX_GUESSES}`;
  const description = 'Un pays par jour, le même pour tous : le globe se pose dessus, à vous de le nommer en trois essais.';
  return {
    title,
    description,
    robots: { index: false },
    openGraph: { title, description, url: defiUrl(r.day, r.rows), type: 'website' },
    twitter: { card: 'summary_large_image', title, description },
  };
}

/** Résultat partagé (#34) : l'aperçu montre la grille, le visiteur joue le défi du jour. */
export default function DefiResultPage({ params }: Params) {
  if (!parseDefi(params.jour, params.grille)) notFound();
  return <ClientRedirect href="/defi" />;
}

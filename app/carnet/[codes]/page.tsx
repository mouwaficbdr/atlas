import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { fetchAllCountries } from '@/lib/countries-api';
import { logbookUrl, parseLogbook } from '@/lib/share-urls';
import SharedLogbook from '@/components/ui/SharedLogbook';

async function resolve(path: string) {
  const countries = await fetchAllCountries();
  const codes = parseLogbook(path, new Set(countries.map((c) => c.cca3)));
  return codes.length ? { codes, total: countries.length } : null;
}

export async function generateMetadata({ params }: { params: { codes: string } }): Promise<Metadata> {
  const r = await resolve(params.codes);
  if (!r) return {};
  const n = r.codes.length;
  const title = `Carnet de vol · ${n} escale${n > 1 ? 's' : ''} sur ${r.total}`;
  const description = `${n} pays explorés sur atlas, le globe des ${r.total} États membres de l’ONU.`;
  return {
    title,
    description,
    robots: { index: false },
    openGraph: { title, description, url: logbookUrl(r.codes), type: 'website' },
    twitter: { card: 'summary_large_image', title, description },
  };
}

export default async function SharedLogbookPage({ params }: { params: { codes: string } }) {
  const r = await resolve(params.codes);
  if (!r) notFound();
  return <SharedLogbook codes={r.codes} />;
}

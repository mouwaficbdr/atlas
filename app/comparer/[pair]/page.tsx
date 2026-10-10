import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { fetchAllCountries } from '@/lib/countries-api';
import { compareUrl, parseCompare } from '@/lib/share-urls';
import ClientRedirect from '@/components/ui/ClientRedirect';

async function resolve(pair: string) {
  const countries = await fetchAllCountries();
  const codes = parseCompare(pair, new Set(countries.map((c) => c.cca3)));
  if (!codes) return null;
  const [a, b] = codes.map((code) => countries.find((c) => c.cca3 === code)!);
  return { a, b };
}

export async function generateMetadata({ params }: { params: { pair: string } }): Promise<Metadata> {
  const r = await resolve(params.pair);
  if (!r) return {};
  const title = `${r.a.nameFr} et ${r.b.nameFr} à taille réelle`;
  const description = `${r.a.nameFr} et ${r.b.nameFr} superposés à la même échelle, en projection équivalente : la vraie différence de taille, sans la déformation de Mercator.`;
  const url = compareUrl(r.a.cca3, r.b.cca3);
  return {
    title,
    description,
    alternates: { canonical: `/pays/${r.a.cca3.toLowerCase()}` },
    openGraph: { title, description, url, type: 'website' },
    twitter: { card: 'summary_large_image', title, description },
  };
}

export default async function ComparePage({ params }: { params: { pair: string } }) {
  const r = await resolve(params.pair);
  if (!r) notFound();
  return <ClientRedirect href={`/pays/${r.a.cca3.toLowerCase()}?comparer=${r.b.cca3.toLowerCase()}`} />;
}

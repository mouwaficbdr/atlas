import { NextResponse } from 'next/server';

export const runtime = 'edge';

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const title = searchParams.get('title')?.trim();

  if (!title) {
    return NextResponse.json({ extract: null }, { status: 400 });
  }

  if (title.length > 120) {
    return NextResponse.json({ extract: null }, { status: 400 });
  }

  const wikiUrl = `https://fr.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(title)}`;

  let upstreamRes: Response;
  try {
    upstreamRes = await fetch(wikiUrl, {
      headers: {
        'user-agent': 'AtlasGlobe/1.0',
        accept: 'application/json',
      },
      next: {
        revalidate: 60 * 60 * 24,
      },
    });
  } catch {
    return NextResponse.json({ extract: null }, { status: 200 });
  }

  if (!upstreamRes.ok) {
    return NextResponse.json(
      { extract: null },
      {
        status: 200,
        headers: {
          'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=86400',
        },
      },
    );
  }

  const data = (await upstreamRes.json()) as { extract?: string };

  return NextResponse.json(
    { extract: typeof data.extract === 'string' ? data.extract : null },
    {
      status: 200,
      headers: {
        'Cache-Control':
          'public, s-maxage=86400, stale-while-revalidate=604800',
      },
    },
  );
}

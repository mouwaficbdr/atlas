import { NextResponse } from 'next/server';

export const runtime = 'edge';

const RATE_LIMIT_WINDOW_MS = 60_000; // 1 minute
const RATE_LIMIT_MAX_REQUESTS = 20; // 20 requêtes / minute / IP

// État en mémoire de l'instance edge — best-effort : ne persiste pas entre
// isolates/régions ni redéploiements, mais suffit à empêcher un client isolé
// de spammer des titres distincts (jamais mis en cache) et d'épuiser le quota
// d'Edge Functions.
const requestTimestamps = new Map<string, number[]>();

function getClientIp(req: Request): string {
  return (
    req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    req.headers.get('x-real-ip') ||
    'unknown'
  );
}

function isRateLimited(ip: string): boolean {
  const now = Date.now();
  const recent = (requestTimestamps.get(ip) ?? []).filter(
    (t) => now - t < RATE_LIMIT_WINDOW_MS,
  );
  recent.push(now);
  requestTimestamps.set(ip, recent);
  return recent.length > RATE_LIMIT_MAX_REQUESTS;
}

export async function GET(req: Request) {
  if (isRateLimited(getClientIp(req))) {
    return NextResponse.json(
      { extract: null },
      { status: 429, headers: { 'Retry-After': '60' } },
    );
  }

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

  let data: { extract?: string };
  try {
    data = (await upstreamRes.json()) as { extract?: string };
  } catch {
    // Réponse 200 mais corps non-JSON/malformé côté Wikipedia — même
    // dégradation gracieuse que les autres cas d'échec de cette route.
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

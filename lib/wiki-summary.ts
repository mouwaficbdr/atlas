type CacheEntry = {
  value: string | null;
  expiresAt: number;
};

type CountryLike = {
  name?: {
    common?: string;
    official?: string;
  };
  translations?: {
    fra?: {
      common?: string;
    };
  };
};

const TTL_MS = 1000 * 60 * 60 * 24;

const cache = new Map<string, CacheEntry>();
const inFlight = new Map<string, Promise<string | null>>();

function normalizeTitle(title: string) {
  return title.trim();
}

export async function fetchWikiSummary(title: string): Promise<string | null> {
  const normalized = normalizeTitle(title);
  if (!normalized) return null;

  const now = Date.now();
  const cached = cache.get(normalized);
  if (cached && cached.expiresAt > now) {
    return cached.value;
  }

  const existing = inFlight.get(normalized);
  if (existing) return existing;

  const promise = (async () => {
    try {
      const res = await fetch(
        `/api/wiki-summary?title=${encodeURIComponent(normalized)}`,
      );
      if (!res.ok) {
        cache.set(normalized, { value: null, expiresAt: now + TTL_MS });
        return null;
      }
      const data = (await res.json()) as { extract?: string | null };
      const value = typeof data.extract === 'string' ? data.extract : null;
      cache.set(normalized, { value, expiresAt: Date.now() + TTL_MS });
      return value;
    } catch {
      cache.set(normalized, { value: null, expiresAt: now + 1000 * 30 });
      return null;
    } finally {
      inFlight.delete(normalized);
    }
  })();

  inFlight.set(normalized, promise);
  return promise;
}

export function prefetchWikiSummary(title: string) {
  void fetchWikiSummary(title);
}

export function getPreferredWikiTitle(country: unknown): string {
  const c = country as CountryLike | null | undefined;
  return (
    c?.translations?.fra?.common || c?.name?.common || c?.name?.official || ''
  );
}

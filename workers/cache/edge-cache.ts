// ==================== Phase 16B: Edge Caching Strategies ====================
//
// Layered caching:
//   1. Cloudflare Cache API (CDN) — search results, song detail
//   2. KV Store (global) — provider list (low-change data)
//   3. Origin (upstream API) — real-time only when cache misses
//
// No audio stream caching — audio goes directly from provider CDN to browser.

export interface EdgeCacheStrategy {
  /** Cache API TTL in seconds */
  cacheTTL: number;
  /** KV key prefix */
  kvPrefix: string;
  /** Whether to use stale-while-revalidate pattern */
  useSWR: boolean;
}

export const EDGE_CACHE_STRATEGIES: Record<string, EdgeCacheStrategy> = {
  search: { cacheTTL: 300, kvPrefix: "search", useSWR: true },
  songDetail: { cacheTTL: 600, kvPrefix: "song", useSWR: true },
  health: { cacheTTL: 30, kvPrefix: "hlth", useSWR: false },
  providerList: { cacheTTL: 3600, kvPrefix: "prov", useSWR: true },
};

/** Cache API helper: try cache first, fetch on miss, store result */
export async function getCachedOrFetch(
  request: Request,
  ctx: ExecutionContext,
  strategy: EdgeCacheStrategy,
  fetchFn: () => Promise<Response>,
): Promise<Response> {
  const cache = caches.default;
  const cached = await cache.match(request);
  if (cached) return cached;

  const response = await fetchFn();

  if (response.ok && strategy.cacheTTL > 0) {
    const headers = new Headers(response.headers);
    headers.set("Cache-Control", `public, max-age=${strategy.cacheTTL}`);
    headers.set("X-Edge-Cache", "MISS");

    const toCache = new Response(response.body, {
      status: response.status,
      statusText: response.statusText,
      headers,
    });

    ctx.waitUntil(cache.put(request, toCache));
  }

  return response;
}

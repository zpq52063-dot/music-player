/**
 * Phase 20A — Production Edge Cache Strategy
 *
 * Production-specific TTL values for Cloudflare Worker edge caching.
 * Uses caches.default (Cloudflare CDN) with stale-while-revalidate.
 */

export interface ProductionCacheStrategy {
  search: number;
  songDetail: number;
  health: number;
  providerList: number;
}

export const PRODUCTION_CACHE_TTL: ProductionCacheStrategy = {
  search: 600,       // 10 minutes
  songDetail: 1200,  // 20 minutes
  health: 60,        // 1 minute
  providerList: 3600, // 1 hour
};

export const PREVIEW_CACHE_TTL: ProductionCacheStrategy = {
  search: 300,
  songDetail: 600,
  health: 30,
  providerList: 1800,
};

export function getCacheTTL(environment: string): ProductionCacheStrategy {
  return environment === "production" ? PRODUCTION_CACHE_TTL : PREVIEW_CACHE_TTL;
}

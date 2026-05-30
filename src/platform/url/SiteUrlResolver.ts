/**
 * Phase 20A — Site URL Resolver
 *
 * Knows the canonical base URL at build time and runtime.
 * Resolution chain (first available wins):
 *   1. NEXT_PUBLIC_SITE_URL — user-configured custom domain
 *   2. CF_PAGES_URL — Cloudflare Pages auto-injected
 *   3. VERCEL_URL — Vercel auto-injected
 *   4. window.location.origin — browser fallback
 *
 * Works in both server (build-time) and client (runtime) contexts.
 */

/**
 * Normalize a raw URL/hostname into a canonical base URL.
 *
 * Defensively handles malformed inputs:
 *   "https//example.com"        → "https://example.com"
 *   "https://example.com"       → "https://example.com"
 *   "example.com"               → "https://example.com"
 *   "https://https//example..." → "https://example.com"
 *   "https://example.com/"      → "https://example.com"
 */
function normalizeBaseUrl(raw: string): string {
  // 1. Strip all leading protocol-like prefixes (including malformed ones)
  //    Matches: https://, http://, https//, http//, https:/, http:/
  let cleaned = raw.replace(
    /^(?:https?:\/\/|https?:\/+|https?:\/?)+/i,
    "",
  );
  // 2. Strip trailing slashes
  cleaned = cleaned.replace(/\/+$/, "");
  // 3. Prepend clean https://
  return `https://${cleaned}`;
}

function getBaseUrlServer(): string {
  if (typeof process !== "undefined") {
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL;
    if (siteUrl && siteUrl.length > 0) return normalizeBaseUrl(siteUrl);

    const cfPagesUrl = process.env.CF_PAGES_URL;
    if (cfPagesUrl && cfPagesUrl.length > 0) return normalizeBaseUrl(cfPagesUrl);

    const vercelUrl = process.env.VERCEL_URL;
    if (vercelUrl && vercelUrl.length > 0) return normalizeBaseUrl(vercelUrl);
  }
  return "";
}

function getBaseUrlClient(): string {
  if (typeof window !== "undefined") {
    return window.location.origin;
  }
  return "";
}

/** Returns the canonical base URL, or empty string if not determinable */
export function getSiteBaseUrl(): string {
  return getBaseUrlServer() || getBaseUrlClient();
}

/** Returns the base URL for manifest (must be same-origin for PWA) */
export function getManifestUrl(): string {
  const base = getSiteBaseUrl();
  return base ? `${base}/manifest.json` : "/manifest.json";
}

/** Returns the Worker API URL */
export function getWorkerUrl(): string {
  if (typeof process !== "undefined") {
    const workerUrl = process.env.NEXT_PUBLIC_CF_WORKER_URL;
    if (workerUrl && workerUrl.length > 0) return workerUrl;
  }
  return "";
}

/** Construct a full URL for an API path via the Worker proxy */
export function buildApiUrl(path: string): string {
  const base = getWorkerUrl();
  if (!base) return path;
  return `${base}${path.startsWith("/") ? path : `/${path}`}`;
}

/** Construct a full URL for an asset */
export function getAssetUrl(path: string): string {
  const base = getSiteBaseUrl();
  if (!base) return path;
  return `${base}${path.startsWith("/") ? path : `/${path}`}`;
}

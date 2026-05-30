// ==================== Phase 16B + Phase 20A: Environment Variable Access ====================

/**
 * Normalize a raw URL/hostname into a canonical base URL.
 * Defensively handles malformed protocols (https//, double https://, etc.)
 */
function normalizeBaseUrl(raw: string): string {
  let cleaned = raw.replace(/^(?:https?:\/\/|https?:\/+|https?:\/?)+/i, "");
  cleaned = cleaned.replace(/\/+$/, "");
  return `https://${cleaned}`;
}

export const RemoteEnv = {
  /** Cloudflare Worker URL for metadata/search proxy */
  workerUrl: (): string => {
    if (typeof process !== "undefined" && process.env?.NEXT_PUBLIC_CF_WORKER_URL) {
      return process.env.NEXT_PUBLIC_CF_WORKER_URL;
    }
    // Fallback: auto-discover Worker URL from Pages deployment
    if (typeof window !== "undefined") {
      const host = window.location.hostname;
      // If on pages.dev, use the known production Worker
      if (host.includes("pages.dev")) {
        return "https://music-proxy-production.zpq52063.workers.dev";
      }
      // If on localhost, try common Worker dev URLs
      if (host.includes("localhost")) {
        return "https://music-proxy-production.zpq52063.workers.dev";
      }
    }
    return "";
  },

  /** Whether a real Worker endpoint is configured */
  hasWorker: (): boolean => RemoteEnv.workerUrl().length > 0,

  /** Release mode (debug / internal / release) */
  releaseMode: (): string => {
    if (typeof process !== "undefined" && process.env?.NEXT_PUBLIC_RELEASE_MODE) {
      return process.env.NEXT_PUBLIC_RELEASE_MODE;
    }
    return "debug";
  },

  /** Whether running in production release mode */
  isProd: (): boolean => RemoteEnv.releaseMode() === "release",

  /** Whether running in debug mode (dev features enabled) */
  isDebug: (): boolean => RemoteEnv.releaseMode() === "debug",

  /** Canonical site URL (custom domain, CF Pages, or Vercel) */
  siteUrl: (): string => {
    if (typeof process !== "undefined" && process.env?.NEXT_PUBLIC_SITE_URL) {
      return normalizeBaseUrl(process.env.NEXT_PUBLIC_SITE_URL);
    }
    if (typeof process !== "undefined" && process.env?.CF_PAGES_URL) {
      return normalizeBaseUrl(process.env.CF_PAGES_URL);
    }
    if (typeof process !== "undefined" && process.env?.VERCEL_URL) {
      return normalizeBaseUrl(process.env.VERCEL_URL);
    }
    if (typeof window !== "undefined") {
      return window.location.origin;
    }
    return "";
  },

  /** Environment type (local / preview / production) */
  environmentType: (): "local" | "preview" | "production" => {
    const mode = RemoteEnv.releaseMode();
    if (mode === "release") return "production";
    if (mode === "internal") return "preview";
    return "local";
  },
};

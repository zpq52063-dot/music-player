// ==================== Phase 16B + Phase 20A: Environment Variable Access ====================

export const RemoteEnv = {
  /** Cloudflare Worker URL for metadata/search proxy */
  workerUrl: (): string => {
    if (typeof process !== "undefined" && process.env?.NEXT_PUBLIC_CF_WORKER_URL) {
      return process.env.NEXT_PUBLIC_CF_WORKER_URL;
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
      return process.env.NEXT_PUBLIC_SITE_URL;
    }
    if (typeof process !== "undefined" && process.env?.CF_PAGES_URL) {
      return `https://${process.env.CF_PAGES_URL}`;
    }
    if (typeof process !== "undefined" && process.env?.VERCEL_URL) {
      return `https://${process.env.VERCEL_URL}`;
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

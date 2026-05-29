/**
 * Phase 20A — Environment Governor
 *
 * Centralized environment detection and safety enforcement.
 * Strictly separates local / preview / production environments.
 *
 * Detection priority:
 *   1. NEXT_PUBLIC_RELEASE_MODE env var (canonical for production)
 *   2. CF_PAGES_BRANCH (Cloudflare Pages auto-inject)
 *   3. VERCEL_ENV (Vercel auto-inject)
 *   4. Hostname heuristics (localhost, .pages.dev, .vercel.app)
 */

export type EnvironmentType = "local" | "preview" | "production";

export interface EnvironmentConfig {
  type: EnvironmentType;
  debugOverlay: boolean;
  diagnostics: boolean;
  telemetry: boolean;
  verboseLogging: boolean;
  showSafetyBanner: boolean;
}

const ENV_CONFIGS: Record<EnvironmentType, EnvironmentConfig> = {
  local: {
    type: "local",
    debugOverlay: true,
    diagnostics: true,
    telemetry: true,
    verboseLogging: true,
    showSafetyBanner: true,
  },
  preview: {
    type: "preview",
    debugOverlay: false,
    diagnostics: false,
    telemetry: false,
    verboseLogging: false,
    showSafetyBanner: true,
  },
  production: {
    type: "production",
    debugOverlay: false,
    diagnostics: false,
    telemetry: false,
    verboseLogging: false,
    showSafetyBanner: false,
  },
};

let cachedEnvType: EnvironmentType | null = null;

export function detectEnvironmentType(): EnvironmentType {
  if (cachedEnvType) return cachedEnvType;

  // 1. Explicit release mode (canonical for production)
  if (typeof process !== "undefined") {
    const releaseMode = process.env.NEXT_PUBLIC_RELEASE_MODE;
    if (releaseMode === "release") {
      cachedEnvType = "production";
      return cachedEnvType;
    }
  }

  // 2. Cloudflare Pages branch injection
  if (typeof process !== "undefined" && process.env.CF_PAGES_BRANCH) {
    const branch = process.env.CF_PAGES_BRANCH;
    if (branch === "main" || branch === "master") {
      cachedEnvType = "production";
      return cachedEnvType;
    }
    cachedEnvType = "preview";
    return cachedEnvType;
  }

  // 3. Vercel environment
  if (typeof process !== "undefined") {
    const vercelEnv = process.env.NEXT_PUBLIC_VERCEL_ENV ?? process.env.VERCEL_ENV;
    if (vercelEnv === "production") {
      cachedEnvType = "production";
      return cachedEnvType;
    }
    if (vercelEnv === "preview") {
      cachedEnvType = "preview";
      return cachedEnvType;
    }
  }

  // 4. Hostname heuristics (browser-side)
  if (typeof window !== "undefined") {
    const host = window.location.hostname;

    if (host === "localhost" || host === "127.0.0.1") {
      cachedEnvType = "local";
      return cachedEnvType;
    }

    // Cloudflare Pages preview deployments
    if (host.endsWith(".pages.dev")) {
      // Production Cloudflare Pages uses the project name directly
      // e.g., music-player.pages.dev (production) vs XXX.music-player.pages.dev (preview)
      const parts = host.split(".");
      if (parts.length > 3 && parts[0] !== "music-player") {
        cachedEnvType = "preview";
        return cachedEnvType;
      }
      cachedEnvType = "production";
      return cachedEnvType;
    }

    // Vercel preview deployments (*-username.vercel.app)
    if (host.endsWith(".vercel.app") && host.includes("-")) {
      cachedEnvType = "preview";
      return cachedEnvType;
    }
  }

  // Default: local development
  if (typeof process !== "undefined") {
    const releaseMode = process.env.NEXT_PUBLIC_RELEASE_MODE;
    if (releaseMode === "internal") {
      cachedEnvType = "preview";
      return cachedEnvType;
    }
  }

  cachedEnvType = "local";
  return cachedEnvType;
}

export function getEnvironmentConfig(): EnvironmentConfig {
  const type = detectEnvironmentType();
  return { ...ENV_CONFIGS[type] };
}

export function isProduction(): boolean {
  return detectEnvironmentType() === "production";
}

export function isPreview(): boolean {
  return detectEnvironmentType() === "preview";
}

export function isLocal(): boolean {
  return detectEnvironmentType() === "local";
}

/** Throws if called in production. Use in debug-only code paths. */
export function assertNotProduction(context: string): void {
  if (isProduction()) {
    throw new Error(`[ProductionGuard] Operation not allowed in production: ${context}`);
  }
}

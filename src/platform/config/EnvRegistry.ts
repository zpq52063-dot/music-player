/**
 * Phase 20A — Environment Variable Registry
 *
 * Single source of truth for ALL env vars. Used by:
 * - next.config.ts (build-time validation)
 * - CI scripts (pre-deploy checks)
 * - EnvironmentGovernor (runtime detection)
 */

export interface EnvVarDefinition {
  key: string;
  required: boolean;
  defaultValue?: string;
  description: string;
  public: boolean;
  category: "supabase" | "deploy" | "provider" | "debug" | "cache" | "recovery" | "performance" | "telemetry" | "worker";
}

export const ENV_VAR_REGISTRY: EnvVarDefinition[] = [
  // ==================== Supabase ====================
  {
    key: "NEXT_PUBLIC_SUPABASE_URL",
    required: false,
    description: "Supabase project URL. Leave empty to run in local-only mode.",
    public: true,
    category: "supabase",
  },
  {
    key: "NEXT_PUBLIC_SUPABASE_ANON_KEY",
    required: false,
    description: "Supabase anonymous key for browser-side queries.",
    public: true,
    category: "supabase",
  },
  {
    key: "SUPABASE_SERVICE_ROLE_KEY",
    required: false,
    description: "Supabase service role key (server-side only, never expose to client).",
    public: false,
    category: "supabase",
  },

  // ==================== Deploy ====================
  {
    key: "NEXT_PUBLIC_RELEASE_MODE",
    required: true,
    defaultValue: "debug",
    description: "Release mode: debug | internal | release",
    public: true,
    category: "deploy",
  },
  {
    key: "NEXT_PUBLIC_SITE_URL",
    required: false,
    description: "Custom domain / canonical base URL for PWA manifest, OG tags. Falls back to CF_PAGES_URL → VERCEL_URL → window.location.origin.",
    public: true,
    category: "deploy",
  },

  // ==================== Provider ====================
  {
    key: "NEXT_PUBLIC_CF_WORKER_URL",
    required: false,
    description: "Cloudflare Worker URL for music API proxy (metadata/search/health).",
    public: true,
    category: "worker",
  },

  // ==================== Debug ====================
  {
    key: "NEXT_PUBLIC_DEBUG_OVERLAY",
    required: false,
    defaultValue: "true",
    description: "Enable debug overlay UI (only in debug mode).",
    public: true,
    category: "debug",
  },
  {
    key: "NEXT_PUBLIC_LOG_CATEGORIES",
    required: false,
    defaultValue: "audio,provider,playback,cache,debug",
    description: "Logger categories enabled in debug mode.",
    public: true,
    category: "debug",
  },

  // ==================== Cache ====================
  {
    key: "NEXT_PUBLIC_CACHE_CLEANUP_INTERVAL",
    required: false,
    defaultValue: "600000",
    description: "Cache governance cleanup interval (ms).",
    public: true,
    category: "cache",
  },
  {
    key: "NEXT_PUBLIC_LYRIC_MAX_AGE_DAYS",
    required: false,
    defaultValue: "7",
    description: "Maximum days to retain cached lyrics.",
    public: true,
    category: "cache",
  },
  {
    key: "NEXT_PUBLIC_HISTORY_MAX_ENTRIES",
    required: false,
    defaultValue: "500",
    description: "Maximum play history entries.",
    public: true,
    category: "cache",
  },
  {
    key: "NEXT_PUBLIC_METADATA_MAX_AGE_DAYS",
    required: false,
    defaultValue: "30",
    description: "Maximum days to retain cached metadata.",
    public: true,
    category: "cache",
  },

  // ==================== Recovery ====================
  {
    key: "NEXT_PUBLIC_WATCHDOG_INTERVAL",
    required: false,
    defaultValue: "2000",
    description: "Watchdog detection interval (ms).",
    public: true,
    category: "recovery",
  },
  {
    key: "NEXT_PUBLIC_WATCHDOG_STALL_THRESHOLD",
    required: false,
    defaultValue: "5000",
    description: "Watchdog stall threshold (ms, currentTime no change).",
    public: true,
    category: "recovery",
  },
  {
    key: "NEXT_PUBLIC_WATCHDOG_TIMEOUT_THRESHOLD",
    required: false,
    defaultValue: "30000",
    description: "Watchdog loading timeout threshold (ms).",
    public: true,
    category: "recovery",
  },
  {
    key: "NEXT_PUBLIC_SELF_HEALING_DEGRADE_THRESHOLD",
    required: false,
    defaultValue: "30",
    description: "Provider self-healing degradation threshold (0-100).",
    public: true,
    category: "recovery",
  },
  {
    key: "NEXT_PUBLIC_SELF_HEALING_PROBE_INTERVAL",
    required: false,
    defaultValue: "30000",
    description: "Provider self-healing recovery probe interval (ms).",
    public: true,
    category: "recovery",
  },

  // ==================== Performance ====================
  {
    key: "NEXT_PUBLIC_CLEANUP_INTERVAL",
    required: false,
    defaultValue: "600000",
    description: "Performance cleanup interval (ms).",
    public: true,
    category: "performance",
  },
  {
    key: "NEXT_PUBLIC_AUDIO_IDLE_TIMEOUT",
    required: false,
    defaultValue: "300000",
    description: "Audio idle timeout before cleanup (ms).",
    public: true,
    category: "performance",
  },

  // ==================== Telemetry ====================
  {
    key: "NEXT_PUBLIC_TELEMETRY_ENABLED",
    required: false,
    defaultValue: "true",
    description: "Telemetry toggle. Disabled in production release mode regardless of this setting.",
    public: true,
    category: "telemetry",
  },
  {
    key: "NEXT_PUBLIC_TELEMETRY_MAX_ENTRIES",
    required: false,
    defaultValue: "1000",
    description: "Maximum telemetry entries in ring buffer.",
    public: true,
    category: "telemetry",
  },
];

export interface EnvValidationResult {
  missing: string[];
  warnings: string[];
}

export function validateEnvVars(mode: "local" | "preview" | "production"): EnvValidationResult {
  const missing: string[] = [];
  const warnings: string[] = [];

  for (const def of ENV_VAR_REGISTRY) {
    const value = def.public
      ? process.env[def.key]
      : process.env[def.key];

    if (!value && def.required) {
      missing.push(def.key);
    }

    // Production-specific validations
    if (mode === "production") {
      if (def.key === "NEXT_PUBLIC_RELEASE_MODE" && value !== "release") {
        warnings.push(`NEXT_PUBLIC_RELEASE_MODE should be "release" in production, got "${value}"`);
      }
      if (def.key === "NEXT_PUBLIC_TELEMETRY_ENABLED" && value === "true") {
        warnings.push("Telemetry should be disabled in production");
      }
      if (def.key === "NEXT_PUBLIC_DEBUG_OVERLAY" && value === "true") {
        warnings.push("Debug overlay should be disabled in production");
      }
    }
  }

  return { missing, warnings };
}

export function getPublicEnvVars(): EnvVarDefinition[] {
  return ENV_VAR_REGISTRY.filter((d) => d.public);
}

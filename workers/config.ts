// ==================== Phase 16B: Cloudflare Worker Configuration ====================

export interface ProviderEndpoint {
  baseUrl: string;
  searchPath: string;
  timeoutMs: number;
  requiresAuth: boolean;
}

export interface WorkerConfig {
  /** Provider API configurations */
  providers: Record<string, ProviderEndpoint>;
  /** Edge cache TTL (seconds) */
  cacheTTL: {
    search: number;
    songDetail: number;
    health: number;
    providerList: number;
  };
  /** Rate limiting */
  rateLimit: {
    enabled: boolean;
    maxRequestsPerMinute: number;
  };
  /** Environment */
  environment: "development" | "staging" | "production";
}

export const defaultConfig: WorkerConfig = {
  providers: {
    "internet-archive": {
      baseUrl: "https://archive.org",
      searchPath: "/advancedsearch.php",
      timeoutMs: 10000,
      requiresAuth: false,
    },
    jamendo: {
      baseUrl: "https://api.jamendo.com/v3.0",
      searchPath: "/tracks/",
      timeoutMs: 8000,
      requiresAuth: true,
    },
    ccmixter: {
      baseUrl: "https://ccmixter.org",
      searchPath: "/api/query",
      timeoutMs: 8000,
      requiresAuth: false,
    },
  },
  cacheTTL: {
    search: 300,
    songDetail: 600,
    health: 30,
    providerList: 3600,
  },
  rateLimit: {
    enabled: true,
    maxRequestsPerMinute: 60,
  },
  environment: "production",
};

export function getConfig(): WorkerConfig {
  return { ...defaultConfig };
}

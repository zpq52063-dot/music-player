// ==================== Phase 16B: Worker Type Definitions ====================

/** Supported provider routes */
export type ProviderRoute = "internet-archive" | "jamendo" | "ccmixter";

/** Search query parameters */
export interface ProxySearchParams {
  q: string;
  provider: ProviderRoute | "all";
  type?: "song" | "playlist" | "artist" | "all";
  limit?: number;
  offset?: number;
}

/** Normalized song metadata response from Worker */
export interface ProxySongResponse {
  id: string;
  title: string;
  artist: string;
  album: string;
  cover_url: string;
  audio_url: string;
  duration: number;
  remoteId: string;
  provider: ProviderRoute;
  vip: boolean;
  quality: "standard" | "high" | "lossless";
}

/** Worker health response */
export interface WorkerHealthResponse {
  status: "ok" | "degraded" | "down";
  timestamp: number;
  providers: Record<string, ProviderHealthStatus>;
}

export interface ProviderHealthStatus {
  healthy: boolean;
  latency: number;
  lastCheck: number;
  consecutiveFails: number;
  error?: string;
}

/** Rate limiting */
export interface RateLimitEntry {
  count: number;
  resetAt: number;
}

export interface RateLimitConfig {
  maxRequestsPerMinute: number;
  enabled: boolean;
}

/** Standardized error response */
export interface WorkerErrorResponse {
  error: string;
  code: number;
}

/** Provider info for /api/providers endpoint */
export interface ProviderInfo {
  id: ProviderRoute;
  name: string;
  enabled: boolean;
  requiresAuth: boolean;
}

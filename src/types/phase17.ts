// ==================== Crash Recovery ====================

export interface CrashRecoveryState {
  songId: string | null;
  position: number;
  queueIds: string[];
  queueIndex: number;
  volume: number;
  isMuted: boolean;
  playMode: string;
  providerType: string | null;
  isPlaying: boolean;
  timestamp: number;
}

export interface CrashRecoveryResult {
  recovered: boolean;
  recoveredSongId: string | null;
  recoveredPosition: number;
  recoveredQueueIds: string[];
  recoveredQueueIndex: number;
  recoveredVolume: number;
  recoveredIsMuted: boolean;
  recoveredPlayMode: string;
  recoveredIsPlaying: boolean;
  timeMs: number;
}

// ==================== Provider Telemetry ====================

export interface ProviderMetricsV2 {
  providerType: string;
  totalRequests: number;
  totalSuccesses: number;
  totalFailures: number;
  totalTimeouts: number;
  totalFallbacks: number;
  avgLatencyMs: number;
  p50LatencyMs: number;
  p95LatencyMs: number;
  lastRequestTime: number;
  successRate: number;
  failureRate: number;
  recentLatencies: number[];
  hourlyRequests: HourlyBucket[];
}

export interface HourlyBucket {
  hour: string;
  requests: number;
  successes: number;
  failures: number;
}

export interface ProviderTelemetrySnapshot {
  providers: Record<string, ProviderMetricsV2>;
  globalFallbackCount: number;
  totalRequests: number;
  timestamp: number;
}

// ==================== Enhanced Cache Governance ====================

export interface LRUEntry {
  key: string;
  lastAccess: number;
  size: number;
}

export interface CacheGovernanceConfigV2 {
  cleanupIntervalMs: number;
  lyricMaxAgeDays: number;
  metadataMaxAgeDays: number;
  historyMaxEntries: number;
  maxTotalEntries: number;
  maxTotalSizeBytes: number;
  lruEvictionBatchSize: number;
  staleThresholdMs: number;
  lowStorageThresholdBytes: number;
}

export const DEFAULT_CACHE_GOVERNANCE_CONFIG_V2: CacheGovernanceConfigV2 = {
  cleanupIntervalMs: 600000,
  lyricMaxAgeDays: 7,
  metadataMaxAgeDays: 30,
  historyMaxEntries: 500,
  maxTotalEntries: 2000,
  maxTotalSizeBytes: 50 * 1024 * 1024,
  lruEvictionBatchSize: 50,
  staleThresholdMs: 24 * 60 * 60 * 1000,
  lowStorageThresholdBytes: 10 * 1024 * 1024,
};

// ==================== Battery Optimization ====================

export interface BatteryState {
  charging: boolean;
  level: number;
  chargingTime: number;
  dischargingTime: number;
  isLowPower: boolean;
}

export interface BatteryOptimizationConfig {
  animationThrottleMs: number;
  reducedMotion: boolean;
  lowPowerMode: boolean;
  visibilityOptimized: boolean;
}

export const DEFAULT_BATTERY_OPTIMIZATION: BatteryOptimizationConfig = {
  animationThrottleMs: 300,
  reducedMotion: false,
  lowPowerMode: false,
  visibilityOptimized: true,
};

// ==================== Stability Monitor ====================

export interface StabilityEvent {
  type: "background_playback" | "lock_screen" | "bluetooth" | "network_switch" | "weak_network" | "worker_timeout" | "safari_suspend" | "safari_resume";
  timestamp: number;
  details: string;
  recovered: boolean;
}

export interface StabilityReport {
  events: StabilityEvent[];
  backgroundPlayCount: number;
  lockScreenRecoveryCount: number;
  bluetoothSwitchCount: number;
  networkSwitchCount: number;
  weakNetworkCount: number;
  safariSuspendCount: number;
  safariResumeCount: number;
  sessionStart: number;
  uptimeMs: number;
}

// ==================== Error Boundary Enhancement ====================

export interface ErrorBoundaryConfig {
  maxRetries: number;
  autoRecoverDelayMs: number;
  degradeAfterErrors: number;
  componentName: string;
}

export interface ErrorLogEntry {
  error: string;
  componentStack: string;
  timestamp: number;
  retryCount: number;
  degraded: boolean;
}

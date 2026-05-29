/**
 * Phase 9 — 系统稳定化与自动化维护类型
 *
 * 包含: Watchdog / ProviderSelfHealing / CacheGovernance / Telemetry / ReleaseMode
 */

// ==================== Watchdog ====================

export type WatchdogEventType =
  | "stalled"
  | "timeout"
  | "invalid_url"
  | "provider_dead"
  | "queue_exhausted"
  | "audio_error";

export type WatchdogRecoveryAction =
  | "resume"
  | "reload_current"
  | "skip_to_next"
  | "none";

export interface WatchdogEvent {
  type: WatchdogEventType;
  timestamp: number;
  songId: string | null;
  details: string;
}

export interface WatchdogRecovery {
  action: WatchdogRecoveryAction;
  timestamp: number;
  eventType: WatchdogEventType;
  success: boolean;
}

export interface WatchdogState {
  isRunning: boolean;
  lastCheckTime: number;
  lastCurrentTime: number;
  stallCount: number;
  totalRecoveries: number;
  recentEvents: WatchdogEvent[];
  recentRecoveries: WatchdogRecovery[];
}

export interface WatchdogConfig {
  checkIntervalMs: number;
  stallThresholdMs: number;
  timeoutThresholdMs: number;
  maxStallCount: number;
  maxEvents: number;
  maxRecoveries: number;
}

export const DEFAULT_WATCHDOG_CONFIG: WatchdogConfig = {
  checkIntervalMs: 2000,
  stallThresholdMs: 5000,
  timeoutThresholdMs: 30000,
  maxStallCount: 3,
  maxEvents: 20,
  maxRecoveries: 20,
};

// ==================== Provider Self-Healing ====================

export interface ProviderScore {
  latencyScore: number;
  healthScore: number;
  compositeScore: number;
  lastUpdated: number;
}

export interface ProviderScoreMap {
  [type: string]: ProviderScore;
}

export interface SelfHealingConfig {
  /** 评分低于此值自动降级 */
  degradeThreshold: number;
  /** 评分高于此值自动恢复 */
  recoverThreshold: number;
  /** 连续失败降级阈值 */
  consecutiveFailuresForDegrade: number;
  /** 恢复探测间隔 ms */
  probeIntervalMs: number;
  /** 连续成功恢复阈值 */
  consecutiveSuccessesForRecovery: number;
  /** 失败冷却时间 ms */
  failureCooldownMs: number;
  /** 延迟满分阈值 ms */
  perfectLatencyMs: number;
  /** 延迟零分阈值 ms */
  worstLatencyMs: number;
}

export const DEFAULT_SELF_HEALING_CONFIG: SelfHealingConfig = {
  degradeThreshold: 30,
  recoverThreshold: 70,
  consecutiveFailuresForDegrade: 3,
  probeIntervalMs: 30000,
  consecutiveSuccessesForRecovery: 2,
  failureCooldownMs: 300000,
  perfectLatencyMs: 200,
  worstLatencyMs: 3000,
};

// ==================== Cache Governance ====================

export interface CacheGovernanceConfig {
  /** 定时清理间隔 ms */
  cleanupIntervalMs: number;
  /** 歌词最大保留天数 */
  lyricMaxAgeDays: number;
  /** 历史最大条数 */
  historyMaxEntries: number;
  /** 元数据最大保留天数 */
  metadataMaxAgeDays: number;
  /** IndexedDB 总条目上限 */
  maxTotalEntries: number;
  /** 内存缓存最大条目数 */
  memoryCacheMaxEntries: number;
  /** 内存压力阈值 (估算MB) */
  memoryPressureMB: number;
}

export const DEFAULT_CACHE_GOVERNANCE_CONFIG: CacheGovernanceConfig = {
  cleanupIntervalMs: 600000,
  lyricMaxAgeDays: 7,
  historyMaxEntries: 500,
  metadataMaxAgeDays: 30,
  maxTotalEntries: 2000,
  memoryCacheMaxEntries: 200,
  memoryPressureMB: 50,
};

export interface CacheCleanupResult {
  lyricsRemoved: number;
  historyRemoved: number;
  metadataRemoved: number;
  memoryEntriesEvicted: number;
  totalFreed: number;
  timestamp: number;
}

// ==================== Telemetry ====================

export interface TelemetryMetric {
  name: string;
  value: number;
  tags: Record<string, string>;
  timestamp: number;
}

export interface ProviderMetrics {
  providerType: string;
  totalRequests: number;
  totalSuccesses: number;
  totalFailures: number;
  avgLatencyMs: number;
  lastRequestTime: number;
}

export interface PlaybackMetrics {
  totalPlays: number;
  totalStalls: number;
  totalSkips: number;
  totalErrors: number;
  totalWatchdogRecoveries: number;
  avgSessionDurationMs: number;
  sessionStartTime: number;
}

export interface CacheMetrics {
  memoryHitRate: number;
  indexedDBHitRate: number;
  swHitRate: number;
  totalEvictions: number;
  totalSizeEstimate: number;
}

export interface StartupMetrics {
  appStartTime: number;
  timeToInteractive: number;
  recoveryTime: number;
  lastStartupTimestamp: number;
}

export interface TelemetrySnapshot {
  provider: Record<string, ProviderMetrics>;
  playback: PlaybackMetrics;
  cache: CacheMetrics;
  startup: StartupMetrics;
  timestamp: number;
}

export interface TelemetryStore {
  metrics: TelemetryMetric[];
  snapshot: TelemetrySnapshot;
  record: (metric: TelemetryMetric) => void;
  updateSnapshot: (partial: Partial<TelemetrySnapshot>) => void;
  getSnapshot: () => TelemetrySnapshot;
  exportJSON: () => string;
  clear: () => void;
}

// ==================== Release Mode ====================

export type ReleaseMode = "debug" | "internal" | "release";

export interface ReleaseConfig {
  mode: ReleaseMode;
  features: {
    debugOverlay: boolean;
    diagnosticsPage: boolean;
    watchdog: boolean;
    telemetry: boolean;
    logging: boolean;
    performanceMonitoring: boolean;
  };
}

export const RELEASE_CONFIGS: Record<ReleaseMode, ReleaseConfig> = {
  debug: {
    mode: "debug",
    features: {
      debugOverlay: true,
      diagnosticsPage: true,
      watchdog: true,
      telemetry: true,
      logging: true,
      performanceMonitoring: true,
    },
  },
  internal: {
    mode: "internal",
    features: {
      debugOverlay: false,
      diagnosticsPage: true,
      watchdog: true,
      telemetry: true,
      logging: false,
      performanceMonitoring: true,
    },
  },
  release: {
    mode: "release",
    features: {
      debugOverlay: false,
      diagnosticsPage: false,
      watchdog: true,
      telemetry: false,
      logging: false,
      performanceMonitoring: false,
    },
  },
};

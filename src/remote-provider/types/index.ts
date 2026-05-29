// ==================== Phase 16A: Remote Provider Types ====================

import type { Song } from "@/types";
import type { SearchResult } from "@/types/music";

// ==================== Remote Provider Health ====================

export interface RemoteProviderHealth {
  /** 是否健康 */
  healthy: boolean;
  /** 平均延迟 (ms) */
  avgLatency: number;
  /** 可用率 (0-1) */
  availability: number;
  /** 总请求数 */
  totalRequests: number;
  /** 成功请求数 */
  successRequests: number;
  /** 连续失败次数 */
  consecutiveFailures: number;
  /** 最近一次检查时间 */
  lastCheckTime: number;
  /** 最近一次成功时间 */
  lastSuccessTime: number;
}

// ==================== Remote Stream Info ====================

export interface RemoteStream {
  /** 音频流 URL */
  url: string;
  /** 音频格式 */
  format: "mp3" | "aac" | "flac" | "wav";
  /** 比特率 (kbps) */
  bitrate?: number;
  /** 过期时间戳 (0 = 不过期) */
  expireAt: number;
}

// ==================== Remote Song ====================

export interface RemoteSong extends Song {
  /** 远程供应商上的原始 ID */
  remoteId?: string;
  /** 是否需要 VIP */
  vip?: boolean;
  /** 音频质量 */
  quality?: "standard" | "high" | "lossless";
}

// ==================== Remote Provider Interface ====================

export interface RemoteProvider {
  /** Provider 唯一标识 */
  readonly id: string;
  /** Provider 名称 */
  readonly name: string;
  /** Provider 来源 (如 "cloudflare", "edge", "remote") */
  readonly source: string;

  /** 搜索歌曲/歌单/艺术家 */
  search(keyword: string, options?: RemoteSearchOptions): Promise<SearchResult>;

  /** 获取单首歌曲信息 */
  getSong(id: string): Promise<RemoteSong>;

  /** 获取歌词 */
  getLyrics(songId: string): Promise<string>;

  /** 获取音频流 */
  getStream(songId: string): Promise<RemoteStream>;

  /** 健康检查 */
  health(): Promise<RemoteProviderHealth>;
}

// ==================== Remote Search Options ====================

export interface RemoteSearchOptions {
  limit?: number;
  offset?: number;
  type?: "song" | "playlist" | "artist" | "all";
}

// ==================== Circuit Breaker State ====================

export type CircuitState = "closed" | "open" | "half-open";

export interface CircuitBreakerConfig {
  /** 连续失败阈值 (触发熔断) */
  failureThreshold: number;
  /** 熔断后等待时间 (ms) */
  resetTimeoutMs: number;
  /** 半开状态允许的探测请求数 */
  halfOpenMaxRequests: number;
}

// ==================== EdgeProvider Config ====================

export interface EdgeProviderConfig {
  /** 请求超时 (ms) */
  timeoutMs: number;
  /** 最大重试次数 */
  maxRetries: number;
  /** 重试延迟基数 (ms, 指数退避) */
  retryBaseDelayMs: number;
  /** 重试最大延迟 (ms) */
  retryMaxDelayMs: number;
  /** 健康评分阈值 (低于此值触发 fallback) */
  healthScoreThreshold: number;
  /** Fallback 策略 */
  fallbackStrategy: "priority" | "health" | "latency";
  /** 熔断器配置 */
  circuitBreaker: CircuitBreakerConfig;
}

export const DEFAULT_EDGE_CONFIG: EdgeProviderConfig = {
  timeoutMs: 10000,
  maxRetries: 3,
  retryBaseDelayMs: 1000,
  retryMaxDelayMs: 10000,
  healthScoreThreshold: 0.3,
  fallbackStrategy: "priority",
  circuitBreaker: {
    failureThreshold: 5,
    resetTimeoutMs: 30000,
    halfOpenMaxRequests: 3,
  },
};

// ==================== Remote Config ====================

export interface RemoteProviderEntry {
  id: string;
  priority: number;
  enabled: boolean;
}

export interface RemoteConfigData {
  /** Provider 优先级列表 */
  providerPriority: RemoteProviderEntry[];
  /** 请求超时 (ms) */
  timeoutMs: number;
  /** 最大重试次数 */
  maxRetries: number;
  /** Fallback 策略 */
  fallbackStrategy: "priority" | "health" | "latency";
  /** 健康检查间隔 (ms) */
  healthCheckIntervalMs: number;
}

export const DEFAULT_REMOTE_CONFIG: RemoteConfigData = {
  providerPriority: [],
  timeoutMs: 10000,
  maxRetries: 3,
  fallbackStrategy: "priority",
  healthCheckIntervalMs: 30000,
};

// ==================== Edge Provider Manager State ====================

export interface EdgeManagerState {
  /** 当前活跃 provider ID */
  activeProviderId: string | null;
  /** 各 provider 健康快照 */
  healthSnapshots: Record<string, RemoteProviderHealth>;
  /** 各 provider 熔断状态 */
  circuitStates: Record<string, CircuitState>;
  /** 各 provider 重试计数 */
  retryCounts: Record<string, number>;
  /** 各 provider 延迟样本 */
  latencySamples: Record<string, number[]>;
}

// ==================== Provider Health Dashboard (dev only) ====================

export interface DashboardProviderInfo {
  id: string;
  name: string;
  source: string;
  active: boolean;
  latency: number;
  availability: number;
  retryCount: number;
  circuitState: CircuitState;
  healthy: boolean;
  lastCheck: number;
}

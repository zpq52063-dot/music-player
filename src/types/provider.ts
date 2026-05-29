// ==================== Phase 7: Provider 管理类型 ====================

import type { ProviderType } from "@/music-source/types";

// ==================== Provider 健康状态 ====================

export interface ProviderHealthSnapshot {
  /** 平均延迟 (ms) */
  avgLatency: number;
  /** 成功率 (0-100) */
  successRate: number;
  /** 连续失败次数 */
  consecutiveFailures: number;
  /** 总请求次数 (滑动窗口) */
  totalRequests: number;
  /** 总成功次数 */
  totalSuccesses: number;
  /** 是否健康 */
  healthy: boolean;
  /** 最近一次检查时间 */
  lastCheckTime: number;
  /** 最近一次成功时间 */
  lastSuccessTime: number;
}

export interface ProviderHealthMap {
  [type: string]: ProviderHealthSnapshot;
}

// ==================== Provider 状态 ====================

export type ProviderStatus = "active" | "fallback" | "degraded" | "offline";

export type FallbackReason =
  | "timeout"
  | "network_error"
  | "server_error"
  | "invalid_response"
  | "rate_limited"
  | "consecutive_failures"
  | "low_success_rate"
  | "high_latency"
  | "manual";

// ==================== Provider Store State ====================

export interface ProviderState {
  /** 当前活跃 provider 类型 */
  currentProvider: ProviderType;
  /** 用户偏好的 provider 优先级列表 */
  providerPriority: ProviderType[];
  /** 各 provider 健康数据 */
  health: ProviderHealthMap;
  /** 当前 provider 状态 */
  status: ProviderStatus;
  /** 最近一次 fallback 原因 */
  lastFallbackReason: FallbackReason | null;
  /** 最近一次 fallback 时间 */
  lastFallbackTime: number | null;
  /** 当前请求状态 */
  requestStatus: "idle" | "loading" | "success" | "error";
  /** 请求错误信息 */
  requestError: string | null;
}

export interface ProviderActions {
  setCurrentProvider: (type: ProviderType) => void;
  setProviderPriority: (priority: ProviderType[]) => void;
  updateHealth: (type: ProviderType, health: ProviderHealthSnapshot) => void;
  setStatus: (status: ProviderStatus) => void;
  setFallback: (reason: FallbackReason) => void;
  setRequestStatus: (status: "idle" | "loading" | "success" | "error", error?: string) => void;
  resetProvider: () => void;
}

export type ProviderStore = ProviderState & ProviderActions;

// ==================== 请求重试配置 ====================

export interface RetryConfig {
  maxRetries: number;
  baseDelayMs: number;
  maxDelayMs: number;
  timeoutMs: number;
}

export const DEFAULT_RETRY_CONFIG: RetryConfig = {
  maxRetries: 3,
  baseDelayMs: 1000,
  maxDelayMs: 10000,
  timeoutMs: 10000,
};

// ==================== Provider 注册条目 ====================

export interface ProviderEntry {
  type: ProviderType;
  priority: number;
  enabled: boolean;
}

// ==================== API 代理配置 ====================

export interface ProxyConfig {
  baseUrl: string;
  timeout: number;
  retry: RetryConfig;
  headers: Record<string, string>;
}

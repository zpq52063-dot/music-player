// ==================== Phase 16A: Remote Config System ====================

import type { RemoteConfigData, RemoteProviderEntry } from "../types";
import { DEFAULT_REMOTE_CONFIG } from "../types";

// ==================== Storage Key ====================

const STORAGE_KEY = "music_remote_config";

// ==================== RemoteConfig ====================

export class RemoteConfig {
  private data: RemoteConfigData;
  private listeners: Set<(config: RemoteConfigData) => void> = new Set();

  constructor() {
    this.data = this.load();
  }

  // ==================== Provider Priority ====================

  /** 获取 Provider 优先级列表 */
  getProviderPriority(): RemoteProviderEntry[] {
    return [...this.data.providerPriority];
  }

  /** 设置 Provider 优先级列表 */
  setProviderPriority(entries: RemoteProviderEntry[]): void {
    this.data.providerPriority = entries.map((e) => ({ ...e }));
    this.save();
  }

  /** 添加 Provider 到优先级列表 */
  addProvider(id: string, priority?: number): void {
    const existing = this.data.providerPriority.find((e) => e.id === id);
    if (existing) {
      existing.enabled = true;
      if (priority !== undefined) existing.priority = priority;
    } else {
      this.data.providerPriority.push({
        id,
        priority: priority ?? this.data.providerPriority.length,
        enabled: true,
      });
    }
    this.sortPriorities();
    this.save();
  }

  /** 移除 Provider */
  removeProvider(id: string): void {
    this.data.providerPriority = this.data.providerPriority.filter((e) => e.id !== id);
    this.save();
  }

  /** 启用 Provider */
  enableProvider(id: string): void {
    const entry = this.data.providerPriority.find((e) => e.id === id);
    if (entry) {
      entry.enabled = true;
      this.save();
    }
  }

  /** 禁用 Provider */
  disableProvider(id: string): void {
    const entry = this.data.providerPriority.find((e) => e.id === id);
    if (entry) {
      entry.enabled = false;
      this.save();
    }
  }

  /** 检查 Provider 是否启用 */
  isProviderEnabled(id: string): boolean {
    const entry = this.data.providerPriority.find((e) => e.id === id);
    return entry?.enabled ?? true;
  }

  // ==================== Timeout ====================

  /** 获取远程请求超时 */
  getTimeout(): number {
    return this.data.timeoutMs;
  }

  /** 设置远程请求超时 */
  setTimeout(ms: number): void {
    this.data.timeoutMs = Math.max(1000, Math.min(60000, ms));
    this.save();
  }

  // ==================== Retry ====================

  /** 获取最大重试次数 */
  getMaxRetries(): number {
    return this.data.maxRetries;
  }

  /** 设置最大重试次数 */
  setMaxRetries(n: number): void {
    this.data.maxRetries = Math.max(0, Math.min(10, n));
    this.save();
  }

  // ==================== Fallback Strategy ====================

  /** 获取 Fallback 策略 */
  getFallbackStrategy(): "priority" | "health" | "latency" {
    return this.data.fallbackStrategy;
  }

  /** 设置 Fallback 策略 */
  setFallbackStrategy(strategy: "priority" | "health" | "latency"): void {
    this.data.fallbackStrategy = strategy;
    this.save();
  }

  // ==================== Health Check ====================

  /** 获取健康检查间隔 */
  getHealthCheckInterval(): number {
    return this.data.healthCheckIntervalMs;
  }

  /** 设置健康检查间隔 */
  setHealthCheckInterval(ms: number): void {
    this.data.healthCheckIntervalMs = Math.max(5000, Math.min(300000, ms));
    this.save();
  }

  // ==================== Full Config ====================

  /** 获取完整配置 */
  getConfig(): RemoteConfigData {
    return {
      providerPriority: this.data.providerPriority.map((e) => ({ ...e })),
      timeoutMs: this.data.timeoutMs,
      maxRetries: this.data.maxRetries,
      fallbackStrategy: this.data.fallbackStrategy,
      healthCheckIntervalMs: this.data.healthCheckIntervalMs,
    };
  }

  /** 重置为默认配置 */
  reset(): void {
    this.data = { ...DEFAULT_REMOTE_CONFIG, providerPriority: [] };
    this.save();
  }

  // ==================== Listeners ====================

  /** 订阅配置变更 */
  subscribe(listener: (config: RemoteConfigData) => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  // ==================== Private ====================

  private load(): RemoteConfigData {
    if (typeof localStorage === "undefined") {
      return { ...DEFAULT_REMOTE_CONFIG, providerPriority: [] };
    }

    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return { ...DEFAULT_REMOTE_CONFIG, providerPriority: [] };

      const parsed = JSON.parse(raw) as Partial<RemoteConfigData>;
      return {
        providerPriority: Array.isArray(parsed.providerPriority)
          ? parsed.providerPriority
          : [],
        timeoutMs: typeof parsed.timeoutMs === "number" ? parsed.timeoutMs : DEFAULT_REMOTE_CONFIG.timeoutMs,
        maxRetries: typeof parsed.maxRetries === "number" ? parsed.maxRetries : DEFAULT_REMOTE_CONFIG.maxRetries,
        fallbackStrategy:
          parsed.fallbackStrategy === "priority" ||
          parsed.fallbackStrategy === "health" ||
          parsed.fallbackStrategy === "latency"
            ? parsed.fallbackStrategy
            : DEFAULT_REMOTE_CONFIG.fallbackStrategy,
        healthCheckIntervalMs:
          typeof parsed.healthCheckIntervalMs === "number"
            ? parsed.healthCheckIntervalMs
            : DEFAULT_REMOTE_CONFIG.healthCheckIntervalMs,
      };
    } catch {
      return { ...DEFAULT_REMOTE_CONFIG, providerPriority: [] };
    }
  }

  private save(): void {
    if (typeof localStorage === "undefined") return;

    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.data));
    } catch {
      // localStorage full or unavailable
    }

    this.notifyListeners();
  }

  private sortPriorities(): void {
    this.data.providerPriority.sort((a, b) => a.priority - b.priority);
  }

  private notifyListeners(): void {
    const config = this.getConfig();
    for (const listener of this.listeners) {
      try {
        listener(config);
      } catch {
        // 忽略 listener 错误
      }
    }
  }
}

// ==================== 全局单例 ====================

let _remoteConfig: RemoteConfig | null = null;

export function getRemoteConfig(): RemoteConfig {
  if (!_remoteConfig) _remoteConfig = new RemoteConfig();
  return _remoteConfig;
}

export function resetRemoteConfig(): void {
  if (_remoteConfig) {
    _remoteConfig.reset();
    _remoteConfig = null;
  }
}

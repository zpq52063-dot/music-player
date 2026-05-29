// ==================== Phase 16A: Edge Provider Manager ====================

import type {
  RemoteProvider,
  RemoteProviderHealth,
  EdgeProviderConfig,
  EdgeManagerState,
  CircuitState,
  RemoteStream,
  RemoteSong,
} from "../types";
import { DEFAULT_EDGE_CONFIG } from "../types";
import type { SearchResult } from "@/types/music";

// ==================== 注册条目 ====================

interface ProviderEntry {
  provider: RemoteProvider;
  priority: number;
  enabled: boolean;
}

// ==================== Circuit Breaker ====================

interface CircuitBreakerEntry {
  state: CircuitState;
  failureCount: number;
  lastFailureTime: number;
  halfOpenRequests: number;
  openedAt: number;
}

// ==================== Health Window Entry ====================

interface HealthWindowEntry {
  success: boolean;
  latencyMs: number;
  timestamp: number;
}

// ==================== EdgeProviderManager ====================

export class EdgeProviderManager {
  private registry: Map<string, ProviderEntry> = new Map();
  private config: EdgeProviderConfig;

  // 熔断器状态
  private circuits: Map<string, CircuitBreakerEntry> = new Map();

  // 健康滑动窗口 (最近 100 次请求)
  private healthWindows: Map<string, HealthWindowEntry[]> = new Map();

  // 延迟样本 (最近 20 次)
  private latencySamples: Map<string, number[]> = new Map();

  // 重试计数
  private retryCounts: Map<string, number> = new Map();

  // 健康检查定时器
  private healthCheckTimers: Map<string, ReturnType<typeof setInterval>> = new Map();

  // 当前活跃 provider
  private activeId: string | null = null;

  // 回调
  private onFallback?: (fromId: string, toId: string, reason: string) => void;
  private onRecover?: (id: string) => void;
  private onStateChange?: (state: EdgeManagerState) => void;

  constructor(config?: Partial<EdgeProviderConfig>) {
    this.config = { ...DEFAULT_EDGE_CONFIG, ...config };
  }

  // ==================== 注册 ====================

  /** 注册 Remote Provider */
  register(provider: RemoteProvider, priority: number = 100): void {
    this.registry.set(provider.id, {
      provider,
      priority,
      enabled: true,
    });
    this.initCircuit(provider.id);
    this.initHealthWindow(provider.id);

    // 自动激活最高优先级的 provider
    this.autoActivate();
  }

  /** 注销 Provider */
  unregister(id: string): void {
    this.registry.delete(id);
    this.circuits.delete(id);
    this.healthWindows.delete(id);
    this.latencySamples.delete(id);
    this.retryCounts.delete(id);
    this.stopHealthCheck(id);

    if (this.activeId === id) {
      this.activeId = null;
      this.autoActivate();
    }
  }

  /** 启用/禁用 Provider */
  setEnabled(id: string, enabled: boolean): void {
    const entry = this.registry.get(id);
    if (!entry) return;
    entry.enabled = enabled;

    if (!enabled && this.activeId === id) {
      this.fallbackToNext(id, "disabled");
    } else if (enabled) {
      this.autoActivate();
    }
  }

  /** 设置优先级列表 */
  setPriority(ids: string[]): void {
    ids.forEach((id, index) => {
      const entry = this.registry.get(id);
      if (entry) entry.priority = index;
    });
    this.autoActivate();
  }

  // ==================== 核心执行 ====================

  /** 执行搜索 (带 timeout / retry / fallback) */
  async search(keyword: string, options?: {
    limit?: number;
    offset?: number;
    type?: "song" | "playlist" | "artist" | "all";
  }): Promise<SearchResult> {
    return this.executeWithFallback(
      (p) => p.search(keyword, options),
      "search",
    );
  }

  /** 获取歌曲 */
  async getSong(id: string): Promise<RemoteSong> {
    return this.executeWithFallback(
      (p) => p.getSong(id),
      "getSong",
    );
  }

  /** 获取歌词 */
  async getLyrics(songId: string): Promise<string> {
    return this.executeWithFallback(
      (p) => p.getLyrics(songId),
      "getLyrics",
    );
  }

  /** 获取音频流 */
  async getStream(songId: string): Promise<RemoteStream> {
    return this.executeWithFallback(
      (p) => p.getStream(songId),
      "getStream",
    );
  }

  /** 健康检查所有已注册 provider */
  async checkAllHealth(): Promise<Record<string, RemoteProviderHealth>> {
    const results: Record<string, RemoteProviderHealth> = {};
    const entries = Array.from(this.registry.entries());

    await Promise.all(
      entries.map(async ([id, entry]) => {
        if (!entry.enabled) return;
        try {
          const health = await this.executeWithTimeout(
            entry.provider.health(),
            this.config.timeoutMs,
          );
          results[id] = health;
          this.recordSuccess(id, health.avgLatency);
        } catch {
          this.recordFailure(id);
          results[id] = this.getHealthSnapshot(id);
        }
      }),
    );

    return results;
  }

  // ==================== 查询 ====================

  /** 获取当前活跃 provider ID */
  getActiveId(): string | null {
    return this.activeId;
  }

  /** 获取当前活跃 provider */
  getActive(): RemoteProvider | null {
    if (!this.activeId) return null;
    return this.registry.get(this.activeId)?.provider ?? null;
  }

  /** 获取所有已注册 provider ID */
  getRegisteredIds(): string[] {
    return Array.from(this.registry.keys());
  }

  /** 获取健康快照 */
  getHealthSnapshot(id: string): RemoteProviderHealth {
    const window = this.healthWindows.get(id) ?? [];
    const total = window.length;
    const success = window.filter((e) => e.success).length;
    const avgLatency =
      total > 0 ? window.reduce((sum, e) => sum + e.latencyMs, 0) / total : 0;

    const consecutiveFails = this.getConsecutiveFailures(id);
    const healthy = this.isHealthy(id);

    return {
      healthy,
      avgLatency: Math.round(avgLatency),
      availability: total > 0 ? success / total : 1,
      totalRequests: total,
      successRequests: success,
      consecutiveFailures: consecutiveFails,
      lastCheckTime: window.length > 0 ? window[window.length - 1]!.timestamp : 0,
      lastSuccessTime: this.getLastSuccessTime(id),
    };
  }

  /** 获取完整状态快照 */
  getState(): EdgeManagerState {
    const healthSnapshots: Record<string, RemoteProviderHealth> = {};
    const circuitStates: Record<string, CircuitState> = {};
    const retryCountsOut: Record<string, number> = {};
    const latencySamplesOut: Record<string, number[]> = {};

    for (const id of this.registry.keys()) {
      healthSnapshots[id] = this.getHealthSnapshot(id);
      circuitStates[id] = this.getCircuitState(id);
      retryCountsOut[id] = this.retryCounts.get(id) ?? 0;
      latencySamplesOut[id] = [...(this.latencySamples.get(id) ?? [])];
    }

    return {
      activeProviderId: this.activeId,
      healthSnapshots,
      circuitStates,
      retryCounts: retryCountsOut,
      latencySamples: latencySamplesOut,
    };
  }

  // ==================== 回调 ====================

  setOnFallback(cb: (fromId: string, toId: string, reason: string) => void): void {
    this.onFallback = cb;
  }

  setOnRecover(cb: (id: string) => void): void {
    this.onRecover = cb;
  }

  setOnStateChange(cb: (state: EdgeManagerState) => void): void {
    this.onStateChange = cb;
  }

  // ==================== 生命周期 ====================

  /** 启动健康检查 */
  startHealthChecks(intervalMs: number = 30000): void {
    for (const id of this.registry.keys()) {
      this.startHealthCheck(id, intervalMs);
    }
  }

  /** 停止所有健康检查 */
  stopAllHealthChecks(): void {
    for (const id of this.healthCheckTimers.keys()) {
      this.stopHealthCheck(id);
    }
  }

  /** 销毁管理器 */
  destroy(): void {
    this.stopAllHealthChecks();
    this.registry.clear();
    this.circuits.clear();
    this.healthWindows.clear();
    this.latencySamples.clear();
    this.retryCounts.clear();
    this.activeId = null;
  }

  // ==================== Private: 执行 ====================

  private async executeWithFallback<T>(
    fn: (provider: RemoteProvider) => Promise<T>,
    operation: string,
  ): Promise<T> {
    const chain = this.getFallbackChain();
    let lastError: Error | null = null;

    for (const id of chain) {
      const entry = this.registry.get(id);
      if (!entry || !entry.enabled) continue;

      // 检查熔断
      if (this.isCircuitOpen(id)) {
        continue;
      }

      const startTime = Date.now();

      try {
        const result = await this.executeWithRetry(
          () => this.executeWithTimeout(fn(entry.provider), this.config.timeoutMs),
          this.config.maxRetries,
        );

        const latency = Date.now() - startTime;
        this.recordSuccess(id, latency);
        this.notifyStateChange();
        return result;
      } catch (err) {
        lastError = err as Error;
        this.recordFailure(id);
        this.notifyStateChange();

        // 触发 fallback
        if (id === this.activeId) {
          const next = this.findNextHealthy(id);
          if (next) {
            this.onFallback?.(id, next, `[${operation}] ${lastError.message}`);
          }
        }
      }
    }

    throw lastError ?? new Error(`All providers failed for: ${operation}`);
  }

  private async executeWithTimeout<T>(promise: Promise<T>, timeoutMs: number): Promise<T> {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);

    try {
      const result = await Promise.race([
        promise,
        new Promise<never>((_, reject) => {
          controller.signal.addEventListener("abort", () =>
            reject(new Error(`Request timeout after ${timeoutMs}ms`)),
          );
        }),
      ]);
      return result;
    } finally {
      clearTimeout(timer);
    }
  }

  private async executeWithRetry<T>(
    fn: () => Promise<T>,
    maxRetries: number,
  ): Promise<T> {
    let lastError: Error | null = null;

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        return await fn();
      } catch (err) {
        lastError = err as Error;
        if (attempt < maxRetries) {
          const delay = Math.min(
            this.config.retryBaseDelayMs * Math.pow(2, attempt),
            this.config.retryMaxDelayMs,
          );
          await new Promise((r) => setTimeout(r, delay + Math.random() * 200));
        }
      }
    }

    throw lastError ?? new Error("Max retries exceeded");
  }

  // ==================== Private: Fallback ====================

  private getFallbackChain(): string[] {
    const sorted = this.getSortedEnabledIds();
    if (!this.activeId) return sorted;

    // 根据策略排序
    switch (this.config.fallbackStrategy) {
      case "health":
        return this.sortByHealth(sorted);
      case "latency":
        return this.sortByLatency(sorted);
      case "priority":
      default:
        return this.sortByPriority(sorted);
    }
  }

  private fallbackToNext(fromId: string, reason: string): void {
    const next = this.findNextHealthy(fromId);
    if (next && next !== fromId) {
      this.activeId = next;
      this.onFallback?.(fromId, next, reason);
    }
  }

  private findNextHealthy(skipId: string): string | null {
    for (const id of this.getSortedEnabledIds()) {
      if (id === skipId) continue;
      if (this.isHealthy(id) && !this.isCircuitOpen(id)) return id;
    }
    return null;
  }

  private autoActivate(): void {
    if (this.activeId && this.registry.has(this.activeId)) return;
    const sorted = this.getSortedEnabledIds();
    this.activeId = sorted[0] ?? null;
  }

  // ==================== Private: Health ====================

  private isHealthy(id: string): boolean {
    const window = this.healthWindows.get(id) ?? [];
    if (window.length < 3) return true;
    const successRate = window.filter((e) => e.success).length / window.length;
    return successRate >= this.config.healthScoreThreshold;
  }

  private recordSuccess(id: string, latencyMs: number): void {
    this.recordHealthWindow(id, true, latencyMs);
    this.retryCounts.set(id, 0);

    // 熔断器恢复
    const circuit = this.circuits.get(id);
    if (circuit) {
      if (circuit.state === "half-open") {
        circuit.halfOpenRequests++;
        if (circuit.halfOpenRequests >= this.config.circuitBreaker.halfOpenMaxRequests) {
          circuit.state = "closed";
          circuit.failureCount = 0;
          circuit.halfOpenRequests = 0;
          this.onRecover?.(id);
        }
      } else if (circuit.state === "closed") {
        circuit.failureCount = 0;
      }
    }
  }

  private recordFailure(id: string): void {
    this.recordHealthWindow(id, false, this.config.timeoutMs);
    this.retryCounts.set(id, (this.retryCounts.get(id) ?? 0) + 1);

    // 更新熔断器
    const circuit = this.circuits.get(id);
    if (!circuit) return;

    circuit.failureCount++;
    circuit.lastFailureTime = Date.now();

    if (
      circuit.state === "closed" &&
      circuit.failureCount >= this.config.circuitBreaker.failureThreshold
    ) {
      circuit.state = "open";
      circuit.openedAt = Date.now();
    } else if (circuit.state === "half-open") {
      circuit.state = "open";
      circuit.openedAt = Date.now();
      circuit.halfOpenRequests = 0;
    }
  }

  private getConsecutiveFailures(id: string): number {
    const window = this.healthWindows.get(id) ?? [];
    let count = 0;
    for (let i = window.length - 1; i >= 0; i--) {
      if (!window[i]!.success) count++;
      else break;
    }
    return count;
  }

  private getLastSuccessTime(id: string): number {
    const window = this.healthWindows.get(id) ?? [];
    for (let i = window.length - 1; i >= 0; i--) {
      if (window[i]!.success) return window[i]!.timestamp;
    }
    return 0;
  }

  // ==================== Private: Circuit Breaker ====================

  private isCircuitOpen(id: string): boolean {
    const circuit = this.circuits.get(id);
    if (!circuit) return false;

    if (circuit.state === "open") {
      const elapsed = Date.now() - circuit.openedAt;
      if (elapsed >= this.config.circuitBreaker.resetTimeoutMs) {
        circuit.state = "half-open";
        circuit.halfOpenRequests = 0;
        return false;
      }
      return true;
    }

    return false;
  }

  private getCircuitState(id: string): CircuitState {
    return this.circuits.get(id)?.state ?? "closed";
  }

  // ==================== Private: Sorting ====================

  private getSortedEnabledIds(): string[] {
    const entries = Array.from(this.registry.entries())
      .filter(([, entry]) => entry.enabled);
    return this.sortByPriority(entries.map(([id]) => id));
  }

  private sortByPriority(ids: string[]): string[] {
    return [...ids].sort((a, b) => {
      const pa = this.registry.get(a)?.priority ?? 999;
      const pb = this.registry.get(b)?.priority ?? 999;
      return pa - pb;
    });
  }

  private sortByHealth(ids: string[]): string[] {
    return [...ids].sort((a, b) => {
      const ha = this.getHealthSnapshot(a).availability;
      const hb = this.getHealthSnapshot(b).availability;
      return hb - ha;
    });
  }

  private sortByLatency(ids: string[]): string[] {
    return [...ids].sort((a, b) => {
      const la = this.getHealthSnapshot(a).avgLatency;
      const lb = this.getHealthSnapshot(b).avgLatency;
      return la - lb;
    });
  }

  // ==================== Private: Internal ====================

  private initCircuit(id: string): void {
    this.circuits.set(id, {
      state: "closed",
      failureCount: 0,
      lastFailureTime: 0,
      halfOpenRequests: 0,
      openedAt: 0,
    });
  }

  private initHealthWindow(id: string): void {
    this.healthWindows.set(id, []);
    this.latencySamples.set(id, []);
    this.retryCounts.set(id, 0);
  }

  private recordHealthWindow(id: string, success: boolean, latencyMs: number): void {
    const window = this.healthWindows.get(id);
    if (!window) return;
    window.push({ success, latencyMs, timestamp: Date.now() });
    if (window.length > 100) window.shift();

    const samples = this.latencySamples.get(id);
    if (samples) {
      samples.push(latencyMs);
      if (samples.length > 20) samples.shift();
    }
  }

  private startHealthCheck(id: string, intervalMs: number): void {
    this.stopHealthCheck(id);
    const entry = this.registry.get(id);
    if (!entry) return;

    const timer = setInterval(async () => {
      try {
        await this.executeWithTimeout(entry.provider.health(), this.config.timeoutMs);
        this.recordSuccess(id, 0);
      } catch {
        this.recordFailure(id);
      }
      this.notifyStateChange();
    }, intervalMs);

    this.healthCheckTimers.set(id, timer);
  }

  private stopHealthCheck(id: string): void {
    const timer = this.healthCheckTimers.get(id);
    if (timer) {
      clearInterval(timer);
      this.healthCheckTimers.delete(id);
    }
  }

  private notifyStateChange(): void {
    this.onStateChange?.(this.getState());
  }
}

// ==================== 全局单例 ====================

let _edgeManager: EdgeProviderManager | null = null;

export function getEdgeProviderManager(config?: Partial<EdgeProviderConfig>): EdgeProviderManager {
  if (!_edgeManager) {
    _edgeManager = new EdgeProviderManager(config);
  }
  return _edgeManager;
}

export function resetEdgeProviderManager(): void {
  if (_edgeManager) {
    _edgeManager.destroy();
    _edgeManager = null;
  }
}

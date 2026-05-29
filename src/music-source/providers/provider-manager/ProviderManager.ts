import type { MusicProvider, ProviderType } from "../../types/provider";
import type { ProviderHealthSnapshot } from "@/types/provider";
import { HealthTracker, getHealthTracker } from "./HealthTracker";
import { RequestManager, getRequestManager } from "./RequestManager";
import { MockProvider } from "../mock";

// ==================== Provider 注册条目 ====================

interface ProviderRegistration {
  provider: MusicProvider;
  priority: number; // 数字越小优先级越高
  enabled: boolean;
}

// ==================== 默认优先级 ====================

const DEFAULT_PRIORITY: ProviderType[] = ["mock"];

// ==================== ProviderManager ====================

export class ProviderManager {
  private registry: Map<ProviderType, ProviderRegistration> = new Map();
  private healthTracker: HealthTracker;
  private requestManager: RequestManager;
  private activeType: ProviderType;
  private priorityList: ProviderType[];
  private recoveryTimers: Map<ProviderType, ReturnType<typeof setInterval>> = new Map();
  private onFallback?: (from: ProviderType, to: ProviderType, reason: string) => void;
  private onRecovery?: (type: ProviderType) => void;
  private onHealthChange?: (type: ProviderType, health: ProviderHealthSnapshot) => void;

  constructor() {
    this.healthTracker = getHealthTracker();
    this.requestManager = getRequestManager();
    this.priorityList = [...DEFAULT_PRIORITY];

    // 默认注册 mock provider 作为兜底
    this.register(new MockProvider(), 999);
    this.activeType = "mock";
  }

  // ==================== 注册 ====================

  /** 注册一个 provider */
  register(provider: MusicProvider, priority: number = 100): void {
    this.registry.set(provider.type, {
      provider,
      priority,
      enabled: true,
    });

    // 重新排序优先级列表
    this.sortPriorities();

    // 如果当前是 mock 且有更好的 provider，自动切换
    if (this.activeType === "mock" && provider.type !== "mock" && this.isHealthy(provider.type)) {
      this.switchTo(provider.type);
    }
  }

  /** 注销一个 provider (不能注销 mock) */
  unregister(type: ProviderType): void {
    if (type === "mock") return;
    this.registry.delete(type);
    this.stopRecoveryProbe(type);
    this.sortPriorities();

    // 如果当前活跃的被注销了，切换到下一个
    if (this.activeType === type) {
      const next = this.getNextHealthy();
      this.switchTo(next);
    }
  }

  /** 启用/禁用某个 provider */
  setEnabled(type: ProviderType, enabled: boolean): void {
    const reg = this.registry.get(type);
    if (!reg) return;
    reg.enabled = enabled;

    if (!enabled && this.activeType === type) {
      const next = this.getNextHealthy();
      this.switchTo(next);
    }

    this.sortPriorities();
  }

  // ==================== 优先级 ====================

  /** 设置优先级列表 */
  setPriority(priorities: ProviderType[]): void {
    // 确保 mock 始终在最后
    const filtered = priorities.filter((p) => p !== "mock");
    this.priorityList = [...filtered, "mock"];
    this.sortPriorities();
  }

  /** 获取当前优先级列表 (仅已启用) */
  getPriorityList(): ProviderType[] {
    return this.priorityList.filter((p) => {
      const reg = this.registry.get(p);
      return reg && reg.enabled;
    });
  }

  // ==================== 切换 ====================

  /** 手动切换到指定 provider */
  switchTo(type: ProviderType): boolean {
    const reg = this.registry.get(type);
    if (!reg || !reg.enabled) return false;

    this.activeType = type;
    return true;
  }

  /** 获取当前活跃 provider */
  getActive(): MusicProvider {
    return this.registry.get(this.activeType)!.provider;
  }

  /** 获取当前活跃类型 */
  getActiveType(): ProviderType {
    return this.activeType;
  }

  // 各方法超时时间 (ms)：搜索快，播放URL慢
  private static readonly METHOD_TIMEOUTS: Partial<Record<keyof MusicProvider, number>> = {
    search: 8000,
    getSearchSuggestions: 5000,
    getHotKeywords: 5000,
    getPlayUrl: 15000,
    getLyrics: 8000,
    getSongDetail: 8000,
    getPlaylist: 10000,
    getPlaylistSongs: 10000,
    getArtist: 8000,
    getArtistSongs: 10000,
  };

  // ==================== 执行 (核心) ====================

  /** 通过 provider manager 执行方法，自动 fallback */
  async execute<T>(
    method: keyof MusicProvider,
    args: unknown[],
    cacheKey?: string,
  ): Promise<T> {
    const providerTypes = this.getFallbackChain();
    let lastError: Error | null = null;
    const timeoutMs = ProviderManager.METHOD_TIMEOUTS[method];

    for (const type of providerTypes) {
      const reg = this.registry.get(type);
      if (!reg || !reg.enabled) continue;

      const startTime = Date.now();

      try {
        const fn = reg.provider[method] as (...a: unknown[]) => Promise<T>;

        const result = await this.requestManager.execute<T>(
          cacheKey ?? `${type}:${String(method)}:${JSON.stringify(args)}`,
          async (signal) => {
            // 检查是否被取消
            if (signal.aborted) throw new Error("Aborted");
            return fn.apply(reg.provider, args);
          },
          { timeoutMs },
        );

        // 成功：记录健康
        const latency = Date.now() - startTime;
        this.healthTracker.recordSuccess(type, latency);
        this.notifyHealthChange(type);

        // 如果是 fallback 成功了，考虑切回
        if (type !== this.activeType && this.isHealthy(type)) {
          const currentPriority = this.getPriority(type);
          const activePriority = this.getPriority(this.activeType);
          if (currentPriority < activePriority) {
            this.switchTo(type);
          }
        }

        return result;
      } catch (err) {
        lastError = err as Error;
        this.healthTracker.recordFailure(type);
        this.notifyHealthChange(type);

        // 如果因不健康而失败，开始探测恢复
        if (!this.healthTracker.isHealthy(type)) {
          this.startRecoveryProbe(type);
        }

        // 触发 fallback 回调
        if (type === this.activeType) {
          const next = this.getNextHealthy();
          if (next !== type) {
            this.switchTo(next);
            this.onFallback?.(type, next, lastError.message);
          }
        }
      }
    }

    throw lastError ?? new Error("All providers failed");
  }

  // ==================== 健康 ====================

  /** 检查 provider 是否健康 */
  isHealthy(type: ProviderType): boolean {
    return this.healthTracker.isHealthy(type);
  }

  /** 获取 provider 健康快照 */
  getHealth(type: ProviderType): ProviderHealthSnapshot {
    return this.healthTracker.getSnapshot(type);
  }

  /** 获取所有健康快照 */
  getAllHealth(): Map<ProviderType, ProviderHealthSnapshot> {
    const map = new Map<ProviderType, ProviderHealthSnapshot>();
    for (const type of this.registry.keys()) {
      map.set(type, this.healthTracker.getSnapshot(type));
    }
    return map;
  }

  /** 记录成功 (外部手动调用) */
  recordSuccess(type: ProviderType, latencyMs: number): void {
    this.healthTracker.recordSuccess(type, latencyMs);
    this.notifyHealthChange(type);
  }

  /** 记录失败 (外部手动调用) */
  recordFailure(type: ProviderType): void {
    this.healthTracker.recordFailure(type);
    this.notifyHealthChange(type);
  }

  // ==================== 回调 ====================

  setOnFallback(cb: (from: ProviderType, to: ProviderType, reason: string) => void): void {
    this.onFallback = cb;
  }

  setOnRecovery(cb: (type: ProviderType) => void): void {
    this.onRecovery = cb;
  }

  setOnHealthChange(cb: (type: ProviderType, health: ProviderHealthSnapshot) => void): void {
    this.onHealthChange = cb;
  }

  // ==================== 销毁 ====================

  destroy(): void {
    for (const [type, timer] of this.recoveryTimers) {
      clearInterval(timer);
      this.recoveryTimers.delete(type);
    }
    this.requestManager.cancelAll();
    this.healthTracker.resetAll();
  }

  // ==================== Private ====================

  /** 获取 fallback 链：当前 provider 优先，其余按优先级排列 */
  private getFallbackChain(): ProviderType[] {
    const all = this.getPriorityList();
    const idx = all.indexOf(this.activeType);
    if (idx >= 0) {
      return [this.activeType, ...all.slice(0, idx), ...all.slice(idx + 1)];
    }
    return all;
  }

  /** 获取下一个健康的 provider */
  private getNextHealthy(): ProviderType {
    for (const type of this.getPriorityList()) {
      if (this.healthTracker.isHealthy(type)) return type;
    }
    return "mock"; // mock 永远健康
  }

  private getPriority(type: ProviderType): number {
    const reg = this.registry.get(type);
    return reg?.priority ?? 999;
  }

  private sortPriorities(): void {
    this.priorityList.sort((a, b) => {
      const pa = this.registry.get(a)?.priority ?? 999;
      const pb = this.registry.get(b)?.priority ?? 999;
      if (pa !== pb) return pa - pb;
      // 相同 priority 按 DEFAULT_PRIORITY 顺序
      const ia = DEFAULT_PRIORITY.indexOf(a);
      const ib = DEFAULT_PRIORITY.indexOf(b);
      return (ia === -1 ? 999 : ia) - (ib === -1 ? 999 : ib);
    });
  }

  private notifyHealthChange(type: ProviderType): void {
    const snapshot = this.healthTracker.getSnapshot(type);
    this.onHealthChange?.(type, snapshot);
  }

  /** 开始恢复探测：定期检查不健康的 provider */
  private startRecoveryProbe(type: ProviderType): void {
    if (this.recoveryTimers.has(type)) return;
    if (type === "mock") return;

    const reg = this.registry.get(type);
    if (!reg) return;

    const timer = setInterval(async () => {
      try {
        // 轻量探测：获取热门关键词
        await reg.provider.getHotKeywords();
        this.healthTracker.recordSuccess(type, 100);
        this.notifyHealthChange(type);

        // 恢复成功
        if (this.healthTracker.isHealthy(type)) {
          this.stopRecoveryProbe(type);
          this.onRecovery?.(type);

          // 如果恢复的 provider 优先级更高，自动切换
          if (this.getPriority(type) < this.getPriority(this.activeType)) {
            this.switchTo(type);
          }
        }
      } catch {
        this.healthTracker.recordFailure(type);
        this.notifyHealthChange(type);
      }
    }, 30000); // 每 30s 探测一次

    this.recoveryTimers.set(type, timer);
  }

  private stopRecoveryProbe(type: ProviderType): void {
    const timer = this.recoveryTimers.get(type);
    if (timer) {
      clearInterval(timer);
      this.recoveryTimers.delete(type);
    }
  }
}

// ==================== 全局单例 ====================

let _providerManager: ProviderManager | null = null;

export function getProviderManager(): ProviderManager {
  if (!_providerManager) _providerManager = new ProviderManager();
  return _providerManager;
}

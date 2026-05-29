/**
 * Phase 13 — RuntimeIsolationLayer ★ 核心
 *
 * 运行时隔离层。确保:
 * - 单个模块崩溃不影响全局
 * - Provider异常自动隔离
 * - Audio异常自动隔离
 * - Cache异常自动隔离
 * - Recovery异常自动隔离
 * - 自动释放恢复
 */
import type {
  IsolationDomain,
  IsolationConfig,
  IsolationState,
  IsolationReport,
} from "@/types/phase13";
import { DEFAULT_ISOLATION_CONFIGS } from "@/types/phase13";

const ISOLATION_STATE_KEY = "music_isolation_state";

export class RuntimeIsolationLayer {
  private static instance: RuntimeIsolationLayer;
  private configs: Record<IsolationDomain, IsolationConfig>;
  private states: Map<IsolationDomain, IsolationState>;
  private listeners: Set<(domain: IsolationDomain, isolated: boolean) => void> = new Set();
  private quarantineTimers: Map<IsolationDomain, ReturnType<typeof setTimeout>> = new Map();

  private constructor() {
    this.configs = { ...DEFAULT_ISOLATION_CONFIGS };
    this.states = new Map();
    this.initStates();
    this.loadState();
  }

  static getInstance(): RuntimeIsolationLayer {
    if (!RuntimeIsolationLayer.instance) {
      RuntimeIsolationLayer.instance = new RuntimeIsolationLayer();
    }
    return RuntimeIsolationLayer.instance;
  }

  // ─── State Access ───

  isIsolated(domain: IsolationDomain): boolean {
    return this.states.get(domain)?.isolated ?? false;
  }

  getState(domain: IsolationDomain): IsolationState | undefined {
    return this.states.get(domain)
      ? { ...this.states.get(domain)! }
      : undefined;
  }

  getAllStates(): IsolationState[] {
    return Array.from(this.states.values()).map((s) => ({ ...s }));
  }

  getIsolatedDomains(): IsolationDomain[] {
    return Array.from(this.states.entries())
      .filter(([, s]) => s.isolated)
      .map(([d]) => d);
  }

  // ─── Failure Reporting ───

  /**
   * 报告域内失败。累计到阈值后自动隔离。
   */
  reportFailure(domain: IsolationDomain, reason: string): void {
    const state = this.states.get(domain);
    if (!state) return;

    state.failureCount++;
    state.lastFailureAt = Date.now();

    const config = this.configs[domain];

    // 检查是否达到隔离阈值
    if (state.failureCount >= config.maxFailures && config.autoQuarantine && !state.isolated) {
      this.isolate(domain, reason);
    }

    this.persistState();
  }

  /**
   * 手动隔离域
   */
  isolate(domain: IsolationDomain, reason: string): void {
    const state = this.states.get(domain);
    if (!state) return;

    const config = this.configs[domain];

    state.isolated = true;
    state.isolatedAt = Date.now();
    state.reason = reason;

    if (config.quarantineDuration > 0) {
      state.quarantineEndsAt = Date.now() + config.quarantineDuration;

      // 设置自动释放定时器
      const existingTimer = this.quarantineTimers.get(domain);
      if (existingTimer) clearTimeout(existingTimer);

      const timer = setTimeout(() => {
        this.release(domain, "quarantine_expired");
      }, config.quarantineDuration);
      this.quarantineTimers.set(domain, timer);
    }

    this.persistState();
    this.notifyListeners(domain, true);
  }

  /**
   * 手动释放域
   */
  release(domain: IsolationDomain, reason: string): void {
    const state = this.states.get(domain);
    if (!state) return;

    state.isolated = false;
    state.reason = null;
    state.quarantineEndsAt = null;
    state.autoReleased = reason === "quarantine_expired";

    // 清除定时器
    const timer = this.quarantineTimers.get(domain);
    if (timer) {
      clearTimeout(timer);
      this.quarantineTimers.delete(domain);
    }

    this.persistState();
    this.notifyListeners(domain, false);
  }

  /**
   * 重置域状态（清除失败计数）
   */
  resetDomain(domain: IsolationDomain): void {
    const config = this.configs[domain];
    this.states.set(domain, {
      domain,
      isolated: false,
      isolatedAt: null,
      reason: null,
      failureCount: 0,
      lastFailureAt: null,
      quarantineEndsAt: null,
      autoReleased: false,
    });

    // 清除定时器
    const timer = this.quarantineTimers.get(domain);
    if (timer) {
      clearTimeout(timer);
      this.quarantineTimers.delete(domain);
    }

    this.persistState();
  }

  // ─── Execution Wrappers ───

  /**
   * 在隔离保护下执行函数
   * 如果域已被隔离，则跳过执行
   */
  async executeWithIsolation<T>(
    domain: IsolationDomain,
    fn: () => Promise<T>,
    fallback?: () => Promise<T>,
  ): Promise<T | null> {
    if (this.isIsolated(domain)) {
      if (fallback) return fallback();
      return null;
    }

    try {
      const result = await fn();
      // 成功后减少失败计数
      const state = this.states.get(domain);
      if (state && state.failureCount > 0) {
        state.failureCount = Math.max(0, state.failureCount - 1);
        this.persistState();
      }
      return result;
    } catch (err) {
      this.reportFailure(
        domain,
        `执行异常: ${err instanceof Error ? err.message : "Unknown error"}`,
      );
      if (fallback) return fallback();
      return null;
    }
  }

  // ─── Report ───

  generateIsolationReport(): IsolationReport {
    const domains = this.getAllStates();
    const isolatedDomains = domains.filter((d) => d.isolated).map((d) => d.domain);
    const activeQuarantines = domains.filter(
      (d) => d.isolated && d.quarantineEndsAt && d.quarantineEndsAt > Date.now(),
    ).length;
    const totalIsolations = domains.reduce((s, d) => s + (d.isolatedAt ? 1 : 0), 0);
    const totalAutoReleases = domains.filter((d) => d.autoReleased).length;

    return {
      timestamp: Date.now(),
      isolatedDomains,
      activeQuarantines,
      totalIsolations,
      totalAutoReleases,
      domains,
    };
  }

  // ─── Configuration ───

  updateDomainConfig(domain: IsolationDomain, partial: Partial<IsolationConfig>): void {
    this.configs[domain] = { ...this.configs[domain], ...partial };
  }

  getDomainConfig(domain: IsolationDomain): IsolationConfig {
    return { ...this.configs[domain] };
  }

  // ─── Listeners ───

  subscribe(listener: (domain: IsolationDomain, isolated: boolean) => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  // ─── Private ───

  private initStates(): void {
    for (const domain of Object.keys(DEFAULT_ISOLATION_CONFIGS) as IsolationDomain[]) {
      this.states.set(domain, {
        domain,
        isolated: false,
        isolatedAt: null,
        reason: null,
        failureCount: 0,
        lastFailureAt: null,
        quarantineEndsAt: null,
        autoReleased: false,
      });
    }
  }

  private loadState(): void {
    try {
      const raw = localStorage.getItem(ISOLATION_STATE_KEY);
      if (!raw) return;
      const saved = JSON.parse(raw) as Record<IsolationDomain, IsolationState>;
      for (const [domain, state] of Object.entries(saved) as [IsolationDomain, IsolationState][]) {
        this.states.set(domain, state);

        // 恢复仍在隔离期的定时器
        if (state.isolated && state.quarantineEndsAt && state.quarantineEndsAt > Date.now()) {
          const remaining = state.quarantineEndsAt - Date.now();
          const timer = setTimeout(() => {
            this.release(domain, "quarantine_expired");
          }, remaining);
          this.quarantineTimers.set(domain, timer);
        }
      }
    } catch {
      // 使用默认状态
    }
  }

  private persistState(): void {
    try {
      const obj: Record<string, IsolationState> = {};
      for (const [domain, state] of this.states) {
        obj[domain] = state;
      }
      localStorage.setItem(ISOLATION_STATE_KEY, JSON.stringify(obj));
    } catch { /* silent */ }
  }

  private notifyListeners(domain: IsolationDomain, isolated: boolean): void {
    this.listeners.forEach((fn) => {
      try { fn(domain, isolated); } catch { /* silent */ }
    });
  }
}

export function getRuntimeIsolation(): RuntimeIsolationLayer {
  return RuntimeIsolationLayer.getInstance();
}

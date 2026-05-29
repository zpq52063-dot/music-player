/**
 * Phase 10 — ProviderHotReloadSystem
 *
 * 职责:
 * - Provider 动态启停
 * - Provider 动态优先级调整
 * - Provider 热切换 (无需重启APP)
 * - Provider 失效自动替换
 *
 * 约束:
 * - 不重启APP即可切换Provider
 * - 不影响正在播放的歌曲
 * - 下一个播放请求生效新Provider
 *
 * 模式: 单例
 */

import type { ProviderHotConfig, ProviderSwitchEvent, ProviderReloadState } from "@/types";
import { getLogger } from "@/lib/logs/Logger";
import { getRuntimeConfig } from "@/platform/config/RuntimeConfigManager";

let instance: ProviderHotReloadSystem | null = null;

export class ProviderHotReloadSystem {
  private state: ProviderReloadState;
  private listeners: Set<(state: ProviderReloadState) => void> = new Set();

  constructor() {
    this.state = {
      configs: this.loadFromRuntimeConfig(),
      switchHistory: [],
      lastReloadAt: 0,
      isReloading: false,
    };

    this.syncFromRuntimeConfig();
  }

  // ==================== Singleton ====================

  static getInstance(): ProviderHotReloadSystem {
    if (!instance) instance = new ProviderHotReloadSystem();
    return instance;
  }

  // ==================== State Access ====================

  getState(): ProviderReloadState {
    return { ...this.state, switchHistory: [...this.state.switchHistory] };
  }

  getProviderConfig(type: string): ProviderHotConfig | undefined {
    return this.state.configs.find((c) => c.type === type);
  }

  getActiveProviders(): ProviderHotConfig[] {
    return this.state.configs
      .filter((c) => c.enabled)
      .sort((a, b) => a.priority - b.priority);
  }

  isProviderEnabled(type: string): boolean {
    return this.state.configs.find((c) => c.type === type)?.enabled ?? false;
  }

  // ==================== Hot Operations ====================

  /**
   * 热启用 Provider — 立即可用, 无需重启
   */
  enableProvider(type: string): void {
    const config = this.state.configs.find((c) => c.type === type);
    if (!config) {
      this.state.configs.push({
        type,
        enabled: true,
        priority: this.state.configs.length,
        updatedAt: Date.now(),
      });
    } else {
      config.enabled = true;
      config.updatedAt = Date.now();
    }
    this.state.lastReloadAt = Date.now();
    this.persistToRuntimeConfig();
    this.notifyListeners();
    getLogger().info("provider", `Hot-enabled: ${type}`);
  }

  /**
   * 热禁用 Provider — 立即停止使用, 正在播放的歌曲不受影响
   */
  disableProvider(type: string): void {
    const config = this.state.configs.find((c) => c.type === type);
    if (!config) return;
    config.enabled = false;
    config.updatedAt = Date.now();
    this.state.lastReloadAt = Date.now();
    this.persistToRuntimeConfig();
    this.notifyListeners();
    getLogger().info("provider", `Hot-disabled: ${type}`);
  }

  /**
   * 热切换 Provider — 立即生效
   */
  hotSwitch(to: string, reason: ProviderSwitchEvent["reason"] = "manual"): boolean {
    const target = this.state.configs.find((c) => c.type === to);
    if (!target || !target.enabled) {
      getLogger().warn("provider", `Hot-switch failed: ${to} not available`);
      return false;
    }

    const currentActive = this.getActiveProviders()[0];
    const from = currentActive?.type ?? "unknown";

    const event: ProviderSwitchEvent = {
      from,
      to,
      reason,
      timestamp: Date.now(),
    };

    this.state.switchHistory.unshift(event);
    if (this.state.switchHistory.length > 20) this.state.switchHistory.pop();
    this.state.lastReloadAt = Date.now();

    this.persistToRuntimeConfig();
    this.notifyListeners();
    getLogger().info("provider", `Hot-switched: ${from} → ${to} (${reason})`);
    return true;
  }

  /**
   * 热更新优先级 — 调整后立即生效
   */
  updatePriority(type: string, newPriority: number): void {
    const config = this.state.configs.find((c) => c.type === type);
    if (!config) return;
    config.priority = newPriority;
    config.updatedAt = Date.now();
    this.state.configs.sort((a, b) => a.priority - b.priority);
    this.state.lastReloadAt = Date.now();
    this.persistToRuntimeConfig();
    this.notifyListeners();
    getLogger().info("provider", `Priority updated: ${type} → P${newPriority}`);
  }

  /**
   * 热替换: 因健康原因自动替换到下一个可用Provider
   */
  autoReplace(failingType: string): string | null {
    const enabled = this.getActiveProviders();
    const failingIdx = enabled.findIndex((c) => c.type === failingType);
    if (failingIdx === -1) return null;

    // Disable failing provider temporarily
    this.disableProvider(failingType);

    // Find next available
    const next = enabled[failingIdx + 1];
    if (next) {
      this.hotSwitch(next.type, "auto_recovery");
      return next.type;
    }

    // Fallback to first available if there's any left
    const remaining = this.getActiveProviders();
    if (remaining.length > 0 && remaining[0]) {
      this.hotSwitch(remaining[0].type, "auto_recovery");
      return remaining[0].type;
    }

    return null;
  }

  // ==================== Sync ====================

  /**
   * 同步从 RuntimeConfigManager (外部配置变更 → 热更新系统)
   */
  syncFromRuntimeConfig(): void {
    const runtimeConfig = getRuntimeConfig();
    const runtimeProviders = runtimeConfig.getEnabledProviders();

    for (const rp of runtimeProviders) {
      const existing = this.state.configs.find((c) => c.type === rp.type);
      if (existing) {
        existing.enabled = rp.enabled;
        existing.priority = rp.priority;
        existing.updatedAt = Date.now();
      } else {
        this.state.configs.push({
          type: rp.type,
          enabled: rp.enabled,
          priority: rp.priority,
          updatedAt: Date.now(),
        });
      }
    }
    this.state.lastReloadAt = Date.now();
    this.notifyListeners();
  }

  // ==================== Persistence ====================

  private persistToRuntimeConfig(): void {
    const runtimeConfig = getRuntimeConfig();
    for (const c of this.state.configs) {
      runtimeConfig.updateProviderConfig(c.type, {
        enabled: c.enabled,
        priority: c.priority,
      });
    }
  }

  private loadFromRuntimeConfig(): ProviderHotConfig[] {
    const runtimeConfig = getRuntimeConfig();
    return runtimeConfig.getConfig().providers.map((p) => ({
      type: p.type,
      enabled: p.enabled,
      priority: p.priority,
      updatedAt: Date.now(),
    }));
  }

  // ==================== Subscribe ====================

  subscribe(listener: (state: ProviderReloadState) => void): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  private notifyListeners(): void {
    const snapshot = this.getState();
    this.listeners.forEach((fn) => {
      try {
        fn(snapshot);
      } catch {
        // prevent one bad listener from breaking others
      }
    });
  }

  // ==================== Reset ====================

  reset(): void {
    this.state = {
      configs: this.loadFromRuntimeConfig(),
      switchHistory: [],
      lastReloadAt: 0,
      isReloading: false,
    };
    this.notifyListeners();
  }
}

export function getProviderHotReload(): ProviderHotReloadSystem {
  return ProviderHotReloadSystem.getInstance();
}

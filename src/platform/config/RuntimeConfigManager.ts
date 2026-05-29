/**
 * Phase 10 — RuntimeConfigManager
 *
 * 职责:
 * - 动态 Provider 配置
 * - 动态缓存策略
 * - 动态调试配置
 * - 动态 Fallback 配置
 * - 动态实验开关
 *
 * 支持: local config / remote config (预留) / env merge / runtime override
 *
 * 模式: 单例
 */

import type {
  RuntimeConfig,
  RuntimeProviderEntry,
  RuntimeCacheStrategy,
  RuntimeDebugConfig,
  ConfigOverride,
} from "@/types";
import { DEFAULT_RUNTIME_CONFIG } from "@/types";
import { getLogger } from "@/lib/logs/Logger";

const STORAGE_KEY = "music_runtime_config";

let instance: RuntimeConfigManager | null = null;

export class RuntimeConfigManager {
  private config: RuntimeConfig;
  private overrides: ConfigOverride[] = [];
  private listeners: Set<(config: RuntimeConfig) => void> = new Set();

  constructor() {
    this.config = this.loadConfig();
  }

  // ==================== Singleton ====================

  static getInstance(): RuntimeConfigManager {
    if (!instance) instance = new RuntimeConfigManager();
    return instance;
  }

  // ==================== Config Access ====================

  getConfig(): RuntimeConfig {
    return { ...this.config, lastUpdated: Date.now() };
  }

  getProviderConfig(type: string): RuntimeProviderEntry | undefined {
    return this.config.providers.find((p) => p.type === type);
  }

  getEnabledProviders(): RuntimeProviderEntry[] {
    return this.config.providers
      .filter((p) => p.enabled)
      .sort((a, b) => a.priority - b.priority);
  }

  getCacheConfig(): RuntimeCacheStrategy {
    return { ...this.config.cache };
  }

  getDebugConfig(): RuntimeDebugConfig {
    return { ...this.config.debug };
  }

  getExperimentFlag(key: string): boolean | number | string | undefined {
    return this.config.experiments[key];
  }

  // ==================== Config Mutations ====================

  updateProviderConfig(type: string, partial: Partial<RuntimeProviderEntry>): void {
    const idx = this.config.providers.findIndex((p) => p.type === type);
    if (idx === -1) {
      this.config.providers.push({
        type,
        enabled: true,
        priority: this.config.providers.length,
        apiBaseUrl: null,
        timeout: 10000,
        retries: 3,
        ...partial,
      });
    } else {
      this.config.providers[idx] = { ...this.config.providers[idx]!, ...partial };
    }
    this.config.lastUpdated = Date.now();
    this.config.source = "local";
    this.persist();
    this.notifyListeners();
  }

  setProviderEnabled(type: string, enabled: boolean): void {
    this.updateProviderConfig(type, { enabled });
    getLogger().info("system", `Provider ${type} ${enabled ? "enabled" : "disabled"}`);
  }

  setProviderPriority(type: string, priority: number): void {
    this.updateProviderConfig(type, { priority });
  }

  reorderProviders(orderedTypes: string[]): void {
    orderedTypes.forEach((type, idx) => {
      const provider = this.config.providers.find((p) => p.type === type);
      if (provider) provider.priority = idx;
    });
    this.config.providers.sort((a, b) => a.priority - b.priority);
    this.config.lastUpdated = Date.now();
    this.config.source = "local";
    this.persist();
    this.notifyListeners();
  }

  updateCacheConfig(partial: Partial<RuntimeCacheStrategy>): void {
    this.config.cache = { ...this.config.cache, ...partial };
    this.config.lastUpdated = Date.now();
    this.persist();
    this.notifyListeners();
  }

  updateDebugConfig(partial: Partial<RuntimeDebugConfig>): void {
    this.config.debug = { ...this.config.debug, ...partial };
    this.config.lastUpdated = Date.now();
    this.persist();
    this.notifyListeners();
  }

  setExperimentFlag(key: string, value: boolean | number | string): void {
    this.config.experiments[key] = value;
    this.config.lastUpdated = Date.now();
    this.persist();
    this.notifyListeners();
  }

  removeExperimentFlag(key: string): void {
    delete this.config.experiments[key];
    this.persist();
  }

  // ==================== Override System ====================

  applyOverride(override: ConfigOverride): void {
    const existing = this.overrides.findIndex((o) => o.path === override.path);
    if (existing !== -1) this.overrides[existing] = override;
    else this.overrides.push(override);
    this.mergeOverrides();
  }

  removeOverride(path: string): void {
    this.overrides = this.overrides.filter((o) => o.path !== path);
    this.mergeOverrides();
  }

  getOverrides(): ConfigOverride[] {
    return [...this.overrides];
  }

  private mergeOverrides(): void {
    // Start from defaults, apply persisted config, then overrides
    const base = { ...DEFAULT_RUNTIME_CONFIG };
    const persisted = this.loadPersisted();

    if (persisted) {
      Object.assign(base, persisted);
    }

    for (const override of this.overrides) {
      this.applyOverrideToConfig(base, override);
    }

    this.config = { ...base, source: "merged", lastUpdated: Date.now() };
    this.notifyListeners();
  }

  private applyOverrideToConfig(config: RuntimeConfig, override: ConfigOverride): void {
    const parts = override.path.split(".");
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let target: any = config;
    for (let i = 0; i < parts.length - 1; i++) {
      if (target[parts[i]!] === undefined) return;
      target = target[parts[i]!];
    }
    const lastKey = parts[parts.length - 1];
    if (lastKey && target) {
      target[lastKey] = override.value;
    }
  }

  // ==================== Remote Config (预留) ====================

  async fetchRemoteConfig(_url: string): Promise<boolean> {
    // Phase 10 预留: 从远程配置服务获取配置
    // 当前返回 false 表示未实现
    getLogger().debug("system", "Remote config fetch not implemented (Phase 10 placeholder)");
    return false;
  }

  async mergeRemoteConfig(remote: Partial<RuntimeConfig>): Promise<void> {
    const merged: RuntimeConfig = {
      ...this.config,
      ...remote,
      source: "remote",
      lastUpdated: Date.now(),
    };
    this.config = merged;
    this.persist();
    this.notifyListeners();
  }

  // ==================== Reset ====================

  resetToDefaults(): void {
    this.config = { ...DEFAULT_RUNTIME_CONFIG, lastUpdated: Date.now(), source: "local" };
    this.overrides = [];
    this.persist();
    this.notifyListeners();
    getLogger().info("system", "Runtime config reset to defaults");
  }

  // ==================== Subscribe ====================

  subscribe(listener: (config: RuntimeConfig) => void): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  private notifyListeners(): void {
    const snapshot = this.getConfig();
    this.listeners.forEach((fn) => {
      try {
        fn(snapshot);
      } catch {
        // prevent one bad listener from breaking others
      }
    });
  }

  // ==================== Persistence ====================

  private loadConfig(): RuntimeConfig {
    const persisted = this.loadPersisted();
    if (persisted) {
      return { ...DEFAULT_RUNTIME_CONFIG, ...persisted, source: "local" };
    }
    return { ...DEFAULT_RUNTIME_CONFIG, lastUpdated: Date.now(), source: "local" };
  }

  private loadPersisted(): RuntimeConfig | null {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) return JSON.parse(raw) as RuntimeConfig;
    } catch {
      // silently fail
    }
    return null;
  }

  private persist(): void {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.config));
    } catch {
      // silently fail (quota exceeded, private mode, etc.)
    }
  }
}

export function getRuntimeConfig(): RuntimeConfigManager {
  return RuntimeConfigManager.getInstance();
}

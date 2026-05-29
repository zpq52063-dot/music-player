/**
 * Phase 12 — DegradedRuntimeMode ★ 重要
 *
 * 降级运行模式管理器。确保:
 * - 所有远程Provider失效时仍可运行
 * - 网络断开时自动切换离线模式
 * - 缓存作为主要数据源时自动调整
 * - 本地媒体作为最终兜底
 */

import type { DegradedModeConfig, DegradedLevel, DegradedState } from "@/types/phase12";
import { DEFAULT_DEGRADED_CONFIG, RUNTIME_PROFILES } from "@/types/phase12";
import type { RuntimeProfileType } from "@/types/phase12";

export class DegradedRuntimeMode {
  private static instance: DegradedRuntimeMode;
  private config: DegradedModeConfig;
  private state: DegradedState;
  private listeners: Set<(state: DegradedState) => void> = new Set();

  private constructor() {
    this.config = { ...DEFAULT_DEGRADED_CONFIG };
    this.state = this.defaultState();
  }

  static getInstance(): DegradedRuntimeMode {
    if (!DegradedRuntimeMode.instance) {
      DegradedRuntimeMode.instance = new DegradedRuntimeMode();
    }
    return DegradedRuntimeMode.instance;
  }

  // ─── Configuration ───

  getConfig(): DegradedModeConfig {
    return { ...this.config };
  }

  updateConfig(partial: Partial<DegradedModeConfig>): void {
    this.config = { ...this.config, ...partial };
  }

  // ─── State ───

  getState(): DegradedState {
    return { ...this.state };
  }

  getDegradedLevel(): DegradedLevel {
    return this.state.level;
  }

  isDegraded(): boolean {
    return this.state.active;
  }

  isOffline(): boolean {
    return this.state.level === "offline";
  }

  isEmergencyDegraded(): boolean {
    return this.state.level === "severe" && this.state.fallbackProvider === "mock";
  }

  // ─── Feature Checks ───

  isFeatureAvailable(feature: string): boolean {
    if (!this.state.active) return true;
    return !this.state.disabledFeatures.includes(feature);
  }

  getAvailableFeatures(): string[] {
    if (!this.state.active) {
      return [
        "search",
        "remote_playback",
        "local_playback",
        "cache",
        "lyrics",
        "comments",
        "sync",
        "ai_autonomy",
      ];
    }
    return this.state.availableFeatures;
  }

  getDisabledFeatures(): string[] {
    return this.state.disabledFeatures;
  }

  // ─── Activation ───

  /**
   * 激活降级模式
   * 基于当前系统条件自动判断降级级别
   */
  activateDegraded(trigger: string, level: DegradedLevel): void {
    if (!this.config.autoActivate) return;

    const prevActive = this.state.active;

    this.state = {
      active: true,
      level,
      activatedAt: Date.now(),
      triggeredBy: trigger,
      availableFeatures: this.computeAvailableFeatures(level),
      disabledFeatures: this.computeDisabledFeatures(level),
      fallbackProvider: level === "severe" ? "mock" : level === "offline" ? "local_media" : "cache",
    };

    if (!prevActive || this.state.level !== level) {
      this.notifyListeners();
    }
  }

  /**
   * 恢复正常模式
   */
  deactivate(): void {
    if (!this.state.active) return;

    this.state = this.defaultState();
    this.notifyListeners();
  }

  /**
   * 自动评估是否需要降级
   * 应在网络状态变化 / Provider状态变化时调用
   */
  async evaluateAndAct(): Promise<boolean> {
    // 1. 检查网络状态
    const isOnline = typeof navigator !== "undefined" ? navigator.onLine : true;

    // 2. 检查Provider状态
    let allProvidersDown = false;
    let anyProviderHealthy = false;

    try {
      const { getProviderManager } = await import(
        "@/music-source/providers/provider-manager/ProviderManager"
      );
      const manager = getProviderManager();
      const healthMap = manager.getAllHealth();
      const priorityList = manager.getPriorityList();

      const realProviders = Array.from(healthMap.entries()).filter(
        ([type]) => type !== "mock",
      );

      allProvidersDown = realProviders.length > 0 && realProviders.every(
        ([type, h]) => !priorityList.includes(type) || h.successRate < 30,
      );

      anyProviderHealthy = realProviders.some(
        ([type, h]) => priorityList.includes(type) && h.successRate >= 70,
      );
    } catch {
      allProvidersDown = false;
      anyProviderHealthy = true;
    }

    // 3. 判断降级级别
    if (!isOnline) {
      this.activateDegraded("网络断开", "offline");
      return true;
    }

    if (allProvidersDown) {
      this.activateDegraded("所有远程Provider失效", "severe");
      return true;
    }

    if (!anyProviderHealthy && this.config.activateOnProviderFailure) {
      this.activateDegraded("Provider健康评分低", "partial");
      return true;
    }

    // 4. 如果条件恢复，退出降级
    if (this.state.active && anyProviderHealthy) {
      this.deactivate();
      return true;
    }

    return false;
  }

  // ─── Runtime Profile ───

  getProfileForCurrentState(): RuntimeProfileType {
    if (!this.state.active) return "full_online";
    switch (this.state.level) {
      case "offline":
        return "offline";
      case "severe":
        return "emergency_degraded";
      case "partial":
        return "lightweight";
      default:
        return "full_online";
    }
  }

  getCurrentProfileRestrictions() {
    const profileType = this.getProfileForCurrentState();
    return RUNTIME_PROFILES[profileType].restrictions;
  }

  // ─── Listeners ───

  subscribe(listener: (state: DegradedState) => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  // ─── Report ───

  generateDegradedReport(): string {
    const s = this.state;
    if (!s.active) return "系统运行正常，未激活降级模式。";

    const date = new Date(s.activatedAt).toISOString();
    return [
      `# Degraded Runtime Report — ${date}`,
      "",
      `- **Level:** ${s.level}`,
      `- **Triggered By:** ${s.triggeredBy}`,
      `- **Activated At:** ${date}`,
      `- **Fallback Provider:** ${s.fallbackProvider}`,
      "",
      "## Available Features",
      s.availableFeatures.map((f) => `- ${f}`).join("\n"),
      "",
      "## Disabled Features",
      s.disabledFeatures.map((f) => `- ${f}`).join("\n"),
    ].join("\n");
  }

  // ─── Private ───

  private defaultState(): DegradedState {
    return {
      active: false,
      level: "none",
      activatedAt: 0,
      triggeredBy: "",
      availableFeatures: [],
      disabledFeatures: [],
      fallbackProvider: "",
    };
  }

  private computeAvailableFeatures(level: DegradedLevel): string[] {
    switch (level) {
      case "offline":
        return ["local_playback", "cache", "lyrics"];
      case "severe":
        return ["cache", "local_playback"];
      case "partial":
        return ["cache", "local_playback", "search", "lyrics"];
      default:
        return [
          "search",
          "remote_playback",
          "local_playback",
          "cache",
          "lyrics",
          "comments",
        ];
    }
  }

  private computeDisabledFeatures(level: DegradedLevel): string[] {
    const all = [
      "search",
      "remote_playback",
      "local_playback",
      "cache",
      "lyrics",
      "comments",
      "sync",
      "ai_autonomy",
    ];
    const available = this.computeAvailableFeatures(level);
    return all.filter((f) => !available.includes(f));
  }

  private notifyListeners(): void {
    const snapshot = { ...this.state };
    this.listeners.forEach((fn) => {
      try {
        fn(snapshot);
      } catch {
        // listener error — silent
      }
    });
  }
}

export function getDegradedRuntime(): DegradedRuntimeMode {
  return DegradedRuntimeMode.getInstance();
}

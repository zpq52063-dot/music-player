/**
 * Phase 13 — SelfHealingGovernance ★
 *
 * 自愈治理引擎。增强 GovernancePipeline，新增:
 * - 自动恢复建议
 * - 自动风险评分
 * - 自动稳定性评分
 * - 自动降级建议
 * - 自动Provider替换建议
 * - 治愈历史追踪
 */
import type {
  HealingAction,
  HealingResult,
  HealingHistory,
  StabilityScore,
} from "@/types/phase13";

const HEALING_HISTORY_KEY = "music_healing_history";

export class SelfHealingGovernance {
  private static instance: SelfHealingGovernance;
  private history: HealingHistory;
  private listeners: Set<(action: HealingResult) => void> = new Set();

  private constructor() {
    this.history = this.loadHistory();
  }

  static getInstance(): SelfHealingGovernance {
    if (!SelfHealingGovernance.instance) {
      SelfHealingGovernance.instance = new SelfHealingGovernance();
    }
    return SelfHealingGovernance.instance;
  }

  // ─── Healing Actions ───

  /**
   * 执行治愈动作
   */
  async executeHealing(action: HealingAction): Promise<HealingResult> {
    const startTime = Date.now();
    let success = false;
    let previousState = "unknown";
    let newState = "unknown";
    let error: string | undefined;

    try {
      switch (action.type) {
        case "restart":
          previousState = "error";
          await this.healByRestart(action.target);
          newState = "restarted";
          success = true;
          break;
        case "reload":
          previousState = "stale";
          await this.healByReload(action.target);
          newState = "reloaded";
          success = true;
          break;
        case "fallback":
          previousState = "unavailable";
          await this.healByFallback(action.target);
          newState = "fallback_active";
          success = true;
          break;
        case "reset":
          previousState = "corrupted";
          await this.healByReset(action.target);
          newState = "reset";
          success = true;
          break;
        case "reinitialize":
          previousState = "uninitialized";
          await this.healByReinitialize(action.target);
          newState = "initialized";
          success = true;
          break;
        case "quarantine":
          previousState = "erratic";
          await this.healByQuarantine(action.target);
          newState = "quarantined";
          success = true;
          break;
        default:
          error = `Unknown action type: ${(action as HealingAction).type}`;
      }
    } catch (err) {
      error = err instanceof Error ? err.message : "Unknown error";
      success = false;
    }

    const result: HealingResult = {
      action,
      success,
      executedAt: Date.now(),
      duration: Date.now() - startTime,
      previousState,
      newState,
      error,
    };

    this.recordResult(result);
    this.notifyListeners(result);
    return result;
  }

  /**
   * 自动诊断并建议治愈方案
   */
  async diagnose(): Promise<{
    stabilityScore: StabilityScore;
    recommendedActions: HealingAction[];
  }> {
    const stability = await this.calculateStabilityScore();
    const actions = await this.generateHealingActions(stability);

    return {
      stabilityScore: stability,
      recommendedActions: actions,
    };
  }

  /**
   * 自动执行推荐的治愈方案
   */
  async autoHeal(): Promise<{
    stabilityBefore: StabilityScore;
    actionsTaken: HealingResult[];
    stabilityAfter: StabilityScore;
    overallSuccess: boolean;
  }> {
    const stabilityBefore = await this.calculateStabilityScore();
    const actions = await this.generateHealingActions(stabilityBefore);

    const actionsTaken: HealingResult[] = [];
    for (const action of actions.filter((a) => a.autoExecute)) {
      let attempts = 0;
      let result: HealingResult | null = null;

      while (attempts < action.maxAttempts) {
        result = await this.executeHealing(action);
        if (result.success) break;
        attempts++;
        // 冷却等待
        if (attempts < action.maxAttempts) {
          await new Promise((r) => setTimeout(r, action.cooldownMs));
        }
      }

      if (result) actionsTaken.push(result);
    }

    const stabilityAfter = await this.calculateStabilityScore();

    return {
      stabilityBefore,
      actionsTaken,
      stabilityAfter,
      overallSuccess: actionsTaken.every((a) => a.success),
    };
  }

  // ─── Stability Score ───

  async calculateStabilityScore(): Promise<StabilityScore> {
    const providerStability = await this.assessProviderStability();
    const cacheStability = await this.assessCacheStability();
    const recoveryStability = await this.assessRecoveryStability();
    const runtimeStability = await this.assessRuntimeStability();
    const autonomyStability = await this.assessAutonomyStability();

    const overall = Math.round(
      (providerStability * 0.3 +
        cacheStability * 0.15 +
        recoveryStability * 0.25 +
        runtimeStability * 0.2 +
        autonomyStability * 0.1),
    );

    const previousScore = this.history.recentActions.length > 0
      ? overall // 简化trend计算
      : overall;
    const trend: StabilityScore["trend"] =
      overall >= 80 ? "stable" : overall >= 60 ? "declining" : "critical";

    return {
      overall,
      providerStability,
      cacheStability,
      recoveryStability,
      runtimeStability,
      autonomyStability,
      calculatedAt: Date.now(),
      trend,
    };
  }

  // ─── History ───

  getHistory(): HealingHistory {
    return { ...this.history };
  }

  getRecentActions(limit = 20): HealingResult[] {
    return this.history.recentActions.slice(0, limit);
  }

  getSuccessRate(): number {
    return this.history.successRate;
  }

  // ─── Risk Scoring ───

  /**
   * 评估Provider风险 (0-100, 越高越危险)
   */
  async assessProviderRisk(): Promise<number> {
    try {
      const { getProviderManager } = await import(
        "@/music-source/providers/provider-manager/ProviderManager"
      );
      const manager = getProviderManager();
      const healthMap = manager.getAllHealth();
      const entries = Array.from(healthMap.entries());
      const realProviders = entries.filter(([type]) => type !== "mock");

      if (realProviders.length === 0) return 90; // 只有Mock, 高风险

      const unhealthyCount = realProviders.filter(([, h]) => h.successRate < 50).length;
      const ratio = unhealthyCount / realProviders.length;

      return Math.round(ratio * 100);
    } catch {
      return 85;
    }
  }

  /**
   * 评估系统降级风险
   */
  async assessDegradationRisk(): Promise<number> {
    try {
      const { getDegradedRuntime } = await import("@/ecosystem/ai-autonomy/DegradedRuntimeMode");
      const degraded = getDegradedRuntime();
      if (degraded.isEmergencyDegraded()) return 95;
      if (degraded.isOffline()) return 80;
      if (degraded.isDegraded()) return 50;
      return 10;
    } catch {
      return 60;
    }
  }

  // ─── Listeners ───

  subscribe(listener: (action: HealingResult) => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  // ─── Report ───

  generateHealingReport(): string {
    return [
      "# Self-Healing Governance Report",
      "",
      `- **Total Healings:** ${this.history.totalAttempts}`,
      `- **Success Rate:** ${(this.history.successRate * 100).toFixed(1)}%`,
      `- **Successes:** ${this.history.totalSuccesses}`,
      `- **Failures:** ${this.history.totalFailures}`,
      "",
      "## Recent Actions (last 10)",
      "",
      ...this.history.recentActions.slice(0, 10).map(
        (a) =>
          `- [${a.success ? "✅" : "❌"}] ${a.action.type} → ${a.action.target}: ${a.previousState} → ${a.newState} (${a.duration}ms)`,
      ),
      "",
      "---",
      "> SelfHealingGovernance | Phase 13",
    ].join("\n");
  }

  // ─── Private: Healing Implementations ───

  private async healByRestart(target: string): Promise<void> {
    switch (target) {
      case "autonomy_loop": {
        const { getAIAutonomy } = await import("@/ecosystem/ai-autonomy/AIAutonomyManager");
        const a = getAIAutonomy();
        a.stop();
        await new Promise((r) => setTimeout(r, 1000));
        a.start();
        break;
      }
      case "maintenance_loop": {
        const { getMaintenanceLoop } = await import("@/frozen-runtime/AutonomousMaintenanceLoop");
        const ml = getMaintenanceLoop();
        ml.stop();
        await new Promise((r) => setTimeout(r, 1000));
        ml.start();
        break;
      }
      default:
        throw new Error(`Unknown restart target: ${target}`);
    }
  }

  private async healByReload(target: string): Promise<void> {
    switch (target) {
      case "provider_config": {
        const { getProviderHotReload } = await import("@/platform/update/ProviderHotReload");
        getProviderHotReload().reset();
        break;
      }
      case "runtime_config": {
        const { getRuntimeConfig } = await import("@/platform/config/RuntimeConfigManager");
        getRuntimeConfig().resetToDefaults();
        break;
      }
      default:
        throw new Error(`Unknown reload target: ${target}`);
    }
  }

  private async healByFallback(target: string): Promise<void> {
    switch (target) {
      case "providers": {
        const { getProviderManager } = await import(
          "@/music-source/providers/provider-manager/ProviderManager"
        );
        // 强制切换到MockProvider
        const manager = getProviderManager();
        manager.setProviderPriority("mock" as never, 0);
        break;
      }
      case "degraded_mode": {
        const { getDegradedRuntime } = await import("@/ecosystem/ai-autonomy/DegradedRuntimeMode");
        getDegradedRuntime().activateDegraded("self_healing_fallback", "severe");
        break;
      }
      default:
        throw new Error(`Unknown fallback target: ${target}`);
    }
  }

  private async healByReset(target: string): Promise<void> {
    switch (target) {
      case "cache": {
        const { getCacheGovernance } = await import("@/system/cleanup/CacheGovernance");
        getCacheGovernance().runGC();
        break;
      }
      case "issues": {
        const { getAIAutonomy } = await import("@/ecosystem/ai-autonomy/AIAutonomyManager");
        const autonomy = getAIAutonomy();
        for (const issue of autonomy.getOpenIssues()) {
          autonomy.resolveIssue(issue.id);
        }
        break;
      }
      default:
        throw new Error(`Unknown reset target: ${target}`);
    }
  }

  private async healByReinitialize(target: string): Promise<void> {
    switch (target) {
      case "isolation_layer": {
        const { getRuntimeIsolation } = await import("@/frozen-runtime/isolation/RuntimeIsolationLayer");
        const iso = getRuntimeIsolation();
        const domains = iso.getIsolatedDomains();
        for (const d of domains) {
          iso.resetDomain(d);
        }
        break;
      }
      case "frozen_runtime": {
        const { getFrozenRuntime } = await import("@/frozen-runtime/FrozenRuntimeManager");
        const frozen = getFrozenRuntime();
        frozen.activate();
        break;
      }
      default:
        throw new Error(`Unknown reinitialize target: ${target}`);
    }
  }

  private async healByQuarantine(target: string): Promise<void> {
    const { getRuntimeIsolation } = await import("@/frozen-runtime/isolation/RuntimeIsolationLayer");
    getRuntimeIsolation().isolate(target as never, "self_healing_quarantine");
  }

  // ─── Private: Stability Assessment ───

  private async assessProviderStability(): Promise<number> {
    try {
      const { getProviderManager } = await import(
        "@/music-source/providers/provider-manager/ProviderManager"
      );
      const manager = getProviderManager();
      const healthMap = manager.getAllHealth();
      const entries = Array.from(healthMap.entries());
      if (entries.length === 0) return 0;
      const avgSuccess = entries.reduce((s, [, h]) => s + h.successRate, 0) / entries.length;
      return Math.round(avgSuccess);
    } catch {
      return 30;
    }
  }

  private async assessCacheStability(): Promise<number> {
    try {
      const { getCacheGovernance } = await import("@/system/cleanup/CacheGovernance");
      const last = getCacheGovernance().getLastResult();
      return last ? 100 : 70;
    } catch {
      return 50;
    }
  }

  private async assessRecoveryStability(): Promise<number> {
    try {
      const { getDisasterRecovery } = await import("@/platform/recovery/DisasterRecovery");
      const checkpoints = getDisasterRecovery().getCheckpoints();
      return checkpoints.length > 0 ? 100 : 60;
    } catch {
      return 40;
    }
  }

  private async assessRuntimeStability(): Promise<number> {
    try {
      const { getFrozenRuntime } = await import("@/frozen-runtime/FrozenRuntimeManager");
      return getFrozenRuntime().getIntegrityScore();
    } catch {
      return 50;
    }
  }

  private async assessAutonomyStability(): Promise<number> {
    try {
      const { getMaintenanceLoop } = await import("@/frozen-runtime/AutonomousMaintenanceLoop");
      return getMaintenanceLoop().isRunning() ? 90 : 30;
    } catch {
      return 40;
    }
  }

  private async generateHealingActions(
    stability: StabilityScore,
  ): Promise<HealingAction[]> {
    const actions: HealingAction[] = [];

    if (stability.providerStability < 50) {
      actions.push({
        id: `heal-${Date.now()}-providers`,
        type: "fallback",
        target: "providers",
        severity: "high",
        autoExecute: true,
        maxAttempts: 2,
        cooldownMs: 5000,
      });
    }

    if (stability.cacheStability < 40) {
      actions.push({
        id: `heal-${Date.now()}-cache`,
        type: "reset",
        target: "cache",
        severity: "medium",
        autoExecute: true,
        maxAttempts: 3,
        cooldownMs: 3000,
      });
    }

    if (stability.recoveryStability < 50) {
      actions.push({
        id: `heal-${Date.now()}-recovery`,
        type: "reinitialize",
        target: "frozen_runtime",
        severity: "high",
        autoExecute: true,
        maxAttempts: 2,
        cooldownMs: 10000,
      });
    }

    if (stability.runtimeStability < 60) {
      actions.push({
        id: `heal-${Date.now()}-runtime`,
        type: "restart",
        target: "autonomy_loop",
        severity: "medium",
        autoExecute: true,
        maxAttempts: 2,
        cooldownMs: 5000,
      });
    }

    if (stability.overall < 40) {
      actions.push({
        id: `heal-${Date.now()}-degraded`,
        type: "fallback",
        target: "degraded_mode",
        severity: "critical",
        autoExecute: true,
        maxAttempts: 1,
        cooldownMs: 0,
      });
    }

    return actions;
  }

  // ─── Private: History ───

  private recordResult(result: HealingResult): void {
    this.history.totalAttempts++;
    if (result.success) {
      this.history.totalSuccesses++;
    } else {
      this.history.totalFailures++;
    }

    this.history.recentActions.unshift(result);
    if (this.history.recentActions.length > 100) {
      this.history.recentActions = this.history.recentActions.slice(0, 100);
    }

    this.history.successRate =
      this.history.totalAttempts > 0
        ? this.history.totalSuccesses / this.history.totalAttempts
        : 0;

    this.persistHistory();
  }

  private loadHistory(): HealingHistory {
    try {
      const raw = localStorage.getItem(HEALING_HISTORY_KEY);
      if (raw) return JSON.parse(raw) as HealingHistory;
    } catch { /* silent */ }
    return {
      totalAttempts: 0,
      totalSuccesses: 0,
      totalFailures: 0,
      recentActions: [],
      successRate: 0,
    };
  }

  private persistHistory(): void {
    try {
      localStorage.setItem(HEALING_HISTORY_KEY, JSON.stringify(this.history));
    } catch { /* silent */ }
  }

  private notifyListeners(result: HealingResult): void {
    this.listeners.forEach((fn) => {
      try { fn(result); } catch { /* silent */ }
    });
  }
}

export function getSelfHealingGovernance(): SelfHealingGovernance {
  return SelfHealingGovernance.getInstance();
}

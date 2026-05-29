/**
 * Phase 9 — Provider 自愈系统
 *
 * 职责:
 * - 自动评分 (latency + health + success rate)
 * - 自动降级 (score < threshold)
 * - 自动恢复 (score > threshold)
 * - 失败冷却 (consecutive failures → cooldown)
 * - 优先级动态调整
 *
 * 增强 ProviderManager，不修改其核心逻辑
 */

import type {
  ProviderScore,
  ProviderScoreMap,
  SelfHealingConfig,
  ProviderHealthSnapshot,
} from "@/types";
import { DEFAULT_SELF_HEALING_CONFIG } from "@/types";
import { getProviderManager } from "@/music-source/providers/provider-manager/ProviderManager";
import { getLogger } from "@/lib/logs/Logger";
import type { ProviderType } from "@/music-source/types";

export class ProviderSelfHealingSystem {
  private static instance: ProviderSelfHealingSystem | null = null;

  private config: SelfHealingConfig;
  private scores: ProviderScoreMap = {};
  private cooldowns: Map<string, number> = new Map();
  private logger = getLogger();
  private probeTimers: Map<string, ReturnType<typeof setInterval>> = new Map();

  private onHeal?: (type: string) => void;
  private onDegrade?: (type: string, reason: string) => void;

  private constructor() {
    this.config = { ...DEFAULT_SELF_HEALING_CONFIG };
  }

  static getInstance(): ProviderSelfHealingSystem {
    if (!ProviderSelfHealingSystem.instance) {
      ProviderSelfHealingSystem.instance = new ProviderSelfHealingSystem();
    }
    return ProviderSelfHealingSystem.instance;
  }

  // ==================== Configuration ====================

  configure(partial: Partial<SelfHealingConfig>): void {
    this.config = { ...this.config, ...partial };
  }

  setOnHeal(cb: (type: string) => void): void {
    this.onHeal = cb;
  }

  setOnDegrade(cb: (type: string, reason: string) => void): void {
    this.onDegrade = cb;
  }

  // ==================== Scoring ====================

  /**
   * 根据健康快照计算评分
   */
  scoreProvider(type: string, health: ProviderHealthSnapshot): ProviderScore {
    const latencyScore = this.calcLatencyScore(health.avgLatency);
    const healthScore = this.calcHealthScore(health.successRate);

    // 连续失败惩罚
    const failurePenalty = Math.min(health.consecutiveFailures * 15, 60);
    const compositeScore = Math.max(
      0,
      Math.round(latencyScore * 0.3 + healthScore * 0.7 - failurePenalty),
    );

    // 冷却期降分
    const cooldownRemaining = this.getCooldownRemaining(type);
    const finalScore = cooldownRemaining > 0 ? Math.min(compositeScore, 20) : compositeScore;

    const score: ProviderScore = {
      latencyScore,
      healthScore,
      compositeScore: finalScore,
      lastUpdated: Date.now(),
    };

    this.scores[type] = score;
    return score;
  }

  private calcLatencyScore(avgLatency: number): number {
    if (avgLatency <= 0) return 100;
    if (avgLatency <= this.config.perfectLatencyMs) return 100;
    if (avgLatency >= this.config.worstLatencyMs) return 0;
    return Math.round(
      100 - ((avgLatency - this.config.perfectLatencyMs) /
        (this.config.worstLatencyMs - this.config.perfectLatencyMs)) * 100,
    );
  }

  private calcHealthScore(successRate: number): number {
    return Math.round(Math.max(0, Math.min(100, successRate)));
  }

  // ==================== Cooldown ====================

  private setCooldown(type: string): void {
    this.cooldowns.set(type, Date.now());
    this.logger.warn("provider", `Cooldown: ${type} for ${this.config.failureCooldownMs}ms`);
  }

  private getCooldownRemaining(type: string): number {
    const start = this.cooldowns.get(type);
    if (!start) return 0;
    const elapsed = Date.now() - start;
    const remaining = this.config.failureCooldownMs - elapsed;
    return Math.max(0, remaining);
  }

  private isInCooldown(type: string): boolean {
    return this.getCooldownRemaining(type) > 0;
  }

  // ==================== Healing Logic ====================

  /**
   * 检查并执行自愈逻辑
   * 在 ProviderManager 的 execute() 之后调用
   */
  evaluate(type: string, health: ProviderHealthSnapshot): void {
    const score = this.scoreProvider(type, health);

    // 检查是否需要降级
    if (score.compositeScore < this.config.degradeThreshold) {
      if (health.consecutiveFailures >= this.config.consecutiveFailuresForDegrade) {
        this.degradeProvider(type, `composite score ${score.compositeScore} + ${health.consecutiveFailures} consecutive failures`);
      }
    }

    // 检查是否可以恢复 (从冷却中恢复)
    if (this.isInCooldown(type)) {
      if (score.compositeScore >= this.config.recoverThreshold && health.consecutiveFailures === 0) {
        this.recoverProvider(type);
      }
    }

    // 连续失败 → 冷却
    if (health.consecutiveFailures >= this.config.consecutiveFailuresForDegrade && !this.isInCooldown(type)) {
      this.setCooldown(type);
      this.degradeProvider(type, `${health.consecutiveFailures} consecutive failures → cooldown`);
    }
  }

  private degradeProvider(type: string, reason: string): void {
    const pm = getProviderManager();

    // 禁止降级 mock
    if (type === "mock") return;

    // 如果是当前活跃provider, 触发fallback
    if (pm.getActiveType() === type) {
      pm.setEnabled(type as ProviderType, false);
      this.logger.warn("provider", `Degraded: ${type} (${reason})`);
      this.onDegrade?.(type, reason);

      // 开始探测恢复
      this.startRecoveryProbe(type as ProviderType);
    }
  }

  private recoverProvider(type: string): void {
    this.cooldowns.delete(type);
    const pm = getProviderManager();
    pm.setEnabled(type as ProviderType, true);
    this.logger.info("provider", `Recovered: ${type}`);
    this.onHeal?.(type);
    this.stopRecoveryProbe(type as ProviderType);
  }

  // ==================== Recovery Probe ====================

  private startRecoveryProbe(type: ProviderType): void {
    if (this.probeTimers.has(type)) return;
    if (type === "mock") return;

    const timer = setInterval(() => {
      const score = this.scores[type];
      if (!score) return;

      const health = getProviderManager().getHealth(type);

      if (
        score.compositeScore >= this.config.recoverThreshold &&
        health.consecutiveFailures === 0 &&
        health.successRate >= 80
      ) {
        this.recoverProvider(type);
      }
    }, this.config.probeIntervalMs);

    this.probeTimers.set(type, timer);
  }

  private stopRecoveryProbe(type: ProviderType): void {
    const timer = this.probeTimers.get(type);
    if (timer) {
      clearInterval(timer);
      this.probeTimers.delete(type);
    }
  }

  // ==================== State ====================

  getScores(): ProviderScoreMap {
    return { ...this.scores };
  }

  getScore(type: string): ProviderScore | undefined {
    return this.scores[type];
  }

  /** 获取按评分排序的 Provider 优先级列表 */
  getSortedPriorities(): string[] {
    return Object.entries(this.scores)
      .sort(([, a], [, b]) => b.compositeScore - a.compositeScore)
      .map(([type]) => type);
  }

  isDegraded(type: string): boolean {
    return this.isInCooldown(type);
  }

  reset(): void {
    this.scores = {};
    this.cooldowns.clear();
    for (const [, timer] of this.probeTimers) {
      clearInterval(timer);
    }
    this.probeTimers.clear();
  }

  destroy(): void {
    this.reset();
    ProviderSelfHealingSystem.instance = null;
  }
}

export function getProviderSelfHealing(): ProviderSelfHealingSystem {
  return ProviderSelfHealingSystem.getInstance();
}

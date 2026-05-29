/**
 * Phase 13 — FrozenGovernanceManager
 *
 * 冻结治理管理器。提供长期稳定性评分和治理决策。
 * 增强 RuntimeGovernanceManager (Phase 11) 和 GovernancePipeline (Phase 12)。
 */
import type { StabilityScore } from "@/types/phase13";

const GOVERNANCE_DECISIONS_KEY = "music_frozen_governance_decisions";

export interface GovernanceDecision {
  id: string;
  timestamp: number;
  type: "approve" | "reject" | "warn" | "defer";
  target: string;
  reason: string;
  riskLevel: "none" | "low" | "medium" | "high" | "critical";
  recommendation: string;
  expiresAt?: number;
}

export class FrozenGovernanceManager {
  private static instance: FrozenGovernanceManager;
  private decisions: GovernanceDecision[] = [];
  private stabilityScore: StabilityScore | null = null;
  private lastScoreUpdate = 0;

  private constructor() {
    this.loadDecisions();
  }

  static getInstance(): FrozenGovernanceManager {
    if (!FrozenGovernanceManager.instance) {
      FrozenGovernanceManager.instance = new FrozenGovernanceManager();
    }
    return FrozenGovernanceManager.instance;
  }

  /**
   * 评估修改请求
   */
  async evaluateModificationRequest(
    target: string,
    reason: string,
  ): Promise<GovernanceDecision> {
    const decision: GovernanceDecision = {
      id: `dec-${Date.now()}`,
      timestamp: Date.now(),
      type: "reject",
      target,
      reason,
      riskLevel: "low",
      recommendation: "",
    };

    // 检查是否在冻结模块列表中
    const { FROZEN_MODULES } = await import("@/frozen-runtime/bootstrap/AIBootstrapLayer");
    const normalizedTarget = target.replace(/\\/g, "/").toLowerCase();

    const isFrozen = FROZEN_MODULES.some(
      (m) => normalizedTarget.includes(m.toLowerCase()),
    );

    if (isFrozen) {
      decision.type = "reject";
      decision.riskLevel = "critical";
      decision.recommendation = `模块 "${target}" 已冻结，不可修改。请通过扩展而非修改的方式实现需求。`;
    } else {
      // 检查是否在危险区域
      const { DANGER_ZONES } = await import("@/frozen-runtime/bootstrap/AIBootstrapLayer");
      const isDangerZone = DANGER_ZONES.some(
        (z) => normalizedTarget.includes(z.toLowerCase().replace(/\/$/, "")),
      );

      if (isDangerZone) {
        decision.type = "warn";
        decision.riskLevel = "high";
        decision.recommendation = `模块位于危险区域，修改前请确保了解影响范围。建议先阅读 docs/AI_CONTEXT_RECOVERY.md 中的禁止区域清单。`;
      } else {
        decision.type = "approve";
        decision.riskLevel = "low";
        decision.recommendation = "允许修改，但请遵循现有代码规范和治理规则。";
      }
    }

    this.decisions.unshift(decision);
    if (this.decisions.length > 100) {
      this.decisions = this.decisions.slice(0, 100);
    }
    this.persistDecisions();

    return decision;
  }

  /**
   * 获取长期稳定性评分
   */
  async getStabilityScore(): Promise<StabilityScore> {
    const now = Date.now();
    // 缓存5分钟
    if (this.stabilityScore && now - this.lastScoreUpdate < 300000) {
      return this.stabilityScore;
    }

    try {
      const { getSelfHealingGovernance } = await import(
        "@/frozen-runtime/healing/SelfHealingGovernance"
      );
      this.stabilityScore = await getSelfHealingGovernance().calculateStabilityScore();
      this.lastScoreUpdate = now;
    } catch {
      this.stabilityScore = this.stabilityScore ?? {
        overall: 70,
        providerStability: 70,
        cacheStability: 70,
        recoveryStability: 70,
        runtimeStability: 70,
        autonomyStability: 70,
        calculatedAt: now,
        trend: "stable",
      };
    }

    return this.stabilityScore;
  }

  /**
   * 获取治理决策历史
   */
  getDecisions(limit = 20): GovernanceDecision[] {
    return this.decisions.slice(0, limit);
  }

  /**
   * 检查是否可以执行某种类型的变更
   */
  async canProceed(
    changeType: "new_feature" | "bug_fix" | "refactor" | "architecture_change" | "dependency_upgrade",
  ): Promise<{ allowed: boolean; reason: string }> {
    const stability = await this.getStabilityScore();

    switch (changeType) {
      case "architecture_change":
        if (stability.overall < 70) {
          return { allowed: false, reason: "系统稳定性不足，暂不允许架构变更" };
        }
        return { allowed: true, reason: "架构变更需要严格审核" };
      case "refactor":
        if (stability.overall < 50) {
          return { allowed: false, reason: "系统稳定性过低，暂不建议重构" };
        }
        return { allowed: true, reason: "确保不影响冻结模块" };
      case "new_feature":
      case "bug_fix":
      case "dependency_upgrade":
        return { allowed: true, reason: "常规变更允许" };
      default:
        return { allowed: true, reason: "" };
    }
  }

  // ─── Persistence ───

  private loadDecisions(): void {
    try {
      const raw = localStorage.getItem(GOVERNANCE_DECISIONS_KEY);
      if (raw) this.decisions = JSON.parse(raw) as GovernanceDecision[];
    } catch {
      this.decisions = [];
    }
  }

  private persistDecisions(): void {
    try {
      localStorage.setItem(GOVERNANCE_DECISIONS_KEY, JSON.stringify(this.decisions.slice(0, 50)));
    } catch { /* silent */ }
  }
}

export function getFrozenGovernance(): FrozenGovernanceManager {
  return FrozenGovernanceManager.getInstance();
}

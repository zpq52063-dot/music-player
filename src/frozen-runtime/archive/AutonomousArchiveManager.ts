/**
 * Phase 13 — AutonomousArchiveManager
 *
 * 自治归档管理器。自动归档:
 * - 系统状态快照
 * - 维护报告
 * - 治理决策
 * - 恢复计划
 */
import type { MaintenanceReport } from "@/types/phase13";

const ARCHIVE_KEY = "music_autonomous_archive";

export interface ArchivedItem {
  id: string;
  type: "maintenance_report" | "governance_decision" | "recovery_plan" | "snapshot" | "stability_score";
  timestamp: number;
  data: unknown;
  retention: "permanent" | "long_term" | "short_term";
  expiresAt?: number;
}

export class AutonomousArchiveManager {
  private static instance: AutonomousArchiveManager;
  private archives: ArchivedItem[] = [];

  private constructor() {
    this.loadArchives();
  }

  static getInstance(): AutonomousArchiveManager {
    if (!AutonomousArchiveManager.instance) {
      AutonomousArchiveManager.instance = new AutonomousArchiveManager();
    }
    return AutonomousArchiveManager.instance;
  }

  /**
   * 归档维护报告
   */
  archiveMaintenanceReport(report: MaintenanceReport): void {
    this.addItem({
      id: `archive-report-${report.id}`,
      type: "maintenance_report",
      timestamp: report.timestamp,
      data: report,
      retention: "short_term",
      expiresAt: Date.now() + 30 * 86400000, // 30天
    });
  }

  /**
   * 归档治理决策
   */
  archiveGovernanceDecision(decision: unknown): void {
    this.addItem({
      id: `archive-decision-${Date.now()}`,
      type: "governance_decision",
      timestamp: Date.now(),
      data: decision,
      retention: "long_term",
      expiresAt: Date.now() + 365 * 86400000, // 1年
    });
  }

  /**
   * 归档恢复计划
   */
  archiveRecoveryPlan(plan: unknown): void {
    this.addItem({
      id: `archive-plan-${Date.now()}`,
      type: "recovery_plan",
      timestamp: Date.now(),
      data: plan,
      retention: "permanent",
    });
  }

  /**
   * 归档稳定性评分
   */
  archiveStabilityScore(score: unknown): void {
    this.addItem({
      id: `archive-score-${Date.now()}`,
      type: "stability_score",
      timestamp: Date.now(),
      data: score,
      retention: "long_term",
      expiresAt: Date.now() + 180 * 86400000, // 180天
    });
  }

  /**
   * 获取归档项
   */
  getArchives(type?: ArchivedItem["type"], limit = 50): ArchivedItem[] {
    let filtered = type ? this.archives.filter((a) => a.type === type) : this.archives;
    return filtered.slice(0, limit);
  }

  /**
   * 获取归档统计
   */
  getArchiveStats(): Record<string, number> {
    const stats: Record<string, number> = {};
    for (const item of this.archives) {
      stats[item.type] = (stats[item.type] ?? 0) + 1;
    }
    return stats;
  }

  /**
   * 清理过期归档
   */
  purgeExpired(): number {
    const before = this.archives.length;
    const now = Date.now();
    this.archives = this.archives.filter(
      (a) => !a.expiresAt || a.expiresAt > now || a.retention === "permanent",
    );
    const removed = before - this.archives.length;
    if (removed > 0) this.persistArchives();
    return removed;
  }

  /**
   * 导出所有归档
   */
  exportArchives(): string {
    return JSON.stringify(
      {
        exportedAt: Date.now(),
        version: 13,
        count: this.archives.length,
        items: this.archives,
      },
      null,
      2,
    );
  }

  /**
   * 清理所有短期归档
   */
  clearAll(): number {
    const before = this.archives.length;
    this.archives = this.archives.filter((a) => a.retention === "permanent");
    this.persistArchives();
    return before - this.archives.length;
  }

  // ─── Private ───

  private addItem(item: ArchivedItem): void {
    this.archives.unshift(item);

    // 限制总数
    if (this.archives.length > 500) {
      // 优先删除过期的短期项
      const now = Date.now();
      const expired = this.archives.filter(
        (a) => a.retention !== "permanent" && a.expiresAt && a.expiresAt < now,
      );
      for (const exp of expired) {
        const idx = this.archives.indexOf(exp);
        if (idx >= 0) this.archives.splice(idx, 1);
      }

      // 如果仍然超限，删除最旧的
      if (this.archives.length > 500) {
        this.archives = this.archives.slice(0, 500);
      }
    }

    this.persistArchives();
  }

  private loadArchives(): void {
    try {
      const raw = localStorage.getItem(ARCHIVE_KEY);
      if (raw) this.archives = JSON.parse(raw) as ArchivedItem[];
    } catch {
      this.archives = [];
    }
  }

  private persistArchives(): void {
    try {
      localStorage.setItem(ARCHIVE_KEY, JSON.stringify(this.archives));
    } catch {
      // storage full — trim
      this.archives = this.archives.filter((a) => a.retention === "permanent").slice(0, 100);
      try {
        localStorage.setItem(ARCHIVE_KEY, JSON.stringify(this.archives));
      } catch { /* silent */ }
    }
  }
}

export function getAutonomousArchive(): AutonomousArchiveManager {
  return AutonomousArchiveManager.getInstance();
}

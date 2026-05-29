/**
 * Phase 13 — SnapshotRotationManager ★
 *
 * 快照轮换管理器。职责:
 * - 周期性Runtime快照生成
 * - 自动清理旧快照
 * - 自动恢复点管理
 * - Provider历史状态追踪
 * - 快照旋转策略
 */
import type {
  SnapshotEntry,
  SnapshotType,
  RotationConfig,
  RotationResult,
} from "@/types/phase13";
import { DEFAULT_ROTATION_CONFIG } from "@/types/phase13";

const SNAPSHOTS_KEY = "music_snapshot_rotation";
const CONFIG_KEY = "music_snapshot_rotation_config";

export class SnapshotRotationManager {
  private static instance: SnapshotRotationManager;
  private config: RotationConfig;
  private snapshots: SnapshotEntry[] = [];
  private rotationTimer: ReturnType<typeof setInterval> | null = null;

  private constructor() {
    this.config = this.loadConfig();
    this.snapshots = this.loadSnapshots();
  }

  static getInstance(): SnapshotRotationManager {
    if (!SnapshotRotationManager.instance) {
      SnapshotRotationManager.instance = new SnapshotRotationManager();
    }
    return SnapshotRotationManager.instance;
  }

  // ─── Lifecycle ───

  startAutoRotation(): void {
    if (!this.config.autoRotate) return;
    this.stopAutoRotation();
    this.rotationTimer = setInterval(() => {
      this.rotate().catch(() => { /* silent */ });
    }, this.config.rotationInterval);
  }

  stopAutoRotation(): void {
    if (this.rotationTimer) {
      clearInterval(this.rotationTimer);
      this.rotationTimer = null;
    }
  }

  // ─── Snapshot Creation ───

  /**
   * 创建新快照
   */
  async createSnapshot(type: SnapshotType): Promise<SnapshotEntry> {
    const entry: SnapshotEntry = {
      id: `snap-${type}-${Date.now()}`,
      type,
      createdAt: Date.now(),
      size: 0,
      checksum: "",
      retentionPriority: "normal",
    };

    // 收集快照数据
    switch (type) {
      case "providers":
        entry.providerStates = await this.captureProviderStates();
        break;
      case "config":
        entry.configState = await this.captureConfigState();
        break;
      case "runtime":
        entry.runtimeState = await this.captureRuntimeState();
        break;
      case "full":
        entry.providerStates = await this.captureProviderStates();
        entry.configState = await this.captureConfigState();
        entry.runtimeState = await this.captureRuntimeState();
        entry.retentionPriority = "keep";
        break;
      case "cache":
        entry.providerStates = {};
        break;
    }

    // 计算checksum
    entry.checksum = this.computeChecksum(entry);
    entry.size = JSON.stringify(entry).length;

    this.snapshots.unshift(entry);
    this.persistSnapshots();

    // 创建后立即检查是否需要轮换
    await this.rotate();

    return entry;
  }

  // ─── Rotation ───

  /**
   * 执行快照轮换
   */
  async rotate(): Promise<RotationResult> {
    const now = Date.now();
    const rotated: SnapshotEntry[] = [];
    const deleted: SnapshotEntry[] = [];
    const kept: SnapshotEntry[] = [];

    // 1. 按类型检查数量上限
    const typeCounts: Record<string, SnapshotEntry[]> = {};
    for (const snap of this.snapshots) {
      if (!typeCounts[snap.type]) typeCounts[snap.type] = [];
      typeCounts[snap.type]!.push(snap);
    }

    for (const [type, entries] of Object.entries(typeCounts)) {
      const max = this.config.perTypeMax[type as SnapshotType] ?? this.config.maxSnapshots;

      // 按优先级排序: keep最优先保留
      const sorted = entries.sort((a, b) => {
        const priorityOrder = { keep: 0, normal: 1, expendable: 2 };
        return priorityOrder[a.retentionPriority] - priorityOrder[b.retentionPriority];
      });

      // 保留前max个
      const toKeep = sorted.slice(0, max);
      const toDelete = sorted.slice(max);

      kept.push(...toKeep);
      deleted.push(...toDelete);
      rotated.push(...toDelete);
    }

    // 2. 按年龄清理
    for (const snap of kept) {
      if (now - snap.createdAt > this.config.maxAgeMs && snap.retentionPriority !== "keep") {
        rotated.push(snap);
        deleted.push(snap);
      }
    }

    // 3. 按总数检查
    if (kept.length > this.config.maxSnapshots) {
      const toRemove = kept.splice(this.config.maxSnapshots);
      rotated.push(...toRemove);
      deleted.push(...toRemove);
    }

    // 4. 应用删除
    this.snapshots = kept.filter((s) => !deleted.includes(s));

    // 5. 月度快照保留
    if (this.config.keepMonthlyMinimum && deleted.length > 0) {
      const monthlySnaps = deleted.filter((s) => {
        const date = new Date(s.createdAt);
        return date.getDate() === 1; // 每月1号的快照
      });
      // 保留月度快照中retentionPriority最高的
      for (const ms of monthlySnaps) {
        ms.retentionPriority = "keep";
        this.snapshots.push(ms);
        const idx = deleted.indexOf(ms);
        if (idx >= 0) deleted.splice(idx, 1);
      }
    }

    this.persistSnapshots();

    return {
      rotated,
      kept: this.snapshots,
      deleted,
      reason: `轮换完成: 保留${this.snapshots.length}个, 删除${deleted.length}个`,
    };
  }

  // ─── Query ───

  getAllSnapshots(): SnapshotEntry[] {
    return [...this.snapshots];
  }

  getSnapshotsByType(type: SnapshotType): SnapshotEntry[] {
    return this.snapshots.filter((s) => s.type === type);
  }

  getLatestSnapshot(type?: SnapshotType): SnapshotEntry | null {
    if (type) {
      const typed = this.getSnapshotsByType(type);
      return typed[0] ?? null;
    }
    return this.snapshots[0] ?? null;
  }

  getSnapshotCount(): number {
    return this.snapshots.length;
  }

  /**
   * 创建恢复点 (标记为keep优先级)
   */
  async createRecoveryPoint(): Promise<SnapshotEntry> {
    const entry = await this.createSnapshot("full");
    entry.retentionPriority = "keep";
    this.persistSnapshots();
    return entry;
  }

  // ─── Configuration ───

  getConfig(): RotationConfig {
    return { ...this.config };
  }

  updateConfig(partial: Partial<RotationConfig>): void {
    this.config = { ...this.config, ...partial };
    this.persistConfig();
    if (this.config.autoRotate) {
      this.startAutoRotation();
    } else {
      this.stopAutoRotation();
    }
  }

  // ─── Cleanup ───

  /**
   * 强制清理所有非keep快照
   */
  async forceCleanup(): Promise<number> {
    const before = this.snapshots.length;
    this.snapshots = this.snapshots.filter((s) => s.retentionPriority === "keep");
    this.persistSnapshots();
    return before - this.snapshots.length;
  }

  /**
   * 删除指定快照
   */
  deleteSnapshot(id: string): boolean {
    const idx = this.snapshots.findIndex((s) => s.id === id);
    if (idx < 0) return false;
    this.snapshots.splice(idx, 1);
    this.persistSnapshots();
    return true;
  }

  // ─── Report ───

  generateRotationReport(): string {
    const typeCounts: Record<string, number> = {};
    for (const s of this.snapshots) {
      typeCounts[s.type] = (typeCounts[s.type] ?? 0) + 1;
    }

    return [
      "# Snapshot Rotation Report",
      "",
      `- **Total Snapshots:** ${this.snapshots.length}`,
      `- **Max Allowed:** ${this.config.maxSnapshots}`,
      `- **Auto Rotation:** ${this.config.autoRotate ? "active" : "inactive"}`,
      "",
      "## By Type",
      "",
      "| Type | Count | Max |",
      "|------|-------|-----|",
      ...Object.entries(typeCounts).map(
        ([type, count]) =>
          `| ${type} | ${count} | ${this.config.perTypeMax[type as SnapshotType] ?? this.config.maxSnapshots} |`,
      ),
      "",
      "## Recent Snapshots (last 10)",
      "",
      ...this.snapshots.slice(0, 10).map(
        (s) =>
          `- **${s.id}** (${s.type}) — ${new Date(s.createdAt).toISOString()} [${s.retentionPriority}]`,
      ),
      "",
      "---",
      "> SnapshotRotationManager | Phase 13",
    ].join("\n");
  }

  // ─── Private: Capture ───

  private async captureProviderStates(): Promise<Record<string, unknown>> {
    try {
      const { getProviderManager } = await import(
        "@/music-source/providers/provider-manager/ProviderManager"
      );
      const manager = getProviderManager();
      const healthMap = manager.getAllHealth();
      const states: Record<string, unknown> = {};
      for (const [name, health] of healthMap) {
        states[name] = {
          successRate: health.successRate,
          avgLatency: health.avgLatency,
          consecutiveFailures: health.consecutiveFailures,
          lastCheck: health.lastCheckTime,
        };
      }
      return states;
    } catch {
      return {};
    }
  }

  private async captureConfigState(): Promise<Record<string, unknown>> {
    try {
      const { getRuntimeConfig } = await import("@/platform/config/RuntimeConfigManager");
      return { config: getRuntimeConfig().getConfig() };
    } catch {
      return {};
    }
  }

  private async captureRuntimeState(): Promise<Record<string, unknown>> {
    const state: Record<string, unknown> = {};
    try {
      const { getDegradedRuntime } = await import("@/ecosystem/ai-autonomy/DegradedRuntimeMode");
      state.degraded = getDegradedRuntime().getState();
    } catch { /* silent */ }
    try {
      const { getFrozenRuntime } = await import("@/frozen-runtime/FrozenRuntimeManager");
      state.frozen = getFrozenRuntime().getState();
    } catch { /* silent */ }
    return state;
  }

  private computeChecksum(entry: SnapshotEntry): string {
    // 简单哈希
    const content = JSON.stringify({
      type: entry.type,
      createdAt: entry.createdAt,
      providerStates: entry.providerStates,
      configState: entry.configState,
      runtimeState: entry.runtimeState,
    });
    let hash = 0;
    for (let i = 0; i < content.length; i++) {
      const char = content.charCodeAt(i);
      hash = ((hash << 5) - hash + char) | 0;
    }
    return Math.abs(hash).toString(16);
  }

  // ─── Persistence ───

  private loadSnapshots(): SnapshotEntry[] {
    try {
      const raw = localStorage.getItem(SNAPSHOTS_KEY);
      return raw ? (JSON.parse(raw) as SnapshotEntry[]) : [];
    } catch {
      return [];
    }
  }

  private persistSnapshots(): void {
    try {
      localStorage.setItem(SNAPSHOTS_KEY, JSON.stringify(this.snapshots));
    } catch {
      // localStorage full — 强制清理
      this.snapshots = this.snapshots.filter((s) => s.retentionPriority === "keep");
      try {
        localStorage.setItem(SNAPSHOTS_KEY, JSON.stringify(this.snapshots));
      } catch { /* silent */ }
    }
  }

  private loadConfig(): RotationConfig {
    try {
      const raw = localStorage.getItem(CONFIG_KEY);
      return raw ? { ...DEFAULT_ROTATION_CONFIG, ...JSON.parse(raw) } : { ...DEFAULT_ROTATION_CONFIG };
    } catch {
      return { ...DEFAULT_ROTATION_CONFIG };
    }
  }

  private persistConfig(): void {
    try {
      localStorage.setItem(CONFIG_KEY, JSON.stringify(this.config));
    } catch { /* silent */ }
  }
}

export function getSnapshotRotation(): SnapshotRotationManager {
  return SnapshotRotationManager.getInstance();
}

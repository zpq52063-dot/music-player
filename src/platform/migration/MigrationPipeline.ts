/**
 * Phase 10 — MigrationPipeline
 *
 * 职责:
 * - 数据结构升级
 * - Store 迁移
 * - Cache 迁移
 * - IndexedDB 版本迁移
 * - 迁移记录追踪 (幂等)
 *
 * 模式: 单例
 */

import type {
  MigrationStep,
  MigrationRecord,
  MigrationState,
  MigrationResult,
  MigrationTarget,
} from "@/types";
import { getLogger } from "@/lib/logs/Logger";

const MIGRATION_STATE_KEY = "music_migration_state";

let instance: MigrationPipeline | null = null;

export class MigrationPipeline {
  private state: MigrationState;
  private steps: MigrationStep[] = [];

  constructor() {
    this.state = this.loadState();
  }

  // ==================== Singleton ====================

  static getInstance(): MigrationPipeline {
    if (!instance) instance = new MigrationPipeline();
    return instance;
  }

  // ==================== Registration ====================

  /**
   * 注册迁移步骤 (按版本号排序)
   */
  register(step: MigrationStep): void {
    // 幂等: 同名步骤已存在则替换
    const existing = this.steps.findIndex((s) => s.id === step.id);
    if (existing !== -1) this.steps[existing] = step;
    else this.steps.push(step);

    this.steps.sort((a, b) => a.version - b.version);
  }

  registerSteps(steps: MigrationStep[]): void {
    for (const step of steps) this.register(step);
  }

  /**
   * 内置迁移: localStorage key 重命名
   */
  registerBuiltinMigrations(): void {
    // Migration v1→v2: legacy key migration (示例)
    this.register({
      id: "builtin_storage_key_v2",
      version: 2,
      target: "config",
      description: "Migrate legacy storage keys to namespaced format",
      up: async () => {
        const remap: Record<string, string> = {
          player_volume: "music_settings_player_volume",
          player_mode: "music_settings_player_mode",
        };
        let migrated = 0;
        for (const [oldKey, newKey] of Object.entries(remap)) {
          const val = localStorage.getItem(oldKey);
          if (val) {
            localStorage.setItem(newKey, val);
            localStorage.removeItem(oldKey);
            migrated++;
          }
        }
        return migrated > 0;
      },
      down: async () => {
        // reverse migration
        return true;
      },
    });

    // Migration v2→v3: IndexedDB version bump (预留)
    this.register({
      id: "builtin_idb_version_v3",
      version: 3,
      target: "indexeddb",
      description: "IndexedDB schema version check (Phase 10 placeholder)",
      up: async () => {
        // Phase 10: 当前无IDB schema变更，预留
        return true;
      },
    });
  }

  // ==================== State ====================

  getState(): MigrationState {
    return { ...this.state };
  }

  getCurrentVersion(): number {
    return this.state.currentVersion;
  }

  getPendingMigrations(): MigrationStep[] {
    return this.steps.filter((s) => !this.state.appliedMigrations.find((r) => r.id === s.id));
  }

  isApplied(migrationId: string): boolean {
    return this.state.appliedMigrations.some((r) => r.id === migrationId);
  }

  // ==================== Execution ====================

  /**
   * 运行所有待执行的迁移
   */
  async runAll(): Promise<MigrationResult> {
    const startTime = Date.now();
    const pending = this.getPendingMigrations();
    const applied: string[] = [];
    const failed: string[] = [];

    if (pending.length === 0) {
      return { success: true, applied, failed, duration: 0 };
    }

    getLogger().info("system", `Running ${pending.length} migrations...`);

    for (const step of pending) {
      const stepStart = Date.now();
      try {
        const success = await step.up();
        const record: MigrationRecord = {
          id: step.id,
          appliedAt: Date.now(),
          success,
          duration: Date.now() - stepStart,
        };

        if (success) {
          this.state.appliedMigrations.push(record);
          this.state.currentVersion = Math.max(this.state.currentVersion, step.version);
          applied.push(step.id);
          getLogger().info("system", `Migration applied: ${step.id} (v${step.version}, ${record.duration}ms)`);
        } else {
          failed.push(step.id);
          getLogger().warn("system", `Migration skipped: ${step.id} (up() returned false)`);
        }
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        failed.push(step.id);
        getLogger().error("system", `Migration failed: ${step.id} — ${message}`);

        // Stop on first failure for data safety
        break;
      }
    }

    this.state.lastMigrationAt = Date.now();
    this.persistState();

    return {
      success: failed.length === 0,
      applied,
      failed,
      duration: Date.now() - startTime,
    };
  }

  /**
   * 运行特定迁移
   */
  async runOne(migrationId: string): Promise<boolean> {
    const step = this.steps.find((s) => s.id === migrationId);
    if (!step) return false;
    if (this.isApplied(migrationId)) return true;

    try {
      const success = await step.up();
      if (success) {
        this.state.appliedMigrations.push({
          id: step.id,
          appliedAt: Date.now(),
          success: true,
          duration: 0,
        });
        this.state.currentVersion = Math.max(this.state.currentVersion, step.version);
        this.state.lastMigrationAt = Date.now();
        this.persistState();
      }
      return success;
    } catch {
      return false;
    }
  }

  /**
   * 回滚特定迁移
   */
  async rollback(migrationId: string): Promise<boolean> {
    const step = this.steps.find((s) => s.id === migrationId);
    if (!step?.down) return false;

    try {
      const success = await step.down();
      if (success) {
        this.state.appliedMigrations = this.state.appliedMigrations.filter(
          (r) => r.id !== migrationId,
        );
        this.state.lastMigrationAt = Date.now();
        this.persistState();
      }
      return success;
    } catch {
      return false;
    }
  }

  /**
   * 按目标筛选运行迁移
   */
  async runByTarget(target: MigrationTarget): Promise<MigrationResult> {
    const targetPending = this.getPendingMigrations().filter((s) => s.target === target);
    if (targetPending.length === 0) {
      return { success: true, applied: [], failed: [], duration: 0 };
    }

    const startTime = Date.now();
    const applied: string[] = [];
    const failed: string[] = [];

    for (const step of targetPending) {
      try {
        const success = await step.up();
        if (success) {
          this.state.appliedMigrations.push({
            id: step.id,
            appliedAt: Date.now(),
            success: true,
            duration: 0,
          });
          this.state.currentVersion = Math.max(this.state.currentVersion, step.version);
          applied.push(step.id);
        } else {
          failed.push(step.id);
        }
      } catch {
        failed.push(step.id);
        break;
      }
    }

    this.state.lastMigrationAt = Date.now();
    this.persistState();

    return { success: failed.length === 0, applied, failed, duration: Date.now() - startTime };
  }

  // ==================== Persistence ====================

  private loadState(): MigrationState {
    try {
      const raw = localStorage.getItem(MIGRATION_STATE_KEY);
      if (raw) return JSON.parse(raw) as MigrationState;
    } catch {
      // silently fail
    }
    return {
      currentVersion: 1,
      appliedMigrations: [],
      pendingMigrations: [],
      lastMigrationAt: 0,
    };
  }

  private persistState(): void {
    try {
      localStorage.setItem(MIGRATION_STATE_KEY, JSON.stringify(this.state));
    } catch {
      // silently fail
    }
  }

  // ==================== Reset ====================

  reset(): void {
    this.state = {
      currentVersion: 1,
      appliedMigrations: [],
      pendingMigrations: [],
      lastMigrationAt: 0,
    };
    this.steps = [];
    this.persistState();
  }
}

export function getMigrationPipeline(): MigrationPipeline {
  return MigrationPipeline.getInstance();
}

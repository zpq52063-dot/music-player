/**
 * Phase 10 — DisasterRecovery
 *
 * 职责:
 * - 灾难恢复检查点管理
 * - 快速恢复 (quick)
 * - 完整恢复 (full)
 * - 核选项重置 (nuclear)
 *
 * 模式: 单例
 */

import type {
  BackupBundle,
  RecoveryLevel,
  RecoveryCheckpoint,
  RecoveryResult2,
} from "@/types";
import { getLogger } from "@/lib/logs/Logger";
import { getBackupManager } from "@/platform/backup/BackupManager";
import { getRuntimeConfig } from "@/platform/config/RuntimeConfigManager";
import { getProviderHotReload } from "@/platform/update/ProviderHotReload";

const CHECKPOINT_KEY = "music_recovery_checkpoints";
const MAX_CHECKPOINTS = 5;

let instance: DisasterRecovery | null = null;

export class DisasterRecovery {
  private checkpoints: RecoveryCheckpoint[] = [];

  constructor() {
    this.loadCheckpoints();
  }

  // ==================== Singleton ====================

  static getInstance(): DisasterRecovery {
    if (!instance) instance = new DisasterRecovery();
    return instance;
  }

  // ==================== Checkpoints ====================

  /**
   * 创建恢复检查点
   */
  async createCheckpoint(level: RecoveryLevel = "full"): Promise<RecoveryCheckpoint | null> {
    try {
      const backupBundle = await getBackupManager().createBackup(level === "nuclear" ? "full" : "config");

      const checkpoint: RecoveryCheckpoint = {
        id: `cp_${Date.now().toString(36)}`,
        level,
        timestamp: Date.now(),
        state: {
          config: getRuntimeConfig().getConfig(),
          providerState: getProviderHotReload().getState(),
          backupBundle: backupBundle.manifest
            ? await this.getBackupBundle(backupBundle.manifest.id)
            : null,
          settings: this.captureSettings(),
        },
      };

      this.checkpoints.unshift(checkpoint);
      if (this.checkpoints.length > MAX_CHECKPOINTS) {
        this.checkpoints = this.checkpoints.slice(0, MAX_CHECKPOINTS);
      }

      this.persistCheckpoints();
      getLogger().info("system", `Recovery checkpoint created: ${checkpoint.id} (${level})`);

      return checkpoint;
    } catch (err) {
      getLogger().error("system", `Checkpoint creation failed: ${err instanceof Error ? err.message : String(err)}`);
      return null;
    }
  }

  getCheckpoints(): RecoveryCheckpoint[] {
    return [...this.checkpoints];
  }

  getLatestCheckpoint(): RecoveryCheckpoint | null {
    return this.checkpoints[0] ?? null;
  }

  // ==================== Recovery ====================

  /**
   * 快速恢复: 恢复配置 + Provider状态
   */
  async quickRecover(): Promise<RecoveryResult2> {
    const startTime = Date.now();
    const errors: string[] = [];
    let restored = 0;

    try {
      const checkpoint = this.getLatestCheckpoint();
      if (!checkpoint) {
        return { success: false, level: "quick", checkpointsRestored: 0, errors: ["No checkpoint found"], duration: 0 };
      }

      // 恢复 RuntimeConfig
      if (checkpoint.state.config) {
        const rm = getRuntimeConfig();
        rm.resetToDefaults();
        for (const provider of checkpoint.state.config.providers) {
          rm.updateProviderConfig(provider.type, provider);
        }
        restored++;
      }

      // 重置 Provider 热更新
      getProviderHotReload().reset();
      restored++;

      getLogger().info("system", `Quick recovery completed: ${restored} items in ${Date.now() - startTime}ms`);

      return { success: true, level: "quick", checkpointsRestored: restored, errors, duration: Date.now() - startTime };
    } catch (err) {
      errors.push(err instanceof Error ? err.message : String(err));
      return { success: false, level: "quick", checkpointsRestored: restored, errors, duration: Date.now() - startTime };
    }
  }

  /**
   * 完整恢复: 恢复配置 + Provider + 备份数据
   */
  async fullRecover(): Promise<RecoveryResult2> {
    const startTime = Date.now();
    const errors: string[] = [];
    let restored = 0;

    try {
      // 先执行快速恢复
      const quickResult = await this.quickRecover();
      restored += quickResult.checkpointsRestored;
      errors.push(...quickResult.errors);

      // 恢复备份数据
      const checkpoint = this.getLatestCheckpoint();
      if (checkpoint?.state.backupBundle) {
        const backupJSON = JSON.stringify(checkpoint.state.backupBundle);
        const restoreResult = await getBackupManager().restoreFromJSON(backupJSON);
        if (restoreResult.success) {
          restored += restoreResult.restored.playlists + restoreResult.restored.likedSongs;
        }
        errors.push(...restoreResult.errors);
      }

      getLogger().info("system", `Full recovery completed: ${restored} items in ${Date.now() - startTime}ms`);

      return { success: errors.length === 0, level: "full", checkpointsRestored: restored, errors, duration: Date.now() - startTime };
    } catch (err) {
      errors.push(err instanceof Error ? err.message : String(err));
      return { success: false, level: "full", checkpointsRestored: restored, errors, duration: Date.now() - startTime };
    }
  }

  /**
   * 核选项: 完全重置所有配置 → 出厂状态
   */
  async nuclearReset(): Promise<RecoveryResult2> {
    const startTime = Date.now();
    const errors: string[] = [];
    let restored = 0;

    try {
      // 1. 重置 RuntimeConfig
      getRuntimeConfig().resetToDefaults();
      restored++;

      // 2. 重置 Provider 热更新
      getProviderHotReload().reset();
      restored++;

      // 3. 清除所有 localStorage (保留 auth)
      const authKeys = ["supabase.auth.token", "sb-"];
      const keysToRemove: string[] = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && !authKeys.some((ak) => key.startsWith(ak))) {
          keysToRemove.push(key);
        }
      }
      keysToRemove.forEach((k) => localStorage.removeItem(k));
      restored++;

      // 4. 清除 IndexedDB
      try {
        const dbs = await indexedDB.databases();
        for (const db of dbs) {
          if (db.name) {
            await new Promise<void>((resolve, reject) => {
              const req = indexedDB.deleteDatabase(db.name!);
              req.onsuccess = () => resolve();
              req.onerror = () => reject(req.error);
            });
          }
        }
        restored++;
      } catch (err) {
        errors.push(`IndexedDB: ${err instanceof Error ? err.message : String(err)}`);
      }

      // 5. 清除恢复检查点
      this.checkpoints = [];
      localStorage.removeItem(CHECKPOINT_KEY);
      restored++;

      // 6. 重新加载页面
      setTimeout(() => {
        window.location.reload();
      }, 500);

      getLogger().info("system", `Nuclear reset completed: ${restored} items in ${Date.now() - startTime}ms`);

      return { success: true, level: "nuclear", checkpointsRestored: restored, errors, duration: Date.now() - startTime };
    } catch (err) {
      errors.push(err instanceof Error ? err.message : String(err));
      return { success: false, level: "nuclear", checkpointsRestored: restored, errors, duration: Date.now() - startTime };
    }
  }

  // ==================== Private ====================

  private captureSettings(): Record<string, unknown> {
    const settings: Record<string, unknown> = {};
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith("music_settings_")) {
        try {
          settings[key] = JSON.parse(localStorage.getItem(key)!);
        } catch {
          settings[key] = localStorage.getItem(key);
        }
      }
    }
    return settings;
  }

  private async getBackupBundle(_manifestId: string): Promise<BackupBundle | null> {
    // Try to reconstruct from current state
    return null;
  }

  private loadCheckpoints(): void {
    try {
      const raw = localStorage.getItem(CHECKPOINT_KEY);
      if (raw) this.checkpoints = JSON.parse(raw) as RecoveryCheckpoint[];
    } catch {
      this.checkpoints = [];
    }
  }

  private persistCheckpoints(): void {
    try {
      localStorage.setItem(CHECKPOINT_KEY, JSON.stringify(this.checkpoints));
    } catch {
      // silently fail
    }
  }
}

export function getDisasterRecovery(): DisasterRecovery {
  return DisasterRecovery.getInstance();
}

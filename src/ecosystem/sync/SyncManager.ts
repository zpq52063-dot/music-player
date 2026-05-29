/**
 * Phase 12 — SyncManager (预留)
 *
 * 本地与远程数据同步管理器。
 * 未来支持: 本地播放列表 → 远程同步 / 远程歌单 → 本地缓存。
 * 当前阶段: 架构预留。
 */

import type { LocalPlaylistData } from "@/types/phase12";

export type SyncDirection = "local_to_remote" | "remote_to_local" | "bidirectional";

export interface SyncTask {
  id: string;
  direction: SyncDirection;
  entityType: "playlist" | "favorite" | "history" | "setting";
  status: "pending" | "syncing" | "complete" | "conflict" | "error";
  createdAt: number;
  completedAt?: number;
  conflictResolution?: "local_wins" | "remote_wins" | "manual";
}

export class SyncManager {
  private static instance: SyncManager;
  private tasks: Map<string, SyncTask> = new Map();

  static getInstance(): SyncManager {
    if (!SyncManager.instance) {
      SyncManager.instance = new SyncManager();
    }
    return SyncManager.instance;
  }

  /**
   * 同步本地播放列表到远程 (预留)
   */
  async syncPlaylistToRemote(_playlist: LocalPlaylistData): Promise<SyncTask> {
    const task: SyncTask = {
      id: `sync-${Date.now()}`,
      direction: "local_to_remote",
      entityType: "playlist",
      status: "pending",
      createdAt: Date.now(),
    };
    this.tasks.set(task.id, task);
    return task;
  }

  /**
   * 从远程拉取数据到本地 (预留)
   */
  async syncFromRemote(_entityType: SyncTask["entityType"]): Promise<SyncTask> {
    const task: SyncTask = {
      id: `sync-${Date.now()}`,
      direction: "remote_to_local",
      entityType: _entityType,
      status: "pending",
      createdAt: Date.now(),
    };
    this.tasks.set(task.id, task);
    return task;
  }

  getPendingTasks(): SyncTask[] {
    return Array.from(this.tasks.values()).filter((t) => t.status === "pending" || t.status === "syncing");
  }

  getTaskHistory(): SyncTask[] {
    return Array.from(this.tasks.values()).sort((a, b) => b.createdAt - a.createdAt);
  }

  clearHistory(): void {
    this.tasks.clear();
  }
}

export function getSyncManager(): SyncManager {
  return SyncManager.getInstance();
}

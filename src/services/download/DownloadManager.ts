/**
 * Phase 8 — 下载管理器 (预留架构)
 *
 * 当前阶段仅实现基础架构，不进行大量离线下载。
 * 使用:
 *   1. 单个音频文件下载 (< 30MB)
 *   2. IndexedDB 存储 (分块)
 *   3. 队列管理 (MAX_CONCURRENT = 1)
 *
 * TODO (Phase 9+): 实现完整的批量下载和离线模式
 */

import type { DownloadTask, DownloadProgress, DownloadStatus } from "@/types/download";

// MAX_CONCURRENT = 1, CHUNK_SIZE = 1MB (reserved for Phase 9+ implementation)
export class DownloadManager {
  private static instance: DownloadManager | null = null;

  private active: DownloadTask | null = null;
  private pending: DownloadTask[] = [];
  private completed: DownloadTask[] = [];
  private failed: DownloadTask[] = [];
  private progressCallbacks: Map<string, (p: DownloadProgress) => void> = new Map();

  // eslint-disable-next-line @typescript-eslint/no-empty-function
  private constructor() {}

  static getInstance(): DownloadManager {
    if (!DownloadManager.instance) {
      DownloadManager.instance = new DownloadManager();
    }
    return DownloadManager.instance;
  }

  // ==================== Public API (stubs) ====================

  enqueue(task: Omit<DownloadTask, "id" | "status" | "bytesDownloaded" | "createdAt">): string {
    const id = `dl_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    const fullTask: DownloadTask = {
      ...task,
      id,
      status: "pending",
      bytesDownloaded: 0,
      totalBytes: -1,
      createdAt: new Date().toISOString(),
    };

    this.pending.push(fullTask);
    this.processNext();

    return id;
  }

  pause(taskId: string): void {
    const task = this.findTask(taskId);
    if (task && task.status === "downloading") {
      task.status = "paused";
      this.active = null;
      this.processNext();
    }
  }

  resume(taskId: string): void {
    const task = this.findTask(taskId);
    if (task && task.status === "paused") {
      task.status = "pending";
      this.processNext();
    }
  }

  cancel(taskId: string): void {
    this.pending = this.pending.filter((t) => t.id !== taskId);
    this.failed = this.failed.filter((t) => t.id !== taskId);
    if (this.active?.id === taskId) {
      this.active = null;
      this.processNext();
    }
  }

  clearCompleted(): void {
    this.completed = [];
  }

  retry(taskId: string): void {
    const idx = this.failed.findIndex((t) => t.id === taskId);
    if (idx !== -1) {
      const task = this.failed.splice(idx, 1)[0]!;
      task.status = "pending";
      task.error = undefined;
      this.pending.push(task);
      this.processNext();
    }
  }

  // ==================== Progress ====================

  onProgress(taskId: string, callback: (p: DownloadProgress) => void): () => void {
    this.progressCallbacks.set(taskId, callback);
    return () => {
      this.progressCallbacks.delete(taskId);
    };
  }

  // ==================== Status query ====================

  getStatus(taskId: string): DownloadStatus | null {
    const task = this.findTask(taskId);
    return task?.status ?? null;
  }

  getAllTasks(): { active: DownloadTask | null; pending: DownloadTask[]; completed: DownloadTask[]; failed: DownloadTask[] } {
    return {
      active: this.active,
      pending: [...this.pending],
      completed: [...this.completed],
      failed: [...this.failed],
    };
  }

  getQueueLength(): number {
    return this.pending.length + (this.active ? 1 : 0);
  }

  // ==================== Internal ====================

  private findTask(taskId: string): DownloadTask | undefined {
    if (this.active?.id === taskId) return this.active;
    return this.pending.find((t) => t.id === taskId) ??
      this.completed.find((t) => t.id === taskId) ??
      this.failed.find((t) => t.id === taskId);
  }

  private async processNext(): Promise<void> {
    if (this.active || this.pending.length === 0) return;

    const task = this.pending.shift()!;
    this.active = task;
    task.status = "downloading";

    // Stub: actual download implementation deferred to Phase 9+
    // Will use fetch() with ReadableStream + IndexedDB chunked storage
    console.log(`[DownloadManager] Download stub: ${task.title}`);
  }

  // ==================== Destroy ====================

  destroy(): void {
    // Abort active download if any
    this.active = null;
    this.pending = [];
    this.completed = [];
    this.failed = [];
    this.progressCallbacks.clear();
    DownloadManager.instance = null;
  }
}

export function getDownloadManager(): DownloadManager {
  return DownloadManager.getInstance();
}

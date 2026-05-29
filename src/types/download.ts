/**
 * Phase 8 — 下载系统类型 (预留架构)
 *
 * 当前阶段仅预留架构，不实现大量离线下载。
 */

export type DownloadStatus = "pending" | "downloading" | "paused" | "completed" | "failed";

export interface DownloadTask {
  id: string;
  songId: string;
  title: string;
  artist: string;
  coverUrl?: string;
  url: string;
  bytesDownloaded: number;
  totalBytes: number;
  status: DownloadStatus;
  error?: string;
  createdAt: string;
  completedAt?: string;
  priority: number;
}

export interface DownloadQueue {
  active: DownloadTask | null;
  pending: DownloadTask[];
  completed: DownloadTask[];
  failed: DownloadTask[];
}

export interface DownloadProgress {
  taskId: string;
  bytesDownloaded: number;
  totalBytes: number;
  percentage: number;
}

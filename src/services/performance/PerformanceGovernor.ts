/**
 * Phase 14 — 性能治理服务
 *
 * 管理:
 * - Render audit (追踪组件重渲染)
 * - Animation batching (requestAnimationFrame 批处理)
 * - Memory cleanup (清理过期 Blob URL、detached DOM)
 * - Audio cleanup (释放空闲音频资源)
 * - Cache size control (IndexedDB 容量管理)
 */

import { offlineService } from "@/services/offline";

// ==================== Render Audit ====================

interface RenderRecord {
  component: string;
  count: number;
  lastRender: number;
}

const renderAudit = new Map<string, RenderRecord>();
let auditEnabled = false;

export function enableRenderAudit(): void {
  auditEnabled = true;
}

export function disableRenderAudit(): void {
  auditEnabled = false;
  renderAudit.clear();
}

export function trackRender(component: string): void {
  if (!auditEnabled) return;
  const existing = renderAudit.get(component);
  if (existing) {
    existing.count++;
    existing.lastRender = Date.now();
  } else {
    renderAudit.set(component, { component, count: 1, lastRender: Date.now() });
  }
}

/** 返回可疑的过度渲染组件（> 20 次渲染） */
export function getRenderReport(): RenderRecord[] {
  return Array.from(renderAudit.values())
    .filter((r) => r.count > 20)
    .sort((a, b) => b.count - a.count);
}

// ==================== Animation Batching ====================

type AnimCallback = () => void;
const batchQueue = new Set<AnimCallback>();
let batchScheduled = false;

/**
 * 将动画回调批处理到同一个 RAF 帧中执行
 */
export function batchAnimation(callback: AnimCallback): void {
  batchQueue.add(callback);

  if (!batchScheduled) {
    batchScheduled = true;
    requestAnimationFrame(() => {
      batchScheduled = false;
      const callbacks = Array.from(batchQueue);
      batchQueue.clear();
      for (const cb of callbacks) {
        try {
          cb();
        } catch {
          // skip broken callbacks
        }
      }
    });
  }
}

// ==================== Memory Cleanup ====================

const blobUrls = new Set<string>();

/** 追踪 Blob URL，确保可以释放 */
export function trackBlobUrl(url: string): string {
  blobUrls.add(url);
  return url;
}

/** 释放所有追踪的 Blob URL */
export function revokeAllBlobUrls(): void {
  for (const url of blobUrls) {
    try {
      URL.revokeObjectURL(url);
    } catch {
      // already revoked
    }
  }
  blobUrls.clear();
}

/** 释放单个 Blob URL */
export function revokeBlobUrl(url: string): void {
  if (blobUrls.has(url)) {
    try {
      URL.revokeObjectURL(url);
    } catch {
      // already revoked
    }
    blobUrls.delete(url);
  }
}

// ==================== Audio Cleanup ====================

const detachedAudioElements = new Set<HTMLAudioElement>();

export function trackAudioElement(el: HTMLAudioElement): void {
  detachedAudioElements.add(el);
}

/** 释放所有游离的 audio 元素 */
export function cleanupDetachedAudio(): number {
  let cleaned = 0;
  for (const el of detachedAudioElements) {
    try {
      el.pause();
      el.removeAttribute("src");
      el.load();
      el.remove();
      cleaned++;
    } catch {
      // already removed
    }
  }
  detachedAudioElements.clear();
  return cleaned;
}

// ==================== Cache Size Control ====================

let cacheCheckTimer: ReturnType<typeof setTimeout> | null = null;

/**
 * 定期检查并清理缓存
 */
export function startCacheSizeMonitor(intervalMs = 5 * 60 * 1000): void {
  stopCacheSizeMonitor();

  const check = async () => {
    try {
      const cleaned = await offlineService.enforceCacheLimit();
      if (cleaned > 0) {
        console.log(`[PerformanceGovernor] Cleaned ${cleaned} stale cache entries`);
      }
    } catch {
      // best effort
    }
    cacheCheckTimer = setTimeout(check, intervalMs);
  };

  cacheCheckTimer = setTimeout(check, intervalMs);
}

export function stopCacheSizeMonitor(): void {
  if (cacheCheckTimer) {
    clearTimeout(cacheCheckTimer);
    cacheCheckTimer = null;
  }
}

// ==================== Full Cleanup ====================

/**
 * 执行完整清理：Blob URL → 游离 Audio → 缓存 → GC
 */
export async function performFullCleanup(): Promise<{
  blobUrls: number;
  audioElements: number;
  cacheEntries: number;
}> {
  const blobCount = blobUrls.size;
  revokeAllBlobUrls();

  const audioCount = cleanupDetachedAudio();

  let cacheCount = 0;
  try {
    cacheCount = await offlineService.enforceCacheLimit();
  } catch {
    // best effort
  }

  return {
    blobUrls: blobCount,
    audioElements: audioCount,
    cacheEntries: cacheCount,
  };
}

// ==================== Performance Observer ====================

/**
 * 监控长任务（> 50ms），辅助性能调试
 */
export function observeLongTasks(callback: (duration: number) => void): () => void {
  if (typeof PerformanceObserver === "undefined") return () => {};

  try {
    const observer = new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        if (entry.duration > 50) {
          callback(entry.duration);
        }
      }
    });

    observer.observe({ type: "longtask", buffered: true });
    return () => observer.disconnect();
  } catch {
    return () => {};
  }
}

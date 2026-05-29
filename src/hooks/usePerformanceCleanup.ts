/**
 * Phase 14 — 性能清理 Hook（增强版）
 *
 * 自动管理:
 * - 内存清理 (Blob URL、游离 Audio 元素)
 * - IndexedDB 缓存大小控制
 * - 旧歌词/元数据清理 (7天过期)
 * - 播放历史裁剪 (> 500 条)
 * - 长任务监控
 */

"use client";

import { useEffect, useRef } from "react";
import {
  performFullCleanup,
  startCacheSizeMonitor,
  stopCacheSizeMonitor,
  observeLongTasks,
} from "@/services/performance/PerformanceGovernor";

const CLEANUP_INTERVAL = 10 * 60 * 1000; // 10 minutes
const LYRIC_CACHE_MAX_AGE = 7 * 24 * 60 * 60 * 1000; // 7 days
const METADATA_MAX_AGE = 7 * 24 * 60 * 60 * 1000;

export function usePerformanceCleanup() {
  const cleanupTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    // 启动缓存大小监控
    startCacheSizeMonitor();

    // 定期完整清理
    cleanupTimerRef.current = setInterval(() => {
      performLegacyCleanup();
      performFullCleanup().catch(() => {
        // best effort
      });
    }, CLEANUP_INTERVAL);

    // 长任务监控（开发模式）
    if (process.env.NODE_ENV === "development") {
      const disconnect = observeLongTasks((duration) => {
        console.warn(`[Performance] Long task detected: ${Math.round(duration)}ms`);
      });
      return () => {
        disconnect();
        stopCacheSizeMonitor();
        if (cleanupTimerRef.current) clearInterval(cleanupTimerRef.current);
      };
    }

    return () => {
      stopCacheSizeMonitor();
      if (cleanupTimerRef.current) clearInterval(cleanupTimerRef.current);
    };
  }, []);
}

// ==================== Legacy cleanup (IndexedDB) ====================

async function performLegacyCleanup(): Promise<void> {
  try {
    const db = await openCacheDB();
    if (!db) return;

    // Clean old lyric cache entries
    try {
      const tx = db.transaction("lyric_cache", "readwrite");
      const store = tx.objectStore("lyric_cache");
      const cursor = store.openCursor();
      const cutoff = Date.now() - LYRIC_CACHE_MAX_AGE;

      await new Promise<void>((resolve) => {
        cursor.onsuccess = (event: Event) => {
          const c = (event.target as IDBRequest<IDBCursorWithValue>).result;
          if (c) {
            if (c.value.cachedAt < cutoff) {
              c.delete();
            }
            c.continue();
          } else {
            resolve();
          }
        };
        cursor.onerror = () => resolve();
      });
    } catch {
      // best effort
    }

    // Clean old play history (> 500 entries)
    try {
      const tx = db.transaction("play_history_local", "readwrite");
      const store = tx.objectStore("play_history_local");
      const count = await new Promise<number>((resolve, reject) => {
        const req = store.count();
        req.onsuccess = () => resolve(req.result);
        req.onerror = () => reject(req.error);
      });

      if (count > 500) {
        const excess = count - 500;
        await new Promise<void>((resolve) => {
          const delCursor = store.openCursor();
          let deleted = 0;
          delCursor.onsuccess = (event: Event) => {
            const c = (event.target as IDBRequest<IDBCursorWithValue>).result;
            if (c && deleted < excess) {
              c.delete();
              deleted++;
              c.continue();
            } else {
              resolve();
            }
          };
          delCursor.onerror = () => resolve();
        });
      }
    } catch {
      // best effort
    }

    // Clean old metadata
    try {
      const tx = db.transaction("song_metadata", "readwrite");
      const store = tx.objectStore("song_metadata");
      const cursor = store.openCursor();
      const cutoff = Date.now() - METADATA_MAX_AGE;

      await new Promise<void>((resolve) => {
        cursor.onsuccess = (event: Event) => {
          const c = (event.target as IDBRequest<IDBCursorWithValue>).result;
          if (c) {
            if (c.value.cachedAt < cutoff) {
              c.delete();
            }
            c.continue();
          } else {
            resolve();
          }
        };
        cursor.onerror = () => resolve();
      });
    } catch {
      // best effort
    }

    db.close();
  } catch {
    // Cleanup is best-effort
  }
}

function openCacheDB(): Promise<IDBDatabase | null> {
  return new Promise((resolve) => {
    const req = indexedDB.open("music-player-cache", 2);
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => resolve(null);
  });
}

export { METADATA_MAX_AGE as AUDIO_IDLE_TIMEOUT };

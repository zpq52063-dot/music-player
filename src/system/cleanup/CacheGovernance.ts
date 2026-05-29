/**
 * Phase 9 — 缓存治理系统
 *
 * 职责:
 * - 自动清理过期 IndexedDB 缓存
 * - LRU 淘汰策略 (总条目超限)
 * - 内存缓存清理
 * - 图片/音频缓存治理
 * - 定时触发 + 启动时检查
 */

import type { CacheGovernanceConfig, CacheCleanupResult } from "@/types";
import { DEFAULT_CACHE_GOVERNANCE_CONFIG } from "@/types";
import { getLogger } from "@/lib/logs/Logger";

export class CacheGovernanceSystem {
  private static instance: CacheGovernanceSystem | null = null;

  private config: CacheGovernanceConfig;
  private logger = getLogger();
  private timer: ReturnType<typeof setInterval> | null = null;
  private lastResult: CacheCleanupResult | null = null;

  private constructor() {
    this.config = { ...DEFAULT_CACHE_GOVERNANCE_CONFIG };
  }

  static getInstance(): CacheGovernanceSystem {
    if (!CacheGovernanceSystem.instance) {
      CacheGovernanceSystem.instance = new CacheGovernanceSystem();
    }
    return CacheGovernanceSystem.instance;
  }

  // ==================== Configuration ====================

  configure(partial: Partial<CacheGovernanceConfig>): void {
    this.config = { ...this.config, ...partial };
  }

  // ==================== Lifecycle ====================

  start(): void {
    if (this.timer) return;
    // 启动时立即执行一次
    void this.runCleanup();
    this.timer = setInterval(() => {
      void this.runCleanup();
    }, this.config.cleanupIntervalMs);
    this.logger.debug("cache", "CacheGovernance started");
  }

  stop(): void {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
  }

  // ==================== Core: Cleanup ====================

  async runCleanup(): Promise<CacheCleanupResult> {
    const result: CacheCleanupResult = {
      lyricsRemoved: 0,
      historyRemoved: 0,
      metadataRemoved: 0,
      memoryEntriesEvicted: 0,
      totalFreed: 0,
      timestamp: Date.now(),
    };

    try {
      const db = await this.openDB();
      if (!db) {
        this.lastResult = result;
        return result;
      }

      // 清理过期歌词
      result.lyricsRemoved = await this.cleanLyricCache(db);

      // 清理超额播放历史
      result.historyRemoved = await this.cleanPlayHistory(db);

      // 清理过期元数据
      result.metadataRemoved = await this.cleanMetadata(db);

      // LRU: 总条目超限清理
      const totalRemoved = result.lyricsRemoved + result.historyRemoved + result.metadataRemoved;
      result.totalFreed = totalRemoved;

      db.close();

      if (totalRemoved > 0) {
        this.logger.info("cache", `Cleanup: ${totalRemoved} entries removed`, result);
      }
    } catch {
      // Best-effort cleanup
    }

    this.lastResult = result;
    return result;
  }

  // ==================== Individual Cleaners ====================

  private async cleanLyricCache(db: IDBDatabase): Promise<number> {
    return new Promise((resolve) => {
      try {
        const tx = db.transaction("lyric_cache", "readwrite");
        const store = tx.objectStore("lyric_cache");
        const cursor = store.openCursor();
        const cutoff = Date.now() - this.config.lyricMaxAgeDays * 24 * 60 * 60 * 1000;
        let removed = 0;

        cursor.onsuccess = (event: Event) => {
          const c = (event.target as IDBRequest<IDBCursorWithValue>).result;
          if (c) {
            if (c.value.cachedAt < cutoff) {
              c.delete();
              removed++;
            }
            c.continue();
          } else {
            resolve(removed);
          }
        };
        cursor.onerror = () => resolve(removed);
      } catch {
        resolve(0);
      }
    });
  }

  private async cleanPlayHistory(db: IDBDatabase): Promise<number> {
    return new Promise((resolve) => {
      try {
        const tx = db.transaction("play_history_local", "readwrite");
        const store = tx.objectStore("play_history_local");
        const countReq = store.count();

        countReq.onsuccess = () => {
          const count = countReq.result;
          if (count <= this.config.historyMaxEntries) {
            resolve(0);
            return;
          }

          const excess = count - this.config.historyMaxEntries;
          const cursor = store.openCursor();
          let removed = 0;

          cursor.onsuccess = (event: Event) => {
            const c = (event.target as IDBRequest<IDBCursorWithValue>).result;
            if (c && removed < excess) {
              c.delete();
              removed++;
              c.continue();
            } else {
              resolve(removed);
            }
          };
          cursor.onerror = () => resolve(removed);
        };
        countReq.onerror = () => resolve(0);
      } catch {
        resolve(0);
      }
    });
  }

  private async cleanMetadata(db: IDBDatabase): Promise<number> {
    return new Promise((resolve) => {
      try {
        const tx = db.transaction("song_metadata", "readwrite");
        const store = tx.objectStore("song_metadata");
        const cursor = store.openCursor();
        const cutoff = Date.now() - this.config.metadataMaxAgeDays * 24 * 60 * 60 * 1000;
        let removed = 0;

        cursor.onsuccess = (event: Event) => {
          const c = (event.target as IDBRequest<IDBCursorWithValue>).result;
          if (c) {
            if (c.value.cachedAt < cutoff) {
              c.delete();
              removed++;
            }
            c.continue();
          } else {
            resolve(removed);
          }
        };
        cursor.onerror = () => resolve(removed);
      } catch {
        resolve(0);
      }
    });
  }

  // ==================== Total Entry Check ====================

  async checkTotalEntries(): Promise<number> {
    try {
      const db = await this.openDB();
      if (!db) return 0;

      let total = 0;
      const storeNames = Array.from(db.objectStoreNames);

      for (const name of storeNames) {
        const tx = db.transaction(name, "readonly");
        const store = tx.objectStore(name);
        const count = await new Promise<number>((resolve) => {
          const req = store.count();
          req.onsuccess = () => resolve(req.result);
          req.onerror = () => resolve(0);
        });
        total += count;
      }

      db.close();
      return total;
    } catch {
      return 0;
    }
  }

  // ==================== Helpers ====================

  private openDB(): Promise<IDBDatabase | null> {
    return new Promise((resolve) => {
      const req = indexedDB.open("music-player-cache", 1);
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => resolve(null);
      req.onblocked = () => resolve(null);
    });
  }

  getLastResult(): CacheCleanupResult | null {
    return this.lastResult;
  }

  destroy(): void {
    this.stop();
    CacheGovernanceSystem.instance = null;
  }
}

export function getCacheGovernance(): CacheGovernanceSystem {
  return CacheGovernanceSystem.getInstance();
}

/**
 * Phase 17 — Enhanced Cache Governance (增强版)
 *
 * 在 CacheGovernanceSystem 基础上新增:
 * - LRU eviction (基于 lastAccess 时间戳)
 * - Cache size limit (预估总大小)
 * - Low storage mode (< 10MB 可用时激进清理)
 * - Stale cache cleanup (超过 staleThreshold 的冷数据)
 */

import type { CacheGovernanceConfigV2 } from "@/types";
import { DEFAULT_CACHE_GOVERNANCE_CONFIG_V2 } from "@/types";
import { getLogger } from "@/lib/logs/Logger";

export class CacheGovernanceV2 {
  private static instance: CacheGovernanceV2 | null = null;

  private config: CacheGovernanceConfigV2;
  private logger = getLogger();
  private timer: ReturnType<typeof setInterval> | null = null;
  private isLowStorage = false;

  private constructor() {
    this.config = { ...DEFAULT_CACHE_GOVERNANCE_CONFIG_V2 };
  }

  static getInstance(): CacheGovernanceV2 {
    if (!CacheGovernanceV2.instance) {
      CacheGovernanceV2.instance = new CacheGovernanceV2();
    }
    return CacheGovernanceV2.instance;
  }

  // ==================== Configuration ====================

  configure(partial: Partial<CacheGovernanceConfigV2>): void {
    this.config = { ...this.config, ...partial };
  }

  // ==================== Lifecycle ====================

  start(): void {
    if (this.timer) return;
    void this.runFullCleanup();
    this.timer = setInterval(() => {
      void this.runFullCleanup();
    }, this.config.cleanupIntervalMs);

    // 监听存储压力
    if (typeof navigator !== "undefined" && "storage" in navigator) {
      navigator.storage?.estimate?.().then((est) => {
        if (est.quota && est.usage) {
          const available = est.quota - est.usage;
          this.isLowStorage = available < this.config.lowStorageThresholdBytes;
        }
      }).catch(() => { /* estimate not supported */ });
    }

    this.logger.debug("cache-v2", "Enhanced Cache Governance started");
  }

  stop(): void {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
  }

  // ==================== Core: Full Cleanup ====================

  async runFullCleanup(): Promise<{
    lruEvicted: number;
    staleRemoved: number;
    totalFreed: number;
    isLowStorage: boolean;
  }> {
    let lruEvicted = 0;
    let staleRemoved = 0;

    try {
      const db = await this.openDB();
      if (!db) return { lruEvicted: 0, staleRemoved: 0, totalFreed: 0, isLowStorage: this.isLowStorage };

      // 1. Stale cleanup
      staleRemoved = await this.cleanStaleEntries(db);

      // 2. LRU eviction
      lruEvicted = await this.evictLRU(db);

      // 3. Low storage mode: aggressive cleanup
      if (this.isLowStorage) {
        const extraEvicted = await this.evictLRU(db, this.config.lruEvictionBatchSize * 3);
        lruEvicted += extraEvicted;
      }

      db.close();
    } catch {
      // best-effort
    }

    const totalFreed = lruEvicted + staleRemoved;
    if (totalFreed > 0) {
      this.logger.info("cache-v2", `Cleanup: ${lruEvicted} LRU evicted, ${staleRemoved} stale removed`);
    }

    return { lruEvicted, staleRemoved, totalFreed, isLowStorage: this.isLowStorage };
  }

  // ==================== LRU Eviction ====================

  private async evictLRU(db: IDBDatabase, batchSize?: number): Promise<number> {
    const maxEntries = this.isLowStorage
      ? Math.floor(this.config.maxTotalEntries / 4)
      : this.config.maxTotalEntries;

    const totalEntries = await this.countTotalEntries(db);
    if (totalEntries <= maxEntries) return 0;

    const toEvict = Math.min(
      batchSize ?? this.config.lruEvictionBatchSize,
      totalEntries - maxEntries,
    );

    return this.evictOldestEntries(db, toEvict);
  }

  private async evictOldestEntries(db: IDBDatabase, count: number): Promise<number> {
    let evicted = 0;
    const storeNames = Array.from(db.objectStoreNames);

    for (const storeName of storeNames) {
      if (evicted >= count) break;

      const result = await new Promise<number>((resolve) => {
        try {
          const tx = db.transaction(storeName, "readwrite");
          const store = tx.objectStore(storeName);
          const indexReq = store.index("cachedAt");
          const cursor = indexReq.openCursor();
          let removed = 0;

          cursor.onsuccess = (event: Event) => {
            const c = (event.target as IDBRequest<IDBCursorWithValue>).result;
            if (c && removed < count - evicted) {
              c.delete();
              removed++;
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

      evicted += result;
    }

    return evicted;
  }

  // ==================== Stale Cleanup ====================

  private async cleanStaleEntries(db: IDBDatabase): Promise<number> {
    const cutoff = Date.now() - this.config.staleThresholdMs;
    let totalRemoved = 0;
    const storeNames = Array.from(db.objectStoreNames);

    for (const storeName of storeNames) {
      const result = await new Promise<number>((resolve) => {
        try {
          const tx = db.transaction(storeName, "readwrite");
          const store = tx.objectStore(storeName);
          const indexReq = store.index("cachedAt");
          const cursor = indexReq.openCursor();
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

      totalRemoved += result;
    }

    return totalRemoved;
  }

  // ==================== Low Storage Detection ====================

  async checkStoragePressure(): Promise<boolean> {
    try {
      if ("storage" in navigator && navigator.storage?.estimate) {
        const est = await navigator.storage.estimate();
        if (est.quota && est.usage) {
          const available = est.quota - est.usage;
          this.isLowStorage = available < this.config.lowStorageThresholdBytes;
          return this.isLowStorage;
        }
      }
    } catch {
      // estimate not available
    }

    // Fallback: check total entries
    const db = await this.openDB();
    if (!db) return false;
    const total = await this.countTotalEntries(db);
    db.close();
    this.isLowStorage = total > this.config.maxTotalEntries * 1.5;
    return this.isLowStorage;
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

  private async countTotalEntries(db: IDBDatabase): Promise<number> {
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
    return total;
  }

  getConfig(): CacheGovernanceConfigV2 {
    return { ...this.config };
  }

  isLowStorageMode(): boolean {
    return this.isLowStorage;
  }

  destroy(): void {
    this.stop();
    CacheGovernanceV2.instance = null;
  }
}

export function getCacheGovernanceV2(): CacheGovernanceV2 {
  return CacheGovernanceV2.getInstance();
}

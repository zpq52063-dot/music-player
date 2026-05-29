/**
 * Phase 10 — BackupManager
 *
 * 职责:
 * - 用户数据备份 (歌单/喜欢歌曲/配置/缓存索引)
 * - JSON export (完整可移植文件)
 * - 本地导出 (IndexedDB snapshot)
 * - 备份校验 (checksum)
 * - 备份恢复
 *
 * 模式: 单例
 */

import type {
  BackupScope,
  BackupManifest,
  BackupBundle,
  BackupData,
  BackupResult,
  RestoreResult,
  PlaylistBackup,
  CacheIndexEntry,
} from "@/types";
import { getLogger } from "@/lib/logs/Logger";

const APP_VERSION = "0.1.0";

let instance: BackupManager | null = null;

export class BackupManager {
  // ==================== Singleton ====================

  static getInstance(): BackupManager {
    if (!instance) instance = new BackupManager();
    return instance;
  }

  // ==================== Export ====================

  /**
   * 创建完整备份 (JSON格式)
   */
  async createBackup(scope: BackupScope = "full"): Promise<BackupResult> {
    const startTime = Date.now();
    const logger = getLogger();

    try {
      const data: BackupData = {};

      // 收集备份数据
      if (scope === "full" || scope === "playlists") {
        data.playlists = await this.exportPlaylists();
      }

      if (scope === "full" || scope === "liked") {
        data.likedSongIds = await this.exportLikedSongs();
      }

      if (scope === "full" || scope === "config") {
        data.config = this.exportConfig();
      }

      if (scope === "full" || scope === "cache_index") {
        data.cacheIndex = await this.exportCacheIndex();
      }

      data.metadata = {
        appVersion: APP_VERSION,
        exportDate: Date.now(),
        platform: typeof navigator !== "undefined" ? navigator.platform ?? "unknown" : "unknown",
        userAgent: typeof navigator !== "undefined" ? navigator.userAgent : "unknown",
      };

      // 计算条数
      const itemCounts = {
        playlists: data.playlists?.length ?? 0,
        likedSongs: data.likedSongIds?.length ?? 0,
        configKeys: data.config ? Object.keys(data.config).length : 0,
        cacheEntries: data.cacheIndex?.length ?? 0,
      };

      const manifest: BackupManifest = {
        id: this.generateBackupId(),
        scope,
        version: 1,
        createdAt: Date.now(),
        appVersion: APP_VERSION,
        itemCounts,
        checksum: "",
      };

      const bundle: BackupBundle = { manifest, data };
      manifest.checksum = await this.computeChecksum(bundle);

      const json = JSON.stringify(bundle, null, 2);
      const jsonSize = new Blob([json]).size;

      logger.info("system", `Backup created: ${scope} (${(jsonSize / 1024).toFixed(1)}KB, ${(Date.now() - startTime)}ms)`);

      return { success: true, manifest, jsonSize };
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      logger.error("system", `Backup failed: ${message}`);
      return { success: false, manifest: null, jsonSize: 0, error: message };
    }
  }

  /**
   * 导出完整备份为 JSON 字符串
   */
  async exportJSON(scope: BackupScope = "full"): Promise<string | null> {
    const result = await this.createBackup(scope);
    if (!result.success) return null;

    // 重新构建 bundle 用于导出
    const data: BackupData = {};
    if (scope === "full" || scope === "playlists") data.playlists = await this.exportPlaylists();
    if (scope === "full" || scope === "liked") data.likedSongIds = await this.exportLikedSongs();
    if (scope === "full" || scope === "config") data.config = this.exportConfig();
    if (scope === "full" || scope === "cache_index") data.cacheIndex = await this.exportCacheIndex();

    const bundle: BackupBundle = {
      manifest: result.manifest!,
      data,
    };

    return JSON.stringify(bundle, null, 2);
  }

  /**
   * 下载备份文件
   */
  downloadBackup(scope: BackupScope = "full"): void {
    this.exportJSON(scope).then((json) => {
      if (!json) return;

      const blob = new Blob([json], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `music-player-backup-${scope}-${new Date().toISOString().slice(0, 10)}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      getLogger().info("system", `Backup downloaded: ${scope}`);
    });
  }

  // ==================== Import / Restore ====================

  /**
   * 从 JSON 字符串恢复备份
   */
  async restoreFromJSON(json: string): Promise<RestoreResult> {
    const errors: string[] = [];
    const restored = { playlists: 0, likedSongs: 0, config: 0 };

    try {
      const bundle: BackupBundle = JSON.parse(json);

      if (!bundle.manifest || !bundle.data) {
        return { success: false, restored, errors: ["Invalid backup format"] };
      }

      // 校验 checksum
      const expectedChecksum = bundle.manifest.checksum;
      if (expectedChecksum) {
        const actualChecksum = await this.computeChecksum(bundle);
        if (expectedChecksum !== actualChecksum) {
          errors.push("Checksum mismatch — data may be corrupted");
        }
      }

      const data = bundle.data;

      // 恢复歌单
      if (data.playlists) {
        try {
          restored.playlists = await this.importPlaylists(data.playlists);
        } catch (err) {
          errors.push(`Playlists: ${err instanceof Error ? err.message : String(err)}`);
        }
      }

      // 恢复喜欢歌曲
      if (data.likedSongIds) {
        try {
          restored.likedSongs = await this.importLikedSongs(data.likedSongIds);
        } catch (err) {
          errors.push(`Liked songs: ${err instanceof Error ? err.message : String(err)}`);
        }
      }

      // 恢复配置
      if (data.config) {
        try {
          restored.config = this.importConfig(data.config);
        } catch (err) {
          errors.push(`Config: ${err instanceof Error ? err.message : String(err)}`);
        }
      }

      getLogger().info(
        "system",
        `Restored: ${restored.playlists}P/${restored.likedSongs}L/${restored.config}C (${errors.length} errors)`,
      );

      return {
        success: errors.length === 0 || restored.playlists > 0 || restored.likedSongs > 0,
        restored,
        errors,
      };
    } catch (err) {
      return {
        success: false,
        restored,
        errors: [`Parse error: ${err instanceof Error ? err.message : String(err)}`],
      };
    }
  }

  /**
   * 从文件恢复 (用户选择文件)
   */
  async restoreFromFile(file: File): Promise<RestoreResult> {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = async () => {
        const result = await this.restoreFromJSON(reader.result as string);
        resolve(result);
      };
      reader.onerror = () => {
        resolve({ success: false, restored: { playlists: 0, likedSongs: 0, config: 0 }, errors: ["File read failed"] });
      };
      reader.readAsText(file);
    });
  }

  // ==================== IndexedDB Snapshot ====================

  /**
   * 导出 IndexedDB 完整快照
   */
  async exportIndexedDBSnapshot(): Promise<Record<string, unknown[]> | null> {
    try {
      const snapshot: Record<string, unknown[]> = {};
      const dbs = await indexedDB.databases();

      for (const dbInfo of dbs) {
        if (!dbInfo.name) continue;
        const db = await new Promise<IDBDatabase>((resolve, reject) => {
          const req = indexedDB.open(dbInfo.name!, dbInfo.version);
          req.onsuccess = () => resolve(req.result);
          req.onerror = () => reject(req.error);
          req.onblocked = () => reject(new Error("blocked"));
        });

        const storeNames = Array.from(db.objectStoreNames);
        for (const storeName of storeNames) {
          const records: unknown[] = [];
          const tx = db.transaction(storeName, "readonly");
          const store = tx.objectStore(storeName);
          const cursorReq = store.openCursor();

          await new Promise<void>((resolveCursor) => {
            cursorReq.onsuccess = () => {
              const cursor = cursorReq.result;
              if (cursor) {
                records.push(cursor.value);
                cursor.continue();
              } else {
                resolveCursor();
              }
            };
            cursorReq.onerror = () => resolveCursor();
          });

          snapshot[`${dbInfo.name}/${storeName}`] = records;
        }

        db.close();
      }

      return snapshot;
    } catch {
      return null;
    }
  }

  // ==================== Private: Export Helpers ====================

  private async exportPlaylists(): Promise<PlaylistBackup[]> {
    try {
      // 从 IndexedDB 或 localStorage 读取歌单数据
      const playlists: PlaylistBackup[] = [];

      // 尝试从 IndexedDB 读取
      const snapshot = await this.exportIndexedDBSnapshot();
      if (snapshot) {
        const playlistKeys = Object.keys(snapshot).filter((k) =>
          k.includes("playlist") || k.includes("playlists"),
        );
        for (const key of playlistKeys) {
          const records = snapshot[key]!;
          for (const record of records) {
            const r = record as Record<string, unknown>;
            playlists.push({
              id: String(r.id ?? ""),
              name: String(r.name ?? ""),
              description: String(r.description ?? ""),
              songIds: Array.isArray(r.songIds) ? r.songIds.map(String) : [],
              createdAt: Number(r.createdAt ?? r.created_at ?? Date.now()),
            });
          }
        }
      }

      return playlists;
    } catch {
      return [];
    }
  }

  private async exportLikedSongs(): Promise<string[]> {
    try {
      const raw = localStorage.getItem("music_liked_songs");
      if (raw) return JSON.parse(raw) as string[];
    } catch {
      // silently fail
    }
    return [];
  }

  private exportConfig(): Record<string, unknown> {
    const config: Record<string, unknown> = {};
    const configPrefixes = ["music_settings_", "music_runtime_config", "music_recovery_state"];

    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && configPrefixes.some((prefix) => key.startsWith(prefix))) {
        try {
          const val = localStorage.getItem(key);
          if (val) config[key] = JSON.parse(val);
        } catch {
          config[key!] = localStorage.getItem(key);
        }
      }
    }

    return config;
  }

  private async exportCacheIndex(): Promise<CacheIndexEntry[]> {
    try {
      const entries: CacheIndexEntry[] = [];
      const dbs = await indexedDB.databases();

      for (const dbInfo of dbs) {
        if (!dbInfo.name) continue;
        const db = await new Promise<IDBDatabase>((resolve, reject) => {
          const req = indexedDB.open(dbInfo.name!, dbInfo.version);
          req.onsuccess = () => resolve(req.result);
          req.onerror = () => reject(req.error);
        });

        const storeNames = Array.from(db.objectStoreNames);
        for (const storeName of storeNames) {
          const tx = db.transaction(storeName, "readonly");
          const store = tx.objectStore(storeName);

          // 获取所有主键
          const keysReq = store.getAllKeys();
          const keys = await new Promise<IDBValidKey[]>((resolve) => {
            keysReq.onsuccess = () => resolve(keysReq.result);
            keysReq.onerror = () => resolve([]);
          });

          for (const key of keys) {
            entries.push({
              storeName: `${dbInfo.name}/${storeName}`,
              key: String(key),
              size: 0,
              cachedAt: Date.now(),
            });
          }
        }

        db.close();
      }

      return entries.slice(0, 500);
    } catch {
      return [];
    }
  }

  // ==================== Private: Import Helpers ====================

  private async importPlaylists(playlists: PlaylistBackup[]): Promise<number> {
    let count = 0;
    for (const pl of playlists) {
      try {
        const key = `music_playlist_${pl.id}`;
        localStorage.setItem(
          key,
          JSON.stringify({
            id: pl.id,
            name: pl.name,
            description: pl.description,
            songIds: pl.songIds,
            createdAt: pl.createdAt,
          }),
        );
        count++;
      } catch {
        // continue with next
      }
    }
    return count;
  }

  private async importLikedSongs(songIds: string[]): Promise<number> {
    try {
      const existing = JSON.parse(localStorage.getItem("music_liked_songs") ?? "[]") as string[];
      const merged = [...new Set([...existing, ...songIds])];
      localStorage.setItem("music_liked_songs", JSON.stringify(merged));
      return songIds.length;
    } catch {
      return 0;
    }
  }

  private importConfig(config: Record<string, unknown>): number {
    let count = 0;
    for (const [key, value] of Object.entries(config)) {
      try {
        localStorage.setItem(key, typeof value === "string" ? value : JSON.stringify(value));
        count++;
      } catch {
        // continue
      }
    }
    return count;
  }

  // ==================== Utilities ====================

  private generateBackupId(): string {
    const ts = Date.now().toString(36);
    const rand = Math.random().toString(36).slice(2, 8);
    return `backup_${ts}_${rand}`;
  }

  private async computeChecksum(bundle: BackupBundle): Promise<string> {
    // 简单哈希: 排除 checksum 字段后计算
    const payload = JSON.stringify({
      manifest: { ...bundle.manifest, checksum: "" },
      data: bundle.data,
    });

    // 使用 Web Crypto API (Subtle)
    if (typeof crypto !== "undefined" && crypto.subtle) {
      try {
        const encoder = new TextEncoder();
        const data = encoder.encode(payload);
        const hash = await crypto.subtle.digest("SHA-256", data);
        return Array.from(new Uint8Array(hash))
          .map((b) => b.toString(16).padStart(2, "0"))
          .join("")
          .slice(0, 16);
      } catch {
        // fallback to simple hash
      }
    }

    // Fallback: simple DJB2 hash
    let hash = 5381;
    for (let i = 0; i < payload.length; i++) {
      hash = ((hash << 5) + hash + payload.charCodeAt(i)) & 0xffffffff;
    }
    return hash.toString(16).padStart(8, "0");
  }
}

export function getBackupManager(): BackupManager {
  return BackupManager.getInstance();
}

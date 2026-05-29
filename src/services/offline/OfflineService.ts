/**
 * Phase 14 — 真离线服务
 *
 * 管理:
 * - IndexedDB 音频 Blob 缓存
 * - 封面图片 Blob 缓存
 * - 离线可播放歌曲追踪
 * - 缓存大小控制
 */

import { openDB, getItem, putItem, deleteItem, getAllItems, countItems } from "@/storage";
import type { Song } from "@/types";

const STORE_AUDIO = "audio_blobs";
const STORE_IMAGES = "image_blobs";
const STORE_OFFLINE = "offline_songs";
const MAX_CACHE_SIZE = 200 * 1024 * 1024; // 200MB

interface AudioBlobEntry {
  songId: string;
  blob: Blob;
  cachedAt: number;
  size: number;
}

interface ImageBlobEntry {
  url: string;
  blob: Blob;
  cachedAt: number;
}

interface OfflineSongEntry {
  songId: string;
  title: string;
  artist: string;
  coverUrl: string;
  size: number;
  cachedAt: number;
}

class OfflineService {
  private static instance: OfflineService | null = null;

  static getInstance(): OfflineService {
    if (!OfflineService.instance) {
      OfflineService.instance = new OfflineService();
    }
    return OfflineService.instance;
  }

  // ==================== Audio Blob Cache ====================

  async cacheAudioBlob(songId: string, blob: Blob): Promise<void> {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_AUDIO, "readwrite");
      const store = tx.objectStore(STORE_AUDIO);
      store.put({
        songId,
        blob,
        cachedAt: Date.now(),
        size: blob.size,
      });
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  }

  async getAudioBlob(songId: string): Promise<Blob | null> {
    const entry = await getItem<{ songId: string; blob: Blob; cachedAt: number; size: number }>(
      STORE_AUDIO,
      songId,
    );
    return entry?.blob ?? null;
  }

  async hasAudioBlob(songId: string): Promise<boolean> {
    const blob = await this.getAudioBlob(songId);
    return blob !== null;
  }

  async removeAudioBlob(songId: string): Promise<void> {
    await deleteItem(STORE_AUDIO, songId);
  }

  /** 下载音频到 IndexedDB */
  async downloadAndCacheAudio(song: Song): Promise<boolean> {
    try {
      const alreadyCached = await this.hasAudioBlob(song.id);
      if (alreadyCached) return true;

      const response = await fetch(song.audio_url);
      if (!response.ok) return false;

      const blob = await response.blob();
      await this.cacheAudioBlob(song.id, blob);

      // 标记为离线可播放
      await this.markOfflinePlayable(song, blob.size);

      return true;
    } catch {
      return false;
    }
  }

  /** 为离线歌曲创建 Object URL */
  async getOfflineAudioUrl(songId: string): Promise<string | null> {
    const blob = await this.getAudioBlob(songId);
    if (!blob) return null;
    return URL.createObjectURL(blob);
  }

  // ==================== Image Blob Cache ====================

  async cacheImageBlob(url: string, blob: Blob): Promise<void> {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_IMAGES, "readwrite");
      const store = tx.objectStore(STORE_IMAGES);
      store.put({ url, blob, cachedAt: Date.now() });
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  }

  async getImageBlob(url: string): Promise<Blob | null> {
    const entry = await getItem<{ url: string; blob: Blob; cachedAt: number }>(STORE_IMAGES, url);
    return entry?.blob ?? null;
  }

  async downloadAndCacheImage(url: string): Promise<boolean> {
    try {
      const alreadyCached = await this.getImageBlob(url);
      if (alreadyCached) return true;

      const response = await fetch(url);
      if (!response.ok) return false;

      const blob = await response.blob();
      await this.cacheImageBlob(url, blob);
      return true;
    } catch {
      return false;
    }
  }

  async getOfflineImageUrl(url: string): Promise<string | null> {
    const blob = await this.getImageBlob(url);
    if (!blob) return null;
    return URL.createObjectURL(blob);
  }

  // ==================== Offline Song Tracking ====================

  async markOfflinePlayable(song: Song, size: number): Promise<void> {
    await putItem<OfflineSongEntry>(STORE_OFFLINE, {
      songId: song.id,
      title: song.title,
      artist: song.artist,
      coverUrl: song.cover_url || "",
      size,
      cachedAt: Date.now(),
    });
  }

  async isOfflinePlayable(songId: string): Promise<boolean> {
    const entry = await getItem<OfflineSongEntry>(STORE_OFFLINE, songId);
    if (!entry) return false;
    // 同时检查音频 blob 是否存在
    return this.hasAudioBlob(songId);
  }

  async getOfflineSongs(): Promise<OfflineSongEntry[]> {
    return getAllItems<OfflineSongEntry>(STORE_OFFLINE);
  }

  async removeOfflineSong(songId: string): Promise<void> {
    await Promise.all([
      deleteItem(STORE_AUDIO, songId),
      deleteItem(STORE_OFFLINE, songId),
    ]);
  }

  // ==================== Cache Size Control ====================

  async getTotalCacheSize(): Promise<number> {
    const stores = [STORE_AUDIO, STORE_IMAGES];
    let total = 0;

    for (const storeName of stores) {
      try {
        const entries = await getAllItems<{ size?: number; blob?: Blob }>(storeName);
        for (const entry of entries) {
          total += entry.size ?? entry.blob?.size ?? 0;
        }
      } catch {
        // skip
      }
    }

    return total;
  }

  /** 清理最旧的缓存条目直到低于阈值 */
  async enforceCacheLimit(): Promise<number> {
    const currentSize = await this.getTotalCacheSize();
    if (currentSize <= MAX_CACHE_SIZE) return 0;

    let cleaned = 0;

    // 清理最旧的音频缓存
    try {
      const audioEntries = await getAllItems<AudioBlobEntry>(STORE_AUDIO);
      audioEntries.sort((a, b) => a.cachedAt - b.cachedAt);

      for (const entry of audioEntries) {
        if ((await this.getTotalCacheSize()) <= MAX_CACHE_SIZE * 0.8) break;
        await this.removeOfflineSong(entry.songId);
        cleaned++;
      }
    } catch {
      // best effort
    }

    return cleaned;
  }

  /** 获取离线统计 */
  async getOfflineStats(): Promise<{
    songCount: number;
    audioSize: number;
    imageCount: number;
    imageSize: number;
  }> {
    const songCount = await countItems(STORE_OFFLINE);
    const audioEntries = await getAllItems<AudioBlobEntry>(STORE_AUDIO);
    const audioSize = audioEntries.reduce((sum, e) => sum + (e.size ?? e.blob?.size ?? 0), 0);
    const imageEntries = await getAllItems<ImageBlobEntry>(STORE_IMAGES);
    const imageSize = imageEntries.reduce((sum, e) => sum + (e.blob?.size ?? 0), 0);

    return {
      songCount,
      audioSize,
      imageCount: imageEntries.length,
      imageSize,
    };
  }
}

export const offlineService = OfflineService.getInstance();

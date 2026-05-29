/**
 * Phase 12 — LocalMediaProvider
 *
 * 本地音频文件Provider。支持未来: 文件夹扫描 / IndexedDB索引 / 本地元数据缓存。
 * 当前阶段: 架构与接口预留，不实现复杂文件系统。
 */

import type {
  LocalMediaFile,
  LocalMediaIndex,
  LocalPlaylistData,
  LocalMediaProviderConfig,
  LocalAudioMetadata,
} from "@/types/phase12";
import { DEFAULT_LOCAL_MEDIA_CONFIG } from "@/types/phase12";

const INDEX_STORAGE_KEY = "music_local_media_index";

export class LocalMediaProvider {
  private static instance: LocalMediaProvider;
  private config: LocalMediaProviderConfig;
  private index: LocalMediaIndex | null = null;

  private constructor() {
    this.config = { ...DEFAULT_LOCAL_MEDIA_CONFIG };
    this.loadIndex();
  }

  static getInstance(): LocalMediaProvider {
    if (!LocalMediaProvider.instance) {
      LocalMediaProvider.instance = new LocalMediaProvider();
    }
    return LocalMediaProvider.instance;
  }

  // ─── Configuration ───

  getConfig(): LocalMediaProviderConfig {
    return { ...this.config };
  }

  updateConfig(partial: Partial<LocalMediaProviderConfig>): void {
    this.config = { ...this.config, ...partial };
  }

  isEnabled(): boolean {
    return this.config.enabled;
  }

  // ─── Index Management ───

  getIndex(): LocalMediaIndex | null {
    return this.index;
  }

  getFilesByType(type: LocalMediaFile["type"]): LocalMediaFile[] {
    return this.index?.byType[type] ?? [];
  }

  getFilesByArtist(artist: string): LocalMediaFile[] {
    return this.index?.byArtist[artist] ?? [];
  }

  getFilesByAlbum(album: string): LocalMediaFile[] {
    return this.index?.byAlbum[album] ?? [];
  }

  getAllAudioFiles(): LocalMediaFile[] {
    return this.getFilesByType("audio");
  }

  getFileById(id: string): LocalMediaFile | undefined {
    return this.index?.files.find((f) => f.id === id);
  }

  // ─── Playlist (Local) ───

  private localPlaylists: Map<string, LocalPlaylistData> = new Map();

  getLocalPlaylists(): LocalPlaylistData[] {
    return Array.from(this.localPlaylists.values());
  }

  getLocalPlaylist(id: string): LocalPlaylistData | undefined {
    return this.localPlaylists.get(id);
  }

  addLocalPlaylist(data: Omit<LocalPlaylistData, "id" | "createdAt" | "updatedAt">): LocalPlaylistData {
    const playlist: LocalPlaylistData = {
      id: `local-pl-${Date.now()}`,
      ...data,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
    this.localPlaylists.set(playlist.id, playlist);
    return playlist;
  }

  removeLocalPlaylist(id: string): boolean {
    return this.localPlaylists.delete(id);
  }

  // ─── Index Persistence ───

  setIndex(index: LocalMediaIndex): void {
    this.index = index;
    this.persistIndex();
  }

  clearIndex(): void {
    this.index = null;
    try {
      localStorage.removeItem(INDEX_STORAGE_KEY);
    } catch {
      // silent
    }
  }

  // ─── Health ───

  getStatus(): {
    enabled: boolean;
    indexed: boolean;
    totalFiles: number;
    totalSize: number;
    lastScanAt: number | null;
    supportedFormats: string[];
  } {
    return {
      enabled: this.config.enabled,
      indexed: this.index !== null,
      totalFiles: this.index?.totalFiles ?? 0,
      totalSize: this.index?.totalSize ?? 0,
      lastScanAt: this.index?.lastScanAt ?? null,
      supportedFormats: this.config.supportedFormats,
    };
  }

  // ─── Metadata Extraction (预留) ───

  /**
   * 从本地音频文件中提取元数据 (预留接口)
   * 未来实现: 使用 Web Audio API 或 MediaMetadata 解析 ID3/Vorbis 标签
   */
  async extractMetadata(_file: File): Promise<LocalAudioMetadata> {
    // 预留: 真实实现需要解析音频文件头部/ID3标签
    return {};
  }

  /**
   * 构建本地文件URL (预留)
   * 未来实现: 使用 URL.createObjectURL 或 IndexedDB 中存储的 Blob
   */
  getLocalPlayUrl(_fileId: string): string | null {
    // 预留: 需要配合 IndexedDB 或 File System Access API
    return null;
  }

  // ─── Private ───

  private loadIndex(): void {
    try {
      const raw = localStorage.getItem(INDEX_STORAGE_KEY);
      if (raw) {
        this.index = JSON.parse(raw) as LocalMediaIndex;
      }
    } catch {
      this.index = null;
    }
  }

  private persistIndex(): void {
    try {
      if (this.index) {
        localStorage.setItem(INDEX_STORAGE_KEY, JSON.stringify(this.index));
      }
    } catch {
      // localStorage full — silently skip
    }
  }
}

export function getLocalMediaProvider(): LocalMediaProvider {
  return LocalMediaProvider.getInstance();
}

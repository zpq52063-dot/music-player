/**
 * Phase 12 — LocalLyricProvider
 *
 * 本地歌词文件Provider。支持 .lrc / .txt 文件。
 * 当前阶段: 架构预留，接口定义。
 */

import type { LyricLine } from "@/types/music";

export interface LocalLyricEntry {
  songId: string;
  path: string;
  content: string;
  parsed: LyricLine[];
  lastModified: number;
}

export class LocalLyricProvider {
  private static instance: LocalLyricProvider;
  private lyricCache: Map<string, LocalLyricEntry> = new Map();

  static getInstance(): LocalLyricProvider {
    if (!LocalLyricProvider.instance) {
      LocalLyricProvider.instance = new LocalLyricProvider();
    }
    return LocalLyricProvider.instance;
  }

  hasLocalLyric(songId: string): boolean {
    return this.lyricCache.has(songId);
  }

  getLocalLyric(songId: string): LocalLyricEntry | undefined {
    return this.lyricCache.get(songId);
  }

  /**
   * 注册本地歌词 (预留)
   * 未来: 从本地文件系统或IndexedDB读取
   */
  registerLyric(entry: LocalLyricEntry): void {
    this.lyricCache.set(entry.songId, entry);
  }

  removeLyric(songId: string): boolean {
    return this.lyricCache.delete(songId);
  }

  getCachedCount(): number {
    return this.lyricCache.size;
  }

  clear(): void {
    this.lyricCache.clear();
  }
}

export function getLocalLyricProvider(): LocalLyricProvider {
  return LocalLyricProvider.getInstance();
}

/**
 * Phase 12 — LocalCoverProvider
 *
 * 本地封面图片Provider。支持 jpg/png/webp 格式。
 * 当前阶段: 架构预留，接口定义。
 */

export interface LocalCoverEntry {
  songId: string;
  albumId?: string;
  path: string;
  mimeType: string;
  size: number;
  width?: number;
  height?: number;
  lastModified: number;
}

export class LocalCoverProvider {
  private static instance: LocalCoverProvider;
  private coverCache: Map<string, LocalCoverEntry> = new Map();
  private albumCoverMap: Map<string, string> = new Map();

  static getInstance(): LocalCoverProvider {
    if (!LocalCoverProvider.instance) {
      LocalCoverProvider.instance = new LocalCoverProvider();
    }
    return LocalCoverProvider.instance;
  }

  hasCover(songId: string): boolean {
    return this.coverCache.has(songId);
  }

  getCover(songId: string): LocalCoverEntry | undefined {
    return this.coverCache.get(songId);
  }

  getAlbumCover(albumId: string): LocalCoverEntry | undefined {
    const songId = this.albumCoverMap.get(albumId);
    if (songId) return this.coverCache.get(songId);
    return undefined;
  }

  /**
   * 注册本地封面 (预留)
   * 未来: 从本地文件系统读取图片文件
   */
  registerCover(entry: LocalCoverEntry): void {
    this.coverCache.set(entry.songId, entry);
    if (entry.albumId) {
      this.albumCoverMap.set(entry.albumId, entry.songId);
    }
  }

  removeCover(songId: string): boolean {
    const entry = this.coverCache.get(songId);
    if (entry?.albumId) {
      this.albumCoverMap.delete(entry.albumId);
    }
    return this.coverCache.delete(songId);
  }

  getCachedCount(): number {
    return this.coverCache.size;
  }

  clear(): void {
    this.coverCache.clear();
    this.albumCoverMap.clear();
  }
}

export function getLocalCoverProvider(): LocalCoverProvider {
  return LocalCoverProvider.getInstance();
}

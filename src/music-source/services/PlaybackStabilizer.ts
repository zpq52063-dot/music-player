import { getProviderManager } from "../providers/provider-manager";
import type { Song } from "@/types";

// ==================== 播放链接缓存 ====================

interface PlayUrlEntry {
  url: string;
  provider: string;
  fetchedAt: number;
  ttl: number;
}

/**
 * PlaybackStabilizer — 播放稳定性管理器
 *
 * 职责:
 * 1. 缓存播放 URL (避免重复请求)
 * 2. 播放失败时自动换源
 * 3. 预加载下一首
 * 4. 播放状态恢复
 * 5. 桥接 EdgeProviderManager 为首页歌曲解析真实音频 URL
 */
export class PlaybackStabilizer {
  private urlCache: Map<string, PlayUrlEntry> = new Map();
  private failedProviders: Map<string, Set<string>> = new Map(); // songId → failed provider types
  private preloadQueue: string[] = [];
  private maxPreload = 2;
  private urlTTL = 10 * 60 * 1000; // 10 min
  private maxUrlCacheSize = 100;
  private maxFailedProvidersSize = 50;

  /** 获取播放 URL (带缓存 + fallback) */
  async getPlayUrl(song: Song): Promise<string> {
    const songId = song.id;

    // 1. 检查缓存的 URL
    const cached = this.urlCache.get(songId);
    if (cached && Date.now() - cached.fetchedAt < cached.ttl) {
      return cached.url;
    }

    // 2. 通过 ProviderManager 尝试所有 provider
    const manager = getProviderManager();
    const failedSet = this.failedProviders.get(songId) ?? new Set();
    const providers = manager.getPriorityList().filter((p) => !failedSet.has(p));

    for (const type of providers) {
      try {
        const url = await manager.execute<string>(
          "getPlayUrl",
          [songId],
          `playUrl:${songId}:${type}`,
        );

        if (url && url.trim()) {
          this.urlCache.set(songId, {
            url,
            provider: type,
            fetchedAt: Date.now(),
            ttl: this.urlTTL,
          });
          this.evictOldestFromUrlCache();
          this.clearFailedFor(songId);
          return url;
        }
      } catch {
        // 记录失败
        if (!this.failedProviders.has(songId)) {
          this.failedProviders.set(songId, new Set());
          this.evictOldestFromFailedProviders();
        }
        this.failedProviders.get(songId)!.add(type);
      }
    }

    // 3. 桥接 EdgeProviderManager: 尝试直接获取流
    const edgeUrl = await this.resolveViaEdgeManager(song);
    if (edgeUrl) {
      this.urlCache.set(songId, {
        url: edgeUrl,
        provider: "edge-manager",
        fetchedAt: Date.now(),
        ttl: this.urlTTL,
      });
      return edgeUrl;
    }

    // 4. 兜底：返回 song 自带的 audio_url
    return song.audio_url ?? "";
  }

  /** 通过 EdgeProviderManager 解析播放 URL */
  private async resolveViaEdgeManager(song: Song): Promise<string | null> {
    try {
      // 动态导入避免循环依赖
      const { getEdgeProviderManager } = await import(
        "@/remote-provider/core/EdgeProviderManager"
      );

      const edgeManager = getEdgeProviderManager();

      // 尝试1: 直接通过 song.id 获取流
      try {
        const stream = await edgeManager.getStream(song.id);
        if (stream?.url && stream.url.trim()) {
          return stream.url;
        }
      } catch {
        // 直接 ID 查找失败，继续尝试搜索
      }

      // 尝试2: 通过 title + artist 搜索
      if (song.title && song.artist) {
        const searchQuery = `${song.title} ${song.artist}`;
        const searchResult = await edgeManager.search(searchQuery, {
          limit: 5,
          type: "song",
        });

        if (searchResult.songs.length > 0) {
          // 尝试匹配最接近的结果
          for (const result of searchResult.songs) {
            try {
              const stream = await edgeManager.getStream(result.id);
              if (stream?.url && stream.url.trim()) {
                return stream.url;
              }
            } catch {
              continue;
            }
          }
        }
      }

      return null;
    } catch {
      // EdgeProviderManager 不可用时返回 null
      return null;
    }
  }

  /** 播放失败时换源 */
  async retryWithFallback(song: Song, failedUrl: string): Promise<string | null> {
    const songId = song.id;

    // 清除失败的 URL 缓存
    const cached = this.urlCache.get(songId);
    if (cached && cached.url === failedUrl) {
      this.urlCache.delete(songId);
      if (!this.failedProviders.has(songId)) {
        this.failedProviders.set(songId, new Set());
      }
      this.failedProviders.get(songId)!.add(cached.provider);
    }

    // 重新获取
    try {
      return await this.getPlayUrl(song);
    } catch {
      return null;
    }
  }

  /** 预加载下一首 */
  async preloadNext(songs: Song[], currentIndex: number): Promise<void> {
    const toPreload: Song[] = [];

    for (let i = 1; i <= this.maxPreload; i++) {
      const idx = currentIndex + i;
      if (idx < songs.length && songs[idx]) {
        toPreload.push(songs[idx]);
      }
    }

    for (const song of toPreload) {
      // 已在队列中则跳过
      if (this.preloadQueue.includes(song.id)) continue;
      this.preloadQueue.push(song.id);
      if (this.preloadQueue.length > this.maxPreload * 3) {
        this.preloadQueue.shift();
      }

      // 异步预加载 — 不阻塞
      this.getPlayUrl(song).catch(() => {});
    }
  }

  /** 保存当前播放状态 */
  saveState(song: Song, currentTime: number): void {
    try {
      const state = {
        songId: song.id,
        currentTime,
        timestamp: Date.now(),
      };
      localStorage.setItem("music_playback_state", JSON.stringify(state));
    } catch {
      // ignore quota errors
    }
  }

  /** 恢复播放状态 */
  restoreState(): { songId: string; currentTime: number } | null {
    try {
      const raw = localStorage.getItem("music_playback_state");
      if (!raw) return null;
      const state = JSON.parse(raw) as { songId: string; currentTime: number; timestamp: number };

      // 超过 30 分钟的状态视为过期
      if (Date.now() - state.timestamp > 30 * 60 * 1000) {
        localStorage.removeItem("music_playback_state");
        return null;
      }

      return { songId: state.songId, currentTime: state.currentTime };
    } catch {
      return null;
    }
  }

  /** 清除播放状态 */
  clearState(): void {
    try {
      localStorage.removeItem("music_playback_state");
    } catch {
      // ignore
    }
  }

  /** 清除所有缓存 */
  clear(): void {
    this.urlCache.clear();
    this.failedProviders.clear();
    this.preloadQueue = [];
  }

  private clearFailedFor(songId: string): void {
    this.failedProviders.delete(songId);
  }

  /** LRU 淘汰最旧的 URL 缓存条目 */
  private evictOldestFromUrlCache(): void {
    if (this.urlCache.size <= this.maxUrlCacheSize) return;

    let oldestKey = "";
    let oldestTime = Infinity;
    for (const [key, entry] of this.urlCache) {
      if (entry.fetchedAt < oldestTime) {
        oldestTime = entry.fetchedAt;
        oldestKey = key;
      }
    }
    if (oldestKey) this.urlCache.delete(oldestKey);
  }

  /** 清理失败的 provider 记录 */
  private evictOldestFromFailedProviders(): void {
    if (this.failedProviders.size <= this.maxFailedProvidersSize) return;
    const keys = [...this.failedProviders.keys()];
    for (const k of keys.slice(0, this.failedProviders.size - this.maxFailedProvidersSize)) {
      this.failedProviders.delete(k);
    }
  }
}

/** 全局单例 */
let _stabilizer: PlaybackStabilizer | null = null;

export function getPlaybackStabilizer(): PlaybackStabilizer {
  if (!_stabilizer) _stabilizer = new PlaybackStabilizer();
  return _stabilizer;
}

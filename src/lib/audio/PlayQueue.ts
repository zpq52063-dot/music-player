import type { Song } from "@/types";
import { getPlaybackStabilizer } from "@/music-source/services/PlaybackStabilizer";

/**
 * PlayQueue — 预加载下一首歌曲
 *
 * 单例，管理预加载 Audio 元素：
 * - 当前歌曲加载后自动预加载队列中的下一首
 * - 使用独立的 HTMLAudioElement 避免干扰主播放器
 * - 缓存已解析的播放 URL
 *
 * Phase 18A Stabilization:
 * - Dedup: preloadNearEnd ignores repeated calls for the same song within threshold window
 * - URL cache LRU: limits cached URLs to 50 entries
 * - Early preload: starts preloading at threshold + crossfade buffer
 */
export class PlayQueue {
  private static instance: PlayQueue | null = null;

  private preloadAudio: HTMLAudioElement | null = null;
  private preloadUrl: string | null = null;
  private preloadSongId: string | null = null;
  private _preloadPending = false;

  private urlCache = new Map<string, string>(); // songId → resolved url
  private readonly MAX_URL_CACHE = 50;

  // Track last preloadNearEnd invocation to dedup
  private _lastPreloadCheck = 0;
  private _lastPreloadSongId: string | null = null;
  private readonly PRELOAD_DEBOUNCE_MS = 1000;

  private constructor() {}

  static getInstance(): PlayQueue {
    if (!PlayQueue.instance) {
      PlayQueue.instance = new PlayQueue();
    }
    return PlayQueue.instance;
  }

  get preloadPending(): boolean {
    return this._preloadPending;
  }

  /** 预加载队列中的下一首 */
  async preloadNext(queue: Song[], currentIndex: number): Promise<void> {
    const nextIdx = currentIndex + 1;
    if (nextIdx >= queue.length) return;

    const nextSong = queue[nextIdx];
    if (!nextSong) return;

    if (this.preloadSongId === nextSong.id) return;
    if (this._preloadPending) return;

    this.cancel();
    this._preloadPending = true;

    try {
      const url = await this.resolveUrl(nextSong);
      if (!url) return;

      this.preloadSongId = nextSong.id;
      this.preloadUrl = url;

      const audio = new Audio();
      audio.preload = "auto";
      audio.volume = 0;
      audio.src = url;
      audio.load();

      this.preloadAudio = audio;
    } finally {
      this._preloadPending = false;
    }
  }

  /** Phase 18A — Preload next song when current is near its end */
  async preloadNearEnd(
    queue: Song[],
    currentIndex: number,
    currentTime: number,
    duration: number,
    thresholdSeconds = 5,
  ): Promise<void> {
    if (duration <= 0) return;
    const remaining = duration - currentTime;
    if (remaining > thresholdSeconds) return;

    // Dedup: don't preload the same song repeatedly within the debounce window
    const nextIdx = currentIndex + 1;
    const nextSong = queue[nextIdx];
    if (!nextSong) return;

    const now = Date.now();
    if (
      this._lastPreloadSongId === nextSong.id &&
      now - this._lastPreloadCheck < this.PRELOAD_DEBOUNCE_MS
    ) {
      return;
    }

    this._lastPreloadCheck = now;
    this._lastPreloadSongId = nextSong.id;

    await this.preloadNext(queue, currentIndex);
  }

  /** 获取已预加载的 Audio 元素（已被回调消费则返回 null） */
  consumePreloaded(): { audio: HTMLAudioElement; url: string } | null {
    if (!this.preloadAudio || !this.preloadUrl) return null;
    const result = { audio: this.preloadAudio, url: this.preloadUrl };
    this.preloadAudio = null;
    this.preloadUrl = null;
    this.preloadSongId = null;
    this._lastPreloadSongId = null;
    return result;
  }

  /** Phase 18A — Get the preloaded audio element without consuming it */
  getPreloadedAudio(): HTMLAudioElement | null {
    return this.preloadAudio;
  }

  /** Get the preloaded URL */
  getPreloadedUrl(): string | null {
    return this.preloadUrl;
  }

  /** 取消当前预加载 */
  cancel(): void {
    if (this.preloadAudio) {
      this.preloadAudio.src = "";
      this.preloadAudio.load();
      this.preloadAudio = null;
    }
    this.preloadUrl = null;
    this.preloadSongId = null;
    this._lastPreloadSongId = null;
    this._preloadPending = false;
  }

  /** 清除 URL 缓存 */
  clearCache(): void {
    this.urlCache.clear();
  }

  destroy(): void {
    this.cancel();
    this.clearCache();
    PlayQueue.instance = null;
  }

  // ==================== Internal ====================

  private async resolveUrl(song: Song): Promise<string | null> {
    if (song.audio_url) {
      this.addToCache(song.id, song.audio_url);
      return song.audio_url;
    }

    const cached = this.urlCache.get(song.id);
    if (cached) return cached;

    try {
      const stabilizer = getPlaybackStabilizer();
      const url = await stabilizer.getPlayUrl(song);
      if (url) {
        this.addToCache(song.id, url);
      }
      return url;
    } catch {
      return null;
    }
  }

  private addToCache(songId: string, url: string): void {
    this.urlCache.set(songId, url);
    // LRU eviction: if over limit, remove oldest (first inserted) entry
    if (this.urlCache.size > this.MAX_URL_CACHE) {
      const firstKey = this.urlCache.keys().next().value;
      if (firstKey !== undefined) {
        this.urlCache.delete(firstKey);
      }
    }
  }
}

export function getPlayQueue(): PlayQueue {
  return PlayQueue.getInstance();
}

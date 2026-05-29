import type { Song } from "@/types";
import type { Playlist } from "@/types";
import type { Artist } from "@/types";
import type { SearchResult } from "@/types";
import type { MusicProvider, SearchOptions, SongDetail, MusicQuality } from "../types/provider";
import { getSearchCache } from "../cache";

// ==================== SearchService ====================

export class SearchService {
  private provider: MusicProvider;
  private cache = getSearchCache();
  private fallbackProvider: MusicProvider | null = null;

  constructor(provider: MusicProvider) {
    this.provider = provider;
  }

  /** 切换 provider */
  setProvider(provider: MusicProvider): void {
    this.provider = provider;
    this.cache.clear();
  }

  /** 设置 fallback provider（主 provider 失败时使用） */
  setFallbackProvider(provider: MusicProvider): void {
    this.fallbackProvider = provider;
  }

  getProvider(): MusicProvider {
    return this.provider;
  }

  // ==================== 搜索 ====================

  async search(keyword: string, options?: SearchOptions): Promise<SearchResult> {
    if (!keyword.trim()) {
      return { songs: [], playlists: [], artists: [], total: 0, hasMore: false };
    }

    const cacheKey = `search:${keyword}:${options?.offset ?? 0}`;

    // 1. 请求去重
    const pending = this.cache.getPending<SearchResult>(cacheKey);
    if (pending) return pending;

    // 2. 缓存命中 + 新鲜
    if (this.cache.isFresh(cacheKey, "search")) {
      const cached = this.cache.get<SearchResult>(cacheKey, "search");
      if (cached) return cached;
    }

    // 3. 发起请求
    const promise = this.executeWithFallback<SearchResult>("search", [keyword, options], cacheKey);
    this.cache.setPending(cacheKey, promise);

    try {
      const result = await promise;
      this.cache.set(cacheKey, result);
      return result;
    } finally {
      this.cache.deletePending(cacheKey);
    }
  }

  async getSearchSuggestions(keyword: string): Promise<string[]> {
    if (!keyword.trim()) return [];

    const cacheKey = `suggestion:${keyword}`;
    const cached = this.cache.get<string[]>(cacheKey, "suggestion");
    if (cached) return cached;

    try {
      const result = await this.provider.getSearchSuggestions(keyword);
      this.cache.set(cacheKey, result);
      return result;
    } catch {
      return [];
    }
  }

  async getHotKeywords(): Promise<string[]> {
    const cacheKey = "hotKeywords";
    const cached = this.cache.get<string[]>(cacheKey, "hotKeywords");
    if (cached) return cached;

    try {
      const result = await this.provider.getHotKeywords();
      this.cache.set(cacheKey, result);
      return result;
    } catch {
      return [];
    }
  }

  // ==================== 歌曲 ====================

  async getSongDetail(id: string): Promise<SongDetail> {
    const cacheKey = `song:${id}`;
    const cached = this.cache.get<SongDetail>(cacheKey, "songDetail");
    if (cached) return cached;

    const result = await this.provider.getSongDetail(id);
    this.cache.set(cacheKey, result);
    return result;
  }

  async getPlayUrl(id: string, quality?: MusicQuality): Promise<string> {
    return this.provider.getPlayUrl(id, quality);
  }

  async getLyrics(id: string): Promise<string> {
    const cacheKey = `lyrics:${id}`;
    const cached = this.cache.get<string>(cacheKey, "songDetail");
    if (cached) return cached;

    const result = await this.provider.getLyrics(id);
    if (result) this.cache.set(cacheKey, result);
    return result;
  }

  // ==================== 歌单 ====================

  async getPlaylist(id: string): Promise<Playlist> {
    const cacheKey = `playlist:${id}`;
    const cached = this.cache.get<Playlist>(cacheKey, "playlist");
    if (cached) return cached;

    const result = await this.provider.getPlaylist(id);
    this.cache.set(cacheKey, result);
    return result;
  }

  async getPlaylistSongs(id: string): Promise<Song[]> {
    const cacheKey = `playlistSongs:${id}`;
    const cached = this.cache.get<Song[]>(cacheKey, "playlist");
    if (cached) return cached;

    const result = await this.provider.getPlaylistSongs(id);
    this.cache.set(cacheKey, result);
    return result;
  }

  // ==================== 艺术家 ====================

  async getArtist(id: string): Promise<Artist> {
    const cacheKey = `artist:${id}`;
    const cached = this.cache.get<Artist>(cacheKey, "playlist");
    if (cached) return cached;

    const result = await this.provider.getArtist(id);
    this.cache.set(cacheKey, result);
    return result;
  }

  async getArtistSongs(id: string): Promise<Song[]> {
    const cacheKey = `artistSongs:${id}`;
    const cached = this.cache.get<Song[]>(cacheKey, "playlist");
    if (cached) return cached;

    const result = await this.provider.getArtistSongs(id);
    this.cache.set(cacheKey, result);
    return result;
  }

  // ==================== 缓存管理 ====================

  clearCache(): void {
    this.cache.clear();
  }

  invalidateSearchCache(keyword?: string): void {
    if (keyword) {
      this.cache.delete(`search:${keyword}`);
    } else {
      this.cache.invalidateByPrefix("search:");
    }
  }

  // ==================== Private ====================

  private async executeWithFallback<R>(
    method: keyof MusicProvider,
    args: unknown[],
    _cacheKey: string,
  ): Promise<R> {
    try {
      const fn = this.provider[method] as (...a: unknown[]) => Promise<R>;
      return await fn.apply(this.provider, args);
    } catch (err) {
      // Fallback: try backup provider
      if (this.fallbackProvider) {
        const fallbackFn = this.fallbackProvider[method] as (...a: unknown[]) => Promise<R>;
        return await fallbackFn.apply(this.fallbackProvider, args);
      }
      throw err;
    }
  }
}

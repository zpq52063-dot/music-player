"use client";

import { useCallback } from "react";
import { getProviderManager } from "../providers/provider-manager";
import { getAPICache } from "../cache";
import { useProviderStore } from "@/stores/providerStore";
import type { MusicProvider } from "../types/provider";
import type { SearchResult, Song, Playlist, Artist } from "@/types";
import type { SongDetail, SearchOptions, MusicQuality } from "../types/provider";

/**
 * useMusicSource — 高层音乐数据源 hook
 * 自动使用 ProviderManager 进行请求 (带 fallback + cache + retry)
 * 替代 useMusicProvider 中的直接 SearchService 调用
 */
export function useMusicSource() {
  const setRequestStatus = useProviderStore((s) => s.setRequestStatus);

  const execute = useCallback(
    async <T>(method: keyof MusicProvider, args: unknown[], cacheKey?: string): Promise<T> => {
      setRequestStatus("loading");
      try {
        const manager = getProviderManager();
        const result = await manager.execute<T>(method, args, cacheKey);
        setRequestStatus("success");
        return result;
      } catch (err) {
        setRequestStatus("error", (err as Error).message);
        throw err;
      }
    },
    [setRequestStatus],
  );

  // ==================== 缓存感知方法 ====================

  const search = useCallback(
    async (keyword: string, options?: SearchOptions): Promise<SearchResult> => {
      const cacheKey = `search:${keyword}:${options?.offset ?? 0}`;
      const cache = getAPICache();

      // SWR: 先返回缓存
      const cached = cache.getWithSWR<SearchResult>(cacheKey, "search");
      if (cached.data && !cached.stale) return cached.data;

      // 后台刷新
      const promise = execute<SearchResult>("search", [keyword, options], cacheKey);
      if (cached.data) {
        // stale — 返回旧数据并在后台更新
        promise
          .then((result) => cache.set(cacheKey, result, "search"))
          .catch(() => {});
        return cached.data;
      }

      // 无缓存 — 等待结果
      const result = await promise;
      cache.set(cacheKey, result, "search");
      return result;
    },
    [execute],
  );

  const getSongDetail = useCallback(
    async (id: string): Promise<SongDetail> => {
      return execute<SongDetail>("getSongDetail", [id], `song:${id}`);
    },
    [execute],
  );

  const getPlayUrl = useCallback(
    async (id: string, quality?: MusicQuality): Promise<string> => {
      return execute<string>("getPlayUrl", [id, quality], `playUrl:${id}`);
    },
    [execute],
  );

  const getLyrics = useCallback(
    async (id: string): Promise<string> => {
      const cache = getAPICache();
      const cacheKey = `lyrics:${id}`;
      const cached = cache.getWithSWR<string>(cacheKey, "lyrics");
      if (cached.data && !cached.stale) return cached.data;

      const result = await execute<string>("getLyrics", [id], cacheKey);
      if (result) cache.set(cacheKey, result, "lyrics");
      return result;
    },
    [execute],
  );

  const getHotKeywords = useCallback(async (): Promise<string[]> => {
    const cache = getAPICache();
    const cacheKey = "hotKeywords";
    const cached = cache.getWithSWR<string[]>(cacheKey, "hotKeywords");
    if (cached.data) return cached.data;

    const result = await execute<string[]>("getHotKeywords", [], cacheKey);
    cache.set(cacheKey, result, "hotKeywords");
    return result;
  }, [execute]);

  const getPlaylist = useCallback(
    async (id: string): Promise<Playlist> => {
      return execute<Playlist>("getPlaylist", [id], `playlist:${id}`);
    },
    [execute],
  );

  const getPlaylistSongs = useCallback(
    async (id: string): Promise<Song[]> => {
      return execute<Song[]>("getPlaylistSongs", [id], `playlistSongs:${id}`);
    },
    [execute],
  );

  const getArtist = useCallback(
    async (id: string): Promise<Artist> => {
      return execute<Artist>("getArtist", [id], `artist:${id}`);
    },
    [execute],
  );

  return {
    search,
    getSongDetail,
    getPlayUrl,
    getLyrics,
    getHotKeywords,
    getPlaylist,
    getPlaylistSongs,
    getArtist,
    execute,
  };
}

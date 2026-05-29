"use client";

import { useCallback, useRef } from "react";
import { getProviderManager } from "../providers/provider-manager";
import { useMusicPlayerStore } from "@/stores/musicPlayerStore";
import type { Song } from "@/types";

/**
 * useFallbackPlayer — Fallback-aware 播放
 * 当音频加载失败时自动尝试其他 provider 的播放链接
 */
export function useFallbackPlayer() {
  const triedProviders = useRef<Set<string>>(new Set());
  const currentSong = useMusicPlayerStore((s) => s.currentSong);
  const loadingState = useMusicPlayerStore((s) => s.loadingState);

  /** 获取当前歌曲的播放 URL (带 fallback) */
  const getPlayUrl = useCallback(async (song: Song): Promise<string> => {
    const manager = getProviderManager();
    const providerTypes = manager.getPriorityList();

    triedProviders.current.clear();

    for (const type of providerTypes) {
      if (triedProviders.current.has(type)) continue;
      triedProviders.current.add(type);

      try {
        const url = await manager.execute<string>("getPlayUrl", [song.id], `playUrl:${song.id}:${type}`);
        if (url && url.trim()) return url;
      } catch {
        continue;
      }
    }

    // 兜底: 使用 song 自带的 audio_url
    return song.audio_url ?? "";
  }, []);

  /** 尝试恢复播放 (音频加载失败时) */
  const tryRecover = useCallback(async (): Promise<string | null> => {
    if (!currentSong) return null;

    try {
      const url = await getPlayUrl(currentSong);
      return url || null;
    } catch {
      return null;
    }
  }, [currentSong, getPlayUrl]);

  /** 预加载下一首 */
  const preloadNext = useCallback(async (): Promise<void> => {
    const manager = getProviderManager();
    const state = useMusicPlayerStore.getState();
    const { queue, queueIndex, playMode } = state;

    if (queue.length === 0 || queueIndex < 0) return;

    let nextIndex = queueIndex + 1;
    if (playMode === "repeat" && nextIndex >= queue.length) nextIndex = 0;
    if (nextIndex >= queue.length) return;

    const nextSong = queue[nextIndex];
    if (!nextSong) return;

    // Preload silently — don't care about result
    try {
      await manager.execute<string>("getPlayUrl", [nextSong.id], `preload:${nextSong.id}`);
    } catch {
      // silent
    }
  }, []);

  return {
    getPlayUrl,
    tryRecover,
    preloadNext,
    loadingState,
  };
}

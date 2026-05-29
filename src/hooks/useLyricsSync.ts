"use client";

import { useEffect } from "react";
import { useMusicPlayerStore } from "@/stores/musicPlayerStore";
import { LyricParser } from "@/lib/lyrics/LyricParser";

/**
 * 歌词同步 hook
 * 监听 currentTime → 二分查找当前行 → 更新 store
 */
export function useLyricsSync() {
  const currentTime = useMusicPlayerStore((s) => s.currentTime);
  const lyrics = useMusicPlayerStore((s) => s.lyrics);
  const currentLyricIndex = useMusicPlayerStore((s) => s.currentLyricIndex);

  // 同步当前行
  useEffect(() => {
    if (lyrics.length === 0) return;
    const timeMs = currentTime * 1000;
    const idx = LyricParser.findCurrentIndex(lyrics, timeMs);
    if (idx !== currentLyricIndex) {
      useMusicPlayerStore.getState().setCurrentLyricIndex(idx);
    }
  }, [currentTime, lyrics, currentLyricIndex]);
}

/**
 * 从 LRC 文本加载歌词到当前歌曲
 */
export function useLyricsLoader() {
  const loadLyrics = (lrcText: string) => {
    const lines = LyricParser.parse(lrcText);
    useMusicPlayerStore.getState().setLyrics(lines);
  };

  const clearLyrics = () => {
    useMusicPlayerStore.getState().setLyrics([]);
  };

  return { loadLyrics, clearLyrics };
}

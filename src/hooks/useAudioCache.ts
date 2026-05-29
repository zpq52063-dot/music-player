"use client";

import { useEffect, useCallback } from "react";
import { useMusicPlayerStore } from "@/stores/musicPlayerStore";
import { cacheSong, preloadQueueNext } from "@/services/cache";

// ==================== Hook ====================

export function useAudioCache() {
  const currentSong = useMusicPlayerStore((s) => s.currentSong);
  const queue = useMusicPlayerStore((s) => s.queue);
  const queueIndex = useMusicPlayerStore((s) => s.queueIndex);

  // Auto-cache current song metadata
  useEffect(() => {
    if (currentSong) {
      cacheSong(currentSong).catch(() => {
        // Non-critical, ignore errors
      });
    }
  }, [currentSong]);

  // Preload next songs in queue
  useEffect(() => {
    if (queue.length > 1 && queueIndex >= 0) {
      preloadQueueNext(queue, queueIndex, 2);
    }
  }, [queue, queueIndex]);

  const cacheSongManually = useCallback(async (song: typeof currentSong) => {
    if (!song) return;
    await cacheSong(song);
  }, []);

  return {
    cacheSong: cacheSongManually,
    currentCached: currentSong,
  };
}

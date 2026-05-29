"use client";

import { useEffect, useCallback } from "react";
import { useSystemStore } from "@/stores/systemStore";
import {
  getMetadataCacheCount,
  getOfflinePlaylistCount,
  getLocalHistoryCount,
  getLyricCacheCount,
} from "@/storage";

// ==================== Hook ====================

export function useOfflineCache() {
  const cacheStats = useSystemStore((s) => s.cacheStats);
  const setCacheStats = useSystemStore((s) => s.setCacheStats);
  const incrementCacheCount = useSystemStore((s) => s.incrementCacheCount);

  const refreshStats = useCallback(async () => {
    const [metadataCount, offlinePlaylistCount, historyCount, lyricCount] = await Promise.all([
      getMetadataCacheCount(),
      getOfflinePlaylistCount(),
      getLocalHistoryCount(),
      getLyricCacheCount(),
    ]);
    setCacheStats({ metadataCount, offlinePlaylistCount, historyCount, lyricCount });
  }, [setCacheStats]);

  useEffect(() => {
    void refreshStats();
  }, [refreshStats]);

  return {
    cacheStats,
    refreshStats,
    incrementCacheCount,
  };
}

"use client";

import { useQuery } from "@tanstack/react-query";
import { useUserStore } from "@/stores/userStore";
import { useLibraryStore } from "@/stores/libraryStore";
import { recentPlayedService } from "@/services/recentPlayedService";
import { useCallback } from "react";

export function useRecentPlayed() {
  const userId = useUserStore((s) => s.user?.id);
  const { recentPlayIds, setRecentPlayIds, addRecentPlayOptimistic } = useLibraryStore();

  // 查询最近播放 ID 列表
  const idsQuery = useQuery({
    queryKey: ["recent-play-ids", userId],
    queryFn: () => recentPlayedService.getRecentPlayIds(userId!),
    enabled: !!userId,
    staleTime: 10_000,
  });

  // 同步到 libraryStore
  if (idsQuery.data && idsQuery.data.join(",") !== recentPlayIds.join(",")) {
    setRecentPlayIds(idsQuery.data);
  }

  // 查询最近播放完整歌曲列表
  const songsQuery = useQuery({
    queryKey: ["recent-plays", userId],
    queryFn: () => recentPlayedService.getRecentPlays(userId!),
    enabled: !!userId,
    staleTime: 10_000,
  });

  const recordPlay = useCallback(
    (songId: string) => {
      addRecentPlayOptimistic(songId);
      if (userId) recentPlayedService.recordPlay(userId, songId);
    },
    [userId, addRecentPlayOptimistic],
  );

  return {
    recentPlays: songsQuery.data ?? [],
    recentPlayIds,
    recordPlay,
    isLoading: songsQuery.isLoading,
  };
}

"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useUserStore } from "@/stores/userStore";
import { useLibraryStore } from "@/stores/libraryStore";
import { likedSongsService } from "@/services/likedSongsService";
import { useCallback } from "react";

export function useLikedSongs() {
  const userId = useUserStore((s) => s.user?.id);
  const { likedSongIds, setLikedSongIds, toggleLikeOptimistic } = useLibraryStore();
  const queryClient = useQueryClient();

  const queryKey = ["liked-songs", userId];

  // 查询喜欢歌曲 ID 集合
  const idsQuery = useQuery({
    queryKey: ["liked-song-ids", userId],
    queryFn: () => likedSongsService.getLikedSongIds(userId!),
    enabled: !!userId,
    staleTime: 30_000,
  });

  // 同步到 libraryStore
  if (idsQuery.data && idsQuery.data.size !== likedSongIds.size) {
    setLikedSongIds(Array.from(idsQuery.data));
  }

  // 查询喜欢歌曲完整列表
  const songsQuery = useQuery({
    queryKey,
    queryFn: () => likedSongsService.getLikedSongs(userId!),
    enabled: !!userId,
    staleTime: 30_000,
  });

  // Toggle like mutation
  const toggleLikeMutation = useMutation({
    mutationFn: (songId: string) => {
      const isLiked = likedSongIds.has(songId);
      return likedSongsService.toggleLike(userId!, songId, isLiked);
    },
    onMutate: async (songId) => {
      await queryClient.cancelQueries({ queryKey: ["liked-song-ids", userId] });
      toggleLikeOptimistic(songId);
    },
    onError: (_err, songId) => {
      toggleLikeOptimistic(songId); // 回滚
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["liked-song-ids", userId] });
      queryClient.invalidateQueries({ queryKey });
    },
  });

  const toggleLike = useCallback(
    (songId: string) => toggleLikeMutation.mutate(songId),
    [toggleLikeMutation],
  );

  const isLiked = useCallback(
    (songId: string) => likedSongIds.has(songId),
    [likedSongIds],
  );

  return {
    likedSongs: songsQuery.data ?? [],
    likedSongIds,
    isLiked,
    toggleLike,
    isLoading: idsQuery.isLoading || songsQuery.isLoading,
  };
}

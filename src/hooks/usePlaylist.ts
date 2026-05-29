"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useUserStore } from "@/stores/userStore";
import { usePlaylistStore } from "@/stores/playlistStore";
import { playlistService } from "@/services/playlistService";
import { useCallback } from "react";

export function usePlaylist(playlistId?: string) {
  const userId = useUserStore((s) => s.user?.id);
  const { openCreateModal, closeCreateModal } = usePlaylistStore();
  const queryClient = useQueryClient();

  const userQueryKey = ["playlists", userId];
  const detailQueryKey = ["playlist", playlistId];

  // 用户歌单列表
  const playlistsQuery = useQuery({
    queryKey: userQueryKey,
    queryFn: () => playlistService.getUserPlaylists(userId!),
    enabled: !!userId,
    staleTime: 30_000,
  });

  // 歌单详情
  const detailQuery = useQuery({
    queryKey: detailQueryKey,
    queryFn: () => playlistService.getPlaylistDetail(playlistId!),
    enabled: !!playlistId,
    staleTime: 15_000,
  });

  // 创建歌单
  const createMutation = useMutation({
    mutationFn: ({ title, description }: { title: string; description?: string }) =>
      playlistService.createPlaylist(userId!, title, description),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: userQueryKey });
      closeCreateModal();
    },
  });

  // 删除歌单
  const deleteMutation = useMutation({
    mutationFn: (id: string) => playlistService.deletePlaylist(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: userQueryKey });
    },
  });

  // 添加歌曲
  const addSongMutation = useMutation({
    mutationFn: ({ plId, songId, song }: { plId: string; songId: string; song?: import("@/types").Song }) =>
      playlistService.addSong(plId, songId, song),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["playlist", playlistId] });
      queryClient.invalidateQueries({ queryKey: userQueryKey });
    },
  });

  // 移除歌曲
  const removeSongMutation = useMutation({
    mutationFn: ({ plId, songId }: { plId: string; songId: string }) =>
      playlistService.removeSong(plId, songId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: detailQueryKey });
      queryClient.invalidateQueries({ queryKey: userQueryKey });
    },
  });

  const createPlaylist = useCallback(
    (title: string, description?: string) => createMutation.mutate({ title, description }),
    [createMutation],
  );

  const deletePlaylist = useCallback(
    (id: string) => deleteMutation.mutate(id),
    [deleteMutation],
  );

  const addSong = useCallback(
    (plId: string, songId: string, song?: import("@/types").Song) => addSongMutation.mutate({ plId, songId, song }),
    [addSongMutation],
  );

  const removeSong = useCallback(
    (plId: string, songId: string) => removeSongMutation.mutate({ plId, songId }),
    [removeSongMutation],
  );

  return {
    playlists: playlistsQuery.data ?? [],
    playlistDetail: detailQuery.data ?? null,
    isLoading: playlistsQuery.isLoading,
    createPlaylist,
    deletePlaylist,
    addSong,
    removeSong,
    openCreateModal,
    closeCreateModal,
    isCreating: createMutation.isPending,
  };
}

"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useUserStore } from "@/stores/userStore";
import { useLibraryStore } from "@/stores/libraryStore";
import { playlistService } from "@/services/playlistService";
import { safeCreateClient } from "@/lib/supabase/client";
import { localFavoritePlaylists } from "@/services/localStorageDB";
import { useCallback } from "react";

export function useLibrary() {
  const userId = useUserStore((s) => s.user?.id);
  const { favoritePlaylistIds, setFavoritePlaylistIds, toggleFavoriteOptimistic } =
    useLibraryStore();
  const queryClient = useQueryClient();

  const favIdsQuery = useQuery({
    queryKey: ["favorite-playlist-ids", userId],
    queryFn: async () => {
      const supabase = safeCreateClient();
      if (!supabase) return new Set(localFavoritePlaylists.getIds(userId!));

      const { data } = await supabase
        .from("favorite_playlists")
        .select("playlist_id")
        .eq("user_id", userId!);
      return new Set((data as { playlist_id: string }[] | null)?.map((r) => r.playlist_id) ?? []);
    },
    enabled: !!userId,
    staleTime: 30_000,
  });

  if (favIdsQuery.data && favIdsQuery.data.size !== favoritePlaylistIds.size) {
    setFavoritePlaylistIds(Array.from(favIdsQuery.data));
  }

  const favPlaylistsQuery = useQuery({
    queryKey: ["favorite-playlists", userId],
    queryFn: () => playlistService.getFavoritePlaylists(userId!),
    enabled: !!userId,
    staleTime: 30_000,
  });

  const toggleFavMutation = useMutation({
    mutationFn: (playlistId: string) => {
      const isFav = favoritePlaylistIds.has(playlistId);
      return playlistService.toggleFavorite(userId!, playlistId, isFav);
    },
    onMutate: async (playlistId) => {
      await queryClient.cancelQueries({ queryKey: ["favorite-playlist-ids", userId] });
      toggleFavoriteOptimistic(playlistId);
    },
    onError: (_err, playlistId) => {
      toggleFavoriteOptimistic(playlistId);
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["favorite-playlist-ids", userId] });
      queryClient.invalidateQueries({ queryKey: ["favorite-playlists", userId] });
    },
  });

  const toggleFavoritePlaylist = useCallback(
    (playlistId: string) => toggleFavMutation.mutate(playlistId),
    [toggleFavMutation],
  );

  const isFavorited = useCallback(
    (playlistId: string) => favoritePlaylistIds.has(playlistId),
    [favoritePlaylistIds],
  );

  return {
    favoritePlaylists: favPlaylistsQuery.data ?? [],
    favoritePlaylistIds,
    isFavorited,
    toggleFavoritePlaylist,
    isLoading: favPlaylistsQuery.isLoading,
  };
}

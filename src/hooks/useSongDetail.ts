"use client";

import { useQuery } from "@tanstack/react-query";
import { songService } from "@/services/songService";
import type { Song } from "@/types";

export function useSongDetail(songId: string | undefined) {
  return useQuery({
    queryKey: ["song-detail", songId],
    queryFn: async (): Promise<Song | null> => {
      if (!songId) return null;
      return songService.getSongById(songId);
    },
    enabled: !!songId,
    staleTime: 60_000,
  });
}

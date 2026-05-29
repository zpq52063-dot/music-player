"use client";

import { usePlaylist } from "@/hooks/usePlaylist";
import { PlaylistCard } from "./PlaylistCard";

export function PlaylistList() {
  const { playlists, isLoading } = usePlaylist();

  if (isLoading) {
    return (
      <div className="grid grid-cols-2 gap-3">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="animate-shimmer rounded-apple-lg bg-surface-elevated p-4">
            <div className="mb-3 aspect-square rounded-apple bg-surface-highlight" />
            <div className="h-4 w-20 rounded bg-surface-highlight" />
          </div>
        ))}
      </div>
    );
  }

  if (playlists.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <p className="text-text-tertiary">还没有歌单</p>
        <p className="mt-1 text-sm text-text-tertiary">点击右上角「新建」创建你的第一个歌单</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 gap-3">
      {playlists.map((pl) => (
        <PlaylistCard key={pl.id} playlist={pl} />
      ))}
    </div>
  );
}

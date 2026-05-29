"use client";

import { useRecentPlayed } from "@/hooks/useRecentPlayed";
import { SongRow } from "@/components/home/SongRow";

export function RecentPlaysList() {
  const { recentPlays, isLoading } = useRecentPlayed();

  if (isLoading) {
    return (
      <div className="space-y-1">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="flex items-center gap-3 rounded-apple p-2">
            <div className="h-11 w-11 animate-shimmer rounded-apple bg-surface-elevated" />
            <div className="flex-1 space-y-2">
              <div className="h-4 w-32 animate-shimmer rounded bg-surface-elevated" />
              <div className="h-3 w-20 animate-shimmer rounded bg-surface-elevated" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (recentPlays.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <p className="text-text-tertiary">还没有播放记录</p>
        <p className="mt-1 text-sm text-text-tertiary">播放歌曲后会自动记录在这里</p>
      </div>
    );
  }

  return (
    <div className="space-y-1">
      {recentPlays.map((song, i) => (
        <SongRow key={song.id} song={song} index={i} />
      ))}
    </div>
  );
}

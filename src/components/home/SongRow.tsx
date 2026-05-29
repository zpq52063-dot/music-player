"use client";

import { memo } from "react";
import { IconPlayerPlay, IconHeart } from "@tabler/icons-react";
import { clsx } from "clsx";
import { LazyImage } from "@/components/ui/LazyImage";
import { useMusicPlayerStore } from "@/stores/musicPlayerStore";
import type { SongWithMeta } from "@/types";

interface SongRowProps {
  song: SongWithMeta;
  index: number;
}

export const SongRow = memo(function SongRow({ song, index }: SongRowProps) {
  const currentSong = useMusicPlayerStore((s) => s.currentSong);
  const isPlaying = useMusicPlayerStore((s) => s.isPlaying);
  const play = useMusicPlayerStore((s) => s.play);
  const togglePlay = useMusicPlayerStore((s) => s.togglePlay);

  const isCurrentSong = currentSong?.id === song.id;

  const handlePlay = () => {
    if (isCurrentSong) {
      togglePlay();
    } else {
      play(song);
    }
  };

  return (
    <button
      onClick={handlePlay}
      className={clsx(
        "flex w-full items-center gap-3 rounded-apple-lg px-3 py-2 text-left transition-all active:bg-white/5",
        isCurrentSong && "bg-white/5",
      )}
    >
      {/* 序号 / 播放状态 */}
      <span className="w-6 text-center text-xs tabular-nums text-text-tertiary">
        {isCurrentSong && isPlaying ? (
          <span className="inline-block h-3 w-3 bg-accent-primary rounded-sm animate-pulse-subtle" />
        ) : (
          index + 1
        )}
      </span>

      {/* 封面 */}
      <LazyImage src={song.cover_url} alt={song.title} size={44} rounded="md" />

      {/* 信息 */}
      <div className="min-w-0 flex-1">
        <p className={clsx("text-truncate text-sm", isCurrentSong && "text-accent-primary")}>
          {song.title}
        </p>
        <p className="text-truncate text-xs text-text-secondary">{song.artist}</p>
      </div>

      {/* 操作 */}
      <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
        {song.isLiked && <IconHeart size={14} className="text-accent-primary" fill="currentColor" />}
        <IconPlayerPlay size={14} className="text-text-tertiary" />
      </div>
    </button>
  );
});

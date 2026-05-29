"use client";

import { useEffect, useState } from "react";
import { getTopSongs } from "@/services/analyticsService";
import { mockSongs } from "@/music-source/providers/mock/data";
import { useMusicPlayerStore } from "@/stores/musicPlayerStore";
import { LazyImage } from "@/components/ui/LazyImage";
import { IconPlayerPlay } from "@tabler/icons-react";
import type { SongPlayCount } from "@/types/phase15";
import type { Song } from "@/types";

export function HighFrequencySongsSection() {
  const [topSongs, setTopSongs] = useState<(SongPlayCount & { song?: Song })[]>([]);

  useEffect(() => {
    const tops = getTopSongs(10);
    const enriched = tops.map((t) => ({
      ...t,
      song: mockSongs.find((s) => s.id === t.songId),
    }));
    setTopSongs(enriched);
  }, []);

  const currentSong = useMusicPlayerStore((s) => s.currentSong);
  const isPlaying = useMusicPlayerStore((s) => s.isPlaying);
  const play = useMusicPlayerStore((s) => s.play);
  const togglePlay = useMusicPlayerStore((s) => s.togglePlay);

  if (topSongs.length === 0) return null;

  return (
    <section>
      <h2 className="mb-3 px-1 text-lg font-semibold text-text-primary">高频播放</h2>
      <div className="space-y-0.5">
        {topSongs.map((item, i) => {
          const song = item.song;
          if (!song) return null;
          const isCurrent = currentSong?.id === song.id;

          return (
            <button
              key={item.songId}
              onClick={() => {
                if (isCurrent) togglePlay();
                else play(song);
              }}
              className="flex w-full items-center gap-3 rounded-apple-lg px-3 py-2 text-left transition-all active:bg-white/5"
            >
              <span className="w-6 text-center text-xs tabular-nums text-text-tertiary">
                {isCurrent && isPlaying ? (
                  <span className="inline-block h-3 w-3 bg-accent-primary rounded-sm animate-pulse-subtle" />
                ) : (
                  i + 1
                )}
              </span>
              <LazyImage src={song.cover_url} alt={song.title} size={40} rounded="md" />
              <div className="min-w-0 flex-1">
                <p className={`text-sm truncate ${isCurrent ? "text-accent-primary" : "text-text-primary"}`}>
                  {song.title}
                </p>
                <p className="text-xs text-text-secondary truncate">{song.artist}</p>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs text-text-tertiary">{item.playCount}次</span>
                <IconPlayerPlay size={14} className="text-text-tertiary" />
              </div>
            </button>
          );
        })}
      </div>
    </section>
  );
}

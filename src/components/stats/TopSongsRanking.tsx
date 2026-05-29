"use client";

import { useEffect, useState } from "react";
import { getTopSongs } from "@/services/analyticsService";
import { mockSongs } from "@/music-source/providers/mock/data";
import { useMusicPlayerStore } from "@/stores/musicPlayerStore";
import { LazyImage } from "@/components/ui/LazyImage";
import { IconPlayerPlay } from "@tabler/icons-react";
import type { SongPlayCount } from "@/types/phase15";
import type { Song } from "@/types";

export function TopSongsRanking() {
  const [items, setItems] = useState<(SongPlayCount & { song?: Song })[]>([]);

  useEffect(() => {
    const tops = getTopSongs(10);
    setItems(tops.map((t) => ({ ...t, song: mockSongs.find((s) => s.id === t.songId) })));
  }, []);

  const currentSong = useMusicPlayerStore((s) => s.currentSong);
  const play = useMusicPlayerStore((s) => s.play);
  const togglePlay = useMusicPlayerStore((s) => s.togglePlay);

  if (items.length === 0) return null;

  return (
    <section>
      <h2 className="mb-3 px-1 text-lg font-semibold text-text-primary">最常播放</h2>
      <div className="space-y-0.5">
        {items.map((item, i) => {
          const song = item.song;
          if (!song) return null;
          const isCurrent = currentSong?.id === song.id;
          return (
            <button
              key={item.songId}
              onClick={() => (isCurrent ? togglePlay() : play(song))}
              className="flex w-full items-center gap-3 rounded-apple-lg px-3 py-2 text-left transition-all active:bg-white/5"
            >
              <span className={`w-6 text-center text-sm font-bold tabular-nums ${
                i < 3 ? "text-accent-primary" : "text-text-tertiary"
              }`}>
                {i + 1}
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

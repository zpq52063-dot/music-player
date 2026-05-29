"use client";

import { useRecentPlayed } from "@/hooks/useRecentPlayed";
import { useMusicPlayerStore } from "@/stores/musicPlayerStore";
import { LazyImage } from "@/components/ui/LazyImage";
import { IconPlayerPlay } from "@tabler/icons-react";

export function RecentlyPlayedCarousel() {
  const { recentPlays } = useRecentPlayed();
  const play = useMusicPlayerStore((s) => s.play);

  if (recentPlays.length === 0) return null;

  return (
    <section>
      <h2 className="mb-3 px-1 text-lg font-semibold text-text-primary">最近播放</h2>
      <div className="flex gap-3 overflow-x-auto px-1 pb-1 -mx-1 scrollbar-hide snap-x">
        {recentPlays.slice(0, 10).map((song) => (
          <button
            key={song.id}
            onClick={() => play(song)}
            className="flex flex-col gap-1.5 shrink-0 w-[120px] snap-start text-left"
          >
            <div className="relative">
              <LazyImage
                src={song.cover_url}
                alt={song.title}
                size={120}
                rounded="lg"
              />
              <div className="absolute bottom-1 right-1 flex h-7 w-7 items-center justify-center rounded-full bg-accent-primary/90 shadow-lg">
                <IconPlayerPlay size={12} className="text-white" fill="white" />
              </div>
            </div>
            <p className="text-xs font-medium text-text-primary truncate">{song.title}</p>
            <p className="text-xs text-text-secondary truncate">{song.artist}</p>
          </button>
        ))}
      </div>
    </section>
  );
}

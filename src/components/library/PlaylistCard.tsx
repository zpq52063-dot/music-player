"use client";

import Link from "next/link";
import { IconMusic } from "@tabler/icons-react";
import { GlassCard } from "@/components/ui/GlassCard";
import { LazyImage } from "@/components/ui/LazyImage";
import type { UserPlaylist } from "@/types";

interface Props {
  playlist: UserPlaylist;
}

export function PlaylistCard({ playlist }: Props) {
  return (
    <Link href={`/playlist/${playlist.id}`}>
      <GlassCard
        className="group block p-3 transition-transform active:scale-95"
        padding="none"
      >
        {/* Cover */}
        <div className="mb-3 flex aspect-square items-center justify-center rounded-apple bg-gradient-to-br from-accent-primary/30 to-accent-secondary/30">
          {playlist.cover ? (
            <LazyImage
              src={playlist.cover}
              alt={playlist.title}
              width={160}
              height={160}
              rounded="lg"
              className="h-full w-full"
            />
          ) : (
            <IconMusic size={32} className="text-text-tertiary" />
          )}
        </div>

        {/* Info */}
        <div className="px-1">
          <p className="truncate text-sm font-medium text-text-primary">{playlist.title}</p>
          <p className="mt-0.5 text-xs text-text-tertiary">
            {playlist.song_count ?? 0} 首
          </p>
        </div>
      </GlassCard>
    </Link>
  );
}

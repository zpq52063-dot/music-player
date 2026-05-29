"use client";

import { IconMusic, IconPlaylist, IconUser } from "@tabler/icons-react";
import { SongRow } from "@/components/home/SongRow";
import { GlassCard } from "@/components/ui/GlassCard";
import type { SearchResult } from "@/types";
import type { SongWithMeta } from "@/types";

interface SearchResultsViewProps {
  results: SearchResult;
  query: string;
}

export function SearchResultsView({ results, query }: SearchResultsViewProps) {
  const { songs, playlists, artists, total } = results;

  if (total === 0) {
    return (
      <div className="flex flex-col items-center gap-3 py-16 text-text-tertiary">
        <IconMusic size={40} stroke={1} />
        <p className="text-sm">未找到 &ldquo;{query}&rdquo; 相关结果</p>
        <p className="text-xs text-text-tertiary/60">尝试其他关键词搜索</p>
      </div>
    );
  }

  const songsWithMeta: SongWithMeta[] = songs.map((s) => ({ ...s, isLiked: false }));

  return (
    <div className="space-y-6 pb-36">
      {/* 歌曲 */}
      {songs.length > 0 && (
        <section>
          <div className="mb-2 flex items-center gap-2 px-1">
            <IconMusic size={16} className="text-accent-primary" />
            <h3 className="text-sm font-medium text-text-primary">
              歌曲 <span className="text-text-tertiary">({songs.length})</span>
            </h3>
          </div>
          <div className="-mx-1">
            {songsWithMeta.map((song, i) => (
              <SongRow key={song.id} song={song} index={i} />
            ))}
          </div>
        </section>
      )}

      {/* 歌单 */}
      {playlists.length > 0 && (
        <section>
          <div className="mb-3 flex items-center gap-2 px-1">
            <IconPlaylist size={16} className="text-accent-primary" />
            <h3 className="text-sm font-medium text-text-primary">
              歌单 <span className="text-text-tertiary">({playlists.length})</span>
            </h3>
          </div>
          <div className="grid grid-cols-2 gap-3">
            {playlists.map((pl) => (
              <GlassCard key={pl.id} variant="light" padding="sm" interactive>
                <div className="flex items-center gap-2.5">
                  <div className="flex h-11 w-11 items-center justify-center rounded-apple-lg bg-accent-primary/15">
                    <IconPlaylist size={20} className="text-accent-primary" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-truncate text-xs font-medium text-text-primary">
                      {pl.name}
                    </p>
                    <p className="text-truncate text-[11px] text-text-tertiary">
                      {pl.description}
                    </p>
                  </div>
                </div>
              </GlassCard>
            ))}
          </div>
        </section>
      )}

      {/* 艺术家 */}
      {artists.length > 0 && (
        <section>
          <div className="mb-3 flex items-center gap-2 px-1">
            <IconUser size={16} className="text-accent-primary" />
            <h3 className="text-sm font-medium text-text-primary">
              艺术家 <span className="text-text-tertiary">({artists.length})</span>
            </h3>
          </div>
          <div className="flex gap-3 overflow-x-auto pb-1">
            {artists.map((artist) => (
              <button
                key={artist.id}
                className="flex flex-shrink-0 flex-col items-center gap-2 rounded-apple-lg p-3 transition-all active:scale-95 active:bg-white/5"
              >
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-white/10">
                  <IconUser size={28} className="text-text-secondary" />
                </div>
                <span className="w-16 text-truncate text-center text-xs text-text-secondary">
                  {artist.name}
                </span>
              </button>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

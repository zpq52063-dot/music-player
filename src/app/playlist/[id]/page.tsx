"use client";

import { useParams, useRouter } from "next/navigation";
import { IconChevronLeft, IconPlayerPlay, IconTrash, IconHeart, IconShare, IconDots } from "@tabler/icons-react";
import { usePlaylist } from "@/hooks/usePlaylist";
import { useLibrary } from "@/hooks/useLibrary";
import { useMusicPlayerStore } from "@/stores/musicPlayerStore";
import { SongRow } from "@/components/home/SongRow";
import { IconButton } from "@/components/ui/IconButton";
import { LazyImage } from "@/components/ui/LazyImage";
import { Skeleton } from "@/components/ui/Skeleton";

export default function PlaylistDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { playlistDetail, deletePlaylist, isLoading } = usePlaylist(id);
  const { isFavorited, toggleFavoritePlaylist } = useLibrary();
  const setQueue = useMusicPlayerStore((s) => s.setQueue);

  if (isLoading) {
    return (
      <div className="flex min-h-[100dvh] flex-col bg-background">
        <div className="flex items-center gap-3 px-4 pt-6">
          <Skeleton variant="circular" width={36} height={36} />
        </div>
        <div className="flex flex-col items-center px-6 pt-8">
          <Skeleton variant="rectangular" width={200} height={200} className="rounded-[20px]" />
          <Skeleton variant="text" width="60%" height={24} className="mt-4" />
          <Skeleton variant="text" width="40%" height={16} className="mt-2" />
        </div>
      </div>
    );
  }

  if (!playlistDetail) {
    return (
      <div className="flex h-[100dvh] flex-col items-center justify-center bg-background px-4">
        <p className="text-text-tertiary">歌单不存在或已被删除</p>
        <button onClick={() => router.back()} className="mt-4 text-accent-primary">
          返回
        </button>
      </div>
    );
  }

  const { title, cover, description, songs } = playlistDetail;
  const fav = isFavorited(id);

  const handlePlayAll = () => {
    if (songs.length > 0) {
      setQueue(songs, 0);
    }
  };

  const handleDelete = async () => {
    if (confirm("确定要删除这个歌单吗？")) {
      await deletePlaylist(id);
      router.back();
    }
  };

  return (
    <div className="flex min-h-[100dvh] flex-col bg-background pb-28">
      {/* Background */}
      <div className="absolute inset-0 h-72 overflow-hidden">
        {cover && (
          <div
            className="absolute inset-0 scale-110 bg-cover bg-center opacity-30 blur-2xl"
            style={{ backgroundImage: `url(${cover})` }}
          />
        )}
        <div className="absolute inset-0 bg-gradient-to-b from-transparent to-background" />
      </div>

      {/* Header */}
      <div className="relative z-10 flex items-center justify-between px-4 pt-6">
        <IconButton size="md" onClick={() => router.back()}>
          <IconChevronLeft size={20} />
        </IconButton>
        <div className="flex gap-1">
          <IconButton size="md">
            <IconShare size={18} className="text-text-secondary" />
          </IconButton>
          <IconButton size="md">
            <IconDots size={18} className="text-text-secondary" />
          </IconButton>
        </div>
      </div>

      {/* Playlist Info */}
      <div className="relative z-10 flex flex-col items-center px-6 pt-2">
        <LazyImage
          src={cover}
          alt={title}
          size={200}
          rounded="lg"
        />

        <h1 className="mt-5 text-center text-xl font-bold text-text-primary">{title}</h1>

        {description && (
          <p className="mt-2 text-center text-sm leading-relaxed text-text-tertiary line-clamp-3">
            {description}
          </p>
        )}

        <div className="mt-3 flex items-center gap-2 text-xs text-text-tertiary">
          <span>{songs.length} 首歌曲</span>
        </div>

        {/* Actions */}
        <div className="mt-6 flex items-center gap-6">
          {songs.length > 0 && (
            <button
              onClick={handlePlayAll}
              className="inline-flex items-center gap-2 rounded-full bg-accent-primary px-7 py-2.5 text-sm font-medium text-white active:scale-95 transition-transform"
            >
              <IconPlayerPlay size={18} fill="currentColor" />
              播放全部
            </button>
          )}

          <button
            onClick={() => toggleFavoritePlaylist(id)}
            className="flex flex-col items-center gap-0.5"
          >
            <IconHeart
              size={22}
              className={fav ? "fill-accent-primary text-accent-primary" : "text-text-secondary"}
            />
            <span className="text-[10px] text-text-tertiary">
              {fav ? "已收藏" : "收藏"}
            </span>
          </button>

          <button onClick={handleDelete} className="flex flex-col items-center gap-0.5">
            <IconTrash size={20} className="text-text-tertiary" />
            <span className="text-[10px] text-text-tertiary">删除</span>
          </button>
        </div>
      </div>

      {/* Song list */}
      <div className="relative z-10 mt-6 flex-1 border-t border-white/5">
        {songs.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20">
            <p className="text-text-tertiary">歌单中还没有歌曲</p>
          </div>
        ) : (
          <div className="space-y-1 pt-2">
            {songs.map((song, i) => (
              <SongRow key={song.id} song={song} index={i} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

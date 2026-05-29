"use client";

import { useParams, useRouter } from "next/navigation";
import { IconChevronLeft, IconPlayerPlay, IconHeart, IconShare, IconDots } from "@tabler/icons-react";
import { AlbumCover } from "@/components/player/AlbumCover";
import { IconButton } from "@/components/ui/IconButton";
import { Skeleton } from "@/components/ui/Skeleton";
import { CommentList } from "@/components/comments/CommentList";
import { useSongDetail } from "@/hooks/useSongDetail";
import { useMusicPlayerStore } from "@/stores/musicPlayerStore";
import { useLikedSongs } from "@/hooks/useLikedSongs";

export default function SongDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { data: song, isLoading } = useSongDetail(id);
  const play = useMusicPlayerStore((s) => s.play);
  const currentSong = useMusicPlayerStore((s) => s.currentSong);
  const isPlaying = useMusicPlayerStore((s) => s.isPlaying);
  const togglePlay = useMusicPlayerStore((s) => s.togglePlay);
  const { isLiked, toggleLike } = useLikedSongs();

  if (isLoading) {
    return (
      <div className="flex min-h-[100dvh] flex-col bg-background">
        <div className="flex items-center gap-3 px-4 pt-6">
          <Skeleton variant="circular" width={36} height={36} />
        </div>
        <div className="flex flex-col items-center px-6 pt-8">
          <Skeleton variant="rectangular" width={280} height={280} className="rounded-[24px]" />
          <Skeleton variant="text" width="60%" height={24} className="mt-6" />
          <Skeleton variant="text" width="40%" height={16} className="mt-2" />
        </div>
        <div className="mt-8 px-4">
          <Skeleton variant="text" width="100%" height={12} />
          <Skeleton variant="text" width="100%" height={12} className="mt-3" />
          <Skeleton variant="text" width="80%" height={12} className="mt-3" />
        </div>
      </div>
    );
  }

  if (!song) {
    return (
      <div className="flex h-[100dvh] flex-col items-center justify-center bg-background px-4">
        <p className="text-text-tertiary">歌曲不存在或已下架</p>
        <button onClick={() => router.back()} className="mt-4 text-accent-primary">
          返回
        </button>
      </div>
    );
  }

  const isCurrentSong = currentSong?.id === song.id;
  const liked = isLiked(song.id);

  const handlePlay = () => {
    if (isCurrentSong) {
      togglePlay();
    } else {
      play(song);
    }
  };

  return (
    <div className="flex min-h-[100dvh] flex-col bg-background pb-28">
      {/* Background */}
      <div className="absolute inset-0 h-80 overflow-hidden">
        {song.cover_url && (
          <div
            className="absolute inset-0 scale-110 bg-cover bg-center opacity-40 blur-2xl"
            style={{ backgroundImage: `url(${song.cover_url})` }}
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

      {/* Song Info Section */}
      <div className="relative z-10 flex flex-col items-center px-6 pt-4">
        {/* Cover */}
        <div className="relative">
          <AlbumCover
            src={song.cover_url}
            alt={song.title}
            size="xl"
            isPlaying={isCurrentSong && isPlaying}
          />
        </div>

        {/* Title & Artist */}
        <h1 className="mt-6 text-center text-2xl font-bold text-text-primary">{song.title}</h1>
        <p className="mt-1.5 text-center text-base text-text-secondary">{song.artist}</p>

        {/* Meta */}
        <div className="mt-3 flex items-center gap-3 text-xs text-text-tertiary">
          {song.album && <span>专辑: {song.album}</span>}
          {song.genre && <span>{song.genre}</span>}
          {song.duration > 0 && (
            <span>
              {Math.floor(song.duration / 60)}:
              {String(song.duration % 60).padStart(2, "0")}
            </span>
          )}
        </div>

        {/* Actions */}
        <div className="mt-6 flex items-center gap-6">
          <button
            onClick={handlePlay}
            className="inline-flex items-center gap-2 rounded-full bg-accent-primary px-8 py-3 text-sm font-medium text-white active:scale-95 transition-transform"
          >
            <IconPlayerPlay size={18} fill="currentColor" />
            {isCurrentSong && isPlaying ? "暂停" : "播放"}
          </button>

          <button
            onClick={() => toggleLike(song.id)}
            className="flex flex-col items-center gap-0.5"
          >
            <IconHeart
              size={22}
              className={liked ? "fill-accent-primary text-accent-primary" : "text-text-secondary"}
            />
            <span className="text-[10px] text-text-tertiary">
              {liked ? "已喜欢" : "喜欢"}
            </span>
          </button>
        </div>
      </div>

      {/* Comments Section */}
      <div className="relative z-10 mt-6 border-t border-white/5">
        <div className="px-4 pt-4 pb-2">
          <h2 className="text-base font-semibold text-text-primary">评论</h2>
        </div>
        <CommentList songId={id} />
      </div>
    </div>
  );
}

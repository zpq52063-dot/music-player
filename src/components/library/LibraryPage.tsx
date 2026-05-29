"use client";

import { useState } from "react";
import { IconHeart, IconPlaylist, IconClock, IconPlus } from "@tabler/icons-react";
import { usePlaylistStore } from "@/stores/playlistStore";
import { usePlaylist } from "@/hooks/usePlaylist";
import { LikedSongsList } from "./LikedSongsList";
import { PlaylistList } from "./PlaylistList";
import { RecentPlaysList } from "./RecentPlaysList";
import { GlassCard } from "@/components/ui/GlassCard";
import { cn } from "@/lib/utils";

type Tab = "likes" | "playlists" | "recent";

export function LibraryPage() {
  const [tab, setTab] = useState<Tab>("likes");
  const { openCreateModal } = usePlaylistStore();
  const { createPlaylist } = usePlaylist();

  const tabs: { key: Tab; label: string; icon: React.ReactNode }[] = [
    { key: "likes", label: "喜欢", icon: <IconHeart size={20} /> },
    { key: "playlists", label: "歌单", icon: <IconPlaylist size={20} /> },
    { key: "recent", label: "最近", icon: <IconClock size={20} /> },
  ];

  return (
    <div className="flex h-full flex-col px-4 pt-6">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-text-primary">我的音乐</h1>
      </div>

      {/* Tabs */}
      <div className="mb-6 flex gap-2">
        {tabs.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={cn(
              "inline-flex items-center gap-1.5 rounded-full px-4 py-2 text-sm font-medium transition-colors",
              tab === t.key
                ? "bg-accent-primary text-white"
                : "bg-surface-elevated text-text-secondary hover:text-text-primary",
            )}
          >
            {t.icon}
            {t.label}
          </button>
        ))}

        {tab === "playlists" && (
          <button
            onClick={openCreateModal}
            className="ml-auto inline-flex items-center gap-1 rounded-full bg-surface-elevated px-3 py-2 text-sm text-accent-primary transition-colors hover:bg-surface-highlight"
          >
            <IconPlus size={18} />
            新建
          </button>
        )}
      </div>

      {/* Content */}
      <div className="flex-1 pb-36">
        {tab === "likes" && <LikedSongsList />}
        {tab === "playlists" && <PlaylistList />}
        {tab === "recent" && <RecentPlaysList />}
      </div>

      {/* Create Playlist Modal */}
      <CreatePlaylistModal onConfirm={createPlaylist} />
    </div>
  );
}

function CreatePlaylistModal({ onConfirm }: { onConfirm: (title: string, desc?: string) => void }) {
  const { isCreateModalOpen, closeCreateModal } = usePlaylistStore();

  if (!isCreateModalOpen) return null;

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.currentTarget;
    const data = new FormData(form);
    const title = data.get("title") as string;
    const desc = data.get("description") as string;
    if (title.trim()) {
      onConfirm(title.trim(), desc.trim() || undefined);
      form.reset();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/60" onClick={closeCreateModal}>
      <GlassCard
        className="w-full max-w-md animate-slide-up rounded-b-none px-6 py-6"
        padding="none"
        onClick={(e: React.MouseEvent) => e.stopPropagation()}
      >
        <form onSubmit={handleSubmit}>
          <h2 className="mb-4 text-lg font-semibold text-text-primary">新建歌单</h2>
          <input
            name="title"
            placeholder="歌单名称"
            maxLength={50}
            required
            autoFocus
            className="mb-3 w-full rounded-apple bg-surface-elevated px-4 py-3 text-text-primary placeholder-text-tertiary outline-none"
          />
          <input
            name="description"
            placeholder="描述（选填）"
            maxLength={200}
            className="mb-4 w-full rounded-apple bg-surface-elevated px-4 py-3 text-text-primary placeholder-text-tertiary outline-none"
          />
          <div className="flex gap-3">
            <button
              type="button"
              onClick={closeCreateModal}
              className="flex-1 rounded-apple bg-surface-elevated py-3 text-sm font-medium text-text-secondary"
            >
              取消
            </button>
            <button
              type="submit"
              className="flex-1 rounded-apple bg-accent-primary py-3 text-sm font-medium text-white"
            >
              创建
            </button>
          </div>
        </form>
      </GlassCard>
    </div>
  );
}

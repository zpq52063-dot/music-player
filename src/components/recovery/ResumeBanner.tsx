"use client";

import { useEffect, useState } from "react";
import { IconPlayerPlay, IconX } from "@tabler/icons-react";
import { useMusicPlayerStore } from "@/stores/musicPlayerStore";
import { useUIStore } from "@/stores/uiStore";
import { loadRecoveryState, clearRecoveryState } from "@/services/recovery/PlaybackRecoverySystem";
import { mockSongs } from "@/music-source/providers/mock/data";
import { formatTime } from "@/lib/utils";
import type { RecoveryState } from "@/types/recovery";

export function ResumeBanner() {
  const [state, setState] = useState<RecoveryState | null>(null);
  const [visible, setVisible] = useState(false);

  const play = useMusicPlayerStore((s) => s.play);
  const setQueue = useMusicPlayerStore((s) => s.setQueue);
  const seek = useMusicPlayerStore((s) => s.seek);
  const expandPlayer = useUIStore((s) => s.expandPlayer);

  useEffect(() => {
    const result = loadRecoveryState();
    if (
      result.hasRecoveryData &&
      result.state?.songId &&
      !result.isStale &&
      result.secondsSinceSave !== null &&
      result.secondsSinceSave < 3600
    ) {
      setState(result.state);
      setVisible(true);
    }
  }, []);

  if (!visible || !state) return null;

  const savedSong = mockSongs.find((s) => s.id === state.songId);

  const handleResume = () => {
    if (!savedSong) return;
    const queue = state.queueIds
      .map((id) => mockSongs.find((s) => s.id === id))
      .filter((s): s is typeof mockSongs[number] => s !== undefined);

    if (queue.length > 0) {
      setQueue(queue, state.queueIndex >= 0 ? state.queueIndex : 0);
    } else {
      play(savedSong);
    }
    seek(state.position);
    expandPlayer();
    setVisible(false);
  };

  const handleDismiss = () => {
    clearRecoveryState();
    setVisible(false);
  };

  return (
    <div
      className="rounded-apple-xl glass-heavy p-4 flex items-center gap-3"
      style={{ animation: "fadeIn 0.4s ease-out" }}
    >
      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-accent-primary/20">
        <IconPlayerPlay size={18} className="text-accent-primary" fill="currentColor" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium text-text-primary truncate">
          继续播放 {savedSong ? `"${savedSong.title}"` : ""}？
        </p>
        {savedSong && (
          <p className="text-xs text-text-secondary">
            {savedSong.artist} · {formatTime(state.position)}
          </p>
        )}
      </div>
      <div className="flex items-center gap-2 shrink-0">
        <button
          onClick={handleResume}
          className="rounded-apple-lg bg-accent-primary px-3 py-1.5 text-xs font-medium text-white"
        >
          继续
        </button>
        <button onClick={handleDismiss} className="text-text-tertiary">
          <IconX size={16} />
        </button>
      </div>
    </div>
  );
}

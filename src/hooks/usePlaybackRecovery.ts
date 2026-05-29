/**
 * Phase 8 — 播放恢复 Hook
 *
 * 挂载在 AudioProvider 中，自动进行:
 * - 每 5 秒自动保存播放状态
 * - APP 启动时恢复上次播放
 * - beforeunload 紧急保存
 * - 播放停止时清除恢复数据
 */

"use client";

import { useEffect, useRef, useCallback } from "react";
import { useMusicPlayerStore } from "@/stores/musicPlayerStore";
import { useProviderStore } from "@/stores/providerStore";
import {
  saveRecoveryState,
  loadRecoveryState,
  clearRecoveryState,
  getAutoSaveInterval,
  createRecoveryState,
} from "@/services/recovery/PlaybackRecoverySystem";
import type { RecoveryState } from "@/types/recovery";

export function usePlaybackRecovery() {
  const autoSaveRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const hasRestoredRef = useRef(false);

  // Build recovery state from current stores
  const buildRecoveryState = useCallback((): RecoveryState => {
    const player = useMusicPlayerStore.getState();
    const provider = useProviderStore.getState();

    return createRecoveryState({
      songId: player.currentSong?.id ?? null,
      position: player.currentTime,
      queueIds: player.queue.map((s) => s.id),
      queueIndex: player.queueIndex,
      volume: player.volume,
      isMuted: player.isMuted,
      playMode: player.playMode,
      providerType: provider.currentProvider,
      wasPlaying: player.isPlaying,
    });
  }, []);

  // Save current state
  const saveState = useCallback(() => {
    const state = buildRecoveryState();
    if (state.songId) {
      saveRecoveryState(state);
    }
  }, [buildRecoveryState]);

  // Restore on mount
  useEffect(() => {
    if (hasRestoredRef.current) return;
    hasRestoredRef.current = true;

    const result = loadRecoveryState();
    if (!result.hasRecoveryData || !result.state?.songId) return;

    // Only restore if fresh enough (< 24h)
    if (result.isStale) {
      clearRecoveryState();
      return;
    }

    const state = result.state;

    // Restore volume and mode (always safe)
    useMusicPlayerStore.getState().setVolume(state.volume);
    if (state.isMuted) useMusicPlayerStore.getState().toggleMute();
    useMusicPlayerStore.getState().setPlayMode(state.playMode);

    // Attempt to find the saved song from mock data and restore playback
    import("@/music-source/providers/mock/data").then(({ mockSongs }) => {
      const savedSong = mockSongs.find((s) => s.id === state.songId);
      if (savedSong) {
        // Build queue from saved IDs
        const queue = state.queueIds
          .map((id) => mockSongs.find((s) => s.id === id))
          .filter((s): s is typeof mockSongs[number] => s !== undefined);

        if (queue.length > 0) {
          useMusicPlayerStore.getState().setQueue(queue, state.queueIndex >= 0 ? state.queueIndex : 0);
        } else {
          useMusicPlayerStore.getState().play(savedSong);
        }

        // Restore position (but don't autoplay — iOS requires user gesture)
        useMusicPlayerStore.getState().pause();
        useMusicPlayerStore.getState().seek(state.position);

        console.log(
          `[Recovery] Restored: song=${savedSong.title}, queue=${queue.length}, position=${state.position}s`,
        );
      }
    }).catch(() => {
      // Mock data unavailable — recovery deferred
    });
  }, []);

  // Auto-save every 5 seconds while playing
  useEffect(() => {
    const interval = setInterval(() => {
      const player = useMusicPlayerStore.getState();
      if (player.isPlaying && player.currentSong) {
        saveState();
      }
    }, getAutoSaveInterval());

    autoSaveRef.current = interval;

    return () => {
      if (autoSaveRef.current) clearInterval(autoSaveRef.current);
    };
  }, [saveState]);

  // Emergency save on tab close / crash
  useEffect(() => {
    const handleBeforeUnload = () => {
      const player = useMusicPlayerStore.getState();
      if (player.isPlaying && player.currentSong) {
        saveState();
      }
    };

    window.addEventListener("beforeunload", handleBeforeUnload);
    window.addEventListener("pagehide", handleBeforeUnload);

    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
      window.removeEventListener("pagehide", handleBeforeUnload);
    };
  }, [saveState]);

  // Save state when playback starts/stops
  useEffect(() => {
    let lastSongId: string | undefined;
    let lastIsPlaying: boolean | undefined;

    const unsub = useMusicPlayerStore.subscribe((state) => {
      const songChanged = state.currentSong?.id !== lastSongId;
      const playingChanged = state.isPlaying !== lastIsPlaying;

      lastSongId = state.currentSong?.id;
      lastIsPlaying = state.isPlaying;

      if (state.currentSong && (songChanged || (playingChanged && state.isPlaying))) {
        saveState();
      }
    });

    return unsub;
  }, [saveState]);

  // Phase 15: Save immediately on seek jumps (>2s) for accurate position recovery
  useEffect(() => {
    const unsub = useMusicPlayerStore.subscribe((state, prev) => {
      const diff = Math.abs(state.currentTime - prev.currentTime);
      if (diff > 2 && state.currentSong) {
        saveState();
      }
    });
    return unsub;
  }, [saveState]);

  return { saveState, clearState: clearRecoveryState };
}

"use client";

import { useEffect, useRef } from "react";
import { useMusicPlayerStore } from "@/stores/musicPlayerStore";

/**
 * Media Session API — iOS Control Center / Lock Screen integration.
 * 同步 musicPlayerStore 到系统级媒体控制。
 *
 * 支持的 action handlers:
 * - play / pause / previoustrack / nexttrack
 * - seekto / seekbackward / seekforward
 * - stop (释放 media session)
 */
export function useMediaSession() {
  const currentSong = useMusicPlayerStore((s) => s.currentSong);
  const isPlaying = useMusicPlayerStore((s) => s.isPlaying);
  const duration = useMusicPlayerStore((s) => s.duration);

  const positionTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // ==================== Metadata — song change ====================

  useEffect(() => {
    if (typeof navigator === "undefined" || !("mediaSession" in navigator)) return;

    const song = useMusicPlayerStore.getState().currentSong;

    if (song) {
      const artwork: MediaImage[] = [];
      if (song.cover_url) {
        // 提供多种尺寸以适配不同设备（iPhone Lock Screen / Control Center / CarPlay）
        artwork.push(
          { src: song.cover_url, sizes: "96x96", type: "image/jpeg" },
          { src: song.cover_url, sizes: "192x192", type: "image/jpeg" },
          { src: song.cover_url, sizes: "256x256", type: "image/jpeg" },
          { src: song.cover_url, sizes: "384x384", type: "image/jpeg" },
          { src: song.cover_url, sizes: "512x512", type: "image/jpeg" },
        );
      }

      navigator.mediaSession.metadata = new MediaMetadata({
        title: song.title,
        artist: song.artist,
        album: song.album || "",
        artwork,
      });
    } else {
      navigator.mediaSession.metadata = null;
    }
  }, [currentSong?.id]);

  // ==================== Playback state ====================

  useEffect(() => {
    if (typeof navigator === "undefined" || !("mediaSession" in navigator)) return;
    navigator.mediaSession.playbackState = isPlaying ? "playing" : "paused";
  }, [isPlaying]);

  // ==================== Position state — debounced ~2s ====================

  useEffect(() => {
    if (typeof navigator === "undefined" || !("mediaSession" in navigator)) return;
    if (!isPlaying || duration <= 0) {
      if (positionTimerRef.current) {
        clearInterval(positionTimerRef.current);
        positionTimerRef.current = null;
      }
      return;
    }

    const updatePosition = () => {
      const state = useMusicPlayerStore.getState();
      if (state.duration > 0 && "setPositionState" in navigator.mediaSession) {
        try {
          navigator.mediaSession.setPositionState?.({
            duration: state.duration,
            playbackRate: state.playbackRate,
            position: state.currentTime,
          });
        } catch {
          // setPositionState may not be supported
        }
      }
    };

    updatePosition();
    positionTimerRef.current = setInterval(updatePosition, 2000);

    return () => {
      if (positionTimerRef.current) {
        clearInterval(positionTimerRef.current);
        positionTimerRef.current = null;
      }
    };
  }, [isPlaying, duration]);

  // ==================== Action handlers — mount once ====================

  useEffect(() => {
    if (typeof navigator === "undefined" || !("mediaSession" in navigator)) return;

    const SEEK_OFFSET = 10; // seconds

    navigator.mediaSession.setActionHandler("play", () => {
      useMusicPlayerStore.getState().togglePlay();
    });

    navigator.mediaSession.setActionHandler("pause", () => {
      useMusicPlayerStore.getState().pause();
    });

    navigator.mediaSession.setActionHandler("previoustrack", () => {
      useMusicPlayerStore.getState().prev();
    });

    navigator.mediaSession.setActionHandler("nexttrack", () => {
      useMusicPlayerStore.getState().next();
    });

    navigator.mediaSession.setActionHandler("seekto", (details) => {
      if (details.seekTime != null) {
        useMusicPlayerStore.getState().seek(details.seekTime);
      }
    });

    navigator.mediaSession.setActionHandler("seekbackward", (details) => {
      const offset = details.seekOffset ?? SEEK_OFFSET;
      const store = useMusicPlayerStore.getState();
      store.seek(Math.max(0, store.currentTime - offset));
    });

    navigator.mediaSession.setActionHandler("seekforward", (details) => {
      const offset = details.seekOffset ?? SEEK_OFFSET;
      const store = useMusicPlayerStore.getState();
      store.seek(Math.min(store.duration || 0, store.currentTime + offset));
    });

    navigator.mediaSession.setActionHandler("stop", () => {
      useMusicPlayerStore.getState().pause();
    });

    return () => {
      navigator.mediaSession.setActionHandler("play", null);
      navigator.mediaSession.setActionHandler("pause", null);
      navigator.mediaSession.setActionHandler("previoustrack", null);
      navigator.mediaSession.setActionHandler("nexttrack", null);
      navigator.mediaSession.setActionHandler("seekto", null);
      navigator.mediaSession.setActionHandler("seekbackward", null);
      navigator.mediaSession.setActionHandler("seekforward", null);
      navigator.mediaSession.setActionHandler("stop", null);
    };
  }, []);
}

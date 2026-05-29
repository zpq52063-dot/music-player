"use client";

import { useCallback } from "react";
import { useMusicPlayerStore } from "@/stores/musicPlayerStore";
import type { PlayMode } from "@/types";
import type { Song } from "@/types";

/**
 * 播放控制 hook — UI 组件专用
 * 封装常用控制操作，避免组件直接调用 store actions
 */
export function usePlayerControls() {
  const isPlaying = useMusicPlayerStore((s) => s.isPlaying);
  const loadingState = useMusicPlayerStore((s) => s.loadingState);
  const playMode = useMusicPlayerStore((s) => s.playMode);
  const currentSong = useMusicPlayerStore((s) => s.currentSong);

  const play = useCallback((song?: Song) => {
    useMusicPlayerStore.getState().play(song);
  }, []);

  const pause = useCallback(() => {
    useMusicPlayerStore.getState().pause();
  }, []);

  const togglePlay = useCallback(() => {
    useMusicPlayerStore.getState().togglePlay();
  }, []);

  const next = useCallback(() => {
    useMusicPlayerStore.getState().next();
  }, []);

  const prev = useCallback(() => {
    useMusicPlayerStore.getState().prev();
  }, []);

  const seek = useCallback((time: number) => {
    useMusicPlayerStore.getState().seek(time);
  }, []);

  const setVolume = useCallback((vol: number) => {
    useMusicPlayerStore.getState().setVolume(vol);
  }, []);

  const toggleMute = useCallback(() => {
    useMusicPlayerStore.getState().toggleMute();
  }, []);

  const setPlaybackRate = useCallback((rate: number) => {
    useMusicPlayerStore.getState().setPlaybackRate(rate);
  }, []);

  const cycleMode = useCallback(() => {
    useMusicPlayerStore.getState().cycleMode();
  }, []);

  const setPlayMode = useCallback((mode: PlayMode) => {
    useMusicPlayerStore.getState().setPlayMode(mode);
  }, []);

  const setQueue = useCallback((songs: Song[], startIndex?: number) => {
    useMusicPlayerStore.getState().setQueue(songs, startIndex);
  }, []);

  const addToQueue = useCallback((song: Song) => {
    useMusicPlayerStore.getState().addToQueue(song);
  }, []);

  return {
    isPlaying,
    isLoading: loadingState === "loading",
    hasError: loadingState === "error",
    playMode,
    currentSong,
    play,
    pause,
    togglePlay,
    next,
    prev,
    seek,
    setVolume,
    toggleMute,
    setPlaybackRate,
    cycleMode,
    setPlayMode,
    setQueue,
    addToQueue,
  };
}

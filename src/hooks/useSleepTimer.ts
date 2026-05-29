"use client";

import { useEffect, useRef } from "react";
import { useSleepTimerStore } from "@/stores/sleepTimerStore";
import { useMusicPlayerStore } from "@/stores/musicPlayerStore";
import { getAudioManager } from "@/lib/audio/AudioManager";

const TICK_INTERVAL = 250;
const FADE_START_THRESHOLD = 5000;
const FADE_DURATION = 5000;

export function useSleepTimer() {
  const isActive = useSleepTimerStore((s) => s.isActive);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const originalVolumeRef = useRef(0.8);

  useEffect(() => {
    if (!isActive) {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      return;
    }

    const state = useSleepTimerStore.getState();
    if (state.remainingMs <= FADE_START_THRESHOLD) {
      const playerState = useMusicPlayerStore.getState();
      originalVolumeRef.current = playerState.isMuted ? 0 : playerState.volume;
    }

    intervalRef.current = setInterval(() => {
      const s = useSleepTimerStore.getState();
      if (!s.isActive) {
        if (intervalRef.current) clearInterval(intervalRef.current);
        return;
      }

      const newRemaining = s.remainingMs - TICK_INTERVAL;

      if (newRemaining <= 0) {
        useMusicPlayerStore.getState().pause();
        getAudioManager().setVolume(originalVolumeRef.current);
        useSleepTimerStore.getState().complete();
        return;
      }

      if (newRemaining <= FADE_START_THRESHOLD) {
        const fadeElapsed = FADE_START_THRESHOLD - newRemaining;
        const progress = Math.min(fadeElapsed / FADE_DURATION, 1);
        useSleepTimerStore.getState().setFadeOutProgress(progress);
        const targetVol = originalVolumeRef.current * (1 - progress);
        getAudioManager().setVolume(Math.max(0, targetVol));
      }

      useSleepTimerStore.getState().tick(TICK_INTERVAL);
    }, TICK_INTERVAL);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [isActive]);

  useEffect(() => {
    return () => {
      if (useSleepTimerStore.getState().isActive) {
        getAudioManager().setVolume(originalVolumeRef.current);
      }
    };
  }, []);
}

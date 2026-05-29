import { create } from "zustand";
import type { SleepTimerDuration } from "@/types/phase15";

interface SleepTimerStore {
  isActive: boolean;
  duration: SleepTimerDuration;
  remainingMs: number;
  fadeOutProgress: number;

  setDuration: (d: SleepTimerDuration) => void;
  start: () => void;
  cancel: () => void;
  tick: (elapsed: number) => void;
  setFadeOutProgress: (p: number) => void;
  complete: () => void;
}

export const useSleepTimerStore = create<SleepTimerStore>((set) => ({
  isActive: false,
  duration: 15,
  remainingMs: 0,
  fadeOutProgress: 0,

  setDuration: (d) => set({ duration: d }),

  start: () =>
    set((s) => ({
      isActive: true,
      remainingMs: s.duration * 60 * 1000,
      fadeOutProgress: 0,
    })),

  cancel: () =>
    set({
      isActive: false,
      remainingMs: 0,
      fadeOutProgress: 0,
    }),

  tick: (elapsed) =>
    set((s) => ({
      remainingMs: Math.max(0, s.remainingMs - elapsed),
    })),

  setFadeOutProgress: (p) => set({ fadeOutProgress: p }),

  complete: () =>
    set({
      isActive: false,
      remainingMs: 0,
      fadeOutProgress: 0,
    }),
}));

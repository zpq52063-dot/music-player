import { create } from "zustand";

interface FocusStore {
  isActive: boolean;
  isBlackMode: boolean;
  mistouchGuardActive: boolean;
  startTime: number | null;
  elapsedMs: number;

  enter: () => void;
  exit: () => void;
  tick: (elapsed: number) => void;
  toggleBlackMode: () => void;
  toggleMistouchGuard: () => void;
}

export const useFocusStore = create<FocusStore>((set) => ({
  isActive: false,
  isBlackMode: false,
  mistouchGuardActive: true,
  startTime: null,
  elapsedMs: 0,

  enter: () => set({ isActive: true, startTime: Date.now(), elapsedMs: 0 }),
  exit: () => set({ isActive: false, startTime: null, elapsedMs: 0 }),
  tick: (elapsed) => set({ elapsedMs: elapsed }),
  toggleBlackMode: () => set((s) => ({ isBlackMode: !s.isBlackMode })),
  toggleMistouchGuard: () => set((s) => ({ mistouchGuardActive: !s.mistouchGuardActive })),
}));

import { create } from "zustand";
import type { PlayerStore, PlayMode } from "@/types";

const nextMode: Record<PlayMode, PlayMode> = {
  sequential: "repeat",
  repeat: "repeat-one",
  "repeat-one": "shuffle",
  shuffle: "sequential",
};

export const usePlayerStore = create<PlayerStore>((set, get) => ({
  currentSong: null,
  playlist: [],
  currentIndex: -1,
  isPlaying: false,
  isLoading: false,
  duration: 0,
  currentTime: 0,
  volume: 0.8,
  isMuted: false,
  mode: "sequential",

  play: (song) => {
    const state = get();
    if (song) {
      const idx = state.playlist.findIndex((s) => s.id === song.id);
      if (idx >= 0) {
        set({ currentIndex: idx, currentSong: song, isPlaying: true });
      } else {
        set({
          playlist: [...state.playlist, song],
          currentIndex: state.playlist.length,
          currentSong: song,
          isPlaying: true,
        });
      }
    } else if (state.currentSong) {
      set({ isPlaying: true });
    }
  },

  pause: () => set({ isPlaying: false }),

  togglePlay: () => {
    const { isPlaying, currentSong } = get();
    if (!currentSong) return;
    set({ isPlaying: !isPlaying });
  },

  next: () => {
    const { playlist, currentIndex, mode } = get();
    if (playlist.length === 0) return;

    let nextIdx: number;
    if (mode === "shuffle") {
      nextIdx = Math.floor(Math.random() * playlist.length);
    } else if (mode === "repeat-one") {
      nextIdx = currentIndex;
    } else {
      nextIdx = currentIndex + 1;
      if (nextIdx >= playlist.length) {
        nextIdx = mode === "repeat" ? 0 : currentIndex;
      }
    }

    const song = playlist[nextIdx];
    if (song) {
      set({ currentIndex: nextIdx, currentSong: song, isPlaying: true, currentTime: 0 });
    }
  },

  prev: () => {
    const { playlist, currentIndex, currentTime } = get();
    if (playlist.length === 0) return;

    const prevIdx = currentTime > 3 ? currentIndex : currentIndex - 1;
    const idx = prevIdx >= 0 ? prevIdx : playlist.length - 1;
    const song = playlist[idx];
    if (song) {
      set({ currentIndex: idx, currentSong: song, isPlaying: true, currentTime: 0 });
    }
  },

  seek: (time) => set({ currentTime: Math.max(0, Math.min(time, get().duration)) }),

  setDuration: (duration) => set({ duration }),

  setCurrentTime: (time) => set({ currentTime: time }),

  setVolume: (vol) => set({ volume: Math.max(0, Math.min(1, vol)), isMuted: false }),

  toggleMute: () => set((s) => ({ isMuted: !s.isMuted })),

  setPlaylist: (songs, startIndex = 0) => {
    const song = songs[startIndex];
    set({
      playlist: songs,
      currentIndex: startIndex,
      currentSong: song ?? null,
      isPlaying: !!song,
      currentTime: 0,
    });
  },

  cycleMode: () => set((s) => ({ mode: nextMode[s.mode] })),
}));

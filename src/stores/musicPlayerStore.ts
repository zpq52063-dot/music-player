import { create } from "zustand";
import type { Song } from "@/types";
import type { PlayMode, LoadingState, LyricLine } from "@/types";

// ==================== Types ====================

interface MusicPlayerState {
  // Core
  currentSong: Song | null;
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  volume: number;
  isMuted: boolean;
  playbackRate: number;

  // Mode
  playMode: PlayMode;

  // Queue
  queue: Song[];
  queueIndex: number;

  // History
  playHistory: Song[];

  // Auto-continue
  autoContinue: boolean;

  // Audio status
  buffered: number;
  loadingState: LoadingState;

  // Lyrics
  lyrics: LyricLine[];
  currentLyricIndex: number;
}

interface MusicPlayerActions {
  // Core
  play: (song?: Song) => void;
  pause: () => void;
  togglePlay: () => void;
  seek: (time: number) => void;
  setVolume: (vol: number) => void;
  toggleMute: () => void;
  setPlaybackRate: (rate: number) => void;

  // Time sync (called from AudioManager)
  syncTime: (currentTime: number, duration: number) => void;
  setBuffered: (pct: number) => void;
  setLoadingState: (state: LoadingState) => void;

  // Queue
  setQueue: (songs: Song[], startIndex?: number) => void;
  addToQueue: (song: Song) => void;
  removeFromQueue: (index: number) => void;
  clearQueue: () => void;
  reorderQueue: (from: number, to: number) => void;

  // History
  getPlayHistory: () => Song[];

  // Auto-continue
  setAutoContinue: (v: boolean) => void;

  // Navigation
  next: () => void;
  prev: () => void;

  // Mode
  setPlayMode: (mode: PlayMode) => void;
  cycleMode: () => void;

  // Lyrics
  setLyrics: (lines: LyricLine[]) => void;
  setCurrentLyricIndex: (index: number) => void;
}

export type MusicPlayerStore = MusicPlayerState & MusicPlayerActions;

// ==================== Helpers ====================

const NEXT_MODE: Record<PlayMode, PlayMode> = {
  sequential: "repeat",
  repeat: "repeat-one",
  "repeat-one": "shuffle",
  shuffle: "sequential",
};

// ==================== Store ====================

export const useMusicPlayerStore = create<MusicPlayerStore>((set, get) => ({
  // --- Initial State ---
  currentSong: null,
  isPlaying: false,
  currentTime: 0,
  duration: 0,
  volume: 0.8,
  isMuted: false,
  playbackRate: 1,

  playMode: "sequential",

  queue: [],
  queueIndex: -1,

  playHistory: [],
  autoContinue: true,

  buffered: 0,
  loadingState: "idle",

  lyrics: [],
  currentLyricIndex: -1,

  // --- Core Actions ---

  play: (song) => {
    const state = get();
    if (song) {
      // Check if already in queue
      const existingIdx = state.queue.findIndex((s) => s.id === song.id);
      if (existingIdx >= 0) {
        set({ queueIndex: existingIdx, currentSong: song, isPlaying: true, currentTime: 0 });
      } else {
        const newQueue = [...state.queue, song];
        set({
          queue: newQueue,
          queueIndex: newQueue.length - 1,
          currentSong: song,
          isPlaying: true,
          currentTime: 0,
          lyrics: [],
          currentLyricIndex: -1,
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

  seek: (time) => set({ currentTime: Math.max(0, time) }),

  setVolume: (vol) => set({ volume: Math.max(0, Math.min(1, vol)), isMuted: false }),

  toggleMute: () => set((s) => ({ isMuted: !s.isMuted })),

  setPlaybackRate: (rate) => set({ playbackRate: Math.max(0.25, Math.min(4, rate)) }),

  // --- Time / Status ---

  syncTime: (currentTime, duration) => set({ currentTime, duration }),

  setBuffered: (pct) => set({ buffered: Math.max(0, Math.min(100, pct)) }),

  setLoadingState: (state) => set({ loadingState: state }),

  // --- Queue ---

  setQueue: (songs, startIndex = 0) => {
    const song = songs[startIndex];
    set({
      queue: songs,
      queueIndex: startIndex,
      currentSong: song ?? null,
      isPlaying: !!song,
      currentTime: 0,
      lyrics: [],
      currentLyricIndex: -1,
    });
  },

  addToQueue: (song) => set((s) => ({ queue: [...s.queue, song] })),

  removeFromQueue: (index) => {
    const { queue, queueIndex, currentSong } = get();
    if (index < 0 || index >= queue.length) return;

    const newQueue = queue.filter((_, i) => i !== index);

    if (newQueue.length === 0) {
      set({ queue: [], queueIndex: -1, currentSong: null, isPlaying: false });
      return;
    }

    let newIdx = queueIndex;
    if (index < queueIndex) {
      newIdx = queueIndex - 1;
    } else if (index === queueIndex) {
      // Removing current — use same index (becomes next song)
      newIdx = Math.min(queueIndex, newQueue.length - 1);
    }

    set({
      queue: newQueue,
      queueIndex: newIdx,
      currentSong: newQueue[newIdx] ?? (newIdx !== queueIndex ? currentSong : null),
    });
  },

  clearQueue: () =>
    set({
      queue: [],
      queueIndex: -1,
      currentSong: null,
      isPlaying: false,
    }),

  reorderQueue: (from, to) => {
    const { queue, queueIndex } = get();
    if (from === to || from < 0 || to < 0) return;
    if (from >= queue.length || to >= queue.length) return;

    const newQueue = [...queue];
    const [item] = newQueue.splice(from, 1);
    if (!item) return;
    newQueue.splice(to, 0, item);

    // Adjust current index
    let newIdx = queueIndex;
    if (from === queueIndex) {
      newIdx = to;
    } else if (from < queueIndex && to >= queueIndex) {
      newIdx = queueIndex - 1;
    } else if (from > queueIndex && to <= queueIndex) {
      newIdx = queueIndex + 1;
    }

    set({ queue: newQueue, queueIndex: newIdx });
  },

  // --- History ---

  getPlayHistory: () => get().playHistory,

  // --- Auto-continue ---

  setAutoContinue: (v) => set({ autoContinue: v }),

  // --- Navigation ---

  next: () => {
    const { queue, queueIndex, playMode, currentSong, autoContinue } = get();
    if (queue.length === 0) return;

    // Track history
    if (currentSong) {
      const history = get().playHistory;
      const newHistory = [currentSong, ...history.filter((s) => s.id !== currentSong.id)].slice(0, 50);
      set({ playHistory: newHistory });
    }

    let nextIdx: number;

    if (playMode === "shuffle") {
      if (queue.length === 1) {
        nextIdx = 0;
      } else {
        // Fisher-Yates random, avoid same index
        do {
          nextIdx = Math.floor(Math.random() * queue.length);
        } while (nextIdx === queueIndex);
      }
    } else if (playMode === "repeat-one") {
      nextIdx = queueIndex;
    } else {
      nextIdx = queueIndex + 1;
      if (nextIdx >= queue.length) {
        if (playMode === "repeat") {
          nextIdx = 0;
        } else {
          // sequential — stop (auto-continue: restart from beginning)
          if (autoContinue && queue.length > 0) {
            nextIdx = 0;
          } else {
            set({ isPlaying: false, currentTime: 0 });
            return;
          }
        }
      }
    }

    const song = queue[nextIdx];
    if (song) {
      set({
        queueIndex: nextIdx,
        currentSong: song,
        isPlaying: true,
        currentTime: 0,
        lyrics: [],
        currentLyricIndex: -1,
      });
    }
  },

  prev: () => {
    const { queue, queueIndex, currentTime } = get();
    if (queue.length === 0) return;

    // < 3s: go to prev track; >= 3s: replay current
    const prevIdx = currentTime > 3 ? queueIndex : queueIndex - 1;
    const idx = prevIdx >= 0 ? prevIdx : queue.length - 1;
    const song = queue[idx];
    if (song) {
      set({
        queueIndex: idx,
        currentSong: song,
        isPlaying: true,
        currentTime: 0,
        lyrics: [],
        currentLyricIndex: -1,
      });
    }
  },

  // --- Mode ---

  setPlayMode: (mode) => set({ playMode: mode }),

  cycleMode: () => set((s) => ({ playMode: NEXT_MODE[s.playMode] })),

  // --- Lyrics ---

  setLyrics: (lines) => set({ lyrics: lines, currentLyricIndex: -1 }),

  setCurrentLyricIndex: (index) => set({ currentLyricIndex: index }),
}));

import type { Song } from "./song";

export type PlayMode = "sequential" | "shuffle" | "repeat" | "repeat-one";

export interface PlayerState {
  currentSong: Song | null;
  playlist: Song[];
  currentIndex: number;
  isPlaying: boolean;
  isLoading: boolean;
  duration: number;
  currentTime: number;
  volume: number;
  isMuted: boolean;
  mode: PlayMode;
}

export interface PlayerActions {
  play: (song?: Song) => void;
  pause: () => void;
  togglePlay: () => void;
  next: () => void;
  prev: () => void;
  seek: (time: number) => void;
  setDuration: (duration: number) => void;
  setCurrentTime: (time: number) => void;
  setVolume: (volume: number) => void;
  toggleMute: () => void;
  setPlaylist: (songs: Song[], startIndex?: number) => void;
  cycleMode: () => void;
}

export type PlayerStore = PlayerState & PlayerActions;

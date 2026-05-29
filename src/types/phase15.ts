// Phase 15: Smart Music UX types

export interface PlayEvent {
  songId: string;
  timestamp: number;
  playDuration: number;
  completed: boolean;
  skipped: boolean;
}

export interface SongPlayCount {
  songId: string;
  playCount: number;
  totalDuration: number;
  lastPlayedAt: number;
}

export interface ArtistPlayCount {
  artist: string;
  playCount: number;
  totalDuration: number;
}

export interface DailyPlayRecord {
  date: string; // "YYYY-MM-DD"
  totalSeconds: number;
  songIds: string[];
}

export interface AnalyticsData {
  playEvents: PlayEvent[];
  songPlayCounts: Record<string, SongPlayCount>;
  artistPlayCounts: Record<string, ArtistPlayCount>;
  dailyPlays: Record<string, DailyPlayRecord>;
  currentStreak: number;
  lastPlayDate: string | null;
}

export type SmartPlaylistMode = "late-night" | "study" | "relax" | "commute";

export interface SmartPlaylistConfig {
  mode: SmartPlaylistMode;
  label: string;
  description: string;
  iconName: string;
  songIds: string[];
  color: string;
}

export type SleepTimerDuration = 15 | 30 | 60;

export interface SleepTimerState {
  isActive: boolean;
  duration: SleepTimerDuration;
  remainingMs: number;
  startedAt: number | null;
  fadeOutStarted: boolean;
}

export interface FocusModeState {
  isActive: boolean;
  startTime: number | null;
  elapsedMs: number;
  isDarkMode: boolean;
  mistouchGuardActive: boolean;
}

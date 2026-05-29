import type { Song } from "./song";
import type { Playlist } from "./playlist";
import type { PlayMode } from "./player";

export type { PlayMode };

// ==================== 加载状态 ====================
export type LoadingState = "idle" | "loading" | "ready" | "error";

// ==================== Phase 3: 搜索 & Provider ====================

export interface Artist {
  id: string;
  name: string;
  avatar: string;
  description?: string;
  albumCount?: number;
}

export interface Album {
  id: string;
  name: string;
  cover: string;
  artist: string;
  releaseYear?: number;
  songCount?: number;
}

export interface SearchResult {
  songs: Song[];
  playlists: Playlist[];
  artists: Artist[];
  total: number;
  hasMore: boolean;
}

// ==================== 歌词 ====================
export interface LyricLine {
  /** 毫秒时间戳 */
  time: number;
  /** 歌词文本 */
  text: string;
  /** 翻译文本（后续扩展） */
  translation?: string;
}

// ==================== 音频核心状态 ====================
export interface AudioState {
  currentTime: number;
  duration: number;
  buffered: number;
  loadingState: LoadingState;
  playbackRate: number;
}

// ==================== 播放队列 ====================
export interface QueueState {
  songs: Song[];
  currentIndex: number;
}

// ==================== 播放器完整状态 ====================
export interface PlayerSnapshot {
  currentSong: Song | null;
  isPlaying: boolean;
  volume: number;
  isMuted: boolean;
  mode: PlayMode;
  audio: AudioState;
  queue: QueueState;
  lyrics: LyricLine[];
  currentLyricIndex: number;
}

// ==================== AudioManager 事件回调 ====================
export interface AudioEventCallbacks {
  onTimeUpdate: (currentTime: number, duration: number) => void;
  onEnded: () => void;
  onLoadStateChange: (state: LoadingState) => void;
  onBufferedChange: (percentage: number) => void;
  onError: (error: string) => void;
}

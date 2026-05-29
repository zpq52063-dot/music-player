/**
 * Phase 8 — 播放恢复系统类型
 */

import type { PlayMode } from "./player";

export interface RecoveryState {
  /** ISO timestamp of last save */
  savedAt: string;

  /** Current song ID */
  songId: string | null;

  /** Playback position in seconds */
  position: number;

  /** Queue song IDs (for restoration) */
  queueIds: string[];

  /** Current queue index */
  queueIndex: number;

  /** Volume (0-1) */
  volume: number;

  /** Is muted */
  isMuted: boolean;

  /** Play mode */
  playMode: PlayMode;

  /** Active provider type */
  providerType: string | null;

  /** Was playing when saved */
  wasPlaying: boolean;
}

export interface RecoveryResult {
  /** Whether recovery data was found */
  hasRecoveryData: boolean;

  /** Recovery state (if found) */
  state: RecoveryState | null;

  /** Seconds since last save */
  secondsSinceSave: number | null;

  /** Whether recovery is stale (> 24 hours) */
  isStale: boolean;
}

export interface RecoveryActions {
  /** Save current playback state to localStorage */
  saveState: () => void;

  /** Restore playback state from localStorage */
  restoreState: () => RecoveryResult;

  /** Clear recovery data */
  clearState: () => void;

  /** Emergency save (beforeunload) */
  emergencySave: () => void;
}

export interface RecoveryStore extends RecoveryActions {
  /** Current recovery state */
  recoveryState: RecoveryState | null;

  /** Auto-save interval ID */
  _autoSaveInterval: ReturnType<typeof setInterval> | null;
}

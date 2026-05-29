/**
 * Phase 8 — 播放恢复系统
 *
 * 支持:
 * - APP 重开恢复 (localStorage 持久化)
 * - 播放位置恢复 (秒级精度)
 * - 队列恢复 (song IDs)
 * - Provider 恢复 (最近使用的 Provider)
 * - 崩溃恢复 (beforeunload 紧急保存)
 *
 * 使用: 在 AudioProvider 中挂载 usePlaybackRecovery hook
 */

import type { RecoveryState, RecoveryResult } from "@/types/recovery";

const STORAGE_KEY = "music_playback_recovery";
const AUTO_SAVE_INTERVAL = 5000; // 5 seconds
const STALE_THRESHOLD = 24 * 60 * 60 * 1000; // 24 hours

// ==================== Core Functions ====================

export function createRecoveryState(overrides: Partial<RecoveryState> = {}): RecoveryState {
  return {
    savedAt: new Date().toISOString(),
    songId: null,
    position: 0,
    queueIds: [],
    queueIndex: -1,
    volume: 0.8,
    isMuted: false,
    playMode: "sequential",
    providerType: null,
    wasPlaying: false,
    ...overrides,
  };
}

export function saveRecoveryState(state: RecoveryState): void {
  try {
    const data: RecoveryState = {
      ...state,
      savedAt: new Date().toISOString(),
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch {
    // localStorage full or unavailable — silently fail
  }
}

export function loadRecoveryState(): RecoveryResult {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return { hasRecoveryData: false, state: null, secondsSinceSave: null, isStale: false };
    }

    const state = JSON.parse(raw) as RecoveryState;
    const secondsSinceSave = Math.floor((Date.now() - new Date(state.savedAt).getTime()) / 1000);
    const isStale = Date.now() - new Date(state.savedAt).getTime() > STALE_THRESHOLD;

    if (isStale || !state.songId) {
      return { hasRecoveryData: false, state, secondsSinceSave, isStale: true };
    }

    return { hasRecoveryData: true, state, secondsSinceSave, isStale };
  } catch {
    return { hasRecoveryData: false, state: null, secondsSinceSave: null, isStale: false };
  }
}

export function clearRecoveryState(): void {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    // silently fail
  }
}

export function getAutoSaveInterval(): number {
  return AUTO_SAVE_INTERVAL;
}

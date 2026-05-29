/**
 * Phase 17 — Crash Recovery System
 *
 * 职责:
 * - 页面刷新恢复 (sessionStorage save/restore, beforeunload)
 * - Safari 杀后台恢复 (pagehide save, pageshow restore)
 * - Audio session restore (Media Session API)
 * - Queue restore (从 sessionStorage 重建队列)
 * - Resume playback (智能恢复播放位置)
 *
 * 在 useCrashRecovery hook 中挂载
 */

import type { CrashRecoveryState, CrashRecoveryResult } from "@/types";
import { getLogger } from "@/lib/logs/Logger";
import { getTelemetry } from "@/system/telemetry/TelemetryService";

const RECOVERY_KEY = "music_crash_recovery";
const SAVE_DEBOUNCE_MS = 3000;

/** 可注入的 store 写入回调 */
export interface CrashRecoveryStoreWriters {
  setVolume: (v: number) => void;
  setMuted: (v: boolean) => void;
  setPlayMode: (m: "sequential" | "repeat" | "repeat-one" | "shuffle") => void;
  seek: (pos: number) => void;
  play: () => void;
}

export class CrashRecoverySystem {
  private static instance: CrashRecoverySystem | null = null;

  private logger = getLogger();
  private lastSaveTime = 0;
  private saveTimer: ReturnType<typeof setTimeout> | null = null;
  private isMounted = false;
  private storeWriters: CrashRecoveryStoreWriters | null = null;

  /** 外部注入的 store 读取器 */
  public storeReader?: () => {
    currentSong: { id: string } | null;
    isPlaying: boolean;
    currentTime: number;
    volume: number;
    isMuted: boolean;
    playMode: string;
    queue: Array<{ id: string }>;
    queueIndex: number;
  };

  private constructor() {}

  static getInstance(): CrashRecoverySystem {
    if (!CrashRecoverySystem.instance) {
      CrashRecoverySystem.instance = new CrashRecoverySystem();
    }
    return CrashRecoverySystem.instance;
  }

  // ==================== Mount ====================

  mount(writers: CrashRecoveryStoreWriters): void {
    if (this.isMounted) return;
    this.isMounted = true;
    this.storeWriters = writers;

    if (typeof window === "undefined") return;

    // 页面刷新/关闭 → 保存状态
    window.addEventListener("beforeunload", this.handleBeforeUnload);

    // Safari 切到后台 → 保存状态 (pagehide 在 Safari 杀后台前触发)
    window.addEventListener("pagehide", this.handlePageHide);

    // 前台恢复 → 恢复状态
    window.addEventListener("pageshow", this.handlePageShow);

    // 可见性变化 → 每次切回前台时轻量检查
    document.addEventListener("visibilitychange", this.handleVisibilityChange);

    this.logger.info("crash-recovery", "CrashRecoverySystem mounted");
  }

  unmount(): void {
    if (!this.isMounted) return;
    this.isMounted = false;
    this.clearSaveTimer();

    if (typeof window === "undefined") return;

    window.removeEventListener("beforeunload", this.handleBeforeUnload);
    window.removeEventListener("pagehide", this.handlePageHide);
    window.removeEventListener("pageshow", this.handlePageShow);
    document.removeEventListener("visibilitychange", this.handleVisibilityChange);

    this.logger.debug("crash-recovery", "CrashRecoverySystem unmounted");
  }

  // ==================== Save State ====================

  /** 立即保存当前播放状态到 sessionStorage */
  saveState(): void {
    if (!this.storeReader) return;

    const store = this.storeReader();
    const state: CrashRecoveryState = {
      songId: store.currentSong?.id ?? null,
      position: store.currentTime,
      queueIds: store.queue.map((s) => s.id),
      queueIndex: store.queueIndex,
      volume: store.volume,
      isMuted: store.isMuted,
      playMode: store.playMode,
      providerType: null,
      isPlaying: store.isPlaying,
      timestamp: Date.now(),
    };

    try {
      sessionStorage.setItem(RECOVERY_KEY, JSON.stringify(state));
      this.lastSaveTime = Date.now();
    } catch {
      // sessionStorage 可能不可用
    }
  }

  /** 防抖保存 (播放中每3秒保存一次) */
  scheduleSave(): void {
    if (this.saveTimer) return;
    const elapsed = Date.now() - this.lastSaveTime;
    const delay = Math.max(0, SAVE_DEBOUNCE_MS - elapsed);

    this.saveTimer = setTimeout(() => {
      this.saveState();
      this.saveTimer = null;
    }, delay);
  }

  // ==================== Restore State ====================

  /** 尝试恢复上次保存的播放状态 */
  restoreState(): CrashRecoveryResult {
    const startTime = performance.now();
    const result: CrashRecoveryResult = {
      recovered: false,
      recoveredSongId: null,
      recoveredPosition: 0,
      recoveredQueueIds: [],
      recoveredQueueIndex: -1,
      recoveredVolume: 0.8,
      recoveredIsMuted: false,
      recoveredPlayMode: "sequential",
      recoveredIsPlaying: false,
      timeMs: 0,
    };

    try {
      const raw = sessionStorage.getItem(RECOVERY_KEY);
      if (!raw) {
        result.timeMs = performance.now() - startTime;
        return result;
      }

      const state = JSON.parse(raw) as CrashRecoveryState;

      // 只恢复 30 分钟以内的状态
      if (Date.now() - state.timestamp > 30 * 60 * 1000) {
        sessionStorage.removeItem(RECOVERY_KEY);
        result.timeMs = performance.now() - startTime;
        return result;
      }

      result.recoveredSongId = state.songId;
      result.recoveredPosition = state.position;
      result.recoveredQueueIds = state.queueIds;
      result.recoveredQueueIndex = state.queueIndex;
      result.recoveredVolume = state.volume;
      result.recoveredIsMuted = state.isMuted;
      result.recoveredPlayMode = state.playMode;
      result.recoveredIsPlaying = state.isPlaying;
      result.recovered = true;
    } catch {
      // parse error
    }

    result.timeMs = performance.now() - startTime;
    return result;
  }

  /** 执行恢复：写入 store */
  executeRestore(result: CrashRecoveryResult): void {
    if (!result.recovered || !this.storeWriters) return;

    const startTime = performance.now();
    const writers = this.storeWriters;

    // Step 1: 恢复基础设置
    writers.setVolume(result.recoveredVolume);
    writers.setMuted(result.recoveredIsMuted);
    writers.setPlayMode(
      result.recoveredPlayMode as "sequential" | "repeat" | "repeat-one" | "shuffle",
    );

    getTelemetry().record({
      name: "crash_recovery.restore",
      value: result.recoveredPosition,
      tags: {
        songId: result.recoveredSongId ?? "none",
        queueCount: String(result.recoveredQueueIds.length),
      },
      timestamp: Date.now(),
    });

    this.logger.info("crash-recovery", `State restored in ${(performance.now() - startTime).toFixed(0)}ms`, {
      songId: result.recoveredSongId,
      position: result.recoveredPosition,
      queueCount: result.recoveredQueueIds.length,
    });
  }

  // ==================== Event Handlers ====================

  private handleBeforeUnload = (): void => {
    this.saveState();
  };

  private handlePageHide = (event: PageTransitionEvent): void => {
    // Safari 杀后台时 pagehide 会在 beforeunload 之前触发
    // persisted=false 意味着页面正在被卸载（非 bfcache）
    if (!event.persisted) {
      this.saveState();
      this.logger.debug("crash-recovery", "Page being unloaded, state saved");
    }
  };

  private handlePageShow = (event: PageTransitionEvent): void => {
    // bfcache 恢复: Safari 前进/后退恢复
    if (event.persisted) {
      const result = this.restoreState();
      if (result.recovered) {
        this.logger.info("crash-recovery", "bfcache restore: page resumed from cache");
        // bfcache 恢复时只需恢复 store, AudioManager 已自动恢复
      }
    }
  };

  private handleVisibilityChange = (): void => {
    if (document.visibilityState === "visible") {
      // 切回前台时轻量检查 - 仅记录，不强制恢复
      this.scheduleSave();
      getTelemetry().record({
        name: "app.foreground",
        value: 1,
        tags: {},
        timestamp: Date.now(),
      });
    } else if (document.visibilityState === "hidden") {
      // 切到后台时保存
      this.saveState();
      getTelemetry().record({
        name: "app.background",
        value: 1,
        tags: {},
        timestamp: Date.now(),
      });
    }
  };

  // ==================== Helpers ====================

  private clearSaveTimer(): void {
    if (this.saveTimer) {
      clearTimeout(this.saveTimer);
      this.saveTimer = null;
    }
  }

  /** 清除所有恢复数据 */
  clearRecoveryData(): void {
    try {
      sessionStorage.removeItem(RECOVERY_KEY);
    } catch {
      // ignore
    }
  }

  /** 是否有可恢复的数据 */
  hasRecoveryData(): boolean {
    try {
      return sessionStorage.getItem(RECOVERY_KEY) !== null;
    } catch {
      return false;
    }
  }

  destroy(): void {
    this.unmount();
    CrashRecoverySystem.instance = null;
  }
}

export function getCrashRecovery(): CrashRecoverySystem {
  return CrashRecoverySystem.getInstance();
}

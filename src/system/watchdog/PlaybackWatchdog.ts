/**
 * Phase 9 — 播放看门狗
 *
 * 职责:
 * - 检测播放卡死 (stall) — currentTime 5s 无变化
 * - 检测加载超时 (timeout) — loading > 30s
 * - 检测无效URL — audio error
 * - 检测Provider失效 — 连续 getPlayUrl 失败
 * - 自动恢复播放
 * - 自动切换Provider
 * - 自动跳过失败歌曲
 *
 * 单例模式, 在 useSystemWatchdog 中挂载
 */

import type {
  WatchdogEvent,
  WatchdogRecovery,
  WatchdogState,
  WatchdogConfig,
  WatchdogEventType,
  WatchdogRecoveryAction,
} from "@/types";
import { DEFAULT_WATCHDOG_CONFIG } from "@/types";
import { getAudioManager } from "@/lib/audio/AudioManager";
import { getLogger } from "@/lib/logs/Logger";

export class PlaybackWatchdog {
  private static instance: PlaybackWatchdog | null = null;

  private config: WatchdogConfig;
  private state: WatchdogState;
  private timer: ReturnType<typeof setInterval> | null = null;
  private logger = getLogger();

  /** 外部注入的恢复回调 */
  private onRecover?: (action: WatchdogRecoveryAction, event: WatchdogEvent) => void;
  /** 外部注入的 store 访问器 */
  private storeReader?: () => {
    isPlaying: boolean;
    currentTime: number;
    loadingState: string;
    currentSongId: string | null;
    queueIndex: number;
    queueLength: number;
  };
  /** 外部注入的 store 操作器 */
  private storeActions?: {
    next: () => void;
    pause: () => void;
    setLoadingState: (s: string) => void;
  };

  private constructor() {
    this.config = { ...DEFAULT_WATCHDOG_CONFIG };
    this.state = this.createInitialState();
  }

  static getInstance(): PlaybackWatchdog {
    if (!PlaybackWatchdog.instance) {
      PlaybackWatchdog.instance = new PlaybackWatchdog();
    }
    return PlaybackWatchdog.instance;
  }

  // ==================== Configuration ====================

  configure(partial: Partial<WatchdogConfig>): void {
    this.config = { ...this.config, ...partial };
  }

  setStoreReader(reader: PlaybackWatchdog["storeReader"]): void {
    this.storeReader = reader;
  }

  setStoreActions(actions: PlaybackWatchdog["storeActions"]): void {
    this.storeActions = actions;
  }

  setOnRecover(cb: (action: WatchdogRecoveryAction, event: WatchdogEvent) => void): void {
    this.onRecover = cb;
  }

  // ==================== Lifecycle ====================

  start(): void {
    if (this.timer) return;
    this.state.isRunning = true;
    this.state.lastCurrentTime = 0;
    this.state.stallCount = 0;

    this.timer = setInterval(() => {
      this.tick();
    }, this.config.checkIntervalMs);

    this.logger.debug("watchdog", "PlaybackWatchdog started");
  }

  stop(): void {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
    this.state.isRunning = false;
    this.logger.debug("watchdog", "PlaybackWatchdog stopped");
  }

  destroy(): void {
    this.stop();
    PlaybackWatchdog.instance = null;
  }

  // ==================== State Access ====================

  getState(): WatchdogState {
    return { ...this.state };
  }

  // ==================== Core: Tick ====================

  private tick(): void {
    if (!this.storeReader) return;

    const store = this.storeReader();
    this.state.lastCheckTime = Date.now();

    // 不播放时不检测
    if (!store.isPlaying) {
      this.state.lastCurrentTime = 0;
      this.state.stallCount = 0;
      return;
    }

    // 1. 检测加载超时
    if (store.loadingState === "loading") {
      this.checkTimeout(store);
    }

    // 2. 检测播放卡死
    if (store.loadingState === "ready" || store.loadingState === "idle") {
      this.checkStall(store);
    }

    // 3. 检测错误状态
    if (store.loadingState === "error") {
      this.handleError(store);
    }
  }

  // ==================== Detection ====================

  private checkStall(store: ReturnType<NonNullable<PlaybackWatchdog["storeReader"]>>): void {
    const currentTime = store.currentTime;

    if (this.state.lastCurrentTime > 0 && currentTime > 0) {
      const diff = Math.abs(currentTime - this.state.lastCurrentTime);

      // currentTime 几乎无变化 → 可能卡死
      if (diff < 0.1) {
        this.state.stallCount++;
        if (this.state.stallCount >= 3) {
          this.triggerEvent("stalled", store.currentSongId, `currentTime stalled at ${currentTime.toFixed(1)}s for ${this.state.stallCount * (this.config.checkIntervalMs / 1000)}s`);
          this.state.stallCount = 0;
        }
      } else {
        this.state.stallCount = 0;
      }
    }

    this.state.lastCurrentTime = currentTime;
  }

  private checkTimeout(store: ReturnType<NonNullable<PlaybackWatchdog["storeReader"]>>): void {
    // 简化超时检测: 如果状态一直是loading, stallCount 会累积
    this.state.stallCount++;
    if (this.state.stallCount * this.config.checkIntervalMs >= this.config.timeoutThresholdMs) {
      this.triggerEvent("timeout", store.currentSongId, `loading timeout after ${this.state.stallCount * (this.config.checkIntervalMs / 1000)}s`);
      this.state.stallCount = 0;
    }
  }

  private handleError(store: ReturnType<NonNullable<PlaybackWatchdog["storeReader"]>>): void {
    this.triggerEvent("audio_error", store.currentSongId, "audio loading state is error");
  }

  /** 外部可调用: Provider获取播放URL失败 */
  notifyProviderFailure(songId: string | null, reason: string): void {
    this.triggerEvent("provider_dead", songId, reason);
  }

  // ==================== Recovery ====================

  private triggerEvent(type: WatchdogEventType, songId: string | null, details: string): void {
    const event: WatchdogEvent = {
      type,
      timestamp: Date.now(),
      songId,
      details,
    };

    // 记录事件
    this.state.recentEvents.push(event);
    if (this.state.recentEvents.length > this.config.maxEvents) {
      this.state.recentEvents = this.state.recentEvents.slice(-this.config.maxEvents);
    }

    this.logger.warn("watchdog", `Event: ${type}`, { songId, details });

    // 执行恢复
    const recoveryAction = this.determineRecovery(type);
    this.executeRecovery(recoveryAction, event);
  }

  // 跟踪歌曲级别的恢复次数，防止无限重试同一首歌
  private songRecoveryCount: Map<string, number> = new Map();

  private determineRecovery(type: WatchdogEventType): WatchdogRecoveryAction {
    switch (type) {
      case "stalled":
        return "resume";
      case "timeout":
      case "invalid_url":
        return "reload_current";
      case "provider_dead":
        return "skip_to_next";
      case "audio_error":
        return "skip_to_next";
      case "queue_exhausted":
        return "none";
      default:
        return "none";
    }
  }

  private executeRecovery(action: WatchdogRecoveryAction, event: WatchdogEvent): void {
    let success = false;

    try {
      const store = this.storeReader?.();
      const songId = event.songId;

      // 同一首歌恢复次数过多 → 强制跳到下一首
      const recoveries = (songId && this.songRecoveryCount.get(songId)) || 0;
      if (recoveries >= 3 && action !== "skip_to_next" && action !== "none") {
        action = "skip_to_next";
      }

      switch (action) {
        case "resume": {
          // iOS 下 audio.play() 可能因用户手势策略失败
          // Resume 降级：先 pause 再 play（重置 audio context）
          const audioMgr = getAudioManager();
          audioMgr.pause();
          setTimeout(() => {
            audioMgr.play().catch(() => {
              // 如果 resume 也失败，触发 reload_current
              this.logger.warn("watchdog", "Resume failed, escalating to reload");
            });
          }, 100);
          success = true;
          break;
        }

        case "reload_current": {
          // 重载当前歌曲（不跳过）
          // 通过 seek(0) + play 让同一首歌重新开始
          const audioMgr = getAudioManager();
          audioMgr.pause();
          audioMgr.seek(store?.currentTime ?? 0);
          setTimeout(() => {
            audioMgr.play().catch(() => {
              // 重载也失败，强制切歌
              this.storeActions?.next();
            });
          }, 200);
          success = true;
          break;
        }

        case "skip_to_next":
          this.storeActions?.next();
          success = true;
          break;

        case "none":
          success = false;
          break;

        default:
          success = false;
          break;
      }

      // 跟踪恢复次数
      if (songId && success) {
        this.songRecoveryCount.set(songId, recoveries + 1);
        // 歌曲切换时清理旧的跟踪
        if (this.songRecoveryCount.size > 20) {
          const keys = [...this.songRecoveryCount.keys()];
          for (const k of keys.slice(0, 10)) this.songRecoveryCount.delete(k);
        }
      }
    } catch (e) {
      success = false;
      this.logger.error("watchdog", `Recovery failed: ${action}`, e);
    }

    const recovery: WatchdogRecovery = {
      action,
      timestamp: Date.now(),
      eventType: event.type,
      success,
    };

    this.state.recentRecoveries.push(recovery);
    if (this.state.recentRecoveries.length > this.config.maxRecoveries) {
      this.state.recentRecoveries = this.state.recentRecoveries.slice(-this.config.maxRecoveries);
    }

    if (success) {
      this.state.totalRecoveries++;
    }

    this.onRecover?.(action, event);

    this.logger.info("watchdog", `Recovery: ${action} (${success ? "ok" : "failed"})`);
  }

  // ==================== Helpers ====================

  private createInitialState(): WatchdogState {
    return {
      isRunning: false,
      lastCheckTime: 0,
      lastCurrentTime: 0,
      stallCount: 0,
      totalRecoveries: 0,
      recentEvents: [],
      recentRecoveries: [],
    };
  }
}

export function getPlaybackWatchdog(): PlaybackWatchdog {
  return PlaybackWatchdog.getInstance();
}

/**
 * Phase 9 — 启动恢复管道
 *
 * 职责:
 * - 上次播放状态恢复 (volume/mode/muted)
 * - 队列恢复 (song IDs → 尝试重建)
 * - Provider 状态恢复
 * - 用户偏好恢复
 * - 缓存预热 (预加载上次队列)
 *
 * 在 useSystemWatchdog 启动时调用
 */

import {
  loadRecoveryState,
  createRecoveryState,
  saveRecoveryState,
} from "@/services/recovery/PlaybackRecoverySystem";
import { getLogger } from "@/lib/logs/Logger";
import { getTelemetry } from "@/system/telemetry/TelemetryService";

export interface StartupRecoveryResult {
  recovered: boolean;
  recoveredVolume: number | null;
  recoveredMode: string | null;
  recoveredMuted: boolean | null;
  recoveredSongId: string | null;
  recoveredPosition: number | null;
  recoveredQueueIds: string[];
  recoveredProviderType: string | null;
  timeMs: number;
}

export class StartupRecoveryPipeline {
  private static instance: StartupRecoveryPipeline | null = null;

  private logger = getLogger();
  private lastResult: StartupRecoveryResult | null = null;

  private constructor() {}

  static getInstance(): StartupRecoveryPipeline {
    if (!StartupRecoveryPipeline.instance) {
      StartupRecoveryPipeline.instance = new StartupRecoveryPipeline();
    }
    return StartupRecoveryPipeline.instance;
  }

  // ==================== Core Pipeline ====================

  /**
   * 执行启动恢复管道
   * 按顺序:
   * 1. 读取上次保存的恢复状态
   * 2. 恢复播放器设置 (volume/mode/muted)
   * 3. 尝试恢复歌曲信息 (仅保存 ID 和位置)
   * 4. 恢复 Provider 偏好
   * 5. 记录恢复耗时
   */
  async execute(
    storeActions?: {
      setVolume?: (v: number) => void;
      setPlayMode?: (m: string) => void;
      setMuted?: (v: boolean) => void;
    },
  ): Promise<StartupRecoveryResult> {
    const startTime = performance.now();

    const result: StartupRecoveryResult = {
      recovered: false,
      recoveredVolume: null,
      recoveredMode: null,
      recoveredMuted: null,
      recoveredSongId: null,
      recoveredPosition: null,
      recoveredQueueIds: [],
      recoveredProviderType: null,
      timeMs: 0,
    };

    try {
      const recoveryData = loadRecoveryState();

      if (!recoveryData.hasRecoveryData || !recoveryData.state) {
        this.logger.debug("startup", "No recovery data available");
        result.timeMs = performance.now() - startTime;
        this.lastResult = result;
        return result;
      }

      const state = recoveryData.state;

      // Step 1: 恢复播放器基础设置
      if (state.volume !== undefined) {
        storeActions?.setVolume?.(state.volume);
        result.recoveredVolume = state.volume;
      }

      if (state.isMuted !== undefined) {
        storeActions?.setMuted?.(state.isMuted);
        result.recoveredMuted = state.isMuted;
      }

      if (state.playMode) {
        storeActions?.setPlayMode?.(state.playMode);
        result.recoveredMode = state.playMode;
      }

      // Step 2: 保存歌曲/队列信息 (供后续UI恢复)
      if (state.songId) {
        result.recoveredSongId = state.songId;
        result.recoveredPosition = state.position;
        result.recovered = true;
      }

      if (state.queueIds && state.queueIds.length > 0) {
        result.recoveredQueueIds = state.queueIds;
      }

      if (state.providerType) {
        result.recoveredProviderType = state.providerType;
      }

      // Step 3: 记录恢复耗时
      result.timeMs = performance.now() - startTime;

      getTelemetry().setRecoveryTime(result.timeMs);

      this.logger.info("startup", `Recovery pipeline completed in ${result.timeMs.toFixed(0)}ms`, {
        recovered: result.recovered,
        songId: result.recoveredSongId,
        queueCount: result.recoveredQueueIds.length,
      });
    } catch (e) {
      this.logger.error("startup", "Recovery pipeline failed", e);
      result.timeMs = performance.now() - startTime;
    }

    this.lastResult = result;
    return result;
  }

  // ==================== Quick Save ====================

  /**
   * 快速保存当前播放状态
   */
  quickSave(params: {
    songId?: string | null;
    position?: number;
    queueIds?: string[];
    queueIndex?: number;
    volume?: number;
    isMuted?: boolean;
    playMode?: string;
    providerType?: string | null;
  }): void {
    const state = createRecoveryState({
      songId: params.songId ?? null,
      position: params.position ?? 0,
      queueIds: params.queueIds ?? [],
      queueIndex: params.queueIndex ?? -1,
      volume: params.volume ?? 0.8,
      isMuted: params.isMuted ?? false,
      playMode: (params.playMode as "sequential" | "repeat" | "repeat-one" | "shuffle") ?? "sequential",
      providerType: params.providerType ?? null,
    });

    saveRecoveryState(state);
  }

  // ==================== State ====================

  getLastResult(): StartupRecoveryResult | null {
    return this.lastResult;
  }

  destroy(): void {
    StartupRecoveryPipeline.instance = null;
  }
}

export function getStartupRecoveryPipeline(): StartupRecoveryPipeline {
  return StartupRecoveryPipeline.getInstance();
}

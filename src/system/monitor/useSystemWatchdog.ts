/**
 * Phase 9 — 系统监控总Hook
 *
 * 职责:
 * - 挂载 PlaybackWatchdog
 * - 挂载 ProviderSelfHealingSystem
 * - 挂载 CacheGovernanceSystem
 * - 挂载 TelemetryService
 * - 执行 StartupRecoveryPipeline
 * - 提供统一的系统健康状态
 *
 * 在 AudioProvider 中挂载一次
 */

"use client";

import { useEffect, useRef, useCallback } from "react";
import { useMusicPlayerStore } from "@/stores/musicPlayerStore";
import { useSettingsStore } from "@/stores/settingsStore";
import { useProviderStore } from "@/stores/providerStore";
import { getPlaybackWatchdog } from "@/system/watchdog/PlaybackWatchdog";
import { getProviderSelfHealing } from "@/system/recovery/ProviderSelfHealing";
import { getCacheGovernance } from "@/system/cleanup/CacheGovernance";
import { getTelemetry } from "@/system/telemetry/TelemetryService";
import { getStartupRecoveryPipeline } from "@/system/recovery/StartupRecoveryPipeline";
import { getProviderManager } from "@/music-source/providers/provider-manager/ProviderManager";
import { getLogger } from "@/lib/logs/Logger";
import type { WatchdogRecoveryAction, WatchdogEvent, ProviderHealthSnapshot } from "@/types";
import type { ProviderType } from "@/music-source/types";

export function useSystemWatchdog() {
  const isMounted = useRef(false);
  const storeRef = useRef(useMusicPlayerStore.getState);
  storeRef.current = useMusicPlayerStore.getState;

  const debugMode = useSettingsStore((s) => s.debugMode);

  // ==================== Mount ====================

  useEffect(() => {
    if (isMounted.current) return;
    isMounted.current = true;

    const logger = getLogger();
    const telemetry = getTelemetry();
    const watchdog = getPlaybackWatchdog();
    const selfHealing = getProviderSelfHealing();
    const cacheGov = getCacheGovernance();
    const recoveryPipeline = getStartupRecoveryPipeline();
    const providerManager = getProviderManager();

    // ---- 1. 日志系统 (根据 debugMode) ----
    if (debugMode) {
      logger.enableAll();
    }

    // ---- 2. 遥测启动 ----
    telemetry.start();

    // ---- 3. 缓存治理启动 ----
    cacheGov.start();

    // ---- 4. 看门狗配置 ----
    watchdog.setStoreReader(() => {
      const s = storeRef.current();
      return {
        isPlaying: s.isPlaying,
        currentTime: s.currentTime,
        loadingState: s.loadingState,
        currentSongId: s.currentSong?.id ?? null,
        queueIndex: s.queueIndex,
        queueLength: s.queue.length,
      };
    });

    watchdog.setStoreActions({
      next: () => useMusicPlayerStore.getState().next(),
      pause: () => useMusicPlayerStore.getState().pause(),
      setLoadingState: (state: string) =>
        useMusicPlayerStore.getState().setLoadingState(
          state as "idle" | "loading" | "ready" | "error",
        ),
    });

    watchdog.setOnRecover((action: WatchdogRecoveryAction, event: WatchdogEvent) => {
      telemetry.recordWatchdogRecovery(action, true);
      logger.info("watchdog", `Auto-recovery: ${action} for ${event.type}`);
    });

    watchdog.start();

    // ---- 5. Provider 自愈 ----
    selfHealing.setOnDegrade((type: string, reason: string) => {
      useProviderStore.getState().setFallback("consecutive_failures");
      logger.warn("provider", `Auto-degraded: ${type} — ${reason}`);
    });

    selfHealing.setOnHeal((type: string) => {
      logger.info("provider", `Auto-recovered: ${type}`);
    });

    // 监听 ProviderManager 健康变化 → 触发自愈评分
    providerManager.setOnHealthChange((type: ProviderType, health: ProviderHealthSnapshot) => {
      selfHealing.evaluate(type, health);
      useProviderStore.getState().updateHealth(type, health);
    });

    // ---- 6. 启动恢复管道 ----
    recoveryPipeline.execute({
      setVolume: (v) => useMusicPlayerStore.getState().setVolume(v),
      setMuted: (v) => {
        if (v) useMusicPlayerStore.getState().toggleMute();
      },
      setPlayMode: (m) =>
        useMusicPlayerStore.getState().setPlayMode(
          m as "sequential" | "repeat" | "repeat-one" | "shuffle",
        ),
    });

    // ---- 7. 遥测: 记录启动时间 ----
    // TTI 粗略估算: 使用 requestIdleCallback 或 setTimeout
    setTimeout(() => {
      const tti = performance.now();
      telemetry.setTimeToInteractive(tti);
    }, 100);

    // ---- Cleanup ----
    return () => {
      watchdog.stop();
      cacheGov.stop();
      telemetry.stop();
      logger.disableAll();
      isMounted.current = false;
    };
  }, [debugMode]);

  // ==================== DebugMode 响应 ====================

  useEffect(() => {
    const logger = getLogger();
    if (debugMode) {
      logger.enableAll();
    } else {
      logger.disableAll();
    }
  }, [debugMode]);
}

// ==================== 便捷: 获取系统健康状态 ====================

export function useSystemHealth() {
  const storeRef = useRef(useMusicPlayerStore.getState);
  storeRef.current = useMusicPlayerStore.getState;

  const getHealth = useCallback(() => {
    const watchdog = getPlaybackWatchdog();
    const selfHealing = getProviderSelfHealing();
    const cacheGov = getCacheGovernance();
    const telemetry = getTelemetry();
    const providerManager = getProviderManager();

    const wdState = watchdog.getState();
    const scores = selfHealing.getScores();
    const cacheResult = cacheGov.getLastResult();
    const telemetrySnapshot = telemetry.getSnapshot();
    const activeProvider = providerManager.getActiveType();

    return {
      watchdog: wdState,
      providerScores: scores,
      activeProvider,
      lastCacheCleanup: cacheResult,
      telemetry: telemetrySnapshot,
      timestamp: Date.now(),
    };
  }, []);

  return getHealth;
}

/**
 * Phase 17 — Stability Monitor Hook
 *
 * 职责:
 * - 后台播放监控 (visibilitychange + AudioContext state)
 * - 锁屏恢复 (Media Session action handler 回调)
 * - AirPods/蓝牙事件 (navigator.mediaSession 状态变化)
 * - 网络切换检测 (online/offline + effectiveType 变化)
 * - 弱网场景追踪 (slow-2g/2g detection)
 * - Worker timeout 检测 (Worker 心跳)
 * - Safari suspend/resume (pageshow/pagehide + bfcache)
 *
 * 在 AudioProvider 中挂载
 */

"use client";

import { useEffect, useRef, useCallback } from "react";
import { useMusicPlayerStore } from "@/stores/musicPlayerStore";
import { useSystemStore } from "@/stores/systemStore";
import { getTelemetry } from "@/system/telemetry/TelemetryService";
import { getLogger } from "@/lib/logs/Logger";
import type { StabilityEvent, StabilityReport } from "@/types";

// 全局单例报告
const globalStabilityReport: StabilityReport = {
  events: [],
  backgroundPlayCount: 0,
  lockScreenRecoveryCount: 0,
  bluetoothSwitchCount: 0,
  networkSwitchCount: 0,
  weakNetworkCount: 0,
  safariSuspendCount: 0,
  safariResumeCount: 0,
  sessionStart: Date.now(),
  uptimeMs: 0,
};

export function getStabilityReport(): Readonly<StabilityReport> {
  return {
    ...globalStabilityReport,
    uptimeMs: Date.now() - globalStabilityReport.sessionStart,
  };
}

export function useStabilityMonitor() {
  const initialized = useRef(false);
  const logger = getLogger();
  const telemetry = getTelemetry();

  const addEvent = useCallback((type: StabilityEvent["type"], details: string, recovered: boolean) => {
    const event: StabilityEvent = { type, timestamp: Date.now(), details, recovered };
    globalStabilityReport.events.push(event);
    if (globalStabilityReport.events.length > 500) {
      globalStabilityReport.events = globalStabilityReport.events.slice(-500);
    }
    telemetry.record({
      name: `stability.${type}`,
      value: recovered ? 1 : 0,
      tags: { details },
      timestamp: Date.now(),
    });
  }, [telemetry]);

  useEffect(() => {
    if (initialized.current || typeof window === "undefined") return;
    initialized.current = true;
    globalStabilityReport.sessionStart = Date.now();

    // ===== 1. 后台播放监控 =====
    const handleVisibilityForBackground = () => {
      if (document.visibilityState === "hidden") {
        const store = useMusicPlayerStore.getState();
        if (store.isPlaying) {
          globalStabilityReport.backgroundPlayCount++;
          logger.debug("stability", "Background playback detected");
          addEvent("background_playback", "Playing in background", true);
        }
      }
    };
    document.addEventListener("visibilitychange", handleVisibilityForBackground);

    // ===== 2. 锁屏恢复 =====
    let wasPlayingBeforeLock = false;
    const handleVisibilityForLock = () => {
      if (document.visibilityState === "hidden") {
        const store = useMusicPlayerStore.getState();
        wasPlayingBeforeLock = store.isPlaying;
      } else if (document.visibilityState === "visible" && wasPlayingBeforeLock) {
        globalStabilityReport.lockScreenRecoveryCount++;
        addEvent("lock_screen", "Returned from lock screen", true);
        wasPlayingBeforeLock = false;
      }
    };
    document.addEventListener("visibilitychange", handleVisibilityForLock);

    // ===== 3. 蓝牙/AirPods 事件 =====
    // Audio session state changes (iOS Safari)
    if ("mediaSession" in navigator) {
      try {
        const ms = navigator.mediaSession as MediaSession & {
          onaudiosessionstatechanged?: ((this: MediaSession, ev: Event) => unknown) | null;
        };
        ms.onaudiosessionstatechanged = () => {
          globalStabilityReport.bluetoothSwitchCount++;
          addEvent("bluetooth", "Audio session changed", true);
        };
      } catch {
        // Not supported
      }
    }

    // ===== 4. 网络切换 =====
    const handleOnline = () => {
      globalStabilityReport.networkSwitchCount++;
      useSystemStore.getState().setNetworkState("online");
      addEvent("network_switch", "Network restored (online)", true);
    };
    const handleOffline = () => {
      globalStabilityReport.networkSwitchCount++;
      useSystemStore.getState().setNetworkState("offline");
      addEvent("network_switch", "Network lost (offline)", false);
    };
    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    // ===== 5. 弱网检测 =====
    const conn = (navigator as Navigator & { connection?: NetworkInformation }).connection;
    if (conn) {
      const handleNetworkChange = () => {
        const effectiveType = conn.effectiveType ?? "4g";
        if (effectiveType === "slow-2g" || effectiveType === "2g") {
          globalStabilityReport.weakNetworkCount++;
          useSystemStore.getState().setNetworkState("slow");
          addEvent("weak_network", `Weak network: ${effectiveType}`, false);
        } else {
          useSystemStore.getState().setNetworkState("online");
        }
      };
      conn.addEventListener("change", handleNetworkChange);
      return () => conn.removeEventListener("change", handleNetworkChange);
    }

    // ===== 6. Safari suspend/resume =====
    const handlePageHide = (e: PageTransitionEvent) => {
      if (!e.persisted) {
        globalStabilityReport.safariSuspendCount++;
        addEvent("safari_suspend", "Page unloaded (non-bfcache)", false);
      }
    };
    const handlePageShow = (e: PageTransitionEvent) => {
      if (e.persisted) {
        globalStabilityReport.safariResumeCount++;
        addEvent("safari_resume", "Page restored from bfcache", true);
      } else {
        addEvent("safari_resume", "Cold start (new page load)", true);
      }
    };
    window.addEventListener("pagehide", handlePageHide);
    window.addEventListener("pageshow", handlePageShow);

    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityForBackground);
      document.removeEventListener("visibilitychange", handleVisibilityForLock);
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
      window.removeEventListener("pagehide", handlePageHide);
      window.removeEventListener("pageshow", handlePageShow);
    };
  }, [addEvent, logger]);

  return {
    report: globalStabilityReport,
    addEvent,
  };
}

// ==================== NetworkInformation type ====================

interface NetworkInformation extends EventTarget {
  effectiveType: string;
  rtt: number;
  downlink: number;
  saveData: boolean;
}

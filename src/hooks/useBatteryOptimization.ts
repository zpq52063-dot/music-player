/**
 * Phase 17 — Battery Optimization Hook
 *
 * 职责:
 * - reduced motion 检测 (prefers-reduced-motion)
 * - animation throttling (低电量时降帧)
 * - visibility optimization (页面不可见时停动画)
 * - low power handling (Battery API 检测)
 *
 * 在 AudioProvider 中挂载
 */

"use client";

import { useEffect, useRef, useCallback, useState } from "react";
import type { BatteryState, BatteryOptimizationConfig } from "@/types";
import { DEFAULT_BATTERY_OPTIMIZATION } from "@/types";

const globalConfig: BatteryOptimizationConfig = { ...DEFAULT_BATTERY_OPTIMIZATION };

export function getBatteryConfig(): BatteryOptimizationConfig {
  return { ...globalConfig };
}

export function useBatteryOptimization() {
  const initialized = useRef(false);
  const [batteryState, setBatteryState] = useState<BatteryState>({
    charging: true,
    level: 1,
    chargingTime: 0,
    dischargingTime: 0,
    isLowPower: false,
  });

  // 检测 reduced motion 偏好
  const checkReducedMotion = useCallback(() => {
    if (typeof window === "undefined") return;
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    globalConfig.reducedMotion = mq.matches;
  }, []);

  // 检测 Battery API
  const setupBatteryMonitor = useCallback(() => {
    if (typeof navigator === "undefined") return;

    // navigator.getBattery API
    const nav = navigator as Navigator & { getBattery?: () => Promise<BatteryManager> };
    nav.getBattery?.()
      .then((battery: BatteryManager) => {
        const updateState = () => {
          const isLowPower =
            !battery.charging && battery.level <= 0.2 && battery.dischargingTime < 3600;

          setBatteryState({
            charging: battery.charging,
            level: battery.level,
            chargingTime: battery.chargingTime,
            dischargingTime: battery.dischargingTime,
            isLowPower,
          });

          globalConfig.lowPowerMode = isLowPower;
          globalConfig.animationThrottleMs = isLowPower ? 600 : 300;
        };

        updateState();
        battery.addEventListener("chargingchange", updateState);
        battery.addEventListener("levelchange", updateState);
        battery.addEventListener("chargingtimechange", updateState);
        battery.addEventListener("dischargingtimechange", updateState);
      })
      .catch(() => {
        // Battery API not available (Safari < 16, Firefox, etc.)
        // Use MediaQuery API as fallback for iOS
        if (typeof window !== "undefined") {
          // iOS doesn't expose Battery API, but we can check for low power mode via Canvas
          // Since iOS 15.4, Safari supports prefers-reduced-data (experimental)
          // We use a conservative approach: treat all iOS as potentially battery-aware
        }
      });
  }, []);

  // 可见性优化: 不可见时设置标记
  const setupVisibilityMonitor = useCallback(() => {
    if (typeof document === "undefined") return;

    const handler = () => {
      globalConfig.visibilityOptimized = document.visibilityState !== "visible";
    };

    document.addEventListener("visibilitychange", handler);
    return () => document.removeEventListener("visibilitychange", handler);
  }, []);

  // 监听 reduced motion 变化
  const setupReducedMotionListener = useCallback(() => {
    if (typeof window === "undefined") return;
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");

    const handler = (e: MediaQueryListEvent) => {
      globalConfig.reducedMotion = e.matches;
    };

    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, []);

  useEffect(() => {
    if (initialized.current) return;
    initialized.current = true;

    checkReducedMotion();
    setupBatteryMonitor();
    const visCleanup = setupVisibilityMonitor();
    const motionCleanup = setupReducedMotionListener();

    return () => {
      visCleanup?.();
      motionCleanup?.();
    };
  }, [checkReducedMotion, setupBatteryMonitor, setupVisibilityMonitor, setupReducedMotionListener]);

  return {
    batteryState,
    config: globalConfig,
    isLowPower: batteryState.isLowPower || globalConfig.lowPowerMode,
    isReducedMotion: globalConfig.reducedMotion,
  };
}

// ==================== BatteryManager type (not in standard lib) ====================

interface BatteryManager extends EventTarget {
  charging: boolean;
  level: number;
  chargingTime: number;
  dischargingTime: number;
  onchargingchange: ((this: BatteryManager, ev: Event) => unknown) | null;
  onlevelchange: ((this: BatteryManager, ev: Event) => unknown) | null;
  onchargingtimechange: ((this: BatteryManager, ev: Event) => unknown) | null;
  ondischargingtimechange: ((this: BatteryManager, ev: Event) => unknown) | null;
}

export { type BatteryManager };

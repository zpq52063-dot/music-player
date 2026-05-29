/**
 * Phase 20C — Idle Resource Release Hook
 *
 * iPhone Safari memory optimization:
 * - Trims AudioContext on page hide
 * - Releases visualization/EQ buffers on long idle
 * - Trims cache memory on low storage
 * - Reacquires AudioContext on user interaction
 */

"use client";

import { useEffect, useRef } from "react";
import { getAudioContextManager } from "@/lib/audio/webaudio/AudioContextManager";
import { getEQEngine } from "@/lib/audio/webaudio/EQEngine";
import { getVisualizationAnalyzer } from "@/lib/audio/webaudio/VisualizationAnalyzer";
import { getCacheGovernanceV2 } from "@/system/cleanup/CacheGovernanceV2";

const LONG_IDLE_MS = 60_000; // 1 min before full release
const TRIM_IDLE_MS = 15_000; // 15s before trim

export function useIdleResourceRelease() {
  const trimTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const releaseTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const ctxMgr = getAudioContextManager();
    const viz = getVisualizationAnalyzer();
    const eq = getEQEngine();
    const cache = getCacheGovernanceV2();

    const cancelTimers = () => {
      if (trimTimerRef.current) {
        clearTimeout(trimTimerRef.current);
        trimTimerRef.current = null;
      }
      if (releaseTimerRef.current) {
        clearTimeout(releaseTimerRef.current);
        releaseTimerRef.current = null;
      }
    };

    const scheduleTrim = () => {
      cancelTimers();
      trimTimerRef.current = setTimeout(() => {
        ctxMgr.memoryTrim();
        viz.trimMemory();
        eq.trimMemory();
        void cache.runFullCleanup();
      }, TRIM_IDLE_MS);
    };

    const scheduleRelease = () => {
      cancelTimers();
      releaseTimerRef.current = setTimeout(() => {
        ctxMgr.releaseMemory();
        viz.trimMemory();
        eq.trimMemory();
        void cache.runFullCleanup();
      }, LONG_IDLE_MS);
    };

    const onVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        cancelTimers();
        void ctxMgr.reacquire();
      } else {
        scheduleTrim();
      }
    };

    const onBeforeUnload = () => {
      ctxMgr.releaseMemory();
    };

    document.addEventListener("visibilitychange", onVisibilityChange);
    window.addEventListener("beforeunload", onBeforeUnload);

    // Phase 20C: iOS Safari memory pressure listener
    // Safari does not expose a standard memory pressure event;
    // we rely on pagehide + beforeunload + visibilitychange instead.

    // Safari-specific: listen for pagehide (fired when swiping away in iOS)
    const onPageHide = (e: PageTransitionEvent) => {
      if (e.persisted) {
        // Page is going into bfcache — trim resources
        ctxMgr.memoryTrim();
        viz.trimMemory();
      } else {
        // Page is being unloaded — release fully
        ctxMgr.releaseMemory();
      }
    };

    window.addEventListener("pagehide", onPageHide);

    // Initial: schedule idle release (user may never interact with audio)
    scheduleRelease();

    return () => {
      cancelTimers();
      document.removeEventListener("visibilitychange", onVisibilityChange);
      window.removeEventListener("beforeunload", onBeforeUnload);
      window.removeEventListener("pagehide", onPageHide);
      // Note: no standard way to remove memorywarning listener
    };
  }, []);
}

"use client";

import { useState, useEffect, useRef } from "react";
import { useMusicPlayerStore } from "@/stores/musicPlayerStore";
import { getProviderManager } from "@/music-source/providers/provider-manager/ProviderManager";
import { getTelemetry } from "@/system/telemetry/TelemetryService";
import { getProviderSelfHealing } from "@/system/recovery/ProviderSelfHealing";

/**
 * Phase 9 — Debug Overlay
 *
 * 浮动调试面板:
 * - 当前 Provider
 * - Cache 命中率
 * - Audio 状态
 * - 请求状态
 * - Memory 信息
 *
 * 快捷手势唤出: 三指双击 (仅 debug 模式)
 * 也可通过设置页 → Debug Overlay → Show 手动打开
 */
export function DebugOverlay() {
  const [visible, setVisible] = useState(false);
  const tapCountRef = useRef(0);
  const tapTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const currentSong = useMusicPlayerStore((s) => s.currentSong);
  const isPlaying = useMusicPlayerStore((s) => s.isPlaying);
  const loadingState = useMusicPlayerStore((s) => s.loadingState);
  const currentTime = useMusicPlayerStore((s) => s.currentTime);
  const duration = useMusicPlayerStore((s) => s.duration);

  const [tick, setTick] = useState(0);

  // 定时刷新
  useEffect(() => {
    if (!visible) return;
    const timer = setInterval(() => setTick((t) => t + 1), 1000);
    return () => clearInterval(timer);
  }, [visible]);

  // 三指双击检测
  useEffect(() => {
    const handler = (e: TouchEvent) => {
      if (e.touches.length === 3) {
        tapCountRef.current++;
        if (tapTimerRef.current) clearTimeout(tapTimerRef.current);

        tapTimerRef.current = setTimeout(() => {
          if (tapCountRef.current >= 2) {
            setVisible((v) => !v);
          }
          tapCountRef.current = 0;
        }, 400);
      }
    };

    document.addEventListener("touchstart", handler, { passive: true });
    return () => document.removeEventListener("touchstart", handler);
  }, []);

  // Keyboard toggle: Ctrl+Shift+D
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.shiftKey && e.key === "D") {
        e.preventDefault();
        setVisible((v) => !v);
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  const data = useOverlayData(tick);

  if (!visible) {
    return (
      <div
        className="fixed bottom-20 right-2 z-[99] rounded-full bg-accent-primary/30 px-2 py-1 text-[10px] text-white/50"
        onClick={() => setVisible(true)}
      >
        Debug
      </div>
    );
  }

  return (
    <div className="fixed inset-x-0 bottom-0 z-[99] mx-auto max-w-md rounded-t-apple-xl bg-black/95 p-4 backdrop-blur-xl">
      {/* Handle */}
      <div className="mb-3 flex items-center justify-between">
        <div className="mx-auto h-1 w-8 rounded-full bg-white/20" />
        <button
          onClick={() => setVisible(false)}
          className="absolute right-4 rounded-full bg-white/10 px-2 py-0.5 text-[10px] text-white/60"
        >
          Hide
        </button>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-xs">
        {/* Provider */}
        <div className="col-span-2 flex items-center justify-between rounded-apple bg-white/5 px-2 py-1.5">
          <span className="text-text-tertiary">Provider</span>
          <span className="font-medium text-accent-secondary">{data.activeProvider}</span>
        </div>

        {/* Audio */}
        <KV label="Audio" value={isPlaying ? "▶ Playing" : "⏸ Paused"} />
        <KV label="Loading" value={loadingState} />

        {/* Position */}
        <KV label="Position" value={`${currentTime.toFixed(0)}/${duration.toFixed(0)}s`} />
        <KV label="Song" value={currentSong?.title?.slice(0, 15) ?? "—"} />

        {/* Cache */}
        <KV label="Cache Hit%" value={`${(data.cacheHitRate * 100).toFixed(0)}%`} />
        <KV label="Provider Score" value={data.providerScore} />

        {/* Recoveries */}
        <KV label="Stalls" value={data.totalStalls} />
        <KV label="Recoveries" value={data.totalRecoveries} />

        {/* Memory */}
        <KV label="Memory" value={data.memoryInfo} />

        {/* Requests */}
        <KV label="Provider Reqs" value={data.totalProviderReqs} />
      </div>

      {/* Quick actions */}
      <div className="mt-3 flex gap-2">
        <button
          onClick={() => setVisible(false)}
          className="flex-1 rounded-apple bg-white/10 py-1.5 text-[10px] text-text-secondary active:scale-95"
        >
          Close
        </button>
        <button
          onClick={() => {
            window.location.href = "/diagnostics";
          }}
          className="flex-1 rounded-apple bg-accent-secondary/20 py-1.5 text-[10px] text-accent-secondary active:scale-95"
        >
          Full Diagnostics
        </button>
      </div>
    </div>
  );
}

function KV({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="flex items-center justify-between rounded-apple bg-white/5 px-2 py-1">
      <span className="text-text-tertiary">{label}</span>
      <span className="font-medium text-text-primary">{String(value)}</span>
    </div>
  );
}

function useOverlayData(_tick: number) {
  const providerManager = getProviderManager();
  const telemetry = getTelemetry();
  const snap = telemetry.getSnapshot();

  const activeProvider = providerManager.getActiveType();
  const cacheHitRate = snap.cache.memoryHitRate;
  const totalProviderReqs = Object.values(snap.provider).reduce((sum, m) => sum + m.totalRequests, 0);

  let providerScore = "N/A";
  try {
    const selfHealing = getProviderSelfHealing();
    const score = selfHealing.getScore(activeProvider);
    if (score) {
      providerScore = `${score.compositeScore}`;
    }
  } catch {
    providerScore = "N/A";
  }

  let memoryInfo = "N/A";
  if (typeof performance !== "undefined" && "memory" in performance) {
    const mem = (performance as Performance & { memory?: { usedJSHeapSize: number; jsHeapSizeLimit: number } }).memory;
    if (mem) {
      memoryInfo = `${(mem.usedJSHeapSize / 1024 / 1024).toFixed(0)}MB / ${(mem.jsHeapSizeLimit / 1024 / 1024).toFixed(0)}MB`;
    }
  }

  return {
    activeProvider,
    cacheHitRate,
    totalProviderReqs,
    providerScore,
    memoryInfo,
    totalStalls: snap.playback.totalStalls,
    totalRecoveries: snap.playback.totalWatchdogRecoveries,
  };
}

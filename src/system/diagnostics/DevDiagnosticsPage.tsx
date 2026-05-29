"use client";

import { useState, useMemo, useCallback } from "react";
import { useMusicPlayerStore } from "@/stores/musicPlayerStore";
import { useProviderStore } from "@/stores/providerStore";
import { useSystemStore } from "@/stores/systemStore";
import { useSettingsStore } from "@/stores/settingsStore";
import { getPlaybackWatchdog } from "@/system/watchdog/PlaybackWatchdog";
import { getProviderSelfHealing } from "@/system/recovery/ProviderSelfHealing";
import { getCacheGovernance } from "@/system/cleanup/CacheGovernance";
import { getTelemetry } from "@/system/telemetry/TelemetryService";
import { getLogger } from "@/lib/logs/Logger";
import { getProviderManager } from "@/music-source/providers/provider-manager/ProviderManager";
import type { WatchdogState, ProviderScoreMap, CacheCleanupResult, TelemetrySnapshot } from "@/types";

interface DiagnosticsData {
  watchdog: WatchdogState;
  scores: ProviderScoreMap;
  activeProvider: string;
  lastCacheCleanup: CacheCleanupResult | null;
  telemetry: TelemetrySnapshot;
}

function refreshData(): DiagnosticsData {
  const watchdog = getPlaybackWatchdog();
  const selfHealing = getProviderSelfHealing();
  const cacheGov = getCacheGovernance();
  const telemetry = getTelemetry();
  const providerManager = getProviderManager();

  return {
    watchdog: watchdog.getState(),
    scores: selfHealing.getScores(),
    activeProvider: providerManager.getActiveType(),
    lastCacheCleanup: cacheGov.getLastResult(),
    telemetry: telemetry.getSnapshot(),
  };
}

export function DevDiagnosticsPage() {
  const [data, setData] = useState<DiagnosticsData>(refreshData);
  const [activeTab, setActiveTab] = useState<"overview" | "provider" | "cache" | "logs" | "playback">("overview");

  const currentSong = useMusicPlayerStore((s) => s.currentSong);
  const isPlaying = useMusicPlayerStore((s) => s.isPlaying);
  const loadingState = useMusicPlayerStore((s) => s.loadingState);
  const currentTime = useMusicPlayerStore((s) => s.currentTime);
  const duration = useMusicPlayerStore((s) => s.duration);
  const queue = useMusicPlayerStore((s) => s.queue);
  const queueIndex = useMusicPlayerStore((s) => s.queueIndex);
  const playMode = useMusicPlayerStore((s) => s.playMode);
  const volume = useMusicPlayerStore((s) => s.volume);
  const isMuted = useMusicPlayerStore((s) => s.isMuted);
  const buffered = useMusicPlayerStore((s) => s.buffered);

  const providerState = useProviderStore((s) => s);
  const networkState = useSystemStore((s) => s.networkState);
  const debugMode = useSettingsStore((s) => s.debugMode);

  // Logs refreshed whenever the diagnostics data is refreshed
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const logs = useMemo(() => getLogger().getLogs(), [data]);

  const handleRefresh = useCallback(() => {
    setData(refreshData());
  }, []);

  const handleClearCache = useCallback(async () => {
    const cacheGov = getCacheGovernance();
    await cacheGov.runCleanup();
    handleRefresh();
  }, [handleRefresh]);

  const handleClearLogs = useCallback(() => {
    getLogger().clearBuffer();
    handleRefresh();
  }, [handleRefresh]);

  const handleExportTelemetry = useCallback(() => {
    const telemetry = getTelemetry();
    const json = telemetry.exportJSON();
    const blob = new Blob([json], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `telemetry-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }, []);

  const tabs = [
    { key: "overview" as const, label: "总览" },
    { key: "provider" as const, label: "Provider" },
    { key: "playback" as const, label: "播放" },
    { key: "cache" as const, label: "缓存" },
    { key: "logs" as const, label: "日志" },
  ];

  return (
    <div className="min-h-[100dvh] bg-background px-4 pb-8 pt-4 text-sm text-text-primary">
      {/* Header */}
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h1 className="text-lg font-semibold">Diagnostics</h1>
          <p className="text-xs text-text-tertiary">Phase 9 — Dev Diagnostics Center</p>
        </div>
        <button
          onClick={handleRefresh}
          className="rounded-apple bg-surface px-3 py-1.5 text-xs text-text-secondary active:scale-95"
        >
          Refresh
        </button>
      </div>

      {/* Tabs */}
      <div className="mb-4 flex gap-1 rounded-apple bg-surface p-1">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`flex-1 rounded-apple px-2 py-1.5 text-xs font-medium transition-colors ${
              activeTab === tab.key
                ? "bg-accent-primary text-white"
                : "text-text-tertiary"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="space-y-3">
        {/* ===== OVERVIEW ===== */}
        {activeTab === "overview" && (
          <>
            <StatusCard title="Watchdog" color="green">
              <KV label="Running" value={data.watchdog.isRunning ? "Yes" : "No"} />
              <KV label="Total Recoveries" value={data.watchdog.totalRecoveries} />
              <KV label="Stall Count" value={data.watchdog.stallCount} />
              <KV label="Last Check" value={data.watchdog.lastCheckTime ? new Date(data.watchdog.lastCheckTime).toLocaleTimeString() : "N/A"} />
            </StatusCard>

            <StatusCard title="Audio" color="blue">
              <KV label="Current Song" value={currentSong?.title ?? "None"} />
              <KV label="State" value={isPlaying ? "Playing" : "Paused"} />
              <KV label="Loading" value={loadingState} />
              <KV label="Progress" value={`${currentTime.toFixed(1)}s / ${duration.toFixed(1)}s`} />
              <KV label="Buffered" value={`${buffered.toFixed(0)}%`} />
              <KV label="Volume" value={`${(isMuted ? 0 : volume * 100).toFixed(0)}%`} />
            </StatusCard>

            <StatusCard title="Provider" color="purple">
              <KV label="Active" value={data.activeProvider} />
              <KV label="Status" value={providerState.status} />
              <KV label="Fallback Reason" value={providerState.lastFallbackReason ?? "None"} />
            </StatusCard>

            <StatusCard title="Network & System" color="yellow">
              <KV label="Network" value={networkState} />
              <KV label="Debug Mode" value={debugMode ? "ON" : "OFF"} />
              <KV label="Queue" value={`${queueIndex + 1}/${queue.length}`} />
              <KV label="Mode" value={playMode} />
            </StatusCard>

            <StatusCard title="Telemetry" color="cyan">
              <KV label="Total Plays" value={data.telemetry.playback.totalPlays} />
              <KV label="Total Stalls" value={data.telemetry.playback.totalStalls} />
              <KV label="Total Errors" value={data.telemetry.playback.totalErrors} />
              <KV label="WD Recoveries" value={data.telemetry.playback.totalWatchdogRecoveries} />
              <KV label="TTI" value={`${data.telemetry.startup.timeToInteractive.toFixed(0)}ms`} />
            </StatusCard>
          </>
        )}

        {/* ===== PROVIDER ===== */}
        {activeTab === "provider" && (
          <>
            <StatusCard title="Provider Scores" color="purple">
              {Object.entries(data.scores).length === 0 && (
                <p className="text-text-tertiary">No scores yet</p>
              )}
              {Object.entries(data.scores).map(([type, score]) => (
                <div key={type} className="mb-2 border-b border-white/5 pb-2 last:border-0">
                  <div className="flex items-center justify-between">
                    <span className="font-medium">{type}</span>
                    <span className={`text-xs font-bold ${score.compositeScore >= 70 ? "text-accent-tertiary" : score.compositeScore >= 30 ? "text-yellow-500" : "text-accent-primary"}`}>
                      {score.compositeScore}
                    </span>
                  </div>
                  <div className="mt-1 flex gap-2 text-xs text-text-tertiary">
                    <span>Latency: {score.latencyScore}</span>
                    <span>Health: {score.healthScore}</span>
                  </div>
                  <div className="mt-1 h-1 overflow-hidden rounded-full bg-surface">
                    <div
                      className={`h-full rounded-full transition-all ${
                        score.compositeScore >= 70 ? "bg-accent-tertiary" : score.compositeScore >= 30 ? "bg-yellow-500" : "bg-accent-primary"
                      }`}
                      style={{ width: `${score.compositeScore}%` }}
                    />
                  </div>
                </div>
              ))}
            </StatusCard>

            <StatusCard title="Provider Health (Raw)" color="indigo">
              {Object.entries(providerState.health).length === 0 && (
                <p className="text-text-tertiary">No health data</p>
              )}
              {Object.entries(providerState.health).map(([type, health]) => (
                <div key={type} className="mb-2 border-b border-white/5 pb-2 last:border-0">
                  <div className="flex items-center justify-between">
                    <span className="font-medium">{type}</span>
                    <span className={`text-xs ${health.healthy ? "text-accent-tertiary" : "text-accent-primary"}`}>
                      {health.healthy ? "Healthy" : "Unhealthy"}
                    </span>
                  </div>
                  <div className="mt-1 text-xs text-text-tertiary">
                    <span>Success: {health.successRate.toFixed(0)}%</span>
                    <span className="ml-3">Avg: {health.avgLatency.toFixed(0)}ms</span>
                    <span className="ml-3">Fails: {health.consecutiveFailures}</span>
                  </div>
                </div>
              ))}
            </StatusCard>

            <StatusCard title="Fallback Chain" color="slate">
              {providerState.providerPriority.map((p, i) => (
                <div key={p} className="flex items-center gap-2 py-1">
                  <span className="text-xs text-text-tertiary w-4">{i + 1}.</span>
                  <span className={p === data.activeProvider ? "text-accent-secondary font-medium" : "text-text-secondary"}>
                    {p}
                  </span>
                  {p === data.activeProvider && (
                    <span className="rounded-full bg-accent-secondary/20 px-1.5 py-0.5 text-[10px] text-accent-secondary">
                      active
                    </span>
                  )}
                </div>
              ))}
            </StatusCard>
          </>
        )}

        {/* ===== PLAYBACK ===== */}
        {activeTab === "playback" && (
          <>
            <StatusCard title="Playback State" color="blue">
              <KV label="Song" value={currentSong?.title ?? "None"} />
              <KV label="Artist" value={currentSong?.artist ?? "—"} />
              <KV label="Album" value={currentSong?.album ?? "—"} />
              <KV label="Status" value={`${isPlaying ? "▶" : "⏸"} ${loadingState}`} />
              <KV label="Position" value={`${currentTime.toFixed(1)}s / ${duration.toFixed(1)}s`} />
              <KV label="Buffered" value={`${buffered.toFixed(0)}%`} />
              <KV label="Volume" value={`${(isMuted ? 0 : volume * 100).toFixed(0)}% (${isMuted ? "muted" : "unmuted"})`} />
              <KV label="Mode" value={playMode} />
            </StatusCard>

            <StatusCard title="Queue" color="teal">
              <KV label="Size" value={queue.length} />
              <KV label="Index" value={queueIndex} />
              <div className="mt-2 max-h-48 overflow-y-auto">
                {queue.map((s, i) => (
                  <div
                    key={s.id}
                    className={`flex items-center gap-2 border-b border-white/5 py-1.5 text-xs ${
                      i === queueIndex ? "text-accent-primary font-medium" : "text-text-tertiary"
                    }`}
                  >
                    <span className="w-5 text-right">{i + 1}.</span>
                    <span className="truncate">{s.title}</span>
                    <span className="text-text-tertiary">{s.artist}</span>
                  </div>
                ))}
              </div>
            </StatusCard>

            <StatusCard title="Watchdog Events" color="green">
              {data.watchdog.recentEvents.length === 0 && (
                <p className="text-text-tertiary text-xs">No events</p>
              )}
              {data.watchdog.recentEvents.slice(-10).reverse().map((evt, i) => (
                <div key={i} className="border-b border-white/5 py-1 text-xs">
                  <span className="text-accent-secondary">{evt.type}</span>
                  <span className="ml-2 text-text-tertiary">{new Date(evt.timestamp).toLocaleTimeString()}</span>
                  <p className="text-text-tertiary truncate">{evt.details}</p>
                </div>
              ))}
            </StatusCard>
          </>
        )}

        {/* ===== CACHE ===== */}
        {activeTab === "cache" && (
          <>
            <StatusCard title="Last Cleanup" color="orange">
              {data.lastCacheCleanup ? (
                <>
                  <KV label="Lyrics Removed" value={data.lastCacheCleanup.lyricsRemoved} />
                  <KV label="History Removed" value={data.lastCacheCleanup.historyRemoved} />
                  <KV label="Metadata Removed" value={data.lastCacheCleanup.metadataRemoved} />
                  <KV label="Total Freed" value={data.lastCacheCleanup.totalFreed} />
                  <KV label="Timestamp" value={new Date(data.lastCacheCleanup.timestamp).toLocaleTimeString()} />
                </>
              ) : (
                <p className="text-text-tertiary">No cleanup run yet</p>
              )}
            </StatusCard>

            <StatusCard title="Cache Metrics" color="amber">
              <KV label="Memory Hit Rate" value={`${(data.telemetry.cache.memoryHitRate * 100).toFixed(1)}%`} />
              <KV label="IndexedDB Hit Rate" value={`${(data.telemetry.cache.indexedDBHitRate * 100).toFixed(1)}%`} />
              <KV label="SW Hit Rate" value={`${(data.telemetry.cache.swHitRate * 100).toFixed(1)}%`} />
              <KV label="Total Evictions" value={data.telemetry.cache.totalEvictions} />
            </StatusCard>

            <button
              onClick={handleClearCache}
              className="w-full rounded-apple bg-accent-primary/20 py-2 text-xs font-medium text-accent-primary active:scale-95"
            >
              Force Cache Cleanup
            </button>

            <button
              onClick={handleExportTelemetry}
              className="w-full rounded-apple bg-accent-secondary/20 py-2 text-xs font-medium text-accent-secondary active:scale-95"
            >
              Export Telemetry JSON
            </button>
          </>
        )}

        {/* ===== LOGS ===== */}
        {activeTab === "logs" && (
          <>
            <div className="mb-3 flex items-center justify-between">
              <span className="text-xs text-text-tertiary">{logs.length} entries</span>
              <button
                onClick={handleClearLogs}
                className="rounded-apple bg-surface px-2 py-1 text-[10px] text-accent-primary active:scale-95"
              >
                Clear
              </button>
            </div>

            <div className="max-h-96 space-y-1 overflow-y-auto">
              {logs.length === 0 && <p className="text-text-tertiary text-xs">No logs (enable debug mode)</p>}
              {logs.slice(-100).reverse().map((entry, i) => (
                <div
                  key={i}
                  className={`rounded-apple px-2 py-1.5 text-xs ${
                    entry.lvl === "error"
                      ? "bg-accent-primary/10 text-accent-primary"
                      : entry.lvl === "warn"
                        ? "bg-yellow-500/10 text-yellow-500"
                        : "bg-surface text-text-secondary"
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] opacity-50">{new Date(entry.ts).toLocaleTimeString()}</span>
                    <span className="rounded bg-white/10 px-1 text-[10px]">{entry.cat}</span>
                    <span className="text-[10px] uppercase opacity-50">{entry.lvl}</span>
                  </div>
                  <p className="mt-0.5 truncate">{entry.msg}</p>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

// ==================== Sub-Components ====================

function StatusCard({
  title,
  color,
  children,
}: {
  title: string;
  color: string;
  children: React.ReactNode;
}) {
  const borderColors: Record<string, string> = {
    green: "border-l-accent-tertiary",
    blue: "border-l-accent-secondary",
    purple: "border-l-purple-500",
    yellow: "border-l-yellow-500",
    cyan: "border-l-cyan-500",
    indigo: "border-l-indigo-500",
    slate: "border-l-slate-500",
    orange: "border-l-orange-500",
    amber: "border-l-amber-500",
    teal: "border-l-teal-500",
  };

  return (
    <div className={`rounded-apple border-l-2 bg-surface px-3 py-3 ${borderColors[color] ?? "border-l-text-tertiary"}`}>
      <h3 className="mb-2 text-xs font-semibold uppercase tracking-wider text-text-tertiary">{title}</h3>
      <div className="space-y-1">{children}</div>
    </div>
  );
}

function KV({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="flex items-center justify-between text-xs">
      <span className="text-text-tertiary">{label}</span>
      <span className="text-text-primary font-medium">{String(value)}</span>
    </div>
  );
}

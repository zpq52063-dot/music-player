"use client";

// ==================== Phase 16A: Provider Health Dashboard (dev only) ====================

import { useState, useEffect, useCallback } from "react";
import { getEdgeProviderManager } from "../core/EdgeProviderManager";
import { getRemoteConfig } from "../config/RemoteConfig";
import { NetworkValidationPanel } from "../testing/NetworkValidator";
import type { DashboardProviderInfo, EdgeManagerState, CircuitState } from "../types";

// ==================== 格式化工具 ====================

function formatMs(ms: number): string {
  if (ms < 1000) return `${Math.round(ms)}ms`;
  return `${(ms / 1000).toFixed(1)}s`;
}

function formatPercent(value: number): string {
  return `${(value * 100).toFixed(1)}%`;
}

function formatTime(ts: number): string {
  if (ts === 0) return "—";
  const s = Math.round((Date.now() - ts) / 1000);
  if (s < 60) return `${s}s ago`;
  if (s < 3600) return `${Math.floor(s / 60)}m ago`;
  return `${Math.floor(s / 3600)}h ago`;
}

function circuitColor(state: CircuitState): string {
  switch (state) {
    case "closed":
      return "text-green-400";
    case "open":
      return "text-red-400";
    case "half-open":
      return "text-yellow-400";
  }
}

function circuitLabel(state: CircuitState): string {
  switch (state) {
    case "closed":
      return "CLOSED";
    case "open":
      return "OPEN";
    case "half-open":
      return "HALF-OPEN";
  }
}

// ==================== Dashboard Row ====================

function ProviderRow({ info, onToggle, onPriorityUp, onPriorityDown }: {
  info: DashboardProviderInfo;
  onToggle: (id: string) => void;
  onPriorityUp: (id: string) => void;
  onPriorityDown: (id: string) => void;
}) {
  return (
    <div
      className={`flex flex-col gap-2 rounded-xl p-4 ${
        info.active
          ? "bg-accent-primary/10 border border-accent-primary/30"
          : "bg-surface/60 border border-white/5"
      }`}
    >
      {/* Top row */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          {/* Active indicator */}
          <div
            className={`h-2.5 w-2.5 rounded-full ${
              info.active ? "bg-accent-primary animate-pulse" : "bg-text-tertiary"
            }`}
          />
          <div>
            <div className="flex items-center gap-2">
              <span className="text-sm font-semibold text-text-primary">{info.name}</span>
              {info.active && (
                <span className="rounded-full bg-accent-primary/20 px-2 py-0.5 text-[10px] font-medium text-accent-primary">
                  ACTIVE
                </span>
              )}
            </div>
            <div className="text-xs text-text-tertiary">
              {info.id} · {info.source}
            </div>
          </div>
        </div>

        {/* Enable/Disable */}
        <button
          onClick={() => onToggle(info.id)}
          className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
            info.healthy
              ? "bg-green-500/10 text-green-400 hover:bg-green-500/20"
              : "bg-red-500/10 text-red-400 hover:bg-red-500/20"
          }`}
        >
          {info.healthy ? "ENABLED" : "DISABLED"}
        </button>
      </div>

      {/* Metrics grid */}
      <div className="grid grid-cols-3 gap-2">
        <Metric label="Latency" value={formatMs(info.latency)} />
        <Metric label="Availability" value={formatPercent(info.availability)} />
        <Metric label="Retries" value={String(info.retryCount)} />
      </div>

      {/* Bottom row */}
      <div className="flex items-center justify-between text-xs text-text-tertiary">
        <div className="flex items-center gap-3">
          <span>
            Circuit:{" "}
            <span className={circuitColor(info.circuitState)}>
              {circuitLabel(info.circuitState)}
            </span>
          </span>
          <span>Last check: {formatTime(info.lastCheck)}</span>
        </div>

        {/* Priority controls */}
        <div className="flex items-center gap-1">
          <button
            onClick={() => onPriorityUp(info.id)}
            className="rounded p-1 text-text-tertiary hover:bg-surface-highlight hover:text-text-secondary"
            title="Raise priority"
          >
            ▲
          </button>
          <button
            onClick={() => onPriorityDown(info.id)}
            className="rounded p-1 text-text-tertiary hover:bg-surface-highlight hover:text-text-secondary"
            title="Lower priority"
          >
            ▼
          </button>
        </div>
      </div>
    </div>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg bg-black/20 px-3 py-2">
      <div className="text-[10px] uppercase tracking-wide text-text-tertiary">{label}</div>
      <div className="text-sm font-medium text-text-primary">{value}</div>
    </div>
  );
}

// ==================== Dashboard ====================

export function ProviderHealthDashboard() {
  const [state, setState] = useState<EdgeManagerState | null>(null);
  const [expanded, setExpanded] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  const manager = getEdgeProviderManager();
  const config = getRemoteConfig();

  // 轮询状态
  useEffect(() => {
    const tick = () => {
      setState(manager.getState());
    };
    tick();
    const timer = setInterval(tick, 2000);
    return () => clearInterval(timer);
  }, [manager, refreshKey]);

  const handleToggle = useCallback(
    (id: string) => {
      const cfg = getRemoteConfig();
      if (cfg.isProviderEnabled(id)) {
        cfg.disableProvider(id);
        manager.setEnabled(id, false);
      } else {
        cfg.enableProvider(id);
        manager.setEnabled(id, true);
      }
      setRefreshKey((k) => k + 1);
    },
    [manager],
  );

  const handlePriorityUp = useCallback(
    (id: string) => {
      const entries = config.getProviderPriority();
      const idx = entries.findIndex((e) => e.id === id);
      if (idx > 0) {
        [entries[idx - 1]!.priority, entries[idx]!.priority] = [
          entries[idx]!.priority,
          entries[idx - 1]!.priority,
        ];
        config.setProviderPriority(entries);
        manager.setPriority(entries.map((e) => e.id));
        setRefreshKey((k) => k + 1);
      }
    },
    [manager, config],
  );

  const handlePriorityDown = useCallback(
    (id: string) => {
      const entries = config.getProviderPriority();
      const idx = entries.findIndex((e) => e.id === id);
      if (idx >= 0 && idx < entries.length - 1) {
        [entries[idx]!.priority, entries[idx + 1]!.priority] = [
          entries[idx + 1]!.priority,
          entries[idx]!.priority,
        ];
        config.setProviderPriority(entries);
        manager.setPriority(entries.map((e) => e.id));
        setRefreshKey((k) => k + 1);
      }
    },
    [manager, config],
  );

  const buildDashboardInfo = (): DashboardProviderInfo[] => {
    if (!state) return [];
    const ids = manager.getRegisteredIds();
    return ids.map((id) => {
      const health = state.healthSnapshots[id];
      const provider = manager.getActive();
      return {
        id,
        name: provider?.id === id ? provider.name : id,
        source: provider?.id === id ? provider.source : "—",
        active: state.activeProviderId === id,
        latency: health?.avgLatency ?? 0,
        availability: health?.availability ?? 0,
        retryCount: state.retryCounts[id] ?? 0,
        circuitState: state.circuitStates[id] ?? "closed",
        healthy: health?.healthy ?? true,
        lastCheck: health?.lastCheckTime ?? 0,
      };
    });
  };

  const infos = buildDashboardInfo();

  if (infos.length === 0) {
    return (
      <div className="rounded-xl bg-surface/60 p-6 text-center">
        <p className="text-sm text-text-tertiary">No remote providers registered</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-semibold text-text-primary">Remote Provider Health</h3>
          <p className="text-xs text-text-tertiary">
            {infos.length} provider{infos.length > 1 ? "s" : ""} · Active:{" "}
            {state?.activeProviderId ?? "none"}
          </p>
        </div>
        <button
          onClick={() => setExpanded(!expanded)}
          className="text-xs text-accent-secondary hover:text-accent-secondary/80"
        >
          {expanded ? "Collapse" : "Expand"}
        </button>
      </div>

      {/* Config summary */}
      <div className="flex flex-wrap gap-1.5">
        <Chip label={`Timeout: ${formatMs(config.getTimeout())}`} />
        <Chip label={`Retry: ${config.getMaxRetries()}x`} />
        <Chip label={`Strategy: ${config.getFallbackStrategy()}`} />
        <Chip label={`Health: ${formatMs(config.getHealthCheckInterval())}`} />
      </div>

      {/* Provider rows */}
      <div className="space-y-3">
        {infos.map((info) => (
          <ProviderRow
            key={info.id}
            info={info}
            onToggle={handleToggle}
            onPriorityUp={handlePriorityUp}
            onPriorityDown={handlePriorityDown}
          />
        ))}
      </div>

      {/* Network Validation (expandable) */}
      <details className="mt-4">
        <summary className="cursor-pointer text-xs font-medium text-text-secondary hover:text-text-primary transition-colors">
          Network Test
        </summary>
        <div className="mt-3">
          <NetworkValidationPanel />
        </div>
      </details>

      {/* Expanded state view */}
      {expanded && state && (
        <pre className="mt-4 max-h-64 overflow-auto rounded-xl bg-black/40 p-4 text-[11px] text-text-secondary leading-relaxed">
          {JSON.stringify(state, null, 2)}
        </pre>
      )}
    </div>
  );
}

function Chip({ label }: { label: string }) {
  return (
    <span className="rounded-full bg-surface-highlight/50 px-2.5 py-1 text-[10px] text-text-secondary">
      {label}
    </span>
  );
}

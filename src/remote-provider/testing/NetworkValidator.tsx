"use client";

// ==================== Phase 16B: Network Validation Panel ====================
//
// Dev-only component for testing provider behavior under different
// network conditions. Rendered inside ProviderHealthDashboard.

import { useState, useCallback } from "react";
import { getEdgeProviderManager } from "../core/EdgeProviderManager";
import { NetworkSimulator, type NetworkCondition } from "./NetworkSimulator";

// ==================== Condition Labels ====================

const CONDITIONS: { value: NetworkCondition; label: string; description: string }[] = [
  { value: "wifi", label: "WiFi", description: "50ms latency, 50Mbps, 0% loss" },
  { value: "mobile-4g", label: "Mobile 4G", description: "100ms latency, 10Mbps, 1% loss" },
  { value: "mobile-3g", label: "Mobile 3G", description: "300ms latency, 1.5Mbps, 3% loss" },
  { value: "vpn-on", label: "VPN", description: "200ms latency, 10Mbps, 0% loss" },
  { value: "weak", label: "Weak Network", description: "500ms latency, 512Kbps, 10% loss" },
  { value: "offline", label: "Offline", description: "All requests fail immediately" },
  { value: "normal", label: "Normal", description: "No simulation (restore defaults)" },
];

// ==================== Validation Result ====================

interface ProviderTestResult {
  id: string;
  reachable: boolean;
  latency: number;
  error?: string;
}

interface ValidationResult {
  condition: NetworkCondition;
  timestamp: number;
  results: ProviderTestResult[];
  fallbackActivated: boolean;
}

// ==================== Component ====================

export function NetworkValidationPanel() {
  const [selectedCondition, setSelectedCondition] = useState<NetworkCondition>("wifi");
  const [running, setRunning] = useState(false);
  const [result, setResult] = useState<ValidationResult | null>(null);
  const [simulator] = useState(() => new NetworkSimulator());

  const runValidation = useCallback(async () => {
    setRunning(true);
    const manager = getEdgeProviderManager();

    // Apply simulation
    simulator.simulate(selectedCondition);

    const providerResults: ProviderTestResult[] = [];
    const ids = manager.getRegisteredIds();

    // Test each provider
    for (const id of ids) {
      const start = Date.now();
      try {
        const health = await manager.getHealthSnapshot(id);
        providerResults.push({
          id,
          reachable: health.healthy,
          latency: Date.now() - start,
        });
      } catch (err) {
        providerResults.push({
          id,
          reachable: false,
          latency: Date.now() - start,
          error: String(err),
        });
      }
    }

    // Restore normal
    simulator.restore();

    setResult({
      condition: selectedCondition,
      timestamp: Date.now(),
      results: providerResults,
      fallbackActivated: providerResults.some((r) => !r.reachable),
    });
    setRunning(false);
  }, [selectedCondition, simulator]);

  const reachableCount = result?.results.filter((r) => r.reachable).length ?? 0;
  const totalCount = result?.results.length ?? 0;

  return (
    <div className="space-y-3 rounded-xl bg-surface/60 p-4 text-sm">
      <div className="flex items-center justify-between">
        <h4 className="font-semibold text-text-primary">Network Validation</h4>
        <span className="text-[10px] text-text-tertiary">
          {simulator.isActive() ? `Active: ${simulator.getCurrentCondition()}` : "Idle"}
        </span>
      </div>

      {/* Condition selector */}
      <select
        value={selectedCondition}
        onChange={(e) => setSelectedCondition(e.target.value as NetworkCondition)}
        className="w-full rounded-lg bg-surface-highlight/50 px-3 py-2 text-text-primary text-sm border border-white/5"
        disabled={running}
      >
        {CONDITIONS.map((c) => (
          <option key={c.value} value={c.value}>
            {c.label}
          </option>
        ))}
      </select>

      <p className="text-xs text-text-tertiary">
        {CONDITIONS.find((c) => c.value === selectedCondition)?.description}
      </p>

      {/* Run button */}
      <button
        onClick={runValidation}
        disabled={running}
        className="w-full rounded-lg bg-accent-primary/20 px-4 py-2 text-sm font-medium text-accent-primary hover:bg-accent-primary/30 disabled:opacity-50 transition-colors"
      >
        {running ? "Running..." : "Run Validation"}
      </button>

      {/* Results */}
      {result && (
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="text-text-tertiary">
              {reachableCount}/{totalCount} providers reachable
            </span>
            {result.fallbackActivated && (
              <span className="rounded-full bg-yellow-500/10 px-2 py-0.5 text-yellow-400">
                FALLBACK ACTIVE
              </span>
            )}
          </div>

          {/* Per-provider results */}
          <div className="space-y-1.5">
            {result.results.map((r) => (
              <div
                key={r.id}
                className="flex items-center justify-between rounded-lg bg-black/20 px-3 py-2"
              >
                <div className="flex items-center gap-2">
                  <div
                    className={`h-2 w-2 rounded-full ${
                      r.reachable ? "bg-green-400" : "bg-red-400"
                    }`}
                  />
                  <span className="text-xs text-text-primary">{r.id}</span>
                </div>
                <span className="text-xs text-text-tertiary">
                  {r.reachable ? `${r.latency}ms` : r.error ?? "Unreachable"}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Safety note */}
      <p className="text-[10px] text-text-tertiary/70">
        Temporarily intercepts fetch() for testing. Restored after validation.
      </p>
    </div>
  );
}

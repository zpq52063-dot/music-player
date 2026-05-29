"use client";

import { useState } from "react";
import { useProvider } from "@/music-source/hooks/useProvider";
import { useProviderHealth } from "@/music-source/hooks/useProviderHealth";
import { useProviderStore } from "@/stores/providerStore";
import { getAPICache } from "@/music-source/cache";
/**
 * ProviderDebugPanel — 开发调试面板
 * 显示 provider 状态、健康数据、缓存信息
 * 仅在开发环境使用
 */
export function ProviderDebugPanel() {
  const [isOpen, setIsOpen] = useState(false);
  const { currentProvider, status } = useProvider();
  const { health } = useProviderHealth();
  const requestStatus = useProviderStore((s) => s.requestStatus);
  const requestError = useProviderStore((s) => s.requestError);
  const lastFallbackReason = useProviderStore((s) => s.lastFallbackReason);

  if (process.env.NODE_ENV !== "development") return null;

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-20 right-2 z-[100] rounded-full bg-accent-primary px-3 py-1 text-xs text-white shadow-lg"
      >
        Debug
      </button>
    );
  }

  const cache = getAPICache();
  const cacheStats = cache.getStats();

  return (
    <div className="fixed bottom-20 right-2 z-[100] max-h-[60vh] w-72 overflow-y-auto rounded-xl bg-surface border border-white/10 p-4 text-xs shadow-2xl">
      <div className="mb-3 flex items-center justify-between">
        <span className="font-semibold text-text-primary">Provider Debug</span>
        <button onClick={() => setIsOpen(false)} className="text-text-tertiary">
          ✕
        </button>
      </div>

      {/* Status */}
      <Section title="Status">
        <Row label="Active" value={currentProvider} />
        <Row label="State" value={status} />
        <Row label="Request" value={requestStatus} />
        {requestError && <Row label="Error" value={requestError} />}
        {lastFallbackReason && <Row label="Fallback" value={lastFallbackReason} />}
      </Section>

      {/* Health */}
      <Section title="Health">
        {Object.entries(health).map(([type, h]) => (
          <div key={type} className="mb-1 flex items-center gap-2">
            <span
              className={`inline-block h-2 w-2 rounded-full ${h.healthy ? "bg-green-400" : "bg-red-400"}`}
            />
            <span className="text-text-secondary">{type}</span>
            <span className="ml-auto text-text-tertiary">
              {h.successRate}% / {h.avgLatency}ms
            </span>
          </div>
        ))}
        {Object.keys(health).length === 0 && (
          <span className="text-text-tertiary">No data</span>
        )}
      </Section>

      {/* Cache */}
      <Section title="Cache">
        <Row label="SWR entries" value={String(cacheStats.swrEntries)} />
      </Section>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="mb-3">
      <div className="mb-1 font-medium text-text-primary">{title}</div>
      <div className="rounded-lg bg-background p-2">{children}</div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between py-0.5">
      <span className="text-text-tertiary">{label}</span>
      <span className="text-text-secondary max-w-[140px] truncate">{value}</span>
    </div>
  );
}

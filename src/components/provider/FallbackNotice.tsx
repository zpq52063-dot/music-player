"use client";

import { useEffect, useState } from "react";
import { useProviderStore } from "@/stores/providerStore";

/**
 * FallbackNotice — 音源降级通知弹窗
 * 当主要音源失败自动切换到备用音源时显示短暂提示
 */
export function FallbackNotice() {
  const lastFallbackReason = useProviderStore((s) => s.lastFallbackReason);
  const lastFallbackTime = useProviderStore((s) => s.lastFallbackTime);
  const currentProvider = useProviderStore((s) => s.currentProvider);
  const [visible, setVisible] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    if (lastFallbackTime && !dismissed) {
      setVisible(true);
      const timer = setTimeout(() => setVisible(false), 4000);
      return () => clearTimeout(timer);
    }
  }, [lastFallbackTime, dismissed]);

  if (!visible) return null;

  const labels: Record<string, string> = {
    mock: "本地音源",
  };

  const reasonLabels: Record<string, string> = {
    timeout: "请求超时",
    network_error: "网络错误",
    server_error: "服务异常",
    invalid_response: "响应无效",
    rate_limited: "请求过多",
    consecutive_failures: "连续失败",
    low_success_rate: "成功率过低",
    high_latency: "延迟过高",
    manual: "手动切换",
  };

  return (
    <div className="fixed left-1/2 top-4 z-[60] -translate-x-1/2 animate-fade-in">
      <div className="rounded-xl bg-surface-elevated border border-white/10 px-4 py-3 shadow-xl backdrop-blur-xl">
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-amber-500/20">
            <svg className="h-4 w-4 text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div>
            <div className="text-sm font-medium text-text-primary">
              已切换至 {labels[currentProvider] ?? currentProvider}
            </div>
            <div className="text-xs text-text-tertiary">
              {lastFallbackReason ? reasonLabels[lastFallbackReason] ?? lastFallbackReason : "音源异常"}
            </div>
          </div>
          <button
            onClick={() => {
              setVisible(false);
              setDismissed(true);
            }}
            className="ml-2 text-text-tertiary hover:text-text-primary"
          >
            ✕
          </button>
        </div>
      </div>
    </div>
  );
}

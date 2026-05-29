"use client";

import { useProviderStore } from "@/stores/providerStore";

/**
 * ProviderStatusBar — 音源状态指示条
 * 在全屏播放器或首页顶部显示当前音源信息
 */
export function ProviderStatusBar() {
  const currentProvider = useProviderStore((s) => s.currentProvider);
  const status = useProviderStore((s) => s.status);
  const requestError = useProviderStore((s) => s.requestError);

  // 正常状态不显示
  if (status === "active" && !requestError) return null;

  const labels: Record<string, string> = {
    mock: "本地音源",
  };

  return (
    <div
      className={`mx-4 mb-1 rounded-lg px-3 py-1.5 text-xs ${
        status === "fallback"
          ? "bg-amber-500/10 text-amber-400 border border-amber-500/20"
          : status === "degraded"
            ? "bg-orange-500/10 text-orange-400 border border-orange-500/20"
            : "bg-red-500/10 text-red-400 border border-red-500/20"
      }`}
    >
      <span className="font-medium">
        {status === "fallback" ? "已切换音源" : "音源异常"}
      </span>
      <span className="ml-2 text-text-tertiary">
        {labels[currentProvider] ?? currentProvider}
        {requestError && ` — ${requestError}`}
      </span>
    </div>
  );
}

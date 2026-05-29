"use client";

import { IconWifiOff, IconRefresh } from "@tabler/icons-react";
import { useSystemStore } from "@/stores/systemStore";

interface OfflineFallbackProps {
  children: React.ReactNode;
}

export function OfflineFallback({ children }: OfflineFallbackProps) {
  const isOffline = useSystemStore((s) => s.networkState === "offline");

  if (!isOffline) {
    return <>{children}</>;
  }

  return (
    <div className="flex min-h-[40vh] flex-col items-center justify-center px-6 text-center">
      <div className="glass mb-6 rounded-full p-6">
        <IconWifiOff className="h-12 w-12 text-text-tertiary" />
      </div>
      <h2 className="mb-2 text-xl font-semibold text-text-primary">当前离线</h2>
      <p className="mb-6 max-w-xs text-sm text-text-secondary">
        请检查网络连接后重试。您仍可播放已缓存的歌曲。
      </p>
      <button
        onClick={() => window.location.reload()}
        className="glass inline-flex items-center gap-2 rounded-apple-lg px-5 py-2.5 text-sm font-medium text-text-primary transition-all active:scale-95"
      >
        <IconRefresh className="h-4 w-4" />
        刷新页面
      </button>
    </div>
  );
}

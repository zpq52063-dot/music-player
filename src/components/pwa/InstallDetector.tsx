"use client";

import { usePWAInstall } from "@/hooks/usePWAInstall";
import { useNetworkState } from "@/hooks/useNetworkState";
import { useOfflineCache } from "@/hooks/useOfflineCache";

/**
 * Silent component — mounts all Phase 6 global hooks.
 * Must be rendered once at app root level.
 */
export function InstallDetector({ children }: { children: React.ReactNode }) {
  usePWAInstall();
  useNetworkState();
  useOfflineCache();

  return <>{children}</>;
}

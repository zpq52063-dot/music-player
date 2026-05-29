"use client";

import { useEffect } from "react";
import { useSystemStore } from "@/stores/systemStore";
import type { NetworkState } from "@/types";

// ==================== Network Detection ====================

function detectNetworkType(): NetworkState {
  if (typeof navigator === "undefined") return "online";
  if (!navigator.onLine) return "offline";

  const conn = (navigator as Navigator & { connection?: { effectiveType?: string; rtt?: number } })
    .connection;
  if (conn) {
    if (conn.effectiveType === "slow-2g" || conn.effectiveType === "2g") return "slow";
    if (conn.rtt !== undefined && conn.rtt > 500) return "slow";
  }
  return "online";
}

// ==================== Hook ====================

export function useNetworkState() {
  const networkState = useSystemStore((s) => s.networkState);
  const setNetworkState = useSystemStore((s) => s.setNetworkState);

  useEffect(() => {
    setNetworkState(detectNetworkType());

    const handleOnline = () => setNetworkState(detectNetworkType());
    const handleOffline = () => setNetworkState("offline");

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    // Monitor connection changes
    const conn = (
      navigator as Navigator & {
        connection?: { addEventListener?: (t: string, h: () => void) => void; removeEventListener?: (t: string, h: () => void) => void };
      }
    ).connection;
    if (conn?.addEventListener && conn?.removeEventListener) {
      const handler = () => setNetworkState(detectNetworkType());
      conn.addEventListener("change", handler);
      return () => {
        window.removeEventListener("online", handleOnline);
        window.removeEventListener("offline", handleOffline);
        conn.removeEventListener?.("change", handler);
      };
    }

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, [setNetworkState]);

  return {
    networkState,
    isOnline: networkState !== "offline",
    isOffline: networkState === "offline",
    isSlow: networkState === "slow",
  };
}

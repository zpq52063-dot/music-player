/**
 * Phase 20C — SW Update Notification
 *
 * Listens for SW_UPDATED message from the service worker and shows a subtle
 * toast prompting the user to refresh for the latest version.
 */

"use client";

import { useEffect, useState, useCallback } from "react";
import { IconRefresh, IconX } from "@tabler/icons-react";

interface SWUpdateInfo {
  version: string;
  visible: boolean;
  dismissed: boolean;
}

const STORAGE_KEY = "music_sw_update_dismissed";

export function SWUpdateNotification() {
  const [updateInfo, setUpdateInfo] = useState<SWUpdateInfo>({
    version: "",
    visible: false,
    dismissed: false,
  });

  const dismissPermanently = useCallback((version: string) => {
    try {
      localStorage.setItem(STORAGE_KEY, version);
    } catch { /* ignore */ }
    setUpdateInfo((prev) => ({ ...prev, visible: false, dismissed: true }));
  }, []);

  const refresh = useCallback(() => {
    window.location.reload();
  }, []);

  useEffect(() => {
    const dismissedVersion = (() => {
      try { return localStorage.getItem(STORAGE_KEY); } catch { return null; }
    })();

    const handler = (event: MessageEvent) => {
      if (event.data?.type === "SW_UPDATED") {
        const version = (event.data.version as string) ?? "";
        if (dismissedVersion === version) return;
        setUpdateInfo({ version, visible: true, dismissed: false });
      }
    };

    navigator.serviceWorker?.addEventListener("message", handler);

    // Also check for waiting SW on initial load
    navigator.serviceWorker?.ready.then((reg) => {
      if (reg.waiting) {
        const version = "1.0.0";
        if (dismissedVersion !== version) {
          setUpdateInfo({ version, visible: true, dismissed: false });
        }
      }
    }).catch(() => { /* ok */ });

    return () => {
      navigator.serviceWorker?.removeEventListener("message", handler);
    };
  }, []);

  if (!updateInfo.visible) return null;

  return (
    <div
      role="status"
      aria-live="polite"
      aria-label="App update available"
      className="fixed bottom-24 left-1/2 z-50 -translate-x-1/2 animate-slide-up"
    >
      <div className="flex items-center gap-3 rounded-full bg-accent-primary px-4 py-2 text-sm font-medium text-white shadow-lg">
        <IconRefresh className="h-4 w-4 shrink-0" aria-hidden="true" />
        <span>New version available</span>
        <button
          onClick={refresh}
          className="rounded-full bg-white/20 px-3 py-0.5 text-xs font-semibold transition hover:bg-white/30"
          aria-label="Refresh to update"
        >
          Update
        </button>
        <button
          onClick={() => dismissPermanently(updateInfo.version)}
          className="ml-1 rounded-full p-0.5 transition hover:bg-white/20"
          aria-label="Dismiss update notification"
        >
          <IconX className="h-3.5 w-3.5" aria-hidden="true" />
        </button>
      </div>
    </div>
  );
}

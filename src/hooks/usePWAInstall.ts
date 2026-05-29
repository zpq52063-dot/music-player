"use client";

import { useEffect, useCallback } from "react";
import { useSystemStore } from "@/stores/systemStore";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

// ==================== iOS Detection ====================

function isIOSDevice(): boolean {
  if (typeof navigator === "undefined") return false;
  return /iPhone|iPad|iPod/.test(navigator.userAgent);
}

function isStandaloneMode(): boolean {
  if (typeof window === "undefined") return false;
  return window.matchMedia("(display-mode: standalone)").matches
    || (navigator as Navigator & { standalone?: boolean }).standalone === true;
}

// ==================== Hook ====================

export function usePWAInstall() {
  const installState = useSystemStore((s) => s.installState);
  const setInstallState = useSystemStore((s) => s.setInstallState);

  const promptInstall = useCallback(async (): Promise<boolean> => {
    if (!("BeforeInstallPromptEvent" in window)) return false;

    const pendingPrompt = (window as Window & {
      __pwaInstallPrompt?: BeforeInstallPromptEvent;
    }).__pwaInstallPrompt;

    if (!pendingPrompt) return false;

    await pendingPrompt.prompt();
    const result = await pendingPrompt.userChoice;
    (window as Window & { __pwaInstallPrompt?: BeforeInstallPromptEvent }).__pwaInstallPrompt =
      undefined;

    if (result.outcome === "accepted") {
      setInstallState({ isInstalled: true, hasInstallPrompt: false });
      return true;
    }
    return false;
  }, [setInstallState]);

  useEffect(() => {
    const ios = isIOSDevice();
    const standalone = isStandaloneMode();

    setInstallState({ isIOS: ios, isStandalone: standalone, isInstalled: standalone });

    const handler = (e: Event) => {
      e.preventDefault();
      (window as Window & { __pwaInstallPrompt?: BeforeInstallPromptEvent }).__pwaInstallPrompt =
        e as BeforeInstallPromptEvent;
      setInstallState({ hasInstallPrompt: true });
    };

    window.addEventListener("beforeinstallprompt", handler);

    const mediaHandler = (e: MediaQueryListEvent) => {
      if (e.matches) setInstallState({ isStandalone: true, isInstalled: true });
    };

    const mq = window.matchMedia("(display-mode: standalone)");
    mq.addEventListener("change", mediaHandler);

    return () => {
      window.removeEventListener("beforeinstallprompt", handler);
      mq.removeEventListener("change", mediaHandler);
    };
  }, [setInstallState]);

  return {
    ...installState,
    promptInstall,
  };
}

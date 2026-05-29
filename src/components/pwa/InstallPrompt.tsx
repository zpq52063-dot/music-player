"use client";

import { useEffect, useState, useCallback } from "react";
import { useSystemStore } from "@/stores/systemStore";
import { IconShare, IconPlus, IconX, IconDeviceMobile, IconCheck } from "@tabler/icons-react";

/**
 * Phase 20B — Enhanced PWA Install Prompt
 *
 * - iOS: "Add to Home Screen" guided tutorial (Share → Add to Home Screen)
 * - Chrome/Android: beforeinstallprompt event-driven
 * - Installed detection: hide when standalone mode detected
 * - Install success detection: display-mode change watcher
 */

/** Check if the app is currently running in standalone/installed mode */
function checkInstalled(): boolean {
  if (typeof window === "undefined") return false;
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    (navigator as Navigator & { standalone?: boolean }).standalone === true
  );
}

export function InstallPrompt() {
  const showInstallGuide = useSystemStore((s) => s.showInstallGuide);
  const dismissInstallGuide = useSystemStore((s) => s.dismissInstallGuide);
  const setShowInstallGuide = useSystemStore((s) => s.setShowInstallGuide);
  const installState = useSystemStore((s) => s.installState);
  const [visible, setVisible] = useState(false);
  const [dismissed, setDismissed] = useState(false);
  const [installSuccess, setInstallSuccess] = useState(false);

  // Install success detection: watch display-mode changes
  useEffect(() => {
    if (!installState.isIOS) return;
    if (checkInstalled()) {
      setDismissed(true);
      setShowInstallGuide(false);
      return;
    }

    const mq = window.matchMedia("(display-mode: standalone)");
    const handler = (e: MediaQueryListEvent) => {
      if (e.matches) {
        setInstallSuccess(true);
        setDismissed(true);
        // Auto-dismiss after success toast
        setTimeout(() => {
          dismissInstallGuide();
          setInstallSuccess(false);
        }, 3000);
      }
    };
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, [installState.isIOS, dismissInstallGuide, setShowInstallGuide]);

  // 30s delayed trigger (iOS non-standalone only)
  useEffect(() => {
    if (installState.isIOS && !installState.isStandalone && !dismissed) {
      const stored = localStorage.getItem("music_install_guide_dismissed");
      if (!stored) {
        const timer = setTimeout(() => setShowInstallGuide(true), 30000);
        return () => clearTimeout(timer);
      }
    }
  }, [installState.isIOS, installState.isStandalone, dismissed, setShowInstallGuide]);

  // Chrome/Android: show immediately when beforeinstallprompt fires
  useEffect(() => {
    if (installState.hasInstallPrompt && !installState.isIOS && !dismissed) {
      setShowInstallGuide(true);
    }
  }, [installState.hasInstallPrompt, installState.isIOS, dismissed, setShowInstallGuide]);

  useEffect(() => {
    if (showInstallGuide) {
      setVisible(true);
    }
  }, [showInstallGuide]);

  const handleDismiss = useCallback(() => {
    setVisible(false);
    setDismissed(true);
    setTimeout(() => dismissInstallGuide(), 300);
  }, [dismissInstallGuide]);

  const handleInstall = useCallback(async () => {
    const pendingPrompt = (window as Window & {
      __pwaInstallPrompt?: { prompt: () => Promise<void>; userChoice: Promise<{ outcome: string }> };
    }).__pwaInstallPrompt;

    if (pendingPrompt) {
      await pendingPrompt.prompt();
      const result = await pendingPrompt.userChoice;
      (window as Window & { __pwaInstallPrompt?: unknown }).__pwaInstallPrompt = undefined;

      if (result.outcome === "accepted") {
        setInstallSuccess(true);
        setTimeout(() => {
          handleDismiss();
          setInstallSuccess(false);
        }, 2500);
        return;
      }
    }
    handleDismiss();
  }, [handleDismiss]);

  // Install success toast (brief celebration)
  if (installSuccess) {
    return (
      <div className="fixed bottom-24 left-1/2 z-[65] -translate-x-1/2 pointer-events-none">
        <div
          className="flex items-center gap-2 rounded-apple-xl bg-accent-tertiary px-5 py-3 text-sm font-semibold text-white shadow-lg"
          style={{ animation: "springUp 0.4s cubic-bezier(0.16, 1, 0.3, 1)" }}
        >
          <IconCheck size={18} strokeWidth={2.5} />
          安装成功！已添加到主屏幕
        </div>
      </div>
    );
  }

  if (!showInstallGuide || !visible) return null;

  return (
    <div
      className="fixed inset-0 z-[60] flex items-end justify-center bg-black/60 backdrop-blur-sm"
      style={{ animation: "fadeIn 0.3s ease-out" }}
      onClick={handleDismiss}
    >
      <div
        className="w-full max-w-md rounded-apple-xl bg-surface-elevated p-6 pb-safe"
        style={{ animation: "slideUp 0.35s cubic-bezier(0.16, 1, 0.3, 1)" }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="mb-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <IconDeviceMobile size={20} className="text-accent-primary" />
            <h3 className="text-lg font-semibold text-text-primary">
              {installState.isIOS ? "添加到主屏幕" : "安装应用"}
            </h3>
          </div>
          <button
            onClick={handleDismiss}
            className="rounded-full p-1.5 text-text-tertiary hover:text-text-primary active:scale-90 transition-transform"
            aria-label="关闭"
          >
            <IconX size={20} />
          </button>
        </div>

        <p className="mb-5 text-sm text-text-secondary">
          {installState.isIOS
            ? "安装到主屏幕，获得原生应用般的流畅体验。"
            : "安装此应用到桌面，离线也能听歌。"}
        </p>

        {installState.isIOS ? (
          <>
            {/* Step 1 */}
            <div className="mb-4 flex items-center gap-3">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-accent-primary text-sm font-bold text-white">
                1
              </div>
              <div className="flex items-center gap-2 text-text-primary">
                <span>点击工具栏</span>
                <span className="inline-flex items-center gap-1 rounded-lg bg-surface-highlight px-2.5 py-1">
                  <IconShare size={16} />
                </span>
                <span>分享按钮</span>
              </div>
            </div>

            {/* Step 2 */}
            <div className="mb-2 flex items-center gap-3">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-accent-primary text-sm font-bold text-white">
                2
              </div>
              <div className="flex items-center gap-2 text-text-primary">
                <span>选择</span>
                <span className="inline-flex items-center gap-1 rounded-lg bg-surface-highlight px-2.5 py-1">
                  <IconPlus size={16} />
                  添加到主屏幕
                </span>
              </div>
            </div>
          </>
        ) : (
          /* Chrome/Android native install */
          <div className="mb-5 flex items-center gap-3">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-apple-xl bg-accent-primary/10">
              <IconDeviceMobile size={24} className="text-accent-primary" />
            </div>
            <div>
              <p className="text-sm font-medium text-text-primary">Music Player</p>
              <p className="text-xs text-text-secondary">离线可用 · 原生体验</p>
            </div>
          </div>
        )}

        {/* Action buttons */}
        <div className="mt-6 flex gap-3">
          <button
            onClick={handleDismiss}
            className="flex-1 rounded-apple-lg bg-surface-highlight py-3 text-center text-sm font-medium text-text-secondary active:scale-[0.97] transition-transform"
          >
            以后再说
          </button>
          {installState.isIOS ? (
            <button
              onClick={handleDismiss}
              className="flex-1 rounded-apple-lg bg-accent-primary py-3 text-center text-sm font-semibold text-white active:scale-[0.97] transition-transform"
            >
              知道了
            </button>
          ) : (
            <button
              onClick={handleInstall}
              className="flex-1 rounded-apple-lg bg-accent-primary py-3 text-center text-sm font-semibold text-white active:scale-[0.97] transition-transform"
            >
              安装
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

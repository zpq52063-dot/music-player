"use client";

import { useEffect, useState, useCallback } from "react";
import { IconMusic, IconVinyl, IconDevicesPause, IconDeviceMobile } from "@tabler/icons-react";

const STORAGE_KEY = "music_standalone_onboarding_seen";

/**
 * Phase 20B — Standalone Onboarding Welcome
 *
 * Shown once when the app launches in standalone PWA mode.
 * Welcomes the user and highlights key native-feeling features.
 */
export function StandaloneOnboarding() {
  const [visible, setVisible] = useState(false);
  const [exiting, setExiting] = useState(false);

  useEffect(() => {
    // Only show in standalone mode, and only once
    const isStandalone =
      typeof window !== "undefined" &&
      (window.matchMedia("(display-mode: standalone)").matches ||
        (navigator as Navigator & { standalone?: boolean }).standalone === true);

    if (!isStandalone) return;

    const seen = localStorage.getItem(STORAGE_KEY);
    if (seen) return;

    // Delay to let splash screen fade naturally
    const timer = setTimeout(() => setVisible(true), 800);
    return () => clearTimeout(timer);
  }, []);

  const handleDismiss = useCallback(() => {
    setExiting(true);
    localStorage.setItem(STORAGE_KEY, "1");
    setTimeout(() => setVisible(false), 350);
  }, []);

  if (!visible) return null;

  return (
    <div
      className={`fixed inset-0 z-[70] flex items-end justify-center bg-black/70 backdrop-blur-sm ${
        exiting ? "animate-fade-in" : ""
      }`}
      style={{
        animation: exiting
          ? "fadeOut 0.35s ease-out forwards"
          : "fadeIn 0.4s ease-out",
      }}
      onClick={handleDismiss}
    >
      <div
        className={`w-full max-w-md rounded-apple-xl bg-surface-elevated px-6 pb-safe ${
          exiting ? "" : ""
        }`}
        style={{
          animation: exiting
            ? "slideDown 0.35s cubic-bezier(0.16, 1, 0.3, 1) forwards"
            : "springUp 0.5s cubic-bezier(0.16, 1, 0.3, 1)",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* App Icon */}
        <div className="mx-auto mt-8 mb-5 flex h-20 w-20 items-center justify-center rounded-apple-xl bg-accent-primary/10">
          <IconMusic size={40} className="text-accent-primary" strokeWidth={1.5} />
        </div>

        {/* Welcome Text */}
        <h2 className="text-center text-xl font-semibold text-text-primary">
          欢迎使用 Music
        </h2>
        <p className="mt-2 text-center text-sm text-text-secondary">
          已安装到主屏幕，畅享原生音乐体验
        </p>

        {/* Feature Highlights */}
        <div className="mt-6 space-y-3">
          <div className="flex items-center gap-3 rounded-apple-lg bg-surface p-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-accent-secondary/10">
              <IconVinyl size={18} className="text-accent-secondary" strokeWidth={1.5} />
            </div>
            <div>
              <p className="text-sm font-medium text-text-primary">后台播放</p>
              <p className="text-xs text-text-tertiary">锁屏切歌，控制中心集成</p>
            </div>
          </div>

          <div className="flex items-center gap-3 rounded-apple-lg bg-surface p-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-accent-tertiary/10">
              <IconDevicesPause size={18} className="text-accent-tertiary" strokeWidth={1.5} />
            </div>
            <div>
              <p className="text-sm font-medium text-text-primary">离线可用</p>
              <p className="text-xs text-text-tertiary">无网络也能听缓存的音乐</p>
            </div>
          </div>

          <div className="flex items-center gap-3 rounded-apple-lg bg-surface p-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-accent-primary/10">
              <IconDeviceMobile size={18} className="text-accent-primary" strokeWidth={1.5} />
            </div>
            <div>
              <p className="text-sm font-medium text-text-primary">原生体验</p>
              <p className="text-xs text-text-tertiary">启动画面 · 全屏沉浸 · 流畅动画</p>
            </div>
          </div>
        </div>

        {/* Dismiss Button */}
        <button
          onClick={handleDismiss}
          className="mt-6 mb-4 w-full rounded-apple-lg bg-accent-primary py-3.5 text-center text-base font-semibold text-white active:scale-[0.97] transition-transform"
        >
          开始使用
        </button>
      </div>

      {/* Add fadeOut keyframe if not already defined */}
      <style jsx>{`
        @keyframes fadeOut {
          from { opacity: 1; }
          to { opacity: 0; }
        }
        @keyframes slideDown {
          from { transform: translateY(0); opacity: 1; }
          to { transform: translateY(24px); opacity: 0; }
        }
      `}</style>
    </div>
  );
}

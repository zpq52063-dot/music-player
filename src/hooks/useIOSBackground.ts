"use client";

import { useEffect, useRef } from "react";
import { useMusicPlayerStore } from "@/stores/musicPlayerStore";
import { getAudioManager } from "@/lib/audio/AudioManager";

/**
 * iOS Safari 后台播放优化
 *
 * 处理 visibilitychange / pagehide / pageshow 事件，
 * 避免 Safari 切后台后暂停音频。
 * 同时使用 Wake Lock API 防止系统挂起音频上下文。
 */
export function useIOSBackground() {
  const wasPlayingRef = useRef(false);
  const resumeAttemptsRef = useRef(0);

  // 请求/释放 Wake Lock（防止 iOS 系统挂起音频上下文）
  useEffect(() => {
    const unsub = useMusicPlayerStore.subscribe((state, prev) => {
      if (state.isPlaying === prev.isPlaying) return;

      if (state.isPlaying) {
        requestWakeLock();
      } else {
        releaseWakeLock();
      }
    });

    return () => {
      unsub();
      releaseWakeLock();
    };
  }, []);

  // pageshow — iOS Safari 从后台恢复时触发
  useEffect(() => {
    const handlePageShow = (_e: Event) => {
      const store = useMusicPlayerStore.getState();
      if (wasPlayingRef.current && store.currentSong) {
        // iOS 切回前台时 audio 可能已被暂停，尝试恢复
        const mgr = getAudioManager();
        resumeAttemptsRef.current = 0;

        const tryResume = () => {
          if (resumeAttemptsRef.current >= 3) return;
          resumeAttemptsRef.current++;

          mgr.play().then(() => {
            wasPlayingRef.current = false;
          }).catch(() => {
            // 延迟重试 — iOS 可能需要用户手势后的一定延迟
            setTimeout(tryResume, 300 * resumeAttemptsRef.current);
          });
        };

        setTimeout(tryResume, 150);
      }
    };

    // pagehide — iOS Safari 切后台时触发（visibilitychange 可能不会触发在 iOS 14-）
    const handlePageHide = (_e: Event) => {
      const store = useMusicPlayerStore.getState();
      wasPlayingRef.current = store.isPlaying;
    };

    // visibilitychange — 标准 API，大多数情况生效
    const handleVisibilityChange = () => {
      if (document.visibilityState === "hidden") {
        const store = useMusicPlayerStore.getState();
        wasPlayingRef.current = store.isPlaying;
      } else if (document.visibilityState === "visible") {
        const store = useMusicPlayerStore.getState();
        if (wasPlayingRef.current && store.currentSong) {
          const mgr = getAudioManager();
          if (mgr.paused) {
            mgr.play().catch(() => {
              // iOS 可能因 user gesture requirement 拒绝
              // 不强制重试 — 用户看到暂停 UI 后手动点播放
            });
          }
          wasPlayingRef.current = false;
        }
        // 恢复后重新请求 Wake Lock
        if (store.isPlaying) {
          requestWakeLock();
        }
      }
    };

    // freeze — Safari 可能冻结页面（iOS 15+）
    const handleFreeze = () => {
      const store = useMusicPlayerStore.getState();
      wasPlayingRef.current = store.isPlaying;
      releaseWakeLock();
    };

    // resume — 页面解冻
    const handleResume = () => {
      if (wasPlayingRef.current) {
        const mgr = getAudioManager();
        setTimeout(() => {
          mgr.play().catch(() => {});
        }, 200);
        wasPlayingRef.current = false;
      }
    };

    window.addEventListener("pageshow", handlePageShow);
    window.addEventListener("pagehide", handlePageHide);
    document.addEventListener("visibilitychange", handleVisibilityChange);
    window.addEventListener("freeze", handleFreeze);
    window.addEventListener("resume", handleResume);

    // 初始请求 Wake Lock（如果正在播放）
    if (useMusicPlayerStore.getState().isPlaying) {
      requestWakeLock();
    }

    return () => {
      window.removeEventListener("pageshow", handlePageShow);
      window.removeEventListener("pagehide", handlePageHide);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      window.removeEventListener("freeze", handleFreeze);
      window.removeEventListener("resume", handleResume);
      releaseWakeLock();
    };
  }, []);
}

// ==================== Wake Lock ====================

async function requestWakeLock() {
  try {
    if ("wakeLock" in navigator) {
      const sentinel = await navigator.wakeLock.request("screen");
      // 存储引用以便释放
      const store = (window as Window & { __wakeLock?: WakeLockSentinel });
      store.__wakeLock = sentinel;

      sentinel.addEventListener("release", () => {
        const s = (window as Window & { __wakeLock?: WakeLockSentinel });
        if (s.__wakeLock === sentinel) s.__wakeLock = undefined;
      });
    }
  } catch {
    // Wake Lock 不可用（如非 HTTPS 或不支持）
  }
}

function releaseWakeLock() {
  try {
    const store = (window as Window & { __wakeLock?: WakeLockSentinel });
    if (store.__wakeLock) {
      store.__wakeLock.release().catch(() => {});
      store.__wakeLock = undefined;
    }
  } catch {
    // ignore
  }
}

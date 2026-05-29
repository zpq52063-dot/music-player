/**
 * Phase 17 — Crash Recovery Hook
 *
 * 挂载 CrashRecoverySystem，连接到 musicPlayerStore
 * 在 AudioProvider 中挂载
 */

"use client";

import { useEffect, useRef } from "react";
import { useMusicPlayerStore } from "@/stores/musicPlayerStore";
import { getCrashRecovery } from "@/system/recovery/CrashRecoverySystem";
import { getLogger } from "@/lib/logs/Logger";

export function useCrashRecovery() {
  const isMounted = useRef(false);
  const storeRef = useRef(useMusicPlayerStore.getState);
  storeRef.current = useMusicPlayerStore.getState;

  useEffect(() => {
    if (isMounted.current) return;
    isMounted.current = true;

    const logger = getLogger();
    const recovery = getCrashRecovery();

    // 设置 store 读取器
    recovery.storeReader = () => {
      const s = storeRef.current();
      return {
        currentSong: s.currentSong ? { id: s.currentSong.id } : null,
        isPlaying: s.isPlaying,
        currentTime: s.currentTime,
        volume: s.volume,
        isMuted: s.isMuted,
        playMode: s.playMode,
        queue: s.queue.map((song) => ({ id: song.id })),
        queueIndex: s.queueIndex,
      };
    };

    // 挂载
    recovery.mount({
      setVolume: (v) => useMusicPlayerStore.getState().setVolume(v),
      setMuted: (v) => {
        if (v !== useMusicPlayerStore.getState().isMuted) {
          useMusicPlayerStore.getState().toggleMute();
        }
      },
      setPlayMode: (m) => useMusicPlayerStore.getState().setPlayMode(m),
      seek: (pos) => useMusicPlayerStore.getState().seek(pos),
      play: () => useMusicPlayerStore.getState().play(),
    });

    // 尝试恢复上次的播放状态
    const restoreResult = recovery.restoreState();
    if (restoreResult.recovered) {
      recovery.executeRestore(restoreResult);
      logger.info("crash-recovery", `Crash recovery: state restored (song=${restoreResult.recoveredSongId}, position=${restoreResult.recoveredPosition.toFixed(1)}s)`);
    }

    // 播放中定期保存 (每3秒)
    const saveInterval = setInterval(() => {
      const store = storeRef.current();
      if (store.isPlaying && store.currentSong) {
        recovery.scheduleSave();
      }
    }, 3000);

    return () => {
      clearInterval(saveInterval);
      recovery.unmount();
    };
  }, []);

  return null;
}

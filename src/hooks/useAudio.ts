"use client";

import { useEffect, useRef } from "react";
import { usePlayerStore } from "@/stores";
import { audioEngine } from "@/lib/audio/AudioEngine";

/**
 * 连接 Zustand playerStore 与 AudioEngine
 * 放在 layout 级别，全局只挂载一次
 */
export function useAudio() {
  const initialized = useRef(false);

  const currentSong = usePlayerStore((s) => s.currentSong);
  const isPlaying = usePlayerStore((s) => s.isPlaying);
  const volume = usePlayerStore((s) => s.volume);
  const isMuted = usePlayerStore((s) => s.isMuted);
  const setCurrentTime = usePlayerStore((s) => s.setCurrentTime);
  const setDuration = usePlayerStore((s) => s.setDuration);

  // 初始化 AudioEngine 事件（仅一次）
  useEffect(() => {
    if (!audioEngine || initialized.current) return;
    initialized.current = true;

    // 恢复可能的中断（如 iOS 音频中断）
    const handleInterruption = () => {
      usePlayerStore.getState().pause();
    };

    document.addEventListener("audiointerruption", handleInterruption);
    return () => {
      document.removeEventListener("audiointerruption", handleInterruption);
    };
  }, []);

  // 歌曲切换 → 加载新音频
  useEffect(() => {
    if (!audioEngine || !currentSong?.audio_url) return;

    audioEngine.load(
      currentSong.audio_url,
      ({ currentTime, duration }) => {
        setCurrentTime(currentTime);
        setDuration(duration);
      },
      () => {
        // 播放结束
        const s = usePlayerStore.getState();
        if (s.mode === "repeat-one") {
          audioEngine?.seek(0);
          audioEngine?.play();
        } else {
          s.next();
        }
      },
    );

    audioEngine.setVolume(isMuted ? 0 : volume);

    if (isPlaying) {
      audioEngine.play();
    }

    return () => {
      audioEngine?.destroy();
    };
  }, [currentSong?.id, currentSong?.audio_url]);

  // 播放/暂停切换
  useEffect(() => {
    if (!audioEngine || !currentSong) return;
    if (isPlaying) {
      audioEngine.play();
    } else {
      audioEngine.pause();
    }
  }, [isPlaying, currentSong]);

  // 音量变化
  useEffect(() => {
    if (!audioEngine) return;
    audioEngine.setVolume(isMuted ? 0 : volume);
  }, [volume, isMuted]);

  // 监听 seek 事件（从 seek action 触发后同步到 audio）
  // 用 ref 来桥接 store action 和 audio
  useEffect(() => {
    const unsub = usePlayerStore.subscribe((state, prev) => {
      if (!audioEngine) return;
      // 检测 seek：currentTime 突变了（跳过了 audio 的自然更新）
      const diff = Math.abs(state.currentTime - prev.currentTime);
      if (diff > 1.5 && state.currentSong && !state.isPlaying) {
        audioEngine.seek(state.currentTime);
      }
    });
    return unsub;
  }, []);
}

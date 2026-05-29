"use client";

import { memo, useCallback } from "react";
import { useMusicPlayerStore } from "@/stores/musicPlayerStore";
import { useUIStore } from "@/stores/uiStore";
import { AlbumCover } from "./AlbumCover";
import { PlayerControls } from "./PlayerControls";
import { ProgressBar } from "./ProgressBar";
import { WaveformBar } from "./WaveformBar";
import { SleepTimerIndicator } from "./SleepTimerIndicator";

/** 进度条区域 — 独立订阅高频更新的 time */
const PlayerBarProgress = memo(function PlayerBarProgress() {
  const currentTime = useMusicPlayerStore((s) => s.currentTime);
  const duration = useMusicPlayerStore((s) => s.duration);
  const handleSeek = useCallback((time: number) => {
    useMusicPlayerStore.getState().seek(time);
  }, []);

  return (
    <div className="px-3 pt-1.5">
      <ProgressBar currentTime={currentTime} duration={duration} onSeek={handleSeek} />
    </div>
  );
});

/** 歌曲信息+封面+控制 — 仅在歌曲/播放状态/模式变化时重渲染 */
const PlayerBarContent = memo(function PlayerBarContent({ onExpand }: { onExpand?: () => void }) {
  const currentSong = useMusicPlayerStore((s) => s.currentSong);
  const isPlaying = useMusicPlayerStore((s) => s.isPlaying);
  const loadingState = useMusicPlayerStore((s) => s.loadingState);
  const playMode = useMusicPlayerStore((s) => s.playMode);
  const storeExpand = useUIStore((s) => s.expandPlayer);
  const expandPlayer = onExpand ?? storeExpand;

  if (!currentSong) return null;

  return (
    <div className="flex items-center gap-3 px-3 pb-3 pt-1">
      {/* 封面 + 呼吸光晕 */}
      <button
        onClick={expandPlayer}
        className="relative shrink-0 transition-transform active:scale-95"
        data-mini-cover
      >
        {/* 呼吸光晕 — 仅在播放时显示 */}
        {isPlaying && (
          <div
            className="absolute -inset-2 rounded-full animate-pulse-glow"
            style={{
              background: "radial-gradient(circle, rgba(255,45,85,0.2) 0%, transparent 70%)",
            }}
          />
        )}
        <div className="relative z-10">
          <AlbumCover
            src={currentSong.cover_url}
            alt={currentSong.title}
            size="md"
            isPlaying={isPlaying}
          />
        </div>
      </button>

      {/* 歌曲信息 + 波形 */}
      <button onClick={expandPlayer} className="min-w-0 flex-1 text-left">
        <div className="flex items-center gap-2">
          <p className="text-truncate text-sm font-medium">{currentSong.title}</p>
        </div>
        <div className="flex items-center gap-2">
          <p className="text-truncate text-xs text-text-secondary">{currentSong.artist}</p>
          {isPlaying && (
            <WaveformBar isPlaying={isPlaying} barCount={4} />
          )}
          <SleepTimerIndicator />
        </div>
      </button>

      <PlayerControls
        isPlaying={isPlaying}
        isLoading={loadingState === "loading"}
        mode={playMode}
        canPlay
        onTogglePlay={() => useMusicPlayerStore.getState().togglePlay()}
        onNext={() => useMusicPlayerStore.getState().next()}
        onPrev={() => useMusicPlayerStore.getState().prev()}
        onCycleMode={() => useMusicPlayerStore.getState().cycleMode()}
        size="sm"
      />
    </div>
  );
});

export function PlayerBar({ onExpand }: { onExpand?: () => void }) {
  const currentSong = useMusicPlayerStore((s) => s.currentSong);
  const loadingState = useMusicPlayerStore((s) => s.loadingState);
  const buffered = useMusicPlayerStore((s) => s.buffered);

  if (!currentSong) return null;

  return (
    <div
      className="glass-heavy mx-2 mb-2 overflow-hidden rounded-apple-xl"
      style={{
        transition: "transform 0.35s cubic-bezier(0.16, 1, 0.3, 1), box-shadow 0.35s cubic-bezier(0.16, 1, 0.3, 1)",
      }}
    >
      {/* 缓冲进度条 */}
      <div className="relative h-0.5 bg-text-tertiary/10">
        {loadingState === "loading" && (
          <div
            className="absolute inset-y-0 left-0 bg-text-tertiary/20 transition-all duration-300"
            style={{ width: `${buffered}%` }}
          />
        )}
        {loadingState !== "loading" && buffered > 0 && (
          <div
            className="absolute inset-y-0 left-0 bg-white/5 transition-all duration-300"
            style={{ width: `${buffered}%` }}
          />
        )}
      </div>
      <PlayerBarProgress />
      <PlayerBarContent onExpand={onExpand} />
    </div>
  );
}

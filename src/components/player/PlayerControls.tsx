"use client";

import { memo, useCallback } from "react";
import { IconPlayerPlay, IconPlayerPause, IconPlayerSkipForward, IconPlayerSkipBack, IconRepeat, IconRepeatOnce, IconArrowsShuffle } from "@tabler/icons-react";
import { IconButton } from "@/components/ui/IconButton";
import { hapticService } from "@/services/haptics";
import type { PlayMode } from "@/types";

interface PlayerControlsProps {
  isPlaying: boolean;
  isLoading: boolean;
  mode: PlayMode;
  canPlay: boolean;
  onTogglePlay: () => void;
  onNext: () => void;
  onPrev: () => void;
  onCycleMode: () => void;
  size?: "sm" | "lg";
}

const modeIcons: Record<PlayMode, typeof IconRepeat> = {
  sequential: IconRepeat,
  repeat: IconRepeat,
  "repeat-one": IconRepeatOnce,
  shuffle: IconArrowsShuffle,
};

const modeActive = (mode: PlayMode) => mode !== "sequential";

export const PlayerControls = memo(function PlayerControls({
  isPlaying, isLoading, mode, canPlay,
  onTogglePlay, onNext, onPrev, onCycleMode,
  size = "sm",
}: PlayerControlsProps) {
  const ModeIcon = modeIcons[mode];
  const btnSize = size === "lg" ? "lg" : "md";

  const handleTogglePlay = useCallback(() => {
    hapticService.medium();
    onTogglePlay();
  }, [onTogglePlay]);

  const handleNext = useCallback(() => {
    hapticService.light();
    onNext();
  }, [onNext]);

  const handlePrev = useCallback(() => {
    hapticService.light();
    onPrev();
  }, [onPrev]);

  const handleCycleMode = useCallback(() => {
    hapticService.selection();
    onCycleMode();
  }, [onCycleMode]);

  return (
    <div className="flex items-center justify-center gap-1">
      {/* 播放模式 */}
      <IconButton size="sm" onClick={handleCycleMode}>
        <ModeIcon
          size={16}
          className={modeActive(mode) ? "text-accent-primary" : "text-text-secondary"}
          fill={mode === "repeat-one" ? "currentColor" : "none"}
        />
      </IconButton>

      {/* 上一首 */}
      <IconButton size={btnSize} onClick={handlePrev} disabled={!canPlay}>
        <IconPlayerSkipBack size={size === "lg" ? 28 : 20} />
      </IconButton>

      {/* 播放/暂停 */}
      <IconButton
        size={size === "lg" ? "lg" : "md"}
        variant="filled"
        className="bg-white text-black hover:bg-white/90"
        onClick={handleTogglePlay}
        disabled={!canPlay || isLoading}
      >
        {isLoading ? (
          <div className="h-5 w-5 animate-spin rounded-full border-2 border-black border-t-transparent" />
        ) : isPlaying ? (
          <IconPlayerPause size={size === "lg" ? 28 : 20} />
        ) : (
          <IconPlayerPlay size={size === "lg" ? 28 : 20} className="ml-0.5" />
        )}
      </IconButton>

      {/* 下一首 */}
      <IconButton size={btnSize} onClick={handleNext} disabled={!canPlay}>
        <IconPlayerSkipForward size={size === "lg" ? 28 : 20} />
      </IconButton>

      {/* 占位（保持布局平衡） */}
      <div className="w-8" />
    </div>
  );
});

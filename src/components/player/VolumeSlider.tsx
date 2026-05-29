"use client";

import { useRef, useCallback, type MouseEvent, type TouchEvent } from "react";
import { IconVolume, IconVolume2, IconVolume3 } from "@tabler/icons-react";

interface VolumeSliderProps {
  volume: number;
  isMuted: boolean;
  onVolumeChange: (vol: number) => void;
  onToggleMute: () => void;
}

export function VolumeSlider({ volume, isMuted, onVolumeChange, onToggleMute }: VolumeSliderProps) {
  const barRef = useRef<HTMLDivElement>(null);
  const effVol = isMuted ? 0 : volume;

  const calcVolume = useCallback(
    (clientX: number) => {
      if (!barRef.current) return;
      const rect = barRef.current.getBoundingClientRect();
      const ratio = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
      onVolumeChange(ratio);
    },
    [onVolumeChange],
  );

  const handleMouseDown = (e: MouseEvent) => calcVolume(e.clientX);
  const handleTouchMove = (e: TouchEvent) => {
    const t = e.touches[0];
    if (t) calcVolume(t.clientX);
  };

  const VolumeIcon = effVol === 0 ? IconVolume3 : effVol < 0.5 ? IconVolume2 : IconVolume;

  return (
    <div className="flex items-center gap-3">
      <button
        onClick={onToggleMute}
        className="text-text-secondary transition-colors hover:text-text-primary"
      >
        <VolumeIcon size={18} />
      </button>
      <div
        ref={barRef}
        className="group relative h-7 flex-1 cursor-pointer touch-none"
        onMouseDown={handleMouseDown}
        onTouchStart={(e) => {
          const t = e.touches[0];
          if (t) calcVolume(t.clientX);
        }}
        onTouchMove={handleTouchMove}
      >
        <div className="absolute top-1/2 h-1 w-full -translate-y-1/2 rounded-full bg-white/15">
          <div
            className="h-full rounded-full bg-white transition-all group-hover:bg-accent-primary"
            style={{ width: `${effVol * 100}%` }}
          />
        </div>
        <div
          className="absolute top-1/2 h-3 w-3 -translate-x-1/2 -translate-y-1/2 rounded-full bg-white opacity-0 shadow-lg transition-opacity group-hover:opacity-100"
          style={{ left: `${effVol * 100}%` }}
        />
      </div>
    </div>
  );
}

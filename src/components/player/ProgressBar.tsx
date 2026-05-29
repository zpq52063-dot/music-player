"use client";

import { memo, useRef, useCallback, type MouseEvent, type TouchEvent } from "react";

interface ProgressBarProps {
  currentTime: number;
  duration: number;
  onSeek: (time: number) => void;
}

export const ProgressBar = memo(function ProgressBar({ currentTime, duration, onSeek }: ProgressBarProps) {
  const barRef = useRef<HTMLDivElement>(null);
  const progress = duration > 0 ? (currentTime / duration) * 100 : 0;

  const calcTime = useCallback(
    (clientX: number) => {
      if (!barRef.current || duration <= 0) return;
      const rect = barRef.current.getBoundingClientRect();
      const ratio = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
      onSeek(ratio * duration);
    },
    [duration, onSeek],
  );

  const handleMouseDown = (e: MouseEvent) => {
    e.preventDefault();
    calcTime(e.clientX);
  };

  const handleTouchMove = (e: TouchEvent) => {
    const touch = e.touches[0];
    if (touch) calcTime(touch.clientX);
  };

  return (
    <div className="flex w-full items-center gap-2">
      <span className="w-9 text-right text-[11px] tabular-nums text-text-tertiary">
        {formatTime(currentTime)}
      </span>
      <div
        ref={barRef}
        className="group relative h-7 flex-1 cursor-pointer touch-none"
        onMouseDown={handleMouseDown}
        onTouchMove={handleTouchMove}
        onTouchStart={(e) => {
          const touch = e.touches[0];
          if (touch) calcTime(touch.clientX);
        }}
      >
        {/* 轨道 */}
        <div className="absolute top-1/2 h-1 w-full -translate-y-1/2 rounded-full bg-white/15">
          {/* 进度填充 — 使用 transform scaleX 实现 GPU 加速平滑动画 */}
          <div
            className="absolute inset-0 origin-left rounded-full bg-white group-hover:bg-accent-primary"
            style={{
              transform: `scaleX(${progress / 100})`,
              transition: "transform 0.15s linear, background-color 0.2s ease",
              willChange: "transform",
            }}
          />
        </div>
        {/* 拖动圆点 */}
        <div
          className="absolute top-1/2 h-3 w-3 -translate-x-1/2 -translate-y-1/2 rounded-full bg-white opacity-0 shadow-lg transition-opacity duration-200 group-hover:opacity-100"
          style={{ left: `${progress}%` }}
        />
      </div>
      <span className="w-9 text-left text-[11px] tabular-nums text-text-tertiary">
        {formatTime(duration)}
      </span>
    </div>
  );
});

function formatTime(seconds: number): string {
  if (!isFinite(seconds) || seconds < 0) return "0:00";
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
}

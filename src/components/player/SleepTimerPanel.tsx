"use client";

import { useCallback } from "react";
import { IconMoon, IconPlayerStop } from "@tabler/icons-react";
import { useSleepTimerStore } from "@/stores/sleepTimerStore";
import { useUIStore } from "@/stores/uiStore";
import { formatTime } from "@/lib/utils";
import type { SleepTimerDuration } from "@/types/phase15";

const DURATIONS: { value: SleepTimerDuration; label: string }[] = [
  { value: 15, label: "15 分钟" },
  { value: 30, label: "30 分钟" },
  { value: 60, label: "60 分钟" },
];

export function SleepTimerPanel() {
  const isActive = useSleepTimerStore((s) => s.isActive);
  const duration = useSleepTimerStore((s) => s.duration);
  const remainingMs = useSleepTimerStore((s) => s.remainingMs);
  const cancel = useSleepTimerStore((s) => s.cancel);
  const setDuration = useSleepTimerStore((s) => s.setDuration);

  const collapsePlayer = useUIStore((s) => s.collapsePlayer);

  const handleStart = useCallback((d: SleepTimerDuration) => {
    setDuration(d);
    useSleepTimerStore.getState().start();
  }, [setDuration]);

  const handleCancel = useCallback(() => {
    cancel();
  }, [cancel]);

  const isFading = isActive && remainingMs <= 5000;
  const remainingSec = Math.ceil(remainingMs / 1000);
  const progressPct = isActive
    ? 1 - remainingMs / (duration * 60 * 1000)
    : 0;

  return (
    <div
      className="fixed inset-x-0 bottom-0 z-50 rounded-t-apple-xl glass-heavy px-6 pb-8 pt-4"
      style={{
        animation: "slideUp 0.3s cubic-bezier(0.16, 1, 0.3, 1)",
      }}
    >
      {/* Handle */}
      <div className="mx-auto mb-4 h-1 w-10 rounded-full bg-text-tertiary/30" />

      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <IconMoon size={20} className="text-accent-primary" />
          <h3 className="text-base font-semibold text-text-primary">睡眠定时器</h3>
        </div>
        <button
          onClick={() => collapsePlayer()}
          className="text-text-tertiary text-sm"
        >
          关闭
        </button>
      </div>

      {!isActive ? (
        <div className="flex gap-3">
          {DURATIONS.map((d) => (
            <button
              key={d.value}
              onClick={() => handleStart(d.value)}
              className="flex-1 rounded-apple-lg bg-white/10 py-3 text-center text-sm font-medium text-text-primary transition-colors active:bg-white/20"
            >
              {d.label}
            </button>
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center gap-4">
          {/* Circular countdown */}
          <div className="relative flex h-32 w-32 items-center justify-center">
            <svg className="absolute inset-0 h-full w-full -rotate-90" viewBox="0 0 100 100">
              <circle
                cx="50"
                cy="50"
                r="44"
                fill="none"
                stroke="currentColor"
                strokeWidth="4"
                className="text-white/10"
              />
              <circle
                cx="50"
                cy="50"
                r="44"
                fill="none"
                stroke="currentColor"
                strokeWidth="4"
                strokeLinecap="round"
                className={isFading ? "text-orange-400" : "text-accent-primary"}
                strokeDasharray={`${2 * Math.PI * 44}`}
                strokeDashoffset={`${2 * Math.PI * 44 * (1 - progressPct)}`}
                style={{ transition: "stroke-dashoffset 0.25s linear" }}
              />
            </svg>
            <div className="text-center">
              <p className={`text-2xl font-bold tabular-nums ${isFading ? "text-orange-400" : "text-text-primary"}`}>
                {formatTime(remainingSec)}
              </p>
              {isFading && (
                <p className="text-xs text-orange-400 mt-0.5">淡出中...</p>
              )}
            </div>
          </div>

          <button
            onClick={handleCancel}
            className="flex items-center gap-2 rounded-apple-lg bg-red-500/20 px-6 py-2.5 text-sm font-medium text-red-400 transition-colors active:bg-red-500/30"
          >
            <IconPlayerStop size={16} />
            取消定时器
          </button>
        </div>
      )}
    </div>
  );
}

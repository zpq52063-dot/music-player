"use client";

import { IconMoon } from "@tabler/icons-react";
import { useSleepTimerStore } from "@/stores/sleepTimerStore";
import { formatTime } from "@/lib/utils";

export function SleepTimerIndicator() {
  const isActive = useSleepTimerStore((s) => s.isActive);
  const remainingMs = useSleepTimerStore((s) => s.remainingMs);

  if (!isActive) return null;

  const remainingSec = Math.ceil(remainingMs / 1000);

  return (
    <div className="flex items-center gap-1 text-xs text-accent-primary">
      <IconMoon size={12} />
      <span className="tabular-nums">{formatTime(remainingSec)}</span>
    </div>
  );
}

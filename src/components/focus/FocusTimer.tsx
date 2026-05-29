"use client";

import { useFocusStore } from "@/stores/focusStore";
import { formatTime } from "@/lib/utils";

export function FocusTimer() {
  const elapsedMs = useFocusStore((s) => s.elapsedMs);
  const elapsedSec = Math.floor(elapsedMs / 1000);

  return (
    <span className="text-xs text-text-tertiary tabular-nums">
      {formatTime(elapsedSec)}
    </span>
  );
}

"use client";

import { useEffect, useRef } from "react";
import { useFocusStore } from "@/stores/focusStore";

export function useFocusTimer() {
  const isActive = useFocusStore((s) => s.isActive);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (!isActive) {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      return;
    }

    intervalRef.current = setInterval(() => {
      const state = useFocusStore.getState();
      if (state.startTime) {
        useFocusStore.getState().tick(Date.now() - state.startTime);
      }
    }, 1000);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [isActive]);
}

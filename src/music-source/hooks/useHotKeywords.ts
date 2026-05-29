"use client";

import { useEffect, useRef } from "react";
import { useSearchStore } from "@/stores/searchStore";
import { getService } from "./useMusicProvider";

export function useHotKeywords() {
  const hotKeywords = useSearchStore((s) => s.hotKeywords);
  const setHotKeywords = useSearchStore((s) => s.setHotKeywords);
  const loadedRef = useRef(false);

  useEffect(() => {
    if (loadedRef.current) return;
    loadedRef.current = true;

    const service = getService();
    service.getHotKeywords().then((keywords) => {
      if (keywords.length > 0) {
        setHotKeywords(keywords);
      }
    });
  }, [setHotKeywords]);

  return { hotKeywords };
}

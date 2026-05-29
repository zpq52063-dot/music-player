"use client";

import { useCallback } from "react";
import { useSearchStore } from "@/stores/searchStore";

export function useSearchHistory() {
  const searchHistory = useSearchStore((s) => s.searchHistory);
  const addHistory = useSearchStore((s) => s.addHistory);
  const removeHistory = useSearchStore((s) => s.removeHistory);
  const clearHistory = useSearchStore((s) => s.clearHistory);

  const add = useCallback(
    (keyword: string) => {
      addHistory(keyword);
    },
    [addHistory],
  );

  const remove = useCallback(
    (keyword: string) => {
      removeHistory(keyword);
    },
    [removeHistory],
  );

  const clear = useCallback(() => {
    clearHistory();
  }, [clearHistory]);

  return { searchHistory, add, remove, clear };
}

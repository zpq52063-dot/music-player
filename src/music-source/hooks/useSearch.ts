"use client";

import { useEffect, useRef, useCallback } from "react";
import { useSearchStore } from "@/stores/searchStore";
import { getService } from "./useMusicProvider";
import type { SearchResult } from "@/types";

const DEBOUNCE_MS = 300;

export function useSearch() {
  const query = useSearchStore((s) => s.query);
  const suggestions = useSearchStore((s) => s.suggestions);
  const results = useSearchStore((s) => s.results);
  const isSearching = useSearchStore((s) => s.isSearching);
  const searchError = useSearchStore((s) => s.searchError);
  const activeView = useSearchStore((s) => s.activeView);

  const setQuery = useSearchStore((s) => s.setQuery);
  const setSuggestions = useSearchStore((s) => s.setSuggestions);
  const setResults = useSearchStore((s) => s.setResults);
  const setIsSearching = useSearchStore((s) => s.setIsSearching);
  const setSearchError = useSearchStore((s) => s.setSearchError);
  const setActiveView = useSearchStore((s) => s.setActiveView);
  const addHistory = useSearchStore((s) => s.addHistory);
  const resetSearch = useSearchStore((s) => s.resetSearch);

  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const requestIdRef = useRef(0);
  const mountedRef = useRef(true);

  // Cleanup on unmount
  useEffect(() => {
    mountedRef.current = true;
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
      mountedRef.current = false;
    };
  }, []);

  // Debounced search
  useEffect(() => {
    if (timerRef.current) clearTimeout(timerRef.current);

    const trimmed = query.trim();

    if (!trimmed) {
      requestIdRef.current++;
      setSuggestions([]);
      setResults(null);
      setIsSearching(false);
      setActiveView("hot");
      return;
    }

    timerRef.current = setTimeout(() => {
      if (!mountedRef.current) return;

      const currentRequestId = ++requestIdRef.current;

      setIsSearching(true);
      setSearchError(null);
      setActiveView("suggestions");

      const service = getService();

      // Fetch suggestions in parallel
      service
        .getSearchSuggestions(trimmed)
        .then((items) => {
          if (mountedRef.current && currentRequestId === requestIdRef.current) {
            setSuggestions(items);
          }
        })
        .catch(() => {
          // suggestions fail silently
        });

      // Main search
      service
        .search(trimmed)
        .then((result: SearchResult) => {
          if (mountedRef.current && currentRequestId === requestIdRef.current) {
            setResults(result);
            if (result.total > 0) {
              setActiveView("results");
            }
          }
        })
        .catch((err: Error) => {
          if (mountedRef.current && currentRequestId === requestIdRef.current) {
            setSearchError(err.message || "搜索失败");
          }
        });
    }, DEBOUNCE_MS);

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [query, setSuggestions, setResults, setIsSearching, setSearchError, setActiveView]);

  const handleSearch = useCallback(
    (keyword: string) => {
      setQuery(keyword);
      if (keyword.trim()) {
        addHistory(keyword.trim());
      }
    },
    [setQuery, addHistory],
  );

  const clearSearch = useCallback(() => {
    resetSearch();
  }, [resetSearch]);

  return {
    query,
    suggestions,
    results,
    isSearching,
    searchError,
    activeView,
    setQuery,
    handleSearch,
    clearSearch,
  };
}

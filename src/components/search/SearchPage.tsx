"use client";

import { useEffect, useRef } from "react";
import { IconSearch, IconX, IconLoader2 } from "@tabler/icons-react";
import { useUIStore } from "@/stores";
import { useSearch, useSearchHistory, useHotKeywords } from "@/music-source/hooks";
import { HotKeywords } from "./HotKeywords";
import { SearchHistory } from "./SearchHistory";
import { SearchResultsView } from "./SearchResultsView";

export function SearchPage() {
  const isSearchOpen = useUIStore((s) => s.isSearchOpen);
  const closeSearch = useUIStore((s) => s.closeSearch);

  const {
    query,
    suggestions,
    results,
    isSearching,
    searchError,
    activeView,
    setQuery,
    handleSearch,
    clearSearch,
  } = useSearch();

  const { searchHistory, remove: removeHistory, clear: clearHistory } = useSearchHistory();
  const { hotKeywords } = useHotKeywords();

  const inputRef = useRef<HTMLInputElement>(null);

  // Auto-focus on open
  useEffect(() => {
    if (isSearchOpen && inputRef.current) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isSearchOpen]);

  // Handle close
  const handleClose = () => {
    clearSearch();
    closeSearch();
  };

  const handleSelectKeyword = (keyword: string) => {
    handleSearch(keyword);
    inputRef.current?.blur();
  };

  if (!isSearchOpen) return null;

  return (
    <div className="fixed inset-0 z-40 flex flex-col bg-background animate-slide-up">
      {/* 搜索栏 */}
      <div className="flex items-center gap-3 border-b border-white/8 px-4 py-3" style={{ paddingTop: "calc(env(safe-area-inset-top) + 12px)" }}>
        <div className="glass flex flex-1 items-center gap-2.5 rounded-apple-xl px-3.5 py-2.5 transition-all focus-within:bg-white/15 focus-within:ring-1 focus-within:ring-accent-primary/50">
          <IconSearch size={17} className="flex-shrink-0 text-text-tertiary" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="搜索歌曲、歌单、艺术家..."
            className="flex-1 bg-transparent text-sm text-text-primary placeholder:text-text-tertiary outline-none"
            style={{ fontSize: 16 }}
            autoComplete="off"
            autoCorrect="off"
            spellCheck={false}
          />
          {query && (
            <button
              onClick={() => setQuery("")}
              className="flex-shrink-0 rounded-full p-0.5 text-text-tertiary transition-colors active:text-text-primary"
            >
              <IconX size={15} />
            </button>
          )}
        </div>
        <button
          onClick={handleClose}
          className="flex-shrink-0 rounded-full p-1.5 text-text-secondary transition-colors active:text-text-primary"
        >
          <IconX size={20} />
        </button>
      </div>

      {/* 内容区 */}
      <div className="flex-1 overflow-y-auto overscroll-none px-4 pt-4">
        {/* 搜索中 */}
        {isSearching && (
          <div className="flex items-center justify-center gap-2 py-12 text-text-tertiary">
            <IconLoader2 size={18} className="animate-spin" />
            <span className="text-sm">搜索中...</span>
          </div>
        )}

        {/* 错误 */}
        {searchError && !isSearching && (
          <div className="py-12 text-center text-sm text-accent-primary">{searchError}</div>
        )}

        {/* 热门搜索 & 搜索历史 */}
        {!isSearching && !searchError && activeView === "hot" && (
          <div className="space-y-6">
            <SearchHistory
              history={searchHistory}
              onSelect={handleSelectKeyword}
              onRemove={removeHistory}
              onClear={clearHistory}
            />
            <HotKeywords keywords={hotKeywords} onSelect={handleSelectKeyword} />
          </div>
        )}

        {/* 搜索建议 */}
        {!isSearching && !searchError && activeView === "suggestions" && suggestions.length > 0 && (
          <div className="space-y-0.5">
            {suggestions.map((s) => (
              <button
                key={s}
                onClick={() => handleSelectKeyword(s)}
                className="flex w-full items-center gap-3 rounded-apple-lg px-3 py-2.5 text-left text-sm text-text-secondary transition-all active:bg-white/5"
              >
                <IconSearch size={15} className="text-text-tertiary" />
                {s}
              </button>
            ))}
          </div>
        )}

        {/* 空建议状态 — 输入了但没匹配到 */}
        {!isSearching && !searchError && activeView === "suggestions" && suggestions.length === 0 && query.trim() && (
          <div className="flex flex-col items-center gap-2 py-12 text-text-tertiary">
            <IconSearch size={32} stroke={1} />
            <p className="text-sm">搜索 &ldquo;{query}&rdquo;</p>
          </div>
        )}

        {/* 搜索结果 */}
        {!isSearching && !searchError && activeView === "results" && results && (
          <SearchResultsView results={results} query={query} />
        )}
      </div>
    </div>
  );
}

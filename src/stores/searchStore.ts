import { create } from "zustand";
import type { SearchResult } from "@/types";

// ==================== Types ====================

export type SearchView = "hot" | "history" | "suggestions" | "results";

interface SearchState {
  query: string;
  suggestions: string[];
  hotKeywords: string[];
  searchHistory: string[];
  results: SearchResult | null;
  isSearching: boolean;
  searchError: string | null;
  activeView: SearchView;
}

interface SearchActions {
  setQuery: (q: string) => void;
  setSuggestions: (items: string[]) => void;
  setHotKeywords: (items: string[]) => void;
  setResults: (r: SearchResult | null) => void;
  setIsSearching: (v: boolean) => void;
  setSearchError: (err: string | null) => void;
  setActiveView: (v: SearchView) => void;

  addHistory: (keyword: string) => void;
  removeHistory: (keyword: string) => void;
  clearHistory: () => void;

  resetSearch: () => void;
}

export type SearchStore = SearchState & SearchActions;

// ==================== Helpers ====================

const HISTORY_KEY = "music_search_history";
const MAX_HISTORY = 20;

function loadHistory(): string[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(HISTORY_KEY);
    return raw ? (JSON.parse(raw) as string[]) : [];
  } catch {
    return [];
  }
}

function saveHistory(history: string[]): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(HISTORY_KEY, JSON.stringify(history.slice(0, MAX_HISTORY)));
  } catch {
    // ignore quota errors
  }
}

// ==================== Store ====================

export const useSearchStore = create<SearchStore>((set, get) => ({
  // --- Initial State ---
  query: "",
  suggestions: [],
  hotKeywords: [],
  searchHistory: [],
  results: null,
  isSearching: false,
  searchError: null,
  activeView: "hot",

  // --- Actions ---

  setQuery: (q) => {
    const view = q.trim() ? get().activeView : "hot";
    set({ query: q, activeView: view, searchError: null });
  },

  setSuggestions: (items) => set({ suggestions: items }),

  setHotKeywords: (items) => {
    const existing = get().hotKeywords;
    // 只在首次加载时更新，避免重复请求
    if (existing.length === 0 && items.length > 0) {
      set({ hotKeywords: items });
    }
  },

  setResults: (r) => set({ results: r, isSearching: false, activeView: "results" }),

  setIsSearching: (v) => set({ isSearching: v }),

  setSearchError: (err) => set({ searchError: err, isSearching: false }),

  setActiveView: (v) => set({ activeView: v }),

  addHistory: (keyword) => {
    const trimmed = keyword.trim();
    if (!trimmed) return;
    const history = get().searchHistory.filter((h) => h !== trimmed);
    const updated = [trimmed, ...history].slice(0, MAX_HISTORY);
    saveHistory(updated);
    set({ searchHistory: updated });
  },

  removeHistory: (keyword) => {
    const updated = get().searchHistory.filter((h) => h !== keyword);
    saveHistory(updated);
    set({ searchHistory: updated });
  },

  clearHistory: () => {
    saveHistory([]);
    set({ searchHistory: [] });
  },

  resetSearch: () =>
    set({
      query: "",
      suggestions: [],
      results: null,
      isSearching: false,
      searchError: null,
      activeView: "hot",
    }),

  // --- Init (client-side only) ---
}));

// 客户端初始化：加载搜索历史
if (typeof window !== "undefined") {
  useSearchStore.setState({ searchHistory: loadHistory() });
}

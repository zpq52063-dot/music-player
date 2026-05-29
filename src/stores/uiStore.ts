import { create } from "zustand";

interface UIStore {
  isPlayerExpanded: boolean;
  isSearchOpen: boolean;
  searchQuery: string;
  isQueuePanelOpen: boolean;
  isPlayerTransitioning: boolean;

  expandPlayer: () => void;
  collapsePlayer: () => void;
  toggleSearch: () => void;
  closeSearch: () => void;
  setSearchQuery: (q: string) => void;
  toggleQueuePanel: () => void;
  closeQueuePanel: () => void;
  setPlayerTransitioning: (v: boolean) => void;
}

export const useUIStore = create<UIStore>((set) => ({
  isPlayerExpanded: false,
  isSearchOpen: false,
  searchQuery: "",
  isQueuePanelOpen: false,
  isPlayerTransitioning: false,

  expandPlayer: () => set({ isPlayerExpanded: true }),
  collapsePlayer: () => set({ isPlayerExpanded: false }),
  toggleSearch: () => set((s) => ({ isSearchOpen: !s.isSearchOpen })),
  closeSearch: () => set({ isSearchOpen: false, searchQuery: "" }),
  setSearchQuery: (q) => set({ searchQuery: q }),
  toggleQueuePanel: () => set((s) => ({ isQueuePanelOpen: !s.isQueuePanelOpen })),
  closeQueuePanel: () => set({ isQueuePanelOpen: false }),
  setPlayerTransitioning: (v) => set({ isPlayerTransitioning: v }),
}));

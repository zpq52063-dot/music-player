import { create } from "zustand";
import type { SystemStore, NetworkState, InstallState, CacheStats } from "@/types";

// ==================== Initial State ====================

const initialInstallState: InstallState = {
  isInstalled: false,
  hasInstallPrompt: false,
  isIOS: false,
  isStandalone: false,
};

const initialCacheStats: CacheStats = {
  metadataCount: 0,
  offlinePlaylistCount: 0,
  historyCount: 0,
  lyricCount: 0,
};

// ==================== Store ====================

export const useSystemStore = create<SystemStore>((set) => ({
  // Network
  networkState: "online",

  // Install
  installState: { ...initialInstallState },
  showInstallGuide: false,

  // Cache
  cacheStats: { ...initialCacheStats },

  // Background
  isBackgroundPlayback: false,

  // --- Network Actions ---

  setNetworkState: (networkState: NetworkState) => set({ networkState }),

  // --- Install Actions ---

  setInstallState: (state: Partial<InstallState>) =>
    set((prev) => ({ installState: { ...prev.installState, ...state } })),

  setShowInstallGuide: (show: boolean) => set({ showInstallGuide: show }),

  dismissInstallGuide: () => {
    localStorage.setItem("music_install_guide_dismissed", "1");
    set({ showInstallGuide: false });
  },

  // --- Cache Actions ---

  setCacheStats: (stats: Partial<CacheStats>) =>
    set((prev) => ({ cacheStats: { ...prev.cacheStats, ...stats } })),

  incrementCacheCount: (key: keyof CacheStats) =>
    set((prev) => ({ cacheStats: { ...prev.cacheStats, [key]: prev.cacheStats[key] + 1 } })),

  // --- Background Actions ---

  setBackgroundPlayback: (inBackground: boolean) => set({ isBackgroundPlayback: inBackground }),
}));

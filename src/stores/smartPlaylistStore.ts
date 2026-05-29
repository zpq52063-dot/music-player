import { create } from "zustand";
import type { SmartPlaylistMode } from "@/types/phase15";

interface SmartPlaylistStore {
  selectedMode: SmartPlaylistMode | null;
  selectMode: (mode: SmartPlaylistMode) => void;
  clearMode: () => void;
}

export const useSmartPlaylistStore = create<SmartPlaylistStore>((set) => ({
  selectedMode: null,
  selectMode: (mode) => set({ selectedMode: mode }),
  clearMode: () => set({ selectedMode: null }),
}));

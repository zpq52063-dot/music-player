import { create } from "zustand";
import type { ProviderType } from "@/music-source/types";
import type {
  ProviderHealthMap,
  ProviderStatus,
  FallbackReason,
  ProviderStore,
} from "@/types/provider";

const initialState = {
  currentProvider: "mock" as ProviderType,
  providerPriority: ["mock"] as ProviderType[],
  health: {} as ProviderHealthMap,
  status: "active" as ProviderStatus,
  lastFallbackReason: null as FallbackReason | null,
  lastFallbackTime: null as number | null,
  requestStatus: "idle" as "idle" | "loading" | "success" | "error",
  requestError: null as string | null,
};

export const useProviderStore = create<ProviderStore>((set) => ({
  ...initialState,

  setCurrentProvider: (type) => set({ currentProvider: type }),

  setProviderPriority: (priority) => set({ providerPriority: priority }),

  updateHealth: (type, health) =>
    set((state) => ({
      health: { ...state.health, [type]: health },
    })),

  setStatus: (status) => set({ status }),

  setFallback: (reason) =>
    set({
      lastFallbackReason: reason,
      lastFallbackTime: Date.now(),
      status: "fallback",
    }),

  setRequestStatus: (status, error) =>
    set({
      requestStatus: status,
      requestError: error ?? null,
    }),

  resetProvider: () => set(initialState),
}));

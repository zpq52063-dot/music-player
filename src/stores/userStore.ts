import { create } from "zustand";
import type { UserInfo } from "@/types";

interface UserStoreState {
  user: UserInfo | null;
  isAuthenticated: boolean;
  isAnonymous: boolean;
  isLoading: boolean;

  setUser: (user: UserInfo | null) => void;
  clearAuth: () => void;
  setLoading: (loading: boolean) => void;
}

export const useUserStore = create<UserStoreState>((set) => ({
  user: null,
  isAuthenticated: false,
  isAnonymous: false,
  isLoading: true,

  setUser: (user) =>
    set({
      user,
      isAuthenticated: !!user,
      isAnonymous: user?.isAnonymous ?? false,
      isLoading: false,
    }),

  clearAuth: () =>
    set({
      user: null,
      isAuthenticated: false,
      isAnonymous: false,
      isLoading: false,
    }),

  setLoading: (loading) => set({ isLoading: loading }),
}));

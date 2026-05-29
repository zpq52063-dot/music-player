import { safeCreateClient } from "@/lib/supabase/client";
import { localAuth } from "@/services/localStorageDB";
import type { UserInfo } from "@/types";

function createLocalUser(): UserInfo {
  return {
    id: localAuth.getUserId(),
    isAnonymous: true,
    createdAt: new Date().toISOString(),
  };
}

export const authService = {
  async signInAnonymously(): Promise<UserInfo | null> {
    const supabase = safeCreateClient();
    if (!supabase) return createLocalUser();

    const { data, error } = await supabase.auth.signInAnonymously();
    if (error || !data.user) {
      console.error("Anonymous sign-in failed:", error);
      return null;
    }
    return {
      id: data.user.id,
      isAnonymous: data.user.is_anonymous ?? false,
      createdAt: data.user.created_at,
    };
  },

  async getSession() {
    const supabase = safeCreateClient();
    if (!supabase) return null;
    const { data } = await supabase.auth.getSession();
    return data.session;
  },

  async getCurrentUser(): Promise<UserInfo | null> {
    const supabase = safeCreateClient();
    if (!supabase) return createLocalUser();

    const { data } = await supabase.auth.getUser();
    if (!data.user) return null;

    const { data: profile } = await supabase
      .from("profiles")
      .select("username, avatar_url")
      .eq("id", data.user.id)
      .single();

    return {
      id: data.user.id,
      email: data.user.email ?? undefined,
      username: profile?.username ?? undefined,
      avatarUrl: profile?.avatar_url ?? undefined,
      isAnonymous: data.user.is_anonymous ?? false,
      createdAt: data.user.created_at,
    };
  },

  async signOut() {
    const supabase = safeCreateClient();
    if (!supabase) return;
    await supabase.auth.signOut();
  },

  onAuthStateChange(callback: (user: UserInfo | null) => void) {
    const supabase = safeCreateClient();
    if (!supabase) {
      callback(createLocalUser());
      return { unsubscribe: () => {} };
    }
    const { data } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (session?.user) {
        const userInfo = await this.getCurrentUser();
        callback(userInfo);
      } else {
        callback(null);
      }
    });
    return data.subscription;
  },
};

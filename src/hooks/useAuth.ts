"use client";

import { useEffect, useCallback } from "react";
import { useUserStore } from "@/stores/userStore";
import { authService } from "@/services/authService";

/**
 * 认证 hook — 管理匿名登录 + 用户状态初始化
 * 在 AuthProvider 中调用一次
 */
export function useAuth() {
  const { user, isAuthenticated, isAnonymous, isLoading, setUser, clearAuth, setLoading } =
    useUserStore();

  // 应用启动时初始化认证
  useEffect(() => {
    let cancelled = false;

    async function initAuth() {
      setLoading(true);
      try {
        const session = await authService.getSession();
        if (session?.user && !cancelled) {
          const userInfo = await authService.getCurrentUser();
          if (!cancelled) setUser(userInfo);
        } else if (!cancelled) {
          // 无会话 → 自动匿名登录
          const anonUser = await authService.signInAnonymously();
          if (!cancelled) setUser(anonUser);
        }
      } catch {
        if (!cancelled) {
          // 离线或网络错误 — 尝试再次匿名登录
          try {
            const anonUser = await authService.signInAnonymously();
            if (!cancelled) setUser(anonUser);
          } catch {
            if (!cancelled) setLoading(false);
          }
        }
      }
    }

    initAuth();

    // 监听认证状态变化
    const subscription = createSubscription((userInfo) => {
      if (!cancelled) {
        if (userInfo) setUser(userInfo);
        else clearAuth();
      }
    });

    return () => {
      cancelled = true;
      subscription?.unsubscribe();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const signOut = useCallback(async () => {
    await authService.signOut();
    // 退出后重新匿名登录
    const anonUser = await authService.signInAnonymously();
    setUser(anonUser);
  }, [setUser]);

  return { user, isAuthenticated, isAnonymous, isLoading, signOut };
}

/** 创建 Supabase onAuthStateChange 订阅 */
function createSubscription(callback: (user: import("@/types").UserInfo | null) => void) {
  return authService.onAuthStateChange(callback);
}

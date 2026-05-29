"use client";

import { useEffect, useRef, useCallback } from "react";
import { getProviderManager } from "../providers/provider-manager";
import { useProviderStore } from "@/stores/providerStore";
import type { MusicProvider, ProviderType } from "../types/provider";
import type { ProviderHealthSnapshot } from "@/types/provider";

/**
 * useProvider — 主 Provider Hook
 * 管理 provider 生命周期、健康监控、fallback 回调
 */
export function useProvider() {
  const initialized = useRef(false);

  const currentProvider = useProviderStore((s) => s.currentProvider);
  const status = useProviderStore((s) => s.status);
  const requestStatus = useProviderStore((s) => s.requestStatus);
  const requestError = useProviderStore((s) => s.requestError);
  const lastFallbackReason = useProviderStore((s) => s.lastFallbackReason);

  const setCurrentProvider = useProviderStore((s) => s.setCurrentProvider);
  const updateHealth = useProviderStore((s) => s.updateHealth);
  const setStatus = useProviderStore((s) => s.setStatus);
  const setFallback = useProviderStore((s) => s.setFallback);
  const setRequestStatus = useProviderStore((s) => s.setRequestStatus);

  // 初始化: 注册回调
  useEffect(() => {
    if (initialized.current) return;
    initialized.current = true;

    const manager = getProviderManager();

    manager.setOnFallback((_from, to, reason) => {
      setCurrentProvider(to);
      setFallback(reason as unknown as import("@/types/provider").FallbackReason);
    });

    manager.setOnRecovery((type) => {
      if (type !== manager.getActiveType()) {
        manager.switchTo(type);
        setCurrentProvider(type);
        setStatus("active");
      }
    });

    manager.setOnHealthChange((type, health) => {
      updateHealth(type, health);
    });
  }, [setCurrentProvider, setFallback, setStatus, updateHealth]);

  /** 切换 provider */
  const switchProvider = useCallback(
    (type: ProviderType) => {
      const manager = getProviderManager();
      const success = manager.switchTo(type);
      if (success) {
        setCurrentProvider(type);
        setStatus("active");
      }
    },
    [setCurrentProvider, setStatus],
  );

  /** 获取当前活跃 provider */
  const getActiveProvider = useCallback((): MusicProvider => {
    return getProviderManager().getActive();
  }, []);

  /** 获取所有 provider 健康状态 */
  const getAllHealth = useCallback((): Map<ProviderType, ProviderHealthSnapshot> => {
    return getProviderManager().getAllHealth();
  }, []);

  return {
    currentProvider,
    status,
    requestStatus,
    requestError,
    lastFallbackReason,
    switchProvider,
    getActiveProvider,
    getAllHealth,
    setRequestStatus,
  };
}

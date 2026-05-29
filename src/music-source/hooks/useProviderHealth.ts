"use client";

import { useEffect, useRef } from "react";
import { getProviderManager } from "../providers/provider-manager";
import { useProviderStore } from "@/stores/providerStore";
import type { ProviderType } from "../types/provider";

/** 健康轮询间隔 */
const POLL_INTERVAL = 10000; // 10s

/**
 * useProviderHealth — Provider 健康监控
 * 定时轮询所有 provider 的健康状态
 */
export function useProviderHealth() {
  const health = useProviderStore((s) => s.health);
  const updateHealth = useProviderStore((s) => s.updateHealth);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    const manager = getProviderManager();

    const poll = () => {
      const snapshots = manager.getAllHealth();
      for (const [type, snapshot] of snapshots) {
        updateHealth(type, snapshot);
      }
    };

    // 首次立即执行
    poll();

    // 定时轮询
    timerRef.current = setInterval(poll, POLL_INTERVAL);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [updateHealth]);

  /** 检查指定 provider 是否健康 */
  const isHealthy = (type: ProviderType): boolean => {
    return health[type]?.healthy ?? (type === "mock");
  };

  /** 获取排序后的健康 provider 列表 */
  const getHealthyProviders = (): ProviderType[] => {
    const manager = getProviderManager();
    return manager.getPriorityList().filter((type) => isHealthy(type));
  };

  return {
    health,
    isHealthy,
    getHealthyProviders,
  };
}

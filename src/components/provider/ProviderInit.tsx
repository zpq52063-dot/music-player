"use client";

import { useEffect, useRef } from "react";
import { getProviderManager } from "@/music-source/providers/provider-manager";
import { initializeRemoteProviders } from "@/remote-provider/hooks/useRemoteProvider";

/**
 * ProviderInit — 初始化音源系统
 *
 * 两层 Provider 系统:
 *   1. 旧系统: ProviderManager + MockProvider (永久兜底)
 *   2. 新系统: EdgeProviderManager + RemoteProviders (Phase 16B 真实远程音源)
 *
 * 两者独立运行，互不影响。旧系统保证核心播放功能始终可用。
 */
export function ProviderInit() {
  const initialized = useRef(false);

  useEffect(() => {
    if (initialized.current) return;
    initialized.current = true;

    // 旧系统: MockProvider 永久兜底
    const manager = getProviderManager();
    manager.setPriority(["mock"]);

    // 新系统: Phase 16B Remote Providers
    // Internet Archive (直接), Jamendo + ccMixter (通过 Worker)
    initializeRemoteProviders();
  }, []);

  return null;
}

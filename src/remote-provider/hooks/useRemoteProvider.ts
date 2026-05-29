"use client";

// ==================== Phase 16B: Remote Provider Hook ====================

import { useEffect, useRef, useCallback, useSyncExternalStore } from "react";
import { getEdgeProviderManager } from "../core/EdgeProviderManager";
import { getRemoteConfig } from "../config/RemoteConfig";
import { RemoteWorkerProvider } from "../providers/RemoteWorkerProvider";
import { InternetArchiveProvider } from "../providers/InternetArchiveProvider";
import { JamendoProvider } from "../providers/JamendoProvider";
import { CcMixterProvider } from "../providers/CcMixterProvider";
import { RemoteEnv } from "../env";
import type { RemoteProviderHealth } from "../types";

// ==================== Initialization ====================

let _initialized = false;

export function initializeRemoteProviders(): void {
  if (_initialized) return;
  _initialized = true;

  const manager = getEdgeProviderManager();
  const config = getRemoteConfig();
  const workerUrl = RemoteEnv.workerUrl();

  // Priority 0: Internet Archive (no API key needed, direct mode)
  const iaProvider = new InternetArchiveProvider();
  manager.register(iaProvider, 0);

  // Priority 1: Jamendo (needs Worker for API key)
  if (workerUrl) {
    const jamendoProvider = new JamendoProvider({ workerUrl });
    manager.register(jamendoProvider, 1);
  }

  // Priority 2: ccMixter (Worker proxy for CORS)
  if (workerUrl) {
    const ccProvider = new CcMixterProvider({ workerUrl });
    manager.register(ccProvider, 2);
  }

  // Priority 10: Cloudflare Worker (aggregate proxy)
  // When Worker is available, this acts as a unified gateway.
  // When Worker is unavailable, falls back to mock data internally.
  const workerProvider = new RemoteWorkerProvider(workerUrl);
  manager.register(workerProvider, 10);

  // Sync config from localStorage
  const entries = config.getProviderPriority();
  if (entries.length > 0) {
    manager.setPriority(
      entries.filter((e) => e.enabled).map((e) => e.id),
    );
  }

  for (const entry of entries) {
    manager.setEnabled(entry.id, entry.enabled);
  }

  // Start health checks
  manager.startHealthChecks(config.getHealthCheckInterval());
}

// ==================== Hook ====================

export function useRemoteProvider() {
  const initialized = useRef(false);
  const manager = getEdgeProviderManager();

  useEffect(() => {
    if (!initialized.current) {
      initializeRemoteProviders();
      initialized.current = true;
    }
  }, []);

  const state = useSyncExternalStore(
    useCallback(
      (cb: () => void) => {
        manager.setOnStateChange(cb);
        return () => manager.setOnStateChange(() => {});
      },
      [manager],
    ),
    () => manager.getState(),
  );

  return {
    state,
    isReady: state.activeProviderId !== null,
    activeProviderId: state.activeProviderId,
    search: (keyword: string, opts?: { limit?: number; offset?: number }) =>
      manager.search(keyword, opts),
    getSong: (id: string) => manager.getSong(id),
    getLyrics: (songId: string) => manager.getLyrics(songId),
    getStream: (songId: string) => manager.getStream(songId),
    checkAllHealth: () => manager.checkAllHealth(),
  };
}

// ==================== Health Subscription Hook ====================

export function useRemoteProviderHealth(): Record<string, RemoteProviderHealth> {
  const manager = getEdgeProviderManager();

  const state = useSyncExternalStore(
    useCallback(
      (cb: () => void) => {
        manager.setOnStateChange(cb);
        return () => manager.setOnStateChange(() => {});
      },
      [manager],
    ),
    () => manager.getState(),
  );

  return state.healthSnapshots;
}

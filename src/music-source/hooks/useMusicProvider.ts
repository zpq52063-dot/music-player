"use client";

import { useRef } from "react";
import { MockProvider } from "../providers/mock";
import { MusicProviderAdapter } from "../providers/MusicProviderAdapter";
import { InternetArchiveProvider } from "@/remote-provider/providers/InternetArchiveProvider";
import { CcMixterProvider } from "@/remote-provider/providers/CcMixterProvider";
import { getProviderManager } from "../providers/provider-manager";
import { SearchService } from "../services";
import type { MusicProvider } from "../types/provider";

let _initialized = false;

function initializeProviders(): MusicProvider {
  const manager = getProviderManager();

  if (!_initialized) {
    _initialized = true;

    // Priority 0: Internet Archive (free, no API key, direct API access)
    try {
      const iaProvider = new InternetArchiveProvider();
      const iaAdapter = new MusicProviderAdapter(iaProvider);
      manager.register(iaAdapter, 0);
    } catch (e) {
      console.warn("[useMusicProvider] Failed to register InternetArchive:", e);
    }

    // Priority 1: ccMixter (free, direct API, may have CORS issues in browser)
    try {
      const ccProvider = new CcMixterProvider({ useWorkerProxy: false });
      const ccAdapter = new MusicProviderAdapter(ccProvider);
      manager.register(ccAdapter, 1);
    } catch (e) {
      console.warn("[useMusicProvider] Failed to register ccMixter:", e);
    }
  }

  // MockProvider is already registered at priority 999 in ProviderManager constructor
  return manager.getActive();
}

let _provider: MusicProvider | null = null;
let _service: SearchService | null = null;

function getProvider(): MusicProvider {
  if (!_provider) {
    _provider = initializeProviders();
  }
  return _provider;
}

function getService(): SearchService {
  if (!_service) {
    const primary = getProvider();
    _service = new SearchService(primary);
    // Set MockProvider as fallback for any provider that fails
    _service.setFallbackProvider(new MockProvider());
  }
  return _service;
}

export function useMusicProvider() {
  const providerRef = useRef(getProvider());
  const serviceRef = useRef(getService());

  return {
    provider: providerRef.current,
    service: serviceRef.current,
  };
}

export { getProvider, getService };

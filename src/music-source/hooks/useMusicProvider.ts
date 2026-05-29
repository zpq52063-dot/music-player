"use client";

import { useRef } from "react";
import { MockProvider } from "../providers/mock";
import { SearchService } from "../services";
import type { MusicProvider } from "../types/provider";

let _provider: MusicProvider | null = null;
let _service: SearchService | null = null;

function getProvider(): MusicProvider {
  if (!_provider) {
    _provider = new MockProvider();
  }
  return _provider;
}

function getService(): SearchService {
  if (!_service) {
    _service = new SearchService(getProvider());
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

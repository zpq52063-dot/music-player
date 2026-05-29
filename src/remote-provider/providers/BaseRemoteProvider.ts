// ==================== Phase 16B: Base Remote Provider ====================

import type { RemoteProvider, RemoteProviderHealth, RemoteStream, RemoteSong, RemoteSearchOptions } from "../types";
import type { SearchResult } from "@/types/music";
import type { Song } from "@/types";

// ==================== Options ====================

export interface BaseRemoteOptions {
  /** Base URL for direct API calls (ignored if useWorkerProxy) */
  baseUrl?: string;
  /** Timeout per request (ms) */
  timeoutMs: number;
  /** Route through Cloudflare Worker instead of direct API */
  useWorkerProxy?: boolean;
  /** Worker URL (required if useWorkerProxy) */
  workerUrl?: string;
  /** API key for direct mode (prefer Worker proxy for secret keys) */
  apiKey?: string;
}

// ==================== BaseRemoteProvider ====================

export abstract class BaseRemoteProvider implements RemoteProvider {
  abstract readonly id: string;
  abstract readonly name: string;
  abstract readonly source: string;

  protected options: BaseRemoteOptions;

  constructor(options: BaseRemoteOptions) {
    this.options = { ...options };
  }

  // ==================== Abstract ====================

  abstract search(keyword: string, options?: RemoteSearchOptions): Promise<SearchResult>;
  abstract getSong(id: string): Promise<RemoteSong>;
  abstract getLyrics(songId: string): Promise<string>;
  abstract getStream(songId: string): Promise<RemoteStream>;

  // ==================== Health (default) ====================

  async health(): Promise<RemoteProviderHealth> {
    const start = Date.now();
    try {
      const url = this.options.useWorkerProxy
        ? `${this.options.workerUrl}/api/health`
        : `${this.options.baseUrl}`;
      await this.fetchWithTimeout(url);
      return {
        healthy: true,
        avgLatency: Date.now() - start,
        availability: 1,
        totalRequests: 1,
        successRequests: 1,
        consecutiveFailures: 0,
        lastCheckTime: Date.now(),
        lastSuccessTime: Date.now(),
      };
    } catch {
      return {
        healthy: false,
        avgLatency: Date.now() - start,
        availability: 0,
        totalRequests: 1,
        successRequests: 0,
        consecutiveFailures: 1,
        lastCheckTime: Date.now(),
        lastSuccessTime: 0,
      };
    }
  }

  // ==================== Protected Helpers ====================

  /** Fetch with timeout via AbortController */
  protected async fetchWithTimeout(
    url: string,
    timeoutMs?: number,
  ): Promise<Response> {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs ?? this.options.timeoutMs);

    try {
      const res = await fetch(url, { signal: controller.signal });
      if (!res.ok) {
        throw new Error(`HTTP ${res.status}: ${res.statusText}`);
      }
      return res;
    } finally {
      clearTimeout(timer);
    }
  }

  /** Fetch with retry (exponential backoff) */
  protected async fetchWithRetry(
    url: string,
    maxRetries = 2,
    timeoutMs?: number,
  ): Promise<Response> {
    let lastError: Error | null = null;

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        return await this.fetchWithTimeout(url, timeoutMs);
      } catch (err) {
        lastError = err as Error;
        if (attempt < maxRetries) {
          const delay = Math.min(1000 * Math.pow(2, attempt), 8000);
          await new Promise((r) => setTimeout(r, delay + Math.random() * 200));
        }
      }
    }

    throw lastError ?? new Error("Max retries exceeded");
  }

  /** Build a Worker proxy URL */
  protected workerPath(path: string, params?: Record<string, string>): string {
    const base = this.options.workerUrl ?? "";
    const url = new URL(path, base);
    if (params) {
      for (const [k, v] of Object.entries(params)) {
        if (v) url.searchParams.set(k, v);
      }
    }
    return url.toString();
  }

  /** Parse JSON from response */
  protected async parseJSON<T>(response: Response): Promise<T> {
    return (await response.json()) as T;
  }

  /** Create a minimal Song object (filling required fields with defaults) */
  protected createSong(overrides: Partial<Song> & { id: string; title: string; artist: string }): Song {
    return {
      id: overrides.id,
      title: overrides.title,
      artist: overrides.artist,
      album: overrides.album ?? "",
      cover_url: overrides.cover_url ?? "",
      audio_url: overrides.audio_url ?? "",
      duration: overrides.duration ?? 0,
      genre: overrides.genre ?? "",
      release_year: overrides.release_year ?? null,
      play_count: overrides.play_count ?? 0,
      created_at: overrides.created_at ?? new Date().toISOString(),
    };
  }

  /** Create an empty SearchResult */
  protected emptySearchResult(): SearchResult {
    return { songs: [], playlists: [], artists: [], total: 0, hasMore: false };
  }
}

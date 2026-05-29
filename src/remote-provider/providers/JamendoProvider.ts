// ==================== Phase 16B: Jamendo Provider ====================

import type { RemoteProviderHealth, RemoteStream, RemoteSong, RemoteSearchOptions } from "../types";
import type { SearchResult } from "@/types/music";
import { BaseRemoteProvider, type BaseRemoteOptions } from "./BaseRemoteProvider";

// ==================== Provider ====================

export class JamendoProvider extends BaseRemoteProvider {
  readonly id = "jamendo";
  readonly name = "Jamendo";
  readonly source = "jamendo.com";

  constructor(options?: Partial<BaseRemoteOptions>) {
    super({
      baseUrl: "https://api.jamendo.com/v3.0",
      timeoutMs: 10000,
      useWorkerProxy: true, // Always use Worker proxy (API key must not be exposed)
      ...options,
    });
  }

  // ==================== search ====================

  async search(keyword: string, options?: RemoteSearchOptions): Promise<SearchResult> {
    const limit = options?.limit ?? 20;
    const offset = options?.offset ?? 0;

    try {
      // Always route through Worker (API key is server-side)
      const url = this.workerPath("/api/search", {
        q: keyword,
        provider: "jamendo",
        type: options?.type ?? "all",
        limit: String(limit),
        offset: String(offset),
      });
      const res = await this.fetchWithRetry(url);
      return this.parseJSON<SearchResult>(res);
    } catch (err) {
      console.error(`[Jamendo] search error:`, err);
      return this.emptySearchResult();
    }
  }

  // ==================== getSong ====================

  async getSong(id: string): Promise<RemoteSong> {
    try {
      const url = this.workerPath(`/api/song/${encodeURIComponent(id)}`, {
        provider: "jamendo",
      });
      const res = await this.fetchWithRetry(url);
      return this.parseJSON<RemoteSong>(res);
    } catch (err) {
      console.error(`[Jamendo] getSong error:`, err);
      throw new Error(`Failed to get song: ${id}`);
    }
  }

  // ==================== getLyrics ====================

  async getLyrics(_songId: string): Promise<string> {
    return "";
  }

  // ==================== getStream ====================

  async getStream(songId: string): Promise<RemoteStream> {
    try {
      const song = await this.getSong(songId);
      return {
        url: song.audio_url,
        format: "mp3",
        bitrate: 192,
        expireAt: 0,
      };
    } catch (err) {
      throw new Error(`No stream available for: ${songId}: ${err}`);
    }
  }

  // ==================== health ====================

  async health(): Promise<RemoteProviderHealth> {
    try {
      if (!this.options.workerUrl) {
        return {
          healthy: false,
          avgLatency: 0,
          availability: 0,
          totalRequests: 0,
          successRequests: 0,
          consecutiveFailures: 0,
          lastCheckTime: Date.now(),
          lastSuccessTime: 0,
        };
      }

      const url = `${this.options.workerUrl}/api/health`;
      const res = await this.fetchWithTimeout(url, 8000);
      const data = (await res.json()) as {
        providers: Record<string, { healthy: boolean; latency: number }>;
      };
      const provider = data.providers["jamendo"];
      return {
        healthy: provider?.healthy ?? false,
        avgLatency: provider?.latency ?? 0,
        availability: provider?.healthy ? 1 : 0,
        totalRequests: 1,
        successRequests: provider?.healthy ? 1 : 0,
        consecutiveFailures: provider?.healthy ? 0 : 1,
        lastCheckTime: Date.now(),
        lastSuccessTime: provider?.healthy ? Date.now() : 0,
      };
    } catch {
      return {
        healthy: false,
        avgLatency: 0,
        availability: 0,
        totalRequests: 0,
        successRequests: 0,
        consecutiveFailures: 0,
        lastCheckTime: Date.now(),
        lastSuccessTime: 0,
      };
    }
  }
}

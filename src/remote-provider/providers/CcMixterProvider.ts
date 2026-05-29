// ==================== Phase 16B: ccMixter Provider ====================

import type { RemoteProviderHealth, RemoteStream, RemoteSong, RemoteSearchOptions } from "../types";
import type { SearchResult } from "@/types/music";
import type { Song } from "@/types";
import { BaseRemoteProvider, type BaseRemoteOptions } from "./BaseRemoteProvider";

// ==================== Types ====================

interface CcMixterUpload {
  upload_id: string;
  upload_name: string;
  user_name: string;
  description: string;
  download_url: string;
  duration: number;
}

// ==================== Provider ====================

export class CcMixterProvider extends BaseRemoteProvider {
  readonly id = "ccmixter";
  readonly name = "ccMixter";
  readonly source = "ccmixter.org";

  constructor(options?: Partial<BaseRemoteOptions>) {
    super({
      baseUrl: "https://ccmixter.org",
      timeoutMs: 10000,
      useWorkerProxy: true, // Worker proxy for CORS compatibility
      ...options,
    });
  }

  // ==================== search ====================

  async search(keyword: string, options?: RemoteSearchOptions): Promise<SearchResult> {
    const limit = options?.limit ?? 20;

    try {
      if (this.options.useWorkerProxy && this.options.workerUrl) {
        const url = this.workerPath("/api/search", {
          q: keyword,
          provider: "ccmixter",
          type: options?.type ?? "all",
          limit: String(limit),
          offset: "0",
        });
        const res = await this.fetchWithRetry(url);
        return this.parseJSON<SearchResult>(res);
      }

      // Direct mode (may fail due to CORS in browser)
      const url = `https://ccmixter.org/api/query?datasource=uploads&search_type=all&search=${encodeURIComponent(keyword)}&limit=${limit}`;
      const res = await this.fetchWithRetry(url);
      const data = await this.parseJSON<CcMixterUpload[]>(res);

      const results = Array.isArray(data) ? data : [];
      const songs: Song[] = results.map((item) => this.mapUploadToSong(item));

      return { songs, playlists: [], artists: [], total: songs.length, hasMore: false };
    } catch (err) {
      console.error(`[ccMixter] search error:`, err);
      return this.emptySearchResult();
    }
  }

  // ==================== getSong ====================

  async getSong(id: string): Promise<RemoteSong> {
    try {
      if (this.options.useWorkerProxy && this.options.workerUrl) {
        const url = this.workerPath(`/api/song/${encodeURIComponent(id)}`, {
          provider: "ccmixter",
        });
        const res = await this.fetchWithRetry(url);
        return this.parseJSON<RemoteSong>(res);
      }

      const uploadId = id.startsWith("ccmixter-") ? id.slice(9) : id;
      const url = `https://ccmixter.org/api/query?datasource=uploads&search_type=all&upload_id=${uploadId}`;
      const res = await this.fetchWithRetry(url);
      const data = await this.parseJSON<CcMixterUpload[]>(res);
      const item = Array.isArray(data) ? data[0] : null;

      if (!item) throw new Error(`Song not found: ${id}`);

      return this.mapUploadToRemoteSong(item);
    } catch (err) {
      console.error(`[ccMixter] getSong error:`, err);
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
      if (this.options.useWorkerProxy && this.options.workerUrl) {
        const url = `${this.options.workerUrl}/api/health`;
        const res = await this.fetchWithTimeout(url, 8000);
        const data = (await res.json()) as {
          providers: Record<string, { healthy: boolean; latency: number }>;
        };
        const provider = data.providers["ccmixter"];
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
      }

      const start = Date.now();
      const res = await this.fetchWithTimeout(
        "https://ccmixter.org/api/query?datasource=uploads&limit=1",
        8000,
      );
      const latency = Date.now() - start;
      return {
        healthy: res.ok,
        avgLatency: latency,
        availability: res.ok ? 1 : 0,
        totalRequests: 1,
        successRequests: res.ok ? 1 : 0,
        consecutiveFailures: res.ok ? 0 : 1,
        lastCheckTime: Date.now(),
        lastSuccessTime: res.ok ? Date.now() : 0,
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

  // ==================== Private ====================

  private mapUploadToSong(item: CcMixterUpload): Song {
    return this.createSong({
      id: `ccmixter-${item.upload_id}`,
      title: item.upload_name || "Unknown",
      artist: item.user_name || "Unknown Artist",
      album: "ccMixter",
      cover_url: "",
      audio_url: item.download_url || "",
      duration: Math.round(item.duration || 0),
    });
  }

  private mapUploadToRemoteSong(item: CcMixterUpload): RemoteSong {
    return {
      id: `ccmixter-${item.upload_id}`,
      title: item.upload_name || "Unknown",
      artist: item.user_name || "Unknown Artist",
      album: "ccMixter",
      cover_url: "",
      audio_url: item.download_url || "",
      duration: Math.round(item.duration || 0),
      genre: "",
      release_year: null,
      play_count: 0,
      created_at: new Date().toISOString(),
      remoteId: item.upload_id,
      vip: false,
      quality: "high",
    };
  }
}

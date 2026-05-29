// ==================== Phase 16B: Cloudflare Worker Adapter (Real) ====================

import type { RemoteProvider, RemoteProviderHealth, RemoteStream, RemoteSong, RemoteSearchOptions } from "../types";
import type { SearchResult } from "@/types/music";

// ==================== Mock Fallback Data ====================

import { mockSongs, mockPlaylists, mockArtists, mockLyrics } from "@/music-source/providers/mock/data";

// ==================== RemoteWorkerProvider ====================

export class RemoteWorkerProvider implements RemoteProvider {
  readonly id = "remote-worker";
  readonly name = "Cloudflare Worker";
  readonly source = "cloudflare";

  private workerUrl: string;
  private _isReal: boolean;

  constructor(workerUrl?: string) {
    this.workerUrl = workerUrl ?? "";
    this._isReal = !!this.workerUrl;
  }

  /** Whether this instance is making real network calls */
  get isReal(): boolean {
    return this._isReal;
  }

  /** Update Worker URL at runtime */
  setWorkerUrl(url: string): void {
    this.workerUrl = url;
    this._isReal = !!url;
  }

  // ==================== search ====================

  async search(keyword: string, options?: RemoteSearchOptions): Promise<SearchResult> {
    if (this._isReal) {
      return this.realSearch(keyword, options);
    }
    return this.mockSearch(keyword, options);
  }

  // ==================== getSong ====================

  async getSong(id: string): Promise<RemoteSong> {
    if (this._isReal) {
      return this.realGetSong(id);
    }
    return this.mockGetSong(id);
  }

  // ==================== getLyrics ====================

  async getLyrics(songId: string): Promise<string> {
    if (this._isReal) {
      return this.realGetLyrics(songId);
    }
    return this.mockGetLyrics(songId);
  }

  // ==================== getStream ====================

  async getStream(songId: string): Promise<RemoteStream> {
    if (this._isReal) {
      return this.realGetStream(songId);
    }
    return this.mockGetStream(songId);
  }

  // ==================== health ====================

  async health(): Promise<RemoteProviderHealth> {
    if (this._isReal) {
      return this.realHealth();
    }
    return this.mockHealth();
  }

  // ==================== Real Implementation ====================

  private async realFetch<T>(path: string, params?: Record<string, string>): Promise<T> {
    const url = new URL(path, this.workerUrl);
    if (params) {
      for (const [k, v] of Object.entries(params)) {
        if (v) url.searchParams.set(k, v);
      }
    }

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 10000);

    try {
      const res = await fetch(url.toString(), {
        signal: controller.signal,
        headers: { "Content-Type": "application/json" },
      });
      if (!res.ok) {
        throw new Error(`Worker error: ${res.status} ${res.statusText}`);
      }
      return (await res.json()) as T;
    } finally {
      clearTimeout(timer);
    }
  }

  private async realSearch(keyword: string, options?: RemoteSearchOptions): Promise<SearchResult> {
    try {
      return await this.realFetch<SearchResult>("/api/search", {
        q: keyword,
        provider: "all",
        type: options?.type ?? "all",
        limit: String(options?.limit ?? 20),
        offset: String(options?.offset ?? 0),
      });
    } catch (err) {
      console.error("[RemoteWorker] search failed:", err);
      return { songs: [], playlists: [], artists: [], total: 0, hasMore: false };
    }
  }

  private async realGetSong(id: string): Promise<RemoteSong> {
    return this.realFetch<RemoteSong>(`/api/song/${encodeURIComponent(id)}`);
  }

  private async realGetLyrics(_songId: string): Promise<string> {
    return ""; // Worker doesn't proxy lyrics in Phase 16B
  }

  private async realGetStream(songId: string): Promise<RemoteStream> {
    const song = await this.realGetSong(songId);
    return {
      url: song.audio_url,
      format: "mp3",
      bitrate: 192,
      expireAt: 0,
    };
  }

  private async realHealth(): Promise<RemoteProviderHealth> {
    try {
      const data = await this.realFetch<{
        status: string;
        providers: Record<string, { healthy: boolean; latency: number }>;
      }>("/api/health");

      const latencies = Object.values(data.providers)
        .filter((p) => p.healthy)
        .map((p) => p.latency);
      const avgLatency = latencies.length > 0
        ? Math.round(latencies.reduce((a, b) => a + b, 0) / latencies.length)
        : 0;

      return {
        healthy: data.status === "ok",
        avgLatency,
        availability: data.status === "ok" ? 1 : 0,
        totalRequests: 1,
        successRequests: data.status === "ok" ? 1 : 0,
        consecutiveFailures: data.status === "ok" ? 0 : 1,
        lastCheckTime: Date.now(),
        lastSuccessTime: data.status === "ok" ? Date.now() : 0,
      };
    } catch {
      return {
        healthy: false,
        avgLatency: 0,
        availability: 0,
        totalRequests: 0,
        successRequests: 0,
        consecutiveFailures: 1,
        lastCheckTime: Date.now(),
        lastSuccessTime: 0,
      };
    }
  }

  // ==================== Mock Implementation (fallback) ====================

  private delay(min: number, max: number): Promise<void> {
    const ms = min + Math.random() * (max - min);
    return new Promise((r) => setTimeout(r, ms));
  }

  private async mockSearch(keyword: string, options?: RemoteSearchOptions): Promise<SearchResult> {
    await this.delay(120, 280);
    const kw = keyword.toLowerCase();
    const limit = options?.limit ?? 20;
    const offset = options?.offset ?? 0;

    const matchSongs = mockSongs.filter(
      (s) =>
        s.title.toLowerCase().includes(kw) ||
        s.artist.toLowerCase().includes(kw) ||
        s.album.toLowerCase().includes(kw),
    );

    const matchPlaylists = mockPlaylists.filter(
      (p) => p.name.toLowerCase().includes(kw) || p.description.toLowerCase().includes(kw),
    );

    const matchArtists = mockArtists.filter(
      (a) => a.name.toLowerCase().includes(kw) || (a.description ?? "").toLowerCase().includes(kw),
    );

    return {
      songs: matchSongs.slice(offset, offset + limit),
      playlists: matchPlaylists.slice(0, 4),
      artists: matchArtists.slice(0, 3),
      total: matchSongs.length + matchPlaylists.length + matchArtists.length,
      hasMore: offset + limit < matchSongs.length,
    };
  }

  private async mockGetSong(id: string): Promise<RemoteSong> {
    await this.delay(80, 200);
    const song = mockSongs.find((s) => s.id === id);
    if (!song) throw new Error(`Song not found: ${id}`);
    return { ...song, remoteId: `remote-${id}`, vip: false, quality: "high" };
  }

  private async mockGetLyrics(songId: string): Promise<string> {
    await this.delay(60, 180);
    return mockLyrics[songId] ?? "";
  }

  private async mockGetStream(songId: string): Promise<RemoteStream> {
    await this.delay(100, 300);
    const song = mockSongs.find((s) => s.id === songId);
    if (!song || !song.audio_url) {
      throw new Error(`No stream available for: ${songId}`);
    }
    return { url: song.audio_url, format: "mp3", bitrate: 192, expireAt: 0 };
  }

  private async mockHealth(): Promise<RemoteProviderHealth> {
    await this.delay(30, 100);
    return {
      healthy: true,
      avgLatency: Math.round(80 + Math.random() * 100),
      availability: 0.99,
      totalRequests: 1000,
      successRequests: 990,
      consecutiveFailures: 0,
      lastCheckTime: Date.now(),
      lastSuccessTime: Date.now(),
    };
  }
}

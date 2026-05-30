// ==================== Phase 16B: Internet Archive Provider ====================

import type { RemoteProviderHealth, RemoteStream, RemoteSong, RemoteSearchOptions } from "../types";
import type { SearchResult } from "@/types/music";
import type { Song } from "@/types";
import { BaseRemoteProvider, type BaseRemoteOptions } from "./BaseRemoteProvider";

// ==================== Types ====================

interface IADoc {
  identifier: string;
  title: string;
  creator?: string;
  description?: string;
  year?: string;
}

interface IASearchResponse {
  response: {
    docs: IADoc[];
    numFound: number;
  };
}

interface IAMetadataResponse {
  metadata: {
    title?: string;
    creator?: string;
    description?: string;
    year?: string;
    collection?: string[];
  };
  files?: Array<{ name: string; format: string }>;
}

// ==================== Public Domain Collections ====================

const PUBLIC_COLLECTIONS = [
  "georgeblood",
  "78rpm",
  "opensource_audio",
  "netlabels",
  "audio_music",
];

// ==================== Provider ====================

export class InternetArchiveProvider extends BaseRemoteProvider {
  readonly id = "internet-archive";
  readonly name = "Internet Archive";
  readonly source = "archive.org";

  constructor(options?: Partial<BaseRemoteOptions>) {
    super({
      baseUrl: "https://archive.org",
      timeoutMs: 12000,
      useWorkerProxy: true, // Always prefer Worker proxy to avoid ORB blocking
      ...options,
    });
  }

  /** Build a stream URL that goes through the Worker proxy */
  private buildStreamUrl(identifier: string): string {
    if (this.options.useWorkerProxy && this.options.workerUrl) {
      return `${this.options.workerUrl}/api/stream?id=${encodeURIComponent(identifier)}`;
    }
    // Fallback: direct archive.org URL (will be blocked by ORB in browser)
    return `https://archive.org/download/${identifier}/${encodeURIComponent(identifier)}.mp3`;
  }

  // ==================== search ====================

  async search(keyword: string, options?: RemoteSearchOptions): Promise<SearchResult> {
    const limit = options?.limit ?? 20;
    const offset = options?.offset ?? 0;
    const page = Math.floor(offset / limit) + 1;

    try {
      if (this.options.useWorkerProxy && this.options.workerUrl) {
        const url = this.workerPath("/api/search", {
          q: keyword,
          provider: "internet-archive",
          type: options?.type ?? "all",
          limit: String(limit),
          offset: String(offset),
        });
        const res = await this.fetchWithRetry(url);
        return this.parseJSON<SearchResult>(res);
      }

      // Direct mode
      const collectionFilter = PUBLIC_COLLECTIONS.map((c) => `collection:${c}`).join(" OR ");
      const query = `mediatype:audio AND (title:(${encodeURIComponent(keyword)}) OR creator:(${encodeURIComponent(keyword)}))`;
      const fullQuery = `${query} AND (${collectionFilter})`;

      const url = `https://archive.org/advancedsearch.php?q=${fullQuery}&fl[]=identifier,title,creator,description,year&output=json&rows=${limit}&page=${page}`;

      const res = await this.fetchWithRetry(url, 2, 12000);
      const data = await this.parseJSON<IASearchResponse>(res);

      const songs: Song[] = data.response.docs.map((doc) =>
        this.mapDocToSong(doc),
      );

      return {
        songs,
        playlists: [],
        artists: [],
        total: data.response.numFound,
        hasMore: offset + limit < data.response.numFound,
      };
    } catch (err) {
      console.error(`[InternetArchive] search error:`, err);
      return this.emptySearchResult();
    }
  }

  // ==================== getSong ====================

  async getSong(id: string): Promise<RemoteSong> {
    const identifier = id.startsWith("ia-") ? id.slice(3) : id;

    try {
      if (this.options.useWorkerProxy && this.options.workerUrl) {
        const url = this.workerPath(`/api/song/${encodeURIComponent(id)}`, {
          provider: "internet-archive",
        });
        const res = await this.fetchWithRetry(url);
        return this.parseJSON<RemoteSong>(res);
      }

      const res = await this.fetchWithRetry(
        `https://archive.org/metadata/${encodeURIComponent(identifier)}`,
        2,
        12000,
      );
      const data = await this.parseJSON<IAMetadataResponse>(res);

      return this.mapMetadataToRemoteSong(identifier, data);
    } catch (err) {
      console.error(`[InternetArchive] getSong error:`, err);
      throw new Error(`Failed to get song: ${id}`);
    }
  }

  // ==================== getLyrics ====================

  async getLyrics(_songId: string): Promise<string> {
    return "";
  }

  // ==================== getStream ====================

  async getStream(songId: string): Promise<RemoteStream> {
    const identifier = songId.startsWith("ia-") ? songId.slice(3) : songId;
    const url = this.buildStreamUrl(identifier);

    return {
      url,
      format: "mp3",
      bitrate: 192,
      expireAt: 0,
    };
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
        const provider = data.providers["internet-archive"];
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
        "https://archive.org/advancedsearch.php?q=mediatype:audio&rows=1&output=json",
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
        totalRequests: 1,
        successRequests: 0,
        consecutiveFailures: 1,
        lastCheckTime: Date.now(),
        lastSuccessTime: 0,
      };
    }
  }

  // ==================== Private ====================

  private mapDocToSong(doc: IADoc): Song {
    const identifier = doc.identifier;
    return this.createSong({
      id: `ia-${identifier}`,
      title: doc.title || "Unknown",
      artist: doc.creator ?? "Unknown Artist",
      album: "Internet Archive",
      cover_url: `https://archive.org/services/img/${identifier}`,
      audio_url: this.buildStreamUrl(identifier),
      duration: 0,
      genre: "",
      release_year: doc.year ? parseInt(doc.year, 10) : null,
    });
  }

  private mapMetadataToRemoteSong(identifier: string, data: IAMetadataResponse): RemoteSong {
    return {
      id: `ia-${identifier}`,
      title: data.metadata?.title ?? identifier,
      artist: data.metadata?.creator ?? "Unknown Artist",
      album: data.metadata?.collection?.join(", ") ?? "Internet Archive",
      cover_url: `https://archive.org/services/img/${identifier}`,
      audio_url: this.buildStreamUrl(identifier),
      duration: 0,
      genre: "",
      release_year: data.metadata?.year ? parseInt(data.metadata.year, 10) : null,
      play_count: 0,
      created_at: new Date().toISOString(),
      remoteId: identifier,
      vip: false,
      quality: "high",
    };
  }
}

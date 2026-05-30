// ==================== MusicProviderAdapter ====================
// Bridges RemoteProvider → MusicProvider interface so real providers
// (InternetArchive, CcMixter, Jamendo) can be registered with the main
// ProviderManager alongside MockProvider as fallback.

import type { MusicProvider, ProviderType, SearchOptions, SongDetail, MusicQuality } from "../types/provider";
import type { RemoteProvider } from "@/remote-provider/types";
import type { SearchResult, Artist } from "@/types/music";
import type { Song, Playlist } from "@/types";

export class MusicProviderAdapter implements MusicProvider {
  readonly name: string;
  readonly type: ProviderType;

  private remote: RemoteProvider;

  constructor(remote: RemoteProvider) {
    this.remote = remote;
    this.name = remote.name;
    this.type = remote.id;
  }

  // === Search ===

  async search(keyword: string, options?: SearchOptions): Promise<SearchResult> {
    return this.remote.search(keyword, {
      limit: options?.limit,
      offset: options?.offset,
      type: options?.type,
    });
  }

  async getSearchSuggestions(keyword: string): Promise<string[]> {
    // Delegate to search and extract titles as suggestions
    try {
      const result = await this.remote.search(keyword, { limit: 5, type: "song" });
      return result.songs.slice(0, 5).map((s) => s.title);
    } catch {
      return [];
    }
  }

  async getHotKeywords(): Promise<string[]> {
    // Real providers don't have hot keywords — return empty (fallback picks up)
    return [];
  }

  // === Song ===

  async getSongDetail(id: string): Promise<SongDetail> {
    const song = await this.remote.getSong(id);
    return {
      ...song,
      lyric: undefined,
      vip: song.vip ?? false,
      quality: (song.quality as MusicQuality) ?? "high",
    };
  }

  async getPlayUrl(id: string, _quality?: MusicQuality): Promise<string> {
    const stream = await this.remote.getStream(id);
    return stream.url;
  }

  async getLyrics(id: string): Promise<string> {
    return this.remote.getLyrics(id);
  }

  // === Playlist (passthrough — real providers return empty) ===

  async getPlaylist(_id: string): Promise<Playlist> {
    throw new Error("Playlist not supported by remote provider");
  }

  async getPlaylistSongs(_id: string): Promise<Song[]> {
    return [];
  }

  // === Artist (passthrough — real providers return empty) ===

  async getArtist(_id: string): Promise<Artist> {
    throw new Error("Artist not supported by remote provider");
  }

  async getArtistSongs(_id: string): Promise<Song[]> {
    return [];
  }
}

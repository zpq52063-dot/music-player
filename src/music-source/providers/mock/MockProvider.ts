import type { Song, Playlist } from "@/types";
import type { Artist } from "@/types";
import type { MusicProvider, ProviderType, SearchOptions, SongDetail, MusicQuality } from "../../types/provider";
import type { SearchResult } from "@/types";
import { mockSongs, mockPlaylists, mockArtists, mockLyrics, mockHotKeywords } from "./data";

function delay(ms: number = 0): Promise<void> {
  const jitter = Math.random() * 150 + 100; // 100-250ms
  return new Promise((r) => setTimeout(r, ms || jitter));
}

export class MockProvider implements MusicProvider {
  readonly name = "Mock Music Provider";
  readonly type: ProviderType = "mock";

  // ==================== 搜索 ====================

  async search(keyword: string, options?: SearchOptions): Promise<SearchResult> {
    await delay();
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

    const total = matchSongs.length + matchPlaylists.length + matchArtists.length;

    return {
      songs: matchSongs.slice(offset, offset + limit),
      playlists: matchPlaylists.slice(0, 4),
      artists: matchArtists.slice(0, 3),
      total,
      hasMore: offset + limit < matchSongs.length,
    };
  }

  async getSearchSuggestions(keyword: string): Promise<string[]> {
    await delay(50);
    const kw = keyword.toLowerCase();
    if (!kw) return [];

    const matches = new Set<string>();
    for (const s of mockSongs) {
      if (s.title.toLowerCase().includes(kw)) matches.add(s.title);
      if (s.artist.toLowerCase().includes(kw)) matches.add(s.artist);
      if (matches.size >= 8) break;
    }
    return Array.from(matches).slice(0, 8);
  }

  async getHotKeywords(): Promise<string[]> {
    await delay(80);
    return [...mockHotKeywords];
  }

  // ==================== 歌曲 ====================

  async getSongDetail(id: string): Promise<SongDetail> {
    await delay();
    const song = mockSongs.find((s) => s.id === id);
    if (!song) throw new Error(`Song not found: ${id}`);

    return {
      ...song,
      lyric: mockLyrics[id],
      vip: false,
      quality: "high" as MusicQuality,
    };
  }

  async getPlayUrl(_id: string, _quality?: MusicQuality): Promise<string> {
    await delay(50);
    // Mock: 返回空字符串，因为没有真实音频（UI 会使用 audio_url）
    const song = mockSongs.find((s) => s.id === _id);
    return song?.audio_url ?? "";
  }

  async getLyrics(id: string): Promise<string> {
    await delay(80);
    return mockLyrics[id] ?? "";
  }

  // ==================== 歌单 ====================

  async getPlaylist(id: string): Promise<Playlist> {
    await delay();
    const pl = mockPlaylists.find((p) => p.id === id);
    if (!pl) throw new Error(`Playlist not found: ${id}`);
    return pl;
  }

  async getPlaylistSongs(_id: string): Promise<Song[]> {
    await delay();
    // Return a subset of songs per playlist
    return mockSongs.slice(0, 15);
  }

  // ==================== 艺术家 ====================

  async getArtist(id: string): Promise<Artist> {
    await delay();
    const artist = mockArtists.find((a) => a.id === id);
    if (!artist) throw new Error(`Artist not found: ${id}`);
    return artist;
  }

  async getArtistSongs(id: string): Promise<Song[]> {
    await delay();
    const artist = mockArtists.find((a) => a.id === id);
    if (!artist) return [];
    return mockSongs.filter((s) => s.artist === artist.name);
  }
}

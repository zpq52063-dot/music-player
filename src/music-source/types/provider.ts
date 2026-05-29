import type { Song, Playlist } from "@/types";
import type { SearchResult, Artist } from "@/types/music";

// ==================== Provider 类型标识 ====================

export type ProviderType = "mock" | string; // string 为未来 Provider 预留

export type MusicQuality = "standard" | "high" | "lossless" | "hires";

// ==================== 搜索选项 ====================

export interface SearchOptions {
  limit?: number;
  offset?: number;
  type?: "song" | "playlist" | "artist" | "all";
}

// ==================== 歌曲详情扩展 ====================

export interface SongDetail extends Song {
  lyric?: string;
  vip?: boolean;
  quality?: MusicQuality;
}

// ==================== 统一 Provider 接口 ====================

export interface MusicProvider {
  /** Provider 名称 */
  readonly name: string;
  /** Provider 类型标识 */
  readonly type: ProviderType;

  // --- 搜索 ---
  /** 综合搜索 */
  search(keyword: string, options?: SearchOptions): Promise<SearchResult>;
  /** 搜索建议（自动补全） */
  getSearchSuggestions(keyword: string): Promise<string[]>;
  /** 热门搜索词 */
  getHotKeywords(): Promise<string[]>;

  // --- 歌曲 ---
  /** 获取歌曲详情 */
  getSongDetail(id: string): Promise<SongDetail>;
  /** 获取播放 URL */
  getPlayUrl(id: string, quality?: MusicQuality): Promise<string>;
  /** 获取歌词文本 (LRC) */
  getLyrics(id: string): Promise<string>;

  // --- 歌单 ---
  /** 获取歌单详情 */
  getPlaylist(id: string): Promise<Playlist>;
  /** 获取歌单中的歌曲列表 */
  getPlaylistSongs(id: string): Promise<Song[]>;

  // --- 艺术家 ---
  /** 获取艺术家详情 */
  getArtist(id: string): Promise<Artist>;
  /** 获取艺术家的歌曲列表 */
  getArtistSongs(id: string): Promise<Song[]>;
}

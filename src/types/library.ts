import type { Song } from "./song";
import type { Playlist } from "./playlist";

// ==================== 用户状态（Store 专用） ====================

export interface UserState {
  user: UserInfo | null;
  isAuthenticated: boolean;
  isAnonymous: boolean;
  isLoading: boolean;
}

export interface UserInfo {
  id: string;
  email?: string;
  username?: string;
  avatarUrl?: string;
  isAnonymous: boolean;
  createdAt?: string;
}

// ==================== 喜欢歌曲 ====================

export interface LikedSongRecord {
  id: string;
  user_id: string;
  song_id: string;
  created_at: string;
}

export interface LikedSongWithMeta extends LikedSongRecord {
  song: Song;
}

// ==================== 最近播放 ====================

export interface RecentlyPlayedRecord {
  id: string;
  user_id: string;
  song_id: string;
  played_at: string;
}

export interface RecentlyPlayedWithMeta extends RecentlyPlayedRecord {
  song: Song;
}

// ==================== 用户歌单 ====================

export interface UserPlaylist {
  id: string;
  user_id: string;
  title: string;
  cover: string;
  description: string;
  created_at: string;
  song_count?: number;
}

export interface PlaylistWithSongsDetail extends UserPlaylist {
  songs: Song[];
}

// ==================== 收藏歌单 ====================

export interface FavoritePlaylistRecord {
  id: string;
  user_id: string;
  playlist_id: string;
  created_at: string;
}

export interface FavoritePlaylistWithMeta extends FavoritePlaylistRecord {
  playlist: Playlist;
}

// ==================== 歌单歌曲关联 ====================

export interface PlaylistSongRecord {
  id: string;
  playlist_id: string;
  song_id: string;
  position: number;
  added_at: string;
}

// ==================== Library 聚合 ====================

export interface LibraryData {
  likedSongIds: Set<string>;
  playlists: UserPlaylist[];
  recentPlayIds: string[];
  favoritePlaylistIds: Set<string>;
}

/**
 * localStorage 数据层 — Supabase 不可用时的 fallback
 *
 * 存储结构:
 *   local_user_id        → string (UUID)
 *   liked_songs:{uid}    → JSON string[]
 *   playlists:{uid}      → JSON UserPlaylist[]
 *   playlist:{plId}      → JSON PlaylistWithSongsDetail
 *   recent_plays:{uid}   → JSON {songId: string, playedAt: number}[]
 */

import { safeUUID } from "@/lib/safeUUID";
import type { Song, UserPlaylist, PlaylistWithSongsDetail } from "@/types";

const LS = typeof window !== "undefined" ? window.localStorage : null;

function read<T>(key: string, fallback: T): T {
  if (!LS) return fallback;
  try {
    const raw = LS.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

function write<T>(key: string, value: T): void {
  if (!LS) return;
  try {
    LS.setItem(key, JSON.stringify(value));
  } catch { /* quota exceeded — silently ignore */ }
}

// ==================== Auth ====================

export const localAuth = {
  getUserId(): string {
    if (!LS) return "";
    let id = LS.getItem("local_user_id");
    if (!id) {
      id = "local_" + safeUUID();
      LS.setItem("local_user_id", id);
    }
    return id;
  },
};

// ==================== Liked Songs ====================

function likedKey(uid: string) { return `liked_songs:${uid}`; }

export const localLikedSongs = {
  getIds(uid: string): string[] {
    return read<string[]>(likedKey(uid), []);
  },

  setIds(uid: string, ids: string[]): void {
    write(likedKey(uid), ids);
  },

  add(uid: string, songId: string): void {
    const ids = read<string[]>(likedKey(uid), []);
    if (!ids.includes(songId)) {
      ids.unshift(songId);
    }
    write(likedKey(uid), ids);
  },

  remove(uid: string, songId: string): void {
    const ids = read<string[]>(likedKey(uid), []);
    write(likedKey(uid), ids.filter((id) => id !== songId));
  },

  isLiked(uid: string, songId: string): boolean {
    return read<string[]>(likedKey(uid), []).includes(songId);
  },
};

// ==================== Playlists ====================

function playlistsKey(uid: string) { return `playlists:${uid}`; }
function playlistDetailKey(plId: string) { return `playlist:${plId}`; }

export const localPlaylists = {
  getAll(uid: string): UserPlaylist[] {
    return read<UserPlaylist[]>(playlistsKey(uid), []);
  },

  getDetail(plId: string): PlaylistWithSongsDetail | null {
    return read<PlaylistWithSongsDetail | null>(playlistDetailKey(plId), null);
  },

  saveDetail(pl: PlaylistWithSongsDetail): void {
    write(playlistDetailKey(pl.id), pl);
  },

  create(uid: string, title: string, description = "", cover = ""): UserPlaylist {
    const playlists = read<UserPlaylist[]>(playlistsKey(uid), []);
    const pl: UserPlaylist = {
      id: "local_pl_" + Date.now(),
      user_id: uid,
      title,
      cover,
      description,
      song_count: 0,
      created_at: new Date().toISOString(),
    };
    playlists.unshift(pl);
    write(playlistsKey(uid), playlists);
    write(playlistDetailKey(pl.id), { ...pl, songs: [] });
    return pl;
  },

  delete(uid: string, plId: string): void {
    const playlists = read<UserPlaylist[]>(playlistsKey(uid), []);
    write(playlistsKey(uid), playlists.filter((p) => p.id !== plId));
    if (LS) LS.removeItem(playlistDetailKey(plId));
  },

  addSong(uid: string, plId: string, song: Song): void {
    const detail = read<PlaylistWithSongsDetail | null>(playlistDetailKey(plId), null);
    if (!detail) return;
    if (detail.songs.some((s) => s.id === song.id)) return;
    detail.songs.push(song);
    detail.song_count = detail.songs.length;
    write(playlistDetailKey(plId), detail);

    const playlists = read<UserPlaylist[]>(playlistsKey(uid), []);
    const pl = playlists.find((p) => p.id === plId);
    if (pl) {
      pl.song_count = detail.song_count;
      write(playlistsKey(uid), playlists);
    }
  },

  removeSong(uid: string, plId: string, songId: string): void {
    const detail = read<PlaylistWithSongsDetail | null>(playlistDetailKey(plId), null);
    if (!detail) return;
    detail.songs = detail.songs.filter((s) => s.id !== songId);
    detail.song_count = detail.songs.length;
    write(playlistDetailKey(plId), detail);

    const playlists = read<UserPlaylist[]>(playlistsKey(uid), []);
    const pl = playlists.find((p) => p.id === plId);
    if (pl) {
      pl.song_count = detail.song_count;
      write(playlistsKey(uid), playlists);
    }
  },
};

// ==================== Favorite Playlists ====================

function favPlaylistsKey(uid: string) { return `favorite_playlists:${uid}`; }

export const localFavoritePlaylists = {
  getIds(uid: string): string[] {
    return read<string[]>(favPlaylistsKey(uid), []);
  },

  setIds(uid: string, ids: string[]): void {
    write(favPlaylistsKey(uid), ids);
  },

  add(uid: string, plId: string): void {
    const ids = read<string[]>(favPlaylistsKey(uid), []);
    if (!ids.includes(plId)) ids.push(plId);
    write(favPlaylistsKey(uid), ids);
  },

  remove(uid: string, plId: string): void {
    const ids = read<string[]>(favPlaylistsKey(uid), []);
    write(favPlaylistsKey(uid), ids.filter((id) => id !== plId));
  },

  isFavorited(uid: string, plId: string): boolean {
    return read<string[]>(favPlaylistsKey(uid), []).includes(plId);
  },
};

// ==================== Recent Plays ====================

function recentKey(uid: string) { return `recent_plays:${uid}`; }

interface RecentPlayEntry { songId: string; playedAt: number; }

export const localRecentPlays = {
  getIds(uid: string, limit = 30): string[] {
    const entries = read<RecentPlayEntry[]>(recentKey(uid), []);
    return entries.slice(0, limit).map((e) => e.songId);
  },

  record(uid: string, songId: string): void {
    const entries = read<RecentPlayEntry[]>(recentKey(uid), []);
    const filtered = entries.filter((e) => e.songId !== songId);
    filtered.unshift({ songId, playedAt: Date.now() });
    write(recentKey(uid), filtered.slice(0, 50));
  },
};

// ==================== Comment Likes (local mode: noop) ====================

export const localCommentLikes = {
  getLikedIds(_uid: string): string[] { return []; },
  add(_uid: string, _commentId: string): void {},
  remove(_uid: string, _commentId: string): void {},
};

// ==================== Helpers ====================

export { read, write };

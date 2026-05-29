import { create } from "zustand";

interface LibraryState {
  /** 用户喜欢的歌曲 ID 集合 */
  likedSongIds: Set<string>;
  /** 最近播放的歌曲 ID 列表（有序） */
  recentPlayIds: string[];
  /** 收藏的歌单 ID 集合 */
  favoritePlaylistIds: Set<string>;

  // --- Liked Songs ---
  setLikedSongIds: (ids: string[]) => void;
  toggleLikeOptimistic: (songId: string) => void;

  // --- Recent Plays ---
  setRecentPlayIds: (ids: string[]) => void;
  addRecentPlayOptimistic: (songId: string) => void;

  // --- Favorite Playlists ---
  setFavoritePlaylistIds: (ids: string[]) => void;
  toggleFavoriteOptimistic: (playlistId: string) => void;
}

export const useLibraryStore = create<LibraryState>((set, get) => ({
  likedSongIds: new Set(),
  recentPlayIds: [],
  favoritePlaylistIds: new Set(),

  // --- Liked Songs ---

  setLikedSongIds: (ids) => set({ likedSongIds: new Set(ids) }),

  toggleLikeOptimistic: (songId) => {
    const current = get().likedSongIds;
    const next = new Set(current);
    if (next.has(songId)) {
      next.delete(songId);
    } else {
      next.add(songId);
    }
    set({ likedSongIds: next });
  },

  // --- Recent Plays ---

  setRecentPlayIds: (ids) => set({ recentPlayIds: ids }),

  addRecentPlayOptimistic: (songId) => {
    const current = get().recentPlayIds;
    const filtered = current.filter((id) => id !== songId);
    set({ recentPlayIds: [songId, ...filtered].slice(0, 30) });
  },

  // --- Favorite Playlists ---

  setFavoritePlaylistIds: (ids) => set({ favoritePlaylistIds: new Set(ids) }),

  toggleFavoriteOptimistic: (playlistId) => {
    const current = get().favoritePlaylistIds;
    const next = new Set(current);
    if (next.has(playlistId)) {
      next.delete(playlistId);
    } else {
      next.add(playlistId);
    }
    set({ favoritePlaylistIds: next });
  },
}));

import { create } from "zustand";

interface PlaylistStoreState {
  /** 当前正在编辑的歌单 ID */
  editingPlaylistId: string | null;
  /** 创建歌单 modal 是否打开 */
  isCreateModalOpen: boolean;
  /** 添加到歌单 modal 是否打开 */
  isAddSongModalOpen: boolean;
  /** 待添加的歌曲 ID */
  pendingSongId: string | null;

  openCreateModal: () => void;
  closeCreateModal: () => void;
  openAddSongModal: (songId: string) => void;
  closeAddSongModal: () => void;
  setEditingPlaylist: (id: string | null) => void;
}

export const usePlaylistStore = create<PlaylistStoreState>((set) => ({
  editingPlaylistId: null,
  isCreateModalOpen: false,
  isAddSongModalOpen: false,
  pendingSongId: null,

  openCreateModal: () => set({ isCreateModalOpen: true }),
  closeCreateModal: () => set({ isCreateModalOpen: false }),
  openAddSongModal: (songId) => set({ isAddSongModalOpen: true, pendingSongId: songId }),
  closeAddSongModal: () => set({ isAddSongModalOpen: false, pendingSongId: null }),
  setEditingPlaylist: (id) => set({ editingPlaylistId: id }),
}));

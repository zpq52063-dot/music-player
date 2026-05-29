import { putItem, getItem, getAllItems, deleteItem, countItems, clearStore } from "./CacheDB";
import type { Song } from "@/types";

const STORE = "offline_playlists";

interface OfflinePlaylist {
  id: string;
  name: string;
  coverUrl: string;
  songs: Song[];
  cachedAt: number;
}

export async function saveOfflinePlaylist(playlist: Omit<OfflinePlaylist, "cachedAt">): Promise<void> {
  await putItem<OfflinePlaylist>(STORE, { ...playlist, cachedAt: Date.now() });
}

export async function getOfflinePlaylist(id: string): Promise<OfflinePlaylist | undefined> {
  return getItem<OfflinePlaylist>(STORE, id);
}

export async function getAllOfflinePlaylists(): Promise<OfflinePlaylist[]> {
  return getAllItems<OfflinePlaylist>(STORE);
}

export async function removeOfflinePlaylist(id: string): Promise<void> {
  await deleteItem(STORE, id);
}

export async function getOfflinePlaylistCount(): Promise<number> {
  return countItems(STORE);
}

export async function clearOfflinePlaylists(): Promise<void> {
  await clearStore(STORE);
}

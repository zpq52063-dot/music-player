import { putItem, getItem, getAllItems, deleteItem, countItems } from "./CacheDB";
import type { Song } from "@/types";

const STORE = "song_metadata";

interface CachedSong extends Song {
  cachedAt: number;
}

export async function cacheSongMetadata(song: Song): Promise<void> {
  await putItem<CachedSong>(STORE, { ...song, cachedAt: Date.now() });
}

export async function getCachedSong(id: string): Promise<Song | undefined> {
  return getItem<Song>(STORE, id);
}

export async function getCachedSongs(ids: string[]): Promise<Song[]> {
  const results: Song[] = [];
  for (const id of ids) {
    const song = await getItem<Song>(STORE, id);
    if (song) results.push(song);
  }
  return results;
}

export async function getAllCachedSongs(): Promise<CachedSong[]> {
  return getAllItems<CachedSong>(STORE);
}

export async function removeCachedSong(id: string): Promise<void> {
  await deleteItem(STORE, id);
}

export async function getMetadataCacheCount(): Promise<number> {
  return countItems(STORE);
}

export async function clearMetadataCache(): Promise<void> {
  const { clearStore } = await import("./CacheDB");
  await clearStore(STORE);
}

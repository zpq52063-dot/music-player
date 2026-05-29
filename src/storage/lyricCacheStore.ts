import { putItem, getItem, deleteItem, countItems, clearStore } from "./CacheDB";

const STORE = "lyric_cache";

interface CachedLyric {
  songId: string;
  lrcText: string;
  cachedAt: number;
}

export async function cacheLyric(songId: string, lrcText: string): Promise<void> {
  await putItem<CachedLyric>(STORE, { songId, lrcText, cachedAt: Date.now() });
}

export async function getCachedLyric(songId: string): Promise<string | undefined> {
  const entry = await getItem<CachedLyric>(STORE, songId);
  return entry?.lrcText;
}

export async function removeCachedLyric(songId: string): Promise<void> {
  await deleteItem(STORE, songId);
}

export async function getLyricCacheCount(): Promise<number> {
  return countItems(STORE);
}

export async function clearLyricCache(): Promise<void> {
  await clearStore(STORE);
}

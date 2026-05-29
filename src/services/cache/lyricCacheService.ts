import { cacheLyric, getCachedLyric, removeCachedLyric } from "@/storage";

export async function getLyric(songId: string): Promise<string | undefined> {
  return getCachedLyric(songId);
}

export async function saveLyric(songId: string, lrcText: string): Promise<void> {
  if (!lrcText) return;
  await cacheLyric(songId, lrcText);
}

export async function removeLyric(songId: string): Promise<void> {
  await removeCachedLyric(songId);
}

export async function getOrFetchLyric(
  songId: string,
  fetchFn: () => Promise<string>,
): Promise<string | undefined> {
  const cached = await getCachedLyric(songId);
  if (cached) return cached;

  try {
    const lrc = await fetchFn();
    if (lrc) await cacheLyric(songId, lrc);
    return lrc;
  } catch {
    return undefined;
  }
}

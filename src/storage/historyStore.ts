import { putItem, getAllItems, getByIndex, countItems, clearStore } from "./CacheDB";
import type { Song } from "@/types";

const STORE = "play_history_local";

interface LocalPlayRecord {
  id: number;
  songId: string;
  playedAt: number;
  songSnapshot: Song;
}

let idCounter: number | null = null;

async function getNextId(): Promise<number> {
  if (idCounter === null) {
    const all = await getAllItems<LocalPlayRecord>(STORE);
    idCounter = all.length > 0 ? Math.max(...all.map((r) => r.id)) + 1 : 1;
  }
  return idCounter++;
}

export async function recordLocalPlay(song: Song): Promise<void> {
  const id = await getNextId();
  await putItem<LocalPlayRecord>(STORE, {
    id,
    songId: song.id,
    playedAt: Date.now(),
    songSnapshot: song,
  });
}

export async function getLocalPlayHistory(limit = 50): Promise<LocalPlayRecord[]> {
  const all = await getAllItems<LocalPlayRecord>(STORE);
  return all
    .sort((a, b) => b.playedAt - a.playedAt)
    .slice(0, limit);
}

export async function getLocalPlaysForSong(songId: string): Promise<LocalPlayRecord[]> {
  return getByIndex<LocalPlayRecord>(STORE, "songId", songId);
}

export async function getLocalHistoryCount(): Promise<number> {
  return countItems(STORE);
}

export async function clearLocalHistory(): Promise<void> {
  idCounter = 1;
  await clearStore(STORE);
}

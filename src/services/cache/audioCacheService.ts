import { cacheSongMetadata, getCachedSong } from "@/storage";
import type { Song } from "@/types";

// ==================== Types ====================

interface PreloadTask {
  song: Song;
  priority: number;
  status: "pending" | "loading" | "done" | "error";
}

// ==================== State ====================

const preloadQueue: PreloadTask[] = [];
const MAX_CONCURRENT = 1;
let activeCount = 0;

// ==================== Metadata Cache ====================

export async function cacheSong(song: Song): Promise<void> {
  await cacheSongMetadata(song);
}

export async function getLocalSong(songId: string): Promise<Song | undefined> {
  return getCachedSong(songId);
}

// ==================== Audio Preloading ====================

function processQueue(): void {
  while (activeCount < MAX_CONCURRENT && preloadQueue.length > 0) {
    const task = preloadQueue.shift();
    if (!task || task.status !== "pending") continue;

    activeCount++;
    task.status = "loading";

    const audio = new Audio();
    audio.preload = "auto";
    audio.src = task.song.audio_url;

    audio.oncanplaythrough = () => {
      task.status = "done";
      activeCount--;
      audio.remove();
      processQueue();
    };

    audio.onerror = () => {
      task.status = "error";
      activeCount--;
      audio.remove();
      processQueue();
    };

    // Timeout fallback — 15s max
    setTimeout(() => {
      if (task.status === "loading") {
        task.status = "error";
        activeCount--;
        audio.remove();
        processQueue();
      }
    }, 15000);
  }
}

export function preloadAudio(song: Song, priority = 0): void {
  // Skip if already queued
  if (preloadQueue.some((t) => t.song.id === song.id)) return;

  const task: PreloadTask = { song, priority, status: "pending" };
  preloadQueue.push(task);
  preloadQueue.sort((a, b) => b.priority - a.priority);
  processQueue();
}

export function preloadQueueNext(songs: Song[], startIndex: number, count = 3): void {
  for (let i = startIndex + 1; i < Math.min(startIndex + 1 + count, songs.length); i++) {
    const song = songs[i];
    if (song) preloadAudio(song, 2);
  }
}

export function clearPreloadQueue(): void {
  preloadQueue.length = 0;
}

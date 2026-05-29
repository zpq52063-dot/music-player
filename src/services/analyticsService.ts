import type {
  AnalyticsData,
  PlayEvent,
  SongPlayCount,
  ArtistPlayCount,
  DailyPlayRecord,
} from "@/types/phase15";

const STORAGE_KEY = "music_analytics";
const MAX_EVENTS = 200;
const MAX_DAILY_DAYS = 90;

function getDefaults(): AnalyticsData {
  return {
    playEvents: [],
    songPlayCounts: {},
    artistPlayCounts: {},
    dailyPlays: {},
    currentStreak: 0,
    lastPlayDate: null,
  };
}

function today(): string {
  return new Date().toISOString().slice(0, 10);
}

function getAnalytics(): AnalyticsData {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return getDefaults();
    return JSON.parse(raw) as AnalyticsData;
  } catch {
    return getDefaults();
  }
}

function saveAnalytics(data: AnalyticsData): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch {
    // localStorage full — silently fail
  }
}

export function recordPlayEvent(
  songId: string,
  artist: string,
  playDuration: number,
  completed: boolean,
  skipped: boolean,
): void {
  const data = getAnalytics();

  const event: PlayEvent = {
    songId,
    timestamp: Date.now(),
    playDuration,
    completed,
    skipped,
  };

  data.playEvents.unshift(event);
  if (data.playEvents.length > MAX_EVENTS) {
    data.playEvents = data.playEvents.slice(0, MAX_EVENTS);
  }

  // Song counts
  const songEntry = data.songPlayCounts[songId];
  if (songEntry) {
    songEntry.playCount++;
    songEntry.totalDuration += playDuration;
    songEntry.lastPlayedAt = Date.now();
  } else {
    data.songPlayCounts[songId] = {
      songId,
      playCount: 1,
      totalDuration: playDuration,
      lastPlayedAt: Date.now(),
    };
  }

  // Artist counts
  if (artist) {
    const artistEntry = data.artistPlayCounts[artist];
    if (artistEntry) {
      artistEntry.playCount++;
      artistEntry.totalDuration += playDuration;
    } else {
      data.artistPlayCounts[artist] = {
        artist,
        playCount: 1,
        totalDuration: playDuration,
      };
    }
  }

  // Daily plays
  const d = today();
  const dailyEntry = data.dailyPlays[d];
  if (dailyEntry) {
    dailyEntry.totalSeconds += playDuration;
    if (!dailyEntry.songIds.includes(songId)) {
      dailyEntry.songIds.push(songId);
    }
  } else {
    data.dailyPlays[d] = {
      date: d,
      totalSeconds: playDuration,
      songIds: [songId],
    };
  }

  // Streak
  if (data.lastPlayDate !== d) {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toISOString().slice(0, 10);

    if (data.lastPlayDate === yesterdayStr) {
      data.currentStreak++;
    } else if (data.lastPlayDate !== d) {
      data.currentStreak = 1;
    }
    data.lastPlayDate = d;
  }

  // Prune old daily records
  const keys = Object.keys(data.dailyPlays);
  if (keys.length > MAX_DAILY_DAYS) {
    keys.sort();
    const toRemove = keys.slice(0, keys.length - MAX_DAILY_DAYS);
    for (const k of toRemove) {
      delete data.dailyPlays[k];
    }
  }

  saveAnalytics(data);
}

export function getTopSongs(limit: number): SongPlayCount[] {
  const data = getAnalytics();
  return Object.values(data.songPlayCounts)
    .sort((a, b) => b.playCount - a.playCount)
    .slice(0, limit);
}

export function getTopArtists(limit: number): ArtistPlayCount[] {
  const data = getAnalytics();
  return Object.values(data.artistPlayCounts)
    .sort((a, b) => b.playCount - a.playCount)
    .slice(0, limit);
}

export function getWeeklyPlayTime(): DailyPlayRecord[] {
  const data = getAnalytics();
  const result: DailyPlayRecord[] = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const key = d.toISOString().slice(0, 10);
    result.push(data.dailyPlays[key] ?? { date: key, totalSeconds: 0, songIds: [] });
  }
  return result;
}

export function getStreak(): number {
  const data = getAnalytics();
  return data.currentStreak;
}

export function getAllTimeMinutes(): number {
  const data = getAnalytics();
  return Math.floor(
    Object.values(data.dailyPlays).reduce((sum, d) => sum + d.totalSeconds, 0) / 60,
  );
}

export function getTotalPlays(): number {
  const data = getAnalytics();
  return data.playEvents.length;
}

export function getCompletionRate(): number {
  const data = getAnalytics();
  if (data.playEvents.length === 0) return 0;
  const completed = data.playEvents.filter((e) => e.completed).length;
  return Math.round((completed / data.playEvents.length) * 100);
}

export function getSkipRate(): number {
  const data = getAnalytics();
  if (data.playEvents.length === 0) return 0;
  const skipped = data.playEvents.filter((e) => e.skipped).length;
  return Math.round((skipped / data.playEvents.length) * 100);
}

export function getRawAnalytics(): AnalyticsData {
  return getAnalytics();
}

export function clearAnalytics(): void {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    // silently fail
  }
}

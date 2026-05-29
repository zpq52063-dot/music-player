import { getRawAnalytics } from "./analyticsService";

function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function pickItem<T>(arr: T[]): T {
  return arr[randomInt(0, arr.length - 1)]!;
}

const MOCK_ARTISTS = [
  "周杰伦", "邓紫棋", "薛之谦", "陈奕迅", "赵雷",
  "Ed Sheeran", "Adele", "Beyond", "李荣浩", "朴树",
];

const MOCK_SONG_IDS = [
  "s001", "s002", "s003", "s005", "s007",
  "s009", "s013", "s014", "s016", "s026",
  "s027", "s030", "s031", "s023", "s015",
  "s010", "s006", "s012", "s024", "s028",
];

/**
 * Seed mock analytics data if none exists.
 * Creates 14 days of realistic play history.
 */
export function seedAnalyticsIfEmpty(): void {
  const existing = getRawAnalytics();
  if (existing.playEvents.length > 0) return;

  const events: Array<{
    songId: string;
    timestamp: number;
    playDuration: number;
    completed: boolean;
    skipped: boolean;
  }> = [];

  for (let dayOffset = 13; dayOffset >= 0; dayOffset--) {
    const dayStart = new Date();
    dayStart.setDate(dayStart.getDate() - dayOffset);
    dayStart.setHours(0, 0, 0, 0);

    const playsToday = randomInt(4, 14);
    for (let i = 0; i < playsToday; i++) {
      const songId = pickItem(MOCK_SONG_IDS);
      const hour = randomInt(8, 23);
      const minute = randomInt(0, 59);
      const ts = dayStart.getTime() + hour * 3600000 + minute * 60000;
      const playDuration = randomInt(60, 280);
      const completed = Math.random() > 0.4;
      const skipped = !completed && Math.random() > 0.5;

      events.push({ songId, timestamp: ts, playDuration, completed, skipped });
    }
  }

  events.sort((a, b) => a.timestamp - b.timestamp);

  const songPlayCounts: Record<string, { songId: string; playCount: number; totalDuration: number; lastPlayedAt: number }> = {};
  const artistPlayCounts: Record<string, { artist: string; playCount: number; totalDuration: number }> = {};
  const dailyPlays: Record<string, { date: string; totalSeconds: number; songIds: string[] }> = {};

  for (const evt of events) {
    if (!songPlayCounts[evt.songId]) {
      songPlayCounts[evt.songId] = { songId: evt.songId, playCount: 0, totalDuration: 0, lastPlayedAt: 0 };
    }
    const sc = songPlayCounts[evt.songId];
    if (sc) {
      sc.playCount++;
      sc.totalDuration += evt.playDuration;
      sc.lastPlayedAt = Math.max(sc.lastPlayedAt, evt.timestamp);
    }

    const artist = pickItem(MOCK_ARTISTS);
    if (!artistPlayCounts[artist]) {
      artistPlayCounts[artist] = { artist, playCount: 0, totalDuration: 0 };
    }
    const ac = artistPlayCounts[artist];
    if (ac) {
      ac.playCount++;
      ac.totalDuration += evt.playDuration;
    }

    const date = new Date(evt.timestamp).toISOString().slice(0, 10);
    if (!dailyPlays[date]) {
      dailyPlays[date] = { date, totalSeconds: 0, songIds: [] };
    }
    const dp = dailyPlays[date];
    if (dp) {
      dp.totalSeconds += evt.playDuration;
      if (!dp.songIds.includes(evt.songId)) {
        dp.songIds.push(evt.songId);
      }
    }
  }

  const todayStr = new Date().toISOString().slice(0, 10);
  const data = {
    playEvents: events.slice(-200),
    songPlayCounts,
    artistPlayCounts,
    dailyPlays,
    currentStreak: randomInt(3, 14),
    lastPlayDate: todayStr,
  };

  try {
    localStorage.setItem("music_analytics", JSON.stringify(data));
    console.log("[AnalyticsSeed] Seeded mock analytics data:", events.length, "events");
  } catch {
    // silently fail
  }
}

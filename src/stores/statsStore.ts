import { create } from "zustand";
import {
  getTopSongs,
  getTopArtists,
  getWeeklyPlayTime,
  getStreak,
  getAllTimeMinutes,
} from "@/services/analyticsService";

interface StatsStore {
  weeklyPlayTime: number;
  topSongIds: string[];
  topArtists: string[];
  streak: number;
  totalListenedMinutes: number;

  refresh: () => void;
}

export const useStatsStore = create<StatsStore>((set) => ({
  weeklyPlayTime: 0,
  topSongIds: [],
  topArtists: [],
  streak: 0,
  totalListenedMinutes: 0,

  refresh: () => {
    const weekly = getWeeklyPlayTime();
    set({
      weeklyPlayTime: weekly.reduce((sum, d) => sum + d.totalSeconds, 0),
      topSongIds: getTopSongs(10).map((s) => s.songId),
      topArtists: getTopArtists(10).map((a) => a.artist),
      streak: getStreak(),
      totalListenedMinutes: getAllTimeMinutes(),
    });
  },
}));

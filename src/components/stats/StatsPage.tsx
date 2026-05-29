"use client";

import { StreakCard } from "./StreakCard";
import { WeeklyPlayTimeChart } from "./WeeklyPlayTimeChart";
import { TopSongsRanking } from "./TopSongsRanking";
import { TopArtistsRanking } from "./TopArtistsRanking";
import { AllTimeSummary } from "./AllTimeSummary";

export function StatsPage() {
  return (
    <div className="animate-fade-in space-y-6 px-4 pb-36 pt-8">
      <h1 className="text-2xl font-bold text-text-primary">听歌统计</h1>
      <StreakCard />
      <WeeklyPlayTimeChart />
      <TopSongsRanking />
      <TopArtistsRanking />
      <AllTimeSummary />
    </div>
  );
}

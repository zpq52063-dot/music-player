"use client";

import { SearchBar } from "./SearchBar";
import { RecommendSection } from "./RecommendSection";
import { HotSongsSection } from "./HotSongsSection";
import { RecentPlaysSection } from "./RecentPlaysSection";
import { ResumeBanner } from "@/components/recovery/ResumeBanner";
import { ForYouEntryCard } from "./ForYouEntryCard";
import { StatsEntryCard } from "./StatsEntryCard";

export function HomePage() {
  return (
    <div className="animate-fade-in space-y-8 px-4 pb-44 pt-6">
      {/* 恢复提示 */}
      <ResumeBanner />

      {/* 入口卡片 */}
      <div className="space-y-3">
        <ForYouEntryCard />
        <StatsEntryCard />
      </div>

      {/* 搜索栏 */}
      <SearchBar />

      {/* 推荐歌单 */}
      <RecommendSection />

      {/* 热门歌曲 */}
      <HotSongsSection />

      {/* 最近播放 */}
      <RecentPlaysSection />
    </div>
  );
}

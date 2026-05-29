"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { IconChartBar } from "@tabler/icons-react";
import { getStreak, getAllTimeMinutes } from "@/services/analyticsService";

export function StatsEntryCard() {
  const router = useRouter();
  const [streak, setStreak] = useState(0);
  const [hours, setHours] = useState(0);

  useEffect(() => {
    setStreak(getStreak());
    setHours(Math.floor(getAllTimeMinutes() / 60));
  }, []);

  return (
    <button
      onClick={() => router.push("/stats")}
      className="w-full rounded-apple-xl glass-heavy p-4 text-left transition-all active:scale-[0.98]"
    >
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-accent-primary/20">
          <IconChartBar size={20} className="text-accent-primary" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-base font-semibold text-text-primary">听歌统计</p>
          <p className="text-xs text-text-secondary">
            连续 {streak} 天 · 总计 {hours} 小时
          </p>
        </div>
      </div>
    </button>
  );
}

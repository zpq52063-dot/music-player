"use client";

import { useEffect, useState } from "react";
import { getAllTimeMinutes, getTotalPlays, getStreak } from "@/services/analyticsService";

export function AllTimeSummary() {
  const [totalMinutes, setTotalMinutes] = useState(0);
  const [totalPlays, setTotalPlays] = useState(0);
  const [streak, setStreak] = useState(0);

  useEffect(() => {
    setTotalMinutes(getAllTimeMinutes());
    setTotalPlays(getTotalPlays());
    setStreak(getStreak());
  }, []);

  const hours = Math.floor(totalMinutes / 60);

  return (
    <section>
      <h2 className="mb-3 px-1 text-lg font-semibold text-text-primary">总计</h2>
      <div className="grid grid-cols-3 gap-3">
        <div className="rounded-apple-xl glass-heavy p-3 text-center">
          <p className="text-xl font-bold text-text-primary">{hours}</p>
          <p className="text-xs text-text-secondary">总小时</p>
        </div>
        <div className="rounded-apple-xl glass-heavy p-3 text-center">
          <p className="text-xl font-bold text-text-primary">{totalPlays}</p>
          <p className="text-xs text-text-secondary">总播放</p>
        </div>
        <div className="rounded-apple-xl glass-heavy p-3 text-center">
          <p className="text-xl font-bold text-text-primary">{streak}</p>
          <p className="text-xs text-text-secondary">最长连续</p>
        </div>
      </div>
    </section>
  );
}

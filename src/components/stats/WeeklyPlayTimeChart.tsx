"use client";

import { useEffect, useState } from "react";
import { getWeeklyPlayTime } from "@/services/analyticsService";
import type { DailyPlayRecord } from "@/types/phase15";
import { formatTime } from "@/lib/utils";

const DAY_LABELS = ["一", "二", "三", "四", "五", "六", "日"];

export function WeeklyPlayTimeChart() {
  const [days, setDays] = useState<DailyPlayRecord[]>([]);

  useEffect(() => {
    setDays(getWeeklyPlayTime());
  }, []);

  const maxSeconds = Math.max(...days.map((d) => d.totalSeconds), 60);

  return (
    <section>
      <h2 className="mb-3 px-1 text-lg font-semibold text-text-primary">本周播放时长</h2>
      <div className="rounded-apple-xl glass-heavy p-4">
        <div className="flex items-end justify-between gap-1 h-28">
          {days.map((day, i) => {
            const heightPct = Math.max((day.totalSeconds / maxSeconds) * 100, 4);
            return (
              <div key={day.date} className="flex flex-1 flex-col items-center gap-1.5">
                <span className="text-[10px] text-text-tertiary tabular-nums">
                  {day.totalSeconds > 0 ? formatTime(day.totalSeconds) : ""}
                </span>
                <div className="w-full flex-1 flex items-end">
                  <div
                    className="w-full rounded-t-sm transition-all duration-500"
                    style={{
                      height: `${heightPct}%`,
                      backgroundColor: day.totalSeconds > 0 ? "#ff2d55" : "#ffffff10",
                      opacity: day.totalSeconds > 0 ? 0.3 + (heightPct / 100) * 0.7 : 1,
                    }}
                  />
                </div>
                <span className="text-[10px] text-text-tertiary">{DAY_LABELS[i]}</span>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

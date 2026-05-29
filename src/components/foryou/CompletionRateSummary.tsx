"use client";

import { useEffect, useState } from "react";
import { getCompletionRate, getSkipRate } from "@/services/analyticsService";

export function CompletionRateSummary() {
  const [completionRate, setCompletionRate] = useState(0);
  const [skipRate, setSkipRate] = useState(0);

  useEffect(() => {
    setCompletionRate(getCompletionRate());
    setSkipRate(getSkipRate());
  }, []);

  return (
    <section>
      <h2 className="mb-3 px-1 text-lg font-semibold text-text-primary">播放习惯</h2>
      <div className="flex gap-3">
        <div className="flex-1 rounded-apple-xl glass-heavy p-4 text-center">
          <div className="relative mx-auto mb-2 h-16 w-16">
            <svg className="h-full w-full -rotate-90" viewBox="0 0 100 100">
              <circle cx="50" cy="50" r="44" fill="none" stroke="currentColor" strokeWidth="6" className="text-white/10" />
              <circle
                cx="50" cy="50" r="44" fill="none" stroke="currentColor" strokeWidth="6" strokeLinecap="round"
                className="text-green-400"
                strokeDasharray={`${2 * Math.PI * 44}`}
                strokeDashoffset={`${2 * Math.PI * 44 * (1 - completionRate / 100)}`}
              />
            </svg>
            <span className="absolute inset-0 flex items-center justify-center text-sm font-bold text-green-400">
              {completionRate}%
            </span>
          </div>
          <p className="text-xs text-text-secondary">完整播放率</p>
        </div>

        <div className="flex-1 rounded-apple-xl glass-heavy p-4 text-center">
          <div className="relative mx-auto mb-2 h-16 w-16">
            <svg className="h-full w-full -rotate-90" viewBox="0 0 100 100">
              <circle cx="50" cy="50" r="44" fill="none" stroke="currentColor" strokeWidth="6" className="text-white/10" />
              <circle
                cx="50" cy="50" r="44" fill="none" stroke="currentColor" strokeWidth="6" strokeLinecap="round"
                className="text-orange-400"
                strokeDasharray={`${2 * Math.PI * 44}`}
                strokeDashoffset={`${2 * Math.PI * 44 * (1 - skipRate / 100)}`}
              />
            </svg>
            <span className="absolute inset-0 flex items-center justify-center text-sm font-bold text-orange-400">
              {skipRate}%
            </span>
          </div>
          <p className="text-xs text-text-secondary">跳过率</p>
        </div>
      </div>
    </section>
  );
}

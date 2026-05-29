"use client";

import { useEffect, useState } from "react";
import { IconFlame } from "@tabler/icons-react";
import { getStreak } from "@/services/analyticsService";

export function StreakCard() {
  const [streak, setStreak] = useState(0);

  useEffect(() => {
    setStreak(getStreak());
  }, []);

  return (
    <div className="rounded-apple-xl p-5 text-center" style={{
      background: "linear-gradient(135deg, #ff2d55 0%, #ff6b35 100%)",
    }}>
      <div className="flex items-center justify-center gap-2 mb-1">
        <IconFlame size={28} className="text-white" fill="white" />
        <span className="text-3xl font-bold text-white">{streak}</span>
      </div>
      <p className="text-sm text-white/80">连续听歌天数</p>
    </div>
  );
}

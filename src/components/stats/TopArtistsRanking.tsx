"use client";

import { useEffect, useState } from "react";
import { getTopArtists } from "@/services/analyticsService";
import type { ArtistPlayCount } from "@/types/phase15";
import { formatTime } from "@/lib/utils";

const COLORS = [
  "bg-red-500/20 text-red-400",
  "bg-orange-500/20 text-orange-400",
  "bg-yellow-500/20 text-yellow-400",
  "bg-green-500/20 text-green-400",
  "bg-blue-500/20 text-blue-400",
  "bg-purple-500/20 text-purple-400",
  "bg-pink-500/20 text-pink-400",
  "bg-cyan-500/20 text-cyan-400",
];

function artistInitial(a: string): string {
  return a.charAt(0).toUpperCase();
}

export function TopArtistsRanking() {
  const [artists, setArtists] = useState<ArtistPlayCount[]>([]);

  useEffect(() => {
    setArtists(getTopArtists(10));
  }, []);

  if (artists.length === 0) return null;

  return (
    <section>
      <h2 className="mb-3 px-1 text-lg font-semibold text-text-primary">最爱艺人</h2>
      <div className="space-y-2">
        {artists.map((a, i) => (
          <div key={a.artist} className="flex items-center gap-3">
            <span className={`w-6 text-center text-sm font-bold tabular-nums ${
              i < 3 ? "text-accent-primary" : "text-text-tertiary"
            }`}>
              {i + 1}
            </span>
            <div className={`flex h-10 w-10 items-center justify-center rounded-full text-sm font-bold ${COLORS[i % COLORS.length]}`}>
              {artistInitial(a.artist)}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium text-text-primary truncate">{a.artist}</p>
              <p className="text-xs text-text-secondary">{a.playCount}次播放</p>
            </div>
            <span className="text-xs text-text-tertiary">
              {formatTime(a.totalDuration)}
            </span>
          </div>
        ))}
      </div>
    </section>
  );
}

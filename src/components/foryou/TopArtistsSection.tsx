"use client";

import { useEffect, useState } from "react";
import { getTopArtists } from "@/services/analyticsService";
import type { ArtistPlayCount } from "@/types/phase15";

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

function artistInitial(artist: string): string {
  return artist.charAt(0).toUpperCase();
}

export function TopArtistsSection() {
  const [artists, setArtists] = useState<ArtistPlayCount[]>([]);

  useEffect(() => {
    setArtists(getTopArtists(8));
  }, []);

  if (artists.length === 0) return null;

  return (
    <section>
      <h2 className="mb-3 px-1 text-lg font-semibold text-text-primary">常听艺人</h2>
      <div className="flex gap-3 overflow-x-auto px-1 pb-1 -mx-1 scrollbar-hide snap-x">
        {artists.map((a, i) => (
          <div key={a.artist} className="flex flex-col items-center gap-1.5 shrink-0 snap-start">
            <div
              className={`flex h-14 w-14 items-center justify-center rounded-full text-lg font-bold ${COLORS[i % COLORS.length]}`}
            >
              {artistInitial(a.artist)}
            </div>
            <p className="text-xs text-text-secondary max-w-[60px] text-center truncate">
              {a.artist}
            </p>
          </div>
        ))}
      </div>
    </section>
  );
}

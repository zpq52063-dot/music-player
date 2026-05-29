import { SongRow } from "./SongRow";
import type { SongWithMeta } from "@/types";

// Phase 1: 临时 mock 数据
const mockRecent: SongWithMeta[] = [
  { id: "2", title: "起风了", artist: "买辣椒也用券", album: "起风了", cover_url: "", audio_url: "", duration: 305, genre: "流行", release_year: 2018, play_count: 0, created_at: "" },
  { id: "5", title: "光年之外", artist: "邓紫棋", album: "光年之外", cover_url: "", audio_url: "", duration: 235, genre: "流行", release_year: 2016, play_count: 0, created_at: "", isLiked: true },
  { id: "8", title: "海阔天空", artist: "Beyond", album: "乐与怒", cover_url: "", audio_url: "", duration: 324, genre: "摇滚", release_year: 1993, play_count: 0, created_at: "" },
];

export function RecentPlaysSection() {
  return (
    <section>
      <h2 className="mb-2 px-1 text-lg font-semibold">最近播放</h2>
      <div>
        {mockRecent.map((song, i) => (
          <SongRow key={song.id} song={song} index={i} />
        ))}
      </div>
    </section>
  );
}

import { SongRow } from "./SongRow";
import type { SongWithMeta } from "@/types";

// Phase 1: 临时 mock 歌曲数据
const mockHotSongs: SongWithMeta[] = [
  { id: "1", title: "晴天", artist: "周杰伦", album: "叶惠美", cover_url: "", audio_url: "", duration: 269, genre: "流行", release_year: 2003, play_count: 0, created_at: "" },
  { id: "2", title: "起风了", artist: "买辣椒也用券", album: "起风了", cover_url: "", audio_url: "", duration: 305, genre: "流行", release_year: 2018, play_count: 0, created_at: "" },
  { id: "3", title: "Shape of You", artist: "Ed Sheeran", album: "÷", cover_url: "", audio_url: "", duration: 234, genre: "流行", release_year: 2017, play_count: 0, created_at: "" },
  { id: "4", title: "Lemon", artist: "米津玄師", album: "Lemon", cover_url: "", audio_url: "", duration: 256, genre: "J-Pop", release_year: 2018, play_count: 0, created_at: "" },
  { id: "5", title: "光年之外", artist: "邓紫棋", album: "光年之外", cover_url: "", audio_url: "", duration: 235, genre: "流行", release_year: 2016, play_count: 0, created_at: "", isLiked: true },
  { id: "6", title: "Faded", artist: "Alan Walker", album: "Faded", cover_url: "", audio_url: "", duration: 212, genre: "电子", release_year: 2015, play_count: 0, created_at: "" },
  { id: "7", title: "夜曲", artist: "周杰伦", album: "十一月的萧邦", cover_url: "", audio_url: "", duration: 226, genre: "流行", release_year: 2005, play_count: 0, created_at: "" },
  { id: "8", title: "海阔天空", artist: "Beyond", album: "乐与怒", cover_url: "", audio_url: "", duration: 324, genre: "摇滚", release_year: 1993, play_count: 0, created_at: "" },
];

export function HotSongsSection() {
  return (
    <section>
      <h2 className="mb-2 px-1 text-lg font-semibold">热门歌曲</h2>
      <div>
        {mockHotSongs.map((song, i) => (
          <SongRow key={song.id} song={song} index={i} />
        ))}
      </div>
    </section>
  );
}

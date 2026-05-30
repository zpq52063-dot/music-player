import { SongRow } from "./SongRow";
import { mockSongs } from "@/music-source/providers/mock/data";
import type { SongWithMeta } from "@/types";

/** 从统一 mock 数据源筛选有 audio_url 的热门歌曲（首页 & 搜索页共享数据源） */
const hotSongs: SongWithMeta[] = mockSongs
  .filter((song) => Boolean(song.audio_url))
  .slice(0, 8)
  .map((song) => ({ ...song, isLiked: false }));

export function HotSongsSection() {
  return (
    <section>
      <h2 className="mb-2 px-1 text-lg font-semibold">热门歌曲</h2>
      <div>
        {hotSongs.map((song, i) => (
          <SongRow key={song.id} song={song} index={i} />
        ))}
      </div>
    </section>
  );
}

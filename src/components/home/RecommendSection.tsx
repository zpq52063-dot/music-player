import { GlassCard } from "@/components/ui/GlassCard";
import type { Playlist } from "@/types";

// Phase 1: 临时 mock 数据
const mockPlaylists: Playlist[] = [
  { id: "1", name: "今日推荐", description: "", cover_url: "", user_id: "", is_public: true, created_at: "", updated_at: "" },
  { id: "2", name: "流行热歌", description: "", cover_url: "", user_id: "", is_public: true, created_at: "", updated_at: "" },
  { id: "3", name: "轻音乐", description: "", cover_url: "", user_id: "", is_public: true, created_at: "", updated_at: "" },
  { id: "4", name: "电子节拍", description: "", cover_url: "", user_id: "", is_public: true, created_at: "", updated_at: "" },
  { id: "5", name: "经典老歌", description: "", cover_url: "", user_id: "", is_public: true, created_at: "", updated_at: "" },
  { id: "6", name: "睡眠助手", description: "", cover_url: "", user_id: "", is_public: true, created_at: "", updated_at: "" },
];

export function RecommendSection() {
  return (
    <section>
      <h2 className="mb-3 px-1 text-lg font-semibold">推荐歌单</h2>
      <div className="grid grid-cols-2 gap-3">
        {mockPlaylists.map((pl) => (
          <GlassCard key={pl.id} interactive padding="none" className="overflow-hidden">
            <div className="aspect-square w-full bg-gradient-to-br from-accent-primary/30 via-accent-secondary/20 to-accent-tertiary/30" />
            <div className="p-3">
              <p className="text-truncate text-sm font-medium">{pl.name}</p>
            </div>
          </GlassCard>
        ))}
      </div>
    </section>
  );
}

import { safeCreateClient } from "@/lib/supabase/client";
import { localRecentPlays } from "@/services/localStorageDB";
import type { Song } from "@/types";

export const recentPlayedService = {
  async recordPlay(userId: string, songId: string): Promise<void> {
    const supabase = safeCreateClient();
    if (!supabase) { localRecentPlays.record(userId, songId); return; }

    const { error } = await supabase.from("recently_played").upsert(
      { user_id: userId, song_id: songId, played_at: new Date().toISOString() },
      { onConflict: "user_id,song_id" },
    );
    if (error) console.error("Failed to record play:", error);
  },

  async getRecentPlays(userId: string, limit = 30): Promise<Song[]> {
    const supabase = safeCreateClient();
    if (!supabase) return [];

    const { data, error } = await supabase
      .from("recently_played")
      .select("song_id, songs(*)")
      .eq("user_id", userId)
      .order("played_at", { ascending: false })
      .limit(limit);

    if (error) {
      console.error("Failed to fetch recent plays:", error);
      return [];
    }
    return (data as unknown as { songs: Song }[]).map((row) => row.songs).filter(Boolean);
  },

  async getRecentPlayIds(userId: string, limit = 30): Promise<string[]> {
    const supabase = safeCreateClient();
    if (!supabase) return localRecentPlays.getIds(userId, limit);

    const { data, error } = await supabase
      .from("recently_played")
      .select("song_id")
      .eq("user_id", userId)
      .order("played_at", { ascending: false })
      .limit(limit);

    if (error || !data) return [];
    return data.map((r: { song_id: string }) => r.song_id);
  },
};

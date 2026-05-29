import { safeCreateClient } from "@/lib/supabase/client";
import type { Song } from "@/types";

export const songService = {
  async getHotSongs(limit = 20): Promise<Song[]> {
    const supabase = safeCreateClient();
    if (!supabase) return [];

    const { data, error } = await supabase
      .from("songs")
      .select("*")
      .order("play_count", { ascending: false })
      .limit(limit);

    if (error) {
      console.error("Failed to fetch hot songs:", error);
      return [];
    }
    return data as Song[];
  },

  async getSongById(id: string): Promise<Song | null> {
    const supabase = safeCreateClient();
    if (!supabase) return null;

    const { data, error } = await supabase
      .from("songs")
      .select("*")
      .eq("id", id)
      .single();

    if (error) return null;
    return data as Song;
  },

  async recordPlay(songId: string) {
    const supabase = safeCreateClient();
    if (!supabase) return;

    const { data: user } = await supabase.auth.getUser();
    if (!user.user) return;

    await supabase.from("play_history").insert({
      user_id: user.user.id,
      song_id: songId,
    });
  },

  async toggleLike(songId: string, isLiked: boolean) {
    const supabase = safeCreateClient();
    if (!supabase) return;

    const { data: user } = await supabase.auth.getUser();
    if (!user.user) return;

    if (isLiked) {
      await supabase.from("liked_songs").delete().eq("user_id", user.user.id).eq("song_id", songId);
    } else {
      await supabase.from("liked_songs").insert({ user_id: user.user.id, song_id: songId });
    }
  },
};

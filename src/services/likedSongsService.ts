import { safeCreateClient } from "@/lib/supabase/client";
import { localLikedSongs } from "@/services/localStorageDB";
import type { Song } from "@/types";

export const likedSongsService = {
  async getLikedSongs(userId: string): Promise<Song[]> {
    const supabase = safeCreateClient();
    if (!supabase) return [];

    const { data, error } = await supabase
      .from("liked_songs")
      .select("song_id, songs(*)")
      .eq("user_id", userId)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Failed to fetch liked songs:", error);
      return [];
    }
    return (data as unknown as { songs: Song }[]).map((row) => row.songs);
  },

  async getLikedSongIds(userId: string): Promise<Set<string>> {
    const supabase = safeCreateClient();
    if (!supabase) return new Set(localLikedSongs.getIds(userId));

    const { data, error } = await supabase
      .from("liked_songs")
      .select("song_id")
      .eq("user_id", userId);

    if (error || !data) return new Set();
    return new Set(data.map((r: { song_id: string }) => r.song_id));
  },

  async toggleLike(userId: string, songId: string, isLiked: boolean): Promise<boolean> {
    const supabase = safeCreateClient();
    if (!supabase) {
      if (isLiked) { localLikedSongs.remove(userId, songId); return false; }
      else { localLikedSongs.add(userId, songId); return true; }
    }

    if (isLiked) {
      const { error } = await supabase
        .from("liked_songs")
        .delete()
        .eq("user_id", userId)
        .eq("song_id", songId);
      if (error) throw error;
      return false;
    } else {
      const { error } = await supabase
        .from("liked_songs")
        .insert({ user_id: userId, song_id: songId });
      if (error) throw error;
      return true;
    }
  },

  async isLiked(userId: string, songId: string): Promise<boolean> {
    const supabase = safeCreateClient();
    if (!supabase) return localLikedSongs.isLiked(userId, songId);

    const { data } = await supabase
      .from("liked_songs")
      .select("id")
      .eq("user_id", userId)
      .eq("song_id", songId)
      .maybeSingle();
    return !!data;
  },
};

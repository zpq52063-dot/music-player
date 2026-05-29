import { safeCreateClient } from "@/lib/supabase/client";
import { localPlaylists, localFavoritePlaylists } from "@/services/localStorageDB";
import type { Song, UserPlaylist, PlaylistWithSongsDetail } from "@/types";

export const playlistService = {
  async getUserPlaylists(userId: string): Promise<UserPlaylist[]> {
    const supabase = safeCreateClient();
    if (!supabase) return localPlaylists.getAll(userId);

    const { data, error } = await supabase
      .from("playlists")
      .select("id, user_id, name as title, cover_url as cover, description, created_at")
      .eq("user_id", userId)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Failed to fetch playlists:", error);
      return [];
    }
    const playlists = data as unknown as UserPlaylist[];
    for (const pl of playlists) {
      const { count } = await supabase
        .from("playlist_songs")
        .select("*", { count: "exact", head: true })
        .eq("playlist_id", pl.id);
      pl.song_count = count ?? 0;
    }
    return playlists;
  },

  async getPlaylistDetail(playlistId: string): Promise<PlaylistWithSongsDetail | null> {
    const supabase = safeCreateClient();
    if (!supabase) return localPlaylists.getDetail(playlistId);

    const { data: playlist, error } = await supabase
      .from("playlists")
      .select("id, user_id, name as title, cover_url as cover, description, created_at")
      .eq("id", playlistId)
      .single();

    if (error || !playlist) return null;

    const { data: psRows } = await supabase
      .from("playlist_songs")
      .select("song_id, songs(*)")
      .eq("playlist_id", playlistId)
      .order("position", { ascending: true });

    const songs: Song[] = (psRows as unknown as { songs: Song }[])?.map((r) => r.songs) ?? [];

    return {
      ...(playlist as unknown as UserPlaylist),
      songs,
    };
  },

  async createPlaylist(
    userId: string,
    title: string,
    description = "",
    cover = "",
  ): Promise<UserPlaylist> {
    const supabase = safeCreateClient();
    if (!supabase) return localPlaylists.create(userId, title, description, cover);

    const { data, error } = await supabase
      .from("playlists")
      .insert({ user_id: userId, name: title, description, cover_url: cover, is_public: true })
      .select("id, user_id, name as title, cover_url as cover, description, created_at")
      .single();

    if (error) throw error;
    return { ...(data as unknown as UserPlaylist), song_count: 0 };
  },

  async deletePlaylist(playlistId: string): Promise<void> {
    const supabase = safeCreateClient();
    if (!supabase) {
      const detail = localPlaylists.getDetail(playlistId);
      if (detail) localPlaylists.delete(detail.user_id, playlistId);
      return;
    }

    const { error } = await supabase.from("playlists").delete().eq("id", playlistId);
    if (error) throw error;
  },

  async addSong(playlistId: string, songId: string, song?: Song): Promise<void> {
    const supabase = safeCreateClient();
    if (!supabase) {
      const detail = localPlaylists.getDetail(playlistId);
      if (detail && song) localPlaylists.addSong(detail.user_id, playlistId, song);
      return;
    }

    const { data: lastItem } = await supabase
      .from("playlist_songs")
      .select("position")
      .eq("playlist_id", playlistId)
      .order("position", { ascending: false })
      .limit(1)
      .single();

    const nextPosition = (lastItem?.position ?? -1) + 1;
    const { error } = await supabase
      .from("playlist_songs")
      .upsert(
        { playlist_id: playlistId, song_id: songId, position: nextPosition },
        { onConflict: "playlist_id,song_id" },
      );

    if (error) throw error;
  },

  async removeSong(playlistId: string, songId: string): Promise<void> {
    const supabase = safeCreateClient();
    if (!supabase) {
      const detail = localPlaylists.getDetail(playlistId);
      if (detail) localPlaylists.removeSong(detail.user_id, playlistId, songId);
      return;
    }

    const { error } = await supabase
      .from("playlist_songs")
      .delete()
      .eq("playlist_id", playlistId)
      .eq("song_id", songId);
    if (error) throw error;
  },

  async isFavorited(userId: string, playlistId: string): Promise<boolean> {
    const supabase = safeCreateClient();
    if (!supabase) return localFavoritePlaylists.isFavorited(userId, playlistId);

    const { data } = await supabase
      .from("favorite_playlists")
      .select("id")
      .eq("user_id", userId)
      .eq("playlist_id", playlistId)
      .maybeSingle();
    return !!data;
  },

  async toggleFavorite(userId: string, playlistId: string, isFavorited: boolean): Promise<boolean> {
    const supabase = safeCreateClient();
    if (!supabase) {
      if (isFavorited) { localFavoritePlaylists.remove(userId, playlistId); return false; }
      else { localFavoritePlaylists.add(userId, playlistId); return true; }
    }

    if (isFavorited) {
      const { error } = await supabase
        .from("favorite_playlists")
        .delete()
        .eq("user_id", userId)
        .eq("playlist_id", playlistId);
      if (error) throw error;
      return false;
    } else {
      const { error } = await supabase
        .from("favorite_playlists")
        .insert({ user_id: userId, playlist_id: playlistId });
      if (error) throw error;
      return true;
    }
  },

  async getFavoritePlaylists(userId: string): Promise<PlaylistWithSongsDetail[]> {
    const supabase = safeCreateClient();
    if (!supabase) {
      const ids = localFavoritePlaylists.getIds(userId);
      return ids.map((id) => localPlaylists.getDetail(id)).filter(Boolean) as PlaylistWithSongsDetail[];
    }

    const { data: favs } = await supabase
      .from("favorite_playlists")
      .select("playlist_id")
      .eq("user_id", userId);

    if (!favs?.length) return [];

    const playlistIds = favs.map((f: { playlist_id: string }) => f.playlist_id);
    const { data: playlists } = await supabase
      .from("playlists")
      .select("id, user_id, name as title, cover_url as cover, description, created_at")
      .in("id", playlistIds);

    return (playlists as unknown as PlaylistWithSongsDetail[]) ?? [];
  },
};

import type { Song } from "./song";

export interface Playlist {
  id: string;
  name: string;
  description: string;
  cover_url: string;
  user_id: string;
  is_public: boolean;
  created_at: string;
  updated_at: string;
}

export interface PlaylistWithSongs extends Playlist {
  songs: Song[];
}

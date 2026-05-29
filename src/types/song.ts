export interface Song {
  id: string;
  title: string;
  artist: string;
  album: string;
  cover_url: string;
  audio_url: string;
  duration: number;
  genre: string;
  release_year: number | null;
  play_count: number;
  created_at: string;
}

export interface SongWithMeta extends Song {
  isLiked?: boolean;
}

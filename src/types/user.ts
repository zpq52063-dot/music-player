export interface Profile {
  id: string;
  username: string;
  avatar_url: string | null;
  bio: string;
  created_at: string;
  updated_at: string;
}

export interface PlayHistory {
  id: string;
  user_id: string;
  song_id: string;
  played_at: string;
}

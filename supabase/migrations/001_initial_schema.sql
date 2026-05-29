-- Phase 1: Core tables for music player
-- Run: supabase db push or supabase migration up

-- Profiles: extends auth.users
CREATE TABLE IF NOT EXISTS profiles (
  id         UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username   TEXT UNIQUE NOT NULL,
  avatar_url TEXT,
  bio        TEXT DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Songs
CREATE TABLE IF NOT EXISTS songs (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title        TEXT NOT NULL,
  artist       TEXT NOT NULL,
  album        TEXT DEFAULT '',
  cover_url    TEXT DEFAULT '',
  audio_url    TEXT NOT NULL,
  duration     INTEGER DEFAULT 0,
  genre        TEXT DEFAULT '',
  release_year INTEGER,
  play_count   INTEGER DEFAULT 0,
  created_at   TIMESTAMPTZ DEFAULT NOW()
);

-- Playlists
CREATE TABLE IF NOT EXISTS playlists (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name        TEXT NOT NULL,
  description TEXT DEFAULT '',
  cover_url   TEXT DEFAULT '',
  user_id     UUID REFERENCES profiles(id) ON DELETE CASCADE,
  is_public   BOOLEAN DEFAULT true,
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  updated_at  TIMESTAMPTZ DEFAULT NOW()
);

-- Playlist songs junction
CREATE TABLE IF NOT EXISTS playlist_songs (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  playlist_id UUID REFERENCES playlists(id) ON DELETE CASCADE,
  song_id     UUID REFERENCES songs(id) ON DELETE CASCADE,
  position    INTEGER NOT NULL,
  added_at    TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(playlist_id, song_id)
);

-- Liked songs
CREATE TABLE IF NOT EXISTS liked_songs (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    UUID REFERENCES profiles(id) ON DELETE CASCADE,
  song_id    UUID REFERENCES songs(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, song_id)
);

-- Play history
CREATE TABLE IF NOT EXISTS play_history (
  id        UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id   UUID REFERENCES profiles(id) ON DELETE CASCADE,
  song_id   UUID REFERENCES songs(id) ON DELETE CASCADE,
  played_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_songs_play_count ON songs(play_count DESC);
CREATE INDEX IF NOT EXISTS idx_playlists_user ON playlists(user_id);
CREATE INDEX IF NOT EXISTS idx_play_history_user ON play_history(user_id, played_at DESC);
CREATE INDEX IF NOT EXISTS idx_liked_songs_user ON liked_songs(user_id);

-- Enable RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE songs ENABLE ROW LEVEL SECURITY;
ALTER TABLE playlists ENABLE ROW LEVEL SECURITY;
ALTER TABLE playlist_songs ENABLE ROW LEVEL SECURITY;
ALTER TABLE liked_songs ENABLE ROW LEVEL SECURITY;
ALTER TABLE play_history ENABLE ROW LEVEL SECURITY;

-- RLS Policies (basic)
CREATE POLICY "Public profiles" ON profiles FOR SELECT USING (true);
CREATE POLICY "Users update own profile" ON profiles FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Public songs" ON songs FOR SELECT USING (true);

CREATE POLICY "Public playlists" ON playlists FOR SELECT USING (is_public = true);
CREATE POLICY "Owner manage playlists" ON playlists FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Owner manage playlist_songs" ON playlist_songs FOR ALL
  USING (EXISTS (SELECT 1 FROM playlists WHERE id = playlist_id AND user_id = auth.uid()));

CREATE POLICY "User manage own likes" ON liked_songs FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "User manage own history" ON play_history FOR ALL USING (auth.uid() = user_id);

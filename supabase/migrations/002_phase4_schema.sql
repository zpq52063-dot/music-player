-- Phase 4: User system + Library + Playlists + Recent plays + Favorites
-- Run: supabase db push

-- ==================== Recently Played ====================
-- Deduped: one row per user per song, updated on re-play
CREATE TABLE IF NOT EXISTS recently_played (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  song_id    UUID NOT NULL,
  played_at  TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, song_id)
);

-- ==================== Favorite Playlists ====================
-- Users can favorite other users' public playlists
CREATE TABLE IF NOT EXISTS favorite_playlists (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  playlist_id UUID NOT NULL REFERENCES playlists(id) ON DELETE CASCADE,
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, playlist_id)
);

-- ==================== Indexes ====================
CREATE INDEX IF NOT EXISTS idx_recently_played_user ON recently_played(user_id, played_at DESC);
CREATE INDEX IF NOT EXISTS idx_favorite_playlists_user ON favorite_playlists(user_id);

-- ==================== RLS ====================
ALTER TABLE recently_played ENABLE ROW LEVEL SECURITY;
ALTER TABLE favorite_playlists ENABLE ROW LEVEL SECURITY;

-- ==================== RLS Policies ====================

-- Recently played: user owns their own history
CREATE POLICY "User manage own recent plays" ON recently_played
  FOR ALL USING (auth.uid() = user_id);

-- Favorite playlists: user owns their own favorites
CREATE POLICY "User manage own favorites" ON favorite_playlists
  FOR ALL USING (auth.uid() = user_id);

-- Allow reading public profiles (extends existing policy)
-- Profiles can be created via trigger on auth.users insert
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, username, avatar_url)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'username', 'user_' || substring(NEW.id::text, 1, 8)),
    NEW.raw_user_meta_data->>'avatar_url'
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop existing trigger if exists, then create
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

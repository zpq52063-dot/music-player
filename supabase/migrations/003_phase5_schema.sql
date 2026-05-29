-- Phase 5: Comments system + social interaction
-- Run: supabase db push or supabase migration up

-- Song comments
CREATE TABLE IF NOT EXISTS song_comments (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  song_id    UUID NOT NULL REFERENCES songs(id) ON DELETE CASCADE,
  user_id    UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  content    TEXT NOT NULL,
  like_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Comment likes (unique per user per comment)
CREATE TABLE IF NOT EXISTS comment_likes (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  comment_id UUID NOT NULL REFERENCES song_comments(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, comment_id)
);

-- Comment replies
CREATE TABLE IF NOT EXISTS comment_replies (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  comment_id UUID NOT NULL REFERENCES song_comments(id) ON DELETE CASCADE,
  user_id    UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  content    TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_comments_song ON song_comments(song_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_comments_song_hot ON song_comments(song_id, like_count DESC);
CREATE INDEX IF NOT EXISTS idx_comment_likes_user ON comment_likes(user_id);
CREATE INDEX IF NOT EXISTS idx_replies_comment ON comment_replies(comment_id, created_at ASC);

-- RLS
ALTER TABLE song_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE comment_likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE comment_replies ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Public read comments" ON song_comments FOR SELECT USING (true);
CREATE POLICY "Owner create comment" ON song_comments FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Owner delete comment" ON song_comments FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "Public read comment likes" ON comment_likes FOR SELECT USING (true);
CREATE POLICY "Owner manage likes" ON comment_likes FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Public read replies" ON comment_replies FOR SELECT USING (true);
CREATE POLICY "Owner create reply" ON comment_replies FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Owner delete reply" ON comment_replies FOR DELETE USING (auth.uid() = user_id);

-- RPC functions for atomic like count updates
CREATE OR REPLACE FUNCTION increment_comment_likes(comment_id UUID)
RETURNS void AS $$
BEGIN
  UPDATE song_comments SET like_count = like_count + 1 WHERE id = comment_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION decrement_comment_likes(comment_id UUID)
RETURNS void AS $$
BEGIN
  UPDATE song_comments SET like_count = GREATEST(like_count - 1, 0) WHERE id = comment_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

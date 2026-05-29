import { safeCreateClient } from "@/lib/supabase/client";

export const likeService = {
  async getLikedCommentIds(_userId: string): Promise<Set<string>> {
    const supabase = safeCreateClient();
    if (!supabase) return new Set();

    const { data, error } = await supabase
      .from("comment_likes")
      .select("comment_id")
      .eq("user_id", _userId);

    if (error || !data) return new Set();
    return new Set(data.map((r: { comment_id: string }) => r.comment_id));
  },

  async toggleLike(userId: string, commentId: string, isLiked: boolean): Promise<boolean> {
    const supabase = safeCreateClient();
    if (!supabase) return !isLiked;

    if (isLiked) {
      const { error: delErr } = await supabase
        .from("comment_likes")
        .delete()
        .eq("user_id", userId)
        .eq("comment_id", commentId);
      if (delErr) throw delErr;

      const { error: decErr } = await supabase.rpc("decrement_comment_likes", {
        comment_id: commentId,
      });
      if (decErr) console.error("Failed to decrement like count:", decErr);

      return false;
    } else {
      const { error: insErr } = await supabase
        .from("comment_likes")
        .insert({ user_id: userId, comment_id: commentId });
      if (insErr) throw insErr;

      const { error: incErr } = await supabase.rpc("increment_comment_likes", {
        comment_id: commentId,
      });
      if (incErr) console.error("Failed to increment like count:", incErr);

      return true;
    }
  },
};

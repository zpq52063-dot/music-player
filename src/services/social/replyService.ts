import { safeCreateClient } from "@/lib/supabase/client";
import type { CommentReplyWithProfile, ReplyPage } from "@/types";

const PAGE_SIZE = 10;

const EMPTY_PAGE: ReplyPage = { data: [], nextCursor: null, hasMore: false };

export const replyService = {
  async getReplies(_commentId: string, _cursor?: string): Promise<ReplyPage> {
    const supabase = safeCreateClient();
    if (!supabase) return EMPTY_PAGE;

    const limit = PAGE_SIZE;

    let query = supabase
      .from("comment_replies")
      .select("id, comment_id, user_id, content, created_at, profiles(username, avatar_url)")
      .eq("comment_id", _commentId)
      .order("created_at", { ascending: true })
      .limit(limit + 1);

    if (_cursor) {
      query = query.gt("created_at", _cursor);
    }

    const { data, error } = await query;
    if (error) {
      console.error("Failed to fetch replies:", error);
      return EMPTY_PAGE;
    }

    const rows = data as unknown as (CommentReplyWithProfile & {
      profiles: [{ username: string; avatar_url: string | null }] | null;
    })[];

    const hasMore = rows.length > limit;
    const items = (hasMore ? rows.slice(0, -1) : rows).map((row) => ({
      ...row,
      profile: row.profiles?.[0] ?? undefined,
    }));

    const last = items[items.length - 1];
    const nextCursor = hasMore && last ? last.created_at : null;

    return { data: items, nextCursor, hasMore };
  },

  async createReply(
    _userId: string,
    _commentId: string,
    _content: string,
  ): Promise<CommentReplyWithProfile | null> {
    const supabase = safeCreateClient();
    if (!supabase) return null;

    const { data, error } = await supabase
      .from("comment_replies")
      .insert({ user_id: _userId, comment_id: _commentId, content: _content })
      .select("id, comment_id, user_id, content, created_at")
      .single();

    if (error) {
      console.error("Failed to create reply:", error);
      return null;
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("username, avatar_url")
      .eq("id", _userId)
      .single();

    return {
      ...(data as unknown as CommentReplyWithProfile),
      profile: profile ?? undefined,
    };
  },

  async deleteReply(_replyId: string): Promise<boolean> {
    const supabase = safeCreateClient();
    if (!supabase) return false;

    const { error } = await supabase.from("comment_replies").delete().eq("id", _replyId);
    if (error) {
      console.error("Failed to delete reply:", error);
      return false;
    }
    return true;
  },
};

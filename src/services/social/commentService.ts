import { safeCreateClient } from "@/lib/supabase/client";
import type { CommentWithProfile, CommentPage, CommentSortType } from "@/types";

const PAGE_SIZE = 20;

const EMPTY_PAGE: CommentPage = { data: [], nextCursor: null, hasMore: false };

export const commentService = {
  async getComments(
    _songId: string,
    _sort: CommentSortType,
    _cursor?: string,
  ): Promise<CommentPage> {
    const supabase = safeCreateClient();
    if (!supabase) return EMPTY_PAGE;

    const orderCol = _sort === "hot" ? "like_count" : "created_at";
    const isAsc = false;
    const limit = PAGE_SIZE;

    let query = supabase
      .from("song_comments")
      .select("id, song_id, user_id, content, like_count, created_at, profiles(username, avatar_url)")
      .eq("song_id", _songId)
      .order(orderCol, { ascending: isAsc })
      .limit(limit + 1);

    if (_cursor) {
      if (_sort === "hot") {
        query = query.lt("like_count", Number(_cursor)).or(`like_count.eq.${_cursor},id.lt.${_cursor}`);
      } else {
        query = query.lt("created_at", _cursor);
      }
    }

    const { data, error } = await query;
    if (error) {
      console.error("Failed to fetch comments:", error);
      return EMPTY_PAGE;
    }

    const rows = data as unknown as (CommentWithProfile & {
      profiles: [{ username: string; avatar_url: string | null }] | null;
    })[];

    const hasMore = rows.length > limit;
    const items = (hasMore ? rows.slice(0, -1) : rows).map((row) => ({
      ...row,
      profile: row.profiles?.[0] ?? undefined,
    }));

    const last = items[items.length - 1];
    const nextCursor = hasMore && last
      ? (_sort === "hot" ? String(last.like_count) : last.created_at)
      : null;

    return { data: items, nextCursor, hasMore };
  },

  async createComment(
    _userId: string,
    _songId: string,
    _content: string,
  ): Promise<CommentWithProfile | null> {
    const supabase = safeCreateClient();
    if (!supabase) return null;

    const { data, error } = await supabase
      .from("song_comments")
      .insert({ user_id: _userId, song_id: _songId, content: _content })
      .select("id, song_id, user_id, content, like_count, created_at")
      .single();

    if (error) {
      console.error("Failed to create comment:", error);
      return null;
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("username, avatar_url")
      .eq("id", _userId)
      .single();

    return {
      ...(data as unknown as CommentWithProfile),
      profile: profile ?? undefined,
    };
  },

  async deleteComment(_commentId: string): Promise<boolean> {
    const supabase = safeCreateClient();
    if (!supabase) return false;

    const { error } = await supabase.from("song_comments").delete().eq("id", _commentId);
    if (error) {
      console.error("Failed to delete comment:", error);
      return false;
    }
    return true;
  },
};

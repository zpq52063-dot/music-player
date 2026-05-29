"use client";

import { useEffect, useRef, useCallback } from "react";
import { Skeleton } from "@/components/ui/Skeleton";
import { CommentCard } from "./CommentCard";
import { ReplyCard } from "./ReplyCard";
import { CommentInput } from "./CommentInput";
import { useComments } from "@/hooks/useComments";
import { useCommentLike } from "@/hooks/useCommentLike";
import { useReplies } from "@/hooks/useReplies";
import { useSocialStore } from "@/stores/socialStore";
import { useUserStore } from "@/stores/userStore";
import type { CommentSortType } from "@/types";

interface CommentListProps {
  songId: string;
}

export function CommentList({ songId }: CommentListProps) {
  const {
    comments,
    isLoading,
    isFetchingNextPage,
    hasNextPage,
    fetchNextPage,
    addComment,
    deleteComment,
    sortType,
  } = useComments(songId);

  const { setCommentSortType, setActiveReplyId, activeReplyId } = useSocialStore();
  const { isLiked, toggleLike } = useCommentLike();
  const userId = useUserStore((s) => s.user?.id);
  const { replies, addReply, deleteReply } = useReplies(activeReplyId);

  const observerRef = useRef<HTMLDivElement | null>(null);

  // Infinite scroll observer
  useEffect(() => {
    const el = observerRef.current;
    if (!el || !hasNextPage) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) {
          fetchNextPage();
        }
      },
      { threshold: 0.1 },
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [hasNextPage, fetchNextPage]);

  const handleToggleSort = useCallback(
    (sort: CommentSortType) => setCommentSortType(sort),
    [setCommentSortType],
  );

  const handleReply = useCallback(
    (commentId: string) => {
      setActiveReplyId(activeReplyId === commentId ? null : commentId);
    },
    [activeReplyId, setActiveReplyId],
  );

  if (isLoading) {
    return (
      <div className="space-y-3 px-4 py-4">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="flex gap-3">
            <Skeleton variant="circular" width={36} height={36} />
            <div className="flex-1 space-y-2">
              <Skeleton variant="text" width="30%" height={12} />
              <Skeleton variant="text" width="80%" height={14} />
              <Skeleton variant="text" width="60%" height={14} />
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="flex flex-col">
      {/* Sort tabs */}
      <div className="flex gap-4 px-4 py-3">
        <button
          onClick={() => handleToggleSort("hot")}
          className={`text-sm font-medium transition-colors ${
            sortType === "hot" ? "text-text-primary" : "text-text-tertiary"
          }`}
        >
          热门
        </button>
        <button
          onClick={() => handleToggleSort("newest")}
          className={`text-sm font-medium transition-colors ${
            sortType === "newest" ? "text-text-primary" : "text-text-tertiary"
          }`}
        >
          最新
        </button>
      </div>

      {/* Divider */}
      <div className="mx-4 h-px bg-white/5" />

      {/* Comments */}
      {comments.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16">
          <p className="text-sm text-text-tertiary">暂无评论，来抢沙发吧</p>
        </div>
      ) : (
        <div>
          {comments.map((comment) => (
            <div key={comment.id}>
              <CommentCard
                comment={comment}
                isLiked={isLiked(comment.id)}
                onToggleLike={toggleLike}
                onReply={handleReply}
                onDelete={deleteComment}
                isOwner={userId === comment.user_id}
              />

              {/* Reply section */}
              {activeReplyId === comment.id && (
                <div className="ml-12 border-l-2 border-white/5 pl-4">
                  {/* Reply list */}
                  {replies.map((reply) => (
                    <ReplyCard
                      key={reply.id}
                      reply={reply}
                      isOwner={userId === reply.user_id}
                      onDelete={deleteReply}
                    />
                  ))}

                  {/* Reply input */}
                  <div className="px-3 pb-2">
                    <CommentInput
                      placeholder="写下你的回复..."
                      onSubmit={addReply}
                      compact
                    />
                  </div>
                </div>
              )}

              <div className="mx-4 h-px bg-white/3" />
            </div>
          ))}
        </div>
      )}

      {/* Infinite scroll trigger */}
      {hasNextPage && (
        <div ref={observerRef} className="flex justify-center py-4">
          {isFetchingNextPage && (
            <div className="h-5 w-5 animate-spin rounded-full border-2 border-white/20 border-t-white" />
          )}
        </div>
      )}

      {/* Main comment input - at bottom */}
      <div className="border-t border-white/5 px-4 py-3">
        <CommentInput placeholder="写下你的评论..." onSubmit={addComment} />
      </div>
    </div>
  );
}

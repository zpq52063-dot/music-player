"use client";

import { IconHeart, IconMessageCircle, IconTrash } from "@tabler/icons-react";
import { clsx } from "clsx";
import { LazyImage } from "@/components/ui/LazyImage";
import { IconButton } from "@/components/ui/IconButton";
import type { CommentWithProfile } from "@/types";

interface CommentCardProps {
  comment: CommentWithProfile;
  isLiked: boolean;
  onToggleLike: (commentId: string) => void;
  onReply: (commentId: string) => void;
  onDelete: (commentId: string) => void;
  isOwner: boolean;
  replyCount?: number;
}

function formatRelativeTime(dateStr: string): string {
  const now = Date.now();
  const date = new Date(dateStr).getTime();
  const diff = now - date;
  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (seconds < 60) return "刚刚";
  if (minutes < 60) return `${minutes}分钟前`;
  if (hours < 24) return `${hours}小时前`;
  if (days < 7) return `${days}天前`;
  return new Date(dateStr).toLocaleDateString("zh-CN");
}

export function CommentCard({
  comment,
  isLiked,
  onToggleLike,
  onReply,
  onDelete,
  isOwner,
  replyCount = 0,
}: CommentCardProps) {
  const profile = comment.profile;

  return (
    <div className="px-4 py-3">
      <div className="flex gap-3">
        {/* Avatar */}
        <LazyImage
          src={profile?.avatar_url ?? ""}
          alt={profile?.username ?? "用户"}
          size={36}
          rounded="full"
        />

        {/* Content */}
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-text-primary">
              {profile?.username ?? "匿名用户"}
            </span>
            <span className="text-xs text-text-tertiary">
              {formatRelativeTime(comment.created_at)}
            </span>
          </div>

          <p className="mt-1 text-sm leading-relaxed text-text-primary whitespace-pre-wrap break-words">
            {comment.content}
          </p>

          {/* Actions */}
          <div className="mt-2 flex items-center gap-4">
            <button
              onClick={() => onReply(comment.id)}
              className="flex items-center gap-1 text-xs text-text-tertiary transition-colors hover:text-text-secondary"
            >
              <IconMessageCircle size={14} />
              {replyCount > 0 && <span>{replyCount}</span>}
            </button>

            <button
              onClick={() => onToggleLike(comment.id)}
              className={clsx(
                "flex items-center gap-1 text-xs transition-colors",
                isLiked ? "text-accent-primary" : "text-text-tertiary hover:text-text-secondary",
              )}
            >
              <IconHeart
                size={14}
                className={isLiked ? "fill-accent-primary" : ""}
              />
              {comment.like_count > 0 && <span>{comment.like_count}</span>}
            </button>

            {isOwner && (
              <IconButton size="sm" onClick={() => onDelete(comment.id)}>
                <IconTrash size={13} className="text-text-tertiary" />
              </IconButton>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

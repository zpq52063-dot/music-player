"use client";

import { IconTrash } from "@tabler/icons-react";
import { LazyImage } from "@/components/ui/LazyImage";
import { IconButton } from "@/components/ui/IconButton";
import type { CommentReplyWithProfile } from "@/types";

interface ReplyCardProps {
  reply: CommentReplyWithProfile;
  isOwner: boolean;
  onDelete: (replyId: string) => void;
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

export function ReplyCard({ reply, isOwner, onDelete }: ReplyCardProps) {
  const profile = reply.profile;

  return (
    <div className="px-3 py-2">
      <div className="flex gap-2">
        <LazyImage
          src={profile?.avatar_url ?? ""}
          alt={profile?.username ?? "用户"}
          size={28}
          rounded="full"
        />

        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <span className="text-xs font-medium text-text-primary">
              {profile?.username ?? "匿名用户"}
            </span>
            <span className="text-[11px] text-text-tertiary">
              {formatRelativeTime(reply.created_at)}
            </span>
          </div>

          <p className="mt-0.5 text-xs leading-relaxed text-text-secondary whitespace-pre-wrap break-words">
            {reply.content}
          </p>
        </div>

        {isOwner && (
          <IconButton size="sm" onClick={() => onDelete(reply.id)}>
            <IconTrash size={12} className="text-text-tertiary" />
          </IconButton>
        )}
      </div>
    </div>
  );
}

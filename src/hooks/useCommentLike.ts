"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useUserStore } from "@/stores/userStore";
import { likeService } from "@/services/social/likeService";
import { useCallback } from "react";

export function useCommentLike() {
  const userId = useUserStore((s) => s.user?.id);
  const queryClient = useQueryClient();

  const queryKey = ["comment-likes", userId];

  const { data: likedCommentIds } = useQuery({
    queryKey,
    queryFn: () => likeService.getLikedCommentIds(userId!),
    enabled: !!userId,
    staleTime: 60_000,
  });

  const toggleMutation = useMutation({
    mutationFn: ({ commentId, isLiked }: { commentId: string; isLiked: boolean }) =>
      likeService.toggleLike(userId!, commentId, isLiked),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey });
    },
  });

  const toggleLike = useCallback(
    (commentId: string) => {
      const isLiked = likedCommentIds?.has(commentId) ?? false;
      toggleMutation.mutate({ commentId, isLiked });
    },
    [likedCommentIds, toggleMutation],
  );

  const isLiked = useCallback(
    (commentId: string) => likedCommentIds?.has(commentId) ?? false,
    [likedCommentIds],
  );

  return {
    likedCommentIds: likedCommentIds ?? new Set(),
    isLiked,
    toggleLike,
  };
}

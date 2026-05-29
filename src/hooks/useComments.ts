"use client";

import { useInfiniteQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useUserStore } from "@/stores/userStore";
import { useSocialStore } from "@/stores/socialStore";
import { commentService } from "@/services/social/commentService";
import { useCallback } from "react";

export function useComments(songId: string) {
  const userId = useUserStore((s) => s.user?.id);
  const sortType = useSocialStore((s) => s.commentSortType);
  const queryClient = useQueryClient();

  const queryKey = ["comments", songId, sortType];

  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
  } = useInfiniteQuery({
    queryKey,
    queryFn: ({ pageParam }) =>
      commentService.getComments(songId, sortType, pageParam as string | undefined),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage) => lastPage.nextCursor ?? undefined,
    enabled: !!songId,
    staleTime: 30_000,
  });

  const comments = data?.pages.flatMap((p) => p.data) ?? [];

  const addMutation = useMutation({
    mutationFn: (content: string) => commentService.createComment(userId!, songId, content),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (commentId: string) => commentService.deleteComment(commentId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey });
    },
  });

  const addComment = useCallback(
    (content: string) => addMutation.mutate(content),
    [addMutation],
  );

  const deleteComment = useCallback(
    (commentId: string) => deleteMutation.mutate(commentId),
    [deleteMutation],
  );

  return {
    comments,
    isLoading,
    isFetchingNextPage,
    hasNextPage,
    fetchNextPage,
    addComment,
    deleteComment,
    isAdding: addMutation.isPending,
    sortType,
  };
}

"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useUserStore } from "@/stores/userStore";
import { replyService } from "@/services/social/replyService";
import { useCallback } from "react";

export function useReplies(commentId: string | null) {
  const userId = useUserStore((s) => s.user?.id);
  const queryClient = useQueryClient();

  const queryKey = ["replies", commentId];

  const { data, isLoading } = useQuery({
    queryKey,
    queryFn: () => replyService.getReplies(commentId!),
    enabled: !!commentId,
    staleTime: 15_000,
  });

  const addMutation = useMutation({
    mutationFn: (content: string) => replyService.createReply(userId!, commentId!, content),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (replyId: string) => replyService.deleteReply(replyId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey });
    },
  });

  const addReply = useCallback(
    (content: string) => addMutation.mutate(content),
    [addMutation],
  );

  const deleteReply = useCallback(
    (replyId: string) => deleteMutation.mutate(replyId),
    [deleteMutation],
  );

  return {
    replies: data?.data ?? [],
    isLoading,
    addReply,
    deleteReply,
    isAdding: addMutation.isPending,
  };
}

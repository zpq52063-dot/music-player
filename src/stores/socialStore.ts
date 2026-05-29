import { create } from "zustand";
import type { CommentSortType } from "@/types";

interface SocialState {
  commentSortType: CommentSortType;
  currentCommentSongId: string | null;
  activeReplyId: string | null;

  setCommentSortType: (sort: CommentSortType) => void;
  setCurrentCommentSongId: (songId: string | null) => void;
  setActiveReplyId: (replyId: string | null) => void;
}

export const useSocialStore = create<SocialState>((set) => ({
  commentSortType: "hot",
  currentCommentSongId: null,
  activeReplyId: null,

  setCommentSortType: (sort) => set({ commentSortType: sort }),
  setCurrentCommentSongId: (songId) => set({ currentCommentSongId: songId }),
  setActiveReplyId: (replyId) => set({ activeReplyId: replyId }),
}));

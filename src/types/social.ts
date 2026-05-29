// ==================== 评论 ====================

export interface CommentRecord {
  id: string;
  song_id: string;
  user_id: string;
  content: string;
  like_count: number;
  created_at: string;
}

export interface CommentWithProfile extends CommentRecord {
  profile?: CommentUserProfile;
}

export interface CommentUserProfile {
  username: string;
  avatar_url: string | null;
}

// ==================== 评论点赞 ====================

export interface CommentLikeRecord {
  id: string;
  user_id: string;
  comment_id: string;
  created_at: string;
}

// ==================== 评论回复 ====================

export interface CommentReplyRecord {
  id: string;
  comment_id: string;
  user_id: string;
  content: string;
  created_at: string;
}

export interface CommentReplyWithProfile extends CommentReplyRecord {
  profile?: CommentUserProfile;
}

// ==================== 分页 ====================

export interface PageParam {
  cursor: string;
  limit?: number;
}

export interface CommentPage {
  data: CommentWithProfile[];
  nextCursor: string | null;
  hasMore: boolean;
}

export interface ReplyPage {
  data: CommentReplyWithProfile[];
  nextCursor: string | null;
  hasMore: boolean;
}

// ==================== 排序类型 ====================

export type CommentSortType = "hot" | "newest";

// ==================== Store ====================

export interface SocialState {
  commentSortType: CommentSortType;
  currentCommentSongId: string | null;
  activeReplyId: string | null;
}

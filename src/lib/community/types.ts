export const POST_TAGS = ["의견", "질문", "정보"] as const;
export type PostTag = (typeof POST_TAGS)[number];

export interface CommunityPost {
  id: string;
  code: string;
  author: string;
  tag: PostTag;
  content: string;
  /** ISO 8601 */
  createdAt: string;
  /** 좋아요 기본 수 (내 좋아요 제외) */
  likes: number;
  /** 예시 댓글 수 (내 댓글 제외) */
  comments: number;
  /** 내가 쓴 글 (이 브라우저에 저장) */
  mine?: boolean;
  /** 미리 작성된 예시 글 */
  demo?: boolean;
}

export interface CommunityComment {
  id: string;
  postId: string;
  author: string;
  content: string;
  createdAt: string;
  mine?: boolean;
  demo?: boolean;
}

export const POST_MAX_LENGTH = 300;
export const COMMENT_MAX_LENGTH = 150;

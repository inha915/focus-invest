"use client";

import { useCallback, useMemo } from "react";

import {
  EMPTY_STRINGS,
  readLocal,
  toStringArray,
  useLocalValue,
  writeLocal,
} from "@/lib/client/local-store";
import { DEMO_PROFILE } from "@/lib/profile";
import { isSupportedCode } from "@/lib/stocks";
import { allSeedPosts, seedComments, seedPosts } from "./seed";
import {
  COMMENT_MAX_LENGTH,
  POST_MAX_LENGTH,
  POST_TAGS,
  type CommunityComment,
  type CommunityPost,
  type PostTag,
} from "./types";

/**
 * 커뮤니티 저장소. 내가 쓴 글·댓글과 좋아요는 이 브라우저의 localStorage에만 저장된다.
 * 서버 커뮤니티 API로 바꿀 때는 이 모듈의 훅 구현만 교체하면 된다.
 */

const POSTS_KEY = "focus:community:posts";
const LIKES_KEY = "focus:community:likes";
const COMMENTS_KEY = "focus:community:comments";
const EMPTY_POSTS: CommunityPost[] = [];
const EMPTY_COMMENTS: CommunityComment[] = [];

function sanitizePosts(v: unknown): CommunityPost[] {
  if (!Array.isArray(v)) return EMPTY_POSTS;
  const list = v.filter(
    (p): p is CommunityPost =>
      !!p &&
      typeof p.id === "string" &&
      typeof p.content === "string" &&
      typeof p.createdAt === "string" &&
      isSupportedCode(p.code) &&
      (POST_TAGS as readonly string[]).includes(p.tag),
  );
  return list.length ? list.map((p) => ({ ...p, mine: true, demo: false, likes: 0, comments: 0 })) : EMPTY_POSTS;
}

function sanitizeComments(v: unknown): CommunityComment[] {
  if (!Array.isArray(v)) return EMPTY_COMMENTS;
  const list = v.filter(
    (c): c is CommunityComment =>
      !!c && typeof c.id === "string" && typeof c.postId === "string" && typeof c.content === "string" && typeof c.createdAt === "string",
  );
  return list.length ? list.map((c) => ({ ...c, mine: true, demo: false })) : EMPTY_COMMENTS;
}

const myPosts = () => readLocal(POSTS_KEY, sanitizePosts, EMPTY_POSTS);
const likedIds = () => readLocal(LIKES_KEY, toStringArray, EMPTY_STRINGS);
const myComments = () => readLocal(COMMENTS_KEY, sanitizeComments, EMPTY_COMMENTS);
const newId = (prefix: string) => `${prefix}-${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;

export function addPost(code: string, tag: PostTag, content: string): CommunityPost {
  const post: CommunityPost = {
    id: newId("my"),
    code,
    author: DEMO_PROFILE.nickname,
    tag,
    content: content.trim().slice(0, POST_MAX_LENGTH),
    createdAt: new Date().toISOString(),
    likes: 0,
    comments: 0,
    mine: true,
  };
  writeLocal(POSTS_KEY, [post, ...myPosts()]);
  return post;
}

export function deletePost(id: string) {
  writeLocal(POSTS_KEY, myPosts().filter((p) => p.id !== id));
  writeLocal(LIKES_KEY, likedIds().filter((x) => x !== id));
  writeLocal(COMMENTS_KEY, myComments().filter((c) => c.postId !== id));
}

export function toggleLike(id: string) {
  const ids = likedIds();
  writeLocal(LIKES_KEY, ids.includes(id) ? ids.filter((x) => x !== id) : [...ids, id]);
}

export function addComment(postId: string, content: string) {
  const comment: CommunityComment = {
    id: newId("myc"),
    postId,
    author: DEMO_PROFILE.nickname,
    content: content.trim().slice(0, COMMENT_MAX_LENGTH),
    createdAt: new Date().toISOString(),
    mine: true,
  };
  writeLocal(COMMENTS_KEY, [...myComments(), comment]);
}

export function deleteComment(id: string) {
  writeLocal(COMMENTS_KEY, myComments().filter((c) => c.id !== id));
}

export function clearCommunityData() {
  writeLocal(POSTS_KEY, []);
  writeLocal(LIKES_KEY, []);
  writeLocal(COMMENTS_KEY, []);
}

export interface PostView extends CommunityPost {
  liked: boolean;
  likeCount: number;
  commentCount: number;
}

/** 게시글 목록. code를 주면 해당 종목만, 생략하면 전체 종목 */
export function usePosts(code?: string) {
  const mine = useLocalValue(POSTS_KEY, sanitizePosts, EMPTY_POSTS);
  const likes = useLocalValue(LIKES_KEY, toStringArray, EMPTY_STRINGS);
  const comments = useLocalValue(COMMENTS_KEY, sanitizeComments, EMPTY_COMMENTS);

  const posts: PostView[] = useMemo(() => {
    const all = code
      ? [...mine.filter((p) => p.code === code), ...seedPosts(code)]
      : [...mine, ...allSeedPosts()];
    return all.map((p) => {
      const liked = likes.includes(p.id);
      const extra = comments.filter((c) => c.postId === p.id).length;
      return { ...p, liked, likeCount: p.likes + (liked ? 1 : 0), commentCount: p.comments + extra };
    });
  }, [mine, likes, comments, code]);

  return { posts, remove: deletePost, toggleLike };
}

/** 게시글의 댓글 (예시 댓글 + 내 댓글, 오래된 순) */
export function useComments(postId: string) {
  const mine = useLocalValue(COMMENTS_KEY, sanitizeComments, EMPTY_COMMENTS);
  const comments = useMemo(
    () =>
      [...seedComments(postId), ...mine.filter((c) => c.postId === postId)].sort((a, b) =>
        a.createdAt.localeCompare(b.createdAt),
      ),
    [mine, postId],
  );
  const add = useCallback((content: string) => addComment(postId, content), [postId]);
  return { comments, add, remove: deleteComment };
}

/** 내가 쓴 글 전체 (종목 무관) */
export function useMyPosts() {
  return useLocalValue(POSTS_KEY, sanitizePosts, EMPTY_POSTS);
}

/** 인기 점수 (좋아요 + 댓글 가중) */
export function popularity(p: PostView) {
  return p.likeCount + p.commentCount * 2;
}

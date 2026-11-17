"use client";

import { ChevronRight, Info, MessageCircle, PenLine, SendHorizontal, ThumbsUp, Trash2 } from "lucide-react";
import Link from "next/link";
import { useMemo, useState, type FormEvent } from "react";

import { useToast } from "@/components/Toast";
import { useHydrated } from "@/lib/client/local-store";
import { addPost, popularity, useComments, usePosts, type PostView } from "@/lib/community/store";
import { COMMENT_MAX_LENGTH, POST_MAX_LENGTH, POST_TAGS, type PostTag } from "@/lib/community/types";
import { formatNumber, formatRelativeTime } from "@/lib/format";
import { findStock, STOCKS } from "@/lib/stocks";

type Sort = "popular" | "latest";
type Filter = "전체" | PostTag;

export const TAG_STYLE: Record<PostTag, string> = {
  의견: "bg-brand-soft text-brand-strong",
  질문: "bg-[#fff4e5] text-[#c26a00]",
  정보: "bg-[#e9f8ef] text-[#1e8e4f]",
};

const AVATAR_COLORS = ["#4f9bff", "#ff8a65", "#7c6cf2", "#26b17c", "#f2b134", "#ef6b8a", "#4cc3d9"];
function avatarColor(name: string) {
  let h = 0;
  for (const ch of name) h = (h * 31 + ch.charCodeAt(0)) >>> 0;
  return AVATAR_COLORS[h % AVATAR_COLORS.length];
}

export function AuthorAvatar({ name, size = 32 }: { name: string; size?: number }) {
  return (
    <span
      aria-hidden="true"
      style={{ background: avatarColor(name), width: size, height: size, fontSize: size * 0.4 }}
      className="flex shrink-0 items-center justify-center rounded-full font-bold text-white"
    >
      {name.slice(0, 1)}
    </span>
  );
}

/** 상대 시각. 서버 렌더와 시각이 달라 하이드레이션 이후에만 표시 */
export function RelativeTime({ iso }: { iso: string }) {
  const hydrated = useHydrated();
  return <time dateTime={iso}>{hydrated ? formatRelativeTime(iso) : " "}</time>;
}

/**
 * 커뮤니티 (데모).
 * - code 지정: 종목 상세의 커뮤니티 탭
 * - code 생략: 전체 종목 피드 (/community), 종목 필터와 종목 선택 글쓰기 제공
 */
export function CommunityPanel({ code }: { code?: string }) {
  const feed = !code;
  const hydrated = useHydrated();
  const [stockFilter, setStockFilter] = useState<string>("all");
  const { posts, remove, toggleLike } = usePosts(code);
  const [sort, setSort] = useState<Sort>("popular");
  const [filter, setFilter] = useState<Filter>("전체");
  const { toast, showToast } = useToast();
  const stockName = code ? findStock(code)?.name : undefined;

  const visible = useMemo(() => {
    let list = posts;
    if (feed && stockFilter !== "all") list = list.filter((p) => p.code === stockFilter);
    if (filter !== "전체") list = list.filter((p) => p.tag === filter);
    return [...list].sort((a, b) =>
      sort === "latest" ? b.createdAt.localeCompare(a.createdAt) : popularity(b) - popularity(a),
    );
  }, [posts, sort, filter, feed, stockFilter]);

  return (
    <section aria-label={stockName ? `${stockName} 커뮤니티` : "커뮤니티"} className="px-5 pt-4">
      <p className="flex items-start gap-1.5 rounded-xl bg-surface px-3 py-2.5 text-[12px] leading-relaxed text-muted">
        <Info size={14} className="mt-[1px] shrink-0" />
        데모 커뮤니티예요. 예시 글·댓글은 실제 사용자가 쓴 글이 아니며, 내가 쓴 글과 좋아요는 이 브라우저에만 저장돼요.
      </p>

      {feed && (
        <div className="-mx-5 mt-4 overflow-x-auto px-5 pb-1" role="radiogroup" aria-label="종목 필터">
          <div className="flex w-max gap-1.5">
            {[{ code: "all", name: "전체 종목" }, ...STOCKS].map((s) => (
              <button
                key={s.code}
                type="button"
                role="radio"
                aria-checked={stockFilter === s.code}
                onClick={() => setStockFilter(s.code)}
                className={`whitespace-nowrap rounded-full border px-3 py-1.5 text-[13px] font-semibold transition-colors ${
                  stockFilter === s.code ? "border-brand bg-brand-soft text-brand-strong" : "border-line bg-white text-sub hover:bg-surface"
                }`}
              >
                {s.name}
              </button>
            ))}
          </div>
        </div>
      )}

      <Composer
        fixedCode={code}
        defaultCode={stockFilter !== "all" ? stockFilter : STOCKS[0].code}
        onSubmit={(postCode, tag, content) => {
          addPost(postCode, tag, content);
          setSort("latest");
          setFilter("전체");
          if (feed && stockFilter !== "all" && stockFilter !== postCode) setStockFilter("all");
          showToast("글을 등록했어요");
        }}
      />

      <div className="mt-5 flex flex-wrap items-center justify-between gap-2">
        <div className="flex flex-wrap gap-1.5" role="radiogroup" aria-label="말머리 필터">
          {(["전체", ...POST_TAGS] as Filter[]).map((f) => (
            <button
              key={f}
              type="button"
              role="radio"
              aria-checked={filter === f}
              onClick={() => setFilter(f)}
              className={`rounded-full px-3 py-1.5 text-[13px] font-semibold transition-colors ${
                filter === f ? "bg-ink text-white" : "bg-line text-sub hover:bg-[#e5e8eb]"
              }`}
            >
              {f}
            </button>
          ))}
        </div>
        <div className="flex shrink-0 text-[13px] font-semibold" role="radiogroup" aria-label="정렬">
          {(
            [
              ["popular", "인기순"],
              ["latest", "최신순"],
            ] as const
          ).map(([value, label]) => (
            <button
              key={value}
              type="button"
              role="radio"
              aria-checked={sort === value}
              onClick={() => setSort(value)}
              className={`px-1.5 py-1 transition-colors ${sort === value ? "text-ink" : "text-faint hover:text-sub"}`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {!hydrated ? (
        <div className="mt-4 space-y-5" aria-busy="true">
          {[0, 1, 2].map((i) => (
            <div key={i} className="space-y-2">
              <div className="skeleton h-4 w-32" />
              <div className="skeleton h-12 w-full" />
            </div>
          ))}
        </div>
      ) : visible.length === 0 ? (
        <p className="py-12 text-center text-[14px] text-muted">아직 이 조건의 글이 없어요.</p>
      ) : (
        <ul className="mt-2 divide-y divide-line" data-testid="post-list">
          {visible.map((p) => (
            <PostItem
              key={p.id}
              post={p}
              showStock={feed}
              onLike={() => toggleLike(p.id)}
              onDelete={() => {
                if (window.confirm("이 글을 삭제할까요?")) {
                  remove(p.id);
                  showToast("글을 삭제했어요");
                }
              }}
            />
          ))}
        </ul>
      )}
      {toast}
    </section>
  );
}

function Composer({
  fixedCode,
  defaultCode,
  onSubmit,
}: {
  fixedCode?: string;
  defaultCode: string;
  onSubmit: (code: string, tag: PostTag, content: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const [tag, setTag] = useState<PostTag>("의견");
  const [pickedCode, setPickedCode] = useState<string | null>(null);
  const [text, setText] = useState("");
  const code = fixedCode ?? pickedCode ?? defaultCode;
  const name = findStock(code)?.name ?? "";
  const valid = text.trim().length >= 2;

  function submit(e: FormEvent) {
    e.preventDefault();
    if (!valid) return;
    onSubmit(code, tag, text);
    setText("");
    setOpen(false);
  }

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="mt-4 flex w-full items-center gap-2 rounded-2xl border border-line px-4 py-3.5 text-left text-[15px] text-faint transition-colors hover:bg-surface"
      >
        <PenLine size={18} className="shrink-0 text-brand" />
        <span className="truncate">{fixedCode ? `${name}에 대한 생각을 나눠 보세요` : "종목에 대한 생각을 나눠 보세요"}</span>
      </button>
    );
  }

  return (
    <form onSubmit={submit} className="fade-in mt-4 rounded-2xl border border-brand/40 p-3 shadow-[0_0_0_3px_rgba(49,130,246,0.08)]">
      {!fixedCode && (
        <label className="mb-2 flex items-center gap-2 text-[13px] text-muted">
          종목
          <select
            value={code}
            onChange={(e) => setPickedCode(e.target.value)}
            aria-label="글을 쓸 종목"
            className="min-w-0 flex-1 rounded-lg bg-line px-2 py-1.5 text-[16px] font-semibold text-ink outline-none"
          >
            {STOCKS.map((s) => (
              <option key={s.code} value={s.code}>
                {s.name}
              </option>
            ))}
          </select>
        </label>
      )}
      <div className="flex gap-1.5" role="radiogroup" aria-label="말머리 선택">
        {POST_TAGS.map((t) => (
          <button
            key={t}
            type="button"
            role="radio"
            aria-checked={tag === t}
            onClick={() => setTag(t)}
            className={`rounded-full px-3 py-1 text-[13px] font-semibold transition-colors ${tag === t ? TAG_STYLE[t] : "bg-line text-muted"}`}
          >
            {t}
          </button>
        ))}
      </div>
      <textarea
        autoFocus
        value={text}
        onChange={(e) => setText(e.target.value.slice(0, POST_MAX_LENGTH))}
        rows={4}
        placeholder="매매 권유, 허위 정보, 비방은 삼가 주세요."
        aria-label="게시글 내용"
        className="mt-2 w-full resize-none bg-transparent text-[16px] leading-relaxed text-ink outline-none placeholder:text-faint"
      />
      <div className="flex items-center justify-between">
        <span className="num text-[12px] text-faint">
          {text.length}/{POST_MAX_LENGTH}
        </span>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => setOpen(false)}
            className="rounded-xl px-3 py-2 text-[14px] font-semibold text-muted hover:bg-line"
          >
            취소
          </button>
          <button
            type="submit"
            disabled={!valid}
            className="rounded-xl bg-brand px-4 py-2 text-[14px] font-semibold text-white transition-opacity disabled:opacity-40"
          >
            등록
          </button>
        </div>
      </div>
    </form>
  );
}

function PostItem({
  post,
  showStock,
  onLike,
  onDelete,
}: {
  post: PostView;
  showStock: boolean;
  onLike: () => void;
  onDelete: () => void;
}) {
  const [showComments, setShowComments] = useState(false);
  const stock = findStock(post.code);

  return (
    <li className="py-4" data-testid="post" data-post-id={post.id} data-mine={post.mine ? "true" : undefined}>
      {showStock && stock && (
        <Link
          href={`/stocks/${post.code}?tab=community`}
          transitionTypes={["nav-forward"]}
          className="mb-2 inline-flex items-center gap-0.5 rounded-md bg-surface px-2 py-1 text-[12px] font-semibold text-sub hover:bg-line"
        >
          {stock.name}
          <ChevronRight size={13} />
        </Link>
      )}
      <div className="flex items-center gap-2">
        <AuthorAvatar name={post.author} />
        <div className="min-w-0 flex-1">
          <p className="flex items-center gap-1.5 text-[14px] font-semibold text-ink">
            <span className="truncate">{post.author}</span>
            {post.mine && <span className="rounded bg-ink px-1 text-[10px] font-bold text-white">나</span>}
          </p>
          <p className="text-[12px] text-faint">
            <RelativeTime iso={post.createdAt} />
            {post.demo && " · 예시 글"}
          </p>
        </div>
        <span className={`shrink-0 rounded-md px-1.5 py-0.5 text-[11px] font-semibold ${TAG_STYLE[post.tag]}`}>{post.tag}</span>
      </div>
      <p className="mt-2.5 whitespace-pre-line break-words text-[15px] leading-relaxed text-ink">{post.content}</p>
      <div className="mt-2.5 flex items-center gap-4 text-[13px] text-muted">
        <button
          type="button"
          onClick={onLike}
          aria-pressed={post.liked}
          aria-label={`좋아요 ${post.likeCount}`}
          className={`-ml-1 inline-flex items-center gap-1 rounded-lg px-1 py-1 transition-colors hover:bg-line ${post.liked ? "font-semibold text-brand" : ""}`}
        >
          <ThumbsUp size={15} fill={post.liked ? "currentColor" : "none"} className="transition-transform active:scale-125" />
          <span className="num">{formatNumber(post.likeCount)}</span>
        </button>
        <button
          type="button"
          onClick={() => setShowComments((v) => !v)}
          aria-expanded={showComments}
          aria-label={`댓글 ${post.commentCount}`}
          className={`inline-flex items-center gap-1 rounded-lg px-1 py-1 transition-colors hover:bg-line ${showComments ? "text-ink" : ""}`}
        >
          <MessageCircle size={15} />
          <span className="num">{formatNumber(post.commentCount)}</span>
        </button>
        {post.mine && (
          <button
            type="button"
            onClick={onDelete}
            className="ml-auto inline-flex items-center gap-1 rounded-lg px-1.5 py-1 hover:bg-line"
          >
            <Trash2 size={14} />
            삭제
          </button>
        )}
      </div>
      {showComments && <CommentThread postId={post.id} />}
    </li>
  );
}

function CommentThread({ postId }: { postId: string }) {
  const { comments, add, remove } = useComments(postId);
  const [text, setText] = useState("");
  const valid = text.trim().length >= 1;

  function submit(e: FormEvent) {
    e.preventDefault();
    if (!valid) return;
    add(text);
    setText("");
  }

  return (
    <div className="fade-in mt-3 rounded-2xl bg-surface p-3" data-testid="comment-thread">
      {comments.length === 0 ? (
        <p className="px-1 py-2 text-[13px] text-muted">첫 댓글을 남겨 보세요.</p>
      ) : (
        <ul className="space-y-3">
          {comments.map((c) => (
            <li key={c.id} className="flex gap-2" data-testid="comment">
              <AuthorAvatar name={c.author} size={24} />
              <div className="min-w-0 flex-1">
                <p className="flex items-center gap-1.5 text-[12px]">
                  <span className="font-semibold text-ink">{c.author}</span>
                  {c.mine && <span className="rounded bg-ink px-1 text-[10px] font-bold text-white">나</span>}
                  <span className="text-faint">
                    <RelativeTime iso={c.createdAt} />
                  </span>
                  {c.mine && (
                    <button
                      type="button"
                      onClick={() => remove(c.id)}
                      className="ml-auto text-[12px] text-muted hover:text-sub"
                      aria-label="댓글 삭제"
                    >
                      삭제
                    </button>
                  )}
                </p>
                <p className="mt-0.5 break-words text-[14px] leading-relaxed text-ink">{c.content}</p>
              </div>
            </li>
          ))}
        </ul>
      )}
      <form onSubmit={submit} className="mt-3 flex items-center gap-2 rounded-xl bg-white py-1 pl-3 pr-1">
        <input
          value={text}
          onChange={(e) => setText(e.target.value.slice(0, COMMENT_MAX_LENGTH))}
          placeholder="댓글을 입력하세요"
          aria-label="댓글 입력"
          className="min-w-0 flex-1 bg-transparent text-[16px] text-ink outline-none placeholder:text-faint"
        />
        <button
          type="submit"
          disabled={!valid}
          aria-label="댓글 등록"
          className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-brand text-white transition-opacity disabled:opacity-30"
        >
          <SendHorizontal size={16} />
        </button>
      </form>
    </div>
  );
}

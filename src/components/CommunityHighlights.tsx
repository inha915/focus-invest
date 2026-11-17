"use client";

import { ChevronRight, MessageCircle, ThumbsUp } from "lucide-react";
import Link from "next/link";
import { useMemo } from "react";

import { RelativeTime, TAG_STYLE } from "@/components/CommunityPanel";
import { popularity, usePosts } from "@/lib/community/store";
import { formatNumber } from "@/lib/format";
import { findStock } from "@/lib/stocks";

/** 홈: 커뮤니티 인기글 미리보기 */
export function CommunityHighlights() {
  const { posts } = usePosts();
  const top = useMemo(() => [...posts].sort((a, b) => popularity(b) - popularity(a)).slice(0, 3), [posts]);

  return (
    <section className="mt-2 border-t-8 border-line pt-5" aria-labelledby="community-highlights">
      <div className="flex items-center justify-between px-5">
        <h2 id="community-highlights" className="text-[19px] font-bold text-ink">
          커뮤니티 인기글
        </h2>
        <Link
          href="/community"
          transitionTypes={["nav-forward"]}
          className="inline-flex items-center text-[14px] font-semibold text-muted hover:text-sub"
        >
          전체보기
          <ChevronRight size={16} />
        </Link>
      </div>
      <p className="mt-1 px-5 text-[12px] text-faint">데모 커뮤니티 · 예시 글은 실제 사용자 글이 아니에요</p>
      <ul className="mt-2" data-testid="community-highlights">
        {top.map((p) => (
          <li key={p.id}>
            <Link
              href={`/stocks/${p.code}?tab=community`}
              transitionTypes={["nav-forward"]}
              className="block px-5 py-3.5 transition-colors hover:bg-surface active:bg-line"
            >
              <p className="flex items-center gap-1.5 text-[12px]">
                <span className="font-semibold text-sub">{findStock(p.code)?.name}</span>
                <span className={`rounded px-1 py-0.5 text-[10px] font-semibold ${TAG_STYLE[p.tag]}`}>{p.tag}</span>
                <span className="text-faint">
                  <RelativeTime iso={p.createdAt} />
                </span>
              </p>
              <p className="mt-1 line-clamp-2 text-[15px] leading-relaxed text-ink">{p.content}</p>
              <p className="mt-1.5 flex items-center gap-3 text-[12px] text-muted">
                <span className="inline-flex items-center gap-1">
                  <ThumbsUp size={13} />
                  <span className="num">{formatNumber(p.likeCount)}</span>
                </span>
                <span className="inline-flex items-center gap-1">
                  <MessageCircle size={13} />
                  <span className="num">{formatNumber(p.commentCount)}</span>
                </span>
                <span className="ml-auto">{p.author}</span>
              </p>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}

"use client";

import { Heart } from "lucide-react";
import Link from "next/link";

import { AppHeader } from "@/components/AppHeader";
import { QuoteList } from "@/components/QuoteList";
import { EmptyState, LoadingRows } from "@/components/StateViews";
import { useWatchlist } from "@/hooks/useWatchlist";

export function WatchlistView() {
  const { codes, hydrated, remove } = useWatchlist();

  return (
    <>
      <AppHeader title={<h1>관심 종목</h1>} />
      {!hydrated ? (
        <LoadingRows count={3} />
      ) : codes.length === 0 ? (
        <EmptyState
          icon={Heart}
          title="관심 종목이 없어요"
          description="종목 상세 화면에서 하트를 눌러 관심 종목으로 등록해 보세요."
          action={
            <Link
              href="/search"
              className="inline-flex rounded-xl bg-brand px-5 py-3 text-[15px] font-semibold text-white hover:bg-brand-strong"
            >
              종목 찾아보기
            </Link>
          }
        />
      ) : (
        <>
          <p className="px-5 pb-2 pt-2 text-[13px] font-semibold text-sub">
            {codes.length}개 종목 · 이 브라우저에 저장돼요
          </p>
          <QuoteList
            codes={codes}
            renderTrailing={(q) => (
              <button
                type="button"
                onClick={() => remove(q.code)}
                aria-label={`${q.name} 관심 해제`}
                className="mr-3 flex size-10 shrink-0 items-center justify-center rounded-full text-up hover:bg-up-soft"
              >
                <Heart size={20} fill="currentColor" />
              </button>
            )}
          />
        </>
      )}
    </>
  );
}

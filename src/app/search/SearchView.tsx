"use client";

import { Search, SearchX, X } from "lucide-react";
import Link from "next/link";
import { useMemo, useState } from "react";

import { AppHeader } from "@/components/AppHeader";
import { QuoteList } from "@/components/QuoteList";
import { EmptyState } from "@/components/StateViews";
import { searchStocks, STOCKS } from "@/lib/stocks";

export function SearchView() {
  const [query, setQuery] = useState("");
  const trimmed = query.trim();
  const results = useMemo(() => searchStocks(trimmed), [trimmed]);
  const codes = useMemo(() => results.map((s) => s.code), [results]);

  return (
    <>
      <AppHeader title={<h1>검색</h1>} />
      <div className="px-5 pb-3 pt-1">
        <label className="flex h-12 items-center gap-2 rounded-2xl bg-line px-4 focus-within:ring-2 focus-within:ring-brand/40">
          <Search size={20} className="shrink-0 text-muted" />
          <input
            autoFocus
            type="search"
            inputMode="search"
            enterKeyHint="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="종목명 또는 종목코드"
            aria-label="종목명 또는 종목코드 검색"
            className="min-w-0 flex-1 bg-transparent text-[16px] text-ink outline-none placeholder:text-faint [&::-webkit-search-cancel-button]:hidden"
          />
          {query && (
            <button
              type="button"
              onClick={() => setQuery("")}
              aria-label="검색어 지우기"
              className="flex size-6 items-center justify-center rounded-full bg-faint text-white"
            >
              <X size={14} strokeWidth={3} />
            </button>
          )}
        </label>
      </div>

      {!trimmed && (
        <section className="px-5 pt-3">
          <h2 className="text-[15px] font-bold text-ink">검색할 수 있는 종목</h2>
          <p className="mt-1 text-[13px] text-muted">첫 버전은 아래 {STOCKS.length}개 종목을 지원해요.</p>
          <ul className="mt-4 flex flex-wrap gap-2">
            {STOCKS.map((s) => (
              <li key={s.code}>
                <Link
                  href={`/stocks/${s.code}`}
                  transitionTypes={["nav-forward"]}
                  className="inline-flex items-center gap-1.5 rounded-full border border-line bg-white px-3.5 py-2 text-[14px] font-medium text-ink hover:bg-surface"
                >
                  {s.name}
                  <span className="num text-[12px] text-muted">{s.code}</span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}

      {trimmed && results.length === 0 && (
        <EmptyState
          icon={SearchX}
          title={`'${trimmed}' 검색 결과가 없어요`}
          description="지원하는 종목의 이름이나 6자리 종목코드로 검색해 보세요. 예) 삼성전자, 005930"
        />
      )}

      {trimmed && results.length > 0 && (
        <section aria-label="검색 결과">
          <p className="px-5 pb-2 pt-1 text-[13px] font-semibold text-sub" data-testid="search-count">
            검색 결과 {results.length}건
          </p>
          <QuoteList codes={codes} />
        </section>
      )}
    </>
  );
}

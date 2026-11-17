"use client";

import type { ReactNode } from "react";

import { SourceNotice } from "@/components/SourceNotice";
import { EmptyState, ErrorState, LoadingRows } from "@/components/StateViews";
import { StockRow } from "@/components/StockRow";
import { useApi } from "@/hooks/useApi";
import type { Quote, QuotesResponse } from "@/lib/types";
import { Inbox } from "lucide-react";

interface QuoteListProps {
  codes: readonly string[];
  ranked?: boolean;
  /** 행 오른쪽 부가 액션 (예: 관심 해제 버튼) */
  renderTrailing?: (quote: Quote) => ReactNode;
}

/** 종목코드 목록의 현재가를 불러와 리스트로 표시 (로딩·오류·빈 데이터 처리 포함) */
export function QuoteList({ codes, ranked, renderTrailing }: QuoteListProps) {
  const url = codes.length > 0 ? `/api/quotes?codes=${codes.join(",")}` : null;
  const { data: fresh, error, loading, retry, previous } = useApi<QuotesResponse>(url);

  // 목록이 줄어드는 경우(관심 해제, 검색어 좁히기)에는 이미 받은 시세로 즉시 표시
  const coveredByPrevious =
    loading && previous !== undefined && codes.every((c) => previous.quotes.some((q) => q.code === c));
  const data = fresh ?? (coveredByPrevious ? previous : undefined);

  if (loading && !data) return <LoadingRows count={Math.min(codes.length, 6)} />;
  if (error) return <ErrorState message={error.message} onRetry={retry} />;
  if (!data || data.quotes.length === 0) {
    return <EmptyState icon={Inbox} title="표시할 시세가 없어요" description="잠시 후 다시 시도해 주세요." />;
  }

  // 응답 순서와 관계없이 요청한 순서대로 표시
  const byCode = new Map(data.quotes.map((q) => [q.code, q]));
  const quotes = codes.map((c) => byCode.get(c)).filter((q): q is Quote => !!q);

  return (
    <div>
      <SourceNotice meta={data.meta} className="px-5 pb-1" />
      <ul className="py-1">
        {quotes.map((q, i) => (
          <StockRow key={q.code} quote={q} rank={ranked ? i + 1 : undefined} trailing={renderTrailing?.(q)} />
        ))}
      </ul>
    </div>
  );
}

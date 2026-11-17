"use client";

import { Heart, LineChart, Loader2, Sparkles } from "lucide-react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState, ViewTransition } from "react";

import { CommunityPanel } from "@/components/CommunityPanel";
import { PriceChart } from "@/components/PriceChart";
import { SourceNotice } from "@/components/SourceNotice";
import { EmptyState, ErrorState } from "@/components/StateViews";
import { TopBar } from "@/components/TopBar";
import { useApi } from "@/hooks/useApi";
import { recordRecentStock } from "@/hooks/useRecentStocks";
import { usePosts } from "@/lib/community/store";
import { useWatchlist } from "@/hooks/useWatchlist";
import {
  directionClass,
  directionOf,
  formatNumber,
  formatPrice,
  formatSignedNumber,
  formatSignedRate,
  formatVolume,
} from "@/lib/format";
import { CHART_RANGES, type CandlesResponse, type ChartRange, type QuoteResponse } from "@/lib/types";

interface Props {
  code: string;
  name: string;
  market: string;
}

type DetailTab = "quote" | "community";

export function StockDetailView({ code, name, market }: Props) {
  const quoteState = useApi<QuoteResponse>(`/api/quotes/${code}`);
  const { has, toggle, hydrated } = useWatchlist();
  const watched = hydrated && has(code);
  const router = useRouter();
  const searchParams = useSearchParams();
  const tab: DetailTab = searchParams.get("tab") === "community" ? "community" : "quote";
  const postCount = usePosts(code).posts.length;

  // 최근 본 종목 기록 (외부 저장소 쓰기)
  useEffect(() => {
    recordRecentStock(code);
  }, [code]);

  const selectTab = (next: DetailTab) => {
    router.replace(next === "community" ? `/stocks/${code}?tab=community` : `/stocks/${code}`, { scroll: false });
  };

  const watchLabel = watched ? "관심 종목 해제" : "관심 종목 등록";
  const watchButton = (
    <button
      type="button"
      onClick={() => toggle(code)}
      disabled={!hydrated}
      aria-pressed={watched}
      aria-label={watched ? "관심 해제" : "관심 등록"}
      className={`flex size-10 items-center justify-center rounded-full hover:bg-line ${
        watched ? "text-up" : "text-faint"
      }`}
    >
      <Heart size={23} fill={watched ? "currentColor" : "none"} />
    </button>
  );

  return (
    <>
      <TopBar back title={<span className="text-[16px] font-semibold text-ink">{name}</span>} right={watchButton} />

      <QuoteSection code={code} name={name} market={market} state={quoteState} showStats={tab === "quote"} />

      <div
        role="tablist"
        aria-label="상세 정보"
        className="sticky top-14 z-10 mt-4 flex border-b border-line bg-white px-5"
      >
        {(
          [
            ["quote", "시세"],
            ["community", "커뮤니티"],
          ] as const
        ).map(([value, label]) => {
          const count = value === "community" ? postCount : null;
          const active = tab === value;
          return (
            <button
              key={value}
              type="button"
              role="tab"
              aria-selected={active}
              onClick={() => selectTab(value)}
              className={`relative mr-6 h-12 text-[16px] font-bold transition-colors ${
                active ? "text-ink" : "text-faint hover:text-sub"
              }`}
            >
              {label}
              {count !== null && <span className="num ml-1 text-[14px] font-semibold text-faint">{count}</span>}
              {active && <span className="absolute inset-x-0 bottom-[-1px] h-[2px] rounded-full bg-ink" />}
            </button>
          );
        })}
      </div>

      {/* 같은 화면 안 탭 전환: 내용만 크로스페이드 */}
      <ViewTransition key={tab} enter="tab-fade" exit="tab-fade" default="none">
        <div>{tab === "quote" ? <ChartSection code={code} /> : <CommunityPanel code={code} />}</div>
      </ViewTransition>

      <div className="sticky bottom-[calc(64px+env(safe-area-inset-bottom))] z-10 mt-auto flex gap-2 [@media(max-height:500px)]:static border-t border-line bg-white px-4 py-3 min-[360px]:px-5">
        <button
          type="button"
          onClick={() => toggle(code)}
          disabled={!hydrated}
          aria-pressed={watched}
          aria-label={watchLabel}
          className={`flex h-[52px] min-w-0 flex-1 items-center justify-center gap-1.5 whitespace-nowrap rounded-2xl text-[14px] font-semibold transition-colors min-[360px]:text-[15px] ${
            watched ? "bg-up-soft text-up" : "bg-line text-sub hover:bg-[#e5e8eb]"
          }`}
        >
          <Heart size={18} className="shrink-0" fill={watched ? "currentColor" : "none"} />
          {/* 아주 좁은 화면(폴드 접힘 등)에서는 짧은 문구 */}
          <span className="min-[360px]:hidden">{watched ? "해제" : "관심"}</span>
          <span className="hidden min-[360px]:inline">{watchLabel}</span>
        </button>
        <Link
          href={`/ai?code=${code}`}
          transitionTypes={["nav-forward"]}
          className="flex h-[52px] min-w-0 flex-[1.3] items-center justify-center gap-1.5 whitespace-nowrap rounded-2xl bg-brand text-[14px] font-semibold text-white hover:bg-brand-strong min-[360px]:text-[15px]"
        >
          <Sparkles size={18} className="shrink-0" />
          AI에게 물어보기
        </Link>
      </div>
    </>
  );
}

function QuoteSection({
  code,
  name,
  market,
  state,
  showStats,
}: Props & { state: ReturnType<typeof useApi<QuoteResponse>>; showStats: boolean }) {
  const { data, error, loading, retry } = state;

  return (
    <section className="px-5 pb-2 pt-2" aria-label="현재가">
      <p className="text-[14px] text-muted">
        {name} <span className="num">{code}</span> · {market}
      </p>

      {loading && (
        <div className="mt-2 space-y-2" aria-busy="true">
          <div className="skeleton h-9 w-44" />
          <div className="skeleton h-4 w-32" />
        </div>
      )}

      {error && <ErrorState compact message={error.message} onRetry={retry} />}

      {data && (
        <>
          <p className="num mt-1 text-[32px] font-bold leading-tight text-ink" data-testid="current-price">
            {formatPrice(data.quote.price)}
          </p>
          <p className="mt-1 text-[14px]">
            <span className="text-muted">어제보다 </span>
            <span
              className={`num font-semibold ${directionClass(directionOf(data.quote.change))}`}
              data-testid="price-change"
            >
              {formatSignedNumber(data.quote.change)}원 ({formatSignedRate(data.quote.changeRate)})
            </span>
          </p>
          <SourceNotice meta={data.meta} className="mt-3" />

          {showStats && (
          <dl className="mt-5 grid grid-cols-1 gap-x-6 gap-y-3 min-[340px]:grid-cols-2 rounded-2xl bg-surface px-4 py-4 text-[14px]">
            <Stat label="거래량" value={`${formatNumber(data.quote.volume)}주`} sub={formatVolume(data.quote.volume)} />
            <Stat label="전일 종가" value={formatNumber(data.quote.prevClose)} />
            <Stat label="시가" value={formatNumber(data.quote.open)} />
            <Stat label="고가" value={formatNumber(data.quote.high)} className="text-up" />
            <Stat label="저가" value={formatNumber(data.quote.low)} className="text-down" />
          </dl>
          )}
        </>
      )}
    </section>
  );
}

function Stat({ label, value, sub, className = "text-ink" }: { label: string; value: string; sub?: string; className?: string }) {
  return (
    <div className="flex items-baseline justify-between gap-2">
      <dt className="shrink-0 text-muted">{label}</dt>
      <dd className={`num truncate text-right font-semibold ${className}`} title={sub}>
        {value}
      </dd>
    </div>
  );
}

function ChartSection({ code }: { code: string }) {
  const [range, setRange] = useState<ChartRange>("1M");
  const { data, error, loading, previous, retry } = useApi<CandlesResponse>(
    `/api/candles/${code}?range=${range}`,
  );

  // 기간 전환 중에는 직전 차트를 흐리게 유지해 레이아웃이 튀지 않게 한다
  const shown = data ?? (loading && previous?.code === code ? previous : undefined);
  const candles = shown?.candles ?? [];
  const first = candles[0]?.close;
  const last = candles.at(-1)?.close;
  const periodChange = first && last ? ((last - first) / first) * 100 : 0;
  const rangeLabel = CHART_RANGES.find((r) => r.value === (shown?.range ?? range))?.label;

  return (
    <section className="px-5 pt-5" aria-label="일봉 차트">
      <div className="flex items-center justify-between">
        <h2 className="text-[17px] font-bold text-ink">차트</h2>
        {candles.length > 1 && (
          <p className="text-[13px] text-muted">
            {rangeLabel}{" "}
            <span className={`num font-semibold ${directionClass(directionOf(periodChange))}`}>
              {formatSignedRate(periodChange)}
            </span>
          </p>
        )}
      </div>

      <div className="relative mt-3 min-h-[290px]">
        {loading && !shown && <div className="skeleton h-[276px] w-full" aria-busy="true" />}
        {error && <ErrorState compact message={error.message} onRetry={retry} />}
        {!error && shown && candles.length === 0 && (
          <EmptyState icon={LineChart} title="차트 데이터가 없어요" description="선택한 기간에 거래일 데이터가 없습니다." />
        )}
        {!error && candles.length > 0 && (
          <div className={`transition-opacity ${loading ? "opacity-40" : ""}`}>
            <PriceChart candles={candles} direction={directionOf(periodChange)} />
          </div>
        )}
        {loading && shown && (
          <Loader2 className="absolute left-1/2 top-[110px] -translate-x-1/2 animate-spin text-brand" size={28} />
        )}
      </div>

      <div role="tablist" aria-label="차트 기간" className="mt-3 grid grid-cols-3 gap-1 rounded-xl bg-line p-1">
        {CHART_RANGES.map((r) => {
          const active = r.value === range;
          return (
            <button
              key={r.value}
              type="button"
              role="tab"
              aria-selected={active}
              onClick={() => setRange(r.value)}
              className={`h-9 rounded-lg text-[14px] font-semibold transition-colors ${
                active ? "bg-white text-ink shadow-sm" : "text-muted hover:text-sub"
              }`}
            >
              {r.label}
            </button>
          );
        })}
      </div>

      {shown && !error && (
        <p className="num mt-3 text-[12px] text-faint" data-testid="chart-meta">
          일봉 {candles.length}개 · {shown.meta.sourceLabel}
          {shown.meta.basisDate ? ` · 기준일 ${shown.meta.basisDate.replaceAll("-", ".")}` : ""}
        </p>
      )}
    </section>
  );
}

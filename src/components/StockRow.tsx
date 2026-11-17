import Link from "next/link";
import type { ReactNode } from "react";

import { directionClass, directionOf, formatPrice, formatSignedRate, formatVolume } from "@/lib/format";
import type { Quote } from "@/lib/types";

/** 종목 리스트 한 줄: 종목명 · 코드 · 거래량 / 현재가 · 등락률 */
export function StockRow({ quote, rank, trailing }: { quote: Quote; rank?: number; trailing?: ReactNode }) {
  const dir = directionOf(quote.change);

  return (
    <li className="flex items-center" data-testid="stock-row" data-code={quote.code}>
      <Link
        href={`/stocks/${quote.code}`}
        transitionTypes={["nav-forward"]}
        className="press flex min-w-0 flex-1 items-center gap-3 rounded-2xl px-5 py-3.5 hover:bg-surface active:bg-line"
      >
        {rank !== undefined && (
          <span className="num w-4 shrink-0 text-center text-[15px] font-bold text-brand">{rank}</span>
        )}
        <div className="min-w-0 flex-1">
          <p className="truncate text-[16px] font-semibold text-ink">{quote.name}</p>
          <p className="num mt-0.5 truncate text-[13px] text-muted">
            {quote.code} · 거래량 {formatVolume(quote.volume)}
          </p>
        </div>
        <div className="shrink-0 text-right">
          <p className="num text-[16px] font-bold text-ink">{formatPrice(quote.price)}</p>
          <p className={`num mt-0.5 text-[13px] font-semibold ${directionClass(dir)}`}>
            {formatSignedRate(quote.changeRate)}
          </p>
        </div>
      </Link>
      {trailing}
    </li>
  );
}

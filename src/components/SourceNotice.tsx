import { Database, Radio } from "lucide-react";

import { formatDate, formatKstTime } from "@/lib/format";
import type { MarketMeta } from "@/lib/types";

/** 시세 출처와 기준일/조회 시각 표시 */
export function SourceNotice({ meta, className = "" }: { meta: MarketMeta; className?: string }) {
  const isMock = meta.source === "mock";
  const Icon = isMock ? Database : Radio;
  const when = isMock
    ? `기준일 ${formatDate(meta.basisDate ?? "")} · 실제 시세 아님`
    : [
        meta.basisDate ? `기준일 ${formatDate(meta.basisDate)}` : null,
        `${formatKstTime(meta.fetchedAt)} 조회`,
      ]
        .filter(Boolean)
        .join(" · ");

  return (
    <p
      data-testid="source-notice"
      className={`flex items-center gap-1.5 text-[12px] text-muted ${className}`}
    >
      <span
        className={`inline-flex shrink-0 items-center gap-1 whitespace-nowrap rounded-full px-2 py-0.5 font-semibold ${
          isMock ? "bg-line text-sub" : "bg-brand-soft text-brand-strong"
        }`}
      >
        <Icon size={12} strokeWidth={2.4} />
        {meta.sourceLabel}
      </span>
      <span className="truncate">{when}</span>
    </p>
  );
}

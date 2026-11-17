"use client";

import { useId } from "react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  type TooltipContentProps,
} from "recharts";

import {
  formatDate,
  formatNumber,
  formatPrice,
  formatShortDate,
  formatVolume,
  type Direction,
} from "@/lib/format";
import type { Candle } from "@/lib/types";

const COLORS: Record<Direction, string> = { up: "#f04452", down: "#2f6fe4", flat: "#8b95a1" };

function ChartTooltip({ active, payload }: TooltipContentProps) {
  const candle = payload?.[0]?.payload as Candle | undefined;
  if (!active || !candle) return null;
  return (
    <div className="rounded-xl bg-ink/90 px-3 py-2 text-[12px] leading-relaxed text-white shadow-lg">
      <p className="font-semibold">{formatDate(candle.date)}</p>
      <p className="num">종가 {formatPrice(candle.close)}</p>
      <p className="num text-white/70">
        시 {formatNumber(candle.open)} · 고 {formatNumber(candle.high)} · 저 {formatNumber(candle.low)}
      </p>
      <p className="num text-white/70">거래량 {formatVolume(candle.volume)}</p>
    </div>
  );
}

/**
 * 일봉 종가 영역 차트 + 거래량 막대 차트.
 * 두 차트는 축을 공유하지 않는 별도 차트이며, syncId로 크로스헤어만 맞춘다.
 */
export function PriceChart({ candles, direction }: { candles: Candle[]; direction: Direction }) {
  const gradientId = useId().replace(/:/g, "");
  const color = COLORS[direction];
  const syncId = `sync-${gradientId}`;

  const closes = candles.map((c) => c.close);
  const min = Math.min(...closes);
  const max = Math.max(...closes);
  const pad = Math.max((max - min) * 0.08, max * 0.002);

  return (
    <div data-testid="price-chart" data-points={candles.length}>
      <div className="h-[220px]">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={candles} syncId={syncId} margin={{ top: 12, right: 4, bottom: 0, left: 4 }}>
            <defs>
              <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={color} stopOpacity={0.18} />
                <stop offset="100%" stopColor={color} stopOpacity={0} />
              </linearGradient>
            </defs>
            <XAxis dataKey="date" hide />
            <YAxis domain={[min - pad, max + pad]} hide />
            <Tooltip
              content={ChartTooltip}
              cursor={{ stroke: "#b0b8c1", strokeWidth: 1, strokeDasharray: "3 3" }}
              isAnimationActive={false}
            />
            <Area
              type="linear"
              dataKey="close"
              name="종가"
              stroke={color}
              strokeWidth={2}
              fill={`url(#${gradientId})`}
              activeDot={{ r: 5, stroke: "#fff", strokeWidth: 2, fill: color }}
              isAnimationActive={false}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
      <div className="h-[56px]">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={candles} syncId={syncId} margin={{ top: 4, right: 4, bottom: 0, left: 4 }}>
            <XAxis dataKey="date" hide />
            <YAxis hide />
            <Tooltip content={() => null} cursor={{ fill: "rgba(139,149,161,0.12)" }} />
            <Bar dataKey="volume" name="거래량" fill="#d1d6db" radius={[2, 2, 0, 0]} isAnimationActive={false} />
          </BarChart>
        </ResponsiveContainer>
      </div>
      <div className="num mt-1 flex justify-between px-1 text-[11px] text-faint">
        <span>{formatShortDate(candles[0].date)}</span>
        <span>거래량</span>
        <span>{formatShortDate(candles[candles.length - 1].date)}</span>
      </div>
    </div>
  );
}

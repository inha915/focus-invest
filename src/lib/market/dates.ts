import type { Candle, ChartRange } from "@/lib/types";
import { CHART_RANGES } from "@/lib/types";

/** 오늘 날짜(한국 시간) YYYY-MM-DD */
export function todayKst(now = Date.now()): string {
  return new Date(now + 9 * 60 * 60 * 1000).toISOString().slice(0, 10);
}

function parse(date: string): Date {
  return new Date(`${date}T00:00:00Z`);
}

function toIso(d: Date): string {
  return d.toISOString().slice(0, 10);
}

export function addDays(date: string, days: number): string {
  const d = parse(date);
  d.setUTCDate(d.getUTCDate() + days);
  return toIso(d);
}

export function subtractMonths(date: string, months: number): string {
  const d = parse(date);
  const day = d.getUTCDate();
  d.setUTCDate(1);
  d.setUTCMonth(d.getUTCMonth() - months);
  const lastDay = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth() + 1, 0)).getUTCDate();
  d.setUTCDate(Math.min(day, lastDay));
  return toIso(d);
}

/** 기간의 시작일 (종료일 기준 N개월 전 다음 날) */
export function rangeStart(end: string, range: ChartRange): string {
  const months = CHART_RANGES.find((r) => r.value === range)!.months;
  return addDays(subtractMonths(end, months), 1);
}

/** YYYY-MM-DD ↔ YYYYMMDD */
export const toCompact = (date: string) => date.replaceAll("-", "");
export const fromCompact = (date: string) =>
  `${date.slice(0, 4)}-${date.slice(4, 6)}-${date.slice(6, 8)}`;

/**
 * 차트에 넘기기 전 정규화: 거래일 오름차순 정렬, 같은 거래일 중복 제거(나중 값 우선),
 * 기간 밖 데이터와 비정상 값(종가 0 이하) 제거.
 */
export function normalizeCandles(candles: Candle[], start?: string, end?: string): Candle[] {
  const byDate = new Map<string, Candle>();
  for (const c of candles) {
    if (!c.date || !(c.close > 0)) continue;
    if (start && c.date < start) continue;
    if (end && c.date > end) continue;
    byDate.set(c.date, c);
  }
  return [...byDate.values()].sort((a, b) => a.date.localeCompare(b.date));
}

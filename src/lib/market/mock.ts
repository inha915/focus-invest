import "server-only";

import { findStock } from "@/lib/stocks";
import type { Candle, Quote } from "@/lib/types";
import { addDays, normalizeCandles, rangeStart } from "./dates";
import { MarketDataError } from "./errors";
import type { MarketDataProvider } from "./provider";

/**
 * 샘플 시세. 실제 시세가 아니며, 종목코드를 시드로 한 결정적 난수로 만든다.
 * 같은 종목은 항상 같은 값을 돌려주므로 공개 데모와 스크린샷이 재현 가능하다.
 */
export const MOCK_BASIS_DATE = "2026-11-13";

const TRADING_DAYS = 160;

const BASE: Record<string, { price: number; volume: number; vol: number }> = {
  "005930": { price: 71_800, volume: 14_500_000, vol: 0.016 },
  "000660": { price: 198_500, volume: 3_400_000, vol: 0.024 },
  "035420": { price: 187_300, volume: 820_000, vol: 0.019 },
  "035720": { price: 41_250, volume: 2_100_000, vol: 0.021 },
  "005380": { price: 236_000, volume: 640_000, vol: 0.017 },
  "373220": { price: 372_500, volume: 310_000, vol: 0.025 },
  "207940": { price: 1_012_000, volume: 72_000, vol: 0.018 },
  "068270": { price: 176_400, volume: 950_000, vol: 0.02 },
};

function mulberry32(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** 한국 주식 호가 단위로 반올림 */
function tick(price: number): number {
  const unit =
    price < 2_000 ? 1 : price < 5_000 ? 5 : price < 20_000 ? 10 : price < 50_000 ? 50
      : price < 200_000 ? 100 : price < 500_000 ? 500 : 1_000;
  return Math.max(unit, Math.round(price / unit) * unit);
}

function tradingDaysBackFrom(end: string, count: number): string[] {
  const days: string[] = [];
  let cursor = end;
  while (days.length < count) {
    const dow = new Date(`${cursor}T00:00:00Z`).getUTCDay();
    if (dow !== 0 && dow !== 6) days.push(cursor);
    cursor = addDays(cursor, -1);
  }
  return days.reverse();
}

const seriesCache = new Map<string, Candle[]>();

function mockSeries(code: string): Candle[] {
  const cached = seriesCache.get(code);
  if (cached) return cached;

  const base = BASE[code];
  if (!base) throw new MarketDataError("샘플 시세가 없는 종목입니다.", 404, "UNKNOWN_CODE");

  const rand = mulberry32(Number(code) * 2654435761);
  const days = tradingDaysBackFrom(MOCK_BASIS_DATE, TRADING_DAYS);

  // 마지막 종가가 base.price 근처가 되도록 시작가를 역산한 뒤 순방향 랜덤 워크
  const returns = days.map(() => (rand() - 0.48) * 2 * base.vol);
  const drift = returns.reduce((acc, r) => acc * (1 + r), 1);
  let close = base.price / drift;

  const candles: Candle[] = days.map((date, i) => {
    const open = close * (1 + (rand() - 0.5) * base.vol * 0.6);
    close = close * (1 + returns[i]);
    const high = Math.max(open, close) * (1 + rand() * base.vol * 0.7);
    const low = Math.min(open, close) * (1 - rand() * base.vol * 0.7);
    const volume = Math.round(base.volume * (0.55 + rand() * 0.9 + Math.abs(returns[i]) * 12));
    return { date, open: tick(open), high: tick(high), low: tick(low), close: tick(close), volume };
  });

  seriesCache.set(code, candles);
  return candles;
}

function quoteFromSeries(code: string): Quote {
  const meta = findStock(code);
  if (!meta) throw new MarketDataError("지원하지 않는 종목입니다.", 404, "UNKNOWN_CODE");
  const series = mockSeries(code);
  const last = series[series.length - 1];
  const prev = series[series.length - 2];
  const change = last.close - prev.close;
  return {
    code,
    name: meta.name,
    market: meta.market,
    price: last.close,
    change,
    changeRate: Math.round((change / prev.close) * 10_000) / 100,
    volume: last.volume,
    open: last.open,
    high: last.high,
    low: last.low,
    prevClose: prev.close,
  };
}

export const mockProvider: MarketDataProvider = {
  source: "mock",
  sourceLabel: "샘플 시세",
  async getQuotes(codes) {
    return { quotes: codes.map(quoteFromSeries), basisDate: MOCK_BASIS_DATE };
  },
  async getDailyCandles(code, range) {
    const start = rangeStart(MOCK_BASIS_DATE, range);
    return {
      candles: normalizeCandles(mockSeries(code), start, MOCK_BASIS_DATE),
      basisDate: MOCK_BASIS_DATE,
    };
  },
};

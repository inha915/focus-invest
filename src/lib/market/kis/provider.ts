import "server-only";

import { findStock } from "@/lib/stocks";
import type { Candle, ChartRange, Quote } from "@/lib/types";
import { addDays, fromCompact, normalizeCandles, rangeStart, toCompact, todayKst } from "../dates";
import { MarketDataError } from "../errors";
import type { MarketDataProvider } from "../provider";
import { kisGet, type KisBaseResponse } from "./client";
import { readKisConfig } from "./config";

/** 공식 문서: 국내주식기간별시세는 1회 호출에 최대 100건 */
export const KIS_DAILY_PAGE_SIZE = 100;
const MAX_PAGES = 6;

const QUOTE_TTL_MS = 5_000;
const CANDLE_TTL_MS = 60_000;

interface PriceOutput {
  stck_prpr: string; // 현재가
  prdy_vrss: string; // 전일 대비
  prdy_vrss_sign: string; // 1 상한 2 상승 3 보합 4 하한 5 하락
  prdy_ctrt: string; // 전일 대비율
  acml_vol: string; // 누적 거래량
  stck_oprc: string;
  stck_hgpr: string;
  stck_lwpr: string;
  stck_sdpr: string; // 기준가(전일 종가)
}

interface DailyRow {
  stck_bsop_date?: string;
  stck_oprc?: string;
  stck_hgpr?: string;
  stck_lwpr?: string;
  stck_clpr?: string;
  acml_vol?: string;
}

const num = (v: string | undefined) => {
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
};

/** 부호 코드로 방향을 확정 (응답 값 자체의 부호 표기에 의존하지 않음) */
function signed(value: string, signCode: string): number {
  const abs = Math.abs(num(value));
  if (signCode === "4" || signCode === "5") return -abs;
  if (signCode === "3") return 0;
  return abs;
}

const cache = new Map<string, { at: number; value: unknown }>();
async function cached<T>(key: string, ttl: number, load: () => Promise<T>): Promise<T> {
  const hit = cache.get(key);
  if (hit && Date.now() - hit.at < ttl) return hit.value as T;
  const value = await load();
  cache.set(key, { at: Date.now(), value });
  return value;
}

async function fetchQuote(code: string): Promise<Quote> {
  const meta = findStock(code);
  if (!meta) throw new MarketDataError("지원하지 않는 종목입니다.", 404, "UNKNOWN_CODE");
  const config = readKisConfig();

  return cached(`quote:${code}`, QUOTE_TTL_MS, async () => {
    const body = await kisGet<KisBaseResponse & { output?: PriceOutput }>(
      config,
      "/uapi/domestic-stock/v1/quotations/inquire-price",
      "FHKST01010100",
      { FID_COND_MRKT_DIV_CODE: "J", FID_INPUT_ISCD: code },
    );
    const o = body.output;
    if (!o || !num(o.stck_prpr)) {
      throw new MarketDataError(`${meta.name} 현재가 데이터가 비어 있습니다.`, 502, "KIS_EMPTY");
    }
    return {
      code,
      name: meta.name,
      market: meta.market,
      price: num(o.stck_prpr),
      change: signed(o.prdy_vrss, o.prdy_vrss_sign),
      changeRate: signed(o.prdy_ctrt, o.prdy_vrss_sign),
      volume: num(o.acml_vol),
      open: num(o.stck_oprc),
      high: num(o.stck_hgpr),
      low: num(o.stck_lwpr),
      prevClose: num(o.stck_sdpr),
    };
  });
}

function toCandle(row: DailyRow): Candle | null {
  if (!row.stck_bsop_date || !/^\d{8}$/.test(row.stck_bsop_date)) return null;
  return {
    date: fromCompact(row.stck_bsop_date),
    open: num(row.stck_oprc),
    high: num(row.stck_hgpr),
    low: num(row.stck_lwpr),
    close: num(row.stck_clpr),
    volume: num(row.acml_vol),
  };
}

/**
 * 일봉 조회. 응답은 최신순 최대 100건이므로, 100건이 꽉 차서 오면
 * 가장 오래된 거래일 하루 전을 새 종료일로 잡아 시작일에 닿을 때까지 이어서 조회한다.
 */
export async function fetchDailyCandles(code: string, start: string, end: string): Promise<Candle[]> {
  const config = readKisConfig();
  const collected: Candle[] = [];
  let cursorEnd = end;

  for (let page = 0; page < MAX_PAGES && cursorEnd >= start; page++) {
    const body = await kisGet<KisBaseResponse & { output2?: DailyRow[] }>(
      config,
      "/uapi/domestic-stock/v1/quotations/inquire-daily-itemchartprice",
      "FHKST03010100",
      {
        FID_COND_MRKT_DIV_CODE: "J",
        FID_INPUT_ISCD: code,
        FID_INPUT_DATE_1: toCompact(start),
        FID_INPUT_DATE_2: toCompact(cursorEnd),
        FID_PERIOD_DIV_CODE: "D",
        FID_ORG_ADJ_PRC: "0", // 수정주가
      },
    );
    const rows = (body.output2 ?? []).map(toCandle).filter((c): c is Candle => c !== null);
    collected.push(...rows);
    if (rows.length < KIS_DAILY_PAGE_SIZE) break;

    const oldest = rows.reduce((min, c) => (c.date < min ? c.date : min), rows[0].date);
    if (oldest <= start) break;
    cursorEnd = addDays(oldest, -1);
  }

  return normalizeCandles(collected, start, end);
}

export const kisProvider: MarketDataProvider = {
  source: "kis",
  sourceLabel: "한국투자증권 시세",

  async getQuotes(codes) {
    const quotes: Quote[] = [];
    for (const code of codes) quotes.push(await fetchQuote(code));
    // 현재가 API는 기준일을 주지 않으므로 화면에는 조회 시각을 표시한다
    return { quotes, basisDate: null };
  },

  async getDailyCandles(code: string, range: ChartRange) {
    if (!findStock(code)) throw new MarketDataError("지원하지 않는 종목입니다.", 404, "UNKNOWN_CODE");
    const end = todayKst();
    const start = rangeStart(end, range);
    const candles = await cached(`candles:${code}:${start}:${end}`, CANDLE_TTL_MS, () =>
      fetchDailyCandles(code, start, end),
    );
    return { candles, basisDate: candles.at(-1)?.date ?? null };
  },
};

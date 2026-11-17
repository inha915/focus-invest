/**
 * 화면과 API가 공유하는 데이터 형식.
 * mock / kis 어느 프로바이더를 쓰든 Route Handler는 이 형식으로만 응답한다.
 */

export type DataSource = "mock" | "kis";

export type ChartRange = "1M" | "3M" | "6M";

export const CHART_RANGES: { value: ChartRange; label: string; months: number }[] = [
  { value: "1M", label: "1개월", months: 1 },
  { value: "3M", label: "3개월", months: 3 },
  { value: "6M", label: "6개월", months: 6 },
];

export function isChartRange(value: unknown): value is ChartRange {
  return CHART_RANGES.some((r) => r.value === value);
}

export interface Quote {
  code: string;
  name: string;
  market: string;
  /** 현재가(원) */
  price: number;
  /** 전일 대비(원). 하락이면 음수 */
  change: number;
  /** 전일 대비 등락률(%). 하락이면 음수 */
  changeRate: number;
  /** 누적 거래량(주) */
  volume: number;
  open: number;
  high: number;
  low: number;
  /** 전일 종가(기준가) */
  prevClose: number;
}

export interface Candle {
  /** 거래일 YYYY-MM-DD */
  date: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export interface MarketMeta {
  source: DataSource;
  /** 화면에 표시할 출처: "샘플 시세" | "한국투자증권 시세" */
  sourceLabel: string;
  /** 서버가 응답을 만든 시각 (ISO 8601) */
  fetchedAt: string;
  /** 확인 가능한 시세 기준일 YYYY-MM-DD. 알 수 없으면 null (조회 시각만 표시) */
  basisDate: string | null;
}

export interface QuotesResponse {
  meta: MarketMeta;
  quotes: Quote[];
}

export interface QuoteResponse {
  meta: MarketMeta;
  quote: Quote;
}

export interface CandlesResponse {
  meta: MarketMeta;
  code: string;
  range: ChartRange;
  candles: Candle[];
}

export interface ApiErrorBody {
  error: {
    message: string;
    code?: string;
    source: DataSource;
  };
}

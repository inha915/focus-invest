import "server-only";

import type { Candle, ChartRange, DataSource, Quote } from "@/lib/types";
import { MarketDataError } from "./errors";

/** 모든 시세 프로바이더가 구현하는 공통 인터페이스 */
export interface MarketDataProvider {
  readonly source: DataSource;
  readonly sourceLabel: string;
  getQuotes(codes: string[]): Promise<{ quotes: Quote[]; basisDate: string | null }>;
  getDailyCandles(
    code: string,
    range: ChartRange,
  ): Promise<{ candles: Candle[]; basisDate: string | null }>;
}

export function resolveDataSource(): DataSource {
  const raw = (process.env.DATA_PROVIDER ?? "mock").trim().toLowerCase();
  if (raw === "mock" || raw === "") return "mock";
  if (raw === "kis") return "kis";
  throw new MarketDataError(
    `DATA_PROVIDER 값 "${raw}"은(는) 지원하지 않습니다. mock 또는 kis를 사용하세요.`,
    500,
    "INVALID_DATA_PROVIDER",
  );
}

export async function getMarketDataProvider(): Promise<MarketDataProvider> {
  const source = resolveDataSource();
  if (source === "kis") {
    const { kisProvider } = await import("./kis/provider");
    return kisProvider;
  }
  const { mockProvider } = await import("./mock");
  return mockProvider;
}

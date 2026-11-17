import "server-only";

import type { ApiErrorBody, DataSource, MarketMeta } from "@/lib/types";
import { MarketDataError } from "./errors";
import type { MarketDataProvider } from "./provider";
import { resolveDataSource } from "./provider";

export function buildMeta(provider: MarketDataProvider, basisDate: string | null): MarketMeta {
  return {
    source: provider.source,
    sourceLabel: provider.sourceLabel,
    fetchedAt: new Date().toISOString(),
    basisDate,
  };
}

const NO_STORE = { "cache-control": "no-store" };

export function jsonOk<T>(body: T): Response {
  return Response.json(body, { headers: NO_STORE });
}

/** 오류는 그대로 클라이언트에 전달한다. KIS 오류를 샘플 값으로 대체하지 않는다 */
export function jsonError(error: unknown): Response {
  let source: DataSource = "mock";
  try {
    source = resolveDataSource();
  } catch {
    // 잘못된 DATA_PROVIDER 값 자체가 오류인 경우
  }
  const known = error instanceof MarketDataError;
  if (!known) console.error("[market-data]", error);
  const body: ApiErrorBody = {
    error: {
      message: known ? error.message : "시세를 불러오는 중 알 수 없는 오류가 발생했습니다.",
      code: known ? error.code : "UNKNOWN",
      source,
    },
  };
  return Response.json(body, { status: known ? error.status : 500, headers: NO_STORE });
}

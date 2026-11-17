import { connection, type NextRequest } from "next/server";

import { MarketDataError } from "@/lib/market/errors";
import { getMarketDataProvider } from "@/lib/market/provider";
import { buildMeta, jsonError, jsonOk } from "@/lib/market/respond";
import { isSupportedCode, STOCK_CODES } from "@/lib/stocks";
import type { QuotesResponse } from "@/lib/types";

/** GET /api/quotes?codes=005930,000660  (codes 생략 시 지원 종목 전체) */
export async function GET(request: NextRequest) {
  await connection(); // 요청 시점에만 실행 (프리렌더 제외). try 밖에서 호출해야 한다
  try {
    const param = request.nextUrl.searchParams.get("codes");
    const codes = param
      ? [...new Set(param.split(",").map((c) => c.trim()).filter(Boolean))]
      : STOCK_CODES;
    const unknown = codes.filter((c) => !isSupportedCode(c));
    if (unknown.length > 0) {
      throw new MarketDataError(`지원하지 않는 종목코드: ${unknown.join(", ")}`, 400, "UNKNOWN_CODE");
    }

    const provider = await getMarketDataProvider();
    const { quotes, basisDate } = await provider.getQuotes(codes);
    const body: QuotesResponse = { meta: buildMeta(provider, basisDate), quotes };
    return jsonOk(body);
  } catch (error) {
    return jsonError(error);
  }
}

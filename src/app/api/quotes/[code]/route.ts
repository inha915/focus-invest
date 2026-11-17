import { connection, type NextRequest } from "next/server";

import { MarketDataError } from "@/lib/market/errors";
import { getMarketDataProvider } from "@/lib/market/provider";
import { buildMeta, jsonError, jsonOk } from "@/lib/market/respond";
import { isSupportedCode } from "@/lib/stocks";
import type { QuoteResponse } from "@/lib/types";

/** GET /api/quotes/005930 */
export async function GET(_request: NextRequest, ctx: RouteContext<"/api/quotes/[code]">) {
  await connection(); // 요청 시점에만 실행 (프리렌더 제외). try 밖에서 호출해야 한다
  try {
    const { code } = await ctx.params;
    if (!isSupportedCode(code)) {
      throw new MarketDataError("지원하지 않는 종목입니다.", 404, "UNKNOWN_CODE");
    }
    const provider = await getMarketDataProvider();
    const { quotes, basisDate } = await provider.getQuotes([code]);
    const body: QuoteResponse = { meta: buildMeta(provider, basisDate), quote: quotes[0] };
    return jsonOk(body);
  } catch (error) {
    return jsonError(error);
  }
}

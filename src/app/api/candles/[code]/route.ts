import { connection, type NextRequest } from "next/server";

import { MarketDataError } from "@/lib/market/errors";
import { getMarketDataProvider } from "@/lib/market/provider";
import { buildMeta, jsonError, jsonOk } from "@/lib/market/respond";
import { isSupportedCode } from "@/lib/stocks";
import { isChartRange, type CandlesResponse } from "@/lib/types";

/** GET /api/candles/005930?range=1M|3M|6M  → 거래일 오름차순 일봉 */
export async function GET(request: NextRequest, ctx: RouteContext<"/api/candles/[code]">) {
  await connection(); // 요청 시점에만 실행 (프리렌더 제외). try 밖에서 호출해야 한다
  try {
    const { code } = await ctx.params;
    if (!isSupportedCode(code)) {
      throw new MarketDataError("지원하지 않는 종목입니다.", 404, "UNKNOWN_CODE");
    }
    const range = request.nextUrl.searchParams.get("range") ?? "1M";
    if (!isChartRange(range)) {
      throw new MarketDataError("range는 1M, 3M, 6M 중 하나여야 합니다.", 400, "INVALID_RANGE");
    }

    const provider = await getMarketDataProvider();
    const { candles, basisDate } = await provider.getDailyCandles(code, range);
    const body: CandlesResponse = { meta: buildMeta(provider, basisDate), code, range, candles };
    return jsonOk(body);
  } catch (error) {
    return jsonError(error);
  }
}

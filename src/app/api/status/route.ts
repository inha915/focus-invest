import { connection } from "next/server";

import { resolveDataSource } from "@/lib/market/provider";
import { jsonError, jsonOk } from "@/lib/market/respond";

/** GET /api/status → 현재 시세 모드 (키 값은 절대 노출하지 않고 설정 여부만) */
export async function GET() {
  await connection();
  try {
    const source = resolveDataSource();
    return jsonOk({
      source,
      sourceLabel: source === "kis" ? "한국투자증권 시세" : "샘플 시세",
      kisEnv: source === "kis" ? (process.env.KIS_ENV === "vts" ? "모의투자" : "실전투자") : null,
      kisConfigured: Boolean(process.env.KIS_APP_KEY && process.env.KIS_APP_SECRET),
    });
  } catch (error) {
    return jsonError(error);
  }
}

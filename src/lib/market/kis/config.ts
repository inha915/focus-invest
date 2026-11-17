import "server-only";

import { MarketDataError } from "../errors";

export type KisEnv = "real" | "vts";

export interface KisConfig {
  appKey: string;
  appSecret: string;
  env: KisEnv;
  baseUrl: string;
  /** 연속 호출 사이 최소 간격(ms). 실전 초당 20건, 모의 초당 2건 제한을 넘지 않도록 */
  minIntervalMs: number;
}

const BASE_URLS: Record<KisEnv, string> = {
  real: "https://openapi.koreainvestment.com:9443",
  vts: "https://openapivts.koreainvestment.com:29443",
};

export function readKisConfig(): KisConfig {
  const appKey = process.env.KIS_APP_KEY?.trim();
  const appSecret = process.env.KIS_APP_SECRET?.trim();
  if (!appKey || !appSecret) {
    throw new MarketDataError(
      "KIS_APP_KEY, KIS_APP_SECRET 환경변수가 설정되지 않았습니다. .env.local을 확인하세요.",
      500,
      "KIS_CONFIG_MISSING",
    );
  }
  const env: KisEnv = process.env.KIS_ENV?.trim().toLowerCase() === "vts" ? "vts" : "real";
  return {
    appKey,
    appSecret,
    env,
    baseUrl: process.env.KIS_BASE_URL?.trim() || BASE_URLS[env],
    minIntervalMs: env === "vts" ? 550 : 70,
  };
}

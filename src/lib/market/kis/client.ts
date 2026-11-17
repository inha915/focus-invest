import "server-only";

import { MarketDataError } from "../errors";
import { getAccessToken, invalidateAccessToken } from "./auth";
import type { KisConfig } from "./config";

export interface KisBaseResponse {
  rt_cd?: string;
  msg_cd?: string;
  msg1?: string;
}

/** 초당 호출 건수 제한(EGW00201)과 토큰 만료(EGW00123) 코드 */
const RATE_LIMIT_CODE = "EGW00201";
const TOKEN_EXPIRED_CODES = new Set(["EGW00123", "EGW00121"]);

const throttle = globalThis as typeof globalThis & { __focusKisQueue?: Promise<void> };

/** 모든 KIS 호출을 직렬화하고 최소 간격을 둔다 */
function schedule<T>(config: KisConfig, task: () => Promise<T>): Promise<T> {
  const prev = throttle.__focusKisQueue ?? Promise.resolve();
  const run = prev.then(task);
  throttle.__focusKisQueue = run
    .catch(() => undefined)
    .then(() => new Promise<void>((r) => setTimeout(r, config.minIntervalMs)));
  return run;
}

const wait = (ms: number) => new Promise((r) => setTimeout(r, ms));

/** KIS 시세 조회 GET 요청. 성공(rt_cd === "0")이 아니면 MarketDataError를 던진다 */
export async function kisGet<T extends KisBaseResponse>(
  config: KisConfig,
  path: string,
  trId: string,
  params: Record<string, string>,
  attempt = 0,
): Promise<T> {
  const token = await getAccessToken(config);
  const url = `${config.baseUrl}${path}?${new URLSearchParams(params)}`;

  const body = await schedule(config, async () => {
    let res: Response;
    try {
      res = await fetch(url, {
        headers: {
          "content-type": "application/json; charset=utf-8",
          authorization: `Bearer ${token}`,
          appkey: config.appKey,
          appsecret: config.appSecret,
          tr_id: trId,
          custtype: "P",
        },
        cache: "no-store",
      });
    } catch {
      throw new MarketDataError("한국투자증권 시세 서버에 연결하지 못했습니다.", 502, "KIS_NETWORK");
    }
    const json = (await res.json().catch(() => ({}))) as T;
    if (!res.ok && !json.msg_cd) {
      throw new MarketDataError(
        `한국투자증권 시세 조회에 실패했습니다. (HTTP ${res.status})`,
        502,
        `HTTP_${res.status}`,
      );
    }
    return json;
  });

  if (body.rt_cd === "0") return body;

  if (attempt === 0 && body.msg_cd === RATE_LIMIT_CODE) {
    await wait(1100);
    return kisGet(config, path, trId, params, attempt + 1);
  }
  if (attempt === 0 && body.msg_cd && TOKEN_EXPIRED_CODES.has(body.msg_cd)) {
    await invalidateAccessToken();
    return kisGet(config, path, trId, params, attempt + 1);
  }

  throw new MarketDataError(
    `한국투자증권 응답 오류: ${body.msg1?.trim() || "알 수 없는 오류"}`,
    502,
    body.msg_cd,
  );
}

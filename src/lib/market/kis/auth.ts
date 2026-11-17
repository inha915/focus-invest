import "server-only";

import { createHash } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

import { MarketDataError } from "../errors";
import type { KisConfig } from "./config";

/**
 * KIS 접근 토큰 관리.
 * - 토큰은 약 24시간 유효하고, 발급할 때마다 알림톡이 발송되므로 만료 전까지 재사용한다.
 * - 1차: 프로세스 메모리(globalThis, 개발 서버 HMR에도 유지)
 * - 2차: 로컬 파일 캐시(.cache/kis-token.json, gitignore 대상). 서버 재시작 시 재발급을 피한다.
 *   쓰기 불가능한 환경(서버리스 등)에서는 조용히 메모리 캐시만 사용한다.
 * - 동시에 여러 요청이 들어와도 발급 요청은 한 번만 보낸다.
 */

interface CachedToken {
  /** 앱키 해시 + 환경. 키가 바뀌면 캐시를 쓰지 않는다 */
  keyId: string;
  accessToken: string;
  /** 만료 시각 (epoch ms) */
  expiresAt: number;
}

interface TokenResponse {
  access_token?: string;
  token_type?: string;
  expires_in?: number;
  /** "YYYY-MM-DD HH:mm:ss" (한국 시간) */
  access_token_token_expired?: string;
  error_code?: string;
  error_description?: string;
}

const REFRESH_MARGIN_MS = 10 * 60 * 1000;
const cacheFile = () =>
  process.env.KIS_TOKEN_CACHE_FILE || path.join(process.cwd(), ".cache", "kis-token.json");

const store = globalThis as typeof globalThis & {
  __focusKisToken?: CachedToken;
  __focusKisTokenPromise?: Promise<CachedToken>;
};

function keyIdOf(config: KisConfig): string {
  const hash = createHash("sha256").update(config.appKey).digest("hex").slice(0, 16);
  return `${config.env}:${hash}`;
}

function isUsable(token: CachedToken | undefined, keyId: string): token is CachedToken {
  return !!token && token.keyId === keyId && token.expiresAt - REFRESH_MARGIN_MS > Date.now();
}

async function readFileCache(): Promise<CachedToken | undefined> {
  try {
    return JSON.parse(await readFile(/*turbopackIgnore: true*/ cacheFile(), "utf8")) as CachedToken;
  } catch {
    return undefined;
  }
}

async function writeFileCache(token: CachedToken): Promise<void> {
  try {
    await mkdir(/*turbopackIgnore: true*/ path.dirname(cacheFile()), { recursive: true });
    await writeFile(/*turbopackIgnore: true*/ cacheFile(), JSON.stringify(token), "utf8");
  } catch {
    // 파일 시스템을 쓸 수 없는 환경이면 메모리 캐시만 사용
  }
}

function parseExpiry(body: TokenResponse): number {
  const raw = body.access_token_token_expired;
  if (raw && /^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/.test(raw)) {
    return new Date(`${raw.replace(" ", "T")}+09:00`).getTime();
  }
  return Date.now() + (body.expires_in ?? 86_400) * 1000;
}

async function issueToken(config: KisConfig, keyId: string): Promise<CachedToken> {
  let res: Response;
  try {
    res = await fetch(`${config.baseUrl}/oauth2/tokenP`, {
      method: "POST",
      headers: { "content-type": "application/json; charset=utf-8" },
      body: JSON.stringify({
        grant_type: "client_credentials",
        appkey: config.appKey,
        appsecret: config.appSecret,
      }),
      cache: "no-store",
    });
  } catch {
    throw new MarketDataError("한국투자증권 인증 서버에 연결하지 못했습니다.", 502, "KIS_NETWORK");
  }

  const body = (await res.json().catch(() => ({}))) as TokenResponse;
  if (!res.ok || !body.access_token) {
    const detail = body.error_description ? ` (${body.error_description})` : "";
    throw new MarketDataError(
      `한국투자증권 접근 토큰 발급에 실패했습니다${detail}.`,
      502,
      body.error_code ?? "KIS_TOKEN_FAILED",
    );
  }

  return { keyId, accessToken: body.access_token, expiresAt: parseExpiry(body) };
}

export async function getAccessToken(config: KisConfig): Promise<string> {
  const keyId = keyIdOf(config);
  if (isUsable(store.__focusKisToken, keyId)) return store.__focusKisToken.accessToken;

  if (!store.__focusKisTokenPromise) {
    store.__focusKisTokenPromise = (async () => {
      const fromFile = await readFileCache();
      if (isUsable(fromFile, keyId)) return fromFile;
      const issued = await issueToken(config, keyId);
      await writeFileCache(issued);
      return issued;
    })().finally(() => {
      store.__focusKisTokenPromise = undefined;
    });
  }

  const token = await store.__focusKisTokenPromise;
  store.__focusKisToken = token;
  return token.accessToken;
}

/** 서버가 토큰 만료를 알려온 경우 캐시를 비운다 */
export async function invalidateAccessToken(): Promise<void> {
  store.__focusKisToken = undefined;
  await writeFileCache({ keyId: "", accessToken: "", expiresAt: 0 });
}

/**
 * KIS 프로바이더 단위 테스트 (네트워크 없이 가짜 fetch 사용).
 * 실행: npm test
 */
import assert from "node:assert/strict";
import { mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { beforeEach, describe, test } from "node:test";

process.env.KIS_APP_KEY = "test-app-key";
process.env.KIS_APP_SECRET = "test-app-secret";
process.env.KIS_ENV = "real";
process.env.KIS_TOKEN_CACHE_FILE = path.join(mkdtempSync(path.join(tmpdir(), "focus-")), "token.json");

const { fetchDailyCandles, kisProvider, KIS_DAILY_PAGE_SIZE } = await import("../src/lib/market/kis/provider");
const { addDays } = await import("../src/lib/market/dates");

type Handler = (url: URL, init?: RequestInit) => unknown;
const calls: { path: string; params: URLSearchParams }[] = [];
let handler: Handler;

globalThis.fetch = (async (input: string | URL | Request, init?: RequestInit) => {
  const url = new URL(typeof input === "string" ? input : input instanceof URL ? input.href : input.url);
  calls.push({ path: url.pathname, params: url.searchParams });
  return new Response(JSON.stringify(handler(url, init)), { status: 200 });
}) as typeof fetch;

const tokenBody = {
  access_token: "fake-token",
  token_type: "Bearer",
  expires_in: 86400,
  access_token_token_expired: "2099-01-01 00:00:00",
};

/** 시작~종료 구간의 평일을 최신순으로, 최대 100건까지 돌려주는 가짜 기간별시세 서버 */
function dailyServer(url: URL) {
  const d1 = url.searchParams.get("FID_INPUT_DATE_1")!;
  const d2 = url.searchParams.get("FID_INPUT_DATE_2")!;
  const iso = (c: string) => `${c.slice(0, 4)}-${c.slice(4, 6)}-${c.slice(6, 8)}`;
  const rows = [];
  for (let d = iso(d2); d >= iso(d1); d = addDays(d, -1)) {
    const dow = new Date(`${d}T00:00:00Z`).getUTCDay();
    if (dow === 0 || dow === 6) continue;
    rows.push({
      stck_bsop_date: d.replaceAll("-", ""),
      stck_oprc: "1000",
      stck_hgpr: "1100",
      stck_lwpr: "900",
      stck_clpr: "1050",
      acml_vol: "12345",
    });
    if (rows.length === KIS_DAILY_PAGE_SIZE) break;
  }
  return { rt_cd: "0", msg_cd: "MCA00000", msg1: "정상", output1: {}, output2: rows };
}

beforeEach(() => {
  calls.length = 0;
});

describe("KIS 기간별시세 분할 조회", () => {
  test("6개월(100건 초과)은 날짜 구간을 나눠 조회하고 정렬·중복 제거한다", async () => {
    handler = (url) => (url.pathname === "/oauth2/tokenP" ? tokenBody : dailyServer(url));

    const start = "2026-05-18";
    const end = "2026-11-17";
    const candles = await fetchDailyCandles("005930", start, end);

    const dailyCalls = calls.filter((c) => c.path.endsWith("inquire-daily-itemchartprice"));
    assert.equal(dailyCalls.length, 2, "100건 + 나머지로 2회 호출");
    assert.equal(dailyCalls[0].params.get("FID_PERIOD_DIV_CODE"), "D");
    assert.equal(dailyCalls[0].params.get("FID_ORG_ADJ_PRC"), "0");
    assert.equal(dailyCalls[0].params.get("FID_INPUT_DATE_1"), "20260518");
    assert.equal(dailyCalls[0].params.get("FID_INPUT_DATE_2"), "20261117");

    const dates = candles.map((c) => c.date);
    assert.deepEqual(dates, [...dates].sort(), "거래일 오름차순");
    assert.equal(new Set(dates).size, dates.length, "중복 없음");
    assert.ok(dates[0] >= start && dates.at(-1)! <= end);
    assert.ok(candles.length > KIS_DAILY_PAGE_SIZE, `6개월 일봉 ${candles.length}건`);
  });

  test("응답이 겹치거나 빈 행이 섞여도 중복 없이 정리한다", async () => {
    let page = 0;
    handler = (url) => {
      if (url.pathname === "/oauth2/tokenP") return tokenBody;
      page += 1;
      const body = dailyServer(url);
      // 두 번째 페이지에 첫 페이지와 같은 날짜 + 빈 객체를 섞는다
      if (page === 2) body.output2.unshift({ stck_bsop_date: "20261117", stck_oprc: "1", stck_hgpr: "1", stck_lwpr: "1", stck_clpr: "1", acml_vol: "1" }, {} as never);
      return body;
    };
    const candles = await fetchDailyCandles("005930", "2026-05-18", "2026-11-17");
    const dates = candles.map((c) => c.date);
    assert.equal(new Set(dates).size, dates.length);
    assert.deepEqual(dates, [...dates].sort());
  });
});

describe("KIS 현재가", () => {
  test("부호 코드(5=하락)로 하락을 음수로 변환하고, 토큰은 재사용한다", async () => {
    handler = (url) => {
      if (url.pathname === "/oauth2/tokenP") return tokenBody;
      return {
        rt_cd: "0",
        msg_cd: "MCA00000",
        msg1: "정상",
        output: {
          stck_prpr: "71000",
          prdy_vrss: "500", // 응답 값의 부호와 무관하게 sign 코드로 판단
          prdy_vrss_sign: "5",
          prdy_ctrt: "0.70",
          acml_vol: "1234567",
          stck_oprc: "71500",
          stck_hgpr: "72000",
          stck_lwpr: "70500",
          stck_sdpr: "71500",
        },
      };
    };
    const { quotes, basisDate } = await kisProvider.getQuotes(["000660"]);
    assert.equal(basisDate, null, "현재가 API는 기준일 대신 조회 시각을 표시");
    assert.equal(quotes[0].price, 71000);
    assert.equal(quotes[0].change, -500);
    assert.equal(quotes[0].changeRate, -0.7);
    assert.equal(quotes[0].volume, 1234567);

    const headers = calls.filter((c) => c.path.endsWith("inquire-price"));
    assert.equal(headers[0].params.get("FID_INPUT_ISCD"), "000660");
    assert.equal(calls.filter((c) => c.path === "/oauth2/tokenP").length, 0, "이전 테스트에서 받은 토큰 재사용");
  });

  test("KIS 오류 응답은 샘플 값으로 대체하지 않고 오류를 던진다", async () => {
    handler = (url) =>
      url.pathname === "/oauth2/tokenP" ? tokenBody : { rt_cd: "1", msg_cd: "EGW00999", msg1: "테스트 오류" };
    await assert.rejects(kisProvider.getQuotes(["035420"]), /테스트 오류/);
  });

  test("초당 호출 제한(EGW00201)은 한 번 기다렸다 재시도한다", async () => {
    let n = 0;
    handler = (url) => {
      if (url.pathname === "/oauth2/tokenP") return tokenBody;
      n += 1;
      if (n === 1) return { rt_cd: "1", msg_cd: "EGW00201", msg1: "초당 거래건수를 초과하였습니다." };
      return {
        rt_cd: "0",
        output: { stck_prpr: "100", prdy_vrss: "1", prdy_vrss_sign: "2", prdy_ctrt: "1.01", acml_vol: "1", stck_oprc: "99", stck_hgpr: "100", stck_lwpr: "99", stck_sdpr: "99" },
      };
    };
    const { quotes } = await kisProvider.getQuotes(["035720"]);
    assert.equal(quotes[0].change, 1);
    assert.equal(n, 2);
  });
});

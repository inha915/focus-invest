/**
 * 앱이 지원하는 종목 공통 목록.
 * 홈, 검색, 관심, 상세, API 검증이 모두 이 목록을 기준으로 동작한다.
 */

export interface StockMeta {
  code: string;
  name: string;
  market: "KOSPI" | "KOSDAQ";
  /** 검색 보조어 (영문명 등) */
  aliases?: string[];
}

export const STOCKS: readonly StockMeta[] = [
  { code: "005930", name: "삼성전자", market: "KOSPI", aliases: ["samsung"] },
  { code: "000660", name: "SK하이닉스", market: "KOSPI", aliases: ["sk hynix", "하이닉스"] },
  { code: "035420", name: "NAVER", market: "KOSPI", aliases: ["네이버"] },
  { code: "035720", name: "카카오", market: "KOSPI", aliases: ["kakao"] },
  { code: "005380", name: "현대차", market: "KOSPI", aliases: ["hyundai", "현대자동차"] },
  { code: "373220", name: "LG에너지솔루션", market: "KOSPI", aliases: ["lg energy", "엘지에너지솔루션"] },
  { code: "207940", name: "삼성바이오로직스", market: "KOSPI", aliases: ["samsung biologics"] },
  { code: "068270", name: "셀트리온", market: "KOSPI", aliases: ["celltrion"] },
] as const;

export const STOCK_CODES = STOCKS.map((s) => s.code);

export function findStock(code: string): StockMeta | undefined {
  return STOCKS.find((s) => s.code === code);
}

export function isSupportedCode(code: string): boolean {
  return STOCKS.some((s) => s.code === code);
}

function normalize(text: string): string {
  return text.toLowerCase().replace(/\s+/g, "");
}

/** 종목명(부분 일치), 보조어, 종목코드(앞자리 일치)로 검색 */
export function searchStocks(query: string): StockMeta[] {
  const q = normalize(query);
  if (!q) return [];
  return STOCKS.filter(
    (s) =>
      normalize(s.name).includes(q) ||
      s.code.startsWith(q) ||
      (s.aliases ?? []).some((a) => normalize(a).includes(q)),
  );
}

import type { ChatMessage, ChatRequest, ChatResponder, StockContext } from "./types";

/**
 * 데모 응답기. 미리 작성한 예시 답변만 돌려준다.
 * 실제 시세를 분석하지 않으며, 비교 항목과 지표의 뜻을 설명하는 수준으로 작성했다.
 */

export const EXAMPLE_QUESTIONS = [
  "삼성전자와 SK하이닉스 비교할 때 뭘 보면 돼?",
  "이 종목의 거래량은 어떻게 읽어?",
] as const;

const DISCLAIMER =
  "※ 미리 작성된 예시 응답이에요. 실제 시세나 재무 데이터를 분석한 결과가 아니며, 투자 권유가 아닙니다.";

function normalize(text: string): string {
  return text.toLowerCase().replace(/[\s?!.,~]/g, "");
}

function isCompareQuestion(q: string): boolean {
  const mentionsPair = (q.includes("삼성") || q.includes("samsung")) && (q.includes("하이닉스") || q.includes("hynix"));
  return mentionsPair && (q.includes("비교") || q.includes("뭘보") || q.includes("차이"));
}

function isVolumeQuestion(q: string): boolean {
  return q.includes("거래량");
}

function compareAnswer(): string {
  return [
    "두 회사는 모두 반도체 기업이지만 사업 구성이 달라서, 아래 항목을 나란히 놓고 보면 비교하기 쉬워요.",
    "",
    "1. 사업 구성 — 매출에서 메모리 반도체가 차지하는 비중을 보세요. 메모리 비중이 높을수록 메모리 가격 흐름에 실적이 더 민감하게 움직입니다. 메모리 외 사업(스마트폰·가전·파운드리 등)이 있는지도 함께 확인하세요.",
    "2. 실적 추이 — 매출과 영업이익을 분기별로 이어서 보고, 영업이익률(영업이익 ÷ 매출)이 어떻게 변하는지 비교하세요.",
    "3. 밸류에이션 — PER(주가 ÷ 주당순이익)은 이익 대비 주가 수준을, PBR(주가 ÷ 주당순자산)은 자산 대비 주가 수준을 뜻해요. 반도체처럼 이익 변동이 큰 업종은 PER이 시점에 따라 크게 달라질 수 있어 PBR을 같이 보는 경우가 많아요.",
    "4. 업황 지표 — D램·낸드 가격 동향, 재고 수준, 설비투자(CAPEX) 계획은 두 회사에 공통으로 영향을 줍니다.",
    "5. 재무 안정성과 주주환원 — 부채비율, 현금성 자산, 배당 정책을 확인하세요.",
    "",
    "같은 기간, 같은 기준(연결/별도)으로 맞춰 비교하는 것이 중요해요.",
  ].join("\n");
}

function volumeAnswer(stock?: StockContext): string {
  const intro = stock
    ? `${stock.name}(${stock.code})의 거래량을 볼 때 참고할 일반적인 읽는 법이에요.`
    : "거래량을 읽는 일반적인 방법이에요. 종목 상세에서 'AI에게 물어보기'로 들어오면 선택한 종목이 함께 표시돼요.";
  return [
    intro,
    "",
    "1. 거래량의 뜻 — 하루 동안 사고팔린 주식 수예요. 화면의 거래량은 그날 누적 값이라 장중에는 계속 늘어납니다.",
    "2. 평소와 비교하기 — 하루 숫자만으로는 많고 적음을 판단하기 어려워요. 최근 20일 평균처럼 평소 수준과 비교해 보세요.",
    "3. 가격과 함께 보기 — 가격이 오르며 거래량도 늘었는지, 거래량 없이 가격만 움직였는지를 같이 보면 움직임에 얼마나 많은 참여가 있었는지 가늠할 수 있어요.",
    "4. 갑자기 늘었을 때 — 공시, 실적 발표, 뉴스 같은 이벤트가 있었는지 먼저 확인하세요.",
    "5. 거래대금도 확인 — 주가 수준이 다른 종목끼리는 거래량보다 거래대금(거래량 × 가격)으로 비교하는 편이 공정해요.",
  ].join("\n");
}

function fallbackAnswer(): string {
  return "아직 데모 채팅이라 미리 준비한 질문에만 답할 수 있어요. 아래 예시 질문 중 하나를 눌러 보세요.";
}

let seq = 0;
export function createMessageId(): string {
  seq += 1;
  return `m${Date.now().toString(36)}${seq}`;
}

/** 질문 → 예시 응답 텍스트 (순수 함수, 테스트하기 쉽도록 분리) */
export function buildDemoReply(message: string, stock?: StockContext): Omit<ChatMessage, "id"> {
  const q = normalize(message);
  if (isCompareQuestion(q)) {
    return { role: "assistant", demo: true, text: `${compareAnswer()}\n\n${DISCLAIMER}` };
  }
  if (isVolumeQuestion(q)) {
    return { role: "assistant", demo: true, text: `${volumeAnswer(stock)}\n\n${DISCLAIMER}` };
  }
  return {
    role: "assistant",
    demo: true,
    text: fallbackAnswer(),
    suggestions: [...EXAMPLE_QUESTIONS],
  };
}

export function createDemoResponder(delayMs = 500): ChatResponder {
  return {
    label: "데모 채팅",
    async reply({ message, stock }: ChatRequest) {
      await new Promise((r) => setTimeout(r, delayMs));
      return { id: createMessageId(), ...buildDemoReply(message, stock) };
    },
  };
}

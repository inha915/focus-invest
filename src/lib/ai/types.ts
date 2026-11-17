/**
 * 채팅 도메인 타입. UI는 이 타입과 ChatResponder 인터페이스에만 의존한다.
 * 실제 채팅 API로 교체할 때는 ChatResponder 구현만 바꾸면 된다.
 */

export interface StockContext {
  code: string;
  name: string;
}

export type ChatRole = "user" | "assistant";

export interface ChatMessage {
  id: string;
  role: ChatRole;
  text: string;
  /** 미리 작성된 데모 응답 여부 (말풍선에 "예시 응답" 표시) */
  demo?: boolean;
  /** 이어서 눌러볼 수 있는 추천 질문 */
  suggestions?: string[];
}

export interface ChatRequest {
  message: string;
  stock?: StockContext;
  history: ChatMessage[];
}

export interface ChatResponder {
  /** 응답 생성기 이름 (화면 배지용) */
  readonly label: string;
  reply(request: ChatRequest): Promise<ChatMessage>;
}

"use client";

import { ArrowUp, Sparkles, X } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useRef, useState, type FormEvent } from "react";

import { AppHeader } from "@/components/AppHeader";
import { createDemoResponder, createMessageId, EXAMPLE_QUESTIONS } from "@/lib/ai/demo-responder";
import type { ChatMessage, ChatResponder, StockContext } from "@/lib/ai/types";
import { findStock } from "@/lib/stocks";

/**
 * 채팅 UI. 응답 생성은 ChatResponder에 위임한다.
 * 실제 채팅 API로 바꿀 때는 아래 responder 생성부만 교체하면 된다.
 */
export function ChatView({ responder: injected }: { responder?: ChatResponder }) {
  const responder = useMemo(() => injected ?? createDemoResponder(), [injected]);
  const router = useRouter();
  const searchParams = useSearchParams();
  const code = searchParams.get("code");
  const stock: StockContext | undefined = useMemo(() => {
    const meta = code ? findStock(code) : undefined;
    return meta ? { code: meta.code, name: meta.name } : undefined;
  }, [code]);

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [pending, setPending] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages, pending]);

  async function send(text: string) {
    const message = text.trim();
    if (!message || pending) return;
    const userMessage: ChatMessage = { id: createMessageId(), role: "user", text: message };
    const history = [...messages, userMessage];
    setMessages(history);
    setInput("");
    setPending(true);
    try {
      const reply = await responder.reply({ message, stock, history });
      setMessages((prev) => [...prev, reply]);
    } catch {
      setMessages((prev) => [
        ...prev,
        { id: createMessageId(), role: "assistant", text: "응답을 만들지 못했어요. 잠시 후 다시 시도해 주세요." },
      ]);
    } finally {
      setPending(false);
    }
  }

  function onSubmit(e: FormEvent) {
    e.preventDefault();
    void send(input);
  }

  return (
    <div className="flex flex-1 flex-col">
      <AppHeader
        title={
          <>
            <h1>AI</h1>
            <span
              className="rounded-full bg-brand-soft px-2 py-0.5 text-[12px] font-semibold text-brand-strong"
              data-testid="demo-badge"
            >
              {responder.label}
            </span>
          </>
        }
      />

      {stock && (
        <div
          className="mx-5 mb-1 flex items-center gap-2 rounded-2xl bg-surface px-4 py-3"
          data-testid="stock-context"
        >
          <div className="min-w-0 flex-1">
            <p className="text-[12px] text-muted">선택한 종목</p>
            <p className="truncate text-[15px] font-semibold text-ink">
              {stock.name} <span className="num font-medium text-muted">{stock.code}</span>
            </p>
          </div>
          <button
            type="button"
            onClick={() => router.replace("/ai")}
            aria-label="선택한 종목 지우기"
            className="flex size-8 items-center justify-center rounded-full text-muted hover:bg-line"
          >
            <X size={18} />
          </button>
        </div>
      )}

      <div className="flex-1 px-5 pb-4" aria-live="polite">
        {messages.length === 0 && (
          <div className="pt-6">
            <div className="flex size-12 items-center justify-center rounded-2xl bg-brand-soft">
              <Sparkles className="text-brand" size={24} />
            </div>
            <p className="mt-4 text-[20px] font-bold leading-snug text-ink">
              무엇이 궁금하세요?
            </p>
            <p className="mt-1.5 text-[14px] leading-relaxed text-muted">
              데모 채팅은 아래 예시 질문에 미리 작성된 답변을 보여줘요. 실제 시세를 분석하지 않아요.
            </p>
          </div>
        )}

        <ul className="mt-4 space-y-3">
          {messages.map((m) => (
            <li key={m.id} className={`bubble-in flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
              <div className={`max-w-[86%] ${m.role === "user" ? "" : "space-y-2"}`}>
                <div
                  data-testid={m.role === "user" ? "user-bubble" : "assistant-bubble"}
                  className={`whitespace-pre-line rounded-[20px] px-4 py-3 text-[15px] leading-relaxed ${
                    m.role === "user"
                      ? "rounded-br-md bg-brand text-white"
                      : "rounded-bl-md bg-line text-ink"
                  }`}
                >
                  {m.demo && (
                    <span className="mb-1.5 block text-[11px] font-semibold text-muted">예시 응답</span>
                  )}
                  {m.text}
                </div>
                {m.suggestions && <SuggestionChips questions={m.suggestions} onPick={send} disabled={pending} />}
              </div>
            </li>
          ))}
          {pending && (
            <li className="flex justify-start" aria-label="응답 작성 중">
              <div className="flex gap-1 rounded-[20px] rounded-bl-md bg-line px-4 py-4">
                {[0, 150, 300].map((d) => (
                  <span
                    key={d}
                    className="size-1.5 animate-bounce rounded-full bg-muted"
                    style={{ animationDelay: `${d}ms` }}
                  />
                ))}
              </div>
            </li>
          )}
        </ul>
        <div ref={bottomRef} className="scroll-mb-[200px]" />
      </div>

      <div className="sticky bottom-[calc(64px+env(safe-area-inset-bottom))] bg-white px-5 pb-3 pt-2">
        {messages.length === 0 && (
          <div className="mb-3">
            <p className="mb-2 text-[13px] font-semibold text-sub">예시 질문</p>
            <SuggestionChips questions={[...EXAMPLE_QUESTIONS]} onPick={send} disabled={pending} />
          </div>
        )}
        <form onSubmit={onSubmit} className="flex items-center gap-2 rounded-2xl bg-line py-1.5 pl-4 pr-1.5">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={stock ? `${stock.name}에 대해 물어보세요` : "질문을 입력하세요"}
            aria-label="질문 입력"
            className="min-w-0 flex-1 bg-transparent text-[16px] text-ink outline-none placeholder:text-faint"
          />
          <button
            type="submit"
            disabled={!input.trim() || pending}
            aria-label="보내기"
            className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-brand text-white transition-opacity disabled:opacity-30"
          >
            <ArrowUp size={20} strokeWidth={2.5} />
          </button>
        </form>
      </div>
    </div>
  );
}

function SuggestionChips({
  questions,
  onPick,
  disabled,
}: {
  questions: string[];
  onPick: (q: string) => void;
  disabled?: boolean;
}) {
  return (
    <div className="flex flex-col items-start gap-2">
      {questions.map((q) => (
        <button
          key={q}
          type="button"
          disabled={disabled}
          onClick={() => onPick(q)}
          className="max-w-full rounded-full border border-[#d6e6ff] bg-white px-3.5 py-2 text-left text-[14px] font-medium text-brand-strong hover:bg-brand-soft disabled:opacity-50"
        >
          {q}
        </button>
      ))}
    </div>
  );
}

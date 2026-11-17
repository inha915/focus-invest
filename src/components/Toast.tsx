"use client";

import { useCallback, useEffect, useRef, useState } from "react";

/** 하단 탭 위에 잠깐 뜨는 안내 메시지 */
export function useToast() {
  const [message, setMessage] = useState<string | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  const show = useCallback((text: string) => {
    setMessage(text);
    clearTimeout(timer.current);
    timer.current = setTimeout(() => setMessage(null), 2200);
  }, []);

  useEffect(() => () => clearTimeout(timer.current), []);

  const node = message ? (
    <div className="pointer-events-none fixed inset-x-0 bottom-[calc(80px+env(safe-area-inset-bottom))] z-[60] mx-auto flex w-full max-w-[480px] justify-center px-5">
      <p role="status" className="fade-in rounded-2xl bg-ink/90 px-4 py-3 text-[14px] font-medium text-white shadow-lg">
        {message}
      </p>
    </div>
  ) : null;

  return { toast: node, showToast: show };
}

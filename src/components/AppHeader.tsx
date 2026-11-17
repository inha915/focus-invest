"use client";

import { Menu } from "lucide-react";
import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";

import { MenuDrawer } from "@/components/MenuDrawer";

/**
 * 탭 화면 공통 헤더. 모든 탭이 같은 높이·제목 위치를 쓰도록 해
 * 하단 탭을 오갈 때 레이아웃이 흔들리지 않게 한다.
 */
export function AppHeader({ title, actions }: { title: ReactNode; actions?: ReactNode }) {
  const [state, setState] = useState<"closed" | "open" | "closing">("closed");
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const open = state !== "closed";

  // 닫을 때는 슬라이드 아웃 애니메이션이 끝난 뒤 언마운트
  const close = useCallback(() => {
    setState("closing");
    clearTimeout(timer.current);
    timer.current = setTimeout(() => setState("closed"), 200);
  }, []);
  useEffect(() => () => clearTimeout(timer.current), []);

  return (
    <>
      <header className="sticky top-0 z-20 flex h-14 shrink-0 items-center gap-1 bg-white/95 pl-5 pr-2 backdrop-blur">
        <div className="flex min-w-0 flex-1 items-center gap-2 text-[20px] font-bold text-ink">{title}</div>
        {actions}
        <button
          type="button"
          onClick={() => setState("open")}
          aria-label="전체 메뉴"
          aria-haspopup="dialog"
          aria-expanded={open}
          className="flex size-10 items-center justify-center rounded-full text-sub hover:bg-line"
        >
          <Menu size={23} />
        </button>
      </header>
      {open && <MenuDrawer onClose={close} closing={state === "closing"} />}
    </>
  );
}

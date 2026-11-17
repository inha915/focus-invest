"use client";

import { ChevronLeft } from "lucide-react";
import { useRouter } from "next/navigation";
import type { ReactNode } from "react";

interface TopBarProps {
  title?: ReactNode;
  back?: boolean;
  right?: ReactNode;
}

export function TopBar({ title, back, right }: TopBarProps) {
  const router = useRouter();
  const goBack = () => {
    if (window.history.length > 1) router.back();
    else router.push("/");
  };

  return (
    <header className="sticky top-0 z-20 flex h-14 items-center gap-1 bg-white/95 px-3 backdrop-blur">
      {back && (
        <button
          type="button"
          onClick={goBack}
          aria-label="뒤로 가기"
          className="-ml-1 flex size-10 items-center justify-center rounded-full text-ink hover:bg-line"
        >
          <ChevronLeft size={26} />
        </button>
      )}
      <div className={`min-w-0 flex-1 truncate ${back ? "" : "pl-2"}`}>{title}</div>
      {right}
    </header>
  );
}

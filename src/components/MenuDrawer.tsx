"use client";

import {
  Bell,
  ChevronRight,
  FileText,
  Headphones,
  Heart,
  LogOut,
  Megaphone,
  MessagesSquare,
  Search,
  Settings,
  Sparkles,
  UserRound,
  X,
  type LucideIcon,
} from "lucide-react";
import Link from "next/link";
import { useEffect, useRef } from "react";

import { useToast } from "@/components/Toast";
import { useRecentStocks } from "@/hooks/useRecentStocks";
import { useWatchlist } from "@/hooks/useWatchlist";
import { useMyPosts } from "@/lib/community/store";
import { APP_VERSION, DEMO_PROFILE } from "@/lib/profile";
import { findStock } from "@/lib/stocks";

type Item =
  | { label: string; icon: LucideIcon; href: string; badge?: string }
  | { label: string; icon: LucideIcon; soon: true };

const SECTIONS: { title: string; items: Item[] }[] = [
  {
    title: "투자",
    items: [
      { label: "관심 종목", icon: Heart, href: "/watchlist" },
      { label: "종목 검색", icon: Search, href: "/search" },
      { label: "커뮤니티", icon: MessagesSquare, href: "/community", badge: "NEW" },
      { label: "AI 데모 채팅", icon: Sparkles, href: "/ai", badge: "데모" },
    ],
  },
  {
    title: "설정",
    items: [
      { label: "내 정보", icon: UserRound, href: "/me" },
      { label: "알림 설정", icon: Bell, href: "/me#notifications" },
      { label: "앱 설정", icon: Settings, href: "/me#app" },
    ],
  },
  {
    title: "고객지원",
    items: [
      { label: "공지사항", icon: Megaphone, soon: true },
      { label: "고객센터", icon: Headphones, soon: true },
      { label: "이용약관 및 개인정보 처리방침", icon: FileText, soon: true },
    ],
  },
];

export function MenuDrawer({ onClose, closing = false }: { onClose: () => void; closing?: boolean }) {
  const { codes: watch } = useWatchlist();
  const { codes: recent } = useRecentStocks();
  const myPosts = useMyPosts();
  const { toast, showToast } = useToast();
  const panelRef = useRef<HTMLDivElement>(null);

  // ESC로 닫기, 열린 동안 배경 스크롤 잠금, 패널로 포커스 이동
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    panelRef.current?.focus();
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-50 flex justify-center">
      <div className="relative h-full w-full max-w-[480px] overflow-hidden">
        <button
          type="button"
          aria-label="메뉴 닫기"
          onClick={onClose}
          className={`absolute inset-0 bg-black/40 ${closing ? "fade-out" : "fade-in"}`}
        />
        <div
          ref={panelRef}
          role="dialog"
          aria-modal="true"
          aria-label="전체 메뉴"
          tabIndex={-1}
          className={`${closing ? "drawer-out" : "drawer-in"} absolute inset-y-0 right-0 flex w-[86%] max-w-[380px] flex-col overflow-y-auto bg-white shadow-[-8px_0_32px_rgba(0,0,0,0.08)] outline-none`}
        >
          <div className="flex h-14 shrink-0 items-center justify-between pl-5 pr-2">
            <p className="text-[18px] font-bold text-ink">전체</p>
            <button
              type="button"
              onClick={onClose}
              aria-label="닫기"
              className="flex size-10 items-center justify-center rounded-full text-sub hover:bg-line"
            >
              <X size={22} />
            </button>
          </div>

          {/* 프로필 */}
          <Link
            href="/me"
            transitionTypes={["nav-forward"]}
            onClick={onClose}
            className="mx-4 flex items-center gap-3 rounded-2xl bg-surface p-4 hover:bg-line"
            data-testid="drawer-profile"
          >
            <Avatar name={DEMO_PROFILE.nickname} />
            <div className="min-w-0 flex-1">
              <p className="flex items-center gap-1.5 text-[16px] font-bold text-ink">
                {DEMO_PROFILE.nickname}님
                <span className="rounded-md bg-brand-soft px-1.5 py-0.5 text-[11px] font-semibold text-brand-strong">
                  데모 계정
                </span>
              </p>
              <p className="mt-0.5 truncate text-[13px] text-muted">{DEMO_PROFILE.email}</p>
            </div>
            <ChevronRight size={18} className="text-faint" />
          </Link>

          {/* 내 활동 */}
          <dl className="mx-4 mt-3 grid grid-cols-3 rounded-2xl border border-line py-3 text-center">
            <Stat label="관심 종목" value={watch.length} />
            <Stat label="최근 본 종목" value={recent.length} border />
            <Stat label="작성한 글" value={myPosts.length} />
          </dl>

          {/* 최근 본 종목 */}
          <section className="mt-6 px-5">
            <h2 className="text-[13px] font-semibold text-muted">최근 본 종목</h2>
            {recent.length === 0 ? (
              <p className="mt-2 text-[14px] text-faint">아직 본 종목이 없어요.</p>
            ) : (
              <ul className="-mx-1 mt-2 flex gap-2 overflow-x-auto px-1 pb-1">
                {recent.map((code) => (
                  <li key={code} className="shrink-0">
                    <Link
                      href={`/stocks/${code}`}
                      transitionTypes={["nav-forward"]}
                      onClick={onClose}
                      className="inline-flex rounded-full bg-line px-3 py-1.5 text-[13px] font-medium text-ink hover:bg-[#e5e8eb]"
                    >
                      {findStock(code)?.name}
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </section>

          {SECTIONS.map((section) => (
            <section key={section.title} className="mt-6">
              <h2 className="px-5 text-[13px] font-semibold text-muted">{section.title}</h2>
              <ul className="mt-1">
                {section.items.map((item) => {
                  const inner = (
                    <>
                      <item.icon size={20} className="text-sub" />
                      <span className="flex-1 text-left">{item.label}</span>
                      {"badge" in item && item.badge && (
                        <span className="rounded-md bg-line px-1.5 py-0.5 text-[11px] font-semibold text-sub">
                          {item.badge}
                        </span>
                      )}
                      <ChevronRight size={18} className="text-faint" />
                    </>
                  );
                  const cls =
                    "flex w-full items-center gap-3 px-5 py-3.5 text-[15px] font-medium text-ink hover:bg-surface";
                  return (
                    <li key={item.label}>
                      {"href" in item ? (
                        <Link href={item.href} transitionTypes={["nav-forward"]} onClick={onClose} className={cls}>
                          {inner}
                        </Link>
                      ) : (
                        <button type="button" className={cls} onClick={() => showToast("데모 버전에서는 준비 중이에요")}>
                          {inner}
                        </button>
                      )}
                    </li>
                  );
                })}
              </ul>
            </section>
          ))}

          <div className="mt-auto flex items-center justify-between border-t border-line px-5 py-4">
            <p className="text-[12px] text-faint">Focus v{APP_VERSION} · 데모 버전</p>
            <button
              type="button"
              onClick={() => showToast("데모 계정은 로그아웃할 수 없어요")}
              className="inline-flex items-center gap-1 text-[13px] font-medium text-muted hover:text-sub"
            >
              <LogOut size={14} />
              로그아웃
            </button>
          </div>
        </div>
      </div>
      {toast}
    </div>
  );
}

function Stat({ label, value, border }: { label: string; value: number; border?: boolean }) {
  return (
    <div className={border ? "border-x border-line" : undefined}>
      <dd className="num text-[18px] font-bold text-ink">{value}</dd>
      <dt className="mt-0.5 whitespace-nowrap text-[11px] text-muted min-[360px]:text-[12px]">{label}</dt>
    </div>
  );
}

export function Avatar({ name, size = 48 }: { name: string; size?: number }) {
  return (
    <span
      aria-hidden="true"
      style={{ width: size, height: size, fontSize: size * 0.4 }}
      className="flex shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-[#4f9bff] to-[#1b64da] font-bold text-white"
    >
      {name.slice(0, 1)}
    </span>
  );
}

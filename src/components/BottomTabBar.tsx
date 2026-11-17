"use client";

import { Heart, House, Search, Sparkles, type LucideIcon } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Suspense } from "react";

const TABS: { href: string; label: string; icon: LucideIcon; match: (p: string) => boolean }[] = [
  { href: "/", label: "홈", icon: House, match: (p) => p === "/" || p.startsWith("/stocks") || p.startsWith("/community") },
  { href: "/search", label: "검색", icon: Search, match: (p) => p.startsWith("/search") },
  { href: "/watchlist", label: "관심", icon: Heart, match: (p) => p.startsWith("/watchlist") },
  { href: "/ai", label: "AI", icon: Sparkles, match: (p) => p.startsWith("/ai") },
];

export function BottomTabBar() {
  // usePathname은 요청 시점 값이므로 Suspense로 감싸고, 활성 표시 없는 같은 모양을 fallback으로 둔다
  return (
    <Suspense fallback={<TabBarView pathname={null} />}>
      <ActiveTabBar />
    </Suspense>
  );
}

function ActiveTabBar() {
  return <TabBarView pathname={usePathname()} />;
}

function TabBarView({ pathname }: { pathname: string | null }) {
  return (
    <nav
      aria-label="주요 메뉴"
      style={{ viewTransitionName: "tab-bar" }}
      className="pb-safe safe-x fixed inset-x-0 bottom-0 z-30 mx-auto w-full max-w-[480px] border-t border-line bg-white/95 backdrop-blur"
    >
      <ul className="grid h-[64px] grid-cols-4">
        {TABS.map(({ href, label, icon: Icon, match }) => {
          const active = pathname !== null && match(pathname);
          return (
            <li key={href}>
              <Link
                href={href}
                aria-current={active ? "page" : undefined}
                className={`flex h-full flex-col items-center justify-center gap-1 text-[11px] font-semibold transition-colors ${
                  active ? "text-ink" : "text-faint hover:text-sub"
                }`}
              >
                <Icon
                  size={22}
                  strokeWidth={active ? 2.4 : 2}
                  className={active ? "text-brand" : undefined}
                  fill={active && label === "관심" ? "currentColor" : "none"}
                />
                {label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

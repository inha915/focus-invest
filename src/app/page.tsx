import { Search } from "lucide-react";
import Link from "next/link";

import { AppHeader } from "@/components/AppHeader";
import { CommunityHighlights } from "@/components/CommunityHighlights";
import { Logo } from "@/components/Logo";
import { PageTransition } from "@/components/PageTransition";
import { QuoteList } from "@/components/QuoteList";
import { STOCK_CODES } from "@/lib/stocks";

export default function HomePage() {
  return (
    <PageTransition>
      <AppHeader
        title={
          <>
            <h1 className="sr-only">홈</h1>
            <Logo />
          </>
        }
        actions={
          <Link
            href="/search"
            aria-label="종목 검색"
            className="flex size-10 items-center justify-center rounded-full text-sub hover:bg-line"
          >
            <Search size={22} />
          </Link>
        }
      />
      <section className="px-5 pb-2 pt-3">
        <h2 className="text-[22px] font-bold leading-snug text-ink">주요 종목</h2>
        <p className="mt-1 text-[14px] text-muted">현재가와 전일 대비 등락률을 한눈에 확인하세요</p>
      </section>
      <QuoteList codes={STOCK_CODES} />
      <CommunityHighlights />
    </PageTransition>
  );
}

import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";

import { PageTransition } from "@/components/PageTransition";
import { findStock, STOCKS } from "@/lib/stocks";
import { StockDetailView } from "./StockDetailView";

/** 지원 종목은 빌드 시 미리 렌더링한다 */
export function generateStaticParams() {
  return STOCKS.map((s) => ({ code: s.code }));
}

export async function generateMetadata({ params }: PageProps<"/stocks/[code]">): Promise<Metadata> {
  const { code } = await params;
  const stock = findStock(code);
  return { title: stock ? `${stock.name} ${stock.code}` : "종목 없음" };
}

async function StockContent({ params }: Pick<PageProps<"/stocks/[code]">, "params">) {
  const { code } = await params;
  const stock = findStock(code);
  if (!stock) notFound();
  return <StockDetailView code={stock.code} name={stock.name} market={stock.market} />;
}

export default function StockPage({ params }: PageProps<"/stocks/[code]">) {
  return (
    <PageTransition>
      <Suspense fallback={null}>
        <StockContent params={params} />
      </Suspense>
    </PageTransition>
  );
}

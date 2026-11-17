import type { Metadata } from "next";

import { PageTransition } from "@/components/PageTransition";

import { WatchlistView } from "./WatchlistView";

export const metadata: Metadata = { title: "관심 종목" };

export default function WatchlistPage() {
  return (
    <PageTransition>
      <WatchlistView />
    </PageTransition>
  );
}

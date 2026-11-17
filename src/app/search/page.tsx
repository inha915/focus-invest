import type { Metadata } from "next";

import { PageTransition } from "@/components/PageTransition";

import { SearchView } from "./SearchView";

export const metadata: Metadata = { title: "검색" };

export default function SearchPage() {
  return (
    <PageTransition>
      <SearchView />
    </PageTransition>
  );
}

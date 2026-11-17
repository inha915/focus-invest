import type { Metadata } from "next";

import { PageTransition } from "@/components/PageTransition";

import { MeView } from "./MeView";

export const metadata: Metadata = { title: "내 정보" };

export default function MePage() {
  return (
    <PageTransition>
      <MeView />
    </PageTransition>
  );
}

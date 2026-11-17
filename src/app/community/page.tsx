import type { Metadata } from "next";

import { CommunityPanel } from "@/components/CommunityPanel";
import { PageTransition } from "@/components/PageTransition";
import { TopBar } from "@/components/TopBar";

export const metadata: Metadata = { title: "커뮤니티" };

export default function CommunityPage() {
  return (
    <PageTransition>
      <TopBar back title={<h1 className="text-[17px] font-bold text-ink">커뮤니티</h1>} />
      <CommunityPanel />
    </PageTransition>
  );
}

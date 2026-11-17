import type { Metadata } from "next";
import { Suspense } from "react";

import { PageTransition } from "@/components/PageTransition";

import { ChatView } from "./ChatView";

export const metadata: Metadata = { title: "AI 데모 채팅" };

export default function AiPage() {
  return (
    <PageTransition>
      <Suspense fallback={null}>
        <ChatView />
      </Suspense>
    </PageTransition>
  );
}

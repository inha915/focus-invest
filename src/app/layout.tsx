import type { Metadata, Viewport } from "next";

import { BottomTabBar } from "@/components/BottomTabBar";
import "./globals.css";

export const metadata: Metadata = {
  title: { default: "Focus — 국내 주식 리서치", template: "%s · Focus" },
  description: "시세 조회, 기간별 차트, 관심 종목, AI 데모 채팅을 담은 모바일 중심 국내 주식 리서치 앱",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#ffffff",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="ko">
      <head>
        {/* Pretendard 웹폰트 (dynamic subset) */}
        <link
          rel="stylesheet"
          href="https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/variable/pretendardvariable-dynamic-subset.min.css"
        />
      </head>
      <body className="antialiased">
        {/* 모바일: 전체 폭 / 데스크톱: 가운데 정렬된 앱 컬럼에서 같은 동선 사용 */}
        <div className="safe-x relative mx-auto flex min-h-dvh w-full max-w-[480px] flex-col bg-white sm:shadow-[0_0_0_1px_rgba(0,0,0,0.04),0_8px_40px_rgba(0,0,0,0.06)]">
          <main className="flex flex-1 flex-col pb-[calc(72px+env(safe-area-inset-bottom))]">
            {children}
          </main>
          <BottomTabBar />
        </div>
      </body>
    </html>
  );
}

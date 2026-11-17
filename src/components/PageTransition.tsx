import { ViewTransition, type ReactNode } from "react";

/**
 * 페이지 전환 모션. 각 page.tsx를 감싼다 (레이아웃은 유지되므로 enter/exit가 일어나지 않음).
 * - nav-forward: 목록 → 상세처럼 안으로 들어갈 때 오른쪽에서 밀려 들어옴
 * - nav-back:    바깥으로 나올 때 왼쪽에서 들어옴
 * - 그 외(하단 탭, 브라우저 뒤로가기 등): 살짝 떠오르는 페이드
 * 애니메이션 정의는 globals.css의 ::view-transition-* 규칙.
 */
export function PageTransition({ children }: { children: ReactNode }) {
  const map = { "nav-forward": "nav-forward", "nav-back": "nav-back", default: "fade-through" };
  return (
    <ViewTransition enter={map} exit={map} default="none">
      <div className="flex flex-1 flex-col">{children}</div>
    </ViewTransition>
  );
}

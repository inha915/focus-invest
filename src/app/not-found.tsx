import { SearchX } from "lucide-react";
import Link from "next/link";

import { EmptyState } from "@/components/StateViews";

export default function NotFound() {
  return (
    <EmptyState
      icon={SearchX}
      title="페이지를 찾을 수 없어요"
      description="지원하지 않는 종목이거나 잘못된 주소예요."
      action={
        <Link href="/" className="inline-flex rounded-xl bg-brand px-5 py-3 text-[15px] font-semibold text-white">
          홈으로
        </Link>
      }
    />
  );
}

import { AlertCircle, RotateCw, type LucideIcon } from "lucide-react";
import type { ReactNode } from "react";

export function LoadingRows({ count = 5 }: { count?: number }) {
  return (
    <ul aria-busy="true" aria-label="불러오는 중" className="px-5">
      {Array.from({ length: count }, (_, i) => (
        <li key={i} className="flex items-center justify-between py-4">
          <div className="space-y-2">
            <div className="skeleton h-4 w-24" />
            <div className="skeleton h-3 w-32" />
          </div>
          <div className="flex flex-col items-end space-y-2">
            <div className="skeleton h-4 w-20" />
            <div className="skeleton h-3 w-14" />
          </div>
        </li>
      ))}
    </ul>
  );
}

export function ErrorState({
  message,
  onRetry,
  compact,
}: {
  message: string;
  onRetry: () => void;
  compact?: boolean;
}) {
  return (
    <div
      role="alert"
      className={`flex flex-col items-center px-6 text-center ${compact ? "py-8" : "py-14"}`}
    >
      <AlertCircle size={36} className="text-faint" />
      <p className="mt-3 text-[15px] font-semibold text-ink">시세를 불러오지 못했어요</p>
      <p className="mt-1 max-w-[300px] text-[13px] leading-relaxed text-muted">{message}</p>
      <button
        type="button"
        onClick={onRetry}
        className="mt-4 inline-flex items-center gap-1.5 rounded-xl bg-brand-soft px-4 py-2.5 text-[14px] font-semibold text-brand-strong hover:bg-[#dbeaff]"
      >
        <RotateCw size={15} />
        다시 시도
      </button>
    </div>
  );
}

export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
}: {
  icon: LucideIcon;
  title: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex flex-col items-center px-6 py-16 text-center">
      <div className="flex size-14 items-center justify-center rounded-full bg-line">
        <Icon size={26} className="text-faint" />
      </div>
      <p className="mt-4 text-[16px] font-bold text-ink">{title}</p>
      {description && <p className="mt-1.5 text-[14px] leading-relaxed text-muted">{description}</p>}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}

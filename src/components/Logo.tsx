/** Focus 자체 로고: 뷰파인더 모서리 + 초점 링 */
export function LogoMark({ size = 28 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" aria-hidden="true">
      <rect width="32" height="32" rx="9" fill="#3182F6" />
      <path
        d="M8 12.5V10a2 2 0 0 1 2-2h2.5M19.5 8H22a2 2 0 0 1 2 2v2.5M24 19.5V22a2 2 0 0 1-2 2h-2.5M12.5 24H10a2 2 0 0 1-2-2v-2.5"
        stroke="#fff"
        strokeWidth="2"
        strokeLinecap="round"
        fill="none"
      />
      <circle cx="16" cy="16" r="4.2" stroke="#fff" strokeWidth="2" fill="none" />
      <circle cx="16" cy="16" r="1.4" fill="#fff" />
    </svg>
  );
}

export function Logo() {
  return (
    <span className="inline-flex items-center gap-2">
      <LogoMark />
      <span className="text-[19px] font-extrabold tracking-tight text-ink">Focus</span>
    </span>
  );
}

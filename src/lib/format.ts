export type Direction = "up" | "down" | "flat";

/** 화면용 마이너스 기호 (U+2212) */
export const MINUS = "−";

export function directionOf(value: number): Direction {
  if (value > 0) return "up";
  if (value < 0) return "down";
  return "flat";
}

/** 상승 빨강 / 하락 파랑 / 보합 회색 */
export function directionClass(dir: Direction): string {
  return dir === "up" ? "text-up" : dir === "down" ? "text-down" : "text-muted";
}

const intFormatter = new Intl.NumberFormat("ko-KR");
const oneDecimal = new Intl.NumberFormat("ko-KR", { minimumFractionDigits: 1, maximumFractionDigits: 1 });

export function formatNumber(value: number): string {
  return intFormatter.format(Math.round(value));
}

export function formatPrice(value: number): string {
  return `${formatNumber(value)}원`;
}

function sign(value: number): string {
  if (value > 0) return "+";
  if (value < 0) return MINUS;
  return "";
}

/** +1,200 / −1,200 / 0 */
export function formatSignedNumber(value: number): string {
  return `${sign(value)}${formatNumber(Math.abs(value))}`;
}

/** +1.71% / −0.52% / 0.00% */
export function formatSignedRate(value: number): string {
  return `${sign(value)}${Math.abs(value).toFixed(2)}%`;
}

/** 거래량 축약: 1.2억주, 345.6만주, 9,876주 */
export function formatVolume(value: number): string {
  if (value >= 100_000_000) return `${oneDecimal.format(value / 100_000_000)}억주`;
  if (value >= 10_000) return `${oneDecimal.format(value / 10_000)}만주`;
  return `${formatNumber(value)}주`;
}

/** YYYY-MM-DD → 2026.11.13 */
export function formatDate(date: string): string {
  return date.replaceAll("-", ".");
}

/** YYYY-MM-DD → 11.13 */
export function formatShortDate(date: string): string {
  return date.slice(5).replace("-", ".");
}

/** ISO 시각 → 한국 시간 기준 "11.17 14:03" */
export function formatKstTime(iso: string): string {
  const d = new Date(iso);
  const parts = new Intl.DateTimeFormat("ko-KR", {
    timeZone: "Asia/Seoul",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).formatToParts(d);
  const get = (t: string) => parts.find((p) => p.type === t)?.value ?? "";
  return `${get("month")}.${get("day")} ${get("hour")}:${get("minute")}`;
}

/** 상대 시각: 방금 전 / 12분 전 / 3시간 전 / 4일 전 / 11.02 */
export function formatRelativeTime(iso: string, now = Date.now()): string {
  const diff = Math.max(0, now - Date.parse(iso));
  const min = Math.floor(diff / 60_000);
  if (min < 1) return "방금 전";
  if (min < 60) return `${min}분 전`;
  const hours = Math.floor(min / 60);
  if (hours < 24) return `${hours}시간 전`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}일 전`;
  return formatShortDate(new Date(Date.parse(iso) + 9 * 3_600_000).toISOString().slice(0, 10));
}

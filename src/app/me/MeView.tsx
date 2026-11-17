"use client";

import { ChevronRight, ShieldCheck } from "lucide-react";
import Link from "next/link";
import type { ReactNode } from "react";

import { Avatar } from "@/components/MenuDrawer";
import { useToast } from "@/components/Toast";
import { TopBar } from "@/components/TopBar";
import { useApi } from "@/hooks/useApi";
import { useRecentStocks } from "@/hooks/useRecentStocks";
import { useWatchlist } from "@/hooks/useWatchlist";
import { readLocal, useLocalValue, writeLocal } from "@/lib/client/local-store";
import { clearCommunityData, useMyPosts } from "@/lib/community/store";
import { formatDate, formatRelativeTime } from "@/lib/format";
import { APP_VERSION, DEMO_PROFILE } from "@/lib/profile";
import { findStock } from "@/lib/stocks";

/* 알림 설정: 데모지만 실제로 localStorage에 저장된다 */
const NOTI_KEY = "focus:settings:notifications";
const NOTI_ITEMS = [
  { id: "watchMove", label: "관심 종목 등락 알림", desc: "관심 종목이 하루 3% 이상 움직이면 알려드려요" },
  { id: "community", label: "커뮤니티 반응 알림", desc: "내 글에 좋아요나 댓글이 달리면 알려드려요" },
  { id: "notice", label: "공지사항 · 이벤트", desc: "서비스 소식과 업데이트를 알려드려요" },
] as const;
type NotiId = (typeof NOTI_ITEMS)[number]["id"];
type NotiSettings = Record<NotiId, boolean>;
const NOTI_DEFAULT: NotiSettings = { watchMove: true, community: true, notice: false };
function sanitizeNoti(v: unknown): NotiSettings {
  if (!v || typeof v !== "object") return NOTI_DEFAULT;
  const o = v as Record<string, unknown>;
  return {
    watchMove: typeof o.watchMove === "boolean" ? o.watchMove : NOTI_DEFAULT.watchMove,
    community: typeof o.community === "boolean" ? o.community : NOTI_DEFAULT.community,
    notice: typeof o.notice === "boolean" ? o.notice : NOTI_DEFAULT.notice,
  };
}

interface StatusResponse {
  source: "mock" | "kis";
  sourceLabel: string;
  kisEnv: string | null;
  kisConfigured: boolean;
}

export function MeView() {
  const { codes: watch, clear: clearWatch } = useWatchlist();
  const { codes: recent, clear: clearRecent } = useRecentStocks();
  const myPosts = useMyPosts();
  const noti = useLocalValue(NOTI_KEY, sanitizeNoti, NOTI_DEFAULT);
  const status = useApi<StatusResponse>("/api/status");
  const { toast, showToast } = useToast();

  const toggleNoti = (id: NotiId) => {
    const next = { ...readLocal(NOTI_KEY, sanitizeNoti, NOTI_DEFAULT), [id]: !noti[id] };
    writeLocal(NOTI_KEY, next);
    showToast(next[id] ? "알림을 켰어요 (데모)" : "알림을 껐어요 (데모)");
  };

  const confirmThen = (message: string, action: () => void, done: string) => {
    if (window.confirm(message)) {
      action();
      showToast(done);
    }
  };

  return (
    <>
      <TopBar back title={<h1 className="text-[17px] font-bold text-ink">내 정보</h1>} />

      {/* 프로필 */}
      <section className="flex flex-col items-center px-5 pb-6 pt-4 text-center">
        <Avatar name={DEMO_PROFILE.nickname} size={72} />
        <p className="mt-3 text-[20px] font-bold text-ink" data-testid="profile-name">
          {DEMO_PROFILE.nickname}
        </p>
        <p className="mt-0.5 text-[14px] text-muted">{DEMO_PROFILE.email}</p>
        <p className="mt-2 inline-flex items-center gap-1 rounded-full bg-brand-soft px-2.5 py-1 text-[12px] font-semibold text-brand-strong">
          <ShieldCheck size={13} />
          데모 계정 · {formatDate(DEMO_PROFILE.joinedAt)} 가입
        </p>
        <button
          type="button"
          onClick={() => showToast("데모 버전에서는 프로필을 바꿀 수 없어요")}
          className="mt-4 rounded-xl bg-line px-4 py-2 text-[14px] font-semibold text-sub hover:bg-[#e5e8eb]"
        >
          프로필 편집
        </button>
      </section>

      {/* 내 활동 */}
      <Section title="내 활동">
        <dl className="grid grid-cols-3 rounded-2xl bg-surface py-4 text-center">
          <ActivityStat label="관심 종목" value={watch.length} href="/watchlist" />
          <ActivityStat label="최근 본 종목" value={recent.length} />
          <ActivityStat label="작성한 글" value={myPosts.length} />
        </dl>
        {myPosts.length > 0 && (
          <ul className="mt-3 divide-y divide-line rounded-2xl border border-line" data-testid="my-posts">
            {myPosts.slice(0, 3).map((p) => (
              <li key={p.id}>
                <Link href={`/stocks/${p.code}?tab=community`} transitionTypes={["nav-forward"]} className="block px-4 py-3 hover:bg-surface">
                  <p className="text-[12px] text-muted">
                    {findStock(p.code)?.name} · {p.tag} · {formatRelativeTime(p.createdAt)}
                  </p>
                  <p className="mt-0.5 line-clamp-1 text-[14px] text-ink">{p.content}</p>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </Section>

      {/* 투자 성향 */}
      <Section title="투자 성향">
        <div className="rounded-2xl bg-surface p-4">
          <div className="flex items-center justify-between">
            <p className="text-[17px] font-bold text-brand-strong">{DEMO_PROFILE.riskType}</p>
            <span className="text-[12px] text-muted">{formatDate(DEMO_PROFILE.riskCheckedAt)} 진단</span>
          </div>
          <p className="mt-1.5 text-[13px] leading-relaxed text-sub">{DEMO_PROFILE.riskDescription}</p>
          <div className="mt-3 flex flex-wrap gap-1.5">
            {DEMO_PROFILE.interests.map((t) => (
              <span key={t} className="rounded-full bg-white px-2.5 py-1 text-[12px] font-medium text-sub">
                #{t}
              </span>
            ))}
          </div>
        </div>
        <Row label="투자 성향 다시 진단하기" onClick={() => showToast("데모 버전에서는 준비 중이에요")} />
      </Section>

      {/* 알림 설정 */}
      <Section title="알림 설정" id="notifications">
        <ul>
          {NOTI_ITEMS.map((item) => (
            <li key={item.id} className="flex items-center gap-3 py-3">
              <div className="min-w-0 flex-1">
                <p className="text-[15px] font-medium text-ink">{item.label}</p>
                <p className="mt-0.5 text-[12px] text-muted">{item.desc}</p>
              </div>
              <Switch checked={noti[item.id]} onChange={() => toggleNoti(item.id)} label={item.label} />
            </li>
          ))}
        </ul>
      </Section>

      {/* 앱 설정 · 데이터 */}
      <Section title="앱 설정" id="app">
        <InfoRow label="시세 데이터">
          {status.data ? (
            <span data-testid="data-source">
              {status.data.sourceLabel}
              {status.data.kisEnv ? ` · ${status.data.kisEnv}` : ""}
            </span>
          ) : status.error ? (
            "확인 실패"
          ) : (
            "확인 중…"
          )}
        </InfoRow>
        <InfoRow label="등락 색상">
          <span className="text-up">상승 빨강</span> · <span className="text-down">하락 파랑</span>
        </InfoRow>
        <Row
          label="최근 본 종목 기록 삭제"
          onClick={() => confirmThen("최근 본 종목 기록을 지울까요?", clearRecent, "최근 본 종목 기록을 지웠어요")}
        />
        <Row
          label="관심 종목 초기화"
          onClick={() => confirmThen("관심 종목을 모두 해제할까요?", clearWatch, "관심 종목을 초기화했어요")}
        />
        <Row
          label="커뮤니티 글 · 좋아요 삭제"
          onClick={() =>
            confirmThen("이 브라우저에 저장된 내 글과 좋아요를 모두 지울까요?", clearCommunityData, "커뮤니티 데이터를 지웠어요")
          }
          danger
        />
      </Section>

      <Section title="앱 정보">
        <InfoRow label="버전">v{APP_VERSION}</InfoRow>
        <Row label="오픈소스 라이선스" onClick={() => showToast("데모 버전에서는 준비 중이에요")} />
      </Section>

      <p className="px-5 pb-8 pt-2 text-center text-[12px] leading-relaxed text-faint">
        데모 화면이에요. 표시된 프로필은 실제 계정 정보가 아니며,
        <br />
        설정과 기록은 이 브라우저에만 저장돼요.
      </p>
      {toast}
    </>
  );
}

function Section({ title, id, children }: { title: string; id?: string; children: ReactNode }) {
  return (
    <section id={id} className="scroll-mt-16 border-t-8 border-line px-5 py-5">
      <h2 className="mb-3 text-[17px] font-bold text-ink">{title}</h2>
      {children}
    </section>
  );
}

function ActivityStat({ label, value, href }: { label: string; value: number; href?: string }) {
  const body = (
    <>
      <dd className="num text-[20px] font-bold text-ink">{value}</dd>
      <dt className="mt-0.5 text-[12px] text-muted">{label}</dt>
    </>
  );
  return href ? (
    <Link href={href} className="rounded-xl hover:bg-line">
      {body}
    </Link>
  ) : (
    <div>{body}</div>
  );
}

function Row({ label, onClick, danger }: { label: string; onClick: () => void; danger?: boolean }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`-mx-5 flex w-[calc(100%+40px)] items-center justify-between px-5 py-3.5 text-left text-[15px] font-medium hover:bg-surface ${
        danger ? "text-up" : "text-ink"
      }`}
    >
      {label}
      <ChevronRight size={18} className="text-faint" />
    </button>
  );
}

function InfoRow({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="flex items-center justify-between py-3.5 text-[15px]">
      <span className="font-medium text-ink">{label}</span>
      <span className="text-right text-sub">{children}</span>
    </div>
  );
}

function Switch({ checked, onChange, label }: { checked: boolean; onChange: () => void; label: string }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      onClick={onChange}
      className={`relative h-[30px] w-[50px] shrink-0 rounded-full transition-colors ${checked ? "bg-brand" : "bg-[#d1d6db]"}`}
    >
      <span
        className={`absolute left-0 top-[3px] size-6 rounded-full bg-white shadow transition-transform ${
          checked ? "translate-x-[23px]" : "translate-x-[3px]"
        }`}
      />
    </button>
  );
}

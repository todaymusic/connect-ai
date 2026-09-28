import {
  BookOpen,
  CheckCircle2,
  CircleAlert,
  CircleDashed,
  FileMusic,
  Flag,
  FolderOpen,
  LayoutDashboard,
  Rocket,
  ShoppingBag,
  UserCog,
  Users,
  type LucideIcon,
} from "lucide-react";
import type { ReactNode } from "react";
import type { AdminSummary } from "@/lib/admin";
import { AdminBadge, Badge } from "../ui";

/* ───────── 좌측(모바일은 상단) 관리자 메뉴 — 대시보드 외에는 준비 중 ───────── */
const ADMIN_NAV: { label: string; icon: LucideIcon; ready: boolean }[] = [
  { label: "대시보드", icon: LayoutDashboard, ready: true },
  { label: "악보·정보글 등록", icon: FileMusic, ready: false },
  { label: "회원 역할 변경", icon: UserCog, ready: false },
  { label: "신고 처리", icon: Flag, ready: false },
  { label: "스토리지 관리", icon: FolderOpen, ready: false },
];

function fmt(n: number | null) {
  return n === null ? "—" : n.toLocaleString("ko-KR");
}

function StatCard({
  icon: Icon,
  title,
  value,
  unit,
  sub,
  accent,
}: {
  icon: LucideIcon;
  title: string;
  value: number | null;
  unit: string;
  sub?: ReactNode;
  accent?: boolean;
}) {
  return (
    <div className="card p-4 sm:p-5">
      <p className="flex items-center gap-2 text-sm font-semibold text-ink-2">
        <Icon aria-hidden className="size-4" />
        {title}
      </p>
      <p className="mt-3 flex items-baseline gap-1">
        <span className={`font-display text-3xl font-bold tracking-tight ${accent ? "text-coral-deep" : "text-ink"}`}>
          {fmt(value)}
        </span>
        {value !== null && <span className="text-sm text-ink-3">{unit}</span>}
      </p>
      {sub && <p className="mt-1.5 text-xs text-ink-3">{sub}</p>}
    </div>
  );
}

function StatusDot({ ok }: { ok: boolean | null }) {
  if (ok === true) return <CheckCircle2 aria-label="정상" className="size-4 text-blue" />;
  if (ok === false) return <CircleAlert aria-label="문제 있음" className="size-4 text-coral-deep" />;
  return <CircleDashed aria-label="확인 불가" className="size-4 text-ink-3" />;
}

const UPCOMING: { icon: LucideIcon; title: string; body: string }[] = [
  {
    icon: FileMusic,
    title: "악보·정보글 등록",
    body: "PDF 업로드, 정보글 작성·발행, 작성자(OMU 에디터/회원) 지정, CSV 일괄 등록.",
  },
  {
    icon: UserCog,
    title: "회원 역할 변경",
    body: "회원 검색 후 일반 회원 · 에디터 · 관리자 역할 지정. 추가 관리자 3명도 여기서 지정해요.",
  },
  {
    icon: Flag,
    title: "신고 처리",
    body: "신고 목록 확인, 게시물 숨김·삭제, 처리 완료·기각. 익명 글은 실제 작성자 확인 가능.",
  },
  {
    icon: FolderOpen,
    title: "스토리지 관리",
    body: "악보 PDF·썸네일·중고 사진 버킷 사용량 확인과 연결 끊긴 파일 정리.",
  },
];

export function AdminDashboard({ summary, adminName }: { summary: AdminSummary; adminName: string | null }) {
  const { members, scores, articles, market, reports, storage, deploy } = summary;
  const isMock = summary.source === "mock";

  return (
    <div className="mx-auto max-w-[1120px] px-4 py-8 sm:px-6 sm:py-12">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <AdminBadge label="관리자" />
            {isMock && <Badge tone="coral">미리보기 · 목데이터</Badge>}
          </div>
          <h1 className="mt-2 text-2xl font-extrabold tracking-tight text-ink sm:text-3xl">관리자 대시보드</h1>
          <p className="mt-1 text-sm text-ink-2">
            {adminName ? `${adminName} 님, ` : ""}OMU 운영 현황을 한눈에 확인해요.
          </p>
        </div>
      </div>

      {isMock && (
        <p className="mt-5 rounded-xl border border-coral-soft bg-coral-soft/30 px-4 py-3 text-sm leading-relaxed text-ink-2">
          Supabase가 연결되지 않은 개발용 미리보기예요. 숫자는 모두 예시 값이고, 운영 배포에서는 이 화면 대신 로그인·권한
          확인이 먼저 이뤄져요.
        </p>
      )}
      {summary.warnings.map((w) => (
        <p key={w} className="mt-3 rounded-xl bg-stone px-4 py-3 text-sm text-ink-2">
          {w}
        </p>
      ))}

      <div className="mt-6 grid grid-cols-[minmax(0,1fr)] gap-6 lg:grid-cols-[200px_minmax(0,1fr)]">
        {/* 관리자 메뉴 */}
        <nav aria-label="관리자 메뉴" className="min-w-0">
          <ul className="scrollbar-none -mx-4 flex gap-1.5 overflow-x-auto px-4 lg:mx-0 lg:flex-col lg:px-0">
            {ADMIN_NAV.map((item) => (
              <li key={item.label} className="shrink-0">
                <span
                  aria-current={item.ready ? "page" : undefined}
                  aria-disabled={!item.ready || undefined}
                  className={`flex items-center gap-2 whitespace-nowrap rounded-xl px-3 py-2.5 text-sm font-semibold ${
                    item.ready ? "bg-ink text-paper" : "text-ink-3"
                  }`}
                >
                  <item.icon aria-hidden className="size-4" />
                  {item.label}
                  {!item.ready && (
                    <span className="rounded-full bg-stone px-1.5 py-px text-[10px] font-bold text-ink-3">준비 중</span>
                  )}
                </span>
              </li>
            ))}
          </ul>
        </nav>

        <div className="min-w-0 space-y-8">
          {/* 요약 카드 */}
          <section aria-labelledby="summary-title">
            <h2 id="summary-title" className="sr-only">
              운영 요약
            </h2>
            <div className="grid grid-cols-2 gap-2.5 sm:gap-3 xl:grid-cols-3">
              <StatCard
                icon={Users}
                title="회원"
                value={members.total}
                unit="명"
                sub={`관리자 ${fmt(members.admins)} · 에디터 ${fmt(members.editors)}`}
              />
              <StatCard icon={FileMusic} title="악보" value={scores.total} unit="개" sub="무료 배포 중" />
              <StatCard
                icon={BookOpen}
                title="정보글"
                value={articles.published}
                unit="편 발행"
                sub={`발행 대기 ${fmt(articles.drafts)}편`}
              />
              <StatCard
                icon={ShoppingBag}
                title="중고 장터"
                value={market.selling}
                unit="건 판매중"
                sub={`전체 매물 ${fmt(market.total)}건`}
              />
              <StatCard
                icon={Flag}
                title="미처리 신고"
                value={reports.open}
                unit="건"
                accent={(reports.open ?? 0) > 0}
                sub={(reports.open ?? 0) > 0 ? "신고 처리 기능 오픈 후 확인할 수 있어요" : "처리할 신고가 없어요"}
              />

              {/* 스토리지 */}
              <div className="card col-span-2 p-4 sm:p-5 xl:col-span-1">
                <p className="flex items-center gap-2 text-sm font-semibold text-ink-2">
                  <FolderOpen aria-hidden className="size-4" />
                  스토리지
                </p>
                <ul className="mt-3 space-y-2">
                  {storage.map((b) => (
                    <li key={b.id} className="flex items-center justify-between gap-2 text-sm">
                      <span className="flex items-center gap-1.5">
                        <StatusDot ok={b.ok} />
                        <span className="font-semibold text-ink">{b.label}</span>
                        <span className="font-display text-xs text-ink-3">{b.id}</span>
                      </span>
                      <span className="font-display text-xs text-ink-2">
                        {b.files === null ? "—" : `${b.files >= 100 ? "100+" : b.files}개`}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </section>

          {/* 배포 상태 */}
          <section aria-labelledby="deploy-title" className="card p-4 sm:p-5">
            <h2 id="deploy-title" className="flex items-center gap-2 text-sm font-semibold text-ink-2">
              <Rocket aria-hidden className="size-4" />
              배포 상태
            </h2>
            <dl className="mt-3 grid gap-x-6 gap-y-2.5 text-sm sm:grid-cols-2">
              <Row label="환경" value={deploy.environment} />
              <Row label="커밋" value={deploy.commit ? `${deploy.commit}${deploy.branch ? ` (${deploy.branch})` : ""}` : "—"} />
              <Row label="사이트 주소" value={deploy.siteUrl ?? "NEXT_PUBLIC_SITE_URL 미설정"} />
              <Row label="Supabase 연결" ok={deploy.supabase} value={deploy.supabase ? "연결됨" : "환경변수 없음"} />
              <Row label="카카오 로그인" ok={deploy.kakao && deploy.supabase} value={deploy.kakao ? "켜짐" : "꺼짐"} />
              <Row
                label="네이버 로그인"
                ok={deploy.naver && deploy.supabase}
                value={deploy.naver ? "켜짐 (커스텀 Provider)" : "준비 중"}
              />
            </dl>
          </section>

          {/* 예정 기능 */}
          <section aria-labelledby="upcoming-title">
            <h2 id="upcoming-title" className="text-lg font-extrabold text-ink">
              곧 추가될 관리 기능
            </h2>
            <ul className="mt-3 grid gap-2.5 sm:grid-cols-2">
              {UPCOMING.map((u) => (
                <li key={u.title} className="card p-4 sm:p-5">
                  <p className="flex items-center justify-between gap-2">
                    <span className="flex items-center gap-2 text-[15px] font-bold text-ink">
                      <u.icon aria-hidden className="size-4 text-ink-2" />
                      {u.title}
                    </span>
                    <span className="rounded-full bg-stone px-2 py-0.5 text-[11px] font-bold text-ink-3">준비 중</span>
                  </p>
                  <p className="mt-2 text-sm leading-relaxed text-ink-2">{u.body}</p>
                </li>
              ))}
            </ul>
          </section>
        </div>
      </div>
    </div>
  );
}

function Row({ label, value, ok }: { label: string; value: string; ok?: boolean }) {
  return (
    <div className="flex items-center justify-between gap-3 border-b border-line pb-2">
      <dt className="shrink-0 text-ink-3">{label}</dt>
      <dd className="flex min-w-0 items-center gap-1.5 font-semibold text-ink">
        {ok !== undefined && <StatusDot ok={ok} />}
        <span className="truncate">{value}</span>
      </dd>
    </div>
  );
}

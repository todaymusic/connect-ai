import {
  BookOpen,
  CheckCircle2,
  CircleAlert,
  CircleDashed,
  FileMusic,
  Flag,
  FolderOpen,
  ImageIcon,
  Rocket,
  ShoppingBag,
  UserCog,
  UserRound,
  Users,
  type LucideIcon,
} from "lucide-react";
import Link from "next/link";
import type { ReactNode } from "react";
import type { AdminSummary } from "@/lib/admin";
import { AdminBadge, Badge } from "../ui";
import { AdminNav } from "./AdminNav";

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
          Supabase가 연결되지 않은 미리보기예요. 화면 구성만 보여 주고 실제 수치는 없어요(—). Supabase를 연결하면 관리자에게만
          실제 숫자가 보여요.
        </p>
      )}
      {summary.warnings.map((w) => (
        <p key={w} className="mt-3 rounded-xl bg-stone px-4 py-3 text-sm text-ink-2">
          {w}
        </p>
      ))}

      <div className="mt-6 grid grid-cols-[minmax(0,1fr)] gap-6 lg:grid-cols-[200px_minmax(0,1fr)]">
        {/* 관리자 메뉴 */}
        <AdminNav active="dashboard" openReports={reports.open} />

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
                sub={
                  <Link href="/admin/reports" className="font-semibold text-ink-2 underline underline-offset-2 hover:text-ink">
                    {(reports.open ?? 0) > 0 ? "신고 처리하러 가기 →" : "신고 목록 보기 →"}
                  </Link>
                }
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

          {/* 비회원 글·댓글 + 장터 사진 */}
          <section aria-labelledby="guest-title" className="grid gap-3 sm:grid-cols-2">
            <div className="card p-4 sm:p-5">
              <h2 id="guest-title" className="flex items-center gap-2 text-sm font-semibold text-ink-2">
                <UserRound aria-hidden className="size-4" />
                비회원 글·댓글 모더레이션
              </h2>
              <p className="mt-3 flex items-baseline gap-3 text-sm text-ink-2">
                <span>
                  글 <strong className="font-display text-xl text-ink">{fmt(summary.guest.posts)}</strong>
                </span>
                <span>
                  댓글 <strong className="font-display text-xl text-ink">{fmt(summary.guest.comments)}</strong>
                </span>
              </p>
              <ul className="mt-3 space-y-1.5 text-xs leading-relaxed text-ink-2">
                <li>· 비회원은 커뮤니티 글·댓글·신고만 쓸 수 있고, 이름은 ‘새벽 기타리스트’처럼 자동으로 붙어요.</li>
                <li>· 도배는 DB 가 막아요: 글 30초·댓글 10초 간격, 시간당 한도, 전체 비회원 폭주 차단.</li>
                <li>· 문제 글은 신고 목록에서 ‘대상 숨기기’로 바로 내려요. 작성자가 지운 글은 숨김 상태로 남아 관리자만 볼 수 있어요.</li>
                <li>· 비회원 글은 검색엔진에 노출하지 않아요(noindex).</li>
              </ul>
            </div>
            <div className="card p-4 sm:p-5">
              <h2 className="flex items-center gap-2 text-sm font-semibold text-ink-2">
                <ImageIcon aria-hidden className="size-4" />
                장터 사진 (market 버킷)
              </h2>
              {(() => {
                const b = storage.find((x) => x.id === "market");
                return (
                  <p className="mt-3 flex items-center gap-2 text-sm">
                    <StatusDot ok={b?.ok ?? null} />
                    <span className="font-semibold text-ink">{b?.ok ? "사용 가능" : b?.ok === false ? "버킷 없음·접근 불가" : "확인 불가"}</span>
                    <span className="font-display text-xs text-ink-3">{b?.files === null || b?.files === undefined ? "" : `폴더 ${b.files >= 100 ? "100+" : b.files}개`}</span>
                  </p>
                );
              })()}
              <ul className="mt-3 space-y-1.5 text-xs leading-relaxed text-ink-2">
                <li>· 회원만 올릴 수 있어요. 경로는 market/회원uid/파일 — 본인 폴더에만 올라가요.</li>
                <li>· JPG·PNG·WEBP·GIF, 한 장 10MB, 글 하나에 6장까지.</li>
                <li>· 글 저장이 실패하면 올라간 사진이 남을 수 있어요. 스토리지 관리 화면(준비 중)에서 정리할 예정이에요.</li>
              </ul>
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

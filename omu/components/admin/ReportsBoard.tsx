import Link from "next/link";
import { ExternalLink } from "lucide-react";
import type { AdminReport, ReportStatus } from "@/lib/admin";
import { formatDateTime, formatRelative } from "@/lib/format";
import { REPORT_REASONS } from "@/lib/write/validate";
import { AdminBadge, Badge } from "../ui";
import { AdminNav } from "./AdminNav";
import { LocalDemoReports, ReportRowActions } from "./ReportActions";

export const TARGET_LABEL: Record<string, string> = {
  post: "커뮤니티 글",
  comment: "댓글",
  market: "장터 매물",
  recruit: "모집글",
  score: "악보",
  article: "정보글",
  score_request: "악보 요청",
};
const DONE_TEXT: Record<string, string> = {
  resolved: "처리 완료로 바꿨어요.",
  dismissed: "기각했어요.",
  hidden: "대상을 숨기고 같은 대상의 신고를 모두 처리 완료로 바꿨어요.",
};
const STATUS_LABEL: Record<ReportStatus | "all", string> = { open: "미처리", resolved: "처리 완료", dismissed: "기각", all: "전체" };

export function ReportsBoard({
  items,
  error,
  status,
  openCount,
  preview,
  done,
}: {
  done?: string | null;
  items: AdminReport[];
  error: string | null;
  status: ReportStatus | "all";
  openCount: number;
  preview: boolean;
}) {
  return (
    <div className="mx-auto max-w-[1120px] px-4 py-8 sm:px-6 sm:py-12">
      <div className="flex items-center gap-2">
        <AdminBadge label="관리자" />
        {preview && <Badge tone="coral">미리보기 · 목데이터</Badge>}
      </div>
      <h1 className="mt-2 text-2xl font-extrabold tracking-tight text-ink sm:text-3xl">신고 처리</h1>
      <p className="mt-1 text-sm text-ink-2">신고된 글·댓글을 확인하고 처리 완료·기각하거나, 대상을 바로 숨길 수 있어요.</p>

      <div className="mt-6 grid grid-cols-[minmax(0,1fr)] gap-6 lg:grid-cols-[200px_minmax(0,1fr)]">
        <AdminNav active="reports" openReports={openCount} />
        <div className="min-w-0">
          <nav aria-label="처리 상태" className="scrollbar-none -mx-4 flex gap-1.5 overflow-x-auto px-4 sm:mx-0 sm:px-0">
            {(Object.keys(STATUS_LABEL) as (ReportStatus | "all")[]).map((s) => (
              <Link
                key={s}
                href={s === "open" ? "/admin/reports" : `/admin/reports?status=${s}`}
                aria-current={s === status ? "page" : undefined}
                className={`shrink-0 rounded-full border px-3.5 py-1.5 text-sm font-semibold ${
                  s === status ? "border-ink bg-ink text-paper" : "border-line-2 bg-card text-ink-2 hover:border-ink-3"
                }`}
              >
                {STATUS_LABEL[s]}
                {s === "open" && <span className="ml-1 font-display">{openCount}</span>}
              </Link>
            ))}
          </nav>

          {done && DONE_TEXT[done] && (
            <p role="status" className="mt-4 rounded-xl bg-blue-soft/50 px-4 py-3 text-sm font-semibold text-ink">
              {DONE_TEXT[done]}
            </p>
          )}
          {preview && (
            <p className="mt-4 rounded-xl border border-coral-soft bg-coral-soft/30 px-4 py-3 text-sm leading-relaxed text-ink-2">
              Supabase 가 연결되지 않은 미리보기예요. 서버에 쌓인 신고는 없고, 이 브라우저에서 데모로 보낸 신고만 아래에 따로 보여요.
            </p>
          )}
          {error && <p className="mt-4 rounded-xl bg-stone px-4 py-3 text-sm text-ink-2">{error}</p>}

          {items.length === 0 && !error ? (
            <p className="mt-4 rounded-2xl bg-stone px-4 py-8 text-center text-sm text-ink-2">{STATUS_LABEL[status]} 신고가 없어요.</p>
          ) : (
            <ul className="mt-4 space-y-2.5">
              {items.map((r) => (
                <li key={r.id} className="card p-4">
                  <ReportSummary r={r} />
                  {r.status === "open" ? (
                    <ReportRowActions id={r.id} status={status} canHide={["post", "comment", "market", "recruit"].includes(r.targetType)} />
                  ) : (
                    <p className="mt-2 text-xs text-ink-3">
                      {STATUS_LABEL[r.status]} {r.resolvedAt ? `· ${formatDateTime(r.resolvedAt)}` : ""}
                    </p>
                  )}
                </li>
              ))}
            </ul>
          )}

          {preview && <LocalDemoReports />}
        </div>
      </div>
    </div>
  );
}

export function ReportSummary({ r }: { r: Pick<AdminReport, "targetType" | "reason" | "detail" | "reporter" | "title" | "path" | "createdAt" | "status"> }) {
  return (
    <>
      <div className="flex flex-wrap items-center gap-1.5">
        <Badge tone={r.status === "open" ? "coral" : "neutral"}>{REPORT_REASONS[r.reason as keyof typeof REPORT_REASONS] ?? r.reason}</Badge>
        <Badge tone="outline">{TARGET_LABEL[r.targetType] ?? r.targetType}</Badge>
        <span className="text-xs text-ink-3">
          {r.reporter === "guest" ? "비회원 신고" : "회원 신고"} ·{" "}
          <time dateTime={r.createdAt} title={formatDateTime(r.createdAt)}>
            {formatRelative(r.createdAt)}
          </time>
        </span>
      </div>
      {r.path ? (
        <Link href={r.path} className="mt-2 flex items-center gap-1 text-[15px] font-bold text-ink hover:underline">
          <span className="truncate">{r.title || "(제목 없음)"}</span>
          <ExternalLink aria-hidden className="size-3.5 shrink-0 text-ink-3" />
        </Link>
      ) : (
        <p className="mt-2 truncate text-[15px] font-bold text-ink">{r.title || "(대상 정보 없음)"}</p>
      )}
      {r.detail && <p className="mt-1 whitespace-pre-line break-words text-sm text-ink-2">{r.detail}</p>}
    </>
  );
}

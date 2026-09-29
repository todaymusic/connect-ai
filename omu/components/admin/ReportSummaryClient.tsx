"use client";

import Link from "next/link";
import { ExternalLink } from "lucide-react";
import type { LocalReport } from "@/lib/interact/local";
import { formatRelative } from "@/lib/format";
import { REPORT_REASONS } from "@/lib/write/validate";
import { Badge } from "../ui";

const TARGET_LABEL: Record<string, string> = { post: "커뮤니티 글", comment: "댓글", market: "장터 매물", recruit: "모집글", score: "악보", article: "정보글" };

/** 데모 신고 요약 (브라우저 보관분) */
export function ReportSummaryClient({ r }: { r: LocalReport }) {
  return (
    <>
      <div className="flex flex-wrap items-center gap-1.5">
        <Badge tone={r.status === "open" ? "coral" : "neutral"}>{REPORT_REASONS[r.reason as keyof typeof REPORT_REASONS] ?? r.reason}</Badge>
        <Badge tone="outline">{TARGET_LABEL[r.targetType] ?? r.targetType}</Badge>
        <span className="text-xs text-ink-3">
          {r.reporter === "guest" ? "비회원 신고" : "회원 신고"} · <time suppressHydrationWarning>{formatRelative(r.createdAt)}</time>
        </span>
      </div>
      <Link href={r.path} className="mt-2 flex items-center gap-1 text-[15px] font-bold text-ink hover:underline">
        <span className="truncate">{r.title || "(제목 없음)"}</span>
        <ExternalLink aria-hidden className="size-3.5 shrink-0 text-ink-3" />
      </Link>
      {r.detail && <p className="mt-1 whitespace-pre-line break-words text-sm text-ink-2">{r.detail}</p>}
    </>
  );
}

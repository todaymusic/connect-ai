import Link from "next/link";
import type { Metadata } from "next";
import { CheckCircle2 } from "lucide-react";
import { AuthorLabel } from "@/components/detail/AuthorLabel";
import { CategoryTabs, EmptyState, ListHeader, ListShell } from "@/components/list/ListLayout";
import { Badge } from "@/components/ui";
import { listScoreRequests } from "@/lib/data/scores";
import { formatRelative } from "@/lib/format";
import { SCORE_INSTRUMENTS, type ScoreInstrument } from "@/lib/site";

export const metadata: Metadata = {
  title: "악보 요청 게시판",
  description: "찾는 곡의 악보를 요청해 주세요. 악보를 올릴 때 참고합니다.",
  alternates: { canonical: "/score/requests" },
};

export const revalidate = 120;

export default async function ScoreRequestsPage() {
  const requests = await listScoreRequests();
  return (
    <ListShell>
      <ListHeader
        eyebrow="Requests"
        title="악보 요청"
        description="“이 곡 악보 있나요?” 찾는 곡을 남겨 주시면 악보를 올릴 때 참고할게요."
        writeHref="/write/score-request"
        writeLabel="악보 요청하기"
      />
      <CategoryTabs
        label="과목"
        current="requests"
        items={[
          { key: "all", href: "/score", label: "전체" },
          ...(Object.keys(SCORE_INSTRUMENTS) as ScoreInstrument[]).map((k) => ({ key: k, href: `/score/${k}`, label: SCORE_INSTRUMENTS[k] })),
          { key: "requests", href: "/score/requests", label: "악보 요청" },
        ]}
      />
      {requests.length === 0 ? (
        <div className="mt-6">
          <EmptyState title="아직 요청이 없어요">찾는 곡이 있다면 첫 요청을 남겨 주세요. 요청은 로그인한 회원만 남길 수 있어요.</EmptyState>
        </div>
      ) : (
        <ul className="mt-6 divide-y divide-line overflow-hidden rounded-2xl border border-line bg-card">
          {requests.map((r) => (
            <li key={r.id} className="flex items-start gap-3 px-4 py-4">
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-1.5">
                  <Badge>{SCORE_INSTRUMENTS[r.instrument]}</Badge>
                  {r.status === "fulfilled" ? (
                    <Badge tone="blue">
                      <CheckCircle2 aria-hidden className="size-3" />
                      등록 완료
                    </Badge>
                  ) : (
                    <Badge tone="outline">요청 중</Badge>
                  )}
                </div>
                <p className="mt-1.5 text-[15px] font-semibold text-ink">{r.songTitle}</p>
                {r.description && <p className="mt-1 text-sm text-ink-2">{r.description}</p>}
                <p className="mt-1.5 flex flex-wrap items-center gap-2 text-xs text-ink-3">
                  <AuthorLabel author={r.author} />
                  <span>{formatRelative(r.createdAt)}</span>
                </p>
              </div>
              {r.fulfilledScoreSlug && (
                <Link
                  href={`/score/${r.instrument}/${r.fulfilledScoreSlug}`}
                  className="shrink-0 rounded-full border border-line-2 px-3 py-1.5 text-xs font-bold text-ink hover:border-ink-3"
                >
                  악보 보기
                </Link>
              )}
            </li>
          ))}
        </ul>
      )}
    </ListShell>
  );
}

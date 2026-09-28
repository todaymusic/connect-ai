import Link from "next/link";
import type { ReactNode } from "react";
import { ArrowRight, Eye, MessageCircle, Pin } from "lucide-react";
import type { MockPost } from "@/lib/mock";
import { COMMUNITY_CATEGORIES, QNA_SUBJECTS } from "@/lib/site";
import { AdminBadge, Badge, formatCount } from "../ui";

function BoardCard({ title, href, children }: { title: string; href: string; children: ReactNode }) {
  return (
    <div className="card flex flex-col p-4 sm:p-5">
      <div className="mb-2 flex items-center justify-between">
        <h3 className="text-base font-extrabold text-ink">{title}</h3>
        <Link href={href} className="group inline-flex items-center gap-1 text-xs font-semibold text-ink-3 hover:text-ink">
          더보기
          <ArrowRight aria-hidden className="size-3.5 transition-transform group-hover:translate-x-0.5" />
        </Link>
      </div>
      {children}
    </div>
  );
}

export function CommunityBoards({ questions, popular }: { questions: MockPost[]; popular: MockPost[] }) {
  return (
    <div className="grid gap-3 lg:grid-cols-2">
      <BoardCard title="답변 기다리는 질문" href="/community/qna">
        <ul className="divide-y divide-line">
          {questions.map((q) => (
            <li key={q.id}>
              <Link href={`/community/qna/${q.id}`} className="group flex items-start gap-3 py-3">
                <Badge tone="blue" className="mt-0.5">
                  {q.qnaSubject ? QNA_SUBJECTS[q.qnaSubject] : "Q&A"}
                </Badge>
                <span className="min-w-0 flex-1">
                  <span className="line-clamp-1 text-sm font-semibold text-ink group-hover:text-coral-deep">{q.title}</span>
                  <span className="mt-0.5 block text-xs text-ink-3">
                    {q.authorName} · {q.timeAgo}
                  </span>
                </span>
                <span
                  className={`font-display shrink-0 rounded-full px-2 py-0.5 text-[11px] font-bold ${
                    q.comments === 0 ? "bg-coral-soft text-coral-deep" : "bg-stone text-ink-2"
                  }`}
                >
                  답변 {q.comments}
                </span>
              </Link>
            </li>
          ))}
        </ul>
        <p className="mt-auto pt-3 text-xs text-ink-3">질문자가 답변을 채택하면 ‘해결됨’으로 표시돼요.</p>
      </BoardCard>

      <BoardCard title="인기 커뮤니티 글" href="/community">
        <ol className="divide-y divide-line">
          {popular.map((p, i) => (
            <li key={p.id}>
              <Link href={`/community/${p.category}/${p.id}`} className="group flex items-start gap-3 py-3">
                <span
                  className={`font-display w-5 shrink-0 pt-px text-center text-base font-bold ${
                    p.isNotice ? "text-ink-3" : i <= 2 ? "text-coral-deep" : "text-ink-3"
                  }`}
                >
                  {p.isNotice ? <Pin aria-label="고정 공지" className="mx-auto mt-0.5 size-4" /> : i}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="flex items-center gap-1.5">
                    {p.isNotice && <Badge tone="coral">공지</Badge>}
                    <span className="line-clamp-1 text-sm font-semibold text-ink group-hover:text-coral-deep">{p.title}</span>
                  </span>
                  <span className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-ink-3">
                    {p.isNotice ? <AdminBadge /> : <span className="font-semibold text-ink-2">{p.isAnonymous ? "익명" : p.authorName}</span>}
                    <span>{COMMUNITY_CATEGORIES[p.category]}</span>
                    <span className="font-display inline-flex items-center gap-1">
                      <Eye aria-hidden className="size-3" />
                      {formatCount(p.views)}
                    </span>
                    <span className="font-display inline-flex items-center gap-1">
                      <MessageCircle aria-hidden className="size-3" />
                      {p.comments}
                    </span>
                  </span>
                </span>
              </Link>
            </li>
          ))}
        </ol>
      </BoardCard>
    </div>
  );
}

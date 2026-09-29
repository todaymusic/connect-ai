import Link from "next/link";
import { ArrowRight } from "lucide-react";
import type { ReactNode } from "react";
import type { Post } from "@/lib/data/types";
import { PostRow } from "../cards/PostRow";

function BoardCard({ title, href, children, footer }: { title: string; href: string; children: ReactNode; footer?: string }) {
  return (
    <div className="card flex flex-col overflow-hidden">
      <div className="flex items-center justify-between px-4 pb-1 pt-4 sm:px-5">
        <h3 className="text-base font-extrabold text-ink">{title}</h3>
        <Link href={href} className="group inline-flex items-center gap-1 text-xs font-semibold text-ink-3 hover:text-ink">
          더보기
          <ArrowRight aria-hidden className="size-3.5 transition-transform group-hover:translate-x-0.5" />
        </Link>
      </div>
      {children}
      {footer && <p className="mt-auto px-4 pb-4 pt-2 text-xs text-ink-3 sm:px-5">{footer}</p>}
    </div>
  );
}

export function CommunityBoards({ questions, popular }: { questions: Post[]; popular: Post[] }) {
  return (
    <div className="grid gap-3 lg:grid-cols-2">
      <BoardCard title="답변 기다리는 질문" href="/community/qna?status=open" footer="질문자가 답변을 채택하면 ‘해결됨’으로 표시돼요.">
        {questions.length === 0 ? (
          <p className="px-5 py-6 text-sm text-ink-3">지금은 답변을 기다리는 질문이 없어요.</p>
        ) : (
          <ul className="divide-y divide-line">
            {questions.map((q) => (
              <li key={q.id}>
                <PostRow post={q} />
              </li>
            ))}
          </ul>
        )}
      </BoardCard>
      <BoardCard title="인기 커뮤니티 글" href="/community?sort=popular">
        <ul className="divide-y divide-line">
          {popular.map((p) => (
            <li key={p.id}>
              <PostRow post={p} showCategory />
            </li>
          ))}
        </ul>
      </BoardCard>
    </div>
  );
}

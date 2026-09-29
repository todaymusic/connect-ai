import Link from "next/link";
import { CheckCircle2, Eye, MessageCircle, Pin } from "lucide-react";
import type { Post } from "@/lib/data/types";
import { formatCount, formatRelative } from "@/lib/format";
import { COMMUNITY_CATEGORIES, QNA_SUBJECTS } from "@/lib/site";
import { AuthorLabel } from "../detail/AuthorLabel";
import { Badge } from "../ui";

/** 커뮤니티 목록 한 줄 */
export function PostRow({ post: p, showCategory = false }: { post: Post; showCategory?: boolean }) {
  return (
    <Link href={`/community/${p.category}/${p.id}`} className="group flex items-start gap-3 px-4 py-3.5 transition-colors hover:bg-paper">
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-1.5">
          {p.isNotice && (
            <Badge tone="coral">
              <Pin aria-hidden className="size-3" />
              공지
            </Badge>
          )}
          {showCategory && <Badge tone="neutral">{COMMUNITY_CATEGORIES[p.category]}</Badge>}
          {p.qnaSubject && <Badge tone="blue">{QNA_SUBJECTS[p.qnaSubject]}</Badge>}
          {p.category === "qna" &&
            (p.isAnswered ? (
              <Badge tone="outline">
                <CheckCircle2 aria-hidden className="size-3 text-blue" />
                해결됨
              </Badge>
            ) : (
              <Badge tone="coral">답변 대기</Badge>
            ))}
        </div>
        <h3 className="mt-1 line-clamp-1 text-[15px] font-semibold text-ink group-hover:text-coral-deep">{p.title}</h3>
        <p className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-ink-3">
          <AuthorLabel author={p.author} display={p.authorDisplay} anonymous={p.isAnonymous} />
          <span>{formatRelative(p.createdAt)}</span>
          <span className="font-display inline-flex items-center gap-1">
            <Eye aria-hidden className="size-3" />
            <span className="sr-only">조회수</span>
            {formatCount(p.views)}
          </span>
        </p>
      </div>
      <span
        className={`font-display mt-1 inline-flex shrink-0 items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-bold ${
          p.category === "qna" && p.commentCount === 0 ? "bg-coral-soft text-coral-deep" : "bg-stone text-ink-2"
        }`}
      >
        <MessageCircle aria-hidden className="size-3" />
        <span className="sr-only">댓글</span>
        {p.commentCount}
      </span>
    </Link>
  );
}

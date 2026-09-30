import Link from "next/link";
import { BookOpen, Clock, Eye, Play } from "lucide-react";
import type { Article } from "@/lib/data/types";
import { formatCount } from "@/lib/format";
import { ARTICLE_CATEGORIES, articlePath } from "@/lib/site";
import { AuthorLabel } from "../detail/AuthorLabel";
import { Badge } from "../ui";

const COVER_TONE: Record<string, string> = {
  beginner: "from-blue-soft to-paper",
  exam: "from-stone to-paper",
  contest: "from-coral-soft/60 to-paper",
  venue: "from-stone to-paper",
  story: "from-pro-soft to-paper",
  equipment: "from-stone to-paper",
  instrument: "from-blue-soft to-paper",
};

export function ArticleCard({ article: a, headingLevel = "h3" }: { article: Article; headingLevel?: "h2" | "h3" }) {
  const H = headingLevel;
  return (
    <Link href={articlePath(a.category, a.slug)} className="card group flex h-full flex-col overflow-hidden">
      <div className={`relative flex aspect-[5/2] items-center justify-center bg-linear-to-br md:aspect-[16/9] ${COVER_TONE[a.category]}`}>
        {a.youtubeUrl ? (
          <span className="flex size-12 items-center justify-center rounded-full bg-card text-coral shadow-[var(--shadow-card)]">
            <Play aria-hidden className="size-5 translate-x-0.5 fill-current" />
          </span>
        ) : (
          <BookOpen aria-hidden className="size-9 text-ink/20" />
        )}
        <Badge tone="neutral" className="absolute left-3 top-3 bg-card/90">
          {ARTICLE_CATEGORIES[a.category]}
        </Badge>
      </div>
      <div className="flex flex-1 flex-col p-4 sm:p-5">
        <H className="line-clamp-2 text-base font-bold leading-snug text-ink group-hover:text-coral-deep">{a.title}</H>
        <p className="mt-1.5 line-clamp-2 text-sm leading-relaxed text-ink-2">{a.summary}</p>
        <div className="mt-auto flex items-center justify-between gap-2 pt-4 text-xs text-ink-3">
          <AuthorLabel author={a.author} display={a.authorDisplay} unknownLabel="회원" />
          <span className="font-display flex shrink-0 items-center gap-2.5">
            {/* 조회수는 실제로 쌓인 뒤에만 보여 준다(0 은 숨김) */}
            {a.views > 0 && (
              <span className="inline-flex items-center gap-1">
                <Eye aria-hidden className="size-3.5" />
                <span className="sr-only">조회수</span>
                {formatCount(a.views)}
              </span>
            )}
            <span className="inline-flex items-center gap-1">
              <Clock aria-hidden className="size-3.5" />
              {a.readMinutes}분
            </span>
          </span>
        </div>
      </div>
    </Link>
  );
}

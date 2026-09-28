import Link from "next/link";
import { BookOpen, Clock, Eye, Play } from "lucide-react";
import type { MockArticle } from "@/lib/mock";
import { ARTICLE_CATEGORIES, articlePath } from "@/lib/site";
import { Badge, EditorBadge, formatCount } from "../ui";

const COVER_TONE: Record<string, string> = {
  beginner: "from-blue-soft to-paper",
  exam: "from-stone to-paper",
  contest: "from-coral-soft/60 to-paper",
  venue: "from-stone to-paper",
  story: "from-pro-soft to-paper",
  equipment: "from-stone to-paper",
  instrument: "from-blue-soft to-paper",
};

export function LatestInfo({ articles }: { articles: MockArticle[] }) {
  return (
    <ul className="grid gap-3 md:grid-cols-3">
      {articles.map((a) => (
        <li key={a.id}>
          <Link href={articlePath(a.category, a.slug)} className="card group flex h-full flex-col overflow-hidden">
            <div className={`relative flex aspect-[5/2] md:aspect-[16/9] items-center justify-center bg-linear-to-br ${COVER_TONE[a.category]}`}>
              {a.hasVideo ? (
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
              <h3 className="line-clamp-2 text-base font-bold leading-snug text-ink group-hover:text-coral-deep">{a.title}</h3>
              <p className="mt-1.5 line-clamp-2 text-sm leading-relaxed text-ink-2">{a.summary}</p>
              <div className="mt-auto flex items-center justify-between gap-2 pt-4 text-xs text-ink-3">
                {a.authorDisplay === "editor" ? (
                  <EditorBadge />
                ) : (
                  <span className="truncate font-semibold text-ink-2">{a.authorName}</span>
                )}
                <span className="font-display flex shrink-0 items-center gap-2.5">
                  <span className="inline-flex items-center gap-1">
                    <Eye aria-hidden className="size-3.5" />
                    {formatCount(a.views)}
                  </span>
                  <span className="inline-flex items-center gap-1">
                    <Clock aria-hidden className="size-3.5" />
                    {a.readMinutes}분
                  </span>
                </span>
              </div>
            </div>
          </Link>
        </li>
      ))}
    </ul>
  );
}

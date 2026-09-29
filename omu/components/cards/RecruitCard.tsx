import Link from "next/link";
import { CalendarClock, Globe, MapPin } from "lucide-react";
import type { Recruit } from "@/lib/data/types";
import { daysUntil, formatRelative } from "@/lib/format";
import { RECRUIT_CATEGORIES } from "@/lib/site";
import { Badge, LevelBadge } from "../ui";

export function DeadlineBadge({ recruit: r }: { recruit: Pick<Recruit, "isClosed" | "deadline"> }) {
  if (r.isClosed) return <Badge tone="neutral">모집 마감</Badge>;
  if (!r.deadline) return <Badge tone="outline">상시 모집</Badge>;
  const d = daysUntil(r.deadline);
  if (d < 0) return <Badge tone="neutral">기간 종료</Badge>;
  return <Badge tone={d <= 3 ? "coral" : "outline"}>{d === 0 ? "오늘 마감" : `D-${d}`}</Badge>;
}

export function RecruitCard({ recruit: r, showCategory = false }: { recruit: Recruit; showCategory?: boolean }) {
  const online = r.region === "온라인";
  return (
    <Link href={`/recruit/${r.category}/${r.id}`} className={`card group flex items-start gap-3 p-4 ${r.isClosed ? "opacity-70" : ""}`}>
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-1.5">
          {r.level && <LevelBadge level={r.level} />}
          {showCategory && <Badge tone="neutral">{RECRUIT_CATEGORIES[r.category]}</Badge>}
          <DeadlineBadge recruit={r} />
          {r.genre && <span className="text-xs text-ink-3">{r.genre}</span>}
        </div>
        <h3 className="mt-1.5 line-clamp-1 text-[15px] font-bold text-ink group-hover:text-coral-deep">{r.title}</h3>
        <div className="mt-2 flex flex-wrap items-center gap-1.5 text-xs text-ink-2">
          <span className="inline-flex items-center gap-0.5 text-ink-3">
            {online ? <Globe aria-hidden className="size-3.5" /> : <MapPin aria-hidden className="size-3.5" />}
            {r.region}
          </span>
          {r.positions.map((p) => (
            <span key={p} className="rounded-full border border-line px-2 py-0.5">
              {p}
            </span>
          ))}
        </div>
      </div>
      <span className="flex shrink-0 items-center gap-1 pt-0.5 text-xs text-ink-3">
        <CalendarClock aria-hidden className="hidden size-3.5 sm:block" />
        {formatRelative(r.createdAt)}
      </span>
    </Link>
  );
}
